const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../backend/config/db.before-service-group-sync-20260717-134139.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

db.serialize(() => {
    db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'", (err, rows) => {
        if (err) console.error(err);
        else console.log("TRANSACTIONS SCHEMA:", rows[0]?.sql);
    });

    db.all("SELECT * FROM transactions LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else console.log("SAMPLE TRANSACTIONS:", JSON.stringify(rows, null, 2));
    });
});
db.close();
