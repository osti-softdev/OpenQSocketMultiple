const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

// Prevent a 2nd instance of the Main App from starting
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    console.log("Main App is already running. Second instance prevented from starting.");
    app.quit();
    process.exit(0);
}

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

// Allow audio/video on /display and /kiosk to autoplay without user gesture after hot-plug
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let kioskWindow = null;
let displayWindow = null;
let displaySyncTimer = null;
let isQuitting = false;

function shutdownApp() {
    if (isQuitting) return;
    isQuitting = true;

    if (displaySyncTimer) {
        clearTimeout(displaySyncTimer);
        displaySyncTimer = null;
    }

    if (displayWindow && !displayWindow.isDestroyed()) {
        try {
            displayWindow.destroy();
        } catch (e) {}
    }
    displayWindow = null;

    if (kioskWindow && !kioskWindow.isDestroyed()) {
        try {
            kioskWindow.destroy();
        } catch (e) {}
    }
    kioskWindow = null;

    app.quit();
    app.exit(0);
}

app.on("second-instance", () => {
    if (kioskWindow && !kioskWindow.isDestroyed()) {
        if (kioskWindow.isMinimized()) kioskWindow.restore();
        kioskWindow.focus();
    }
    if (displayWindow && !displayWindow.isDestroyed()) {
        if (displayWindow.isMinimized()) displayWindow.restore();
    }
});

function getExternalDisplay() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const displays = screen.getAllDisplays();

    return displays.find((display) => {
        if (primaryDisplay && typeof display.id !== "undefined" && typeof primaryDisplay.id !== "undefined") {
            return display.id !== primaryDisplay.id;
        }
        return display.bounds.x !== 0 || display.bounds.y !== 0;
    }) || null;
}

function moveWindowToDisplay(win, targetDisplay) {
    if (!win || win.isDestroyed() || !targetDisplay) return;

    const targetBounds = targetDisplay.bounds;
    const currentBounds = win.getBounds();
    const boundsChanged =
        currentBounds.x !== targetBounds.x ||
        currentBounds.y !== targetBounds.y ||
        currentBounds.width !== targetBounds.width ||
        currentBounds.height !== targetBounds.height;

    if (boundsChanged) {
        win.setFullScreen(false);
        win.setBounds({
            x: targetBounds.x,
            y: targetBounds.y,
            width: targetBounds.width,
            height: targetBounds.height
        });
        win.setFullScreen(true);
    } else if (!win.isFullScreen()) {
        win.setFullScreen(true);
    }
}

function syncDisplayWindows(reason = "startup") {
    if (isQuitting) return;

    const primaryDisplay = screen.getPrimaryDisplay();
    const externalDisplay = getExternalDisplay();

    // 1. Ensure Kiosk Window exists and stays anchored on Primary Display
    if (!kioskWindow || kioskWindow.isDestroyed()) {
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

        kioskWindow.on("closed", () => {
            kioskWindow = null;
            // Closing the main Kiosk window closes Display window and terminates the entire app
            shutdownApp();
        });
    } else {
        moveWindowToDisplay(kioskWindow, primaryDisplay);
    }

    // 2. Automatically open, reposition, or close Display Window based on External Display state
    if (externalDisplay) {
        if (!displayWindow || displayWindow.isDestroyed()) {
            console.log(
                `[${reason}] External display detected (${externalDisplay.bounds.width}x${externalDisplay.bounds.height} at ${externalDisplay.bounds.x},${externalDisplay.bounds.y}). Opening /display window...`
            );

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

            displayWindow.on("closed", () => {
                displayWindow = null;
            });
        } else {
            moveWindowToDisplay(displayWindow, externalDisplay);
        }
    } else {
        if (displayWindow && !displayWindow.isDestroyed()) {
            console.log(`[${reason}] External display disconnected. Closing /display window.`);
            const winToClose = displayWindow;
            displayWindow = null;
            winToClose.close();
        } else if (reason === "startup") {
            console.log("No external display found at startup. Waiting for external display connection...");
        }
    }
}

function scheduleDisplaySync(reason) {
    if (isQuitting) return;
    if (displaySyncTimer) {
        clearTimeout(displaySyncTimer);
    }
    displaySyncTimer = setTimeout(() => {
        displaySyncTimer = null;
        if (!isQuitting) {
            syncDisplayWindows(reason);
        }
    }, 500);
}

function createWindows() {
    syncDisplayWindows("startup");
}

app.whenReady().then(() => {
    // Watch for runtime hot-plug, unplug, or resolution changes on external displays
    screen.on("display-added", () => scheduleDisplaySync("display-added"));
    screen.on("display-removed", () => scheduleDisplaySync("display-removed"));
    screen.on("display-metrics-changed", () => scheduleDisplaySync("display-metrics-changed"));

    // Small delay to ensure Express is fully listening before windows load
    setTimeout(() => {
        createWindows();
    }, 1000);
});

app.on("before-quit", () => {
    isQuitting = true;
    if (displaySyncTimer) {
        clearTimeout(displaySyncTimer);
        displaySyncTimer = null;
    }
});

// Quit completely (including Express / Socket.IO server) when all windows are closed
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        shutdownApp();
    }
});

app.on("will-quit", () => {
    app.exit(0);
});

app.on("activate", () => {
    if (!isQuitting && kioskWindow === null) {
        createWindows();
    }
});
