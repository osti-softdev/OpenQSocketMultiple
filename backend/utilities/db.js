const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const rootpath = global.BACKEND_PATH;
const dbPath = path.join(rootpath, "config/db.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to SQLite database');

  db.run("PRAGMA journal_mode = WAL;", () => {
    db.run("PRAGMA synchronous = NORMAL;", () => {
      db.run("PRAGMA busy_timeout = 15000;", () => {
        db.run("PRAGMA temp_store = MEMORY;", () => {
          db.run("PRAGMA cache_size = -64000;", () => {
            db.run("PRAGMA mmap_size = 268435456;", () => {
              db.run("PRAGMA foreign_keys = ON;", () => {
                initializeDatabase();
                ensureIndexes();
              });
            });
          });
        });
      });
    });
  });
});

function ensureIndexes() {
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_trans_date ON transactions(date);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_status ON transactions(status);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_date_status ON transactions(date, status);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_date_sname_ticketservice ON transactions(date, sname, ticketservice);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_date_sname_ticketservice_num ON transactions(date, sname, ticketservice, ticketnum);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_date_cgroup ON transactions(date, counter_group);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_date_cuser ON transactions(date, counter_user);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_date_cnum ON transactions(date, counter_num);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_date_teller ON transactions(date, teller_id);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_date_start ON transactions(date, start_time);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_date_time_id ON transactions(date, time, id);`,
    `CREATE INDEX IF NOT EXISTS idx_trans_ticket_secret ON transactions(ticket_secret);`,
    `CREATE INDEX IF NOT EXISTS idx_forwarded_ticket_id ON forwarded_tickets(ticket_id);`,
    `CREATE INDEX IF NOT EXISTS idx_counters_group_id ON counters(group_id);`,
    `CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);`,
    `CREATE INDEX IF NOT EXISTS idx_services_sname ON services(sname);`
  ];

  db.serialize(() => {
    indexes.forEach((sql) => {
      db.run(sql, (err) => {
        if (err && !err.message.includes("no such table")) {
          console.error("Failed to create index:", err.message);
        }
      });
    });
    console.log("Database performance PRAGMAs and indexes verified.");
  });
}

function initializeDatabase() {
  db.serialize(() => {

    // 1. Drop unused mobile_no column from transactions if it exists (requires SQLite 3.35.0+)
    db.run("ALTER TABLE transactions DROP COLUMN mobile_no;", (err) => {
      if (err && !err.message.includes("no such column") && !err.message.includes("syntax error")) {
        console.error("Note: mobile_no drop:", err.message);
      }
    });

    // 2. CREATE TABLES
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      status INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS counter_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS counters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cname TEXT,
      cnum INTEGER,
      cuser TEXT,
      cpass TEXT,
      cstatus TEXT,
      services TEXT,
      group_name TEXT,
      group_id INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sname TEXT,
      regular TEXT,
      priority TEXT,
      status INTEGER,
      shortSname TEXT,
      sub_sname TEXT,
      sched TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      value TEXT,
      status INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketnum INTEGER,
      ticketservice TEXT,
      sname TEXT,
      priority INTEGER,
      status TEXT,
      date TEXT,
      time TEXT,
      start_time TEXT,
      end_time TEXT,
      teller_id INTEGER,
      counter_num TEXT,
      counter_user TEXT,
      counter_group TEXT,
      forwarded_from TEXT,
      forwarded_to TEXT,
      history TEXT,
      void_reason TEXT,
      note TEXT,
      ticket_secret TEXT,
      mobile_records TEXT,
      mobile TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS forwarded_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      from_teller_id INTEGER NOT NULL,
      to_teller_id INTEGER,
      to_group_id INTEGER,
      note TEXT,
      forwarded_at TEXT,
      FOREIGN KEY(from_teller_id) REFERENCES counters(id),
      FOREIGN KEY(ticket_id) REFERENCES transactions(id),
      FOREIGN KEY(to_group_id) REFERENCES counter_groups(id),
      FOREIGN KEY(to_teller_id) REFERENCES counters(id)
    )`);

    // 3. SEED DEFAULT DATA
    const accounts = [
      [1, 'Cade Lawrenzo Caña', 'admin', 'admin', 'superadmin', 1],
      [2, 'admin1', 'admin1', 'admin1', 'admin', 1],
      [5, 'user', 'user', 'user', 'user', 1]
    ];
    accounts.forEach(acc => db.run(`INSERT OR IGNORE INTO accounts (id, name, username, password, role, status) VALUES (?, ?, ?, ?, ?, ?)`, acc));

    const counterGroups = [
      [71, 'BUSINESS_TAX'], [72, 'MDRRMO'], [73, 'CASHIER'], [75, 'REAL_PROPERTY_TAX'],
      [76, 'GENERAL'], [77, 'ASSESSMENT'], [78, 'EVALUATOR'], [79, 'ASSESSOR']
    ];
    counterGroups.forEach(cg => db.run(`INSERT OR IGNORE INTO counter_groups (id, group_name) VALUES (?, ?)`, cg));

    const counters = [
      [1, 'TELLER 1', 1, 'teller1', '1234', '1', 'REAL_PROPERTY_TAX,BUSINESS_TAX,GENERAL,MDRRMO,ASSESSMENT,CASHIER,EVALUATOR,ASSESSOR', 'REAL_PROPERTY_TAX', 75],
      [2, 'TELLER 2', 2, 'teller2', '1234', '1', 'BUSINESS_TAX', 'BUSINESS_TAX', 71],
      [3, 'TELLER 3', 3, 'teller3', '1234', '1', 'MDRRMO', 'MDRRMO', 72],
      [4, 'TELLER 4', 4, 'teller4', '1234', '1', 'CASHIER', 'CASHIER', 73],
      [5, 'TELLER 5', 5, 'teller5', '1234', '1', 'GENERAL', 'GENERAL', 76],
      [6, 'TELLER 6', 6, 'teller6', '1234', '1', 'ASSESSMENT', 'ASSESSMENT', 77],
      [7, 'TELLER 7', 7, 'teller7', '1234', '1', 'ASSESSMENT', 'ASSESSMENT', 77],
      [8, 'TELLER 8', 8, 'teller8', '1234', '1', 'EVALUATOR', 'EVALUATOR', 78],
      [9, 'TELLER 9', 9, 'teller9', '1234', '1', 'EVALUATOR', 'EVALUATOR', 78],
      [10, 'TELLER 10', 10, 'teller10', '1234', '1', 'ASSESSOR', 'ASSESSOR', 79]
    ];
    counters.forEach(c => db.run(`INSERT OR IGNORE INTO counters (id, cname, cnum, cuser, cpass, cstatus, services, group_name, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, c));

    const services = [
      [1, 'REAL_PROPERTY_TAX', 'RPT', 'PRPT', 1, 'REAL PROPERTY TAX', 'Counter 1, 2', '11:09:01'],
      [2, 'BUSINESS_TAX', 'BT', 'PBT', 1, 'BUSINESS TAX', 'Counter 1, 2,3', ''],
      [3, 'GENERAL', 'G', 'PG', 1, 'GENERAL', 'Counter 3', ''],
      [4, 'MDRRMO', 'MO', 'PMO', 1, 'MDRRMO', 'Counter 5', ''],
      [5, 'ASSESSMENT', 'A', 'AS', 1, 'ASSESSMENT', 'Counter 6', ''],
      [6, 'CASHIER', 'C', 'CP', 1, 'CASHIER', 'Counter 7,8,9,10', ''],
      [7, 'EVALUATOR', 'E', 'PE', 1, 'EVALUATOR', 'Counter 4', ''],
      [9, 'ASSESSOR', 'A', 'AS', 1, 'ASSESSOR', 'Counter 6', '']
    ];
    services.forEach(s => db.run(`INSERT OR IGNORE INTO services (id, sname, regular, priority, status, shortSname, sub_sname, sched) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, s));

    const settings = [
      [7, 'announcement', '', 1],
      [8, 'announcement2', '', 1],
      [9, 'announcement3', 'WE ARE HAPPY TO SERVE YOU!', 1],
      [10, 'annbgcolor', '#08228d', 0],
      [11, 'anntextcolor', '#1bb18c', 0],
      [12, 'annspeed', '43', 0],
      [13, 'privacy_policy', `# Privacy Policy

      **Effective Date:** January 1, 2024

      ## Privacy Notice

      This application values and respects your right to privacy. We are committed to protecting your personal information in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations.

      ## Information We Collect

      When you use this application, we may collect the following personal information:

      * Mobile phone number
      * Queue transaction details (such as queue number, service selected, date and time of visit)
      * Optional feedback or ratings submitted through the application

      We only collect information that is necessary for the operation of our queue management services at **SAMPLE CLIENT NAME.**.

      ## Purpose of Collection

      Your mobile phone number is collected and processed for the following purposes:

      * Sending your queue number and queue status notifications
      * Informing you when your turn is approaching
      * Contacting you regarding your current queue transaction when necessary
      * Sending announcements, service advisories, operating hours, maintenance notices, and other updates related to **SAMPLE CLIENT NAME.**'s services
      * Improving customer service and system performance

      We will not use your personal information for purposes incompatible with those stated above without obtaining your consent, unless otherwise permitted by law.

      ## Legal Basis for Processing

      Your personal information is processed based on:

      * Your voluntary consent when providing your mobile number; and
      * The legitimate interests of **SAMPLE CLIENT NAME.** in providing efficient queue management and customer communication.

      ## Data Sharing

      Your personal information will not be sold, rented, or shared with third parties for marketing purposes.

      Information may only be disclosed:

      * When required by law or lawful order of a government authority;
      * To authorized service providers who process data on behalf of **SAMPLE CLIENT NAME.** under appropriate confidentiality and security agreements; or
      * With your explicit consent.

      ## Data Retention

      Your personal information will only be retained for as long as necessary to fulfill the purposes stated in this Privacy Policy or as required by applicable laws and regulations.

      After the retention period expires, your personal information will be securely deleted, anonymized, or disposed of using appropriate security measures.

      ## Data Security

      We implement reasonable organizational, physical, and technical security measures to protect your personal information against unauthorized access, disclosure, alteration, loss, misuse, or destruction.

      ## Your Rights

      Subject to applicable laws, you have the right to:

      * Be informed about the processing of your personal information.
      * Access your personal information.
      * Correct inaccurate or incomplete personal information.
      * Withdraw your consent, subject to legal and contractual limitations.
      * Request deletion or blocking of your personal information when legally applicable.
      * Lodge a complaint with the National Privacy Commission if you believe your privacy rights have been violated.

      ## Consent

      By providing your mobile phone number and using this application, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, storage, and processing of your personal information for the purposes described herein.

      ## Contact Information

      For questions, concerns, or requests regarding this Privacy Policy or the processing of your personal information, please contact:

      **Data Protection Officer / Privacy Contact**
      Name: **SAMPLE CLIENT NAME. Administration**
      Email: admin@sample.com
      Phone: (082) 222-2222
      Address: San Pedro Street, Davao City`, 1]
    ];
    settings.forEach(st => db.run(`INSERT OR IGNORE INTO settings (id, key, value, status) VALUES (?, ?, ?, ?)`, st));

    console.log("Database schema auto-creation and seed verification completed.");
    archiveOldData();
  });
}

