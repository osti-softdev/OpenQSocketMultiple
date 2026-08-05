const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

// Ensure global paths are set up so envconfig.js works
let tagline = "./";
const rootpath = path.join(__dirname);
global.ROOT_PATH = rootpath;
global.BACKEND_PATH = path.join(rootpath, `${tagline}backend`);

// Now start the Express server
require("./server.js");

// Load the configuration to get the server port
const { loadConfig } = require(path.join(global.BACKEND_PATH, "utilities/envconfig.js"));
const config = loadConfig();
const SERVER_PORT = config?.MainServer?.port || 3000;
const BASE_URL = `http://localhost:${SERVER_PORT}`;

let kioskWindow = null;
let displayWindow = null;

app.whenReady().then(() => {
    // Small delay to ensure Express is fully listening before windows load
    setTimeout(() => {
        createWindows();
    }, 1000);
});

function createWindows() {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();

    // Find a secondary display, if any
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0;
    });

    // 1. Create Kiosk Window (on Primary Display)
    kioskWindow = new BrowserWindow({
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        width: primaryDisplay.bounds.width,
        height: primaryDisplay.bounds.height,
        fullscreen: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    kioskWindow.loadURL(`${BASE_URL}/kiosk`);

    kioskWindow.on('closed', () => {
        kioskWindow = null;
    });

    // 2. Create Display Window (on Extended Display, if available)
    if (externalDisplay) {
        displayWindow = new BrowserWindow({
            x: externalDisplay.bounds.x,
            y: externalDisplay.bounds.y,
            width: externalDisplay.bounds.width,
            height: externalDisplay.bounds.height,
            fullscreen: true,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        displayWindow.loadURL(`${BASE_URL}/display`);

        displayWindow.on('closed', () => {
            displayWindow = null;
        });
    } else {
        console.log("No external display found for the /display window.");
    }
}

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (kioskWindow === null) {
        createWindows();
    }
});
