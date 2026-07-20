// tellerApi.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const rootpath =
	global.ROOT_PATH;

const { requireRole  } = require(`../utilities/authsession`);
const { authLimiter } = require("../utilities/rateLimiter");
const { readSoundConfig, writeSoundConfig } = require('../utilities/soundConfig');
const { loadConfig, saveConfig } = require('../utilities/envconfig');

module.exports = function createTellerApiRouter(io) {
    const router = express.Router();

    // Every admin-console API requires a signed-in console account. Individual
    // workspaces add their narrower role guard below.
    router.use('/admin', requireRole('user', 'admin', 'superadmin'));
    const rootpath = global.BACKEND_PATH || __dirname;
    const db = require(path.join(rootpath, 'utilities/db'));
    const { getPHDateTime } = require(path.join(rootpath, 'utilities/datetime'));
    const {
      inTransaction,
      normalizeServiceKey,
      synchronizeServiceGroups
    } = require(path.join(rootpath, 'utilities/serviceGroups'));

    let serviceGroupsInitializationError = null;
    const serviceGroupsReady = inTransaction(db, () => synchronizeServiceGroups(db))
      .then(() => console.log('Services and routing groups synchronized'))
      .catch(error => {
        console.error('Unable to synchronize services and routing groups:', error);
        serviceGroupsInitializationError = error;
      });

    router.use('/admin', async (req, res, next) => {
      try {
        await serviceGroupsReady;
        if (serviceGroupsInitializationError) throw serviceGroupsInitializationError;
        next();
      } catch (error) {
        res.status(500).json({ error: 'Service routing initialization failed' });
      }
    });

  // =========================
  // & Account login
  // =========================
  router.post('/loginAdmin', authLimiter, (req, res) => {
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

  // Console access matrix:
  // user       -> Monitor (overview, live preview, reports, ticket history)
  // admin      -> Monitor, Management, Advertisement, and Announcement
  // superadmin -> Every workspace, including account management
  const requireMonitorAccess = requireRole('user', 'admin', 'superadmin');
  const requireManagementAccess = requireRole('admin', 'superadmin');
  const requireSuperadminAccess = requireRole('superadmin');

  router.use('/admin/dashboard', requireMonitorAccess);
  router.use('/admin/analytics', requireMonitorAccess);
  router.use('/admin/reports', requireMonitorAccess);
  router.use('/admin/tickets', requireMonitorAccess);
  router.use('/admin/services', requireManagementAccess);
  router.use('/admin/groups', requireManagementAccess);
  router.use('/admin/tellers', requireManagementAccess);
  router.use('/admin/display-audio', requireSuperadminAccess);
  router.use('/admin/configuration', requireSuperadminAccess);
  router.use('/admin/accounts', requireSuperadminAccess);

  // ! -------- DASHBOARD -------- !

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
                s.shortSname,
                COUNT(CASE WHEN t.status = 'pending' AND t.date = ? THEN 1 END) AS waiting_count,
                COUNT(CASE WHEN (t.status = 'calling' OR t.status = 'called') AND t.date = ? THEN 1 END) AS serving_count,
                COUNT(CASE WHEN t.status = 'finished' AND t.date = ? THEN 1 END) AS completed_count,
                AVG(CASE WHEN t.status = 'finished' AND t.date = ? 
                        THEN (strftime('%s',  t.start_time) - strftime('%s', t.time)) / 60.0 
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
                    WHEN (t.status = 'calling' OR t.status = 'called')
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
                    WHEN status != 'pending' 
                    AND date = ?
                THEN 1 END) as queue_served,

                COUNT(CASE 
                    WHEN date = ?
                THEN 1 END) as total_tickets,

                AVG(
                    CASE
                        WHEN end_time IS NOT NULL
                        THEN (strftime('%s', end_time) - strftime('%s', time)) / 60.0
                    END
                ) AS avg_turnaround,

                AVG(
                    CASE
                        WHEN end_time IS NOT NULL
                        THEN (strftime('%s', end_time) - strftime('%s', start_time)) / 60.0
                    END
                ) AS avg_service_time,

                AVG(
                    CASE
                        WHEN start_time IS NOT NULL
                        THEN (strftime('%s', start_time) - strftime('%s', time)) / 60.0
                    END
                ) AS avg_wait_time

            FROM transactions
            WHERE date = ?
        `, [date, date, date, date], (err, row) => {

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
    const { date } = getPHDateTime(); // e.g., '2026-02-20'

    // 1️⃣ Total tickets for today
    db.get(`SELECT COUNT(*) as total FROM transactions WHERE date = ?`, [date], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalTickets = row.total;

        // 2️⃣ Tickets by status for today
        db.all(
            `SELECT status, COUNT(*) as count FROM transactions WHERE date = ? GROUP BY status`,
            [date],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.byStatus = rows;

                // 3️⃣ Tickets by service for today
                db.all(
                    `SELECT
                        COALESCE(s.shortSname, t.sname, t.ticketservice, 'General') AS sname,
                        COUNT(*) AS count
                     FROM transactions t
                     LEFT JOIN services s ON t.sname = s.sname
                     WHERE t.date = ?
                     GROUP BY COALESCE(s.shortSname, t.sname, t.ticketservice, 'General')
                     ORDER BY count DESC`,
                    [date],
                    (err, rows) => {
                        if (err) return res.status(500).json({ error: err.message });
                        stats.byService = rows;

                        // 4️⃣ Average service time per service for today
                        db.all(
                            `
                            SELECT ticketservice as sname,
                                AVG(
                                    (strftime('%s', date || ' ' || end_time) - strftime('%s', date || ' ' || start_time)) / 60.0
                                ) AS avg_minutes
                            FROM transactions
                            WHERE status = 'finished'
                                AND start_time IS NOT NULL
                                AND end_time IS NOT NULL
                                AND date = ?
                            GROUP BY ticketservice
                            `,
                            [date],
                            (err, rows) => {
                                if (err) return res.status(500).json({ error: err.message });
                                stats.avgServiceTime = rows;

                                res.json(stats);
                            }
                        );
                    }
                );
            }
        );
    });
  });

  // & Per Hour Analytics for Today+
  router.get('/admin/analytics/hourly', (req, res) => {
    const { date: today } = getPHDateTime();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : today;

    db.all(`
        SELECT 
            strftime('%H', t.date || ' ' || t.time) AS hour,
            CASE 
                WHEN CAST(strftime('%M', t.date || ' ' || t.time) AS INTEGER) < 30
                THEN '00' 
                ELSE '30' 
            END AS minute_block,
            COALESCE(s.shortSname, t.ticketservice, t.sname, 'General') AS sname,
            COUNT(*) AS count
        FROM transactions t
        LEFT JOIN services s ON t.sname = s.sname
        WHERE t.date = ?
        GROUP BY hour, minute_block, COALESCE(s.shortSname, t.ticketservice, t.sname, 'General')
        ORDER BY hour, minute_block, sname
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

    //   ! Per Day Analytics for Current Month
  router.get('/admin/analytics/daily', (req, res) => {
        const { date } = getPHDateTime();

        const currentMonth = /^\d{4}-\d{2}$/.test(req.query.month || '')
            ? req.query.month
            : date.substring(0, 7);

        db.all(`
            SELECT
                CAST(strftime('%d', t.date) AS INTEGER) AS day,
                COALESCE(s.shortSname, t.ticketservice, t.sname, 'General') AS sname,
                COUNT(*) AS count
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            WHERE t.date LIKE ?
            GROUP BY day, COALESCE(s.shortSname, t.ticketservice, t.sname, 'General')
            ORDER BY day ASC
        `,
        [`${currentMonth}%`],
        (err, rows) => {
            if (err) {
                console.error("Daily analytics query error:", err);
                return res.status(500).json({ error: err.message });
            }

            res.json(rows);
        });
    });

  // & Per Month Analytics for Current Year
  router.get('/admin/analytics/monthly', (req, res) => {
    const { date } = getPHDateTime();
    const year = /^\d{4}$/.test(req.query.year || '') ? req.query.year : date.substring(0, 4);

    db.all(`
        SELECT
            CAST(strftime('%m', t.date) AS INTEGER) AS month,
            COALESCE(s.shortSname, t.ticketservice, t.sname, 'General') AS sname,
            COUNT(*) AS count
        FROM transactions t
        LEFT JOIN services s ON t.sname = s.sname
        WHERE t.date LIKE ?
        GROUP BY month, COALESCE(s.shortSname, t.ticketservice, t.sname, 'General')
        ORDER BY month ASC, sname ASC
    `, [`${year}%`], (err, rows) => {
        if (err) {
            console.error('Monthly analytics query error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
  });

  // Current day, week, and month snapshots for the overview workspace
  router.get('/admin/analytics/period-overview', async (req, res) => {
    const { date: today } = getPHDateTime();
    const periodDefinitions = {
      day: {
        start: today,
        end: today,
        trendSql: `
          SELECT
            strftime('%H', date || ' ' || time) || ':' ||
              CASE WHEN CAST(strftime('%M', date || ' ' || time) AS INTEGER) < 30 THEN '00' ELSE '30' END AS label,
            COUNT(*) AS total,
            COUNT(CASE WHEN status = 'finished' THEN 1 END) AS completed,
            COUNT(CASE WHEN status IS NULL OR status != 'finished' THEN 1 END) AS not_completed,
            COUNT(CASE WHEN priority = 1 THEN 1 END) AS priority,
            AVG(CASE
              WHEN start_time IS NOT NULL
              THEN (strftime('%s', date || ' ' || start_time) - strftime('%s', date || ' ' || time)) / 60.0
            END) AS avg_wait_minutes
          FROM transactions
          WHERE date = ?
          GROUP BY label
          ORDER BY label`
      },
      week: {
        startSql: `date(?, '-' || ((CAST(strftime('%w', ?) AS INTEGER) + 6) % 7) || ' days')`,
        end: today
      },
      month: {
        start: `${today.substring(0, 7)}-01`,
        end: today
      }
    };

    try {
      const weekStartRow = await db.getAsync(
        `SELECT ${periodDefinitions.week.startSql} AS start_date`,
        [today, today]
      );
      periodDefinitions.week.start = weekStartRow.start_date;

      const result = {};
      for (const [period, definition] of Object.entries(periodDefinitions)) {
        const summary = await db.getAsync(`
          SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN status = 'finished' THEN 1 END) AS completed,
            COUNT(CASE WHEN status IS NULL OR status != 'finished' THEN 1 END) AS not_completed,
            COUNT(CASE WHEN status IN ('waiting', 'pending') THEN 1 END) AS waiting,
            COUNT(CASE WHEN priority = 1 THEN 1 END) AS priority,
            COUNT(DISTINCT COALESCE(sname, ticketservice)) AS active_services,
            AVG(CASE
              WHEN start_time IS NOT NULL
              THEN (strftime('%s', date || ' ' || start_time) - strftime('%s', date || ' ' || time)) / 60.0
            END) AS avg_wait_minutes,
            AVG(CASE
              WHEN start_time IS NOT NULL AND end_time IS NOT NULL
              THEN (strftime('%s', date || ' ' || end_time) - strftime('%s', date || ' ' || start_time)) / 60.0
            END) AS avg_service_minutes
          FROM transactions
          WHERE date BETWEEN ? AND ?
        `, [definition.start, definition.end]);

        const trend = period === 'day'
          ? await db.allAsync(definition.trendSql, [today])
          : await db.allAsync(`
              SELECT
                date AS label,
                COUNT(*) AS total,
                COUNT(CASE WHEN status = 'finished' THEN 1 END) AS completed,
                COUNT(CASE WHEN status IS NULL OR status != 'finished' THEN 1 END) AS not_completed,
                COUNT(CASE WHEN priority = 1 THEN 1 END) AS priority,
                AVG(CASE
                  WHEN start_time IS NOT NULL
                  THEN (strftime('%s', date || ' ' || start_time) - strftime('%s', date || ' ' || time)) / 60.0
                END) AS avg_wait_minutes
              FROM transactions
              WHERE date BETWEEN ? AND ?
              GROUP BY date
              ORDER BY date
            `, [definition.start, definition.end]);

        result[period] = {
          start: definition.start,
          end: definition.end,
          summary: summary || {},
          trend: trend || []
        };
      }

      res.json(result);
    } catch (error) {
      console.error('Period overview analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // & Live 30-minute ticket arrivals and teller throughput
  router.get('/admin/analytics/live-flow', (req, res) => {
    const { date } = getPHDateTime();

    const ticketFlow = new Promise((resolve, reject) => {
        db.all(`
            SELECT
                strftime('%H', t.date || ' ' || t.time) || ':' ||
                    CASE WHEN CAST(strftime('%M', t.date || ' ' || t.time) AS INTEGER) < 30 THEN '00' ELSE '30' END AS time_block,
                COALESCE(s.shortSname, t.ticketservice, t.sname, 'General') AS service_name,
                COUNT(*) AS count
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            WHERE t.date = ?
            GROUP BY time_block, service_name
            ORDER BY time_block, service_name
        `, [date], (err, rows) => err ? reject(err) : resolve(rows || []));
    });

    const tellerFlow = new Promise((resolve, reject) => {
        db.all(`
            SELECT
                strftime('%H', t.date || ' ' || t.end_time) || ':' ||
                    CASE WHEN CAST(strftime('%M', t.date || ' ' || t.end_time) AS INTEGER) < 30 THEN '00' ELSE '30' END AS time_block,
                COALESCE(c.cname, t.counter_user, 'Unassigned') AS teller_name,
                COUNT(*) AS count
            FROM transactions t
            LEFT JOIN counters c ON t.teller_id = c.id
            WHERE t.date = ? AND t.status = 'finished' AND t.end_time IS NOT NULL
            GROUP BY time_block, teller_name
            ORDER BY time_block, teller_name
        `, [date], (err, rows) => err ? reject(err) : resolve(rows || []));
    });

    Promise.all([ticketFlow, tellerFlow])
        .then(([tickets, tellers]) => res.json({ tickets, tellers }))
        .catch((err) => {
            console.error('Live flow analytics query error:', err);
            res.status(500).json({ error: err.message });
        });
  });

  // & Operational insight cards for the Overview workspace
  router.get('/admin/analytics/insights', (req, res) => {
    const { date } = getPHDateTime();
    const result = {};

    const summary = new Promise((resolve, reject) => {
        db.get(`
            SELECT
                COUNT(*) AS total_tickets,
                COUNT(CASE WHEN status = 'finished' THEN 1 END) AS completed_tickets,
                COUNT(CASE WHEN priority = 1 THEN 1 END) AS priority_tickets,
                COUNT(CASE WHEN status IN ('waiting', 'pending') THEN 1 END) AS waiting_tickets,
                COUNT(DISTINCT COALESCE(sname, ticketservice)) AS active_services,
                AVG(CASE WHEN start_time IS NOT NULL THEN (strftime('%s', start_time) - strftime('%s', time)) / 60.0 END) AS avg_wait_minutes,
                AVG(CASE WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN (strftime('%s', end_time) - strftime('%s', start_time)) / 60.0 END) AS avg_service_minutes,
                (SELECT COUNT(*) FROM transactions WHERE date = date(?, '-1 day')) AS previous_day_tickets
            FROM transactions
            WHERE date = ?
        `, [date, date], (err, row) => {
            if (err) return reject(err);
            result.summary = row || {};
            resolve();
        });
    });

    const busiestService = new Promise((resolve, reject) => {
        db.get(`
            SELECT COALESCE(s.shortSname, t.ticketservice, t.sname, 'General') AS service_name, COUNT(*) AS ticket_count
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            WHERE t.date = ?
            GROUP BY COALESCE(s.shortSname, t.ticketservice, t.sname, 'General')
            ORDER BY ticket_count DESC
            LIMIT 1
        `, [date], (err, row) => {
            if (err) return reject(err);
            result.busiest_service = row || null;
            resolve();
        });
    });

    const peakWindow = new Promise((resolve, reject) => {
        db.get(`
            SELECT
                strftime('%H', date || ' ' || time) || ':' ||
                    CASE WHEN CAST(strftime('%M', date || ' ' || time) AS INTEGER) < 30 THEN '00' ELSE '30' END AS time_block,
                COUNT(*) AS ticket_count
            FROM transactions
            WHERE date = ?
            GROUP BY time_block
            ORDER BY ticket_count DESC, time_block ASC
            LIMIT 1
        `, [date], (err, row) => {
            if (err) return reject(err);
            result.peak_window = row || null;
            resolve();
        });
    });

    Promise.all([summary, busiestService, peakWindow])
        .then(() => res.json(result))
        .catch((err) => {
            console.error('Operational insights query error:', err);
            res.status(500).json({ error: err.message });
        });
  });

  // ! -------- SERVICES -------- !
  // & Services List for Admin  
  router.get('/admin/services', (req, res) => {
    db.all('SELECT * FROM services', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
  });

  // & Add Service
  router.post('/admin/services', async (req, res) => {
    const { shortSname, sub_sname, prefix, priority_prefix, is_active, cutoff_time } = req.body;
    const displayName = String(shortSname || '').trim();
    const serviceKey = normalizeServiceKey(displayName);

    if (!displayName) return res.status(400).json({ error: 'Service display name is required' });

    try {
      const existing = await db.getAsync('SELECT id FROM services WHERE UPPER(sname) = UPPER(?)', [serviceKey]);
      if (existing) return res.status(409).json({ error: `The service key ${serviceKey} is already in use` });

      const result = await inTransaction(db, async () => {
        const insert = await db.runAsync(
          `INSERT INTO services (sname, shortSname, sub_sname, regular, priority, status, sched)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [serviceKey, displayName, sub_sname, prefix, priority_prefix, is_active, cutoff_time]
        );
        await synchronizeServiceGroups(db);
        return insert;
      });

      res.json({ success: true, id: result.lastID, sname: serviceKey });
      io.emit('service_update');
      io.emit('teller_assignment_updated', { all: true });
      io.emit('calledticketsArrived');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // & Edit Service
  router.put('/admin/services/:id', async (req, res) => {
    const { shortSname, sub_sname, prefix, priority_prefix, cutoff_time, is_active } = req.body;
    const displayName = String(shortSname || '').trim();
    const serviceKey = normalizeServiceKey(displayName);
    const serviceId = Number(req.params.id);

    if (!displayName) return res.status(400).json({ error: 'Service display name is required' });

    try {
      const current = await db.getAsync('SELECT * FROM services WHERE id = ?', [serviceId]);
      if (!current) return res.status(404).json({ error: 'Service not found' });

      const duplicate = await db.getAsync(
        'SELECT id FROM services WHERE UPPER(sname) = UPPER(?) AND id != ?',
        [serviceKey, serviceId]
      );
      if (duplicate) return res.status(409).json({ error: `The service key ${serviceKey} is already in use` });

      await inTransaction(db, async () => {
        await db.runAsync(
          `UPDATE services
           SET sname = ?, shortSname = ?, sub_sname = ?, regular = ?, priority = ?, sched = ?, status = ?
           WHERE id = ?`,
          [serviceKey, displayName, sub_sname, prefix, priority_prefix, cutoff_time, is_active, serviceId]
        );
        await synchronizeServiceGroups(db, { renames: [[current.sname, serviceKey]] });
      });

      res.json({ success: true, sname: serviceKey });
      io.emit('service_update');
      io.emit('teller_assignment_updated', { all: true });
      io.emit('calledticketsArrived');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // & Delete Service
  router.delete('/admin/services/:id', requireRole('superadmin'), async (req, res) => {
    try {
      const current = await db.getAsync('SELECT * FROM services WHERE id = ?', [req.params.id]);
      if (!current) return res.status(404).json({ error: 'Service not found' });

      await inTransaction(db, async () => {
        await db.runAsync('DELETE FROM services WHERE id = ?', [req.params.id]);
        await synchronizeServiceGroups(db, { removedKeys: [current.sname] });
      });

      res.json({ success: true });
      io.emit('service_update');
      io.emit('teller_assignment_updated', { all: true });
      io.emit('calledticketsArrived');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });  

  //   ! -------- GROUPS -------- !
  // & Groups List for Admin
  router.get('/admin/groups', (req, res) => {
    db.all('SELECT * FROM counter_groups', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
  });

  const groupsAreAutomatic = (req, res) => res.status(405).json({
    error: 'Groups are managed automatically from the service catalog'
  });
  router.post('/admin/groups', groupsAreAutomatic);
  router.put('/admin/groups/:id', groupsAreAutomatic);
  router.delete('/admin/groups/:id', groupsAreAutomatic);

    //   ! -------- TELLERS -------- !
  // & Tellers List for Admin
  router.get('/admin/tellers', (req, res) => {
    db.all(`SELECT t.*, tg.group_name as group_name FROM counters t 
            LEFT JOIN counter_groups tg ON t.group_id = tg.id`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
  });

  // & Add Tellers 
  router.post('/admin/tellers', (req, res) => {
    const { name, username, password, counter_number, services, group_id, group_name, groupName, is_active } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }


    // const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        `INSERT INTO counters
         (cname, cuser, cpass, cnum, services, group_id, group_name, cstatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            name,
            username,
            password,
            counter_number,
            services,
            group_id,
            group_name || groupName || null,
            is_active
        ],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
  });

  //   & Edit Tellers
  router.put('/admin/tellers/:id', (req, res) => {
    const { name, username, counter_number, services, group_id, groupName, is_active, password } = req.body;
    const tellerId = Number(req.params.id);

    const completeTellerUpdate = err => {
        if (err) return res.status(500).json({ error: err.message });

        io.emit('teller_assignment_updated', { tellerId });
        res.json({ success: true });
    };


    if (password) {
        // const hashedPassword = bcrypt.hashSync(password, 10);

        db.run(
            `UPDATE counters
             SET cname = ?, cuser = ?, cpass = ?, cnum = ?, services = ?, group_id = ?,group_name = ?, cstatus = ?
             WHERE id = ?`,
            [name, username, password, counter_number, services, group_id, groupName, is_active, req.params.id],
            completeTellerUpdate
        );
    } else {
        db.run(
            `UPDATE counters
             SET cname = ?, cuser = ?, cnum = ?, services = ?, group_id = ?,group_name = ?, cstatus = ?
             WHERE id = ?`,
            [name, username, counter_number, services, group_id, groupName, is_active, req.params.id],
            completeTellerUpdate
        );
    }
  });

  // & Delete Tellers
  router.delete('/admin/tellers/:id', requireRole('superadmin'), (req, res) => {
    db.run('DELETE FROM counters WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });

      //   ! -------- Accounts -------- !
  // & Accounts List for Admin
  router.get('/admin/accounts', (req, res) => {
    db.all(`SELECT * FROM accounts`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
  });

  // & Add Accounts 
  router.post('/admin/accounts', requireRole('superadmin'), (req, res) => {
    const { name, username, password, role, is_active } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }


    // const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        `INSERT INTO accounts
         (name, username, password, role, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
            name,
            username,
            password,
            role,
            is_active
        ],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
  });

  //   & Edit Accounts
  router.put('/admin/accounts/:id', requireRole('superadmin'), (req, res) => {
    const { name, username, role, is_active, password } = req.body;


    if (password) {
        // const hashedPassword = bcrypt.hashSync(password, 10);

        db.run(
            `UPDATE accounts
             SET name = ?, username = ?, password = ?, role = ?, status = ?
             WHERE id = ?`,
            [name, username, password, role, is_active, req.params.id],
            err => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    } else {
        db.run(
            `UPDATE accounts
             SET name = ?, username = ?, role = ?, status = ?
             WHERE id = ?`,
            [name, username, role, is_active, req.params.id],
            err => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    }
  });

  // & Delete Accounts
  router.delete('/admin/accounts/:id', requireRole('superadmin'), (req, res) => {
    db.run('DELETE FROM accounts WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });

  //   ! -------- Ticket history -------- !
  // & get all tickets
  router.get('/admin/tickets/all', (req, res) => {
    const search = String(req.query.search || '').trim();
    const queryLimit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const requestedPage = Math.max(parseInt(req.query.page, 10) || 1, 1);

    let whereClause = 'WHERE 1=1';
    const filterParams = [];

    if (search) {
        whereClause += `
            AND (
                CAST(t.ticketnum AS TEXT) LIKE ?
                OR t.ticketservice LIKE ?
                OR t.sname LIKE ?
                OR (t.ticketservice || t.ticketnum) LIKE ?
                OR t.counter_user LIKE ?
                OR t.status LIKE ?
            )
        `;
        const likeSearch = `%${search}%`;
        filterParams.push(likeSearch, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch);
    }

    const countQuery = `SELECT COUNT(*) AS total FROM transactions t ${whereClause}`;

    db.get(countQuery, filterParams, (countError, countRow) => {
        if (countError) return res.status(500).json({ error: countError.message });

        const totalRows = Number(countRow?.total || 0);
        const totalPages = Math.ceil(totalRows / queryLimit);
        const currentPage = totalPages ? Math.min(requestedPage, totalPages) : 1;
        const queryOffset = (currentPage - 1) * queryLimit;

        const dataQuery = `
        SELECT
            t.*,
            counter.cname as teller_name,
            ((strftime('%s', t.end_time) - strftime('%s', t.start_time)) / 60.0) as duration_minutes
        FROM transactions t
        LEFT JOIN counters counter ON t.teller_id = counter.id
        ${whereClause}
        ORDER BY t.date DESC, t.time DESC, t.id DESC
        LIMIT ? OFFSET ?
        `;

        db.all(dataQuery, [...filterParams, queryLimit, queryOffset], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                tickets: rows || [],
                pagination: {
                    page: currentPage,
                    limit: queryLimit,
                    totalRows,
                    totalPages,
                    hasPrevious: currentPage > 1,
                    hasNext: currentPage < totalPages
                }
            });
        });
    });
  });

  // & get ticket details
  router.get('/admin/tickets/details/:id', (req, res) => {
    const ticketId = req.params.id;

    db.get('SELECT * FROM transactions WHERE id = ?', [ticketId], (err, ticket) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const timeline = [];

        if (ticket.history) {
            const entries = ticket.history.split(';').filter(Boolean);

            entries.forEach(entry => {
                const clean = entry.replace(/[\[\]]/g, '');
                const parts = clean.split('-');

                // Expected format:
                // [time-actor-counter-action]
                if (parts.length >= 4) {
                    const time = parts[0];
                    const actor = parts[1];
                    const counter = parts[2];
                    const action = parts.slice(3).join('-'); // in case action has dash

                    timeline.push({
                        event: action,
                        time: time,
                        actor: actor,
                        counter: counter,
                        details: `${actor} - Counter ${counter}`
                    });
                } else if (parts.length === 3) {
                    // For kiosk or entries without counter
                    const time = parts[0];
                    const actor = parts[1];
                    const action = parts[2];

                    timeline.push({
                        event: action,
                        time: time,
                        actor: actor,
                        counter: null,
                        details: `${actor}`
                    });
                }
            });
        }

        res.json({
            ticket_id: ticket.id,
            ticket: {
                number: `${ticket.ticketservice || ''}${ticket.ticketnum || ''}`,
                service: ticket.sname || ticket.ticketservice || 'Unknown service',
                status: ticket.status,
                date: ticket.date,
                created_time: ticket.time,
                start_time: ticket.start_time,
                end_time: ticket.end_time
            },
            timeline
        });
    });
  });

  //   ! -------- SETTINGS -------- !
  router.get('/admin/configuration', (req, res) => {
    const config = loadConfig().MainServer;
    res.json({
      port: Number(config.port),
      camscan: Boolean(config.camscan),
      onlineTicketExpiry: Number(config.expiry),
      onlineTicketing: Boolean(config.ticketonline)
    });
  });

  router.put('/admin/configuration', (req, res) => {
    const portText = String(req.body?.port ?? '').trim();
    const expiryText = String(req.body?.onlineTicketExpiry ?? '').trim();
    const port = Number(portText);
    const onlineTicketExpiry = Number(expiryText);

    if (!/^\d{1,5}$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
      return res.status(400).json({ error: 'Port must be a valid number from 1 to 65535 using no more than 5 digits.' });
    }

    if (!/^\d+$/.test(expiryText) || !Number.isSafeInteger(onlineTicketExpiry) || onlineTicketExpiry < 1 || onlineTicketExpiry > 999999) {
      return res.status(400).json({ error: 'Online ticket expiry must be a whole number from 1 to 999999 minutes.' });
    }

    if (typeof req.body?.camscan !== 'boolean' || typeof req.body?.onlineTicketing !== 'boolean') {
      return res.status(400).json({ error: 'Camera scan and online ticketing must be true or false.' });
    }

    try {
      const previousPort = Number(loadConfig().MainServer.port);
      const config = saveConfig({
        port,
        camscan: req.body.camscan,
        expiry: onlineTicketExpiry,
        ticketonline: req.body.onlineTicketing
      }).MainServer;

      const responseConfig = {
        port: Number(config.port),
        camscan: Boolean(config.camscan),
        onlineTicketExpiry: Number(config.expiry),
        onlineTicketing: Boolean(config.ticketonline)
      };

      io.emit('systemConfigurationUpdated', responseConfig);
      res.json({
        success: true,
        config: responseConfig,
        restartRequired: previousPort !== port
      });
    } catch (error) {
      console.error('Failed to update system configuration:', error);
      res.status(500).json({ error: 'Failed to save system configuration.' });
    }
  });

  router.get('/admin/display-audio', (req, res) => {
    res.json(readSoundConfig());
  });

  router.post('/admin/display-audio', (req, res) => {
    try {
      const config = writeSoundConfig(req.body || {});
      io.emit('voiceConfigUpdate', config);
      res.json({ success: true, config });
    } catch (error) {
      console.error('Failed to update display audio configuration:', error);
      res.status(500).json({ error: 'Failed to save display audio configuration' });
    }
  });

  // & settings
router.get('/settings', (req, res) => {
    db.all('SELECT * FROM settings', (err, settings) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        const settingsObj = {};

        settings.forEach(setting => {
            let parsedValue;
            try {
                parsedValue = JSON.parse(setting.value);
            } catch (e) {
                parsedValue = setting.value; // use as-is if not JSON
            }

            settingsObj[setting.key] = {
                value: parsedValue,
                status: setting.status
            };
        });

        res.json(settingsObj);
    });
})
  
  // & Save Settings
  router.post('/settings', requireManagementAccess, (req, res) => {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Invalid settings payload' });
    }

    const role = String(req.session?.admin?.role || '').trim().toLowerCase();
    const adminAnnouncementKeys = new Set([
        'announcement',
        'announcement2',
        'announcement3',
        'annbgcolor',
        'anntextcolor',
        'annspeed'
    ]);
    const requestedKeys = Object.keys(settings);

    if (role === 'admin' && requestedKeys.some(key => !adminAnnouncementKeys.has(key))) {
        return res.status(403).json({ error: 'Admin accounts can update announcement settings only.' });
    }

    try {
        Object.entries(settings).forEach(([key, data]) => {
            // Extract value and status from the object
            const value = typeof data === 'object' ? (data.value ?? '') : (data ?? '');
            const status = typeof data === 'object' ? (data.status ?? 0) : 0;

            db.run(
                `UPDATE settings SET value = ?, status = ? WHERE key = ?`,
                [value, status, key],
                function(err) {
                    if (err) {
                        console.error(`Failed to update setting ${key}:`, err);
                        return;
                    }

                    if (this.changes === 0) {
                        db.run(
                            `INSERT INTO settings (key, value, status) VALUES (?, ?, ?)`,
                            [key, value, status],
                            (err2) => {
                                if (err2) console.error(`Failed to insert setting ${key}:`, err2);
                            }
                        );
                    }

                    io.emit('settings_updated', { key, value, status });
                    io.emit('footerUpdated');
                }
            );
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Failed to update settings:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

  // ! -------- REPORTS -------- !
  // & Get Reports with Date Range
  router.get('/admin/reports/data', (req, res) => {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
        return res.status(400).json({ error: 'dateFrom and dateTo are required' });
    }

    const { date: today } = getPHDateTime();
    const reports = {};

    // ─── Effective-status rules ───────────────────────────────────────────────
    // • status = 'finished'                          → 'finished'
    // • date < today  AND status != 'finished'       → 'voided'  (reason: not served)
    // • date = today  AND status != 'finished'       → keep original status
    // ─────────────────────────────────────────────────────────────────────────

    // For queries that alias the transactions table as "t"
    const effT = `CASE
        WHEN t.status = 'finished'                         THEN 'finished'
        WHEN t.date  < '${today}' AND t.status != 'finished' THEN 'voided'
        ELSE t.status
    END`;

    // For queries without a table alias
    const eff = `CASE
        WHEN status = 'finished'                        THEN 'finished'
        WHEN date   < '${today}' AND status != 'finished' THEN 'voided'
        ELSE status
    END`;

    // 1. Summary Statistics
    const summaryPromise = new Promise((resolve) => {
        db.get(`
            SELECT
                COUNT(*) as total_tickets,
                COUNT(CASE WHEN (${eff}) = 'finished' THEN 1 END) as completed_tickets,
                COUNT(CASE WHEN date != '${today}' AND status != 'finished' THEN 1 END) as voided_tickets,
                COUNT(CASE WHEN (${eff}) NOT IN ('finished','voided') THEN 1 END) as pending_tickets,
                AVG(CASE
                    WHEN status = 'finished' AND start_time IS NOT NULL AND end_time IS NOT NULL
                    THEN (strftime('%s', end_time) - strftime('%s', start_time)) / 60.0
                    END) as avg_service_time_minutes,
                AVG(CASE
                    WHEN status = 'finished' AND start_time IS NOT NULL AND time IS NOT NULL
                    THEN (strftime('%s', end_time) - strftime('%s', time)) / 60.0
                    END) as avg_turnaround_time_minutes
            FROM transactions
            WHERE date BETWEEN ? AND ?
        `, [dateFrom, dateTo], (err, row) => {
            if (err) console.error('Summary query error:', err);
            else reports.summary = row;
            resolve();
        });
    });

    // 2. Tickets by Service
    const byServicePromise = new Promise((resolve) => {
        db.all(`
            SELECT
                t.ticketservice as service_code,
                COALESCE(s.shortSname, t.ticketservice) as service_name,
                COUNT(*)                                                                as ticket_count,
                COUNT(CASE WHEN (${effT}) = 'finished' THEN 1 END)                    as completed,
                COUNT(CASE WHEN (${effT}) = 'voided'   THEN 1 END)                    as voided,
                COUNT(CASE WHEN (${effT}) NOT IN ('finished','voided') THEN 1 END)    as pending,
                AVG(CASE
                    WHEN t.status = 'finished' AND t.start_time IS NOT NULL AND t.end_time IS NOT NULL
                    THEN (strftime('%s', t.end_time) - strftime('%s', t.start_time)) / 60.0
                    END) as avg_service_time_minutes
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            WHERE t.date BETWEEN ? AND ?
            GROUP BY t.ticketservice
            ORDER BY ticket_count DESC
        `, [dateFrom, dateTo], (err, rows) => {
            if (err) console.error('By service query error:', err);
            else reports.byService = rows || [];
            resolve();
        });
    });

    // 3. Tickets by Teller
    //    tickets_served = only FINISHED tickets (actually served by the teller)
    const byTellerPromise = new Promise((resolve) => {
        db.all(`
            SELECT
                t.teller_id,
                COALESCE(c.cname, 'Unknown') as teller_name,
                c.cnum as counter_number,
                COUNT(CASE WHEN (${effT}) = 'finished' THEN 1 END) as tickets_served,
                COUNT(CASE WHEN (${effT}) = 'finished' THEN 1 END) as completed,
                COUNT(CASE WHEN t.date != '${today}' AND t.status != 'finished' THEN 1 END) as voided,
                AVG(CASE
                    WHEN t.status = 'finished' AND t.start_time IS NOT NULL AND t.end_time IS NOT NULL
                    THEN (strftime('%s', t.end_time) - strftime('%s', t.start_time)) / 60.0
                    END) as avg_service_time_minutes
            FROM transactions t
            LEFT JOIN counters c ON t.teller_id = c.id
            WHERE t.date BETWEEN ? AND ?
              AND t.teller_id IS NOT NULL
            GROUP BY t.teller_id
            ORDER BY tickets_served DESC
        `, [dateFrom, dateTo], (err, rows) => {
            if (err) console.error('By teller query error:', err);
            else reports.byTeller = rows || [];
            resolve();
        });
    });

    // 4. Tickets by Effective Status
    const byStatusPromise = new Promise((resolve) => {
        db.all(`
            SELECT
                (${eff}) as status,
                COUNT(*)  as count
            FROM transactions
            WHERE date BETWEEN ? AND ?
            GROUP BY (${eff})
            ORDER BY count DESC
        `, [dateFrom, dateTo], (err, rows) => {
            if (err) console.error('By status query error:', err);
            else reports.byStatus = rows || [];
            resolve();
        });
    });

    // 5. Daily Trends
    const dailyTrendsPromise = new Promise((resolve) => {
        db.all(`
            SELECT
                date,
                COUNT(*)                                                             as daily_tickets,
                COUNT(CASE WHEN (${eff}) = 'finished' THEN 1 END)                   as daily_completed,
                COUNT(CASE WHEN (${eff}) = 'voided'   THEN 1 END)                   as daily_voided,
                AVG(CASE
                    WHEN status = 'finished' AND start_time IS NOT NULL AND end_time IS NOT NULL
                    THEN (strftime('%s', end_time) - strftime('%s', start_time)) / 60.0
                    END) as daily_avg_service_time
            FROM transactions
            WHERE date BETWEEN ? AND ?
            GROUP BY date
            ORDER BY date
        `, [dateFrom, dateTo], (err, rows) => {
            if (err) console.error('Daily trends query error:', err);
            else reports.dailyTrends = rows || [];
            resolve();
        });
    });

    // 6. Service volume by hour of day for the selected range
    const serviceHourlyPromise = new Promise((resolve) => {
        db.all(`
            SELECT
                CAST(strftime('%H', t.date || ' ' || t.time) AS INTEGER) AS hour,
                COALESCE(s.shortSname, t.ticketservice, t.sname, 'General') AS service_name,
                COUNT(*) AS ticket_count
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            WHERE t.date BETWEEN ? AND ?
            GROUP BY hour, service_name
            ORDER BY hour, service_name
        `, [dateFrom, dateTo], (err, rows) => {
            if (err) console.error('Service hourly report query error:', err);
            else reports.serviceHourly = rows || [];
            resolve();
        });
    });

    // 7. Service volume by calendar day for the selected range
    const serviceDailyPromise = new Promise((resolve) => {
        db.all(`
            SELECT
                t.date,
                COALESCE(s.shortSname, t.ticketservice, t.sname, 'General') AS service_name,
                COUNT(*) AS ticket_count
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            WHERE t.date BETWEEN ? AND ?
            GROUP BY t.date, service_name
            ORDER BY t.date, service_name
        `, [dateFrom, dateTo], (err, rows) => {
            if (err) console.error('Service daily report query error:', err);
            else reports.serviceDaily = rows || [];
            resolve();
        });
    });

    // 8. Service volume by calendar month for the selected range
    const serviceMonthlyPromise = new Promise((resolve) => {
        db.all(`
            SELECT
                substr(t.date, 1, 7) AS month,
                COALESCE(s.shortSname, t.ticketservice, t.sname, 'General') AS service_name,
                COUNT(*) AS ticket_count
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            WHERE t.date BETWEEN ? AND ?
            GROUP BY month, service_name
            ORDER BY month, service_name
        `, [dateFrom, dateTo], (err, rows) => {
            if (err) console.error('Service monthly report query error:', err);
            else reports.serviceMonthly = rows || [];
            resolve();
        });
    });

    // 9. Detailed Transactions (effective status shown)
    const detailedPromise = new Promise((resolve) => {
        db.all(`
            SELECT
                t.id,
                t.date,
                t.time,
                t.ticketservice as service_code,
                COALESCE(s.shortSname, t.ticketservice) as service_name,
                (${effT})       as status,
                CASE WHEN (${effT}) = 'voided' AND t.status != 'finished'
                     THEN 'not served' ELSE NULL END as void_reason,
                COALESCE(c.cname, NULL) as teller_name,
                CASE
                    WHEN t.status = 'finished' AND t.start_time IS NOT NULL AND t.end_time IS NOT NULL
                    THEN (strftime('%s', t.end_time) - strftime('%s', t.start_time)) / 60.0
                    ELSE NULL
                END as service_time_minutes,
                CASE
                    WHEN t.status = 'finished' AND t.start_time IS NOT NULL AND t.time IS NOT NULL
                    THEN (strftime('%s', t.end_time) - strftime('%s', t.time)) / 60.0
                    ELSE NULL
                END as turnaround_time_minutes
            FROM transactions t
            LEFT JOIN services  s ON t.sname     = s.sname
            LEFT JOIN counters  c ON t.teller_id = c.id
            WHERE t.date BETWEEN ? AND ?
            ORDER BY t.date DESC, t.time DESC
            LIMIT 1000
        `, [dateFrom, dateTo], (err, rows) => {
            if (err) console.error('Detailed transactions query error:', err);
            else reports.detailedTransactions = rows || [];
            resolve();
        });
    });

    Promise.all([
        summaryPromise,
        byServicePromise,
        byTellerPromise,
        byStatusPromise,
        dailyTrendsPromise,
        serviceHourlyPromise,
        serviceDailyPromise,
        serviceMonthlyPromise,
        detailedPromise
    ])
        .then(() => res.json(reports))
        .catch(err => res.status(500).json({ error: err.message }));
  });

    router.post('/admin/upload-image', (req, res) => {
        try {
            const { type, data } = req.body;
            if (!['banner', 'bg'].includes(type)) {
                return res.status(400).json({ error: 'Invalid image type' });
            }
            if (!data || !data.startsWith('data:image/png;base64,')) {
                return res.status(400).json({ error: 'Invalid image format, expected base64 png' });
            }
            
            const base64Data = data.replace(/^data:image\/png;base64,/, "");
            const filename = type === 'banner' ? 'banner.png' : 'bg.png';
            // Save in public/images
            const imageRoot = global.ROOT_PATH || path.join(__dirname, '../../');
            const filepath = path.join(imageRoot, 'public', 'images', filename);
            
            fs.writeFile(filepath, base64Data, 'base64', (err) => {
                if (err) {
                    console.error('Error saving image:', err);
                    return res.status(500).json({ error: 'Failed to save image' });
                }
                res.json({ success: true, filename });
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Server error during upload' });
        }
    });

    return router;
};
