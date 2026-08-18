const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(global.outfolderPath, "config/db.db");

function validateLogin(cnum, cuser, cpass) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        const query = `SELECT id, cname, cnum, cuser, cpass, cstatus, services, group_name
                       FROM counters 
                       WHERE cnum = ? AND cuser = ? AND cpass = ? AND cstatus = 1
                       LIMIT 1`;

        db.get(query, [cnum, cuser, cpass], (err, row) => {
            db.close();
            if (err) return reject(err);
            if (row) resolve({ success: true, user: row });
            else resolve({ success: false });
        });
    });
}

function setupLoginSocketteller(socket) {

        // 🔹 Handle teller login
        socket.on("tellerloginAttempt", async ({ cnum, cuser, cpass }) => {
            try {
                const result = await validateLogin(cnum, cuser, cpass);
                if (result.success) {
                    socket.user = {
                        id: result.user.id,
                        cname: result.user.cname,
                        cnum: result.user.cnum,
                        cuser: result.user.cuser,
                        group_name: result.user.group_name,
                        role: "teller",
                    };

                    // Send back user data → client saves it in localStorage
                    socket.emit("tellerloginSuccess", { user: socket.user });
                } else {
                    socket.emit("loginFailedteller", {
                        message: "Invalid username or password",
                    });
                }
            } catch (err) {
                console.error("Login error:", err);
                socket.emit("loginFailedteller", { message: "Server error" });
            }
        });

        // 🔹 Handle logout
        socket.on("tellerlogout", () => {
            socket.user = null;
            socket.emit("tellerlogoutSuccess");
        });
}

module.exports = { setupLoginSocketteller };
