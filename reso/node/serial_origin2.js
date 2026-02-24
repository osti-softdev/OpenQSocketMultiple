const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "/config/db.db");
const { getAllServices } = require("./db");
const { getPHDateTime } = require("./datetime");

// Store multiple ports
let ports = new Map();
let portCheckInterval = null;
let isShuttingDown = false;
const PORT_CHECK_INTERVAL_MS = 3000;

// List all serial ports
async function listSerialPorts() {
  try {
    return await SerialPort.list();
  } catch (err) {
    console.error("Error listing serial ports:", err.message);
    return [];
  }
}

// Detect Arduino ports
async function findArduinoPorts() {
  const allPorts = await listSerialPorts();
  const identifiers = [
    { vendorId: "1A86", productId: "7523" }, // CH340
    { vendorId: "2341", productId: "0043" }, // Uno
    { vendorId: "2341", productId: "0001" }, // Mega
    { vendorId: "0403", productId: "6001" }, // FT232R
    { vendorId: "0843", productId: "5740" }, // ATmega328P
  ];

  return allPorts.filter((port) => {
    return (
      (port.vendorId &&
        port.productId &&
        identifiers.some(
          (id) =>
            port.vendorId.toLowerCase() === id.vendorId.toLowerCase() &&
            port.productId.toLowerCase() === id.productId.toLowerCase()
        )) ||
      (port.manufacturer && port.manufacturer.toLowerCase().includes("arduino"))
    );
  });
}

// Cleanup all serial ports
async function cleanupSerialPorts() {
  isShuttingDown = true;

  if (portCheckInterval) {
    clearInterval(portCheckInterval);
    portCheckInterval = null;
  }

  for (let [path, { port }] of ports) {
    if (port.isOpen) {
      await new Promise((resolve) => port.close(resolve));
      console.log(`✅ Closed port ${path}`);
    }
  }
  ports.clear();
  isShuttingDown = false;
}

// Open and handle a single port
function setupPort(portInfo) {
  if (ports.has(portInfo.path)) return;

  console.log(`🔌 Opening port: ${portInfo.path}`);
  const port = new SerialPort({ path: portInfo.path, baudRate: 9600, autoOpen: true });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  port.on("open", () => console.log(`✅ Port ${portInfo.path} opened`));
  port.on("close", () => {
    console.log(`🔌 Port ${portInfo.path} closed`);
    ports.delete(portInfo.path);
  });
  port.on("error", (err) => console.error(`❌ Port ${portInfo.path} error:`, err.message));

  parser.on("data", async (data) => handleKey(port, data.trim(), portInfo.path));

  ports.set(portInfo.path, { port, parser });
}

