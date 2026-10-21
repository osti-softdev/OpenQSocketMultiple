const test = require('node:test');
const assert = require('node:assert');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

test('Database Connection & Schema Test', async (t) => {
    const dbPath = path.join(__dirname, '../../backend/config/db.db');
    
    // Test 1: Verify the database file exists
    await t.test('database file should exist', () => {
        assert.strictEqual(fs.existsSync(dbPath), true, 'Database file is missing! Make sure the backend has initialized it.');
    });

    // Test 2: Verify connection and all core tables
    await t.test('should connect and contain all required tables', async () => {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) return reject(err);
                
                db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                    if (err) return reject(err);
                    
                    const tableNames = tables.map(t => t.name);
                    
                    // Essential tables
                    const required = [
                        'transactions',
                        'services',
                        'counters',
                        'accounts',
                        'counter_groups',
                        'settings',
                        'forwarded_tickets'
                    ];

                    for (const table of required) {
                        assert.ok(tableNames.includes(table), `Required table '${table}' is missing from database`);
                    }
                    
                    db.close();
                    resolve();
                });
            });
        });
    });

    // Test 3: Verify essential accounts and counters exist
    await t.test('database should contain seeded admin account and counters', async () => {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) return reject(err);

                db.get("SELECT COUNT(*) as count FROM accounts WHERE role IN ('admin', 'superadmin')", (err, adminRow) => {
                    if (err) return reject(err);
                    assert.ok(adminRow.count > 0, 'Database should contain at least one admin account');

                    db.get("SELECT COUNT(*) as count FROM counters WHERE cstatus = 1", (err, counterRow) => {
                        if (err) return reject(err);
                        assert.ok(counterRow.count > 0, 'Database should contain active counters/tellers');

                        db.close();
                        resolve();
                    });
                });
            });
        });
    });
});
