// ==============================
// 📡 Wavecom Fastrack GSM Service (Reliable CMGS Version)
// ==============================
const { SerialPort } = require("serialport");
const fs = require("fs");
const path = require("path");

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const messagePath = path.join(rootpath, "config/message.json");

const BRANCH = process.env.BRANCH || "Main Branch";
let port;
let ioInstance = null;

// ------------------------------
// Utilities
// ------------------------------
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function formatNumberPH(number) {
  if (!number) return "";
  number = number.replace(/[\s\-()]/g, "");
  if (!/^\+?63\d{10}$|^0\d{10}$|^63\d{10}$/.test(number)) return "";
  if (number.startsWith("+63")) return number;
  if (number.startsWith("0")) return "+63" + number.slice(1);
  if (number.startsWith("63")) return "+" + number;
  return "+63" + number;
}

// ------------------------------
// Logger (Console Only)
// ------------------------------
function logStatus(name, number, status, service = "", ticket = "", type = "") {
  const utcTime = new Date().toISOString();
  const localTime = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });
  const fileRef = "[..\\node\\smsService.js:26]";

  if (name !== "SYSTEM") {
    console.log(
      `${utcTime} ${fileRef} ${localTime} | ${name} | ${number} | ${status} | ${service || "-"} | ${ticket || "-"} | ${type || "-"}`
    );
  } else {
    console.log(`${localTime} | SYSTEM | - | ${status}`);
  }

  if (ioInstance) {
    ioInstance.emit("smsLog", {
      utc: utcTime,
      local: localTime,
      name,
      number,
      status,
      service,
      ticket,
      type,
    });
  }
}

// ------------------------------
// Load and Format Messages
// ------------------------------
function loadMessages() {
  try {
    const raw = fs.readFileSync(messagePath, "utf-8");
    const parsed = JSON.parse(raw);
    const templates = {};

    Object.values(parsed).forEach((entry) => {
      if (entry.type && entry.message) {
        templates[entry.type.trim().toLowerCase()] = entry.message;
      }
    });

    console.log("📜 Loaded message templates:", Object.keys(templates));
    return templates;
  } catch (err) {
    console.error("❌ Failed to load messages.json:", err.message);
    return {};
  }
}

