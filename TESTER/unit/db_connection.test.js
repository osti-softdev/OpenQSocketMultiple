const test = require('node:test');
const assert = require('node:assert');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

test('Database Connection & Schema Test', async (t) => {
    
    // Test 1: Verify the database file exists
    await t.test('database file should exist', () => {
        const dbPath = path.join(__dirname, '../../backend/config/db.db');
        assert.strictEqual(fs.existsSync(dbPath), true, 'Database file is missing! Make sure the backend has initialized it.');
    });

    // Test 2: Verify connection and core schema
    await t.test('should connect and contain required tables', async () => {
        const dbPath = path.join(__dirname, '../../backend/config/db.db');
        
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) return reject(err);
                
                db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                    if (err) return reject(err);
                    
                    const tableNames = tables.map(t => t.name);
                    
                    // Assert that all essential tables exist
                    assert.ok(tableNames.includes('transactions'), 'transactions table is missing');
                    assert.ok(tableNames.includes('services'), 'services table is missing');
                    assert.ok(tableNames.includes('counters'), 'counters table is missing');
                    assert.ok(tableNames.includes('accounts'), 'accounts table is missing');
                    
                    db.close();
                    resolve();
                });
            });
        });
    });
});
