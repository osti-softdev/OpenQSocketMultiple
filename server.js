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

appExpress.set('trust proxy', 1);
const rootpath = path.join(__dirname);
const MainRootpath = path.join(rootpath);
const BackEndPath = path.join(rootpath, `${tagline}backend`);
global.ROOT_PATH = MainRootpath;
global.BACKEND_PATH = BackEndPath;

// ===== Local Modules =====
const { setupLogger } = require("./backend/utilities/logger");
setupLogger();

// Rate Limiter (Applied strictly to API routes so static assets load freely)
const { apiLimiter } = require("./backend/utilities/rateLimiter");
appExpress.use('/api', apiLimiter);

require('./backend/utilities/db');

// ^ create Server
const { serverCreator } = require("./backend/utilities/serverCreator");
serverCreator(server);

appExpress.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}));
appExpress.use(express.json({ limit: '50mb' }));
appExpress.use(cookieParser());
appExpress.use(express.urlencoded({ limit: '50mb', extended: true }));
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
appExpress.use((req, res, next) => {
    const protectedHtml = ['/html/caller.html'];
    if (protectedHtml.includes(req.path) && !req.session?.teller) {
        return res.redirect('/312Xtellerlogin');
    }

    if (req.path === '/html/admin.html') {
        const role = String(req.session?.admin?.role || '').trim().toLowerCase();
        if (!['user', 'admin', 'superadmin'].includes(role)) return res.redirect('/admin');
    }

    express.static(path.join(rootpath, 'public'))(req, res, next);
});

appExpress.use('/ads', express.static(path.join(__dirname, 'public/ads'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
        }
    }
}));

appExpress.use('/', require('./backend/routes/pages'));
appExpress.use('/api', require('./backend/routes/AkioskApi')(io));
appExpress.use('/api', require('./backend/routes/AdisplayApi')(io));
appExpress.use('/api', require('./backend/routes/AtellerApi')(io));
appExpress.use('/api', require('./backend/routes/AadminApi')(io));
appExpress.use('/api', require('./backend/routes/AonlineKioskApi')(io));


// ^ Video API
const { setupAds } = require("./backend/routes/getads");
const setupAdsSchedulingApi = require("./backend/routes/adsScheduling");

const adsModule = setupAds(io);

// --- Setup videos API (upload/rename/delete) ---
require("./backend/routes/videos")(appExpress, adsModule);

// --- Setup playlists/schedules API (mounts /api/ads/*) ---
setupAdsSchedulingApi(appExpress, adsModule);

// --- Initialize GSM Modem ---
if (process.env.ALLOWSMS === 'true') {
    const { initializeGSM } = require('./backend/utilities/smsService');
    initializeGSM(io);
}