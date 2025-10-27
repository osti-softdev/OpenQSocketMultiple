const fs = require("fs");
const path = require("path");
const fsp = require("fs").promises;
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");

function setupFooterWatcher(socket, io) {
	const footerPath = path.join(rootpath, "/config/footer.json");
	const modsPath = path.join(rootpath, "/config/modifications.json");

	// Send current footer on new connection
	sendFooter(socket);

	// Handle updatefooter request
	socket.on("updatefooter", async () => {
		try {
			const data = await fsp.readFile(footerPath, "utf8");
			const footerData = JSON.parse(data);

			if (footerData.display_update?.update !== undefined) {
				footerData.display_update.update = 0;
			} else {
				console.warn("⚠ display_update key not found in footer.json");
			}

			await fsp.writeFile(
				footerPath,
				JSON.stringify(footerData, null, 4),
				"utf8"
			);
			console.log("✅ footer.json display_update set to 0");
			socket.emit("updatefooterSuccess", footerData);
		} catch (err) {
			console.error("❌ Error updating footer.json:", err);
			socket.emit("updatefooterError", "Failed to update footer.json");
		}
	});

	// Watch for changes in footer.json and broadcast
	fs.watch(footerPath, (eventType) => {
		if (eventType === "change") {
			sendFooter(io);
		}
	});

	function sendFooter(target) {
		fs.readFile(footerPath, "utf8", (err, data) => {
			if (err) {
				console.error("Error reading footer.json:", err);
				return;
			}
			try {
				const config = JSON.parse(data);
				target.emit("footerUpdated", config);
			} catch (parseErr) {
				console.error("Invalid footer.json format:", parseErr);
			}
		});
	}
}

module.exports = { setupFooterWatcher };
