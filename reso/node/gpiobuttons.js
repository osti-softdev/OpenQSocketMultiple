// reso/node/gpiobuttons.js
// Raspberry Pi GPIO Button Handler (Pi 5 Optimized)
// Uses a Python bridge to leverage gpiozero for reliable Pi 5 support

const { spawn } = require("child_process");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { getAllServices } = require("./db");
const { getPHDateTime } = require("./datetime");

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
async function processButtonPress(key) {
  // console.log(`🔘 Button pressed: ${key}`);

  try {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
    const { date, time } = getPHDateTime();
    const topline = "Topline";

    // === Ticket creation 2..4 ===
    if (/^[1-2]$/.test(key)) {
      const services = await getAllServices();
      const index = parseInt(key) - 2;
      const service = services[index];
      if (!service || !service.regular) {
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
                const displayText = `${service.regular}${ticketNumber}`;
                console.log(`✅ Ticket created: ${displayText}`);
                sendToLCD(displayText);
              } else {
                console.error("Insert error:", err.message);
              }
              db.close();
            }
          );
        }
      );
    }

    // === Call next ticket (A,B,C,D) ===
    else if (/^[4-5]$/.test(key)) {
      const startTime = time;
      const historyEntry = `${time}-${topline}-Calling`;
      console.log(`Calling next ticket for key ${key}...`);

      if (key === "4") {
        const query = `
          UPDATE transactions 
          SET status = 'calling',  counter_user=?, start_time = ?, 
            history = CASE 
              WHEN history IS NULL OR history = '' THEN ? 
              ELSE history || ';' || ? END
          WHERE id = (
            SELECT id FROM transactions 
            WHERE status = 'pending' AND date = ?
            ORDER BY date ASC, time ASC
            LIMIT 1
          )
          RETURNING ticketnum, sname, ticketservice, status
        `;
        db.get(query, [topline, startTime, historyEntry, historyEntry, date], (err, row) => {
          if (err) console.error("Update error:", err.message);
          else if (row){
           sendToLCD(`${row.ticketservice}${row.ticketnum}`);
            console.log(`✅ Ticket called:`, row);
          }
            db.close();
        });
      } else {
        const services = await getAllServices();
        const index = key.charCodeAt(0) - "B".charCodeAt(0); // B=0, C=1, D=2
        const service = services[index];
        if (!service || !service.regular) {
          db.close();
          return;
        }

        const query = `
          UPDATE transactions 
          SET status = 'calling', counter_user='Designated Counter', start_time = ?, 
            history = CASE 
              WHEN history IS NULL OR history = '' THEN ? 
              ELSE history || ';' || ? END
          WHERE id = (
            SELECT id FROM transactions 
            WHERE status = 'pending' 
            AND sname = ? AND ticketservice = ? AND date = ?
            ORDER BY date ASC, time ASC
            LIMIT 1
          )
          RETURNING ticketnum, sname, ticketservice, status
        `;
        db.get(
          query,
          [startTime, historyEntry, historyEntry, service.sname, service.regular, date],
          (err, row) => {
            if (err) {
              console.error("Update error:", err.message);
            } else if (!row) {
              console.log("⚠️  No matching ticket found");
            } else {
              console.log(`✅ Ticket called:`, row);
              sendToLCD(`${row.ticketservice}${row.ticketnum}`);
            }
            db.close();
          }
        );
      }
    }

    // === Recalling (#) ===
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
          console.log("⚠️  No matching ticket to recall");
        } else {
          console.log(`✅ Ticket recalled:`, row);
          sendToLCD(`${row.ticketservice}${row.ticketnum}`);
        }
        db.close();
      });
    }

    // === Voided (0) ===
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
          console.log("⚠️  No matching ticket to void");
        } else {
          console.log(`✅ Ticket voided:`, row);
          sendToLCD(`${row.ticketservice}${row.ticketnum}`);
        }
        db.close();
      });
    }

    // === Feedback (5,6) ===
    else if (["7", "8"].includes(key)) {
      const query =
        key === "5"
          ? `INSERT INTO feedback (satisfied, date, time) VALUES (1,?,?)`
          : `INSERT INTO feedback (unsatisfied, date, time) VALUES (1,?,?)`;
      db.run(query, [date, time], (err) => {
        if (err) {
          console.error("Insert feedback error:", err.message);
        } else {
          console.log(`✅ Feedback recorded: ${key === "5" ? "Satisfied" : "Unsatisfied"}`);
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
  const bridgePath = path.join(__dirname, "../../gpio_bridge.py");

  // Spawn Python process
  pythonProcess = spawn("python3", [bridgePath]);

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
