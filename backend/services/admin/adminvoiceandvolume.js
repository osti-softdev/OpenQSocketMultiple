const fs = require("fs");
const path = require("path");
const fsp = fs.promises;

const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");
const soundFile = path.join(rootpath, "/config/soundandvoice.json");

// Default settings in case of invalid JSON
const defaultSettings = {
	voice: 0,
	voice_rate: 0.5,
	voice_pitch: 1,
	ad_volume: 0.5,
	voice_volume: 1,
	bell_volume: 1,
};

// Simple debounce function
function debounce(func, wait) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}

// Validate settings before writing
function validateSettings(settings) {
	const validKeys = [
		"voice",
		"voice_rate",
		"voice_pitch",
		"ad_volume",
		"voice_volume",
		"bell_volume",
	];
	const validated = {};
	for (const key of validKeys) {
		if (key in settings) {
			validated[key] = settings[key];
		} else {
			validated[key] = defaultSettings[key]; // Use default if missing
		}
	}
	return validated;
}

function setupSoundSettingsAdmin(socket, io) {
	// Send initial settings on connect
	sendSoundSettings(socket);

	// Client requests voice list (handled client-side using speechSynthesis)
	socket.on("requestVoices", () => {
		socket.emit("voicesReady");
	});

	// Update settings from client
	socket.on("updateSoundSettings", async (newSettings) => {
		try {
			// Validate and sanitize new settings
			const current = await loadSoundSettings();
			const validatedSettings = validateSettings({
				...current,
				...newSettings,
			});

			// Test JSON serialization before writing
			JSON.stringify(validatedSettings); // Will throw if invalid

			// Write settings atomically
			await fsp.writeFile(
				soundFile,
				JSON.stringify(validatedSettings, null, 4),
				{
					encoding: "utf8",
				}
			);

			// console.log("✅ soundandvoice.json updated:", validatedSettings);
			io.emit("soundSettingsUpdated", validatedSettings);
			socket.emit("updateSoundSettingsSuccess", validatedSettings);
		} catch (err) {
			console.error("❌ Error updating sound settings:", err);
			socket.emit(
				"updateSoundSettingsError",
				`Failed to update settings: ${err.message}`
			);
		}
	});

	// Debounced file watcher to avoid reading during writes
	const debouncedSendSoundSettings = debounce(() => {
		sendSoundSettings(io);
	}, 100);

	// Watch for changes and broadcast
	fs.watch(soundFile, (eventType) => {
		if (eventType === "change") {
			debouncedSendSoundSettings();
		}
	});

	async function loadSoundSettings() {
		try {
			const data = await fsp.readFile(soundFile, "utf8");
			if (!data.trim()) {
				// console.error("soundandvoice.json is empty");
				return defaultSettings;
			}
			const parsed = JSON.parse(data);
			return validateSettings(parsed);
		} catch (err) {
			console.error("Error reading or parsing soundandvoice.json:", err);
			return defaultSettings;
		}
	}

	function sendSoundSettings(target) {
		fs.readFile(soundFile, "utf8", (err, data) => {
			if (err) {
				console.error("Error reading soundandvoice.json:", err);
				target.emit("soundSettingsUpdated", defaultSettings);
				return;
			}
			try {
				if (!data.trim()) {
					console.error("soundandvoice.json is empty");
					target.emit("soundSettingsUpdated", defaultSettings);
					return;
				}
				const config = JSON.parse(data);
				const validatedConfig = validateSettings(config);
				target.emit("soundSettingsUpdated", validatedConfig);
			} catch (parseErr) {
				console.error("Invalid soundandvoice.json format:", parseErr);
				console.error("Invalid JSON content:", data);
				target.emit("soundSettingsUpdated", defaultSettings);
			}
		});
	}
}

module.exports = { setupSoundSettingsAdmin };
