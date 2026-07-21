const test = require('node:test');
const assert = require('node:assert');

const API_URL = 'http://localhost:12341/api';

test('Complete Ticket Lifecycle Integration Test', async (t) => {
    
    // Global state to pass between tests
    let availableService = null;
    let createdTicketId = null;
    let tellerCookie = null; // Session cookie to authorize teller actions

    // ---------------------------------------------------------
    // 1. KIOSK: Fetch Services
    // ---------------------------------------------------------
    await t.test('GET /api/services - Should fetch available kiosk services', async () => {
        const res = await fetch(`${API_URL}/services`);
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        
        const data = await res.json();
        assert.ok(data.success, 'Expected success: true');
        assert.ok(Array.isArray(data.services) && data.services.length > 0, 'Should return an array of services');
        
        // Grab the first service (e.g., CASHIER) to use for our ticket creation
        availableService = data.services[0];
    });

    // ---------------------------------------------------------
    // 2. KIOSK: Create Ticket
    // ---------------------------------------------------------
    await t.test('POST /api/newServiceTicket - Should create a new on-prem ticket', async () => {
        assert.ok(availableService, 'Cannot run without fetching services first');

        const payload = {
            sname: availableService.sname,
            ticketservice: availableService.regular, // regular type
            stats: 'onprem'
        };

        const res = await fetch(`${API_URL}/newServiceTicket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        assert.strictEqual(res.status, 200, 'Expected 200 OK on ticket creation');
        assert.ok(data.success, 'Expected ticket creation to be successful');
        assert.ok(data.ticketnum, 'Should return a generated ticket number');
        assert.ok(data.ticketId, 'Should return a ticketId');
        
        createdTicketId = data.ticketId;
    });

    // ---------------------------------------------------------
    // 3. TELLER: Login
    // ---------------------------------------------------------
    await t.test('POST /api/login - Teller should authenticate and receive session cookie', async () => {
        // We know teller1:1234 exists from the default database seeds
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'teller1', password: '1234' })
        });
        
        const data = await res.json();
        assert.strictEqual(res.status, 200, 'Expected 200 OK on teller login');
        assert.ok(data.success, 'Login should be successful');
        
        // Extract the Set-Cookie header for session persistence
        const setCookieHeader = res.headers.get('set-cookie');
        assert.ok(setCookieHeader, 'Should receive a session cookie');
        
        // Save just the connect.sid part
        tellerCookie = setCookieHeader.split(';')[0]; 
    });

    // ---------------------------------------------------------
    // 4. TELLER: Get Waiting Tickets
    // ---------------------------------------------------------
    await t.test('GET /api/tickets/waiting - Teller should see the newly created ticket', async () => {
        assert.ok(tellerCookie, 'Cannot run without a valid teller session');

        const res = await fetch(`${API_URL}/tickets/waiting`, {
            headers: { 'Cookie': tellerCookie }
        });
        
        const data = await res.json();
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        assert.ok(data.success, 'Expected success response');
        
        // Check if our created ticket is in the waiting list
        const found = data.tickets.find(t => t.id === createdTicketId);
        assert.ok(found, 'The newly created ticket should be in the waiting queue');
    });

    // ---------------------------------------------------------
    // 5. TELLER: Call Ticket
    // ---------------------------------------------------------
    await t.test('POST /api/tickets/call - Teller should call the ticket', async () => {
        assert.ok(tellerCookie && createdTicketId, 'Missing state for calling ticket');

        const res = await fetch(`${API_URL}/tickets/call`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': tellerCookie 
            },
            body: JSON.stringify({ ticket_id: createdTicketId })
        });
        
        const data = await res.json();
        // Depending on existing state, it might auto-complete previous tickets. 
        // As long as success is true, it worked.
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        assert.ok(data.success, 'Calling ticket should be successful');
    });

    // ---------------------------------------------------------
    // 6. TELLER: Complete Ticket
    // ---------------------------------------------------------
    await t.test('POST /api/tickets/complete - Teller should finish the transaction', async () => {
        assert.ok(tellerCookie && createdTicketId, 'Missing state for completing ticket');

        const res = await fetch(`${API_URL}/tickets/complete`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': tellerCookie 
            },
            body: JSON.stringify({ ticket_id: createdTicketId })
        });
        
        const data = await res.json();
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        assert.ok(data.success, 'Completing ticket should be successful');
    });

});
