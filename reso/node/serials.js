// reso/node/serialport-manager.js
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { getAllServices } = require("./db");
const { getPHDateTime } = require("./datetime");

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "config/db.db");

// === State ===
let ports = new Map();             // open serial ports
let portCheckInterval = null;      // interval for rescanning
let isShuttingDown = false;

// === List all serial ports ===
async function listSerialPorts() {
  try {
    return await SerialPort.list();
  } catch (err) {
    console.error("Error listing serial ports:", err.message);
    return [];
  }
}

// === Detect Arduino ports by vendor/product or manufacturer ===
async function findArduinoPorts() {
  const allPorts = await listSerialPorts();
  const identifiers = [
    { vendorId: "1A86", productId: "7523" }, // CH340
    { vendorId: "2341", productId: "0043" }, // Arduino Uno
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

// === Open a single Arduino port ===
function openArduinoPort(portInfo, io) {
  console.log(`🔌 Opening port: ${portInfo.path}`);

  const port = new SerialPort({ path: portInfo.path, baudRate: 9600, autoOpen: true });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  port.on("open", () => console.log(`✅ Port ${portInfo.path} opened`));
  port.on("close", () => {
    console.log(`🔌 Port ${portInfo.path} closed`);
    ports.delete(portInfo.path);
  });
  port.on("error", (err) => console.error(`❌ Port ${portInfo.path} error:`, err.message));

  parser.on("data", async (data) => {
    const key = data.trim();
    if (!/^[0-9A-Z#]$/.test(key)) {
      console.log(`ℹ️ [${portInfo.path}] Ignored: "${key}"`);
      return;
    }

    try {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
      const { date, time } = getPHDateTime();
      const topline = "Topline";

      // === Ticket creation 2..9 ===
      if (/^[2-9]$/.test(key)) {
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
              [ticketNumber, service.sname, service.regular, date, date, time, historyEntry],
              (err) => {
                if (!err && port.isOpen) {
                  const displayText = `${service.regular}${ticketNumber}`;
                  console.log(displayText);
                  port.write(displayText + "\n", (err) => {
                    if (err) console.error("❌ Write error:", err.message);
                  });
                } else if (err) console.error("Insert error:", err.message);
                db.close();
              }
            );
          }
        );
      }

      // === Call next ticket A,B,C,D ===
      else if (/^[ABCD]$/.test(key)) {
        const services = await getAllServices();
        const startTime = time;
        const historyEntry = `${time}-${topline}-Calling`;

        let index, service;
        if (key === "A") {
          index = 0;
          service = services[index];
        } else {
          index = key.charCodeAt(0) - "B".charCodeAt(0);
          service = services[index];
        }

        if (!service || !service.regular) return db.close();

        const query = `
          UPDATE transactions
          SET status='calling', start_time=?, history=CASE WHEN history IS NULL OR history='' THEN ? ELSE history||';'||? END
          WHERE id=(SELECT id FROM transactions WHERE status='pending' AND sname=? AND ticketservice=? AND date=? ORDER BY date ASC,time ASC LIMIT 1)
          RETURNING ticketnum, sname, ticketservice, status
        `;
        db.get(query, [startTime, historyEntry, historyEntry, service.sname, service.regular, date], (err, row) => {
          if (err) console.error("Update error:", err.message);
          else if (row && port.isOpen) port.write(JSON.stringify(row) + "\n");
          db.close();
        });
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
          if (err) console.error("Update # error:", err.message);
          else if (row && port.isOpen) port.write(JSON.stringify(row) + "\n");
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
          if (err) console.error("Update 0 error:", err.message);
          else if (row && port.isOpen) port.write(JSON.stringify(row) + "\n");
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
          if (err) console.error("Insert feedback error:", err.message);
          db.close();
        });
      }
    } catch (err) {
      console.error("❌ Error processing key:", err.message);
    }
  });

  ports.set(portInfo.path, { port, parser });
}

// === Main initialization: scan + interval ===
function initializeSerialPort(io) {
  if (portCheckInterval) return; // already running
  watchSerialPorts(io);           // initial scan
  portCheckInterval = setInterval(() => watchSerialPorts(io), 5000);
}

async function watchSerialPorts(io) {
  if (isShuttingDown) return;
  const arduinoPorts = await findArduinoPorts();
  for (const portInfo of arduinoPorts) {
    if (!ports.has(portInfo.path)) openArduinoPort(portInfo, io);
  }
}

// === Cleanup ports on shutdown ===
async function cleanupSerialPorts() {
  isShuttingDown = true;
  if (portCheckInterval) clearInterval(portCheckInterval);

  for (let [path, { port }] of ports) {
    if (port.isOpen) await new Promise((resolve) => port.close(resolve));
    console.log(`✅ Closed port ${path}`);
  }
  ports.clear();
  isShuttingDown = false;
}

module.exports = { initializeSerialPort, cleanupSerialPorts };
