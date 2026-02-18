const express = require('express');
const path = require('path');
const fs = require("fs");

module.exports = function createDisplayApiRouter(io) {
  const router = express.Router();

  const rootpath = global.BACKEND_PATH;
  const db = require(path.join(rootpath, 'utilities/db'));
  const { getPHDateTime } = require(path.join(rootpath, 'utilities/datetime'));
  const footerPath = path.join(rootpath, "/config/footer.json");

  // & DISPLAY
  // ^ DISPLAY TICKET CARDS & CALLED TICKETS
  router.get('/getServicesDisplay', async (req, res) => {
    const { date } = getPHDateTime();

    const servicesQuery = `
        SELECT sname, shortSname
        FROM services
        WHERE status = 1
        ORDER BY id
    `;

    const transactionsQuery = `
        WITH ranked AS (
            SELECT
                ticketservice,
                ticketnum,
                sname,
                counter_num,
                counter_group,
                counter_user,
                status,
                ROW_NUMBER() OVER (
                    PARTITION BY counter_group
                    ORDER BY start_time DESC, ticketnum DESC
                ) AS rn
            FROM transactions
            WHERE date = ?
              AND status IN ('calling','finished','called','held','voided')
        )
        SELECT *
        FROM ranked
        WHERE rn = 1;
    `;

    try {
        // 1. Get active services
        const servicesRows = await db.allAsync(servicesQuery, []);

        // 2. Get latest relevant transaction per group
        const transactionRows = await db.allAsync(transactionsQuery, [date]);

        // 3. Map transactions by sgroup for fast lookup
        const txMap = {};
        transactionRows.forEach(tx => {
            txMap[tx.counter_group] = tx;
        });

        // 4. Merge: match service.sname === transaction.sgroup
        const services = servicesRows.map(service => {
            const tx = txMap[service.sname] || null;

            return {
                sname: service.sname,
                shortSname: service.shortSname,
                ticket: tx && tx.ticketservice && tx.ticketnum
                    ? `${tx.ticketservice}-${tx.ticketnum}`
                    : "--",
                status: tx ? tx.status : null,
                counter_num: tx ? tx.counter_num : null,
                counter_group: tx ? tx.counter_group : null,
                counter_user: tx ? tx.counter_user : null
            };
        });

        return res.json({
            success: true,
            services: services
        });

    } catch (err) {
        console.error("Error in /getServicesDisplay:", err);
        return res.status(500).json({
            success: false,
            error: "Failed to load display services",
            detail: err.message
        });
      }
  });

  // ^ GET CALLING TICKETS
  router.get('/getCallingTickets', async (req, res) => {
    const { date } = getPHDateTime();

    try {
      const query = `
            SELECT id, sname, ticketservice AS service, ticketnum AS ticket,
                   counter_num, counter_user
            FROM transactions
            WHERE status = 'calling'
              AND date = ?
            ORDER BY start_time ASC;
        `;
        
        const ticketRow = await db.allAsync(query, [date]);
         res.json({
          success: true,
          tickets: ticketRow
         })

    } catch (error) {
         console.error("Error in /getCallingTickets:", err);
        return res.status(500).json({
            success: false,
            error: "Failed to get called Tickets",
            detail: err.message
        });
      }
  });

  // ^ UPDATE CALLED TICKETS
  router.post("/updateCalledTickets", async (req, res) => {
    const { id } = req.body; 

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid ticket id"
      });
    }

    const { date, time } = getPHDateTime();

    try {
      const ticket = await db.getAsync(
        `SELECT sname, counter_num, counter_user 
        FROM transactions 
        WHERE id = ?`,
        [id]
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found"
        });
      }

      const { sname, counter_num, counter_user } = ticket;

      await db.runAsync("BEGIN TRANSACTION");

      try {
        await db.runAsync(
          `UPDATE transactions
          SET status = 'finished',
              end_time = ?
            WHERE sname = ?
            AND (status = 'called' OR status = 'calling')
            AND counter_num = ?
            AND counter_user = ?
            AND id <> ?`,
          [time, sname, counter_num, counter_user, id]
        );

        // 4. Set current ticket to "called"
        const updateResult = await db.runAsync(
          `UPDATE transactions
          SET status = 'called',
              start_time = ?
          WHERE id = ?`,
          [time, id]
        );

        // 5. Commit
        await db.runAsync("COMMIT");

        // ────────────────────────────────────────────────
        // IMPORTANT: Notify all displays in real-time
        // ────────────────────────────────────────────────
        io.emit("ticket-called", {
          id,
          sname,
          ticketnum: ticket.ticketnum || "?", // optional: fetch if needed
          service: ticket.ticketservice || "?", 
          counter_num,
          counter_user,
          time,
          date
        });

        // Success response
        res.json({
          success: true,
          message: "Ticket marked as called",
          ticketId: id,
          counter: counter_num,
          user: counter_user
        });

      } catch (innerErr) {
        // Rollback on any error inside transaction
        await db.runAsync("ROLLBACK").catch(() => {});
        throw innerErr;
      }

    } catch (err) {
      console.error("[updateCalledTickets] Failed:", {
        error: err.message,
        stack: err.stack,
        ticketId: id,
        time
      });

      res.status(500).json({
        success: false,
        error: "Failed to update called ticket",
        detail: err.message
      });
    }
  });

  // ^ GET FOOTER
  router.get('/getFooter', async (req, res) => {
    fs.readFile(footerPath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading footer.json:", err);
        return;
      }
      try {
        const config = JSON.parse(data);
        res.json({
          success: true,
          data: config
        });
      } catch (parseErr) {
        console.error("Invalid footer.json format:", parseErr);
        res.status(500).json({
          success: false,
          error: "Failed to get footer configurations",
          detail: parseErr.message
        });
      }
    });
  });


  return router;
}