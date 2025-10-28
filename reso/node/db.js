const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");

// Initialize database connection
const dbPath = path.join(rootpath, "/config/db.db");
let db = null;

function initializeDb() {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(dbPath)) {
			const err = new Error(`Database file does not exist: ${dbPath}`);
			console.error(err.message);
			return reject(err);
		}

		db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) {
				console.error("Error opening database:", err.message);
				db = null; // Ensure db is null on failure
				return reject(err);
			}
			console.log("Database connected");
			resolve(true);
		});
	});
}

async function getAllServices() {
	if (!db) {
		throw new Error("Database not initialized. Call initializeDb first.");
	}

	return new Promise((resolve, reject) => {
		db.all("SELECT sname, regular, priority, sched FROM services WHERE status = 1 ORDER by id ASC", [], (err, rows) => {
			if (err) {
				console.error("Error querying services:", err.message);
				return reject(err);
			}
			resolve(rows || []);
		});
	});
}

// Close database connection gracefully
async function closeDb() {
	if (db) {
		db.close((err) => {
			if (err) {
				console.error("Error closing database:", err.message);
			} else {
				console.log("Database connection closed");
			}
			db = null;
		});
	}
}

module.exports = { initializeDb, getAllServices, closeDb };
