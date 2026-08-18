const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../services/admin/adminlogin");
const { setNoCacheHeaders } = require("../security/security");

function requireAuth(req, res, next) {
    const token = req.cookies?.auth;
    if (!token) return res.redirect("/312Xadmin");
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch {
      return res.redirect("/312Xadmin");
    }
}

function setupMainRoutes(appExpress, rootpath) {
    appExpress.get("/312Xadmin", (req, res) => {
        setNoCacheHeaders(res);
        res.clearCookie("auth", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
        });
        res.sendFile(path.join(rootpath, "public/html/login.html"));
    });

    appExpress.get("/312xdashboard", requireAuth, (req, res) => {
        res.sendFile(path.join(rootpath, "public/html/admin.html"));
    });

    appExpress.get("/whoami", requireAuth, (req, res) => {
        res.json(req.user);
    });

    // Unified Application Routes
    appExpress.get("/kiosk", (req, res) => {
        setNoCacheHeaders(res);
        res.sendFile(path.join(rootpath, "public/html/kiosk.html"));
    });

    appExpress.get("/312Xtellerlogin", (req, res) => {
        setNoCacheHeaders(res);
        res.sendFile(path.join(rootpath, "public/html/webtellerlogin.html"));
    });

    appExpress.get("/312XtellerWindow", (req, res) => {
        setNoCacheHeaders(res);
        res.sendFile(path.join(rootpath, "public/html/webteller.html"));
    });

    appExpress.get("/test", (req, res) => {
        setNoCacheHeaders(res);
        res.sendFile(path.join(rootpath, "public/html/test.html"));
    });

    appExpress.get("/main", (req, res) => {
        setNoCacheHeaders(res);
        res.sendFile(path.join(rootpath, "public/html/index.html"));
    });

    appExpress.get("/booticons", (req, res) => {
        res.sendFile(path.join(rootpath, "public/html/icon.html"));
    });

    appExpress.get("/", (req, res) => {
        res.redirect("/main");
    });

    appExpress.post("/setAuthCookie", express.json(), (req, res) => {
        const { token } = req.body;
        res.cookie("auth", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 3600000, // 1 hour
        });
        res.sendStatus(200);
    });

    appExpress.post("/logout", (req, res) => {
        res.clearCookie("auth");
        res.sendStatus(200);
    });
}

module.exports = { setupMainRoutes };
