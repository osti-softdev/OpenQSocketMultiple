let tagline = "../../";
tagline = "./";	

// ===== Core & Built-in =====
const path = require("path");
const fs = require("fs");
const os = require("os");
const multer = require("multer");

// ===== Electron =====
const { app, BrowserWindow, screen, session, dialog } = require("electron");
// ===== Express & Socket.IO =====
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mime = require("mime");
const requestAPI = multer();
const cors = require("cors");
const rootpath = app.getAppPath();
const OUTFOLDER_PATH = path.join(rootpath, `${tagline}outfolder`);
global.outfolderPath = OUTFOLDER_PATH;
const pidFile = path.join(OUTFOLDER_PATH, "app.pid");

const appExpress = express();
const server = http.createServer(appExpress);
const io = socketIo(server);

// ===== Local Modules =====
const {
	initializeSerialPort,
	cleanupSerialPorts,
} = require("./reso/node/serialport");
const { setupLogger } = require("./reso/node/logger");
const { spawn } = require("child_process");
const { test, setupAds, initialize: initAdsManager } = require("./reso/node/getads");
const { handleGetAllServices } = require("./reso/node/getallservices");
const {
	setupServicesDisplayWatcher,
} = require("./reso/node/servicesDisplayWatcher");
const { setupFooterWatcher } = require("./reso/node/footerwatcher");
const {
	setupFooterWatcheradmin,
} = require("./reso/node/admin/footerwatcheradmin");
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
			// keep your no-cache headers
			setNoCacheHeaders(res);

			// 🔑 FIX: Serve wasm correctly
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
	const token = req.cookies?.auth; // read JWT from cookie
	if (!token) return res.redirect("/312Xadmin");

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch {
		return res.redirect("/312Xadmin");
	}
}
// *===== Config & Logger =====
setupLogger();
const config = loadConfig(io);
const serverPort = config?.MainServer?.port || 3000;
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
if(isArduinoWifi){
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

if(isWindowed){
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
	res.redirect("/	");
});


appExpress.post("/setAuthCookie", express.json(), (req, res) => {
	const { token } = req.body;
	res.cookie("auth", token, {
		httpOnly: true,
		secure: false, // true only if HTTPS
		sameSite: "lax", // not "strict", otherwise redirect can drop it
		path: "/", // cookie visible across whole site
		maxAge: 3600000, // 1 hour
	});
	res.sendStatus(200);
});

appExpress.post("/logout", (req, res) => {
	res.clearCookie("auth");
	res.sendStatus(200);
});


// *===== Start Server =====
initializeDb()
	.then(() => {
		server.listen(serverPort, () => {
			console.log(`Server running on http://${ownip}:${serverPort}`);
			io.on("connection", (socket) => {
				const clientId = socket.id;
				const ip = getClientIp(socket);
				
				console.log(`🔌 Client connected: ${clientId} | IP: ${ip}`);
				// ! admin
				settupsettingsaccounts(socket, io);
				admincontent3chartsdata(socket, io);
				admincontent2averages(socket, io);
				admincontent4alldata(socket, io);
				adminoveralldatawatcher(socket, io);
				setupFooterWatcheradmin(socket, io);

				// ! other sockets
				setupAds(socket, io);
				setupFooterWatcher(socket, io);
				handleGetAllServices(socket);
				setupServicesDisplayWatcher(socket, io);
				setupSoundSettingsAdmin(socket, io);
				admincontentSaveChartImage(socket, io);
				settupsettingsservices(socket, io);
				if(isWindowed){
					setupLoginSocketteller(socket);
					setupTellerWatcher(socket, io);
					initializeWindowedKiosk(socket, io);
				}
				if(isArduinoWifi){
					socket.on("key", async (payload) => {
						try {
							const key = String(payload?.key ?? payload).trim();
							if (!key) {
								socket.emit("key:ack", { ok: false, error: "NO_KEY" });
								return;
							}
							const result = await handleKey(key, io);
							// ack to sender only
							socket.emit("key:ack", result);
						} catch (err) {
							socket.emit("key:ack", { ok: false, error: err.message });
						}
					});
				}
				
			});
			// ! VIDEOS EXPRESS
			setupVideosApi(appExpress);
			// ! IMAGES EXPRESS
			setupImagesApi(appExpress, io);

			setupLoginSocket(io);

			if(isArduinoUno){
				setupCalledTicketsWatcher(io);
				initializeSerialPort(io, "ARDUINO_UNO");
			}
			if(isArduinoWifi){
			setupCalledTicketsWatcher(io, "ARDIONO_WIFI");
			}
			if(isWindowed){
			setupCalledTicketsWatcher(io, "WINDOWED_APPLICATION");
			}
		});
	})
	.catch((err) => {
		console.error("Failed to initialize database:", err.message);
		process.exit(1);
	});

// ===== PID Handling =====
if (!fs.existsSync(OUTFOLDER_PATH)) {
	fs.mkdirSync(OUTFOLDER_PATH, { recursive: true });
}

function isProcessRunning(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function checkAndHandleExistingInstance() {
	if (fs.existsSync(pidFile)) {
		const pid = parseInt(fs.readFileSync(pidFile, "utf-8"), 10);
		if (isProcessRunning(pid)) {
			dialog.showErrorBox("Error", "Instance already running");
			app.quit();
			return true;
		} else {
			fs.unlinkSync(pidFile);
		}
	}
	return false;
}

function writePidFile() {
	fs.writeFileSync(pidFile, process.pid.toString(), "utf-8");
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
	// const broadcasturl = `http://${ownip}:${serverPort}/main`;
	// const kioskurl = `http://${ownip}:${serverPort}/kiosk`;
	const displays = screen.getAllDisplays();
	// let windowOptions = {
	// 	width: 450,
	// 	height: 450,
	// 	autoHideMenuBar: true,
	// 	frame: true,
	// };

	// if (displays.length > 1) {
	// 	const externalDisplay = displays.find(
	// 		(d) => d.bounds.x !== 0 || d.bounds.y !== 0
	// 	);
	// 	if (externalDisplay) {
	// 		windowOptions.x = externalDisplay.bounds.x + 50;
	// 		windowOptions.y = externalDisplay.bounds.y + 50;
	// 	}
	// }

	// displayWindow = new BrowserWindow(windowOptions);
	// displayWindow.loadURL(broadcasturl);
	// displayWindow.setFullScreen(true);
	// displayWindow.on("closed", handleWindowClosed);

	// // ! KIOSK WINDOW
	// if(isWindowed){
	// 	kioskWindow = new BrowserWindow(windowOptions);
	// 	kioskWindow.loadURL(kioskurl);
	// 	kioskWindow.setFullScreen(true);
	// 	kioskWindow.on("closed", handleWindowClosed);
	// }
}

function handleWindowClosed() {
	displayWindow = null;
	// kioskWindow = null;
	app.quit();
}

// ===== Electron App Events =====
app.whenReady().then(createWindow);
app.whenReady().then();

app.on("activate", () => {
	// if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
		closeDb();
		if(isArduinoUno){await cleanupSerialPorts();}
		await new Promise((resolve, reject) => {
			server.close((err) => (err ? reject(err) : resolve()));
		});
		console.log("✅ Shutdown complete");
		process.exit(0);
	} catch (err) {
		console.error("❌ Error during shutdown:", err.message);
		process.exit(1);
	}
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));	
