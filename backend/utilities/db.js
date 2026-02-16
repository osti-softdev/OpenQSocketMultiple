const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const rootpath = global.BACKEND_PATH;
const dbPath = path.join(rootpath, "config/db.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to SQLite database');

  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA synchronous = NORMAL;");
  db.run("PRAGMA busy_timeout = 15000;");
  db.run("PRAGMA foreign_keys = ON;");

  // initializeDatabase();
});

// function initializeDatabase() {
//   db.serialize(() => {

//    // =========================
//    // & Teller Groups
//    // =========================
//     db.run(`
//       CREATE TABLE IF NOT EXISTS teller_groups (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT UNIQUE NOT NULL
//       )
//     `);
      
//    // =========================
//    // & Services
//    // =========================
//     db.run(`
//       CREATE TABLE IF NOT EXISTS services (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT UNIQUE NOT NULL,
//         prefix TEXT NOT NULL UNIQUE,
//         priority_prefix TEXT NOT NULL UNIQUE,
//         cutoff_time TEXT,
//         is_active INTEGER DEFAULT 1
//       )
//     `);

//     /* =========================
//        Tellers
//     ========================= */
//     db.run(`
//       CREATE TABLE IF NOT EXISTS tellers (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         username TEXT UNIQUE NOT NULL,
//         password TEXT NOT NULL,

//         counter_number INTEGER,
//         services TEXT,
//         group_id INTEGER,

//         role TEXT NOT NULL CHECK (role IN ('admin','teller')),
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

//         FOREIGN KEY (group_id) REFERENCES teller_groups(id)
//       )
//     `);


//     /* =========================
//        Tickets
//     ========================= */
//     db.run(`
//       CREATE TABLE IF NOT EXISTS tickets (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         ticket_number TEXT NOT NULL,
//         service TEXT NOT NULL,
//         prefix TEXT,
//         priority INTEGER DEFAULT 0,
//         status TEXT DEFAULT 'waiting',
//         counter_number INTEGER,
//         teller_id INTEGER,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         called_at DATETIME,
//         completed_at DATETIME,
//         void_reason TEXT,
//         recall_count INTEGER DEFAULT 0,
//         forwarded_to INTEGER,
//         forwarded_from INTEGER,
//         held_at DATETIME,
//         held_by INTEGER
//       )
//     `);

//     /* =========================
//        Sent Tickets
//     ========================= */
//     db.run(`
//       CREATE TABLE IF NOT EXISTS sent_tickets (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         ticket_id INTEGER,
//         from_teller_id INTEGER,
//         to_teller_id INTEGER,
//         sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         note TEXT,
//         FOREIGN KEY (ticket_id) REFERENCES tickets(id)
//       )
//     `);

    
//     /* =========================
//        HELD Tickets Log
//     ========================= */
//     db.run(`
//       CREATE TABLE IF NOT EXISTS held_tickets (
//         id              INTEGER PRIMARY KEY AUTOINCREMENT,
//         ticket_id       INTEGER NOT NULL,
//         teller_id       INTEGER NOT NULL,
//         held_at         DATETIME NOT NULL,
//         FOREIGN KEY (ticket_id) REFERENCES tickets(id),
//         FOREIGN KEY (teller_id)  REFERENCES tellers(id)
//       )
//     `);

//     /* =========================
//        Ticket Recalls
//     ========================= */
//     db.run(`
//       CREATE TABLE IF NOT EXISTS ticket_recalls (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         ticket_id INTEGER,
//         recalled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (ticket_id) REFERENCES tickets(id)
//       )
//     `);

//     /* =========================
//        Forwarded Tickets
//     ========================= */
//     db.run(`
//       CREATE TABLE IF NOT EXISTS forwarded_tickets (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         ticket_id INTEGER NOT NULL,
//         from_teller_id INTEGER NOT NULL,
//         to_teller_id INTEGER,
//         to_group_id INTEGER,
//         note TEXT,
//         forwarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (ticket_id) REFERENCES tickets(id),
//         FOREIGN KEY (from_teller_id) REFERENCES tellers(id),
//         FOREIGN KEY (to_teller_id) REFERENCES tellers(id),
//         FOREIGN KEY (to_group_id) REFERENCES teller_groups(id)
//       )
//     `);

