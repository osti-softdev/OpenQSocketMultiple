const { SerialPort } = require("serialport");

const PORT = "COM9"; // Change if needed
const BAUD = 115200;
const TARGET = "+639988166518";

// Create a long message (~500 chars)
const MESSAGE = "Globe Prepaid Unli Data Guide: Buy SIM (₱40) at stores/7-Eleven. Insert, restart phone. Dial *143# to register (need ID). Load ₱50+ via GCash, Maya, or app. Text promo to 8080: GO50 (5GB + unli texts, 3days, ₱50); GO99 (16GB + unli texts, 7days, ₱99); SUPERSURF200 (unli data, 5days, ₱200). Check balance: *143#. Use GlobeOne app for free 1GB daily. 5G needs compatible phone & coverage. Fair use applies.".repeat(1);

const SMS_LENGTH = 160; // Max chars per SMS in text mode
const port = new SerialPort({ path: PORT, baudRate: BAUD, autoOpen: false });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

port.on("data", (data) => {
  process.stdout.write("📥 " + data.toString());
});

// Split message into chunks
function chunkMessage(msg, size) {
  const chunks = [];
  let i = 0;
  while (i < msg.length) {
    chunks.push(msg.substring(i, i + size));
    i += size;
  }
  return chunks;
}

async function sendSMS() {
  console.log(`🚀 Opening ${PORT} at ${BAUD}...`);
  port.open(async (err) => {
    if (err) return console.error("❌ Cannot open port:", err.message);

    console.log("✅ Port opened, waiting for modem...");
    await wait(2000);

    // Test AT
    port.write("AT\r");
    await wait(1500);

    // Text mode
    port.write("AT+CMGF=1\r");
    await wait(1500);

    // Split message
    const chunks = chunkMessage(MESSAGE, SMS_LENGTH);
    for (let i = 0; i < chunks.length; i++) {
      console.log(`📤 Sending chunk ${i + 1}/${chunks.length}...`);
      port.write(`AT+CMGS="${TARGET}"\r`);
      await wait(1000);
      port.write(chunks[i]);
      port.write(Buffer.from([0x1A])); // CTRL+Z
      await wait(5000); // wait for message to send
    }

    console.log("✅ All messages sent.");
  });
}

sendSMS();
