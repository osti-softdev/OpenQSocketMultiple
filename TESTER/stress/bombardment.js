/**
 * Node.js Stress & Concurrency Test Runner
 * Evaluates throughput, concurrency, and stability across Kiosk, Admin, and Teller APIs.
 * 
 * Usage:
 *   npm test stress                       # Stresses Kiosk + Admin + Teller APIs (Full System)
 *   npm test stress admin                 # Stresses Admin console & dashboard endpoints only
 *   npm test stress teller                # Stresses Teller queue & ticket endpoints only
 *   npm test stress kiosk                 # Stresses Kiosk endpoints only
 *   npm test stress all [count] [concurrency]
 * 
 * Examples:
 *   node TESTER/stress/bombardment.js all 600 50
 *   node TESTER/stress/bombardment.js admin 300 30
 *   node TESTER/stress/bombardment.js teller 300 30
 */

const path = require('path');

// Dynamically resolve server port
let SERVER_PORT = 12341;
try {
    const { loadConfig } = require(path.join(__dirname, '../../backend/utilities/envconfig.js'));
    const config = loadConfig();
    SERVER_PORT = config?.MainServer?.port || process.env.PORT || 12341;
} catch (e) {
    SERVER_PORT = process.env.PORT || 12341;
}

const BASE_URL = `http://localhost:${SERVER_PORT}`;

// Parse CLI arguments
const rawArgs = process.argv.slice(2).filter(a => !['stress', 'stess'].includes(a.toLowerCase()));

let targetDomain = 'all'; // 'all', 'kiosk', 'admin', 'teller'
let TOTAL_REQUESTS = 600;
let CONCURRENCY = 50;

for (const arg of rawArgs) {
    const lower = arg.toLowerCase();
    if (['all', 'full', 'system'].includes(lower)) {
        targetDomain = 'all';
    } else if (['kiosk', 'client'].includes(lower)) {
        targetDomain = 'kiosk';
    } else if (['admin', 'dashboard'].includes(lower)) {
        targetDomain = 'admin';
    } else if (['teller', 'caller', 'counter'].includes(lower)) {
        targetDomain = 'teller';
    } else if (!isNaN(Number(arg))) {
        if (!TOTAL_REQUESTS || TOTAL_REQUESTS === 600) {
            TOTAL_REQUESTS = Number(arg);
        } else {
            CONCURRENCY = Number(arg);
        }
    }
}

// Stats tracking
const stats = {
    total: { count: 0, success: 0, rateLimited: 0, error: 0, totalLatency: 0 },
    kiosk: { count: 0, success: 0, rateLimited: 0, error: 0, totalLatency: 0 },
    admin: { count: 0, success: 0, rateLimited: 0, error: 0, totalLatency: 0 },
    teller: { count: 0, success: 0, rateLimited: 0, error: 0, totalLatency: 0 }
};

let adminCookie = null;
let tellerCookie = null;

async function checkServerReachable(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        return res.status < 500;
    } catch {
        return false;
    }
}

async function authenticateSessions() {
    // Authenticate Admin
    try {
        const res = await fetch(`${BASE_URL}/api/loginAdmin`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-bypass-api-limiter': 'true'
            },
            body: JSON.stringify({ username: 'admin', password: 'admin' })
        });
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
            adminCookie = setCookie.split(';')[0];
        }
    } catch (err) {
        console.warn('⚠️ Warning: Could not authenticate Admin session:', err.message);
    }

    // Authenticate Teller
    try {
        const res = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-bypass-api-limiter': 'true'
            },
            body: JSON.stringify({ username: 'tel1', password: 'tel1' })
        });
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
            tellerCookie = setCookie.split(';')[0];
        }
    } catch (err) {
        console.warn('⚠️ Warning: Could not authenticate Teller session:', err.message);
    }
}

