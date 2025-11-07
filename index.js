let tagline = "../../";
tagline = "./";	// comment this on deployment

// ===== Core & Built-in =====
const path = require("path");
const fs = require("fs");
const os = require("os");
const multer = require("multer");
const { app, BrowserWindow, screen, session, dialog } = require("electron");

// ===== Express & Socket.IO =====
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const requestAPI = multer();
const cors = require("cors");
const rootpath = path.join(__dirname);
const OUTFOLDER_PATH = path.join(rootpath, `${tagline}reso/outfolder`);
global.outfolderPath = OUTFOLDER_PATH;
const pidFile = path.join(OUTFOLDER_PATH, "app.pid");

const appExpress = express();
const server = http.createServer(appExpress);
const io = socketIo(server, {
  // FIX: Add connection timeout to prevent premature client connections
  connectTimeout: 5000,
});

// ===== Local Modules =====
const {
  initializeSerialPort,
  cleanupSerialPorts,
} = require("./reso/node/serialport");
const { setupLogger } = require("./reso/node/logger");
const { test, setupAds, initialize: initAdsManager } = require("./reso/node/getads");
const { handleGetAllServices } = require("./reso/node/getallservices");
const {
  setupServicesDisplayWatcher,
} = require("./reso/node/servicesDisplayWatcher");
const { setupFooterWatcher } = require("./reso/node/footerwatcher");
const { setupdisplaycolorwatcher } = require("./reso/node/colorwatcher");
const {
  setupFooterWatcheradmin,
} = require("./reso/node/admin/footerwatcheradmin");
const {
  setupColorWatcheradmin,
} = require("./reso/node/admin/colorswatcheradmin");
const {
  setupAdminTeller,
} = require("./reso/node/admin/adminsettingsteller");
const {
  setupCalledTicketsWatcher,
} = require("./reso/node/calledTicketsWatcher");
const {
  adminoveralldatawatcher,
} = require("./reso/node/admin/adminDashboardData");
const {
  admincontent3chartsdata,
} = require("./reso/node/admin/adminDashboardcontent3chartsdata");
const {
  admincontent2averages,
} = require("./reso/node/admin/adminDashboardcontent2averages");
const {
  admincontent4alldata,
} = require("./reso/node/admin/adminDashboardcontent4");
const {
  admincontentSaveChartImage,
} = require("./reso/node/admin/adminSaveChartImage");
const {
  settupsettingsservices,
} = require("./reso/node/admin/adminsettingservices");
const {
  initializeWindowedKiosk,
} = require("./reso/node/kiosk/kiosk");
const {
  setupLoginSocket,
  JWT_SECRET,
} = require("./reso/node/admin/adminlogin");
const {
  setupLoginSocketteller,
} = require("./reso/node/teller/tellerlogin");
const {
  settupsettingsaccounts,
} = require("./reso/node/admin/adminsettingsaccounts");
const {
  setupsystemconfigurations,
} = require("./reso/node/admin/adminsettingssystem");
const { setupKeyApi, handleKey } = require("./reso/node/insertviaapi");
const {
  setupSoundSettingsAdmin,
} = require("./reso/node/admin/adminvoiceandvolume");
const { loadConfig } = require("./reso/node/envconfig");
const { initializeDb, closeDb } = require("./reso/node/db");
const { executephp } = require("./reso/node/printer");
const { setupTellerWatcher } = require("./reso/node/teller/tellerserviceswatcher");
const {
  setNoCacheHeaders,
  expressIpWhitelist,
  socketIoWhitelist,
  blockSensitiveRoutes,
  getClientIp,
} = require("./reso/node/security");
const {
    initializeGSM,
    cleanupGSMPorts,
} = require("./reso/node/smsService");

// MULTERS
const setupVideosApi = require("./reso/node/expressAPI/videos");
const setupImagesApi = require("./reso/node/expressAPI/images");

// ===== Helper: Get LAN IP =====
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

const ownip = getLocalIp();

