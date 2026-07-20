const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../config/db.db'));

db.get("SELECT MAX(date) as maxDate FROM transactions", (err, row) => {
    console.log("Max date in DB is:", row.maxDate);
});
