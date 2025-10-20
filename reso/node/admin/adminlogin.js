const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const jwt = require("jsonwebtoken");

const dbPath = path.join(global.outfolderPath, "config/db.db");
const JWT_SECRET = "Finder@123#"; // TODO: move to env var

function validateLogin(username, password) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) return reject(err);
		});

		const query = `SELECT name, username, password, role 
                       FROM accounts 
                       WHERE username = ? AND password = ? AND status != '0'
                       LIMIT 1`;

		db.get(query, [username, password], (err, row) => {
			db.close();
			if (err) return reject(err);
			if (row) resolve({ success: true, user: row });
			else resolve({ success: false });
		});
	});
}

function setupLoginSocket(io) {
	io.on("connection", (socket) => {
		// console.log(`adminlogin.js: Socket connected: ${socket.id}`);

		socket.on("loginAttempt", async ({ username, password }) => {
			try {
				const result = await validateLogin(username, password);
				if (result.success) {
					const payload = {
						name: result.user.name,
						username: result.user.username,
						role: result.user.role,
					};
					const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

					socket.emit("loginSuccess", { token, user: payload });
				} else {
					socket.emit("loginFailed", {
						message: "Invalid username or password",
					});
				}
			} catch (err) {
				socket.emit("loginFailed", { message: "Server error" });
			}
		});

		socket.on("logout", () => {
			socket.emit("logoutSuccess"); // client just deletes token
		});
	});
}

module.exports = { setupLoginSocket, JWT_SECRET };
