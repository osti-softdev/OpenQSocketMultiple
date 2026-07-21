/**
 * Simple Node.js Stress Testing Script
 * This script will barrage your server with concurrent requests
 * to see how SQLite and Express handle the pressure.
 * 
 * Usage: node TESTER/stress/bombardment.js
 */

const TOTAL_REQUESTS = 500;
const CONCURRENCY = 50;
const API_URL = 'http://localhost:12341/kiosk'; // A lightweight endpoint

let successCount = 0;
let errorCount = 0;

console.log(`Starting stress test: ${TOTAL_REQUESTS} requests with concurrency of ${CONCURRENCY}...`);
const startTime = Date.now();

async function sendRequest() {
    try {
        const res = await fetch(API_URL);
        if (res.ok) {
            successCount++;
        } else {
            errorCount++;
        }
    } catch (err) {
        errorCount++;
    }
}

async function runBombardment() {
    let activePromises = [];
    let completedRequests = 0;

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        const p = sendRequest().then(() => {
            completedRequests++;
            if (completedRequests % 50 === 0) {
                console.log(`Progress: ${completedRequests} / ${TOTAL_REQUESTS}`);
            }
        });
        
        activePromises.push(p);

        // Throttle concurrency
        if (activePromises.length >= CONCURRENCY) {
            await Promise.race(activePromises);
            activePromises = activePromises.filter(p => p.status !== 'fulfilled' && p.status !== 'rejected');
        }
    }

    // Wait for remaining requests
    await Promise.allSettled(activePromises);

    const timeTaken = (Date.now() - startTime) / 1000;
    console.log('\n--- STRESS TEST RESULTS ---');
    console.log(`Time taken: ${timeTaken.toFixed(2)} seconds`);
    console.log(`Requests/sec: ${(TOTAL_REQUESTS / timeTaken).toFixed(2)}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    
    if (errorCount > 0) {
        console.warn('⚠️ Server struggled under load! Consider optimizing database queries or increasing connection limits.');
    } else {
        console.log('✅ Server handled the load perfectly!');
    }
}

runBombardment();
