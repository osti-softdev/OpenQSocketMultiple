let tagline = "../../";
tagline = "./";	// comment this on deployment

// ===== Core & Built-in =====
const path = require("path");
// ===== Express & Socket.IO =====
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require('express-session');
const appExpress = express();
const server = http.createServer(appExpress);
const io = socketIo(server);


const rootpath = path.join(__dirname);
const MainRootpath = path.join(rootpath);
const BackEndPath = path.join(rootpath, `${tagline}backend`);
global.ROOT_PATH = MainRootpath;
global.BACKEND_PATH = BackEndPath;

// ===== Local Modules =====
const { setupLogger } = require("./backend/utilities/logger");
setupLogger();

// Rate Limiter
const { apiLimiter } = require("./backend/utilities/rateLimiter");
appExpress.use(apiLimiter);

require('./backend/utilities/db');

// ^ create Server
const { serverCreator } = require("./backend/utilities/serverCreator");
serverCreator(server);

appExpress.use(cors());
appExpress.use(express.json());
appExpress.use(cookieParser());
appExpress.use(express.urlencoded({ extended: true }));
appExpress.use((req, res, next) => {
    express.static(path.join(rootpath, 'public'))(req, res, next);
});
appExpress.use('/ads', express.static(path.join(__dirname, 'public/ads'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    }
  }
}));

appExpress.use(session({
    secret: 'asdasdasd-wejjks9qweqewe-cdvfretvert-asdrace323c23-c234234cf3324234-2026asds',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,          // prevents JS access
        secure: false,           // ← set true in production + HTTPS
        maxAge: 1000 * 60 * 60,  // 1 hour
        sameSite: 'strict'
    }
}));

appExpress.use('/', require('./backend/routes/pages'));
appExpress.use('/api', require('./backend/routes/AkioskApi')(io));
appExpress.use('/api', require('./backend/routes/AdisplayApi')(io));
appExpress.use('/api', require('./backend/routes/AtellerApi')(io));
appExpress.use('/api', require('./backend/routes/AadminApi')(io));


// ^ Video API
const { setupAds } = require("./backend/routes/getads");
const adsModule = setupAds(io);

// --- Setup videos API ---
require("./backend/routes/videos")(appExpress, adsModule);