// ===== Security Middleware =====
// expressIpWhitelist(appExpress); // ! Apply Express IP whitelist
// socketIoWhitelist(io); // ! Apply Socket.IO IP whitelist
blockSensitiveRoutes(appExpress); // ! Block sensitive routes

// ===== Static Files =====
appExpress.use(express.json());
appExpress.use(cookieParser());
appExpress.use(cors());
appExpress.use(
  "/libs",
  express.static(path.join(rootpath, "reso/libs"), {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      setNoCacheHeaders(res);
      if (filePath.endsWith(".wasm")) {
        res.setHeader("Content-Type", "application/wasm");
      }
    },
  })
);

appExpress.use(
  "/css",
  express.static(path.join(rootpath, "reso/css"), {
    etag: false,
    lastModified: false,
    setHeaders: setNoCacheHeaders,
  })
);
appExpress.use(
  "/material-icons",
  express.static(
    path.join(rootpath, "node_modules/material-design-icons/iconfont"),
    {
      etag: false,
      lastModified: false,
      setHeaders: setNoCacheHeaders,
    }
  )
);

appExpress.use(
  "/js",
  express.static(path.join(rootpath, "reso/js"), {
    etag: false,
    lastModified: false,
    setHeaders: setNoCacheHeaders,
  })
);

appExpress.use(
  "/images",
  express.static(path.join(OUTFOLDER_PATH, "images"), {
    setHeaders: setNoCacheHeaders,
  })
);

appExpress.use(
  "/audio",
  express.static(path.join(OUTFOLDER_PATH, "audio"), {
    etag: false,
    lastModified: false,
    setHeaders: setNoCacheHeaders,
  })
);

// JWT middleware for Express routes
function requireAuth(req, res, next) {
  const token = req.cookies?.auth;
  if (!token) return res.redirect("/312Xadmin");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.redirect("/312Xadmin");
  }
}

// ===== Config & Logger =====
// FIX: Ensure outfolder and subdirectories exist before setup
if (!fs.existsSync(OUTFOLDER_PATH)) {
  fs.mkdirSync(OUTFOLDER_PATH, { recursive: true });
}
if (!fs.existsSync(path.join(OUTFOLDER_PATH, "config"))) {
  fs.mkdirSync(path.join(OUTFOLDER_PATH, "config"), { recursive: true });
}
if (!fs.existsSync(path.join(OUTFOLDER_PATH, "logs"))) {
  fs.mkdirSync(path.join(OUTFOLDER_PATH, "logs"), { recursive: true });
}
if (!fs.existsSync(path.join(OUTFOLDER_PATH, "images"))) {
  fs.mkdirSync(path.join(OUTFOLDER_PATH, "images"), { recursive: true });
}
if (!fs.existsSync(path.join(OUTFOLDER_PATH, "audio"))) {
  fs.mkdirSync(path.join(OUTFOLDER_PATH, "audio"), { recursive: true });
}

setupLogger();
const config = loadConfig(io);
const serverPort = config?.MainServer?.port || 3000;
const smstype = config?.MainServer?.sms || 0;
// define system type constants
const SYSTEM_TYPES = {
  ARDUINO_UNO: "ARDUINO_UNO",
  ARDUINO_WIFI: "ARDUINO_WIFI",
  WINDOWED_APPLICATIONS: "WINDOWED_APPLICATIONS",
};
// normalize/validate system_type
let system_type = (config?.MainServer?.systemType || SYSTEM_TYPES.WINDOWED_APPLICATIONS)
  .toString()
  .trim()
  .toUpperCase();

if (!Object.values(SYSTEM_TYPES).includes(system_type)) {
  console.warn(
    `Unknown SYSTEM_TYPE "${system_type}" in config. Falling back to ${SYSTEM_TYPES.WINDOWED_APPLICATIONS}.`
  );
  system_type = SYSTEM_TYPES.WINDOWED_APPLICATIONS;
}

console.log(`Starting server with SYSTEM_TYPE=${system_type}`);

// convenience booleans (useful later)
const isArduinoUno = system_type === SYSTEM_TYPES.ARDUINO_UNO;
const isArduinoWifi = system_type === SYSTEM_TYPES.ARDUINO_WIFI;
const isWindowed = system_type === SYSTEM_TYPES.WINDOWED_APPLICATIONS;

