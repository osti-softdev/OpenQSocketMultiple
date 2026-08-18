const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const appExpress = express();
const server = http.createServer(appExpress);
const io = socketIo(server, {
  connectTimeout: 5000,
});

module.exports = { appExpress, server, io };
