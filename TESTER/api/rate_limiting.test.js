const test = require('node:test');
const assert = require('node:assert');

const API_URL = 'http://localhost:12341/api';

test('Rate Limiting Test Suite', async (t) => {
    
    // The kioskLimiter is configured for a max of 30 requests per minute
    const KIOSK_LIMIT = 30;
    const ATTEMPTS = KIOSK_LIMIT + 5; // We will intentionally exceed it by 5

    await t.test(`POST /api/newServiceTicket - Should block after ${KIOSK_LIMIT} attempts`, async () => {
        let successCount = 0;
        let rateLimitedCount = 0;
        
        console.log(`\n    Firing ${ATTEMPTS} rapid requests to trigger the Kiosk Rate Limiter...`);

        // Fire them sequentially or concurrently
        // We'll use a sequential loop for precise counting, but fast enough to trigger the 1-minute window
        for (let i = 1; i <= ATTEMPTS; i++) {
            const res = await fetch(`${API_URL}/newServiceTicket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sname: 'CASHIER', ticketservice: 'C', stats: 'onprem' })
            });

            if (res.status === 429) { // 429 Too Many Requests
                rateLimitedCount++;
            } else if (res.status === 200 || res.status === 400) {
                // 200 is success, 400 is bad request (but passed the limiter!)
                successCount++;
            }
        }
        
        console.log(`    Results -> Allowed: ${successCount} | Blocked (429): ${rateLimitedCount}`);
        
        assert.strictEqual(successCount, KIOSK_LIMIT, `Exactly ${KIOSK_LIMIT} requests should have been allowed through the limiter.`);
        assert.ok(rateLimitedCount >= 1, 'At least 1 request should have been blocked with a 429 Too Many Requests status.');
    });

    await t.test('NOTE on Auth and API Limiters', (t) => {
        // Just an informative test block
        console.log('\n    Note: authLimiter and apiLimiter in rateLimiter.js are currently set to heavily inflated numbers (e.g. 100,000,000,000).');
        console.log('    They are effectively disabled. If you lower their max limits in the future, you can add similar tests for them here!');
        assert.ok(true);
    });

});