// ===== Routes =====
if (isArduinoWifi) {
  appExpress.use("/api", setupKeyApi(io));
}

appExpress.get("/312Xadmin", (req, res) => {
  setNoCacheHeaders(res);
  res.clearCookie("auth", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  res.sendFile(path.join(rootpath, "reso/html/login.html"));
});
appExpress.get("/312xdashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(rootpath, "reso/html/admin.html"));
});
appExpress.get("/whoami", requireAuth, (req, res) => {
  res.json(req.user);
});

if (isWindowed) {
  appExpress.get("/kiosk", (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(rootpath, "reso/html/kiosk.html"));
  });
  appExpress.get("/312Xtellerlogin", (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(rootpath, "reso/html/webtellerlogin.html"));
  });
  appExpress.get("/312XtellerWindow", (req, res) => {
    setNoCacheHeaders(res);
    res.sendFile(path.join(rootpath, "reso/html/webteller.html"));
  });
}

appExpress.get("/main", (req, res) => {
  setNoCacheHeaders(res);
  res.sendFile(path.join(rootpath, "reso/html/index.html"));
});
appExpress.get("/booticons", (req, res) => {
  res.sendFile(path.join(rootpath, "reso/html/icon.html"));
});
appExpress.get("/", (req, res) => {
  res.redirect("/main");
});

appExpress.post("/setAuthCookie", express.json(), (req, res) => {
  const { token } = req.body;
  res.cookie("auth", token, {
    httpOnly: true,
    secure: false, // true only if HTTPS
    sameSite: "lax",
    path: "/",
    maxAge: 3600000, // 1 hour
  });
  res.sendStatus(200);
});

appExpress.post("/logout", (req, res) => {
  res.clearCookie("auth");
  res.sendStatus(200);
});

// ===== Start Server =====
// FIX: Add error handling for Socket.IO connection
io.on("connection", (socket) => {
  const clientId = socket.id;
  const ip = getClientIp(socket);
  console.log(`🔌 Client connected: ${clientId} | IP: ${ip}`);

  // FIX: Wrap socket handlers in try-catch to prevent unhandled errors
  try {
    settupsettingsaccounts(socket, io);
    admincontent3chartsdata(socket, io);
    admincontent2averages(socket, io);
    admincontent4alldata(socket, io);
    adminoveralldatawatcher(socket, io);
    setupFooterWatcheradmin(socket, io);
    setupColorWatcheradmin(socket, io);
    setupAdminTeller(socket, io);
    setupAds(socket, io);
    setupFooterWatcher(socket, io);
    setupdisplaycolorwatcher(socket, io);
    handleGetAllServices(socket);
    setupServicesDisplayWatcher(socket, io);
    setupSoundSettingsAdmin(socket, io);
    admincontentSaveChartImage(socket, io);
    settupsettingsservices(socket, io);
    setupsystemconfigurations(socket, io);
    setupLoginSocket(socket, io);
    socket.on("relaunchApp", async () => {
        console.log("♻️ Relaunch command received via socket");
        try {
          await gracefulShutdown("RELAUNCH_REQUESTED");
          relaunchApp();
        } catch (err) {
          console.error("Failed to relaunch app:", err.message);
        }
      });
    if(smstype==1){
      initializeGSM(io);
    }
    if (isArduinoUno) {
      setupCalledTicketsWatcher(socket, io, "ARDUINO_UNO");
      initializeSerialPort(socket, io, "ARDUINO_UNO");
    }
      if (isWindowed) {
      setupLoginSocketteller(socket);
      setupTellerWatcher(socket, io);
      initializeWindowedKiosk(socket, io);
      setupCalledTicketsWatcher(socket, io, "WINDOWED_APPLICATION");
    }
    if (isArduinoWifi) {
      setupCalledTicketsWatcher(socket, io, "ARDUINO_WIFI");
      socket.on("key", async (payload) => {
        try {
          const key = String(payload?.key ?? payload).trim();
          if (!key) {
            socket.emit("key:ack", { ok: false, error: "NO_KEY" });
            return;
          }
          const result = await handleKey(key, io);
          socket.emit("key:ack", result);
        } catch (err) {
          socket.emit("key:ack", { ok: false, error: err.message });
        }
      });
    }
  } catch (err) {
    console.error(`Error in Socket.IO connection handler: ${err.message}`);
    socket.emit("error", { message: "Server error during initialization" });
    socket.disconnect(true);
  }

  // FIX: Handle socket errors to prevent crashes
  socket.on("error", (err) => {
    console.error(`Socket error for client ${clientId}: ${err.message}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${clientId} | IP: ${ip}`);
  });
});