function getRequestDefinitions() {
    const reqs = [];

    const baseHeaders = {
        'x-bypass-api-limiter': 'true',
        'x-bypass-kiosk-limiter': 'true'
    };

    if (['all', 'kiosk'].includes(targetDomain)) {
        reqs.push({
            domain: 'kiosk',
            name: 'Kiosk Services',
            fn: () => fetch(`${BASE_URL}/api/services`, { headers: baseHeaders })
        });
        reqs.push({
            domain: 'kiosk',
            name: 'Kiosk Page',
            fn: () => fetch(`${BASE_URL}/kiosk`, { headers: baseHeaders })
        });
        reqs.push({
            domain: 'kiosk',
            name: 'Display Services',
            fn: () => fetch(`${BASE_URL}/api/getServicesDisplay`, { headers: baseHeaders })
        });
    }

    if (['all', 'admin'].includes(targetDomain)) {
        const adminHeaders = {
            ...baseHeaders,
            ...(adminCookie ? { 'Cookie': adminCookie } : {})
        };

        reqs.push({
            domain: 'admin',
            name: 'Admin Live Dashboard',
            fn: () => fetch(`${BASE_URL}/api/admin/dashboard/live`, { headers: adminHeaders })
        });
        reqs.push({
            domain: 'admin',
            name: 'Admin Tellers List',
            fn: () => fetch(`${BASE_URL}/api/tellers/list?id=0`, { headers: adminHeaders })
        });
        reqs.push({
            domain: 'admin',
            name: 'Admin Groups List',
            fn: () => fetch(`${BASE_URL}/api/groups/list`, { headers: adminHeaders })
        });
        reqs.push({
            domain: 'admin',
            name: 'Admin Session Check',
            fn: () => fetch(`${BASE_URL}/api/check-session-admin`, { headers: adminHeaders })
        });
    }

    if (['all', 'teller'].includes(targetDomain)) {
        const tellerHeaders = {
            ...baseHeaders,
            ...(tellerCookie ? { 'Cookie': tellerCookie } : {})
        };

        reqs.push({
            domain: 'teller',
            name: 'Waiting Tickets',
            fn: () => fetch(`${BASE_URL}/api/tickets/waiting?services=EDUCATION`, { headers: tellerHeaders })
        });
        reqs.push({
            domain: 'teller',
            name: 'Calling Tickets',
            fn: () => fetch(`${BASE_URL}/api/getCallingTickets`, { headers: tellerHeaders })
        });
        reqs.push({
            domain: 'teller',
            name: 'Held Tickets',
            fn: () => fetch(`${BASE_URL}/api/tickets/held?tellerId=1`, { headers: tellerHeaders })
        });
        reqs.push({
            domain: 'teller',
            name: 'Forwarded Tickets',
            fn: () => fetch(`${BASE_URL}/api/tickets/forwarded?tellerId=1`, { headers: tellerHeaders })
        });
    }

    return reqs;
}

