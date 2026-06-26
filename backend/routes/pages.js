const express = require('express');
const path = require('path');
const rootpath = global.ROOT_PATH;
const pageRouter = express.Router();
const jwt = require("jsonwebtoken");
const { loadConfig } = require(`${rootpath}/backend/utilities/envconfig`);
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

  pageRouter.get("/kiosk", (req, res) => {
    res.sendFile(path.join(rootpath, "public/html","kiosk.html"));
  });
  pageRouter.get("/312Xtellerlogin", (req, res) => {
    res.sendFile(path.join(rootpath, "public/html","caller.html"));
  });

  pageRouter.get("/booticons", (req, res) => {
    res.sendFile(path.join(rootpath, 'public/html',"icon.html"));
  });

  pageRouter.get('/admin', (req, res) => {
    res.sendFile(path.join(rootpath, 'public/html', 'admin_login.html'));
  });
  pageRouter.get('/admin/dashboard',  (req, res) => {
    res.sendFile(path.join(rootpath, 'public/html', 'admin.html'));
  });
  pageRouter.get("/312xdashboard", requireAuth, (req, res) => {
    res.sendFile(path.join(rootpath, "public/html","admin.html"));
  });
  pageRouter.get("/display", (req, res) => {
    res.sendFile(path.join(rootpath, "public/html","index.html"));
  });
  pageRouter.get("/", (req, res) => {
    res.redirect("/display");
  });

 pageRouter.get("/onlinekiosk", (req, res) => {
    const config = loadConfig(); // 👈 reload every request

    if (config?.MainServer?.ticketonline) {
      return res.sendFile(path.join(rootpath, "public/html", "onlinekiosk.html"));
    } else {
      return res.sendFile(path.join(rootpath, "public/html", "maintenance.html"));
    }
  });


  pageRouter.post("/setAuthCookie", express.json(), (req, res) => {
    const { token } = req.body;
    res.cookie("auth", token, {
      httpOnly: true,
      secure: false, // true only if HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 3600000, // 1 hour
    });
    res.sendStatus(200);
  });

  

module.exports = pageRouter;
