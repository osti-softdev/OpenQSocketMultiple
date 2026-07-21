const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../backend/config/db.db');
const db = new sqlite3.Database(dbPath, async (err) => {
    if (err) {
        console.error("Error opening DB:", err);
        return;
    }
    console.log("Database opened.");

    const query = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    try {
        const tables = await query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        const data = {};
        for (let t of tables) {
            if (['services', 'accounts', 'counters', 'settings', 'counter_groups', 'tellers'].includes(t.name)) {
                data[t.name] = await query(`SELECT * FROM ${t.name}`);
            }
        }
        const dumpPath = path.join(__dirname, '../../backend/utilities/schema_dump.json');
        fs.writeFileSync(dumpPath, JSON.stringify({ tables, data }, null, 2));
        console.log(`Successfully dumped schema and data to ${dumpPath}`);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        db.close();
    }
});
