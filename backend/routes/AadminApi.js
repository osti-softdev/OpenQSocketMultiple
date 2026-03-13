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
                    `SELECT ticketservice as sname, COUNT(*) as count FROM transactions WHERE date = ? GROUP BY ticketservice`,
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

  // ! -------- SERVICES -------- !
  // & Services List for Admin  
  router.get('/admin/services', (req, res) => {
    db.all('SELECT * FROM services', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
  });

  // & Add Service
  router.post('/admin/services', (req, res) => {
    const { name, shortSname, sub_sname, prefix, priority_prefix, is_active, cutoff_time } = req.body;
    db.run(`INSERT INTO services (sname, shortSname, sub_sname, regular, priority, status, sched) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, shortSname, sub_sname, prefix, priority_prefix, is_active, cutoff_time],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
            io.emit('service_update'); // Emit service update event
        });
  });

  // & Edit Service
  router.put('/admin/services/:id', (req, res) => {
    const { name, shortSname, sub_sname, prefix, priority_prefix, cutoff_time, is_active } = req.body;
    db.run(`UPDATE services SET sname = ?, shortSname = ?, sub_sname = ?, regular = ?, priority = ?, sched = ?, status = ? WHERE id = ?`,
        [name, shortSname, sub_sname, prefix, priority_prefix, cutoff_time, is_active, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
            io.emit('service_update'); // Emit service update event
        });
  });
  
  // & Delete Service
  router.delete('/admin/services/:id', (req, res) => {
        db.run('DELETE FROM services WHERE id = ?', [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
            io.emit('service_update'); // Emit service update event
        });
  });  

  //   ! -------- GROUPS -------- !
  // & Groups List for Admin
  router.get('/admin/groups', (req, res) => {
    db.all('SELECT * FROM counter_groups', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
  });

  // & Add Group
  router.post('/admin/groups', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO counter_groups (group_name) VALUES (?)', [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
  });

  // & Edit Group
  router.put('/admin/groups/:id', (req, res) => {
    const { name } = req.body;
    db.run('UPDATE counter_groups SET group_name = ? WHERE id = ?', [name, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });

  // & Delete Group
  router.delete('/admin/groups/:id', (req, res) => {
    db.run('DELETE FROM counter_groups WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });

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
    const { name, username, password, counter_number, services, group_id, is_active } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }


    // const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        `INSERT INTO counters
         (cname, cuser, cpass, cnum, services, group_id, cstatus)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            name,
            username,
            password,
            counter_number,
            services,
            group_id,
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
    const { name, username, counter_number, services, group_id, is_active, password } = req.body;


    if (password) {
        // const hashedPassword = bcrypt.hashSync(password, 10);

        db.run(
            `UPDATE counters
             SET cname = ?, cuser = ?, cpass = ?, cnum = ?, services = ?, group_id = ?, cstatus = ?
             WHERE id = ?`,
            [name, username, password, counter_number, services, group_id, is_active, req.params.id],
            err => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    } else {
        db.run(
            `UPDATE counters
             SET cname = ?, cuser = ?, cnum = ?, services = ?, group_id = ?, cstatus = ?
             WHERE id = ?`,
            [name, username, counter_number, services, group_id, is_active, req.params.id],
            err => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    }
  });

  // & Delete Tellers
  router.delete('/admin/tellers/:id', (req, res) => {
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
  router.post('/admin/accounts', (req, res) => {
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
  router.put('/admin/accounts/:id', (req, res) => {
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
  router.delete('/admin/accounts/:id', (req, res) => {
    db.run('DELETE FROM accounts WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });

  //   ! -------- Ticket history -------- !
  // & get all tickets
  router.get('/admin/tickets/all', (req, res) => {
    const { limit, offset, search } = req.query;

    const queryLimit = parseInt(limit) || 100;
    const queryOffset = parseInt(offset) || 0;

    let query = `
        SELECT 
            t.*, 
            counter.cname as teller_name,
            ((strftime('%s', t.end_time) - strftime('%s', t.start_time)) / 60.0) as duration_minutes
        FROM transactions t
        LEFT JOIN counters counter ON t.teller_id = counter.id
        WHERE 1=1
    `;

    let params = [];

    if (search) {
        query += `
            AND (
                t.ticketnum LIKE ?
                OR t.ticketservice LIKE ?
                OR (t.ticketservice || t.ticketnum) LIKE ?
            )
        `;
        const likeSearch = `%${search}%`;
        params.push(likeSearch, likeSearch, likeSearch);
    }

    query += ` ORDER BY t.time DESC LIMIT ? OFFSET ?`;
    params.push(queryLimit, queryOffset);

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
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
            timeline
        });
    });
  });

  //   ! -------- SETTINGS -------- !
  // & settings
  router.get('/settings', (req, res) => {
    db.all('SELECT * FROM settings', (err, settings) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });
        res.json(settingsObj);
    });
  });
  
  // & Save Settings
  router.post('/settings', (req, res) => {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Invalid settings payload' });
    }

    try {
        Object.entries(settings).forEach(([key, value]) => {
            // First try to update the value for the key
            db.run(
                `UPDATE settings SET value = ? WHERE key = ?`,
                [value ?? '', key],
                function(err) {
                    if (err) {
                        console.error(`Failed to update setting ${key}:`, err);
                        return;
                    }

                    // If no row was updated, insert new row
                    if (this.changes === 0) {
                        db.run(
                            `INSERT INTO settings (key, value) VALUES (?, ?)`,
                            [key, value ?? ''],
                            (err2) => {
                                if (err2) console.error(`Failed to insert setting ${key}:`, err2);
                            }
                        );
                    }

                    // Emit the update regardless
                    io.emit('settings_updated', { key, value });
                }
            );
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Failed to update settings:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
  });
    return router;
};