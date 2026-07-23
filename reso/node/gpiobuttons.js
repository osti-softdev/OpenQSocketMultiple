// reso/node/gpiobuttons.js
// Raspberry Pi GPIO Button Handler (Pi 5 Optimized)
// Uses a Python bridge to leverage gpiozero for reliable Pi 5 support

const { spawn } = require("child_process");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { getAllServices } = require("./db");
const { getPHDateTime } = require("./datetime");
const { executephp } = require("./printergpio");

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "config/db.db");

// === State ===
let pythonProcess = null;
let isShuttingDown = false;

function sendToLCD(text) {
  if (pythonProcess && pythonProcess.stdin.writable) {
    pythonProcess.stdin.write(text + "\n");
  }
}
// === Process button press (same logic as serialport.js) ===
// === Process button press (same logic as serialport.js) ===
async function processButtonPress(key) {
  try {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
    const { date, time } = getPHDateTime();
    const topline = "Topline";

    // === Ticket creation 1 or 2 ===
    if (/^[1-2]$/.test(key)) {
      const services = await getAllServices();
      const index = parseInt(key) - 1; // 🔹 FIX: Changed from -2 to -1 so Key "1" targets index 0
      const service = services[index];

      if (!service || !service.regular) {
        // Log explicitly to console if services aren't populated yet
        console.warn(`⚠️ No database service found for Key: ${key} at index: ${index}`);
        db.close();
        return;
      }

      db.get(
        `SELECT MAX(ticketnum) as maxTicket FROM transactions WHERE sname=? AND ticketservice=? AND date=?`,
        [service.sname, service.regular, date],
        (err, row) => {
          if (err) {
            console.error("Max ticket error:", err.message);
            db.close();
            return;
          }

          const ticketNumber = row?.maxTicket ? row.maxTicket + 1 : 1;
          const historyEntry = `${time}-${topline}-Inserted`;

          db.run(
            `INSERT INTO transactions (ticketnum, sname, ticketservice, status, date, time, history) VALUES (?,?,?,?,?,?,?)`,
            [ticketNumber, service.sname, service.regular, "pending", date, time, historyEntry],
            (err) => {
              if (!err) {
                const displayText = `Created: ${service.regular}${ticketNumber}`;
                console.log(`✅ Ticket created: ${displayText}`);
                executephp(service.regular, ticketNumber, service.sname);
                sendToLCD(displayText); // 🔹 This safely pipes string back to Python to show on LCD
              } else {
                console.error("Insert error:", err.message);
              }
              db.close();
            }
          );
        }
      );
    }

    // === Call next ticket (4,5) ===
    else if (/^[4-5]$/.test(key)) {
      const services = await getAllServices();

      // Key 4 = first service, Key 5 = second service
      const index = parseInt(key) - 4;
      const service = services[index];

      if (!service || !service.regular) {
        console.warn(`⚠️ No database service found for Key: ${key} at index: ${index}`);
        db.close();
        return;
      }

      const startTime = time;
      const finishHistory = `${time}-${topline}-Finished`;
      const callHistory = `${time}-${topline}-Calling`;

      db.serialize(() => {
        // Finish previous called ticket for this counter/user
        db.run(
          `
      UPDATE transactions
      SET 
        status = 'finished',
        end_time = ?,
        history = CASE
          WHEN history IS NULL OR history = '' THEN ?
          ELSE history || ';' || ?
        END
      WHERE status = 'called'
        AND counter_user = ?
        AND date = ?
      `,
          [time, finishHistory, finishHistory, topline, date],
          (err) => {
            if (err) {
              console.error("Finish previous ticket error:", err.message);
              db.close();
              return;
            }

            // Call next pending ticket for selected service
            db.get(
              `
          UPDATE transactions 
          SET 
            status = 'calling',
            counter_user = ?,
            start_time = ?,
            history = CASE 
              WHEN history IS NULL OR history = '' THEN ? 
              ELSE history || ';' || ? 
            END
          WHERE id = (
            SELECT id FROM transactions 
            WHERE status = 'pending'
              AND sname = ?
              AND ticketservice = ?
              AND date = ?
            ORDER BY date ASC, time ASC
            LIMIT 1
          )
          RETURNING ticketnum, sname, ticketservice, status
          `,
              [
                topline,
                startTime,
                callHistory,
                callHistory,
                service.sname,
                service.regular,
                date
              ],
              (err, row) => {
                if (err) {
                  console.error("Call ticket error:", err.message);
                } else if (!row) {
                  console.log(`⚠️ No pending ticket found for ${service.regular}`);
                } else {
                  console.log(`✅ Ticket called:`, row);
                  sendToLCD(`${row.ticketservice}${row.ticketnum}`);
                }

                db.close();
              }
            );
          }
        );
      });
    }

    // === Recalling (6) ===
    else if (key === "6") {
      const historyEntry = `${time}-${topline}-Recalling`;
      const query = `
        UPDATE transactions
        SET status='calling', history=CASE WHEN history IS NULL OR history='' THEN ? ELSE history||';'||? END
        WHERE id=(SELECT id FROM transactions WHERE status='called' AND date=? ORDER BY start_time DESC LIMIT 1)
        RETURNING ticketnum, sname, ticketservice, status
      `;
      db.get(query, [historyEntry, historyEntry, date], (err, row) => {
        if (err) {
          console.error("Update # error:", err.message);
        } else if (!row) {
          console.log("⚠️ No matching ticket to recall");
        } else {
          console.log(`✅ Ticket recalled:`, row);
          sendToLCD(`Recalled: ${row.ticketservice}${row.ticketnum}`);
        }
        db.close();
      });
    }

    // === Voided (3) ===
    else if (key === "3") {
      const historyEntry = `${time}-${topline}-Voided`;
      const query = `
        UPDATE transactions
        SET status='voided', end_time=?, history=CASE WHEN history IS NULL OR history='' THEN ? ELSE history||';'||? END
        WHERE id=(SELECT id FROM transactions WHERE status='called' AND date=? ORDER BY start_time DESC LIMIT 1)
        RETURNING ticketnum, sname, ticketservice, status
      `;
      db.get(query, [time, historyEntry, historyEntry, date], (err, row) => {
        if (err) {
          console.error("Update 0 error:", err.message);
        } else if (!row) {
          console.log("⚠️ No matching ticket to void");
        } else {
          console.log(`✅ Ticket voided:`, row);
          sendToLCD(`Void: ${row.ticketservice}${row.ticketnum}`);
        }
        db.close();
      });
    }

    // === Feedback (7,8) ===
    else if (["7", "8"].includes(key)) {
      const query =
        key === "7"
          ? `INSERT INTO feedback (satisfied, date, time) VALUES (1,?,?)`
          : `INSERT INTO feedback (unsatisfied, date, time) VALUES (1,?,?)`;
      db.run(query, [date, time], (err) => {
        if (err) {
          console.error("Insert feedback error:", err.message);
        } else {
          console.log(`✅ Feedback recorded: ${key === "7" ? "Satisfied" : "Unsatisfied"}`);
        }
        db.close();
      });
    }
  } catch (err) {
    console.error("❌ Error processing button:", err.message);
  }
}

