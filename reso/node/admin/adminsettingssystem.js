const path = require("path");
const fs = require("fs");

const rootPath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootPath, "config/db.db");
const envFilePath = path.join(rootPath, "config/.env");
const { loadConfig } = require("../envconfig");

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
	const config = loadConfig(io);

	const smsType = config?.MainServer?.sms;
	const systemType = config?.MainServer?.systemType;
	const counterDisplay = config?.MainServer?.counterDisplay;
	const databaseRetentionDays = config?.MainServer?.databaseRetentionDays;

	// Watch DB for live updates
	if (!watcherAdded) {
		fs.watchFile(dbPath, { interval: 1000 }, async () => {
			try {
				const dbsizedata = await getDatabaseSize();

				socket.emit("systemConfigs", {
					data: {
						db: dbsizedata,
						smsType,
						systemType,
						counterDisplay,
						databaseRetentionDays,
					},
				});
			} catch (err) {
				console.error("❌ Error refreshing system configs:", err);
			}
		});
		watcherAdded = true;
	}

	socket.on("getsysconfigs", async () => {
		try {
			const dbsizedata = await getDatabaseSize();

			socket.emit("systemConfigs", {
				data: {
					db: dbsizedata,
					smsType,
					systemType,
					counterDisplay,
					databaseRetentionDays,
				},
			});
		} catch (err) {
			console.error("❌ Error getting system configs:", err);
		}
	});

	socket.on("updateSystemConfig", async (payload) => {
	try {
		const { key, value } = payload;
		if (!key) return;

		// Read current env
		let envContent = "";
		if (fs.existsSync(envFilePath)) {
			envContent = fs.readFileSync(envFilePath, "utf8");
		}

		// Update or append key=value
		const regex = new RegExp(`^${key}=.*$`, "m");
		if (regex.test(envContent)) {
			envContent = envContent.replace(regex, `${key}=${value}`);
		} else {
			envContent += `\n${key}=${value}`;
		}

		fs.writeFileSync(envFilePath, envContent.trim() + "\n", "utf8");
		console.log(`✅ Updated .env: ${key}=${value}`);

		// Broadcast reload trigger
		io.emit("reloadSystem");

		// Optional: delay before relaunch (for file sync)
		setTimeout(() => {
			io.emit("relaunchApp");
			process.exit(0); 
		}, 1000);
	} catch (err) {
		console.error("❌ Failed to update .env:", err);
		socket.emit("envUpdateError", { message: err.message });
	}
});
}

module.exports = { setupsystemconfigurations };
