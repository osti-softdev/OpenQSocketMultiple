// tellerApi.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { requireRole  } = require('../utilities/authsession');
const { authLimiter } = require("../utilities/rateLimiter");
module.exports = function createTellerApiRouter(io) {
    const router = express.Router();

    router.use('/teller', requireRole('teller'));
    const rootpath = global.BACKEND_PATH || __dirname;
    const db = require(path.join(rootpath, 'utilities/db'));
    const { getPHDateTime } = require(path.join(rootpath, 'utilities/datetime'));

    // =========================
  // & Account login
  // =========================
  router.post('/login', authLimiter, (req, res) => {
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
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }

            console.log('User found, verifying password...');

            try {
                if (password === teller.cpass) {
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

  router.get('/check-session', (req, res) => {
        if (req.session.teller) {
            res.json({
                loggedIn: true,
                teller: {
                    id: req.session.teller.id,
                    username: req.session.teller.username,
                    counter_number: req.session.teller.counter_number,
                    services: req.session.teller.services,
                    group_name: req.session.teller.group_name,
                    group_id: req.session.teller.group_id,
                }
            });
        } else {
            res.json({ loggedIn: false });
        }
  });

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

        const services = req.query.services
            ? req.query.services
                .split(',')
                .map(s => s.trim().toUpperCase())
            : [];

        if (services.length === 0) {
            return res.json([]);
        }

        const placeholders = services.map(() => '?').join(',');

        const query = `
            SELECT *
            FROM transactions
            WHERE status = 'pending'
            AND UPPER(sname) IN (${placeholders})
            AND date = ?
            ORDER BY time ASC
        `;

        const params = [...services, date];

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

      db.all(`SELECT * FROM transactions 
              WHERE (status = 'calling' OR status = 'called') AND date = ?
              ORDER BY start_time DESC 
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
        SELECT t.sname, t.ticketnum, ticketservice, t.date, t.status
        FROM transactions t
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
          db.get('SELECT services FROM counters WHERE id = ?', [tellerId], (err, teller) => {
              if (err || !teller) {
                  return res.status(500).json({ error: 'Teller not found' });
              }

                 const services = teller.services
                    .split(',')
                    .map(s => s.trim().toUpperCase());


                const placeholders = services.map(() => '?').join(',');

              // Get next ticket (priority first, then regular)
              const query = `SELECT * FROM transactions 
                            WHERE status = 'pending' 
                            AND UPPER(sname) IN (${placeholders})
                            AND date = ?
                            ORDER BY priority DESC 
                            LIMIT 1`;

              const params = [...services, date];
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
          callTicket(ticketId, tellerId, counterNumber, counter_group, counter_user,  res);
      }
  });

  // ^ Function To call a ticket
  function callTicket(ticketId, tellerId, counterNumber, counter_group, counter_user,  res) {
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
      AND status = 'calling'
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
          io.emit("calledticketsArrived");
          db.get(
            `
            SELECT *
            FROM transactions
            WHERE id = ?
              AND date = ?
            `,
            [ticketId, date],
            (err, ticket) => {
              if (err || !ticket) {
                return res.status(500).json({ error: 'Ticket not found' });
              }

              io.emit('ticket_called');
              res.json({ success: true, ticket });
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
        [recallEntry, recallEntry,ticketId, date],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to recall ticket' });
            }
                    db.get(
                        `
                        SELECT *
                        FROM transactions
                        WHERE id = ?
                        AND date = ?
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
    const { ticketId,tellerId, counterNumber, counter_group, counter_user } = req.body;
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

    db.all(`SELECT * FROM transactions 
            WHERE status = 'held' AND counter_num = ? AND date = ?
            ORDER BY start_time ASC`,
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

                    db.get('SELECT * FROM transactions WHERE id = ? AND date = ?', [ticketId, date], (err, ticket) => {
                        if (err || !ticket) {
                            return res.status(500).json({ error: 'Ticket not found' });
                        }
                        io.emit("calledticketsArrived");
                        io.emit('ticket_forwarded', {
                            ticket: ticket,
                            toTellerId: toTellerId,
                            toGroupId: toGroupId,
                            note:note
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

    let query = `SELECT t.*, ft.note, ft.forwarded_at, 
                t_from.cname as from_teller_name
                FROM transactions t
                JOIN forwarded_tickets ft ON t.id = ft.ticket_id
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

    query += conditions.join(' OR ') + ') AND date = ? ORDER BY ft.forwarded_at DESC';

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
    [time,finishEntry, finishEntry, ticketId, date],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to complete ticket' });
            }

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
        SELECT *
        FROM transactions
        WHERE date = ?
    `;

    let params = [date];

    if (counterNumber) {
        query += ` AND history LIKE ?`;
        params.push(`%-${cname}-%`);
    }

    query += ` ORDER BY start_time DESC LIMIT ?`;
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