// === Initialize Python Bridge ===
function initializeGPIO(io) {
  console.log("\n🚀 Initializing Raspberry Pi 5 GPIO Bridge (via Python)...");

  if (pythonProcess) {
    console.log("⚠️  GPIO Bridge already running");
    return;
  }

  // Path to the bridge script
  // Path to the bridge script and your virtual environment's python binary
  const bridgePath = path.join(__dirname, "../../gpio_bridge.py");
  const venvPythonPath = path.join(__dirname, "../../venv/bin/python3");

  // Spawn using the venv python so it has access to RPLCD
  pythonProcess = spawn(venvPythonPath, [bridgePath]);

  // Handle incoming data (KEY:X)
  pythonProcess.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.startsWith("KEY:")) {
        const key = line.substring(4).trim();
        processButtonPress(key);
      }
    }
  });

  // Handle errors/debug from Python
  pythonProcess.stderr.on("data", (data) => {
    const msg = data.toString().trim();
    if (msg.startsWith("DEBUG:")) {
      console.log(`🐍 Python Bridge: ${msg.substring(6)}`);
    } else {
      console.error(`❌ Python Bridge Error: ${msg}`);
    }
  });

  pythonProcess.on("close", (code) => {
    if (!isShuttingDown) {
      console.warn(`⚠️  Python Bridge exited with code ${code}. Restarting in 5s...`);
      pythonProcess = null;
      setTimeout(() => initializeGPIO(io), 5000);
    }
  });

  console.log("✨ Node.js is now listening to the Python GPIO Bridge");
}

// === Cleanup GPIO on shutdown ===
async function cleanupGPIO() {
  isShuttingDown = true;
  console.log("\n🛑 Stopping Python GPIO Bridge...");

  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }

  console.log("✅ GPIO cleanup complete");
}

module.exports = { initializeGPIO, cleanupGPIO };
