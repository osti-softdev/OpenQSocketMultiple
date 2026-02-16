const express = require('express');
const path = require('path');
const rootpath = global.ROOT_PATH;
const pageRouter = express.Router();
const jwt = require("jsonwebtoken");

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
    res.sendFile(path.join(rootpath, "public/html","webtellerlogin.html"));
  });
  pageRouter.get("/312XtellerWindow", (req, res) => {
    res.sendFile(path.join(rootpath, "public/html","webteller.html"));
  });
  pageRouter.get("/312Xadmin", (req, res) => {
    res.clearCookie("auth", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
    });
    res.sendFile(path.join(rootpath, "public/html","login.html"));
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

  pageRouter.post("/logout", (req, res) => {
    res.clearCookie("auth");
    res.sendStatus(200);
  });

module.exports = pageRouter;
