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
                            group_name: teller.group_name
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
      req.session.destroy();
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
        SELECT t.sname, t.ticketnum, t.date, t.status
        FROM transactions t
        INNER JOIN (
            SELECT sname, MAX(start_time) AS last_called_at
            FROM transactions
            WHERE status IN ('calling', 'held', 'received', 'finished')
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
    console.table(req.body)
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
                  console.table(ticket)
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
    WHERE counter_num = ?
      AND status = 'calling'
      AND date = ?
    `,
    [time, finishEntry, finishEntry,counterNumber, date],
    function (err) {
      if (err) {
        console.error('Error auto-completing previous ticket:', err);
      } else if (this.changes > 0) {
        io.emit('ticket_completed', { tellerId });
      }
    const startEntry = `[${time}-${counter_user}-${counterNumber}-Called]`;

      // Now call the new ticket
      db.run(
        `
        UPDATE transactions
        SET status = 'calling',
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
        [counterNumber, time, counter_user, counter_group, startEntry, startEntry, ticketId, date],
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

              io.emit('ticket_called', ticket);
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

                io.emit('calledticketsArrived');
                res.json({ success: true });
        });
    });

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


    return router;
};