async function runStressTest() {
    console.log(`\n========================================`);
    console.log(`🚀 OpenQ Multi-Domain Stress Test`);
    console.log(`Target Mode:  ${targetDomain.toUpperCase()}`);
    console.log(`Base URL:     ${BASE_URL}`);
    console.log(`Requests:     ${TOTAL_REQUESTS}`);
    console.log(`Concurrency:  ${CONCURRENCY}`);
    console.log(`========================================\n`);

    const isReachable = await checkServerReachable(`${BASE_URL}/api/services`);
    if (!isReachable) {
        console.error(`❌ Error: Unable to connect to server at ${BASE_URL}`);
        console.error(`   Please ensure your application server is running (e.g. npm start) before executing stress tests.\n`);
        process.exit(1);
    }

    console.log(`▶ Authenticating Admin & Teller sessions...`);
    await authenticateSessions();
    if (adminCookie) console.log(`  ✔ Admin authenticated`);
    if (tellerCookie) console.log(`  ✔ Teller authenticated`);
    console.log('');

    const requestDefs = getRequestDefinitions();
    if (requestDefs.length === 0) {
        console.error('❌ No request endpoints defined for domain:', targetDomain);
        process.exit(1);
    }

    const startTime = Date.now();
    let completedRequests = 0;
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < TOTAL_REQUESTS) {
            const reqIdx = nextIndex++;
            const reqDef = requestDefs[reqIdx % requestDefs.length];
            const start = Date.now();

            try {
                const res = await reqDef.fn();
                const latency = Date.now() - start;

                stats.total.count++;
                stats.total.totalLatency += latency;
                stats[reqDef.domain].count++;
                stats[reqDef.domain].totalLatency += latency;

                if (res.ok) {
                    stats.total.success++;
                    stats[reqDef.domain].success++;
                } else if (res.status === 429) {
                    stats.total.rateLimited++;
                    stats[reqDef.domain].rateLimited++;
                } else {
                    stats.total.error++;
                    stats[reqDef.domain].error++;
                }
            } catch (err) {
                const latency = Date.now() - start;
                stats.total.count++;
                stats.total.error++;
                stats.total.totalLatency += latency;
                stats[reqDef.domain].count++;
                stats[reqDef.domain].error++;
                stats[reqDef.domain].totalLatency += latency;
            }

            completedRequests++;
            const logInterval = Math.max(1, Math.floor(TOTAL_REQUESTS / 10));
            if (completedRequests % logInterval === 0 || completedRequests === TOTAL_REQUESTS) {
                const percent = ((completedRequests / TOTAL_REQUESTS) * 100).toFixed(0);
                const currentDuration = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`[Progress] ${completedRequests} / ${TOTAL_REQUESTS} (${percent}%) in ${currentDuration}s`);
            }
        }
    }

    const workerCount = Math.min(CONCURRENCY, TOTAL_REQUESTS);
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);

    const totalTimeSec = (Date.now() - startTime) / 1000;
    const rps = (TOTAL_REQUESTS / totalTimeSec).toFixed(2);
    const avgLatency = (stats.total.totalLatency / TOTAL_REQUESTS).toFixed(2);

    console.log('\n======================================================');
    console.log('📊 MULTI-DOMAIN STRESS TEST RESULTS');
    console.log('======================================================');
    console.log(`Total Time:     ${totalTimeSec.toFixed(2)}s`);
    console.log(`Overall RPS:    ${rps} req/sec`);
    console.log(`Avg Latency:    ${avgLatency} ms`);
    console.log(`Total Handled:  ${stats.total.count}`);
    console.log(`Successful:     ${stats.total.success}`);
    if (stats.total.rateLimited > 0) {
        console.log(`Rate Limited:   ${stats.total.rateLimited} (HTTP 429 limiter active)`);
    }
    console.log(`Server Errors:  ${stats.total.error}`);
    console.log('------------------------------------------------------');

    // Domain breakdown
    const domainsToReport = targetDomain === 'all' ? ['kiosk', 'admin', 'teller'] : [targetDomain];
    for (const d of domainsToReport) {
        const dStats = stats[d];
        if (dStats.count > 0) {
            const dAvg = (dStats.totalLatency / dStats.count).toFixed(2);
            const icon = d === 'kiosk' ? '🖥️ KIOSK ' : (d === 'admin' ? '🛠️ ADMIN ' : '🧑‍💼 TELLER');
            const rlText = dStats.rateLimited > 0 ? ` | Throttled (429): ${dStats.rateLimited}` : '';
            console.log(`${icon} -> Total: ${dStats.count} | Pass: ${dStats.success}${rlText} | Errors: ${dStats.error} | Avg Latency: ${dAvg} ms`);
        }
    }
    console.log('======================================================');

    if (stats.total.error === 0) {
        console.log('✅ All endpoints handled heavy concurrent load successfully without server errors!\n');
        process.exitCode = 0;
    } else {
        const errorPercent = ((stats.total.error / TOTAL_REQUESTS) * 100).toFixed(1);
        console.error(`❌ Completed with ${stats.total.error} server errors (${errorPercent}% error rate).\n`);
        process.exitCode = 1;
    }
}

runStressTest();
