const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(global.outfolderPath, "config/db.db");

function getAllServices() {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) return reject(err);
		});

		const query = `SELECT * FROM services ORDER BY id ASC`;

		db.all(query, [], (err, rows) => {
			db.close();
			if (err) return reject(err);
			resolve(rows);
		});
	});
}

function updateServices(service) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
			if (err) return reject(err);
		});

				const updateQuery = `
				UPDATE services 
				SET sname = ?, shortSname = ?, regular = ?, status = ?, sched = ?
				WHERE id = ?
			`;
				db.run(
					updateQuery,
					[
						service.sname,
						service.shortSname,
						service.regular,
						service.status,
						service.sched,
						service.id
					],
					function (err) {
						db.close();
						if (err) return reject(err);
						resolve(this.changes);
					}
				);
			}
		);
}

function settupsettingsservices(socket, io) {
	// Get all accounts
	socket.on("getservices", async () => {
		try {
			const rows = await getAllServices();
			if (rows.length > 0) {
				socket.emit("adminServices", { data: rows, status: "1" });
			} else {
				socket.emit("servicesgather", {
					message: "No services found",
					status: "0",
				});
			}
		} catch (err) {
			socket.emit("servicesgather", { message: "Server error", status: "0" });
		}
	});
	
	// Update account
	socket.on("updateServices", async (account) => {
		try {
			const changes = await updateServices(account);
			if (changes > 0) {
				const rows = await getAllServices();
				io.emit("adminServices", { data: rows, status: "1" });
				socket.emit("servicesgather", {
					message: "Service updated successfully",
					status: "1",
				});
			} else {
				socket.emit("servicesgather", {
					message: "Service not found",
					status: "0",
				});
			}
		} catch (err) {
			socket.emit("servicesgather", {
				message: err.message || "Update failed",
				status: "0",
			});
		}
	});

}

module.exports = { settupsettingsservices };
