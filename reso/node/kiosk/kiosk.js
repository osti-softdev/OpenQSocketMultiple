const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { getPHDateTime } = require("../datetime");
const { executephp } = require("../printer");

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "/config/db.db");

function initializeWindowedKiosk(socket, io) {
    socket.on("newServiceTicket", (service) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error("DB open error:", err.message);
                socket.emit("ticketInsertError", "Database connection failed");
                return;
            }
        });

        const { sname, ticketservice, mobile } = service;
        const { date, time } = getPHDateTime();

        db.get(
            `SELECT MAX(ticketnum) as maxTicket FROM transactions 
             WHERE sname = ? AND ticketservice = ? AND date = ?`,
            [sname, ticketservice, date],
            (err, row) => {
                if (err) {
                    console.error("Max ticket error:", err.message);
                    socket.emit("ticketInsertError", "Failed to get ticket number");
                    db.close();
                    return;
                }

                const nextTicket = (row?.maxTicket || 0) + 1;
                const history = `[${time}-Topline-Inserted]`;

                db.run(
                    `INSERT INTO transactions (ticketnum, sname, ticketservice, status, date, time, history, mobile)
                     VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
                    [nextTicket, sname, ticketservice, date, time, history, mobile],
                    (insertErr) => {
                        if (insertErr) {
                            console.error("Insert error:", insertErr.message);
                            socket.emit("ticketInsertError", "Failed to insert ticket");
                        } else {
                            console.log(`🎫 Ticket inserted: ${ticketservice}${nextTicket} - ${mobile}`);
                            executephp(ticketservice, nextTicket, sname);

                            socket.emit("ticketInserted", {
                                ticketnum: nextTicket,
                                sname,
                                ticketservice,
                            });
                        }
                        db.close();
                    }
                );
            }
        );
    });
}

module.exports = { initializeWindowedKiosk };
