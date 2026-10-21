/**
 * OpenQ Test Runner
 * Dispatches test suites based on CLI arguments.
 * 
 * Usage:
 *   node TESTER/runner.js [suite]
 *   npm test
 *   npm test stress (or stess)
 *   npm test unit
 *   npm test api
 *   npm test admin
 *   npm test display
 *   npm test rate
 *   npm test db
 *   npm test all
 */

const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const nodeBin = process.execPath; // Path to current node executable

// Get command line arguments (e.g. 'stress', 'stess', 'unit', 'api', 'admin', 'display', 'rate', 'all')
const rawArg = (process.argv[2] || '').trim().toLowerCase();

// Map aliases (like user typo 'stess' -> 'stress')
let mode = 'default';
if (['stress', 'stess', 'load', 'bombardment'].includes(rawArg)) {
    mode = 'stress';
} else if (['unit', 'units'].includes(rawArg)) {
    mode = 'unit';
} else if (['api', 'endpoint', 'endpoints'].includes(rawArg)) {
    mode = 'api';
} else if (['admin', 'dashboard'].includes(rawArg)) {
    mode = 'admin';
} else if (['display', 'queue'].includes(rawArg)) {
    mode = 'display';
} else if (['rate', 'limiter', 'ratelimit'].includes(rawArg)) {
    mode = 'rate';
} else if (['all'].includes(rawArg)) {
    mode = 'all';
} else if (['db', 'dbtest', 'schema'].includes(rawArg)) {
    mode = 'db';
}

console.log(`\n========================================`);
console.log(`🧪 OpenQ Test Suite Runner [Mode: ${mode.toUpperCase()}]`);
console.log(`========================================\n`);

let exitCode = 0;

function runNodeTest(testFiles, label) {
    console.log(`▶ Running ${label}...`);
    const args = ['--test', ...testFiles];
    const res = spawnSync(nodeBin, args, {
        cwd: rootDir,
        stdio: 'inherit'
    });
    if (res.status !== 0) {
        exitCode = res.status || 1;
    }
    return res.status === 0;
}

function runScript(scriptPath, extraArgs = [], label = '') {
    if (label) console.log(`▶ Running ${label}...`);
    const res = spawnSync(nodeBin, [scriptPath, ...extraArgs], {
        cwd: rootDir,
        stdio: 'inherit'
    });
    if (res.status !== 0) {
        exitCode = res.status || 1;
    }
    return res.status === 0;
}

const unitFiles = [
    path.join(__dirname, 'unit/db_connection.test.js'),
    path.join(__dirname, 'unit/helpers.test.js')
];

const apiFiles = [
    path.join(__dirname, 'api/endpoints.test.js'),
    path.join(__dirname, 'api/admin.test.js'),
    path.join(__dirname, 'api/display.test.js')
];

switch (mode) {
    case 'stress': {
        const stressArgs = [...process.argv.slice(3)];
        if (rawArg.includes(':')) {
            const sub = rawArg.split(':')[1];
            if (['admin', 'teller', 'kiosk', 'all'].includes(sub)) {
                stressArgs.unshift(sub);
            }
        }
        runScript(path.join(__dirname, 'stress/bombardment.js'), stressArgs);
        break;
    }

    case 'unit': {
        runNodeTest(unitFiles, 'Unit Tests (DB & Helpers)');
        break;
    }

    case 'api': {
        runNodeTest(apiFiles, 'All API Integration Tests (Lifecycle, Admin, Display)');
        break;
    }

    case 'admin': {
        runNodeTest([path.join(__dirname, 'api/admin.test.js')], 'Admin & Dashboard API Tests');
        break;
    }

    case 'display': {
        runNodeTest([path.join(__dirname, 'api/display.test.js')], 'Display & Queue API Tests');
        break;
    }

    case 'rate': {
        runNodeTest([path.join(__dirname, 'api/rate_limiting.test.js')], 'Rate Limiting Tests');
        break;
    }

    case 'db': {
        console.log('▶ Checking database schema and services...');
        runScript(path.join(__dirname, 'dbtest/check_schema.js'), [], 'Schema Check');
        runScript(path.join(__dirname, 'dbtest/check_services.js'), [], 'Services Check');
        runScript(path.join(__dirname, 'dbtest/check_last_date.js'), [], 'Last Date Check');
        break;
    }

    case 'all': {
        console.log('▶ Running complete test battery...\n');
        runNodeTest(unitFiles, '1. Unit Tests (DB & Helpers)');
        console.log('');
        runNodeTest(apiFiles, '2. API Integration Tests (Lifecycle, Admin, Display)');
        console.log('');
        runNodeTest([path.join(__dirname, 'api/rate_limiting.test.js')], '3. Rate Limiting Tests');
        console.log('');
        console.log('▶ 4. Database Schema Diagnostics...');
        runScript(path.join(__dirname, 'dbtest/check_schema.js'), [], 'Schema Check');
        runScript(path.join(__dirname, 'dbtest/check_services.js'), [], 'Services Check');
        runScript(path.join(__dirname, 'dbtest/check_last_date.js'), [], 'Last Date Check');
        console.log('');
        console.log('▶ 5. Stress Test (quick verification: 100 requests):');
        runScript(path.join(__dirname, 'stress/bombardment.js'), ['100', '20']);
        break;
    }

    case 'default':
    default: {
        // By default, run all Unit and API Integration Tests
        runNodeTest([
            ...unitFiles,
            ...apiFiles
        ], 'Unit & API Integration Tests');
        break;
    }
}

process.exitCode = exitCode;
