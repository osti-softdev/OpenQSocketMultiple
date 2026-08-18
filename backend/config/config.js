const fs = require("fs");
const path = require("path");
const ini = require("ini");
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");

function loadConfig(io) {
	const configFile = path.join(rootpath, "/config/config.ini");
	let config;
	try {
		config = ini.parse(fs.readFileSync(configFile, "utf-8"));
	} catch (error) {
		console.error("Error reading config file:", error.message);
		process.exit(1);
	}
	return config;
}

module.exports = { loadConfig };
