const path = require("path");
const dotenv = require("dotenv");

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");

// Load .env file from config folder
const envPath = path.join(rootpath, "/config/.env");
const result = dotenv.config({ path: envPath });

if (result.error) {
	console.error("Error loading .env file:", result.error.message);
	process.exit(1);
}

function loadConfig(io) {
	const config = {
		MainServer: {
			port: process.env.MAIN_SERVER_PORT,
			systemType: process.env.SYSTEM_TYPE,
			sms: process.env.SMS,
			counterDisplay: process.env.counterDisplay || 0,
		},
		DBserver: {
			hostName: process.env.DB_HOSTNAME,
			hostPort: process.env.DB_PORT,
			hostUser: process.env.DB_USER,
			hostPass: process.env.DB_PASS,
			hostDB: process.env.DB_NAME,
		},
	};

	// Handle Socket.IO connections if io is passed
	if (io) {
		io.on("connection", (socket) => {
			socket.emit("envSMS", { sms: config.MainServer.sms });
		});
	}

	return config;
}

module.exports = { loadConfig };