// Handle keys from Arduino
async function handleKey(port, key, portPath) {
  if (!/^[0-9A-Z#]$/.test(key)) {
    console.log(`ℹ️ [${portPath}] Ignored: "${key}"`);
    return;
  }

  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
  const { date, time } = getPHDateTime();
  const topline = "Topline";

  try {
    const services = await getAllServices();

    // === Ticket creation (2..9) ===
    if (/^[2-9]$/.test(key)) {
      const index = parseInt(key) - 2;
      const service = services[index];
      if (!service || !service.regular) return db.close();

      db.get(
        `SELECT MAX(ticketnum) as maxTicket FROM transactions WHERE sname=? AND ticketservice=? AND date=?`,
        [service.sname, service.regular, date],
        (err, row) => {
          if (err) return console.error("Max ticket error:", err.message);

          const ticketNumber = row?.maxTicket ? row.maxTicket + 1 : 1;
          const historyEntry = `${time}-${topline}-Inserted`;

          db.run(
            `INSERT INTO transactions (ticketnum, sname, ticketservice, status, date, time, history)
             VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
            [ticketNumber, service.sname, service.regular, date, time, historyEntry],
            (err) => {
              if (err) return console.error("Insert error:", err.message);
console.log(index);
              const displayText = `${service.regular}${ticketNumber}`;
              console.log(`[${portPath}] Ticket: ${displayText}`);
              if (port.isOpen) port.write(displayText + "\n");
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

      let index;
      if (key === "A") {
        // Call first pending ticket of any service
        db.get(
          `UPDATE transactions
           SET status='calling', start_time=?, history=CASE WHEN history IS NULL OR history='' THEN ? ELSE history||';'||? END
           WHERE id=(SELECT id FROM transactions WHERE status='pending' AND date=? ORDER BY date ASC, time ASC LIMIT 1)
           RETURNING ticketnum, sname, ticketservice, status`,
          [startTime, historyEntry, historyEntry, date],
          (err, row) => {
            if (err) console.error("Update error:", err.message);
            else if (row && port.isOpen) port.write(JSON.stringify(row) + "\n");
            db.close();
          }
        );
      } else {
        // Map B,C,D dynamically to services array
        const letterMap = { B: 0, C: 1, D: 2 };
        index = letterMap[key];
        const service = services[index];
        if (!service) return db.close();

        db.get(
          `UPDATE transactions
           SET status='calling', start_time=?, history=CASE WHEN history IS NULL OR history='' THEN ? ELSE history||';'||? END
           WHERE id=(SELECT id FROM transactions WHERE status='pending' AND sname=? AND ticketservice=? AND date=? ORDER BY date ASC, time ASC LIMIT 1)
           RETURNING ticketnum, sname, ticketservice, status`,
          [startTime, historyEntry, historyEntry, service.sname, service.regular, date],
          (err, row) => {
            if (err) console.error("Update error:", err.message);
            else if (row && port.isOpen) port.write(JSON.stringify(row) + "\n");
            db.close();
          }
        );
      }
    }

    // === Recalling (#) ===
    else if (key === "#") {
      const historyEntry = `${time}-${topline}-Recalling`;
      db.get(
        `UPDATE transactions SET status='calling', history=CASE WHEN history IS NULL OR history='' THEN ? ELSE history||';'||? END
         WHERE id=(SELECT id FROM transactions WHERE status='called' AND date=? ORDER BY start_time DESC LIMIT 1)
         RETURNING ticketnum, sname, ticketservice, status`,
        [historyEntry, historyEntry, date],
        (err, row) => {
          if (err) console.error("Update # error:", err.message);
          else if (row && port.isOpen) port.write(JSON.stringify(row) + "\n");
          db.close();
        }
      );
    }

    // === Voided (0) ===
    else if (key === "0") {
      const historyEntry = `${time}-${topline}-Voided`;
      db.get(
        `UPDATE transactions SET status='voided', end_time=?, history=CASE WHEN history IS NULL OR history='' THEN ? ELSE history||';'||? END
         WHERE id=(SELECT id FROM transactions WHERE status='called' AND date=? ORDER BY start_time DESC LIMIT 1)
         RETURNING ticketnum, sname, ticketservice, status`,
        [time, historyEntry, historyEntry, date],
        (err, row) => {
          if (err) console.error("Update 0 error:", err.message);
          else if (row && port.isOpen) port.write(JSON.stringify(row) + "\n");
          db.close();
        }
      );
    }

    // === Feedback (5,6) ===
    else if (["5", "6"].includes(key)) {
      const query =
        key === "5"
          ? `INSERT INTO feedback (satisfied, date, time) VALUES (1, ?, ?)`
          : `INSERT INTO feedback (unsatisfied, date, time) VALUES (1, ?, ?)`;
      db.run(query, [date, time], (err) => {
        if (err) console.error("Insert feedback error:", err.message);
        db.close();
      });
    }
  } catch (err) {
    console.error("❌ Error processing key:", err.message);
    db.close();
  }
}

// Initialize Arduino ports with auto-reconnect
async function initializeSerialPort(io) {
  if (isShuttingDown) return;

  const arduinoPorts = await findArduinoPorts();

  // Remove disconnected ports
  for (const path of [...ports.keys()]) {
    if (!arduinoPorts.find((p) => p.path === path)) {
      const { port } = ports.get(path);
      if (port.isOpen) await new Promise((resolve) => port.close(resolve));
      ports.delete(path);
      console.log(`⚠️ Port disconnected: ${path}`);
    }
  }

  // Setup new ports
  arduinoPorts.forEach(setupPort);

  // Re-run every few seconds to detect plug/unplug
  if (!portCheckInterval) {
    portCheckInterval = setInterval(() => initializeSerialPort(io), PORT_CHECK_INTERVAL_MS);
  }
}

module.exports = { initializeSerialPort, cleanupSerialPorts };
