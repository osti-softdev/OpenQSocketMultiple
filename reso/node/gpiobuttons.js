// reso/node/gpiobuttons.js
// Raspberry Pi GPIO Button Handler
// Replaces serial/Arduino button input with direct GPIO pins

const Gpio = require("onoff").Gpio;
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { getAllServices } = require("./db");
const { getPHDateTime } = require("./datetime");

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "config/db.db");

// === GPIO Configuration ===
// Map button names to GPIO pin numbers and their corresponding key values
const GPIO_BUTTON_CONFIG = {
  btn2: { pin: 17, key: "2" },     // Ticket service 2
  btn3: { pin: 27, key: "3" },     // Ticket service 3
  btn4: { pin: 22, key: "4" },     // Ticket service 4
  btnA: { pin: 10, key: "A" },     // Call next (Service A)
  btnB: { pin: 9, key: "B" },      // Call next (Service B)
  btnC: { pin: 11, key: "C" },     // Call next (Service C)
  btnD: { pin: 5, key: "D" },      // Call next (Service D)
  btnRecall: { pin: 6, key: "#" }, // Recall last ticket
  btnVoid: { pin: 13, key: "0" },  // Void ticket
  btnSatisfied: { pin: 19, key: "5" },   // Satisfied feedback
  btnUnsatisfied: { pin: 26, key: "6" }, // Unsatisfied feedback
};

// === State ===
let gpioButtons = new Map(); // { buttonName: Gpio instance }
let isShuttingDown = false;

// === Process button press (same logic as serialport.js) ===
async function processButtonPress(key) {
  console.log(`🔘 Button pressed: ${key}`);

  try {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
    const { date, time } = getPHDateTime();
    const topline = "Topline";

    // === Ticket creation 2..4 ===
    if (/^[2-4]$/.test(key)) {
      const services = await getAllServices();
      const index = parseInt(key) - 2;
      const service = services[index];
      if (!service || !service.regular) return db.close();

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
    else if (/^[ABCD]$/.test(key)) {
      const startTime = time;
      const historyEntry = `${time}-${topline}-Calling`;
      console.log(`Calling next ticket for key ${key}...`);

      if (key === "A") {
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
          else if (row) console.log(`✅ Ticket called:`, row);
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
            }
            db.close();
          }
        );
      }
    }

    // === Recalling (#) ===
    else if (key === "#") {
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
        }
        db.close();
      });
    }

    // === Voided (0) ===
    else if (key === "0") {
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
        }
        db.close();
      });
    }

    // === Feedback (5,6) ===
    else if (["5", "6"].includes(key)) {
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

// === Setup GPIO button ===
function setupGpioButton(buttonName, config) {
  try {
    console.log(`📌 Setting up GPIO button: ${buttonName} on pin ${config.pin}`);
    
    // Create GPIO input with pull-down resistor (active high)
    const gpio = new Gpio(config.pin, "in", "both", { debounceTimeout: 50 });

    // Watch for button press (rising edge = LOW to HIGH transition)
    gpio.watch((err, value) => {
      if (err) {
        console.error(`❌ GPIO error on pin ${config.pin}:`, err);
        return;
      }
      // value = 1 means button pressed (rising edge on active-high button)
      if (value === 1) {
        processButtonPress(config.key);
      }
    });

    gpioButtons.set(buttonName, gpio);
    console.log(`✅ GPIO button ${buttonName} ready on pin ${config.pin}`);
  } catch (err) {
    console.error(`❌ Failed to setup GPIO button ${buttonName}:`, err.message);
  }
}

// === Initialize all GPIO buttons ===
function initializeGPIO(io) {
  console.log("\n🚀 Initializing Raspberry Pi GPIO buttons...");
  
  if (gpioButtons.size > 0) {
    console.log("⚠️  GPIO buttons already initialized");
    return;
  }

  for (const [buttonName, config] of Object.entries(GPIO_BUTTON_CONFIG)) {
    setupGpioButton(buttonName, config);
  }

  console.log(`\n✨ GPIO button system ready with ${gpioButtons.size} buttons`);
}

// === Cleanup GPIO on shutdown ===
async function cleanupGPIO() {
  isShuttingDown = true;
  console.log("\n🛑 Cleaning up GPIO buttons...");

  for (let [buttonName, gpio] of gpioButtons) {
    try {
      if (!gpio.unexported()) {
        gpio.unexport();
      }
      console.log(`✅ Unexported GPIO button: ${buttonName}`);
    } catch (err) {
      console.error(`❌ Error unexporting ${buttonName}:`, err.message);
    }
  }

  gpioButtons.clear();
  isShuttingDown = false;
  console.log("✅ GPIO cleanup complete");
}

module.exports = { initializeGPIO, cleanupGPIO };
