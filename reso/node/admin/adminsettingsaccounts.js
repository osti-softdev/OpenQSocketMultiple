const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(global.outfolderPath, "config/db.db");

function getAllAccounts() {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) return reject(err);
		});

		const query = `SELECT * FROM accounts`;

		db.all(query, [], (err, rows) => {
			db.close();
			if (err) return reject(err);
			resolve(rows);
		});
	});
}

// Create new account (prevent duplicate username or name)
function createAccount(account) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
			if (err) return reject(err);
		});

		// First check if name OR username already exists
		const checkQuery = `SELECT * FROM accounts WHERE username = ? OR name = ?`;
		db.get(checkQuery, [account.username, account.name], (err, row) => {
			if (err) {
				db.close();
				return reject(err);
			}
			if (row) {
				db.close();
				return reject(new Error("Username or Name already exists"));
			}

			// If not exists → insert
			const insertQuery = `
				INSERT INTO accounts (name, username, password, role, status) 
				VALUES (?, ?, ?, ?, ?)
			`;
			db.run(
				insertQuery,
				[
					account.name,
					account.username,
					account.password,
					account.role,
					account.status,
				],
				function (err) {
					db.close();
					if (err) return reject(err);
					resolve(this.lastID);
				}
			);
		});
	});
}

// Update account (prevent duplicate username or name, except itself)
function updateAccount(account) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
			if (err) return reject(err);
		});

		// Check duplicates but exclude current account ID
		const checkQuery = `SELECT * FROM accounts WHERE (username = ? OR name = ?) AND id != ?`;
		db.get(
			checkQuery,
			[account.username, account.name, account.id],
			(err, row) => {
				if (err) {
					db.close();
					return reject(err);
				}
				if (row) {
					db.close();
					return reject(new Error("Username or Name already exists"));
				}

				// Proceed with update
				const updateQuery = `
				UPDATE accounts 
				SET name = ?, username = ?, password = ?, role = ?, status = ? 
				WHERE id = ?
			`;
				db.run(
					updateQuery,
					[
						account.name,
						account.username,
						account.password,
						account.role,
						account.status,
						account.id,
					],
					function (err) {
						db.close();
						if (err) return reject(err);
						resolve(this.changes);
					}
				);
			}
		);
	});
}

function deleteAccount(id) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
			if (err) return reject(err);
		});

		const query = `DELETE FROM accounts WHERE id = ?`;

		db.run(query, [id], function (err) {
			db.close();
			if (err) return reject(err);
			resolve(this.changes); // number of rows deleted
		});
	});
}

function settupsettingsaccounts(socket, io) {
	// Get all accounts
	socket.on("getaccounts", async () => {
		try {
			const rows = await getAllAccounts();
			if (rows.length > 0) {
				socket.emit("adminaccounts", { data: rows, status: "1" });
			} else {
				socket.emit("accountsgather", {
					message: "No accounts found",
					status: "0",
				});
			}
		} catch (err) {
			socket.emit("accountsgather", { message: "Server error", status: "0" });
		}
	});
	// Create account
	// Create account
	socket.on("createaccount", async (account) => {
		try {
			const id = await createAccount(account);
			const rows = await getAllAccounts();
			io.emit("adminaccounts", { data: rows, status: "1" });
			socket.emit("accountsgather", {
				message: "Account created successfully",
				status: "1",
			});
		} catch (err) {
			socket.emit("accountsgather", {
				message: err.message || "Create failed",
				status: "0",
			});
		}
	});

	// Update account
	socket.on("updateaccount", async (account) => {
		try {
			const changes = await updateAccount(account);
			if (changes > 0) {
				const rows = await getAllAccounts();
				io.emit("adminaccounts", { data: rows, status: "1" });
				socket.emit("accountsgather", {
					message: "Account updated successfully",
					status: "1",
				});
			} else {
				socket.emit("accountsgather", {
					message: "Account not found",
					status: "0",
				});
			}
		} catch (err) {
			socket.emit("accountsgather", {
				message: err.message || "Update failed",
				status: "0",
			});
		}
	});

	// Delete account
	socket.on("deleteaccount", async ({ id }) => {
		try {
			const changes = await deleteAccount(id);
			if (changes > 0) {
				const rows = await getAllAccounts();
				io.emit("adminaccounts", { data: rows, status: "1" });
				socket.emit("accountsgather", {
					message: "Account deleted successfully",
					status: "1",
				});
			} else {
				socket.emit("accountsgather", {
					message: "Account not found",
					status: "0",
				});
			}
		} catch (err) {
			socket.emit("accountsgather", {
				message: err.message || "Delete failed",
				status: "0",
			});
		}
	});
}

module.exports = { settupsettingsaccounts };
