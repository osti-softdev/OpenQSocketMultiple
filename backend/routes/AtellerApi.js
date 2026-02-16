// tellerApi.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');

module.exports = function createTellerApiRouter(io) {
    const router = express.Router();

    const rootpath = global.BACKEND_PATH || __dirname;
    const db = require(path.join(rootpath, 'utilities/db'));

    // =========================
  // & Account login
  // =========================
    router.post('/login', (req, res) => {
        const { counterNumber, username, password } = req.body;

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
                    // ⚠️ IMPORTANT: Use bcrypt in production
                    // const passwordMatch = bcrypt.compareSync(password, teller.password);

                    if (password === teller.cpass) {
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
                  username: req.session.teller.cname,
                  counter_number: req.session.teller.cnum,
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

    return router;
};