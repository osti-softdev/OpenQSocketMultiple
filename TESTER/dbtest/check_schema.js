const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let dbPath = path.join(__dirname, '../../backend/config/db.db');
if (!fs.existsSync(dbPath)) {
    dbPath = path.join(__dirname, '../../backend/config/db.before-service-group-sync-20260717-134139.db');
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening DB:', err);
        return;
    }

    db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'", (err, rows) => {
        if (err) console.error(err);
        else console.log("TRANSACTIONS SCHEMA:", rows[0]?.sql);

        db.all("SELECT * FROM transactions LIMIT 5", (err2, sampleRows) => {
            if (err2) console.error(err2);
            else console.log("SAMPLE TRANSACTIONS:", JSON.stringify(sampleRows, null, 2));

            db.close();
        });
    });
});
