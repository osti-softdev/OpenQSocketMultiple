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

test('Admin API & Dashboard Integration Test', async (t) => {
    let adminCookie = null;

    // 1. Invalid Login Test
    await t.test('POST /api/loginAdmin - Should reject invalid credentials with 401', async () => {
        const res = await fetch(`${API_URL}/loginAdmin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
        });

        assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized for wrong password');
        const data = await res.json();
        assert.strictEqual(data.success, false, 'Expected success: false');
    });

    // 2. Successful Admin Login
    await t.test('POST /api/loginAdmin - Should authenticate admin and return session cookie', async () => {
        const res = await fetch(`${API_URL}/loginAdmin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin' })
        });

        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        const data = await res.json();
        assert.strictEqual(data.success, true, 'Expected success: true');
        assert.ok(data.admin, 'Expected admin object in response');
        assert.strictEqual(data.admin.role, 'superadmin', 'Expected superadmin role');

        const setCookieHeader = res.headers.get('set-cookie');
        assert.ok(setCookieHeader, 'Should receive session cookie');
        adminCookie = setCookieHeader.split(';')[0];
    });

    // 3. Verify Admin Session
    await t.test('GET /api/check-session-admin - Should confirm active session', async () => {
        assert.ok(adminCookie, 'Missing admin session cookie');

        const res = await fetch(`${API_URL}/check-session-admin`, {
            headers: { 'Cookie': adminCookie }
        });

        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        const data = await res.json();
        assert.strictEqual(data.loggedIn, true, 'Expected loggedIn: true');
        assert.strictEqual(data.admin?.username, 'admin', 'Expected username: admin');
    });

    // 4. Live Dashboard Metrics
    await t.test('GET /api/admin/dashboard/live - Should return live services and teller metrics', async () => {
        assert.ok(adminCookie, 'Missing admin session cookie');

        const res = await fetch(`${API_URL}/admin/dashboard/live`, {
            headers: { 'Cookie': adminCookie }
        });

        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        const data = await res.json();
        assert.ok(Array.isArray(data.services), 'Expected services array');
        assert.ok(Array.isArray(data.tellers), 'Expected tellers array');
        assert.ok(data.stats, 'Expected stats summary object');
    });

    // 5. Query Counter Groups
    await t.test('GET /api/groups/list - Should return counter groups', async () => {
        const res = await fetch(`${API_URL}/groups/list`);
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        const groups = await res.json();
        assert.ok(Array.isArray(groups), 'Expected array of groups');
        assert.ok(groups.length > 0, 'Should have at least one counter group');
    });

    // 6. Query Tellers List
    await t.test('GET /api/tellers/list - Should return active tellers', async () => {
        const res = await fetch(`${API_URL}/tellers/list?id=0`);
        assert.strictEqual(res.status, 200, 'Expected 200 OK');
        const tellers = await res.json();
        assert.ok(Array.isArray(tellers), 'Expected array of tellers');
        assert.ok(tellers.length > 0, 'Should have at least one teller counter');
    });

    // 7. Admin Logout
    await t.test('POST /api/logout - Should terminate session', async () => {
        assert.ok(adminCookie, 'Missing admin session cookie');

        const res = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 'Cookie': adminCookie }
        });

        assert.strictEqual(res.status, 200, 'Expected 200 OK on logout');
        const data = await res.json();
        assert.strictEqual(data.success, true, 'Expected success: true');

        // Confirm session is destroyed
        const checkRes = await fetch(`${API_URL}/check-session-admin`, {
            headers: { 'Cookie': adminCookie }
        });
        const checkData = await checkRes.json();
        assert.strictEqual(checkData.loggedIn, false, 'Session should be logged out');
    });

});
