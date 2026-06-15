const express = require('express');
const path = require('path');
const fs = require("fs");
const { kioskLimiter } = require("../utilities/rateLimiter");

module.exports = function createKioskApiRouter(io) {
  const router = express.Router();
  const rootpath = global.BACKEND_PATH;
  const db = require(path.join(rootpath, 'utilities/db'));
  const { getPHDateTime } = require(path.join(rootpath, 'utilities/datetime'));

  return router;
}