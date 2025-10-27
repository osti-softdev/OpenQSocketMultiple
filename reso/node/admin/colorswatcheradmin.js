const fs = require("fs");
const path = require("path");
const fsp = require("fs").promises;
const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");

function setupColorWatcheradmin(socket, io) {
    const colormodpath = path.join(rootpath, "/config/modifications.json");

    // Send current config when a client connects
    sendColoradmin(socket);

    // ✅ Reset display_update.update flag
    socket.on("updatecoloradmin", async () => {
        try {
            const data = await fsp.readFile(colormodpath, "utf8");
            const footerData = JSON.parse(data);

            if (footerData.display_update?.update !== undefined) {
                footerData.display_update.update = 0;
            }

            await fsp.writeFile(colormodpath, JSON.stringify(footerData, null, 4), "utf8");
            console.log("✅ display_update.reset to 0");
            socket.emit("updatecolorSuccessadmin", footerData);
        } catch (err) {
            console.error("❌ Error updating modifications.json:", err);
            socket.emit("updatecolorError", "Failed to update modifications.json");
        }
    });

    // ✅ Handle color configuration updates (no ann_data)
    socket.on("updateColorconfigadmin", async (colorconfigs) => {
        try {
            const data = await fsp.readFile(colormodpath, "utf8");
            const footerData = JSON.parse(data);

            // Update only provided keys directly at root level
            Object.keys(colorconfigs).forEach(key => {
                footerData[key] = colorconfigs[key];
            });

            await fsp.writeFile(colormodpath, JSON.stringify(footerData, null, 4), "utf8");

            io.emit("ColorUpdatedadmin", footerData); // Sync all clients
            socket.emit("updateColorconfigSuccess", footerData);
            console.log("🎨 Color configuration updated:", colorconfigs);
        } catch (err) {
            console.error("❌ Error updating color configs:", err);
            socket.emit("updateColorconfigError", "Failed to update color configs");
        }
    });

    // ✅ Watch file changes
    fs.watch(colormodpath, (eventType) => {
        if (eventType === "change") {
            sendColoradmin(io);
        }
    });

    function sendColoradmin(target) {
        fs.readFile(colormodpath, "utf8", (err, data) => {
            if (err) {
                console.error("Error reading modifications.json:", err);
                return;
            }
            try {
                const config = JSON.parse(data);
                target.emit("ColorUpdatedadmin", config);
            } catch (parseErr) {
                console.error("Invalid modifications.json format:", parseErr);
            }
        });
    }
}

module.exports = { setupColorWatcheradmin };
