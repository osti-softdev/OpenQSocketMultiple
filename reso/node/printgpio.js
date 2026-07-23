const escpos = require("escpos");
const { spawn } = require("child_process");

// Custom Adapter to send raw ESC/POS commands directly to CUPS
class CUPSAdapter {
  constructor(printerName) {
    this.printerName = printerName;
  }
  open(callback) {
    if (callback) callback(null);
  }
  write(data, callback) {
    // Send the raw data buffer to the Linux lp command
    const lp = spawn("lp", ["-d", this.printerName, "-o", "raw"]);
    lp.stdin.write(data);
    lp.stdin.end();
    
    lp.on("close", (code) => {
      if (code !== 0) console.error(`❌ CUPS lp command exited with code ${code}`);
      if (callback) callback(null);
    });
  }
  close(callback) {
    if (callback) callback(null);
    return this;
  }
}

let argumentprevious = "";

function executephp(ticket, count, service_name) {
  const argument = `${ticket},${count},${service_name}`;

  if (argument === argumentprevious) {
    console.log("Duplicate argument detected, skipping execution.");
    return;
  }

  // Use our new adapter targeting your CUPS printer named "POS"
  const device = new CUPSAdapter("POS");
  const printer = new escpos.Printer(device);

  device.open((error) => {
    if (error) {
      console.error("❌ Could not open CUPS printer:", error.message);
      return;
    }

    argumentprevious = argument;

    // Get current Manila timestamp
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(now); // YYYY-MM-DD
    const timeStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", timeStyle: "medium" }).format(now); // HH:MM:SS

    // Proceed directly to printing the text
    printTicketContent(printer, dateStr, timeStr, ticket, count, service_name);
  });
}

// Helper function for the print layout
function printTicketContent(printer, dateStr, timeStr, ticket, count, service_name) {
  printer
    .align("ct")
    .style("b")
    .size(1, 1)
    .text("DEVELOPMENT BANK")
    .text("OF THE PHILIPPINES")
    .text(`${dateStr} ${timeStr}`)
    .text("____________________\n")
    .size(2, 2)
    .text(`${ticket}${count}\n`)
    .size(1, 1)
    .text(`${service_name}\n`)
    .text("This Ticket is valid only on the day it is dispensed.")
    .feed(2)
    .cut()
    .close(() => {
      console.log(`🖨️ Ticket sent to CUPS queue (POS): ${ticket}${count}`);
    });
}

module.exports = { executephp };
