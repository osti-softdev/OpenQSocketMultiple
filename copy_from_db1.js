/**
 * copy_from_db1.js
 * 
 * Automatically copies transaction data from backend/copy_from/db.db to backend/config/db.db.
 * Includes corruption-resilient per-date extraction so that bad/corrupt pages 
 * in the source database do not stop valid records (like today's transactions) from being copied.
 * 
 * Usage:
 *   node copy_from_db1.js
 *   npm run copy-db1
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const copyFromDir = path.join(__dirname, 'backend', 'copy_from');
const configDir = path.join(__dirname, 'backend', 'config');

// Ensure copy_from directory exists
if (!fs.existsSync(copyFromDir)) {
  fs.mkdirSync(copyFromDir, { recursive: true });
}

// 1. Source database: defaults to backend/copy_from/db.db
const customSource = process.argv[2];
const possibleSources = [
  customSource,
  path.join(copyFromDir, 'db.db'),
  path.join(copyFromDir, 'db1.db'),
  path.join(configDir, 'db1.db'),
  path.join(__dirname, 'db1.db')
].filter(Boolean);

let sourceDbPath = possibleSources.find(p => fs.existsSync(p));
if (!sourceDbPath) {
  sourceDbPath = path.join(copyFromDir, 'db.db'); // default fallback for error display
}

// 2. Target database: backend/config/db.db
const targetDbPath = path.join(configDir, 'db.db');

console.log('====================================================');
console.log('   AUTOMATIC DATA SYNC: copy_from/db.db ===> config/db.db');
console.log('====================================================');
console.log(`Source DB: ${sourceDbPath}`);
console.log(`Target DB: ${targetDbPath}`);

if (!fs.existsSync(sourceDbPath)) {
  console.error(`\n❌ ERROR: Source file not found: ${sourceDbPath}`);
  console.error('Please make sure db.db is placed inside backend/copy_from/ folder.\n');
  process.exit(1);
}

if (!fs.existsSync(targetDbPath)) {
  console.error(`\n❌ ERROR: Target file not found: ${targetDbPath}`);
  process.exit(1);
}

if (path.resolve(sourceDbPath).toLowerCase() === path.resolve(targetDbPath).toLowerCase()) {
  console.error('\n❌ ERROR: Source and Target database cannot be the exact same file!');
  process.exit(1);
}

const db = new sqlite3.Database(targetDbPath, (err) => {
  if (err) {
    console.error('❌ Failed to open target database:', err.message);
    process.exit(1);
  }

  const escapedSource = sourceDbPath.replace(/'/g, "''");

  db.serialize(() => {
    db.run('PRAGMA busy_timeout = 30000;');
    db.run(`ATTACH DATABASE '${escapedSource}' AS src;`, (err) => {
      if (err) {
        console.error('❌ Failed to attach source DB:', err.message);
        db.close();
        process.exit(1);
      }
      console.log('✓ Attached source database successfully.');

      // 1. Fetch all distinct dates available in source
      db.all('SELECT DISTINCT date FROM src.transactions WHERE date IS NOT NULL ORDER BY date DESC', async (err, dateRows) => {
        if (err) {
          console.error('Error reading dates from source:', err.message);
          return finish(db);
        }

        const dates = dateRows.map(r => r.date);
        console.log(`Found dates in source DB: [ ${dates.join(', ')} ]\n`);

        let totalTransMerged = 0;
        let successfulDates = [];
        let failedDates = [];

        // 2. Resiliently copy transactions date-by-date
        for (const date of dates) {
          await new Promise((resolve) => {
            db.run(
              `INSERT OR REPLACE INTO main.transactions 
               SELECT * FROM src.transactions 
               WHERE date = ?`,
              [date],
              function (copyErr) {
                if (copyErr) {
                  console.warn(`⚠️ Skipped date ${date} (corrupted in source): ${copyErr.message}`);
                  failedDates.push(date);
                } else {
                  console.log(`✓ Copied ${this.changes.toString().padStart(4, ' ')} transactions for date: ${date}`);
                  totalTransMerged += this.changes;
                  successfulDates.push(date);
                }
                resolve();
              }
            );
          });
        }

        // 3. Copy corresponding forwarded_tickets for successful dates
        if (successfulDates.length > 0) {
          const placeholders = successfulDates.map(() => '?').join(',');
          await new Promise((resolve) => {
            db.run(
              `INSERT OR REPLACE INTO main.forwarded_tickets
               SELECT * FROM src.forwarded_tickets
               WHERE ticket_id IN (
                 SELECT id FROM src.transactions WHERE date IN (${placeholders})
               )`,
              successfulDates,
              function (fwdErr) {
                if (fwdErr) {
                  console.warn('Note on forwarded_tickets:', fwdErr.message);
                } else {
                  console.log(`\n✓ Copied ${this.changes} forwarded ticket record(s).`);
                }
                resolve();
              }
            );
          });
        }

        finish(db, totalTransMerged);
      });
    });
  });
});

function finish(db, totalTransMerged) {
  db.run('DETACH DATABASE src;', () => {
    db.all('PRAGMA integrity_check;', (err, rows) => {
      console.log(`\nIntegrity check on db.db: ${JSON.stringify(rows)}`);

      db.all('SELECT date, count(*) as count FROM transactions GROUP BY date ORDER BY date DESC LIMIT 7', (err, recentRows) => {
        console.log('\nRecent transactions in db.db now:');
        console.table(recentRows);

        db.close((closeErr) => {
          if (!closeErr) {
            console.log('====================================================');
            console.log(`🎉 SUCCESS! Auto-copied ${totalTransMerged} transactions into backend/config/db.db.`);
            console.log('====================================================\n');
          }
        });
      });
    });
  });
}
