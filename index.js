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
    secret: 'asdasdasd-weqweqewe-cdvfretvert-asdrace323c23-c234234cf3324234-2026asds',   // change this!
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


// ^ Video API
const { setupAds } = require("./backend/routes/getads");
const adsModule = setupAds(io);

// --- Setup videos API ---
require("./backend/routes/videos")(appExpress, adsModule);

// const { test, setupAds, initialize: initAdsManager } = require("./reso/node/getads");
// const { handleGetAllServices } = require("./reso/node/getallservices");
// const {
//   setupServicesDisplayWatcher,
// } = require("./reso/node/servicesDisplayWatcher");
// const { setupFooterWatcher } = require("./reso/node/footerwatcher");
// const { setupdisplaycolorwatcher } = require("./reso/node/colorwatcher");
// const {
//   setupFooterWatcheradmin,
// } = require("./reso/node/admin/footerwatcheradmin");
// const {
//   setupColorWatcheradmin,
// } = require("./reso/node/admin/colorswatcheradmin");
// const {
//   setupAdminTeller,
// } = require("./reso/node/admin/adminsettingsteller");
// const {
//   setupCalledTicketsWatcher,
// } = require("./reso/node/calledTicketsWatcher");
// const {
//   adminoveralldatawatcher,
// } = require("./reso/node/admin/adminDashboardData");
// const {
//   admincontent3chartsdata,
// } = require("./reso/node/admin/adminDashboardcontent3chartsdata");
// const {
//   admincontent2averages,
// } = require("./reso/node/admin/adminDashboardcontent2averages");
// const {
//   admincontent4alldata,
// } = require("./reso/node/admin/adminDashboardcontent4");
// const {
//   admincontentSaveChartImage,
// } = require("./reso/node/admin/adminSaveChartImage");
// const {
//   settupsettingsservices,
// } = require("./reso/node/admin/adminsettingservices");
// const {
//   initializeWindowedKiosk,
// } = require("./reso/node/kiosk/kiosk");
// const {
//   setupLoginSocket,
//   JWT_SECRET,
// } = require("./reso/node/admin/adminlogin");
// const {
//   setupLoginSocketteller,
// } = require("./reso/node/teller/tellerlogin");
// const {
//   settupsettingsaccounts,
// } = require("./reso/node/admin/adminsettingsaccounts");
// const {
//   setupsystemconfigurations,
// } = require("./reso/node/admin/adminsettingssystem");
// const {
//   setupSoundSettingsAdmin,
// } = require("./reso/node/admin/adminvoiceandvolume");
// const { setupTellerWatcher } = require("./reso/node/teller/tellerserviceswatcher");

// MULTERS
// const setupVideosApi = require("./reso/node/expressAPI/videos");
// const setupImagesApi = require("./reso/node/expressAPI/images");




// FIX: Add error handling for Socket.IO connection

    // settupsettingsaccounts(socket, io);
    // admincontent3chartsdata(socket, io);
    // admincontent2averages(socket, io);
    // admincontent4alldata(socket, io);
    // adminoveralldatawatcher(socket, io);
    // setupFooterWatcheradmin(socket, io);
    // setupColorWatcheradmin(socket, io);
    // setupAdminTeller(socket, io);
    // setupAds(socket, io);
    // setupFooterWatcher(socket, io);
    // setupdisplaycolorwatcher(socket, io);
    // handleGetAllServices(socket);
    // setupServicesDisplayWatcher(socket, io);
    // setupSoundSettingsAdmin(socket, io);
    // admincontentSaveChartImage(socket, io);
    // settupsettingsservices(socket, io);
    // setupLoginSocket(socket, io);
    
      // setupLoginSocketteller(socket);
      // setupTellerWatcher(socket, io);
      // initializeWindowedKiosk(socket, io);
      // setupCalledTicketsWatcher(socket, io, "WINDOWED_APPLICATION");
