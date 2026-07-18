const rootpath = global.BACKEND_PATH;

const express = require('express');
const path = require('path');
const fs = require("fs");
const QRCode = require('qrcode');
const { kioskLimiter } = require(`${rootpath}/utilities/rateLimiter`);
const { loadConfig } = require(`${rootpath}/utilities/envconfig`);


module.exports = function createKioskApiRouter(io) {
  const router = express.Router();

  const db = require(path.join(rootpath, 'utilities/db'));
  const { getPHDateTime } = require(path.join(rootpath, 'utilities/datetime'));
  const { executephp } = require(path.join(rootpath, 'utilities/printer'));


  // ^ INSERT NEW TICKET
router.post("/check_ticket_in", kioskLimiter, async (req, res) => {

    const { date, time } = getPHDateTime();
    const currentPHDateTime = new Date(`${date} ${time}`);
    const currentConfig = loadConfig();

    if (!currentConfig.MainServer.ticketonline) {
        return res.status(503).json({
            success: false,
            error: "Online ticketing is disabled"
        });
    }

    try {
        const { ticketcode } = req.body;

        if (!ticketcode) {
            return res.status(400).json({
                success: false,
                error: "Ticket code is required"
            });
        }

        const row = await db.getAsync(
            `SELECT id, sname, ticketnum, ticketservice, date, time, status
             FROM transactions
             WHERE ticket_secret = ?
             AND date = ?`,
            [ticketcode, date]
        );

        // ❌ invalid ticket
        if (!row) {
            return res.json({
                success: false,
                error: "Invalid ticket"
            });
        }

        // ✅ already checked in
        if (row.status === "pending") {
            return res.json({
                success: false,
                error: "Ticket is already checked in wait for your turn to be called"
            });
        }

        // ❌ optionally block other statuses
        if (row.status !== "online_reserved") {
            return res.json({
                success: false,
                error: `Ticket cannot be used (status: ${row.status})`
            });
        }

        const expiryMinutes = Number(currentConfig.MainServer.expiry);
        const ticketDateTime = new Date(`${row.date} ${row.time}`);

        const ageMinutes =
            (currentPHDateTime.getTime() - ticketDateTime.getTime()) /
            (1000 * 60);

        if (ageMinutes > expiryMinutes) {
            return res.json({
                success: false,
                error: `Ticket expired. Valid only for ${expiryMinutes} minutes.`
            });
        }

        // ✅ mark as pending (checked in)
        await db.runAsync(
            `UPDATE transactions SET status = 'pending' WHERE id = ?`,
            [row.id]
        );

        console.log(
            `CHECK-IN: ${row.ticketnum} | Age: ${Math.floor(ageMinutes)} min | STATUS -> pending`
        );


        // await executephp(ticketservice, nextTicket, sname);
        return res.json({
            success: true,
            ticket: {
                sname: row.sname,
                ticketnum: row.ticketnum,
                ticketservice: row.ticketservice,
            }
        });

    } catch (err) {
        console.error("Error check-in ticket:", err.message);

        return res.status(500).json({
            success: false,
            error: "Failed to check-in ticket",
            detail: err.message.includes("locked")
                ? "Database is busy/locked"
                : err.message
        });
    }
});

router.get("/checkOnlineTrue", (req, res) => {
    const currentConfig = loadConfig();
    res.json({
        isOnline: currentConfig.MainServer.ticketonline,
        camscan: currentConfig.MainServer.camscan

   });
});
  return router;
}
