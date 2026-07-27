// tellerApi.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
// tellerApi.js
const { requireRole } = require('../utilities/authsession');

module.exports = function createTellerApiRouter(io) {
    const router = express.Router();

    const rootpath = global.BACKEND_PATH || __dirname;
    const db = require(path.join(rootpath, 'utilities/db'));
    const { getPHDateTime } = require(path.join(rootpath, 'utilities/datetime'));

    function triggerSMS(type, ticketId, counterNumber = '') {
        db.get(`SELECT * FROM transactions WHERE id = ?`, [ticketId], (err, ticket) => {
            if (!err && ticket && ticket.mobile) {
                const smsService = require('../utilities/smsService');
                const { time } = getPHDateTime();
                const ticketCode = ticket.ticketservice + ticket.ticketnum;
                let logEntry = `[${time}] ${type} sent\n`;
                db.run(`UPDATE transactions SET mobile_records = COALESCE(mobile_records, '') || ? WHERE id = ?`, [logEntry, ticket.id]);
                smsService.sendTemplateSMS(type, {
                    mobile: ticket.mobile,
                    ticket: ticketCode,
                    counter: counterNumber,
                    service: ticket.sname
                }).catch(e => console.error("SMS Error:", e));
            }
        });
    }

    function triggerNearlyCalledSMS(calledTicket, counterNumber = '') {
        const gap = parseInt(process.env.CALL_RANGE_GAP || '0', 10);
        if (gap <= 0) return;

        const targetTicketNum = parseInt(calledTicket.ticketnum, 10) + gap;
        const { date } = getPHDateTime();

        db.get(
            `SELECT * FROM transactions WHERE ticketservice = ? AND ticketnum = ? AND date = ? AND status = 'pending'`,
            [calledTicket.ticketservice, targetTicketNum, date],
            (err, ticket) => {
                if (!err && ticket && ticket.mobile) {
                    const smsService = require('../utilities/smsService');
                    const { time } = getPHDateTime();
                    const ticketCode = ticket.ticketservice + ticket.ticketnum;
                    let logEntry = `[${time}] nearly_called sent\n`;
                    db.run(`UPDATE transactions SET mobile_records = COALESCE(mobile_records, '') || ? WHERE id = ?`, [logEntry, ticket.id]);
                    smsService.sendTemplateSMS('nearly_called', {
                        mobile: ticket.mobile,
                        ticket: ticketCode,
                        counter: counterNumber,
                        service: ticket.sname
                    }).catch(e => console.error("SMS Error:", e));
                }
            }
        );
    }
    const requireTellerSession = (req, res, next) => {
        if (!req.session?.teller) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        next();
    };

    // =========================
    // & Account login
    // =========================
    router.post('/login', (req, res) => {
        const { username, password } = req.body;

        console.log('Login attempt for:', username);

        db.get(
            'SELECT * FROM counters WHERE cuser = ?',
            [username],
            (err, teller) => {
                if (err) {
                    console.error('Database error during login:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }

                if (!teller) {
                    console.log('User not found:', username);
                    const remaining = req.rateLimit ? req.rateLimit.remaining : undefined;
                    return res.status(401).json({ success: false, message: 'Invalid username or password', remainingAttempts: remaining });
                }

                console.log('User found, verifying password...');

                try {
                    if (password === teller.cpass) {
                        resetAuthLimit(req);
                        req.session.teller = teller;
                        req.session.teller = {
                            id: teller.id,
                            username: teller.cname,
                            counter_number: teller.cnum,
                            services: teller.services,
                            group_name: teller.group_name,
                            group_id: teller.group_id
                        };

                        console.log('Login successful for:', username);

                        return res.json({
                            success: true,
                            teller: req.session.teller
                        });
                    } else {
                        console.log('Password mismatch for:', username);
                        const remaining = req.rateLimit ? req.rateLimit.remaining : undefined;
                        return res.status(401).json({ success: false, message: 'Invalid username or password', remainingAttempts: remaining });
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

    router.get('/check-session', (req, res) => {
        const tellerId = req.session?.teller?.id;
        if (!tellerId) {
            return res.json({ loggedIn: false });
        }

        db.get('SELECT * FROM counters WHERE id = ?', [tellerId], (err, teller) => {
            if (err) {
                return res.status(500).json({ loggedIn: false, message: 'Database error' });
            }
            if (!teller) {
                req.session.teller = null;
                return res.json({ loggedIn: false });
            }

            const refreshedTeller = {
                id: teller.id,
                username: teller.cname,
                counter_number: teller.cnum,
                services: teller.services || '',
                group_name: teller.group_name,
                group_id: teller.group_id
            };

            req.session.teller = refreshedTeller;
            req.session.save(saveErr => {
                if (saveErr) {
                    return res.status(500).json({ loggedIn: false, message: 'Session update failed' });
                }
                res.json({ loggedIn: true, teller: refreshedTeller });
            });
        });
    });

    router.get('/teller/report-data', requireTellerSession, (req, res) => {
        const teller = req.session.teller;
        const { date } = getPHDateTime();
        const dateFrom = req.query.datefrom || date;
        const dateTo = req.query.dateto || date;
        const historyMatch = `%-${teller.username}-%`;
        const reportParams = [dateFrom, dateTo, teller.counter_number, historyMatch];

        const chartQuery = `
        SELECT
            date,
            SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) AS served,
            SUM(CASE WHEN status = 'voided' THEN 1 ELSE 0 END) AS voided
        FROM transactions
        WHERE date BETWEEN ? AND ?
          AND (counter_num = ? OR history LIKE ?)
        GROUP BY date
        ORDER BY date ASC
    `;

        const pieQuery = `
        SELECT sname AS service, COUNT(*) AS count
        FROM transactions
        WHERE date BETWEEN ? AND ?
          AND status = 'finished'
          AND (counter_num = ? OR history LIKE ?)
        GROUP BY sname
        ORDER BY count DESC
    `;

        const historyQuery = `
        SELECT
            id,
            sname,
            ticketservice AS service,
            ticketnum AS ticket,
            status,
            time,
            start_time,
            end_time,
            date,
            history
        FROM transactions
        WHERE date BETWEEN ? AND ?
          AND (counter_num = ? OR history LIKE ?)
        ORDER BY date DESC, COALESCE(start_time, time) DESC
        LIMIT 500
    `;

        db.all(chartQuery, reportParams, (chartErr, chartData) => {
            if (chartErr) {
                return res.status(500).json({ success: false, message: chartErr.message });
            }

            db.all(pieQuery, reportParams, (pieErr, pieData) => {
                if (pieErr) {
                    return res.status(500).json({ success: false, message: pieErr.message });
                }

                db.all(historyQuery, reportParams, (historyErr, historyRows) => {
                    if (historyErr) {
                        return res.status(500).json({ success: false, message: historyErr.message });
                    }

                    res.json({
                        success: true,
                        chartData: chartData || [],
                        pieData: pieData || [],
                        historyRows: historyRows || []
                    });
                });
            });
        });
    });

    router.use('/teller', requireRole('teller'));

    // =========================
    // & ACCOUNT logout
    // =========================
    router.post('/logout', (req, res) => {
        if (req.session.admin) req.session.admin = null;
        if (req.session.teller) req.session.teller = null;
        res.clearCookie('auth');
        res.json({ success: true });
    });

    // =========================
    // & Waiting Tickets
    // =========================
    router.get('/tickets/waiting', (req, res) => {
        const { date } = getPHDateTime();
        const sessionTeller = req.session?.teller;
        const tellerId = sessionTeller?.id || req.query.tellerId;
        const groupId = sessionTeller?.group_id || req.query.groupId;
        const serviceList = req.query.services || sessionTeller?.services;

        const services = serviceList
            ? serviceList
                .split(',')
                .map(s => s.trim().toUpperCase())
            : [];

        const queueConditions = [];
        const params = [];

        if (services.length > 0) {
            const placeholders = services.map(() => '?').join(',');
            queueConditions.push(`(t.status = 'pending' AND UPPER(t.sname) IN (${placeholders}))`);
            params.push(...services);
        }

        const receivedConditions = [];
        if (tellerId) {
            receivedConditions.push('ft.to_teller_id = ?');
            params.push(tellerId);
        }
        if (groupId) {
            receivedConditions.push('ft.to_group_id = ?');
            params.push(groupId);
        }
        if (receivedConditions.length > 0) {
            queueConditions.push(`(t.status = 'received' AND (${receivedConditions.join(' OR ')}))`);
        }

        if (queueConditions.length === 0) {
            return res.json([]);
        }

        const query = `
            SELECT t.*, s.shortSname, ft.note, ft.forwarded_at,
                   t_from.cname AS from_teller_name,
                   CASE WHEN t.status = 'received' THEN 1 ELSE 0 END AS isReceived
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            LEFT JOIN forwarded_tickets ft ON t.id = ft.ticket_id
            LEFT JOIN counters t_from ON ft.from_teller_id = t_from.id
            WHERE (${queueConditions.join(' OR ')})
              AND t.date = ?
            ORDER BY CASE
                       WHEN t.status = 'pending' AND t.priority = 1 THEN 1
                       WHEN t.status = 'received' AND t.priority = 1 THEN 2
                       WHEN t.status = 'received' THEN 3
                       ELSE 4
                     END,
                     t.time ASC
        `;

        params.push(date);

        db.all(query, params, (err, tickets) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json(tickets);
        });
    });

    // =========================
    // & Called Ticket
    // =========================
    router.get('/tickets/called', (req, res) => {
        const { date } = getPHDateTime();

        db.all(`SELECT t.*, s.shortSname
              FROM transactions t
              LEFT JOIN services s ON t.sname = s.sname
              WHERE (t.status = 'calling' OR t.status = 'called') AND t.date = ?
              ORDER BY t.start_time DESC
              LIMIT 16`,
            [date],
            (err, tickets) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json(tickets);
            });
    });

    // =========================
    // & Last Called Ticket
    // =========================
    router.get('/tickets/last_called', (req, res) => {
        const { date } = getPHDateTime();

        const sql = `
        SELECT t.sname, s.shortSname, t.ticketnum, t.ticketservice, t.date, t.status
        FROM transactions t
        LEFT JOIN services s ON t.sname = s.sname
        INNER JOIN (
            SELECT sname, MAX(start_time) AS last_called_at
            FROM transactions
            WHERE status IN ('calling', 'called', 'held', 'received', 'finished')
              AND date = ?
            GROUP BY sname
        ) latest
        ON t.sname = latest.sname
        AND t.start_time = latest.last_called_at
        ORDER BY t.sname
    `;
        const params = [date];
        db.all(sql, params, (err, tickets) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(tickets);
        });
    });

    // =========================
    // & Calling A Ticket
    // =========================
    router.post('/tickets/call', (req, res) => {
        const { date } = getPHDateTime();

        const { ticketId, tellerId, counterNumber, counter_group, counter_user, mode } = req.body;
        if (mode === 'auto') {
            // Get teller's services
            db.get('SELECT services, group_id FROM counters WHERE id = ?', [tellerId], (err, teller) => {
                if (err || !teller) {
                    return res.status(500).json({ error: 'Teller not found' });
                }

                const services = String(teller.services || '')
                    .split(',')
                    .map(s => s.trim().toUpperCase())
                    .filter(Boolean);

                const autoConditions = [];
                const params = [];
                if (services.length > 0) {
                    const placeholders = services.map(() => '?').join(',');
                    autoConditions.push(`(t.status = 'pending' AND UPPER(t.sname) IN (${placeholders}))`);
                    params.push(...services);
                }
                autoConditions.push(
                    `(t.status = 'received' AND (ft.to_teller_id = ? OR ft.to_group_id = ?))`
                );
                params.push(tellerId, teller.group_id, date);

                // Queue order: pending priority, received priority,
                // received regular, then pending regular.
                const query = `SELECT t.*, s.shortSname,
                                    CASE WHEN t.status = 'received' THEN 1 ELSE 0 END AS isReceived
                            FROM transactions t
                            LEFT JOIN services s ON t.sname = s.sname
                            LEFT JOIN forwarded_tickets ft ON t.id = ft.ticket_id
                            WHERE (${autoConditions.join(' OR ')})
                            AND t.date = ?
                            ORDER BY CASE
                                       WHEN t.status = 'pending' AND t.priority = 1 THEN 1
                                       WHEN t.status = 'received' AND t.priority = 1 THEN 2
                                       WHEN t.status = 'received' THEN 3
                                       ELSE 4
                                     END,
                                     t.time ASC
                            LIMIT 1`;

                db.get(query, params, (err, ticket) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }

                    if (!ticket) {
                        return res.json({ success: false, message: 'No tickets in queue' });
                    }
                    callTicket(ticket.id, tellerId, counterNumber, counter_group, counter_user, res);
                });
            });
        } else {
            callTicket(ticketId, tellerId, counterNumber, counter_group, counter_user, res);
        }
    });

    // ^ Function To call a ticket
    function callTicket(ticketId, tellerId, counterNumber, counter_group, counter_user, res) {
        const { date, time } = getPHDateTime();
        const finishEntry = `[${time}-${counter_user}-${counterNumber}-AutoFinished]`;
        console.log(tellerId)
        // Auto-complete previous ticket this teller was serving
        db.run(
            `
    UPDATE transactions
    SET status = 'finished',
        end_time = ?,
        history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
    WHERE teller_id = ?
      AND status IN ('calling', 'called')
      AND date = ?
    `,
            [time, finishEntry, finishEntry, tellerId, date],
            function (err) {
                if (err) {
                    console.error('Error auto-completing previous ticket:', err);
                } else if (this.changes > 0) {
                    io.emit('ticket_completed');
                }
                const startEntry = `[${time}-${counter_user}-${counterNumber}-Called]`;

                // Now call the new ticket
                db.run(
                    `
        UPDATE transactions
        SET status = 'calling',
            teller_id = ?,
            counter_num = ?,
            start_time = ?,
            end_time = NULL,
            counter_user = ?,
            counter_group = ?,
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
        WHERE id = ?
          AND date = ?
        `,
                    [tellerId, counterNumber, time, counter_user, counter_group, startEntry, startEntry, ticketId, date],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to call ticket' });
                        }

                        if (this.changes === 0) {
                            return res.status(404).json({ error: 'Ticket not found or not today' });
                        }
                        triggerSMS('call', ticketId, counterNumber);
                        io.emit("calledticketsArrived");
                        db.get(
                            `
            SELECT t.*, s.shortSname
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            WHERE t.id = ?
              AND t.date = ?
            `,
                            [ticketId, date],
                            (err, ticket) => {
                                if (err || !ticket) {
                                    return res.status(500).json({ error: 'Ticket not found' });
                                }

                                io.emit('ticket_called');
                                res.json({ success: true, ticket });
                                triggerNearlyCalledSMS(ticket, counterNumber);
                            }
                        );
                    }
                );
            }
        );
    }

    // =========================
    // & Recall A Ticket
    // =========================
    router.post('/tickets/recall', (req, res) => {
        const { ticketId, cname, cnum } = req.body;
        const { date, time } = getPHDateTime();
        const recallEntry = `[${time}-${cname}-${cnum}-Recalled]`;

        db.run(`
            UPDATE transactions 
            SET status = 'calling',
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
            WHERE id = ?
            AND date = ?
        `,
            [recallEntry, recallEntry, ticketId, date],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to recall ticket' });
                }
                db.get(
                    `
                        SELECT t.*, s.shortSname
                        FROM transactions t
                        LEFT JOIN services s ON t.sname = s.sname
                        WHERE t.id = ?
                        AND t.date = ?
                        `,
                    [ticketId, date],
                    (err, ticket) => {
                        if (err || !ticket) {
                            return res.status(500).json({ error: 'Ticket not found' });
                        }
                        io.emit('calledticketsArrived');
                        io.emit('ticket_called');
                        res.json({ success: true, ticket });
                    }
                );
            });
    });

    // =========================
    // & Resume Ticket
    // =========================
    router.post('/tickets/resume', (req, res) => {
        const { ticketId, tellerId, counterNumber, counter_group, counter_user } = req.body;
        callTicket(ticketId, tellerId, counterNumber, counter_group, counter_user, res);
    });

    // =========================
    // & Hold A Ticket
    // =========================
    router.post('/tickets/hold', (req, res) => {
        const { ticketId, cname, cnum } = req.body;
        const { date, time } = getPHDateTime();
        const heldEntry = `[${time}-${cname}-${cnum}-Held]`;

        db.run(`
        UPDATE transactions 
        SET status = 'held',
            end_time = ?,
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
        WHERE id = ?
          AND date = ?
    `,
            [time, heldEntry, heldEntry, ticketId, date],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to hold ticket' });
                }
                triggerSMS('hold', ticketId);
                io.emit('ticket_held');
                res.json({ success: true });
            });
    });

    // =========================
    // & Held Tickets
    // =========================
    router.get('/tickets/held', (req, res) => {
        const { tellerId } = req.query;
        const { date } = getPHDateTime();

        db.all(`SELECT t.*, s.shortSname
            FROM transactions t
            LEFT JOIN services s ON t.sname = s.sname
            WHERE t.status = 'held' AND t.counter_num = ? AND t.date = ?
            ORDER BY t.start_time ASC`,
            [tellerId, date],
            (err, tickets) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json(tickets);
            });
    });

    // =========================
    // & Void A ticket
    // =========================
    router.post('/tickets/void', (req, res) => {
        const { ticketId, reason, notes, cname, cnum } = req.body;
        const voidReason = notes ? `${reason}: ${notes}` : reason;
        const { date, time } = getPHDateTime();
        const voidEntry = `[${time}-${cname}-${cnum}-Voided]`;

        db.run(`
        UPDATE transactions 
        SET status = 'voided',
            void_reason = ?,
            end_time = ?,
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
        WHERE id = ?
          AND date = ?
    `,
            [voidReason, time, voidEntry, voidEntry, ticketId, date],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to void ticket' });
                }

                triggerSMS('void', ticketId);
                io.emit('ticket_voided');
                res.json({ success: true });
            });
    });

    // =========================
    // & Forward A ticket
    // =========================
    router.post('/tickets/forward', (req, res) => {
        const { ticketId, fromTellerId, toTellerId, toGroupId, note, cname, cnum } = req.body;
        const { date, time } = getPHDateTime();
        const forwardEntry = `[${time}-${cname}-${cnum}-Forwarded]`;

        // Update ticket status
        db.run(`UPDATE transactions 
            SET status = 'received', forwarded_from = ?, forwarded_to = ?, end_time = ?, history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
            WHERE id = ? AND date = ?`,
            [fromTellerId, toTellerId || toGroupId, time, forwardEntry, forwardEntry, ticketId, date],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to forward ticket' });
                }
                triggerSMS('forward', ticketId, toTellerId || toGroupId);
                db.get(
                    `SELECT id FROM forwarded_tickets WHERE ticket_id = ?`,
                    [ticketId],
                    (err, row) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: 'DB error' });
                        }

                        if (row) {
                            // UPDATE
                            db.run(`
                        UPDATE forwarded_tickets
                        SET from_teller_id = ?,
                            to_teller_id = ?,
                            to_group_id = ?,
                            note = ?,
                            forwarded_at = ?
                        WHERE ticket_id = ?
                    `,
                                [fromTellerId, toTellerId, toGroupId, note, date, ticketId]);
                        } else {
                            // INSERT
                            db.run(`
                        INSERT INTO forwarded_tickets
                        (ticket_id, from_teller_id, to_teller_id, to_group_id, note, forwarded_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `,
                                [ticketId, fromTellerId, toTellerId, toGroupId, note, date]);
                        }

                        db.get(`SELECT t.*, s.shortSname
                            FROM transactions t
                            LEFT JOIN services s ON t.sname = s.sname
                            WHERE t.id = ? AND t.date = ?`, [ticketId, date], (err, ticket) => {
                            if (err || !ticket) {
                                return res.status(500).json({ error: 'Ticket not found' });
                            }
                            io.emit("calledticketsArrived");
                            io.emit('ticket_forwarded', {
                                ticket: ticket,
                                toTellerId: toTellerId,
                                toGroupId: toGroupId,
                                note: note
                            });
                            res.json({ success: true });
                        });
                    });
            });
    });

    // =========================
    // & Forwarded Tickets
    // =========================
    router.get('/tickets/forwarded', (req, res) => {
        const { tellerId, groupId } = req.query;
        const { date } = getPHDateTime();

        let query = `SELECT t.*, s.shortSname, ft.note, ft.forwarded_at,
                t_from.cname as from_teller_name
                FROM transactions t
                JOIN forwarded_tickets ft ON t.id = ft.ticket_id
                LEFT JOIN services s ON t.sname = s.sname
                LEFT JOIN counters t_from ON ft.from_teller_id = t_from.id
                WHERE t.status = 'received' AND (`;

        let params = [];
        let conditions = [];

        if (tellerId) {
            conditions.push('ft.to_teller_id = ?');
            params.push(tellerId);
        }

        if (groupId) {
            conditions.push('ft.to_group_id = ?');
            params.push(groupId);
        }

        query += conditions.join(' OR ') + ') AND t.date = ? ORDER BY ft.forwarded_at DESC';

        params.push(date);

        db.all(query, params, (err, tickets) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(tickets);
        });
    });

    // =========================
    // & Tellers List
    // =========================
    router.get('/tellers/list', (req, res) => {
        const { id } = req.query;

        let query = 'SELECT id, cname, cnum,group_name, group_id FROM counters WHERE id != ?';
        let params = [id];

        db.all(query, params, (err, tellers) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(tellers);
        });
    });

    //   ! -------- GROUPS -------- !
    // =========================
    // & Complete A Ticket
    // =========================
    router.post('/tickets/complete', (req, res) => {
        const { ticketId, cname, cnum } = req.body;
        const { date, time } = getPHDateTime();
        const finishEntry = `[${time}-${cname}-${cnum}-AutoFinished]`;

        db.run(`
        UPDATE transactions 
        SET status = 'finished',
            end_time = ?,
            history = CASE
              WHEN history IS NULL OR history = '' THEN ?
              ELSE history || ';' || ?
            END
        WHERE id = ?
          AND date = ?
    `,
            [time, finishEntry, finishEntry, ticketId, date],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to complete ticket' });
                }

                triggerSMS('finish', ticketId);
                io.emit('ticket_completed', { id: ticketId });
                res.json({ success: true });
            });
    });

    // =========================
    // & Ticket History
    // =========================
    router.get('/tickets/history', (req, res) => {
        const { counterNumber, cname, limit } = req.query;
        const queryLimit = Number(limit) || 20;
        const { date } = getPHDateTime();

        let query = `
        SELECT t.*, s.shortSname
        FROM transactions t
        LEFT JOIN services s ON t.sname = s.sname
        WHERE t.date = ?
    `;

        let params = [date];

        if (counterNumber) {
            query += ` AND t.history LIKE ?`;
            params.push(`%-${cname}-%`);
        }

        query += ` ORDER BY t.start_time DESC LIMIT ?`;
        params.push(queryLimit);

        db.all(query, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
    });

    return router;
};