// Prevent re-registering multiple 'connection' listeners
// if (!io._connectionHandlerSet) {
//   io._connectionHandlerSet = true;

//   io.removeAllListeners("connection"); // defensive cleanup

//   io.on("connection", (socket) => {
//     const clientId = socket.id;
//     const ip = getClientIp(socket);
//     console.log(`🔌 Client connected: ${clientId} | IP: ${ip}`);

//     try {
//       // --- Socket setup (only per connection, not per reload) ---
//       settupsettingsaccounts(socket, io);
//       admincontent3chartsdata(socket, io);
//       admincontent2averages(socket, io);
//       admincontent4alldata(socket, io);
//       adminoveralldatawatcher(socket, io);
//       setupFooterWatcheradmin(socket, io);
//       setupColorWatcheradmin(socket, io);
//       setupAdminTeller(socket, io);
//       setupAds(socket, io);
//       setupFooterWatcher(socket, io);
//       handleGetAllServices(socket);
//       setupServicesDisplayWatcher(socket, io);
//       setupSoundSettingsAdmin(socket, io);
//       admincontentSaveChartImage(socket, io);
//       settupsettingsservices(socket, io);
//       setupsystemconfigurations(socket, io);
//       setupLoginSocket(socket, io);

//       if (isArduinoUno) {
//       setupCalledTicketsWatcher(socket, io, "ARDUINO_UNO");
//       initializeSerialPort(socket, io, "ARDUINO_UNO");
//     }

//       if (smstype === 1) {
//         initializeGSM(io);
//       }

//       if (isWindowed) {
//         setupLoginSocketteller(socket);
//         setupTellerWatcher(socket, io);
//         initializeWindowedKiosk(socket, io);
//         setupCalledTicketsWatcher(socket, io, "WINDOWED_APPLICATION");
//       }

//       if (isArduinoWifi) {
//         // Avoid stacking listeners on this socket
//       setupCalledTicketsWatcher(socket, io, "ARDUINO_WIFI");
//         socket.removeAllListeners("key");

//         socket.on("key", async (payload) => {
//           try {
//             const key = String(payload?.key ?? payload).trim();
//             if (!key) {
//               socket.emit("key:ack", { ok: false, error: "NO_KEY" });
//               return;
//             }
//             const result = await handleKey(key, io);
//             socket.emit("key:ack", result);
//           } catch (err) {
//             socket.emit("key:ack", { ok: false, error: err.message });
//           }
//         });
//       }
//     } catch (err) {
//       console.error(`❌ Error in Socket.IO handler: ${err.message}`);
//       socket.emit("error", { message: "Server error during initialization" });
//       socket.disconnect(true);
//     }

//     socket.on("error", (err) => {
//       console.error(`⚠️ Socket error [${clientId}]: ${err.message}`);
//     });

//     socket.on("disconnect", () => {
//       console.log(`🔌 Client disconnected: ${clientId} | IP: ${ip}`);
//     });
//   });
// }

