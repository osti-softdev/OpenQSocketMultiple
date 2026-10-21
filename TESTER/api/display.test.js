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

test('Display & Queue Monitor Integration Test', async (t) => {

    // 1. Fetch display service cards
    await t.test('GET /api/getServicesDisplay - Should return queue cards for display screens', async () => {
        const res = await fetch(`${API_URL}/getServicesDisplay`);
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        
        const data = await res.json();
        assert.strictEqual(data.success, true, 'Expected success: true');
        assert.ok(Array.isArray(data.services), 'Expected services array');
        assert.ok(data.services.length > 0, 'Should have at least one active display service');

        const firstService = data.services[0];
        assert.ok(firstService.sname, 'Service should have a name');
        assert.ok('ticket' in firstService, 'Service should have ticket card indicator');
    });

    // 2. Fetch currently calling tickets
    await t.test('GET /api/getCallingTickets - Should return calling tickets for TV announcements', async () => {
        const res = await fetch(`${API_URL}/getCallingTickets`);
        assert.strictEqual(res.status, 200, 'Expected 200 OK');

        const data = await res.json();
        assert.strictEqual(data.success, true, 'Expected success: true');
        assert.ok(Array.isArray(data.tickets), 'Expected tickets array');
    });

    // 3. Online Ticket check-in input validation
    await t.test('POST /api/check_ticket_in - Should validate request body', async () => {
        const res = await fetch(`${API_URL}/check_ticket_in`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-bypass-kiosk-limiter': 'true'
            },
            body: JSON.stringify({})
        });

        // 400 if missing code, 503 if online disabled, 429 if limiter active
        assert.ok([400, 429, 503].includes(res.status), `Expected 400, 429, or 503, got ${res.status}`);
        const data = await res.json();
        assert.strictEqual(data.success, false, 'Expected success: false for invalid check-in');
    });

});
