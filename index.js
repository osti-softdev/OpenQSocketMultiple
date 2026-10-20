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

// Helper to find any display that is NOT the primary display
function getExternalDisplay() {
    const primaryDisplay = screen.getPrimaryDisplay();
    return screen.getAllDisplays().find((d) => d.id !== primaryDisplay.id);
}

function createKioskWindow() {
    if (kioskWindow && !kioskWindow.isDestroyed()) return;

    const primaryDisplay = screen.getPrimaryDisplay();
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
}

function openDisplayWindow(externalDisplay) {
    if (displayWindow && !displayWindow.isDestroyed()) return;

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

    displayWindow.webContents.setZoomFactor(0.6);
    displayWindow.loadURL(`${BASE_URL}/display`);

    displayWindow.on('closed', () => {
        displayWindow = null;
    });
}

function closeDisplayWindow() {
    if (displayWindow && !displayWindow.isDestroyed()) {
        displayWindow.close();
    }
    displayWindow = null;
}

function syncDisplays() {
    const externalDisplay = getExternalDisplay();

    if (externalDisplay) {
        if (!displayWindow || displayWindow.isDestroyed()) {
            console.log("External display detected. Launching display window...");
            openDisplayWindow(externalDisplay);
        }
    } else {
        if (displayWindow && !displayWindow.isDestroyed()) {
            console.log("No external display available. Closing display window...");
            closeDisplayWindow();
        }
    }
}

app.whenReady().then(() => {
    // Small delay to ensure Express is fully listening before windows load
    setTimeout(() => {
        createKioskWindow();
        syncDisplays();

        // Dynamically handle displays connecting, disconnecting, or changing bounds
        screen.on('display-added', () => {
            console.log("Display added event detected.");
            syncDisplays();
        });

        screen.on('display-removed', () => {
            console.log("Display removed event detected.");
            syncDisplays();
        });

        screen.on('display-metrics-changed', () => {
            syncDisplays();
        });
    }, 1000);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (kioskWindow === null) {
        createKioskWindow();
        syncDisplays();
    }
});
