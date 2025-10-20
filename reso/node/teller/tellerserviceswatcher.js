const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const rootpath =
  global.outfolderPath || path.join(__dirname, "../../outfolder");

const dbPath = path.join(rootpath, "/config/db.db");
let watcherAdded = false;
const { getPHDateTime } = require("../datetime");

async function gettellersandgroups(id, cnum, group_name) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    const queryCounters = `
      SELECT id, cname, cnum, group_name
      FROM counters
      WHERE NOT (id = ? AND cnum = ? AND group_name = ?)
    `;

    const queryGroups = `
      SELECT DISTINCT group_name
      FROM counter_groups
      WHERE group_name IS NOT NULL
      ORDER BY id ASC
    `;

    db.all(queryCounters, [id, cnum, group_name], (err, tellerRows) => {
      if (err) {
        db.close();
        return reject(err);
      }

      db.all(queryGroups, [], (err2, groupRows) => {
        db.close();
        if (err2) return reject(err2);

        resolve({
          tellers: tellerRows || [],
          groups: groupRows || []
        });
      });
    });
  });
}
async function getTellerServices(id, cuser, cnum, cname, group_name) {
  const { date, time } = getPHDateTime();

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    const query = `
      SELECT id, cname, cuser, cnum, services, group_name 
      FROM counters 
      WHERE id = ? AND cuser = ? AND cnum = ?
    `;

    db.get(query, [id, cuser, cnum], async (err, row) => {
      if (err) {
        db.close();
        return reject(err);
      }
      if (!row) {
        db.close();
        return resolve(null);
      }

      try {
        const serviceList = row.services
          ? row.services.split(",").map((s) => s.trim())
          : [];

        const serviceData = [];

        for (const s of serviceList) {
          const serviceInfo = await new Promise((res, rej) => {
            db.get(
              `SELECT regular, priority FROM services WHERE sname = ?`,
              [s],
              (err, svcRow) => {
                if (err) return rej(err);
                res(svcRow || null);
              }
            );
          });

          if (serviceInfo) {
            const regCount = await new Promise((res, rej) => {
              db.get(
                `
                  SELECT COUNT(*) as cnt 
                  FROM transactions
                  WHERE ticketservice = ?
                    AND status = 'pending'
                    AND date = ?
                `,
                [serviceInfo.regular, date],
                (err, row) => {
                  if (err) return rej(err);
                  res(row?.cnt || 0);
                }
              );
            });

            const priCount = await new Promise((res, rej) => {
              db.get(
                `
                  SELECT COUNT(*) as cnt 
                  FROM transactions
                  WHERE ticketservice = ?
                    AND status = 'pending'
                    AND date = ?
                `,
                [serviceInfo.priority, date],
                (err, row) => {
                  if (err) return rej(err);
                  res(row?.cnt || 0);
                }
              );
            });

            serviceData.push({
              sname: s,
              regular: serviceInfo.regular,
              priority: serviceInfo.priority,
              pendingRegular: regCount,
              pendingPriority: priCount,
            });
          } else {
            serviceData.push({
              sname: s,
              regular: null,
              priority: null,
              pendingRegular: 0,
              pendingPriority: 0,
            });
          }
        }

        // Get all pending list
        const allPendingList = await new Promise((res, rej) => {
          db.all(
            `
              SELECT ticketnum, ticketservice, id, time 
              FROM transactions
              WHERE status = 'pending'
                AND date = ?
            `,
            [date],
            (err, rows) => {
              if (err) return rej(err);
              res(rows || []);
            }
          );
        });

        // Get held list (specific to counter_num)
        const heldList = await new Promise((res, rej) => {
          db.all(
            `
              SELECT ticketnum, ticketservice, start_time, id 
              FROM transactions
              WHERE status = 'held'
                AND counter_num = ? AND counter_user = ?
                AND date = ?
            `,
            [cnum, cname, date],
            (err, rows) => {
              if (err) return rej(err);
              res(rows || []);
            }
          );
        });

        // Get received list (specific to counter_num)
          const receivedList = await new Promise((res, rej) => {
            db.all(
              `
              SELECT ticketnum, ticketservice, start_time, id
              FROM transactions
              WHERE status = 'received'
                AND date = ?
                AND (
                  -- Case 1: Has counter_num only
                  (counter_num IS NOT NULL AND counter_group IS NULL AND counter_num = ?)
                  OR
                  -- Case 2: Has counter_group only
                  (counter_group IS NOT NULL AND counter_num IS NULL AND counter_group = ?)
                  OR
                  -- Case 3: Has both counter_num and counter_group (prefer specific counter)
                  (counter_num IS NOT NULL AND counter_group IS NOT NULL AND counter_num = ?)
                )
              `,
              [date, cnum, group_name, cnum],
              (err, rows) => {
                if (err) return rej(err);
                res(rows || []);
              }
            );
          });

        db.close();
        resolve({
          ...row,
          serviceData,
          totalPending: allPendingList.length,
          allPendingList,
          heldList,
          heldCount: heldList.length,
          receivedList,
          receivedCount: receivedList.length,
        });
      } catch (e) {
        db.close();
        reject(e);
      }
    });
  });
}
async function getTellerCalledticket(cnum, cname) {
    const { date, time } = getPHDateTime();
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    const query = `
      SELECT id, ticketnum, ticketservice, sname
      FROM transactions
      WHERE (status = "calling" OR status = "called")
        AND counter_num = ?
        AND counter_user = ?
        AND date = ?
      ORDER BY start_time DESC
      LIMIT 1;
    `;

    db.get(query, [cnum, cname, date], (err, row) => {
      db.close();

      if (err) {
        return reject(err);
      }

      if (!row) {
        return resolve(null);
      }

      resolve({
        id: row.id,
        ticketnum: row.ticketnum,
        ticketservice: row.ticketservice,
        sname: row.sname,
      });
    });
  });
}
async function updatecallticket(callingcode, tickid, tickstatus, tickwherestatus, cnum, cname, tickcode, dataadditional, group_name) {
  const { date, time } = getPHDateTime();

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) return reject(err);
    });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // REGCALL or PRIOCALL — finish previous, then call new
      if (callingcode === "regcall" || callingcode === "priocall") {
        const finishEntry = `[${time}-${cname}-AutoFinished]`;
        const finishQuery = `
          UPDATE transactions
          SET 
            status = 'finished',
            end_time = ?,
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
          WHERE id = (
            SELECT id FROM transactions
            WHERE 
              (status = 'calling' OR status = 'called')
              AND counter_num = ?
              AND counter_user = ?
              AND date = ?
            ORDER BY start_time DESC
            LIMIT 1
          )
        `;
        db.run(finishQuery, [time, finishEntry, finishEntry, cnum, cname, date], function (err) {
          if (err) {
            db.run("ROLLBACK");
            db.close();
            return reject(err);
          }

          const startEntry = `[${time}-${cname}-Called]`;
          const updateQuery = `
            UPDATE transactions
            SET 
              counter_num = ?, 
              counter_user = ?, 
              counter_group = ?,
              status = ?, 
              start_time = ?,
              history = CASE
                WHEN history IS NULL OR history = '' THEN ?
                ELSE history || ';' || ?
              END
            WHERE id = (
              SELECT id FROM transactions
              WHERE status = ? 
                AND ticketservice = ? 
                AND date = ?
              ORDER BY id ASC
              LIMIT 1
            )
          `;
          const updateParams = [
            cnum, cname,group_name, tickstatus, time,
            startEntry, startEntry,
            tickwherestatus, tickcode, date
          ];

          db.run(updateQuery, updateParams, function (err2) {
            if (err2) {
              db.run("ROLLBACK");
              db.close();
              return reject(err2);
            }

            db.run("COMMIT", (commitErr) => {
              db.close();
              if (commitErr) return reject(commitErr);
              resolve({
                success: this.changes > 0,
                affected: this.changes,
                statusdata: callingcode
              });
            });
          });
        });
      }

      // RECALL
      else if (callingcode === "recall") {
        const recallEntry = `[${time}-${cname}-Recalled]`;
        const query = `
          UPDATE transactions
          SET 
            status = ?, 
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
          WHERE 
            id = ? AND ticketservice = ? 
            AND counter_num = ? AND counter_user = ? 
            AND date = ?
        `;
        const params = [
          tickstatus, recallEntry, recallEntry,
          tickid, tickcode, cnum, cname, date
        ];
        db.run(query, params, function (err) {
          if (err) {
            db.run("ROLLBACK");
            db.close();
            return reject(err);
          }
          db.run("COMMIT", (commitErr) => {
            db.close();
            if (commitErr) return reject(commitErr);
            resolve({
              success: this.changes > 0,
              affected: this.changes,
              statusdata: callingcode
            });
          });
        });
      }

      // HOLD
      else if (callingcode === "hold") {
        const holdEntry = `[${time}-${cname}-Held]`;
        const query = `
          UPDATE transactions
          SET 
            status = ?, 
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END 
          WHERE 
            id = ? AND ticketservice = ? 
            AND counter_num = ? AND counter_user = ? 
            AND date = ?
        `;
        const params = [
          tickstatus,
          holdEntry, holdEntry,
          tickid, tickcode, cnum, cname, date
        ];
        db.run(query, params, function (err) {
          if (err) {
            db.run("ROLLBACK");
            db.close();
            return reject(err);
          }
          db.run("COMMIT", (commitErr) => {
            db.close();
            if (commitErr) return reject(commitErr);
            resolve({
              success: this.changes > 0,
              affected: this.changes,
              statusdata: callingcode
            });
          });
        });
      }

      // VOID
      else if (callingcode === "void") {
        const voidEntry = `[${time}-${cname}-Void(${dataadditional})]`;
        const query = `
          UPDATE transactions
          SET 
            status = ?, 
            void_reason = ?,
            end_time = ?,
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END 
          WHERE 
            id = ? AND ticketservice = ? 
            AND counter_num = ? AND counter_user = ? 
            AND date = ?
        `;
        const params = [
          tickstatus, dataadditional,time,
          voidEntry, voidEntry,
          tickid, tickcode, cnum, cname, date
        ];
        db.run(query, params, function (err) {
          if (err) {
            db.run("ROLLBACK");
            db.close();
            return reject(err);
          }
          db.run("COMMIT", (commitErr) => {
            db.close();
            if (commitErr) return reject(commitErr);
            resolve({
              success: this.changes > 0,
              affected: this.changes,
              statusdata: callingcode
            });
          });
        });
      }

      // FINISH
      else if (callingcode === "finish") {
        const finishEntry = `[${time}-${cname}-Finished]`;
        const query = `
          UPDATE transactions
          SET 
            status = ?, 
            end_time = ?, 
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END 
          WHERE 
            id = ? AND ticketservice = ? 
            AND counter_num = ? AND counter_user = ? 
            AND date = ?
        `;
        const params = [
          tickstatus, time,
          finishEntry, finishEntry,
          tickid, tickcode, cnum, cname, date
        ];
        db.run(query, params, function (err) {
          if (err) {
            db.run("ROLLBACK");
            db.close();
            return reject(err);
          }
          db.run("COMMIT", (commitErr) => {
            db.close();
            if (commitErr) return reject(commitErr);
            resolve({
              success: this.changes > 0,
              affected: this.changes,
              statusdata: callingcode
            });
          });
        });
      }

      // FORWARD
       else if (callingcode === "forward") {
        let counter_num = null;
        let counter_group = null;
        let counter_user = null;

        // Parse dataadditional (example: "5_n" or "CASHIER_g")
        if (typeof dataadditional === "string") {
          if (dataadditional.endsWith("_n")) {
            counter_num = dataadditional.replace("_n", "");
            // If forwarding to a numbered counter, clear others
            counter_group = "";
            counter_user = "";
          } else if (dataadditional.endsWith("_g")) {
            counter_group = dataadditional.replace("_g", "");
            // If forwarding to a group, clear others
            counter_num = "";
            counter_user = "";
          }
        }

        const forwardEntry = `[${time}-${cname}-Forwarded(${dataadditional})]`;

        const query = `
          UPDATE transactions
          SET 
            status = ?, 
            end_time = ?, 
            counter_num = ?, 
            counter_group = ?, 
            counter_user = ?, 
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END 
          WHERE 
            id = ? AND ticketservice = ? 
            AND counter_num = ? AND counter_user = ? 
            AND date = ?
        `;

        const params = [
          tickstatus, time,
          counter_num, counter_group, counter_user,
          forwardEntry, forwardEntry,
          tickid, tickcode, cnum, cname, date
        ];

        db.run(query, params, function (err) {
          if (err) {
            db.run("ROLLBACK");
            db.close();
            return reject(err);
          }
          db.run("COMMIT", (commitErr) => {
            db.close();
            if (commitErr) return reject(commitErr);
            resolve({
              success: this.changes > 0,
              affected: this.changes,
              statusdata: callingcode
            });
          });
        });
      }
      
       // NAVCALL
      else if (callingcode === "navcall") {
        const navCalledEntry = `[${time}-${cname}-Called]`;
        const autoFinishEntry = `[${time}-${cname}-AutoFinished]`;

        // Step 1: Auto-finish any previously called or calling ticket
        const finishPrevQuery = `
          UPDATE transactions
          SET 
            status = 'finished',
            end_time = ?,
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
          WHERE id = (
            SELECT id FROM transactions
            WHERE 
              (status = 'calling' OR status = 'called')
              AND counter_num = ?
              AND counter_user = ?
              AND date = ?
            ORDER BY start_time DESC
            LIMIT 1
          )
        `;

        db.run(finishPrevQuery, [time, autoFinishEntry, autoFinishEntry, cnum, cname], function (finishErr) {
          if (finishErr) {
            db.run("ROLLBACK");
            db.close();
            return reject(finishErr);
          }

          // Step 2: Call the new ticket
          let query = "";
          let params = [];

          if (tickwherestatus === "pending") {
            query = `
              UPDATE transactions
              SET 
                status = ?, 
                counter_num = ?, 
                counter_user = ?,
                counter_group = ?,
                start_time = ?,
                history = CASE
                  WHEN history IS NULL OR history = '' THEN ?
                  ELSE history || ';' || ?
                END
              WHERE 
                id = ? 
                AND ticketservice = ? 
                AND date = ?
            `;
            params = [
              tickstatus, cnum, cname,group_name, time,
              navCalledEntry, navCalledEntry,
              tickid, tickcode, date
            ];
          } else {
            query = `
              UPDATE transactions
              SET 
                status = ?, 
                start_time = ?,
                counter_num = ?, 
                counter_user = ?,
                counter_group = ?,
                history = CASE
                  WHEN history IS NULL OR history = '' THEN ?
                  ELSE history || ';' || ?
                END
              WHERE 
                id = ? 
                AND ticketservice = ? 
                AND (counter_num = ? OR counter_user = ? OR counter_group = ?)
                AND date = ?
            `;
            params = [
              tickstatus, time, cnum, cname, group_name,
              navCalledEntry, navCalledEntry,
              tickid, tickcode, cnum, cname, group_name, date
            ];
          }

          db.run(query, params, function (err) {
            if (err) {
              db.run("ROLLBACK");
              db.close();
              return reject(err);
            }

            db.run("COMMIT", (commitErr) => {
              db.close();
              if (commitErr) return reject(commitErr);
              resolve({
                success: this.changes > 0,
                affected: this.changes,
                statusdata: callingcode
              });
            });
          });
        });
      }
    });
  });
}

