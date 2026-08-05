const { app, BrowserWindow, ipcMain, screen, session } = require("electron");
const fs = require("fs");
const { readdir } = require("fs");
const path = require("path");
const axios = require("axios"); // Add Axios for HTTP request
const { exec } = require("child_process");

const express = require('express');
const expressApp = express();
const multer = require('multer');
const requestAPI = multer()
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');

const logStream = fs.createWriteStream(path.join(__dirname, "error.log"), {
  flags: "a",
});
const errorConsole = new console.Console({
  stderr: logStream,
  stdout: process.stdout,
});
// Override console.error to write to the log file
console.error = (...args) => {
  const ticksnowaf = new Date().toISOString(); // Get current date and time in ISO format
  errorConsole.error(ticksnowaf, ...args); // Prepend date and time to the error message
};

function getCurrentDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}
let initialDate = getCurrentDate();

function checkDateChange() {
  const currentDate = getCurrentDate();

  if (currentDate !== initialDate) {
    cleardbtransac();
    getservices();
    app.relaunch();
    app.exit(0);
  }
}

setInterval(checkDateChange, 1000);

var tagline = "../../";
tagline = "./";
// check database
function checkDatabaseConnection() {
  return new Promise((resolve, reject) => {
    axios.get('http://localhost:12341/kiosk')
      .then(() => {
        resolve("true");
      })
      .catch((error) => {
        reject(new Error("Connection refused: Check if the main server is running."));
      });
  });
}

function createWindow() {
  checkDatabaseConnection()
    .then((connected) => {
      const displays = screen.getAllDisplays();

      if (displays.length > 1) {
        const externalDisplay = displays.find(
          (display) => display.bounds.x !== 0 || display.bounds.y !== 0
        );

        if (externalDisplay) {
          const kioskwindowdisplay = new BrowserWindow({
            width: 400,
            height: 400,
            show: true,
            autoHideMenuBar: true,
            frame: true
          });
          kioskwindowdisplay.setFullScreen(true);
          kioskwindowdisplay.loadURL('http://localhost:12341/kiosk');

        }
      } else {

        const kioskwindowdisplay = new BrowserWindow({
          width: 400,
          height: 400,
          show: true,
          autoHideMenuBar: true,
          frame: true
        });
        kioskwindowdisplay.setFullScreen(true);
        kioskwindowdisplay.loadURL('http://localhost:12341/kiosk');
      }
    })
    .catch((error) => {
      const alertWindow = new BrowserWindow({
        width: 400,
        height: 400,
        hasShadow: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
          nodeIntegration: true,
          preload: path.join(__dirname, "reso", "node", "appstatus.js"),
        },
        autoHideMenuBar: true,
        frame: false,
      });
      alertWindow.loadFile("error.html");
      alertWindow.once("ready-to-show", () => { });
      alertWindow.webContents.on("did-finish-load", () => { });
      setTimeout(() => {
        app.relaunch();
        app.quit();
      }, 15000);
    });
}

app.on("ready", () => {
  session.defaultSession.clearCache(() => {
    console.log("Cache cleared");
  });
});

// Create the main window when Electron has finished initializing
app.whenReady().then(createWindow);
// Quit the app when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Re-create the main window if the app is activated and no windows are open
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("appstatus", (event, stats) => {
  if (stats == "relaunch") {
    app.relaunch();
    app.quit();
  } else {
    app.quit();
  }
});

expressApp.use(express.urlencoded({ extended: true }));
expressApp.use(express.json({ limit: '1000mb' }));
expressApp.use(express.urlencoded({ limit: '1000mb', extended: true }));
expressApp.use(bodyParser.json({ limit: '1000mb' }));
expressApp.use(bodyParser.urlencoded({ limit: '1000mb', extended: true }));
expressApp.use(cors());

expressApp.use((req, res, next) => {
  res.removeHeader('Content-Disposition');
  next();
});

expressApp.post("/api/requestor", requestAPI.none(), (req, res) => {
  console.log("Received data at requestor:", req.body);
  // Here you can process the data as needed, for example:
  const { service, ticket, note, service_name, date, time, ip } = req.body;

  executephp(service, ticket, note, service_name, date, time);
  // Respond back to the client (if needed)
  return res.status(200).json({ success: true, message: "Data received successfully", data: req.body });
})

const localIP = getLocalIP(); // Get the local IP address dynamically
expressApp.listen(3234, localIP, () => {
  console.log("Server started at port 3232 on 10.1.0.98");
});
expressApp.use('/reso', express.static(path.join(__dirname, 'reso')));
expressApp.use('/outfolder', express.static(path.join(__dirname, `${tagline}outfolder`)));
expressApp.use('/node', express.static(path.join(__dirname, 'node')));


let argumentprevious = "";

function formatArgument(...args) {
  return args.map(arg => {
    // Ensure all fields are quoted and internal quotes escaped
    const safe = String(arg).replace(/"/g, '""'); // escape quotes
    return `"${safe}"`;
  }).join(',');
}

function executephp(service, ticket, note, service_name, date, time) {
  const argument = formatArgument(service, ticket, note, service_name, date, time);

  if (argument !== argumentprevious) {
    exec(
      `php ${tagline}outfolder/printer/print.php "${argument}"`,
      (error, stdout, stderr) => {
        argumentprevious = argument;
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        if (stderr) console.error(`stderr: ${stderr}`);
        if (stdout) console.log(`stdout: ${stdout}`);
      }
    );
  } else {
    console.log("Duplicate argument detected, skipping PHP execution.");
  }
}


function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    for (const interfaceInfo of interfaces[interfaceName]) {
      if (interfaceInfo.family === "IPv4" && !interfaceInfo.internal) {
        return interfaceInfo.address; // Return the first valid IPv4 address found
      }
    }
  }
  throw new Error("No valid IPv4 address found.");
}