// FIX: Ensure all dependencies are initialized before starting server
async function startServer() {
  try {
    // Initialize database
    await initializeDb();
    console.log("Database initialized successfully");

    // Initialize other dependencies
    setupLogger();
    setupVideosApi(appExpress);
    setupImagesApi(appExpress, io);

    // Start server
    server.listen(serverPort, () => {
      console.log(`Server running on http://${ownip}:${serverPort}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    await gracefulShutdown("STARTUP_ERROR");
  }
}

// ===== PID Handling =====
// FIX: Ensure outfolder exists before checking PID
if (!fs.existsSync(OUTFOLDER_PATH)) {
  fs.mkdirSync(OUTFOLDER_PATH, { recursive: true });
}

function isProcessRunning(pid) {
  try {
    // FIX: Use more reliable process check on Windows
    if (os.platform() === "win32") {
      // Use tasklist command to check if the PID is a node.exe process
      const { execSync } = require("child_process");
      const result = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV`, { encoding: "utf-8" });
      return result.includes("node.exe");
    } else {
      process.kill(pid, 0);
      return true;
    }
  } catch (err) {
    return false;
  }
}

function checkAndHandleExistingInstance() {
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, "utf-8"), 10);
    if (isNaN(pid)) {
      console.warn(`Invalid PID in ${pidFile}. Removing file.`);
      fs.unlinkSync(pidFile);
      return false;
    }
    if (isProcessRunning(pid)) {
      console.error(`Process ${pid} is already running. Exiting.`);
      return true;
    } else {
      console.log(`Stale PID ${pid} found in ${pidFile}. Removing file.`);
      fs.unlinkSync(pidFile);
    }
  }
  return false;
}

function writePidFile() {
  try {
    fs.writeFileSync(pidFile, process.pid.toString(), "utf-8");
    console.log(`Wrote PID ${process.pid} to ${pidFile}`);
  } catch (err) {
    console.error(`Failed to write PID file: ${err.message}`);
  }
}

if (checkAndHandleExistingInstance()) {
  process.exit(1);
}

writePidFile();


// ===== Electron Window =====
let displayWindow = null;
let kioskWindow = null;
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
function createWindow() {
	// ! DISPLAY WINDOW
	const broadcasturl = `http://${ownip}:${serverPort}/main`;
	const kioskurl = `http://${ownip}:${serverPort}/kiosk`;
	const displays = screen.getAllDisplays();
	let windowOptions = {
		width: 450,
		height: 450,
		autoHideMenuBar: true,
		frame: true,
	};

	if (displays.length > 1) {
		const externalDisplay = displays.find(
			(d) => d.bounds.x !== 0 || d.bounds.y !== 0
		);
		if (externalDisplay) {
			windowOptions.x = externalDisplay.bounds.x + 50;
			windowOptions.y = externalDisplay.bounds.y + 50;
		}
	}

	displayWindow = new BrowserWindow(windowOptions);
	displayWindow.loadURL(broadcasturl);
	displayWindow.setFullScreen(true);
	displayWindow.on("closed", handleWindowClosed);

	// ! KIOSK WINDOW
	if(isWindowed){
		kioskWindow = new BrowserWindow(windowOptions);
		kioskWindow.loadURL(kioskurl);
		kioskWindow.setFullScreen(true);
		kioskWindow.on("closed", handleWindowClosed);
	}
}

function handleWindowClosed() {
	displayWindow = null;
	kioskWindow = null;
	app.quit();
}

// ===== Electron App Events =====
app.whenReady().then(createWindow);
app.whenReady().then();

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("ready", () => {
	session.defaultSession.clearCache().then(() => {
		console.log("Cache cleared");
	});
});

app.on("before-quit", () => {
	if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
});

app.on("window-all-closed", () => {
	app.quit();
});
// ===== Graceful Shutdown =====
async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down server...`);

  try {
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
      console.log(`Removed PID file ${pidFile}`);
    }
    closeDb();

    if (smstype == 1) await cleanupGSMPorts();
    if (isArduinoUno) await cleanupSerialPorts();

    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

    console.log("✅ Shutdown complete");
  } catch (err) {
    console.error("❌ Error during shutdown:", err.message);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// FIX: Handle uncaught exceptions and rejections to prevent crashes
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});


let relaunching = false;

function relaunchApp() {
  if (relaunching) return;
  relaunching = true;
  console.log("♻️ Relaunching app...");

  app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
  setTimeout(() => {
    app.exit(0);
  }, 1000);
}


// Start the server
startServer();