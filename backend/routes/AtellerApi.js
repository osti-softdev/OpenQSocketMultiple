// tellerApi.js
const express = require('express');
const path = require('path');
const session = require('express-session'); // ← new
const bcrypt = require('bcrypt');

module.exports = function createTellerApiRouter(io) {
    const router = express.Router();

    const rootpath = global.BACKEND_PATH || __dirname;
    const db = require(path.join(rootpath, 'utilities/db'));

    // Helper: validate credentials → return user or null
    async function validateLogin(cnum, cuser, cpass) {
        try {
            const query = `
                SELECT id, cname, cnum, cuser, cstatus, group_name
                FROM counters 
                WHERE cnum = ? 
                  AND cuser = ? 
                  AND cpass = ? 
                  AND cstatus = 1
                LIMIT 1
            `;

            const rows = await db.allAsync(query, [cnum, cuser, cpass]);

            console.log(`Login attempt ${cnum}/${cuser} → found ${rows.length}`);

            if (rows.length === 0) return null;

            const user = rows[0];
            delete user.cpass; // never send password
            return user;
        } catch (err) {
            console.error("Login DB error:", err.message);
            return null;
        }
    }

    // ─── POST /trialAttempLogin ────────────────────────────────────────
    router.post("/trialAttempLogin", async (req, res) => {
        try {
            const { cnum, cuser, cpass } = req.body;

            if (!cnum || !cuser || !cpass) {
                return res.status(400).json({
                    success: false,
                    error: "Missing counter, username or password"
                });
            }

            const user = await validateLogin(cnum, cuser, cpass);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid counter number, username or password"
                });
            }

            // Store user in session
            req.session.teller = {
                id: user.id,
                cname: user.cname,
                cnum: user.cnum,
                cuser: user.cuser,
                group_name: user.group_name,
                role: "teller",
                loggedIn: true
            };

            console.log(`Login success: ${user.cname} (${user.cnum})`);

            return res.json({
                success: true,
                user: req.session.teller   // sanitized, no password
            });

        } catch (err) {
            console.error("Login route error:", err);
            return res.status(500).json({
                success: false,
                error: "Server error - please try again later"
            });
        }
    });

    // ─── GET /check-login (optional - for dashboard to verify) ──────────
    router.get("/check-login", (req, res) => {
        if (req.session.teller?.loggedIn) {
            return res.json({
                success: true,
                user: req.session.teller
            });
        }
        return res.status(401).json({
            success: false,
            error: "Not logged in"
        });
    });

    // ─── POST /logout ──────────────────────────────────────────────────
    router.post("/logout", (req, res) => {
        if (req.session.teller) {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Logout destroy error:", err);
                    return res.status(500).json({ success: false, error: "Logout failed" });
                }
                return res.json({ success: true });
            });
        } else {
            return res.json({ success: true }); // already logged out
        }
    });

    return router;
};