const path = require("path");
const dotenv = require("dotenv");

const rootpath = global.BACKEND_PATH;

// Load .env file from config folder
const envPath = path.join(rootpath, "/config/.env");
const result = dotenv.config({ path: envPath });

if (result.error) {
	console.error("Error loading .env file:", result.error.message);
	process.exit(1);
}

function loadConfig() {
	const config = {
		MainServer: {
			port: process.env.PORT,
			camscan: process.env.CAMSCAN === "true",
			expiry: process.env.ONLINETICKETEXPIRY,
			ticketonline: process.env.ONLINETICKETING === "true"
		},
	};
	return config;
}

module.exports = { loadConfig };