function formatMessage(template, data = {}) {
  if (!template) return "[TEMPLATE MISSING]";
  return template
    .replace(/#branch/g, BRANCH)
    .replace(/#counter/g, data.counter || "")
    .replace(/#ticket/g, data.ticket || "")
    .replace(/#service/g, data.service || "");
}

// ------------------------------
// GSM Modem Initialization
// ------------------------------
async function initializeGSM(io) {
  ioInstance = io;
  const portPath = process.env.SERIAL_PORT || "COM3";
  const baudRate = parseInt(process.env.SERIAL_BAUDRATE || "9600");

  try {
    port = new SerialPort({ path: portPath, baudRate, autoOpen: false });

    port.open(async (err) => {
      if (err) {
        logStatus("SYSTEM", "-", `❌ Failed to open ${portPath}: ${err.message}`);
        setTimeout(() => initializeGSM(io), 5000);
        return;
      }

      logStatus("SYSTEM", "-", `✅ Wavecom Fastrack opened on ${portPath}`);
      await delay(1500);

      try {
        await sendAT("AT");
        await sendAT("ATE0");
        await sendAT('AT+CSCS="GSM"');
        await sendAT("AT+CMGF=1");
        await sendAT('AT+CPMS="SM","SM","SM"');

        try {
          const sca = await sendAT("AT+CSCA?");
          if (!/\+63/.test(sca)) await sendAT('AT+CSCA="+639170000130"');
        } catch (e) {
          logStatus("SYSTEM", "-", `⚠️ SMSC config skipped: ${e.message}`);
        }

        const reg = await sendAT("AT+CREG?");
        if (!/0,[15]/.test(reg))
          logStatus("SYSTEM", "-", "⚠️ Not registered to network (CREG). SMS may fail.");
        else logStatus("SYSTEM", "-", "📡 Modem registered on network");

        logStatus("SYSTEM", "-", "📶 Modem ready for SMS");
      } catch (e) {
        logStatus("SYSTEM", "-", `⚠️ Init failed: ${e.message}`);
      }
    });

    port.on("error", (err) => logStatus("SYSTEM", "-", `❌ Port error: ${err.message}`));
    port.on("close", () => {
      logStatus("SYSTEM", "-", "🔌 Modem disconnected");
      setTimeout(() => initializeGSM(io), 5000);
    });
  } catch (err) {
    logStatus("SYSTEM", "-", `❌ Init error: ${err.message}`);
  }
}

// ------------------------------
// AT Command Sender
// ------------------------------
function sendAT(cmd, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (!port || !port.isOpen) return reject(new Error("Port not open"));
    let buffer = "";

    const onData = (data) => {
      buffer += data.toString();
      if (buffer.includes("OK")) {
        port.off("data", onData);
        resolve(buffer.trim());
      } else if (buffer.includes("ERROR")) {
        port.off("data", onData);
        reject(new Error(buffer.trim()));
      }
    };

    port.on("data", onData);
    port.write(cmd + "\r\n", (err) => {
      if (err) {
        port.off("data", onData);
        return reject(err);
      }
    });

    setTimeout(() => {
      port.off("data", onData);
      reject(new Error("Timeout waiting for response"));
    }, timeout);
  });
}

// ------------------------------
// Send SMS (with multi-part support)
// ------------------------------
async function sendSMS(name, number, message, service = "", ticket = "", type = "") {
  const formatted = formatNumberPH(number);
  if (!formatted) throw new Error(`Invalid phone number: ${number}`);
  if (!port || !port.isOpen) throw new Error("Modem not connected");

  logStatus(name, formatted, "SENDING", service, ticket, type);

  try {
    await sendAT("AT+CMGF=1");
    await sendAT('AT+CSCS="GSM"');
    await sendAT('AT+CSMP=17,167,0,0');

    try {
      const sca = await sendAT("AT+CSCA?");
      if (!/\+63/.test(sca)) {
        await sendAT('AT+CSCA="+639180000101"');
      }
    } catch {
      logStatus("SYSTEM", "-", "⚠️ SMSC not readable, using fallback +639180000101");
      await sendAT('AT+CSCA="+639180000101"');
    }

    const singleLimit = 160;
    const multiLimit = 153;
    const parts = [];

    if (message.length > singleLimit) {
      for (let i = 0; i < message.length; i += multiLimit)
        parts.push(message.substring(i, i + multiLimit));
    } else {
      parts.push(message);
    }

    for (let i = 0; i < parts.length; i++) {
      const msgPart =
        parts.length > 1 ? `[${i + 1}/${parts.length}] ${parts[i]}` : parts[i];
      const partLabel = parts.length > 1 ? `Part ${i + 1}/${parts.length}` : "Full";

      logStatus(name, formatted, `📤 Sending ${partLabel}...`, service, ticket, type);

      await new Promise((resolve, reject) => {
        let buffer = "";
        const onData = (data) => {
          buffer += data.toString();
          if (buffer.includes(">")) {
            port.off("data", onData);
            resolve();
          } else if (buffer.includes("ERROR")) {
            port.off("data", onData);
            reject(new Error("No prompt from modem"));
          }
        };
        port.on("data", onData);
        port.write(`AT+CMGS="${formatted}"\r`);
        setTimeout(() => {
          port.off("data", onData);
          reject(new Error("Timeout waiting for '>' prompt"));
        }, 8000);
      });

      await new Promise((resolve, reject) => {
        let buffer = "";
        const onData = (data) => {
          buffer += data.toString();
          if (/\+CMGS: \d+/i.test(buffer)) {
            port.off("data", onData);
            resolve();
          } else if (buffer.includes("ERROR")) {
            port.off("data", onData);
            reject(new Error("Send failed"));
          }
        };
        port.on("data", onData);
        port.write(msgPart + "\x1A");
        setTimeout(() => {
          port.off("data", onData);
          reject(new Error("Timeout waiting for +CMGS response"));
        }, 15000);
      });

      logStatus(name, formatted, `✅ ${partLabel} sent`, service, ticket, type);
      await delay(5000);
    }

    logStatus(name, formatted, `✅ Delivered in ${parts.length} part(s)`, service, ticket, type);
    return true;
  } catch (err) {
    logStatus(name, formatted, `FAILED ❌ (${err.message})`, service, ticket, type);
    throw err;
  }
}

// ------------------------------
// Send Template SMS (Safe Mobile Check)
// ------------------------------
async function sendTemplateSMS(type, data) {
  const mobile = data.mobile;
  if (!mobile || mobile.trim() === "") return; // skip if no mobile number

  const templates = loadMessages();
  const typeKey = type.trim().toLowerCase();
  const template = templates[typeKey];

  if (!template) throw new Error(`No message template found for '${type}'`);

  const message = formatMessage(template, {
    counter: data.counter || "",
    ticket: data.ticket || "",
    service: data.service || "",
  });

  await sendSMS(data.name || "Kiosk", mobile, message, data.service, data.ticket, type);
}

// ------------------------------
// Cleanup
// ------------------------------
async function cleanupGSMPorts() {
  if (port && port.isOpen) port.close(() => logStatus("SYSTEM", "-", "✅ GSM closed"));
}

module.exports = { initializeGSM, sendTemplateSMS, cleanupGSMPorts };
