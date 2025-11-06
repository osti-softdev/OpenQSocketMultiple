const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const rootPath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootPath, "config/db.db");

let watcherAdded = false;

// GET DATABASE SIZE
async function getDatabaseSize() {
	try {
		const stats = fs.statSync(dbPath);
		const bytes = stats.size;

		const units = ["B", "KB", "MB", "GB", "TB", "PB"];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		const formatted = `${size} ${units[unitIndex]}`;

		return {
			bytes,
			formatted,
			value: size, // exact value without rounding
			unit: units[unitIndex],
		};
	} catch (err) {
		console.error("Error getting database size:", err.message);
		return null;
	}
}

/* =====================================================
   ⚙️ Socket Setup
===================================================== */
function setupsystemconfigurations(socket, io) {

	// 👀 Watch DB for Live Updates
	if (!watcherAdded) {
		fs.watchFile(dbPath, { interval: 1000 }, async () => {
			try {
				const dbsizedata = await getDatabaseSize();
				socket.emit("dbsizeapi", { data: dbsizedata });
			} catch (err) {
				console.error("❌ Error refreshing tellers:", err);
			}
		});
		watcherAdded = true;
	}

	socket.on("getdbsize", async () => {
		try {
			const dbsizedata = await getDatabaseSize();
			socket.emit("dbsizeapi", { data: dbsizedata });
		} catch (err) {
			console.error("❌ Error getting database size:", err);
		}
	});
}

module.exports = { setupsystemconfigurations };
