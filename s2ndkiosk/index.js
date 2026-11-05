const { app, BrowserWindow, ipcMain, screen, session } = require("electron");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { execFile, exec } = require("child_process");
const express = require("express");
const cors = require("cors");

// Setup persistent logging
const logDir = path.join(__dirname, "outfolder", "logs", "error");
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    // ignore
  }
}
const logStream = fs.createWriteStream(path.join(__dirname, "error.log"), { flags: "a" });
const errorConsole = new console.Console({ stderr: logStream, stdout: process.stdout });

console.error = (...args) => {
  const ts = new Date().toISOString();
  errorConsole.error(ts, ...args);
};

// ==========================================
// CONFIGURATION LOADER
// ==========================================
function loadConfig() {
  const configPath = path.join(__dirname, "outfolder", "config", "config.ini");
  let hostName = "localhost";
  let hostPort = 12341;
  let printerName = "POS-82";

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf8");
      const hostMatch = content.match(/hostName\s*=\s*([^\r\n]+)/i);
      const portMatch = content.match(/hostPort\s*=\s*([^\r\n]+)/i);
      const printerMatch = content.match(/printerName\s*=\s*([^\r\n]+)/i);

      if (hostMatch && hostMatch[1].trim()) hostName = hostMatch[1].trim();
      if (portMatch && portMatch[1].trim()) hostPort = parseInt(portMatch[1].trim(), 10) || 12341;
      if (printerMatch && printerMatch[1].trim()) printerName = printerMatch[1].trim();
    } catch (err) {
      console.error("Failed to parse config.ini:", err.message);
    }
  }

  const kioskUrl = `http://${hostName}:${hostPort}/kiosk?station=kiosk2`;
  const pingUrl = `http://${hostName}:${hostPort}/kiosk`;

  return { hostName, hostPort, printerName, kioskUrl, pingUrl };
}

let appConfig = loadConfig();

// ==========================================
// DATE CHANGE & MIDNIGHT RESET
// ==========================================
function getCurrentDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}
let initialDate = getCurrentDate();

function checkDateChange() {
  const currentDate = getCurrentDate();
  if (currentDate !== initialDate) {
    initialDate = currentDate;
    console.log(`[Date Transition] Detected date change to ${currentDate}. Refreshing kiosk...`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  }
}
// Check every 30 seconds instead of an aggressive 1-second interval
setInterval(checkDateChange, 30000);

// ==========================================
// THERMAL PRINTER EXECUTION
// ==========================================
function executePrint(service, ticket, shortSname, subsname, selectedSubService) {
  const printScript = path.join(__dirname, "outfolder", "printer", "print.php");
  const args = [
    printScript,
    String(service || ""),
    String(ticket || ""),
    String(shortSname || ""),
    String(subsname || ""),
    String(selectedSubService || "")
  ];

  execFile("php", args, { windowsHide: true }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Printer execution error:`, error.message);
      return;
    }
    if (stderr && stderr.trim()) {
      console.error(`Printer stderr:`, stderr.trim());
    }
    if (stdout && stdout.trim()) {
      console.log(`Printer output:`, stdout.trim());
    }
  });
}

// ==========================================
// LOCAL PRINT RECEIVER (PORT 3234)
// ==========================================
const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json({ limit: "10mb" }));
expressApp.use(express.urlencoded({ extended: true, limit: "10mb" }));

expressApp.use("/reso", express.static(path.join(__dirname, "reso")));
expressApp.use("/outfolder", express.static(path.join(__dirname, "outfolder")));

expressApp.post("/api/requestor", (req, res) => {
  const data = req.body || {};
  console.log("[Kiosk 2 Print Request Received]:", data);

  const service = data.service || "";
  const ticket = data.ticket || "";
  const shortSname = data.shortSname || data.service_name || "";
  const subsname = data.subsname || data.note || "";
  const selectedSubService = data.selectedSubService || data.sub_services || "";

  executePrint(service, ticket, shortSname, subsname, selectedSubService);

  return res.status(200).json({
    success: true,
    message: "Ticket print command executed successfully on Kiosk 2",
    ticket: `${service}${ticket}`
  });
});

expressApp.get("/health", (req, res) => {
  res.json({ status: "online", station: "kiosk2", time: new Date().toISOString() });
});

// Bind to 0.0.0.0 so all network interfaces can reach this print receiver
expressApp.listen(3234, "0.0.0.0", () => {
  console.log("Kiosk 2 Print Server listening safely on 0.0.0.0:3234");
});

// ==========================================
// ELECTRON WINDOW & RECONNECT CONTROLLER
// ==========================================
let mainWindow = null;
let reconnectInterval = null;
let isConnected = false;

function checkConnection() {
  return axios.get(appConfig.pingUrl, { timeout: 3500 })
    .then(() => true)
    .catch(() => false);
}

function startReconnectLoop() {
  if (reconnectInterval) return;
  console.log(`[Network Monitor] Starting reconnection loop to ${appConfig.pingUrl}...`);

  reconnectInterval = setInterval(async () => {
    appConfig = loadConfig(); // reload config if updated
    const ok = await checkConnection();
    if (ok) {
      console.log(`[Network Monitor] Connection restored! Loading ${appConfig.kioskUrl}...`);
      clearInterval(reconnectInterval);
      reconnectInterval = null;
      isConnected = true;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(appConfig.kioskUrl);
      }
    }
  }, 4000);
}

function createKioskWindow() {
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find(
    (display) => display.bounds.x !== 0 || display.bounds.y !== 0
  );

  const windowOptions = {
    width: 1024,
    height: 768,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "reso", "node", "appstatus.js")
    }
  };

  if (externalDisplay) {
    windowOptions.x = externalDisplay.bounds.x;
    windowOptions.y = externalDisplay.bounds.y;
  }

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.setFullScreen(true);

  // Failure fallback
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error(`Page failed to load (${errorCode}): ${errorDescription}`);
    if (!mainWindow.webContents.getURL().includes("error.html")) {
      mainWindow.loadFile("error.html");
      startReconnectLoop();
    }
  });

  checkConnection().then((online) => {
    mainWindow.show();
    if (online) {
      isConnected = true;
      console.log(`Connected to main server. Loading ${appConfig.kioskUrl}...`);
      mainWindow.loadURL(appConfig.kioskUrl);
    } else {
      console.warn(`Cannot reach main server at ${appConfig.pingUrl}. Displaying error/reconnect screen.`);
      mainWindow.loadFile("error.html");
      startReconnectLoop();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await session.defaultSession.clearCache();
      console.log("Electron cache cleared successfully");
    } catch (err) {
      console.error("Cache clear error:", err.message);
    }
    createKioskWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createKioskWindow();
    }
  });
}

ipcMain.on("appstatus", (event, stats) => {
  if (stats === "relaunch") {
    app.relaunch();
    app.quit();
  } else {
    app.quit();
  }
});
