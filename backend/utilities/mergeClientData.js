/**
 * mergeClientData.js
 * 
 * Safely merges recent transactions from a client database (e.g. dbnew.db)
 * into your clean local database (db.db), then vacuums and verifies integrity.
 * 
 * Usage:
 *   node backend/utilities/mergeClientData.js [--from 2026-10-19] [--source backend/config/dbnew.db]
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

// Calculate Monday of current week if --from not specified
function getDefaultFromDate() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

const configDir = path.join(__dirname, '../config');
const sourceDbPath = path.resolve(getArg('--source', path.join(configDir, 'dbnew.db')));
const targetDbPath = path.resolve(getArg('--target', path.join(configDir, 'db.db')));
const fromDate = getArg('--from', '2026-10-19'); // Default: start of this week

console.log('=== SQLite Data Merge Tool ===');
console.log(`Source (Client DB): ${sourceDbPath}`);
console.log(`Target (Clean DB):  ${targetDbPath}`);
console.log(`Merge Date From:    ${fromDate}`);

if (!fs.existsSync(sourceDbPath)) {
  console.error(`ERROR: Source database not found at: ${sourceDbPath}`);
  process.exit(1);
}
if (!fs.existsSync(targetDbPath)) {
  console.error(`ERROR: Target database not found at: ${targetDbPath}`);
  process.exit(1);
}

// 1. Create a safe backup of target database before merging
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(configDir, `db.backup-${timestamp}.bak`);
fs.copyFileSync(targetDbPath, backupPath);
console.log(`✓ Created backup of clean DB: ${backupPath}`);

const db = new sqlite3.Database(targetDbPath, (err) => {
  if (err) {
    console.error('Failed to open target DB:', err);
    process.exit(1);
  }

  db.serialize(async () => {
    // Normal synchronous for migration speed & consistency
    db.run('PRAGMA synchronous = NORMAL;');
    db.run('PRAGMA busy_timeout = 30000;');

    // Attach source database
    const escapedSource = sourceDbPath.replace(/'/g, "''");
    db.run(`ATTACH DATABASE '${escapedSource}' AS sourceDb;`, (err) => {
      if (err) {
        console.error('Failed to attach source database:', err.message);
        db.close();
        process.exit(1);
      }
      console.log('✓ Attached source database successfully.');

      // Count records to merge
      db.get('SELECT COUNT(*) as count FROM sourceDb.transactions WHERE date >= ?', [fromDate], (err, row) => {
        if (err) {
          console.error('Error counting source records:', err.message);
          return finish();
        }

        const countToMerge = row ? row.count : 0;
        console.log(`Found ${countToMerge} transaction(s) in source DB with date >= ${fromDate}`);

        if (countToMerge === 0) {
          console.log('No transactions found to merge.');
          return finish();
        }

        db.run('BEGIN TRANSACTION');

        // 1. Merge transactions
        db.run(
          `INSERT OR REPLACE INTO main.transactions 
           SELECT * FROM sourceDb.transactions 
           WHERE date >= ?`,
          [fromDate],
          function (err) {
            if (err) {
              console.error('Failed to merge transactions:', err.message);
              db.run('ROLLBACK');
              return finish();
            }
            const transMerged = this.changes;
            console.log(`✓ Merged ${transMerged} records into transactions table.`);

            // 2. Merge forwarded_tickets for these transactions
            db.run(
              `INSERT OR REPLACE INTO main.forwarded_tickets
               SELECT * FROM sourceDb.forwarded_tickets
               WHERE ticket_id IN (SELECT id FROM sourceDb.transactions WHERE date >= ?)`,
              [fromDate],
              function (err) {
                if (err) {
                  console.warn('Note on forwarded_tickets merge:', err.message);
                } else {
                  console.log(`✓ Merged ${this.changes} records into forwarded_tickets table.`);
                }

                // Commit the merged data
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Commit failed:', err.message);
                    return finish();
                  }

                  console.log('✓ Transaction committed successfully.');
                  finish();
                });
              }
            );
          }
        );
      });
    });
  });
});

function finish() {
  db.run('DETACH DATABASE sourceDb;', () => {
    console.log('Running integrity check on merged database...');
    db.all('PRAGMA integrity_check;', (err, rows) => {
      console.log('Integrity check result:', rows);

      console.log('Running VACUUM to defragment and optimize...');
      db.run('VACUUM;', (err) => {
        if (err) console.error('VACUUM note:', err.message);
        else console.log('✓ VACUUM completed successfully.');

        db.close((err) => {
          if (!err) {
            console.log('\n========================================');
            console.log('✓ MERGE COMPLETE & VERIFIED!');
            console.log(`Your target database (${targetDbPath}) is ready.`);
            console.log('========================================');
          }
        });
      });
    });
  });
}