//     /* =========================
//        Settings
//     ========================= */
//     db.run(`
//       CREATE TABLE IF NOT EXISTS settings (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         key TEXT UNIQUE NOT NULL,
//         value TEXT NOT NULL
//       )
//     `);

//     /* =========================
//        Seed Data
//     ========================= */

//     // Default teller group
//     db.run(
//       `INSERT OR IGNORE INTO teller_groups (id, name) VALUES (1, 'Default Group')`
//     );

//     // Default services
//     db.get(`SELECT COUNT(*) AS count FROM services`, (err, row) => {
//   if (err) {
//     console.error('Service seed check failed:', err);
//     return;
//   }

//   if (row.count === 0) {
//     console.log('Seeding default services...');

//     const services = [
//       ['CASHIER', 'C', 'PC'],
//       ['LABORATORY', 'L', 'PL'],
//       ['OPD', 'O', 'PO'],
//       ['PHARMACY', 'P', 'PP']
//     ];

//     const stmt = db.prepare(
//       `INSERT INTO services (name, prefix, priority_prefix) VALUES (?, ?, ?)`
//     );

//         services.forEach(s => stmt.run(s));
//         stmt.finalize();
//       }
//     });

//     // Default settings
//     db.run(
//       `INSERT OR IGNORE INTO settings (key, value) VALUES ('announcement', 'Welcome to our Queue System')`
//     );
//     db.run(
//       `INSERT OR IGNORE INTO settings (key, value) VALUES ('video_url', '')`
//     );

//     // Default admin account
//     const adminPassword = bcrypt.hashSync('admin123', 10);
//     const tellerpassword = bcrypt.hashSync('teller123', 10);
//     db.run(
//       `
//       INSERT OR IGNORE INTO tellers
//       (username, password, counter_number, services, role, group_id)
//       VALUES (?, ?, ?, ?, ?, ?)
//       `,
//       ['teller', tellerpassword, 1, 'CASHIER,LABORATORY,OPD', 'teller', 1]
//     );

//     db.run(
//       `
//       INSERT OR IGNORE INTO tellers
//       (username, password, role)
//       VALUES (?, ?, ?)
//       `,
//       ['admin', adminPassword, 'admin']
//     );

//     console.log('Default Admin user and pass (admin, admin123)');
//     console.log('Default Teller user and pass (teller, teller123)');
    
//     console.log('Database initialized (no migrations)');
//     db.run(`
//         UPDATE tickets
//         SET 
//             status = 'voided',
//             void_reason = CASE
//                 WHEN status IN ('calling', 'called') 
//                     THEN 'Auto-voided: session ended without completion'
//                 WHEN status = 'waiting'
//                     THEN 'Auto-voided: session not started (unserved)'
//             END
//         WHERE status IN ('calling', 'called', 'waiting')
//           AND DATE(created_at) < DATE('now', 'localtime')
//     `, (err) => {
//         if (err) {
//             console.error('Stale ticket cleanup failed:', err);
//         } else {
//             console.log('Stale ticket cleanup done.');
//         }
//     });
//   });
// }

// ! Helpers
// single row
// * • querying by primary key
// * • querying by unique column
// * • authenticating a user
// * • checking existence
db.getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

// multiple rows
// * • listing records
// * • dashboards
// * • reports
// * • queues
// * • history views
db.allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

// insert / update / delete
// * • INSERT
// * • UPDATE
// * • DELETE
// * • schema ops
// * • counters
// * • state changes
db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });

// transaction helper
db.transaction = async (fn) => {
  try {
    await db.runAsync('BEGIN');
    await fn();
    await db.runAsync('COMMIT');
  } catch (err) {
    await db.runAsync('ROLLBACK');
    throw err;
  }
};

module.exports = db;