const fs = require("fs");
const path = require("path");

const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");
let lastAdsList = [];
let voiceConfig = { voice: 0, ad_volume: 0.5 };

let isWatcherInitialized = false;



function setupAds(socket, io) {
	const adsFolder = path.join(rootpath, "ads");
	const configFolder = path.join(rootpath, "config");
	const soundandvoice = path.join(configFolder, "soundandvoice.json");
	const defaultConfig = { voice: 0, ad_volume: 0.5 };

	// Ensure config file exists
	function ensureConfigFile() {
		if (!fs.existsSync(configFolder))
			fs.mkdirSync(configFolder, { recursive: true });
		if (!fs.existsSync(soundandvoice)) {
			fs.writeFileSync(
				soundandvoice,
				JSON.stringify(defaultConfig, null, 2),
				"utf8"
			);
		}
	}

	// Load ads from folder
	function gatherAds() {
		if (!fs.existsSync(adsFolder)) return [];
		return fs
			.readdirSync(adsFolder)
			.filter((f) => /\.(mp4|webm|ogg)$/i.test(f));
	}

	// Load voice config
	function loadVoiceConfig() {
		ensureConfigFile();
		try {
			const raw = fs.readFileSync(soundandvoice, "utf8");
			const config = JSON.parse(raw);
			return { voice: config.voice ?? 0, ad_volume: config.ad_volume ?? 0.5 };
		} catch {
			console.warn("[ADS] Invalid JSON, using default config");
			return defaultConfig;
		}
	}

	// Send ads list to one client
	function sendAdsList(target) {
		const urls = lastAdsList.map((n) => `/ads/${encodeURIComponent(n)}`);
		target.emit("adsList", {
			ads: lastAdsList,
			urls,
			volume: voiceConfig.ad_volume,
		});
		// console.log(
		// 	`[ADS] Sent ${lastAdsList.length} ads to ${target.id || "ALL"}, volume=${
		// 		voiceConfig.ad_volume
		// 	}, voice=${voiceConfig.voice}`
		// );
	}

	// Broadcast ads list to all clients
	function broadcastAdsList() {
		io.emit("adsList", { ads: lastAdsList, volume: voiceConfig.ad_volume });
		console.log(
			`[ADS] Broadcast ${lastAdsList.length} ads, volume=${voiceConfig.ad_volume}`
		);
	}

	// Initialize lists
	lastAdsList = gatherAds();
	voiceConfig = loadVoiceConfig();
	sendAdsList(socket);

	// Handle client refresh request
	socket.on("requestAd", () => {
		console.log(`[ADS] Client ${socket.id} requested ad refresh`);
		sendAdsList(socket);
	});

	// Initialize watchers only once
	if (!isWatcherInitialized) {
		isWatcherInitialized = true;

		// Watch ads folder
		if (fs.existsSync(adsFolder)) {
			let adsTimeout;
			fs.watch(adsFolder, () => {
				clearTimeout(adsTimeout);
				adsTimeout = setTimeout(() => {
					const updatedList = gatherAds();
					if (updatedList.join(",") !== lastAdsList.join(",")) {
						lastAdsList = updatedList;
						broadcastAdsList();
					}
				}, 200); // debounce
			});
		}

		// Watch soundandvoice.json
		let configTimeout;
		fs.watch(soundandvoice, () => {
			clearTimeout(configTimeout);
			configTimeout = setTimeout(() => {
				const newConfig = loadVoiceConfig();
				if (
					newConfig.ad_volume !== voiceConfig.ad_volume ||
					newConfig.voice !== voiceConfig.voice
				) {
					voiceConfig = newConfig;
					broadcastAdsList();
				}
			}, 200);
		});
	}
}

module.exports = { setupAds };
