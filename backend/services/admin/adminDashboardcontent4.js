const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { getPHDateTime } = require('../../config/datetime');

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "/config/db.db");

// --- Function to get paginated data ---
// --- Function to get paginated data ---
async function getalldata(start, length, order, search) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    // 🔹 Total count (only active services)
    const countQuery = `
      SELECT COUNT(*) as cnt 
      FROM transactions t
      JOIN services s ON t.sname = s.sname
      WHERE s.status != 0
    `;

    db.get(countQuery, [], (err, totalRow) => {
      if (err) { db.close(); return reject(err); }
      const recordsTotal = totalRow.cnt;

      // 🔹 Filtering
      let where = "WHERE s.status != 0";
      let params = [];
      if (search) {
        where += ` AND (t.sname LIKE ? OR t.ticketservice || t.ticketnum LIKE ? OR t.status LIKE ?)`;
        params = [`%${search}%`, `%${search}%`, `%${search}%`];
      }

      const filterQuery = `
        SELECT COUNT(*) as cnt 
        FROM transactions t
        JOIN services s ON t.sname = s.sname
        ${where}
      `;

      db.get(filterQuery, params, (err, filterRow) => {
        if (err) { db.close(); return reject(err); }
        const recordsFiltered = filterRow.cnt;

        // 🔹 Sorting
        const columns = ["t.sname", "t.ticketnum", "t.status", "t.time", "t.start_time", "t.end_time", "t.date"];
        const orderCol = columns[order[0].column] || "t.time";
        const orderDir = order[0].dir === "desc" ? "DESC" : "ASC";

        // 🔹 Data query
        const dataQuery = `
          SELECT 
            t.sname,
            t.ticketnum AS ticket,
            t.ticketservice AS service,  
            t.status,
            t.time,
            t.start_time,
            t.end_time,
            t.date,
            CASE 
              WHEN t.history IS NOT NULL AND t.history != '' THEN t.history
              ELSE (
                CASE 
                  WHEN t.status = 'finished' THEN '[' || t.time || '-' || t.sname || '-Finished]'
                  WHEN t.status = 'voided'   THEN '[' || t.time || '-' || t.sname || '-Voided]'
                  ELSE '[' || t.time || '-' || t.sname || '-Called]'
                END
              )
            END AS history
          FROM transactions t
          JOIN services s ON t.sname = s.sname
          ${where}
          ORDER BY ${orderCol} ${orderDir}
          LIMIT ? OFFSET ?
        `;

        db.all(dataQuery, [...params, length, start], (err, rows) => {
          db.close();
          if (err) return reject(err);
          resolve({ recordsTotal, recordsFiltered, data: rows });
        });
      });
    });
  });
}

// --- Socket.IO handler ---
function admincontent4alldata(socket, io) {
  socket.on("requestAdminDataforcontent4alldata", async ({ start=0, length=10, order=[{column:6,dir:"desc"}], search="" }) => {
    try {
      const result = await getalldata(start, length, order, search);
      socket.emit("dashadmincontent4alldata", result);
    } catch (err) {
      console.error("❌ Error fetching admin data:", err);
      socket.emit("dashadmincontent4alldata", {
        recordsTotal: 0,
        recordsFiltered: 0,
        data: []
      });
    }
  });
}

module.exports = { admincontent4alldata };
