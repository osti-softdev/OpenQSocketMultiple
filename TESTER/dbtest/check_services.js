const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../backend/config/db.db'), sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening DB:', err);
        return;
    }

    db.all("SELECT * FROM services", (err, rows) => {
        if (err) console.error('Query error:', err);
        else console.log(rows);
        db.close();
    });
});
