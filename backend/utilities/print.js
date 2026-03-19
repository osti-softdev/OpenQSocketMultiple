const escpos = require('escpos');
escpos.USB = require('escpos-usb');
const Jimp = require('jimp');

class PrinterService {
  constructor() {
    this.device = null;
    this.printer = null;
    this.isConnected = false;
    this.queue = [];
    this.isPrinting = false;
    this.logo = null;

    this.VENDOR_EPSON = 0x04b8;

    this.init();
  }

  async init() {
    await this.loadLogo();
    this.startMonitoring();
  }

  async loadLogo() {
    try {
      const image = await Jimp.read('logo.png');
      image.resize(300, Jimp.AUTO).grayscale().contrast(1);
      this.logo = await escpos.Image.load(image.bitmap);
      console.log('Logo loaded');
    } catch (err) {
      console.log('Logo not found or failed to load');
    }
  }

  findPrinter() {
    const devices = escpos.USB.findPrinter();

    if (!devices || devices.length === 0) return null;

    // Prefer Epson
    const epson = devices.find(d => d.vendorId === this.VENDOR_EPSON);
    return epson || devices[0];
  }

  connect() {
    const deviceInfo = this.findPrinter();

    if (!deviceInfo) {
      this.isConnected = false;
      return;
    }

    this.device = new escpos.USB(deviceInfo.vendorId, deviceInfo.productId);
    this.printer = new escpos.Printer(this.device);

    this.device.open((err) => {
      if (err) {
        console.error('Printer connection failed:', err);
        this.isConnected = false;
        return;
      }

      console.log('Printer connected');
      this.isConnected = true;
      this.processQueue();
    });
  }

  startMonitoring() {
    setInterval(() => {
      if (!this.isConnected) {
        console.log('Checking for printer...');
        this.connect();
      }
    }, 3000);
  }

  addToQueue(data) {
    this.queue.push(data);
    this.processQueue();
  }

  async processQueue() {
    if (!this.isConnected || this.isPrinting || this.queue.length === 0) return;

    this.isPrinting = true;

    const job = this.queue.shift();

    try {
      await this.print(job);
    } catch (err) {
      console.error('Print error:', err);
      this.isConnected = false;
      this.queue.unshift(job); // retry later
    }

    this.isPrinting = false;

    // Process next job
    setTimeout(() => this.processQueue(), 500);
  }

  async print({ queueNumber, message }) {
    return new Promise((resolve, reject) => {
      this.device.open((err) => {
        if (err) return reject(err);

        try {
          if (this.logo) {
            this.printer.align('CT').raster(this.logo).feed(1);
          }

          this.printer
            .align('CT')
            .style('B')
            .size(2, 2)
            .text(`QUEUE #${queueNumber}`)
            .feed(1)
            .size(1, 1)
            .text(message || 'Please wait...')
            .feed(2)
            .cut()
            .close();

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

module.exports = new PrinterService();


// USAGE 
const express = require('express');
const printer = require('./printerService');

const app = express();
app.use(express.json());

app.post('/print', (req, res) => {
  const { queueNumber } = req.body;

  printer.addToQueue({
    queueNumber,
    message: 'Please wait...'
  });

  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});