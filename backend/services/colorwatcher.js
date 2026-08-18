const fs = require("fs");
const path = require("path");
const fsp = require("fs").promises;
const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");

function setupdisplaycolorwatcher(socket, io) {
	// const footerPath = path.join(rootpath, "/config/footer.json");
	const modsPath = path.join(rootpath, "/config/modifications.json");

	// Send on new connection
	// sendFooter(socket);
	sendDisplay(io);

	// --- Footer update handler
	// socket.on("updatefooter", async () => {
	// 	try {
	// 		const data = await fsp.readFile(footerPath, "utf8");
	// 		const footerData = JSON.parse(data);

	// 		if (footerData.display_update?.update !== undefined)
	// 			footerData.display_update.update = 0;
	// 		else
	// 			console.warn("⚠ display_update missing in footer.json");

	// 		await fsp.writeFile(footerPath, JSON.stringify(footerData, null, 4));
	// 		console.log("✅ footer.json display_update set to 0");
	// 		socket.emit("updatefooterSuccess", footerData);
	// 	} catch (err) {
	// 		console.error("❌ Error updating footer.json:", err);
	// 		socket.emit("updatefooterError", "Failed to update footer.json");
	// 	}
	// });

	// --- Display update handler
	socket.on("updateDisplay", async () => {
		try {
			const data = await fsp.readFile(modsPath, "utf8");
			const displayData = JSON.parse(data);

			if (displayData.display_update?.update !== undefined)
				displayData.display_update.update = 0;
			else
				console.warn("⚠ display_update missing in modifications.json");

			await fsp.writeFile(modsPath, JSON.stringify(displayData, null, 4));
			console.log("✅ modifications.json display_update set to 0");
			socket.emit("updatedisplaySuccess", displayData);
		} catch (err) {
			console.error("❌ Error updating modifications.json:", err);
			socket.emit("updatedisplayError", "Failed to update modification.json");
		}
	});

	// --- Reliable file watchers
	// let footerTimeout = null;
	let displayTimeout = null;

	// fs.watchFile(footerPath, { interval: 1000 }, () => {
	// 	clearTimeout(footerTimeout);
	// 	footerTimeout = setTimeout(() => sendFooter(io), 1000);
	// });

	fs.watchFile(modsPath, { interval: 800 }, () => {
		clearTimeout(displayTimeout);
		displayTimeout = setTimeout(() => sendDisplay(io), 500);
	});

	// --- Emitters
	// function sendFooter(target) {
	// 	readAndEmit(target, footerPath, "footerUpdated");
	// }
	function sendDisplay(target) {
		readAndEmit(target, modsPath, "DisplayUpdated");			
	}

	function readAndEmit(target, filePath, event) {
		fs.readFile(filePath, "utf8", (err, data) => {
			if (err) return console.error(`Error reading ${filePath}:`, err);
			try {
				const config = JSON.parse(data);
				target.emit(event, config);
			} catch (e) {
				console.error(`Invalid JSON in ${filePath}:`, e);
			}
		});
	}
}

module.exports = { setupdisplaycolorwatcher };
