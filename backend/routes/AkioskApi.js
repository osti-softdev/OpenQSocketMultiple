const rootpath = global.BACKEND_PATH;

const express = require('express');
const path = require('path');
const fs = require("fs");
const QRCode = require('qrcode');
const axios = require('axios');
const { kioskLimiter } = require(`${rootpath}/utilities/rateLimiter`);

module.exports = function createKioskApiRouter(io) {
  const router = express.Router();

  const db = require(path.join(rootpath, 'utilities/db'));
  const { getPHDateTime } = require(path.join(rootpath, 'utilities/datetime'));
  const { executephp } = require(path.join(rootpath, 'utilities/printer'));
  const { loadConfig } = require(`${rootpath}/utilities/envconfig`);
  const config = loadConfig();

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

  // & KIOSK SMS CONFIG
  router.get('/sms-config', async (req, res) => {
    try {
      const allowSms = process.env.ALLOWSMS === 'true';
      let privacyPolicy = 'By proceeding, you agree to receive SMS notifications about your queue ticket status.';
      const row = await db.getAsync(`SELECT value FROM settings WHERE key = 'privacy_policy'`);
      if (row) privacyPolicy = row.value;
      res.json({ success: true, allowSms, privacyPolicy });
    } catch (err) {
      console.error('Failed to fetch sms-config:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch sms config' });
    }
  });

  // ^ INSERT NEW TICKET
  router.post("/newServiceTicket", kioskLimiter, async (req, res) => {
    const { sname, shortSname, subsname, ticketservice, selectedType, stats, mobile, sub_services } = req.body;
    const { date, time } = getPHDateTime();
    const expiryMinutes = Number(config.MainServer.expiry);
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

      const crypto = require('crypto');
      let randomCode = null;
      let qrCodeDataUrl = null;
      let finalstats;

      if (stats === "online") {
        finalstats = "online_reserved";
        try {
          randomCode = crypto.randomBytes(16).toString('hex');
          qrCodeDataUrl = await QRCode.toDataURL(randomCode);
        } catch (qrErr) {
          console.error("QR Generation Error:", qrErr);
        }
      }
      if (stats === "onprem") {
        finalstats = "pending";
        randomCode = "on-prem";
      }
      const nextTicket = (row?.maxTicket || 0) + 1;
      const history = `[${time}-Kiosk-Inserted]`;

      let mobileStr = mobile || null;
      let mobileRecordsStr = null;
      if (mobileStr) {
        mobileRecordsStr = `[${time}] ticket generate sent\n`;
      }

      let selectedSubService = sub_services || null;

      // Insert new ticket
      const result = await db.runAsync(
        `INSERT INTO transactions (ticketnum, sname, ticketservice, status, date, time, history, priority, ticket_secret, mobile, mobile_records, sub_services)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nextTicket, sname, ticketservice, finalstats, date, time, history, selectedType, randomCode, mobileStr, mobileRecordsStr, selectedSubService]
      );

      try {
        if (stats === "onprem") {
          const kiosk2IP = process.env.KIOSK2_IP || '10.1.0.98';

          // Check if the request came from the 2nd Kiosk
          if (req.ip.includes(kiosk2IP)) {
            console.log("On-prem ticket requested from 2nd Kiosk, sending print command to Kiosk 2...");
            const insertedTicketData = {
              service: ticketservice,
              ticket: nextTicket,
              note: "",
              shortSname: shortSname,
              subsname: subsname,
              date: date,
              time: time,
              ip: req.ip
            };
            try {
              await axios.post(`http://${kiosk2IP}:3234/api/requestor/`, insertedTicketData);
              console.log("Sent ticket to 2nd kiosk successfully.");
            } catch (kioskErr) {
              console.error("Error sending data to 2nd kiosk:", kioskErr.message);
            }
          } else {
            // Request came from the Main Kiosk (local), so print it locally
            console.log("On-prem ticket requested locally, printing on Main Kiosk...");
            await executephp(ticketservice, nextTicket, shortSname, subsname, selectedSubService);
          }

        } else {
          console.log("Online ticket, no printing required.");
        }

        if (mobileStr) {
          const smsService = require('../utilities/smsService');
          const ticketCode = ticketservice + nextTicket;
          smsService.sendTemplateSMS('generate', {
            mobile: mobileStr,
            ticket: ticketCode,
            service: sname
          }).catch(e => console.error("SMS Generate Error:", e));
        }
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
          sub_services: selectedSubService,
          date,
          time,
          status: finalstats,
          qrCode: qrCodeDataUrl,
          expiryMinutes
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