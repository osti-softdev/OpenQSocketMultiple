const fs = require("fs");
const path = require("path");
const fsp = fs.promises;

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const colormodpath = path.join(rootpath, "config/modifications.json");

let colorWatcherInitialized = false; // Prevent multiple fs.watch registrations

/**
 * Setup admin color watcher and socket handlers
 */
function setupColorWatcheradmin(socket, io) {
    ensureValidJson(colormodpath);

    // Send current configuration to the connected client
    sendColoradmin(socket);

    /**
     * Reset display_update.update to 0
     */
    socket.on("updatecoloradmin", async () => {
        try {
            const footerData = await safeReadJSON(colormodpath);
            if (!footerData.display_update) footerData.display_update = {};
            footerData.display_update.update = 0;

            await safeWriteJSON(colormodpath, footerData);

            console.log("✅ display_update.reset to 0");
            socket.emit("updatecolorSuccessadmin", footerData);
        } catch (err) {
            console.error("❌ Error updating modifications.json:", err);
            socket.emit("updatecolorError", "Failed to update modifications.json");
        }
    });

    /**
     * Update color configuration keys at root level
     */
    socket.on("updateColorconfigadmin", async (colorconfigs) => {
        try {
            const footerData = await safeReadJSON(colormodpath);
            Object.assign(footerData, colorconfigs);

            await safeWriteJSON(colormodpath, footerData);

            io.emit("ColorUpdatedadmin", footerData);
            socket.emit("updateColorconfigSuccess", footerData);

            console.log("🎨 Color configuration updated:", colorconfigs);
        } catch (err) {
            console.error("❌ Error updating color configs:", err);
            socket.emit("updateColorconfigError", "Failed to update color configs");
        }
    });

    /**
     * Watch for file changes once globally (avoid EventEmitter leaks)
     */
    if (!colorWatcherInitialized) {
        colorWatcherInitialized = true;
        try {
            fs.watch(colormodpath, (eventType) => {
                if (eventType === "change") {
                    sendColoradmin(io);
                }
            });
            console.log("🟢 Watching color configuration file:", colormodpath);
        } catch (err) {
            console.error("❌ Failed to watch file:", err);
        }
    }
}

/**
 * Send color configuration to a specific socket or entire IO instance
 */
function sendColoradmin(target) {
    safeReadJSON(colormodpath)
        .then((config) => {
            target.emit("ColorUpdatedadmin", config);
        })
        .catch((err) => {
            console.error("Invalid modifications.json format:", err);
        });
}

/**
 * Safely read JSON from file
 * Returns {} if file is empty or invalid JSON
 */
async function safeReadJSON(file) {
    try {
        const data = await fsp.readFile(file, "utf8");
        if (!data.trim()) return {}; // Empty file case
        return JSON.parse(data);
    } catch (err) {
        console.error("⚠️ Could not parse JSON:", err);
        return {};
    }
}

/**
 * Safely write JSON atomically to prevent corruption
 */
async function safeWriteJSON(file, data) {
    const tempFile = file + ".tmp";
    const jsonString = JSON.stringify(data, null, 4);
    await fsp.writeFile(tempFile, jsonString, "utf8");
    await fsp.rename(tempFile, file);
}

/**
 * Ensure modifications.json exists and is valid
 */
function ensureValidJson(file) {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({}, null, 4));
        console.log("🆕 Created missing modifications.json");
    } else {
        // Validate existing file
        try {
            const data = fs.readFileSync(file, "utf8");
            if (!data.trim() || !isJsonValid(data)) {
                fs.writeFileSync(file, JSON.stringify({}, null, 4));
                console.log("⚠️ Reset invalid modifications.json");
            }
        } catch {
            fs.writeFileSync(file, JSON.stringify({}, null, 4));
            console.log("⚠️ Recreated modifications.json due to error");
        }
    }
}

/**
 * Helper: Check if a string is valid JSON
 */
function isJsonValid(str) {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

module.exports = { setupColorWatcheradmin };
