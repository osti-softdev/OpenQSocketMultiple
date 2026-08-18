const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { getPHDateTime } = require('../../config/datetime');

const rootpath =
  global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "/config/db.db");
let watcherAdded = false;
const dateRanges = new Map();

/**
 * Fetch all services with their latest ticket (filtered by date range)
 */
async function getadmindata(datefrom, dateto) {
  const { date: today } = getPHDateTime();

  // Use today if no inputs
  datefrom = datefrom || today;
  dateto = dateto || today;

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    // Ensure all services show up, even if no transactions
    const query = `
      SELECT 
        s.sname,
        COALESCE(SUM(CASE WHEN t.status IN ('finished','called','calling') THEN 1 ELSE 0 END), 0) AS called_count,
        COALESCE(SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count,
        COALESCE(SUM(CASE WHEN t.status = 'voided' THEN 1 ELSE 0 END), 0) AS voided_count,
        COALESCE(COUNT(t.id), 0) AS total_count
      FROM services s
      LEFT JOIN transactions t 
        ON s.sname = t.sname AND t.date BETWEEN ? AND ? WHERE s.status != 0
      GROUP BY s.sname
      ORDER BY s.sname
    `;

    db.all(query, [datefrom, dateto], (err, rows) => {
      if (err) {
        db.close();
        return reject(err);
      }

      const overall = rows.reduce(
        (acc, row) => {
          acc.called_count += row.called_count || 0;
          acc.pending_count += row.pending_count || 0;
          acc.voided_count += row.voided_count || 0;
          acc.total_count += row.total_count || 0;
          return acc;
        },
        { called_count: 0, pending_count: 0, voided_count:0, total_count: 0 }
      );

      const feedbackQuery = `
        SELECT
          COALESCE(SUM(CASE WHEN satisfied = 1 THEN 1 ELSE 0 END), 0) AS satisfied,
          COALESCE(SUM(CASE WHEN unsatisfied = 1 THEN 1 ELSE 0 END), 0) AS unsatisfied
        FROM feedback
        WHERE date BETWEEN ? AND ?
      `;

      db.get(feedbackQuery, [datefrom, dateto], (err, feedbackRow) => {
        db.close();
        if (err) return reject(err);

        resolve({
          datefrom,
          dateto,
          services: rows || [],
          overall,
          satisfied: feedbackRow?.satisfied || 0,
          unsatisfied: feedbackRow?.unsatisfied || 0,
        });
      });
    });
  });
}

/**
 * Setup watcher for services display updates
 */
function adminoveralldatawatcher(socket, io) {
  const { date: today } = getPHDateTime();

  // Listen for client requests with date range
  socket.on("requestAdminData", async ({ datefrom, dateto } = {}) => {
    datefrom = datefrom || today;
    dateto = dateto || today;
    dateRanges.set(socket.id, { from: datefrom, to: dateto });
    await sendadmindata(socket, datefrom, dateto);
  });

  // On disconnect, clean up map
  socket.on("disconnect", () => {
    dateRanges.delete(socket.id);
    // console.log("🔌 Client disconnected, removed date range");
  });

  // Watch DB for changes
  if (!watcherAdded) {
    fs.watchFile(dbPath, { interval: 500 }, async () => {
      for (const [sid, range] of dateRanges) {
        const s = io.sockets.sockets.get(sid);
        if (s) {
          try {
            const data = await getadmindata(range.from, range.to);
            s.emit("dashadmindataupdate", data);
          } catch (err) {
            console.error(`❌ Error fetching for socket ${sid}:`, err);
            s.emit("dashadmindataupdate", []);
          }
        }
      }
    });
    watcherAdded = true;
  }

  async function sendadmindata(target, datefrom, dateto) {
    try {
      const adminoveralldata = await getadmindata(datefrom, dateto);
      target.emit("dashadmindataupdate", adminoveralldata);
    } catch (err) {
      console.error("❌ Error fetching services display:", err);
      target.emit("dashadmindataupdate", []);
    }
  }
}

module.exports = { adminoveralldatawatcher };
