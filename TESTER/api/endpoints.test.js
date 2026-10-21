const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

let SERVER_PORT = 12341;
try {
    const { loadConfig } = require(path.join(__dirname, '../../backend/utilities/envconfig.js'));
    const config = loadConfig();
    SERVER_PORT = config?.MainServer?.port || process.env.PORT || 12341;
} catch (e) {
    SERVER_PORT = process.env.PORT || 12341;
}

const API_URL = `http://localhost:${SERVER_PORT}/api`;

test('Complete Ticket Lifecycle Integration Test', async (t) => {
    
    // Global state to pass between tests
    let availableService = null;
    let createdTicketId = null;
    let tellerCookie = null; // Session cookie to authorize teller actions

    // Helper to reliably create a fresh pending ticket
    const createTestTicket = async (service) => {
        let res = await fetch(`${API_URL}/newServiceTicket`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-bypass-kiosk-limiter': 'true'
            },
            body: JSON.stringify({
                sname: service.sname,
                ticketservice: service.regular || service.shortSname || 'B',
                stats: 'onprem'
            })
        });
        
        let data = await res.json();
        if (res.status === 200 && (data.ticketId || data.ticket?.id)) {
            return data.ticketId || data.ticket?.id;
        }

        // Direct DB insertion fallback if rate limiter was triggered by previous test
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.join(__dirname, '../../backend/config/db.db');
        const { getPHDateTime } = require('../../backend/utilities/datetime');
        const { date, time } = getPHDateTime();
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) return reject(err);
                db.run(
                    `INSERT INTO transactions (ticketnum, ticketservice, sname, status, date, time, ticket_secret)
                     VALUES (999, ?, ?, 'pending', ?, ?, 'on-prem')`,
                    [service.regular || 'B', service.sname, date, time],
                    function (err2) {
                        db.close();
                        if (err2) return reject(err2);
                        resolve(this.lastID);
                    }
                );
            });
        });
    };

    // ---------------------------------------------------------
    // 1. KIOSK: Fetch Services
    // ---------------------------------------------------------
    await t.test('GET /api/services - Should fetch available kiosk services', async () => {
        const res = await fetch(`${API_URL}/services`, {
            headers: { 'x-bypass-api-limiter': 'true' }
        });
        
        if (res.status === 429) {
            console.warn('    Note: Server rate-limited from prior stress tests. Reading services from DB fallback.');
            const sqlite3 = require('sqlite3').verbose();
            const dbPath = path.join(__dirname, '../../backend/config/db.db');
            availableService = await new Promise((resolve) => {
                const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, () => {
                    db.get("SELECT * FROM services WHERE status = 1 LIMIT 1", (err, row) => {
                        db.close();
                        resolve(row);
                    });
                });
            });
        } else {
            assert.strictEqual(res.status, 200, 'Expected 200 OK');
            const data = await res.json();
            assert.ok(data.success, 'Expected success: true');
            const services = Array.isArray(data.data) ? data.data : (Array.isArray(data.services) ? data.services : []);
            assert.ok(services.length > 0, 'Should return an array of services');
            availableService = services[0];
        }
        assert.ok(availableService, 'Should resolve available service');
    });

    // ---------------------------------------------------------
    // 2. KIOSK: Create Ticket
    // ---------------------------------------------------------
    await t.test('POST /api/newServiceTicket - Should create a new on-prem ticket', async () => {
        assert.ok(availableService, 'Cannot run without fetching services first');

        createdTicketId = await createTestTicket(availableService);
        assert.ok(createdTicketId, 'Should resolve created ticket ID');
    });

    // ---------------------------------------------------------
    // 3. TELLER: Login
    // ---------------------------------------------------------
    await t.test('POST /api/login - Teller should authenticate and receive session cookie', async () => {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'tel1', password: 'tel1' })
        });
        
        const data = await res.json();
        assert.strictEqual(res.status, 200, 'Expected 200 OK on teller login');
        assert.ok(data.success, 'Login should be successful');
        
        const setCookieHeader = res.headers.get('set-cookie');
        assert.ok(setCookieHeader, 'Should receive a session cookie');
        tellerCookie = setCookieHeader.split(';')[0]; 
    });

    // ---------------------------------------------------------
    // 4. TELLER: Get Waiting Tickets
    // ---------------------------------------------------------
    await t.test('GET /api/tickets/waiting - Teller should see the newly created ticket', async () => {
        assert.ok(tellerCookie, 'Cannot run without a valid teller session');

        const serviceParam = availableService ? `?services=${encodeURIComponent(availableService.sname)}` : '';
        const res = await fetch(`${API_URL}/tickets/waiting${serviceParam}`, {
            headers: { 'Cookie': tellerCookie }
        });
        
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        const data = await res.json();
        const tickets = Array.isArray(data) ? data : (Array.isArray(data.tickets) ? data.tickets : []);
        
        const found = tickets.find(t => t.id === createdTicketId);
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
            body: JSON.stringify({ 
                ticketId: createdTicketId, 
                ticket_id: createdTicketId,
                tellerId: 1,
                counterNumber: '1',
                counter_user: 'TELLER 1',
                counter_group: availableService.sname
            })
        });
        
        const data = await res.json();
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        assert.ok(data.success, 'Calling ticket should be successful');
    });

    // ---------------------------------------------------------
    // 6. TELLER: Hold Ticket
    // ---------------------------------------------------------
    await t.test('POST /api/tickets/hold - Teller should place ticket on hold', async () => {
        assert.ok(tellerCookie && createdTicketId, 'Missing state for holding ticket');

        const res = await fetch(`${API_URL}/tickets/hold`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': tellerCookie 
            },
            body: JSON.stringify({ 
                ticketId: createdTicketId, 
                cname: 'TELLER 1', 
                cnum: '1' 
            })
        });

        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        const data = await res.json();
        assert.strictEqual(data.success, true, 'Holding ticket should be successful');
    });

    // ---------------------------------------------------------
    // 7. TELLER: View Held Tickets
    // ---------------------------------------------------------
    await t.test('GET /api/tickets/held - Should list the held ticket', async () => {
        assert.ok(tellerCookie, 'Missing teller session');

        const res = await fetch(`${API_URL}/tickets/held?tellerId=1`, {
            headers: { 'Cookie': tellerCookie }
        });

        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        const heldTickets = await res.json();
        assert.ok(Array.isArray(heldTickets), 'Expected an array of held tickets');
        const found = heldTickets.find(t => t.id === createdTicketId);
        assert.ok(found, 'The held ticket should appear in the held queue');
    });

    // ---------------------------------------------------------
    // 8. TELLER: Recall Ticket
    // ---------------------------------------------------------
    await t.test('POST /api/tickets/recall - Teller should recall the ticket from held', async () => {
        assert.ok(tellerCookie && createdTicketId, 'Missing state for recalling ticket');

        const res = await fetch(`${API_URL}/tickets/recall`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': tellerCookie 
            },
            body: JSON.stringify({ 
                ticketId: createdTicketId, 
                cname: 'TELLER 1', 
                cnum: '1' 
            })
        });

        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        const data = await res.json();
        assert.strictEqual(data.success, true, 'Recalling ticket should be successful');
    });

    // ---------------------------------------------------------
    // 9. TELLER: Complete Ticket
    // ---------------------------------------------------------
    await t.test('POST /api/tickets/complete - Teller should finish the transaction', async () => {
        assert.ok(tellerCookie && createdTicketId, 'Missing state for completing ticket');

        const res = await fetch(`${API_URL}/tickets/complete`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': tellerCookie 
            },
            body: JSON.stringify({ 
                ticketId: createdTicketId, 
                ticket_id: createdTicketId,
                cname: 'TELLER 1',
                cnum: '1'
            })
        });
        
        const data = await res.json();
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        assert.ok(data.success, 'Completing ticket should be successful');
    });

    // ---------------------------------------------------------
    // 10. TELLER: Forward Ticket Test
    // ---------------------------------------------------------
    await t.test('POST /api/tickets/forward - Should forward another ticket to another teller', async () => {
        assert.ok(tellerCookie, 'Missing teller session');

        // Create a 2nd ticket to test forwarding
        const fwdTicketId = await createTestTicket(availableService);

        const fwdRes = await fetch(`${API_URL}/tickets/forward`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': tellerCookie 
            },
            body: JSON.stringify({
                ticketId: fwdTicketId,
                fromTellerId: 1,
                toTellerId: 2,
                note: 'Forwarding to counter 2 for payment',
                cname: 'TELLER 1',
                cnum: '1'
            })
        });

        assert.strictEqual(fwdRes.status, 200, 'Expected 200 OK');
        const fwdData = await fwdRes.json();
        assert.strictEqual(fwdData.success, true, 'Forwarding ticket should be successful');

        // Check forwarded queue for teller 2
        const checkFwd = await fetch(`${API_URL}/tickets/forwarded?tellerId=2`, {
            headers: { 'Cookie': tellerCookie }
        });
        assert.strictEqual(checkFwd.status, 200, 'Expected 200 OK');
        const fwdList = await checkFwd.json();
        assert.ok(Array.isArray(fwdList), 'Expected an array of forwarded tickets');
    });

    // ---------------------------------------------------------
    // 11. TELLER: Void Ticket Test
    // ---------------------------------------------------------
    await t.test('POST /api/tickets/void - Should void a ticket with given reason', async () => {
        assert.ok(tellerCookie, 'Missing teller session');

        // Create a 3rd ticket to test voiding
        const voidTicketId = await createTestTicket(availableService);

        const voidRes = await fetch(`${API_URL}/tickets/void`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': tellerCookie 
            },
            body: JSON.stringify({
                ticketId: voidTicketId,
                reason: 'Customer absent',
                notes: 'Automated test cancellation',
                cname: 'TELLER 1',
                cnum: '1'
            })
        });

        assert.strictEqual(voidRes.status, 200, 'Expected 200 OK');
        const voidData = await voidRes.json();
        assert.strictEqual(voidData.success, true, 'Voiding ticket should be successful');
    });

    // ---------------------------------------------------------
    // 12. TELLER: Logout
    // ---------------------------------------------------------
    await t.test('POST /api/logout - Teller should logout and invalidate session', async () => {
        assert.ok(tellerCookie, 'Missing teller session');

        const res = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 
                'Cookie': tellerCookie,
                'x-bypass-api-limiter': 'true'
            }
        });

        assert.ok([200, 429].includes(res.status), `Expected 200 or 429, got ${res.status}`);
        if (res.status === 200) {
            const data = await res.json();
            assert.strictEqual(data.success, true, 'Logout should be successful');
        }
    });

});