function archiveOldData() {
  db.serialize(() => {
    // Cutoff is 365 days ago
    const cutoffQuery = "date('now', '-365 days')";

    db.all(`SELECT * FROM transactions WHERE date < ${cutoffQuery}`, (err, rows) => {
      if (err) {
        console.error("Error querying old transactions for archival:", err);
        return;
      }

      if (!rows || rows.length === 0) {
        console.log("No transactions older than 365 days found. Skipping archive.");
        return;
      }

      console.log(`Found ${rows.length} transactions older than 365 days. Archiving...`);

      const backupsDir = path.join(rootpath, 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(backupsDir, `transactions_archive_${timestamp}.csv`);

      const headers = Object.keys(rows[0]).join(',');
      const csvRows = rows.map(row => {
        return Object.values(row).map(value => {
          let str = value === null ? '' : String(value);
          if (str.includes(',') || str.includes('\\n') || str.includes('"')) {
            str = `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',');
      });

      const csvContent = headers + '\\n' + csvRows.join('\\n');

      fs.writeFile(filename, csvContent, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error("Failed to write archive CSV:", writeErr);
          return;
        }
        console.log(`Successfully archived ${rows.length} transactions to ${filename}`);

        db.serialize(() => {
          db.run(`DELETE FROM forwarded_tickets WHERE ticket_id IN (SELECT id FROM transactions WHERE date < ${cutoffQuery})`, (delErr) => {
            if (delErr) {
              console.error("Failed to delete old forwarded_tickets:", delErr);
            }
          });
          db.run(`DELETE FROM transactions WHERE date < ${cutoffQuery}`, function (delErr2) {
            if (delErr2) {
              console.error("Failed to delete old transactions:", delErr2);
            } else {
              console.log(`Deleted ${this.changes} old transactions from database.`);
            }
          });
        });
      });
    });
  });
}

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