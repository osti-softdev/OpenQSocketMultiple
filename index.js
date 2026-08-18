const path = require("path");
const fs = require("fs");
const os = require("os");

// ===== Config & Variables =====
let tagline = "./"; // comment this on deployment
const rootpath = __dirname;
const OUTFOLDER_PATH = path.join(rootpath, `${tagline}outfolder`);
global.outfolderPath = OUTFOLDER_PATH;
const pidFile = path.join(OUTFOLDER_PATH, "app.pid");

// ===== Ensure Directories Exist =====
if (!fs.existsSync(OUTFOLDER_PATH)) fs.mkdirSync(OUTFOLDER_PATH, { recursive: true });
if (!fs.existsSync(path.join(OUTFOLDER_PATH, "config"))) fs.mkdirSync(path.join(OUTFOLDER_PATH, "config"), { recursive: true });
if (!fs.existsSync(path.join(OUTFOLDER_PATH, "logs"))) fs.mkdirSync(path.join(OUTFOLDER_PATH, "logs"), { recursive: true });
if (!fs.existsSync(path.join(OUTFOLDER_PATH, "images"))) fs.mkdirSync(path.join(OUTFOLDER_PATH, "images"), { recursive: true });
if (!fs.existsSync(path.join(OUTFOLDER_PATH, "audio"))) fs.mkdirSync(path.join(OUTFOLDER_PATH, "audio"), { recursive: true });

// ===== Local Server Modules =====
const { appExpress, server, io } = require("./backend/server");
const { setupLogger } = require("./backend/config/logger");
const { loadConfig } = require("./backend/config/envconfig");
const { blockSensitiveRoutes } = require("./backend/security/security");
const { setupSockets } = require("./backend/sockets/setupSockets");
const { setupStaticMiddlewares } = require("./backend/middlewares/static");
const { setupMainRoutes } = require("./backend/routes/mainRoutes");
const { checkAndHandleExistingInstance, writePidFile, setupProcessHandlers } = require("./backend/utils/processManager");
const { startServer } = require("./backend/startServer");

let initializeGPIO = null;
let cleanupGPIO = null;

// ===== Helper: Get LAN IP =====
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}
const ownip = getLocalIp();

// ===== Initialization & Config =====
setupLogger();
const config = loadConfig(io);
const serverPort = config?.MainServer?.port || 3000;
const smstype = config?.MainServer?.sms || 0;

console.log(`Starting server on unified Application Mode`);

// Try loading GPIO module for Raspberry Pi functionality gracefully
try {
  const gpioModule = require("./backend/services/gpiobuttons");
  initializeGPIO = gpioModule.initializeGPIO;
  cleanupGPIO = gpioModule.cleanupGPIO;
  console.log("✅ GPIO module loaded");
} catch (err) {
  console.log("⚠️  GPIO module not loaded (probably not on a Raspberry Pi or missing dependencies)");
}

// ===== Process Checking =====
if (checkAndHandleExistingInstance(pidFile)) {
  process.exit(1);
}
writePidFile(pidFile);
setupProcessHandlers(server, pidFile, smstype, cleanupGPIO);

// ===== Express Middlewares & Routes =====
blockSensitiveRoutes(appExpress); 
setupStaticMiddlewares(appExpress, rootpath, OUTFOLDER_PATH);
setupMainRoutes(appExpress, rootpath);

// ===== Start Server =====
setupSockets(io, smstype, pidFile);

startServer({
  appExpress,
  io,
  server,
  serverPort,
  ownip,
  initializeGPIO,
  cleanupGPIO,
  pidFile,
  smstype
});
