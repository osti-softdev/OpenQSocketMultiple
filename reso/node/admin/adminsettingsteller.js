const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const rootPath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootPath, "config/db.db");

let watcherAdded = false;

/* =====================================================
   ✅ Fetch All Tellers
===================================================== */
function getTellers() {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
		const query = `
			SELECT id, cname, cnum, cuser, cpass, cstatus, services, group_name
			FROM counters
			ORDER BY id ASC
		`;
		db.all(query, [], (err, rows) => {
			db.close();
			if (err) return reject(err);
			resolve(rows || []);
		});
	});
}

/* =====================================================
   ✅ Fetch All Services
===================================================== */
function getAllServices() {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
		const query = `SELECT id, sname FROM services ORDER BY id ASC`;
		db.all(query, [], (err, rows) => {
			db.close();
			if (err) return reject(err);
			resolve(rows || []);
		});
	});
}

/* =====================================================
   ✅ Fetch All Counter Groups
===================================================== */
function getAllGroups() {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
		const query = `SELECT id, group_name FROM counter_groups ORDER BY id ASC`;
		db.all(query, [], (err, rows) => {
			db.close();
			if (err) return reject(err);
			resolve(rows || []);
		});
	});
}

/* =====================================================
   ✅ Add Teller
===================================================== */
function addTeller(data) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
		const query = `
			INSERT INTO counters (cname, cnum, cuser, cpass, cstatus, services, group_name)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`;
		const servicesStr = (data.services || []).join(", ");
		db.run(
			query,
			[
				data.cname,
				data.cnum,
				data.cuser,
				data.cpass,
				data.cstatus,
				servicesStr,
				data.group_name || "",
			],
			function (err) {
				db.close();
				if (err) return reject(err);
				resolve(this.lastID);
			}
		);
	});
}

/* =====================================================
   ✅ Update Teller
===================================================== */
function updateTeller(data) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
		const query = `
			UPDATE counters
			SET cname = ?, cuser = ?, cnum = ?, cpass = ?, cstatus = ?, services = ?, group_name = ?
			WHERE id = ?
		`;
		const servicesStr = (data.services || []).join(", ");
		db.run(
			query,
			[
				data.cname,
				data.cuser,
				data.cnum,
				data.cpass,
				data.cstatus,
				servicesStr,
				data.group_name || "",
				data.id,
			],
			function (err) {
				db.close();
				if (err) return reject(err);
				resolve(this.changes);
			}
		);
	});
}

/* =====================================================
   ✅ Delete Teller
===================================================== */
function deleteTeller(id) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
		const query = `DELETE FROM counters WHERE id = ?`;
		db.run(query, [id], function (err) {
			db.close();
			if (err) return reject(err);
			resolve(this.changes);
		});
	});
}

/* =====================================================
   ⚙️ Socket Setup
===================================================== */
function setupAdminTeller(socket, io) {
	// 🔹 Get All Tellers
	socket.on("gettellers", async () => {
		try {
			const rows = await getTellers();
			socket.emit("tellersList", {
				data: rows,
				status: rows.length > 0 ? "1" : "0",
				message: rows.length > 0 ? "Success" : "No counters found",
			});
		} catch (err) {
			console.error("❌ Error fetching tellers:", err);
			socket.emit("tellersList", { message: "Server error", status: "0" });
		}
	});

	// 🔹 Get All Services
	socket.on("getserviceslist", async () => {
		try {
			const rows = await getAllServices();
			socket.emit("servicesList", {
				data: rows,
				status: rows.length > 0 ? "1" : "0",
			});
		} catch (err) {
			console.error("❌ Error fetching services:", err);
			socket.emit("servicesList", { message: "Server error", status: "0" });
		}
	});

	// 🔹 Get All Groups
	socket.on("getgroupslist", async () => {
		try {
			const rows = await getAllGroups();
			socket.emit("groupsList", {
				data: rows,
				status: rows.length > 0 ? "1" : "0",
			});
		} catch (err) {
			console.error("❌ Error fetching groups:", err);
			socket.emit("groupsList", { message: "Server error", status: "0" });
		}
	});

	// 🔹 Add Teller
	socket.on("addTeller", async (data) => {
		try {
			const newId = await addTeller(data);
			const updatedList = await getTellers();
			io.emit("tellersList", { data: updatedList, status: "1" });
			socket.emit("tellerAddResult", { message: "Teller added successfully", status: "1" });
		} catch (err) {
			console.error("❌ Teller addition failed:", err);
			socket.emit("tellerAddResult", { message: err.message || "Add failed", status: "0" });
		}
	});

	// 🔹 Update Teller
	socket.on("updateTeller", async (data) => {
		try {
			const changes = await updateTeller(data);
			const updatedList = await getTellers();
			io.emit("tellersList", { data: updatedList, status: "1" });
			socket.emit("tellerUpdateResult", {
				message: changes > 0 ? "Teller updated successfully" : "No changes made",
				status: changes > 0 ? "1" : "0",
			});
		} catch (err) {
			console.error("❌ Teller update failed:", err);
			socket.emit("tellerUpdateResult", { message: err.message || "Update failed", status: "0" });
		}
	});

	// 🔹 Delete Teller
	socket.on("deleteTeller", async (data) => {
		try {
			const changes = await deleteTeller(data.id);
			const updatedList = await getTellers();
			io.emit("tellersList", { data: updatedList, status: "1" });
			socket.emit("tellerDeleteResult", {
				message: changes > 0 ? "Teller deleted successfully" : "Delete failed",
				status: changes > 0 ? "1" : "0",
			});
		} catch (err) {
			console.error("❌ Teller deletion failed:", err);
			socket.emit("tellerDeleteResult", { message: err.message || "Delete failed", status: "0" });
		}
	});

	// 👀 Watch DB for Live Updates
	if (!watcherAdded) {
		fs.watchFile(dbPath, { interval: 1000 }, async () => {
			try {
				const tellers = await getTellers();
				io.emit("tellersList", { data: tellers, status: "1" });
			} catch (err) {
				console.error("❌ Error refreshing tellers:", err);
			}
		});
		watcherAdded = true;
	}
}

module.exports = { setupAdminTeller };
