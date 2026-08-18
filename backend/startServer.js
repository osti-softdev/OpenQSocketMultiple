const { initializeDb } = require("./db/db");
const setupVideosApi = require("./routes/videos");
const setupImagesApi = require("./routes/images");
const { gracefulShutdown } = require("./utils/processManager");

async function startServer(options) {
  const {
    appExpress,
    io,
    server,
    serverPort,
    ownip,
    initializeGPIO,
    cleanupGPIO,
    pidFile,
    smstype
  } = options;

  try {
    // Initialize database
    await initializeDb();
    console.log("Database initialized successfully");

    // Initialize APIs
    setupVideosApi(appExpress);
    setupImagesApi(appExpress, io);

    server.listen(serverPort, () => {
      console.log(`Server running on http://${ownip}:${serverPort}`);
      
      // Initialize Hardware Bridges immediately on startup
      if (initializeGPIO) {
        initializeGPIO(io);
      }
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    await gracefulShutdown("STARTUP_ERROR", server, pidFile, smstype, cleanupGPIO);
  }
}

module.exports = { startServer };