/**
 * Setup watcher for teller data updates
 */
function setupTellerWatcher(socket, io) {
  socket.on("gettellerservices", async (data) => {
    await sendTellerData(socket, data);
  });
  socket.on("gettellersandgroups", async (data) => {
    await sendTellerData(socket, data);
  });
  socket.on("getandupdatecalledtick", async (data) => {
  await updatecalledtick(socket, data);
});
  if (!watcherAdded) {
    fs.watchFile(dbPath, { interval: 500 }, async () => {
      io.emit("reloadtellerservices");
    });
    watcherAdded = true;
  }

  async function sendTellerData(target, data) {
    try {
      const { id, cuser, cnum, cname, group_name } = data;
      const tellerandgroups = await gettellersandgroups(id, cnum, group_name);
      const teller = await getTellerServices(id, cuser, cnum, cname, group_name);
      const calledticket = await getTellerCalledticket(cnum, cname);
      target.emit("updatetellersandgroups", tellerandgroups);
      target.emit("updatetellerservices", teller);
      target.emit("calledticketdata", calledticket);
    } catch (err) {
      console.error("❌ Error fetching teller services:", err);
      target.emit("updatetellersandgroups", null);
      target.emit("updatetellerservices", null);
      target.emit("calledticketdata", null);
    }
  }
  async function updatecalledtick(target, data) {
    try {
      const { callingcode, tickid, tickstatus, tickwherestatus, cnum, cname, tickcode, dataadditional, group_name } = data;
      const called = await updatecallticket(callingcode, tickid, tickstatus, tickwherestatus, cnum, cname, tickcode, dataadditional, group_name);
      io.emit("calledtick", called);
    } catch (err) {
      console.error("❌ Error fetching called tickets:", err);
      io.emit("calledtick", null);
    }
  }
}

module.exports = { setupTellerWatcher };