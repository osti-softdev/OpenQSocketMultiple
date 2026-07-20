const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../config/db.db'));

db.all("SELECT * FROM services", (err, rows) => {
    console.log(rows);
});
