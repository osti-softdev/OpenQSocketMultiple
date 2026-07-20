const path = require("path");
const fs = require("fs");
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
			ticketonline: process.env.ONLINETICKETING === "true",
			BRANCH: process.env.BRANCH
		},
	};
	return config;
}

function saveConfig({ port, camscan, expiry, ticketonline }) {
	const values = {
		PORT: String(port),
		CAMSCAN: camscan ? "true" : "false",
		ONLINETICKETEXPIRY: String(expiry),
		ONLINETICKETING: ticketonline ? "true" : "false"
	};

	const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
	const lines = existing.split(/\r?\n/);
	const updatedKeys = new Set();
	const updatedLines = lines.map(line => {
		const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
		if (!match || !Object.prototype.hasOwnProperty.call(values, match[1])) return line;
		updatedKeys.add(match[1]);
		return `${match[1]}=${values[match[1]]}`;
	});

	Object.entries(values).forEach(([key, value]) => {
		if (!updatedKeys.has(key)) updatedLines.push(`${key}=${value}`);
	});

	while (updatedLines.length > 1 && updatedLines.at(-1) === "" && updatedLines.at(-2) === "") {
		updatedLines.pop();
	}

	fs.writeFileSync(envPath, `${updatedLines.join("\n").replace(/\n+$/, "")}\n`, "utf8");
	Object.assign(process.env, values);

	return loadConfig();
}

module.exports = { loadConfig, saveConfig };
