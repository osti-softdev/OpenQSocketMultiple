const express = require('express');
const path = require('path');
const fs = require("fs");

module.exports = function createKioskApiRouter(io) {
  const router = express.Router();

  const rootpath = global.BACKEND_PATH;
  const db = require(path.join(rootpath, 'utilities/db'));
  const { getPHDateTime } = require(path.join(rootpath, 'utilities/datetime'));
  const footerPath = path.join(rootpath, "/config/footer.json");
  const { executephp } = require(path.join(rootpath, 'utilities/printer'));


  // & KIOSK
  // ^ GET ALL SERVICES FOR KIOSK
  router.get('/services', async (req, res) => {
    try {
      const services = await db.allAsync(
        'SELECT * FROM services WHERE status = 1 ORDER BY id ASC'
      );
      res.json({
        success: true,
        count: services.length,
        data: services
      });
    } catch (err) {
      console.error('Failed to fetch services:', err);
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // ^ INSERT NEW TICKET
  router.post("/newServiceTicket", async (req, res) => {
    const { sname, ticketservice, selectedType } = req.body;
    const { date, time } = getPHDateTime();

    if (!sname || !ticketservice) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: sname or ticketservice"
      });
    }

    try {
      // Get current max ticket number
      const row = await db.getAsync(
        `SELECT MAX(ticketnum) as maxTicket 
        FROM transactions 
        WHERE sname = ? AND ticketservice = ? AND date = ?`,
        [sname, ticketservice, date]
      );

      const nextTicket = (row?.maxTicket || 0) + 1;
      const history = `[${time}-Kiosk-Inserted]`;

      // Insert new ticket
      const result = await db.runAsync(
        `INSERT INTO transactions (ticketnum, sname, ticketservice, status, date, time, history, priority)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [nextTicket, sname, ticketservice, date, time, history, selectedType]
      );

        try {
          await executephp(ticketservice, nextTicket, sname);
        } catch (printError) {
          console.error("Printer Error:", printError.message);
        }
      // Success response
      res.json({
        success: true,
        ticket: {
          ticketnum: nextTicket,
          sname,
          ticketservice,
          date,
          time,
          status: 'pending'
        }
      });
      io.emit("ticket_voided");
      // You can trigger printer / socket here
      // io.emit("new-ticket", { ... });

    } catch (err) {
      console.error("Error creating ticket:", err.message);
      res.status(500).json({
        success: false,
        error: "Failed to create ticket",
        detail: err.message.includes("locked") ? "Database is busy/locked" : err.message
      });
    }
  });

  return router;
}