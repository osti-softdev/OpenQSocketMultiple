// tellerApi.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');

module.exports = function createTellerApiRouter(io) {
    const router = express.Router();

    const rootpath = global.BACKEND_PATH || __dirname;
    const db = require(path.join(rootpath, 'utilities/db'));
    const { getPHDateTime } = require(path.join(rootpath, 'utilities/datetime'));

  // =========================
  // & Account login
  // =========================
  router.post('/loginAdmin', (req, res) => {
    const { username, password } = req.body;

    console.log('Login attempt for:', username);

    db.get(
        'SELECT * FROM accounts WHERE username = ?',
        [username],
        (err, admin) => {
            if (err) {
                console.error('Database error during login:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            if (!admin) {
                console.log('User not found:', username);
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }

            console.log('User found, verifying password...');

            try {
                if (password === admin.password) {
                    req.session.admin = admin;
                    req.session.admin = {
                        id: admin.id,
                        username: admin.name,
                        status: admin.status,
                        role: admin.role
                    };

                    console.log('Login successful for:', username);

                    return res.json({
                        success: true,
                        admin: req.session.admin
                    });
                } else {
                    console.log('Password mismatch for:', username);
                    return res.status(401).json({ success: false, message: 'Invalid username or password' });
                }
            } catch (error) {
                console.error('Authentication error:', error);
                return res.status(500).json({ success: false, message: 'Authentication error' });
            }
        }
    );
  });

  // =========================
  // & ACCOUNT SESSION CHECKER
  // =========================
  router.get('/check-session-admin', (req, res) => {
        if (req.session.admin) {
            res.json({
                loggedIn: true,
                admin: {
                    id: req.session.admin.id,
                    username: req.session.admin.username,
                    status: req.session.admin.status,
                    role: req.session.admin.role
                }
            });
        } else {
            res.json({ loggedIn: false });
        }
  });

  // =========================
  // & DASHBOARD LIVE
  // =========================
  router.get('/admin/dashboard/live', (req, res) => {
    const result = { services: [], tellers: [], stats: {} };
    const { date } = getPHDateTime();

    const servicePromise = new Promise((resolve) => {
        db.all(`
            SELECT 
                s.sname,
                COUNT(CASE WHEN t.status = 'pending' AND t.date = ? THEN 1 END) AS waiting_count,
                COUNT(CASE WHEN (t.status = 'calling' OR t.status = 'called') AND t.date = ? THEN 1 END) AS serving_count,
                COUNT(CASE WHEN t.status = 'finished' AND t.date = ? THEN 1 END) AS completed_count,
                AVG(CASE WHEN t.status = 'finished' AND t.date = ? 
                        THEN (strftime('%s', t.date || ' ' || t.start_time) - strftime('%s', t.date || ' ' || t.time)) / 60.0 
                        END) AS avg_wait_time
                FROM services s
                LEFT JOIN transactions t 
                    ON t.sname = s.sname
                WHERE s.status = 1
                GROUP BY s.sname
        `, [date, date, date, date], (err, rows) => {
            if (err) console.error("Service query error:", err);
            else result.services = rows;
            resolve();
        });
    });


    const tellerPromise = new Promise((resolve) => {
        db.all(`
            SELECT 
                c.id,
                c.cname,
                c.cnum,

                COUNT(CASE 
                    WHEN t.status = 'finished'
                    AND date = ?
                THEN 1 END) as served_today,

                AVG(CASE 
                    WHEN t.status = 'finished'
                    AND date = ?
                    THEN (strftime('%s', t.end_time) - strftime('%s', t.start_time)) / 60.0
                END) as avg_service_time,

                AVG(CASE 
                    WHEN t.status = 'finished'
                    AND date = ?
                    THEN (strftime('%s', t.end_time) - strftime('%s', t.time)) / 60.0
                END) as avg_turnaround_time,

                MAX(CASE 
                    WHEN t.status = 'calling'
                    AND date = ?
                    THEN t.ticketservice || t.ticketnum
                END) as serving_ticket

            FROM counters c
            LEFT JOIN transactions t 
                ON t.teller_id = c.id

            GROUP BY c.id
        `, [date, date, date, date], (err, tellers) => {

            if (err) {
                console.error("Teller query error:", err);
                return resolve();
            }

            tellers.forEach(teller => {
                if (teller.serving_ticket) {
                    teller.status = `Serving ${teller.serving_ticket}`;
                    teller.status_code = 'busy';
                } else {
                    teller.status = 'Idle';
                    teller.status_code = 'idle';
                }
            });

            result.tellers = tellers;
            resolve();
        });
    });

    // 3️⃣ OVERALL STATS
    const statsPromise = new Promise((resolve) => {
        db.get(`
            SELECT 
                COUNT(CASE 
                    WHEN status = 'pending' 
                    AND date = ?
                THEN 1 END) as queue_length,

                COUNT(CASE 
                    WHEN date = ?
                THEN 1 END) as total_tickets,

                AVG(CASE 
                    WHEN status = 'finished'
                    AND date = ?
                    THEN (strftime('%s', end_time) - strftime('%s', time)) / 60.0
                END) as avg_turnaround
            FROM transactions
        `, [date, date, date], (err, row) => {

            if (err) console.error("Stats query error:", err);
            else result.stats = row;

            resolve();
        });
    });

    Promise.all([servicePromise, tellerPromise, statsPromise])
        .then(() => res.json(result))
        .catch(err => res.status(500).json({ error: err.message }));
  });
  // =========================
  // & OVERVIEW
  // =========================
  router.get('/admin/analytics/overview', (req, res) => {
    const stats = {};

    // 1️⃣ Total tickets
    db.get(`SELECT COUNT(*) as total FROM transactions`, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalTickets = row.total;

        // 2️⃣ Tickets by status
        db.all(`SELECT status, COUNT(*) as count FROM transactions GROUP BY status`, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.byStatus = rows;

            // 3️⃣ Tickets by service
            db.all(`SELECT ticketservice as sname, COUNT(*) as count FROM transactions GROUP BY ticketservice`, (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.byService = rows;

                // 4️⃣ Average service time per service (in minutes)
                db.all(`
                    SELECT ticketservice as sname,
                        AVG(
                            (strftime('%s', date || ' ' || end_time) - strftime('%s', date || ' ' || start_time)) / 60.0
                        ) AS avg_minutes
                    FROM transactions
                    WHERE status = 'finished'
                        AND start_time IS NOT NULL
                        AND end_time IS NOT NULL
                    GROUP BY ticketservice
                `, (err, rows) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.avgServiceTime = rows;

                    res.json(stats);
                });
            });
        });
    });
  });

  router.get('/admin/analytics/hourly', (req, res) => {
    const { date} = getPHDateTime();

    db.all(`
        SELECT 
            strftime('%H', date || ' ' || time) AS hour,
            CASE 
                WHEN CAST(strftime('%M', date || ' ' || time) AS INTEGER) < 30 
                THEN '00' 
                ELSE '30' 
            END AS minute_block,
            COUNT(*) AS count
        FROM transactions
        WHERE date = ?
        GROUP BY hour, minute_block
        ORDER BY hour, minute_block
    `,
    [date],
    (err, rows) => {
        if (err) {
            console.error("Hourly analytics query error:", err);
            return res.status(500).json({ error: err.message });
        }

        res.json(rows);
    });
  });

    return router;
};