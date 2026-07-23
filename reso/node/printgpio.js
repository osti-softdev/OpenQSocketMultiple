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

  const device = new CUPSAdapter("POS");
  const printer = new escpos.Printer(device);

  device.open((error) => {
    if (error) {
      console.error("❌ Could not open CUPS printer:", error.message);
      return;
    }

    argumentprevious = argument;

    const now = new Date();
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(now);
    const timeStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", timeStyle: "short" }).format(now);

    printTicketContent(printer, dateStr, timeStr, ticket, count, service_name);
  });
}


// Helper function to perfectly center text using spaces
function centerText(text, isDoubleSize = false) {
  const maxWidth = isDoubleSize ? 16 : 32;
  if (text.length >= maxWidth) return text;
  
  const padding = Math.floor((maxWidth - text.length) / 2);
  return " ".repeat(padding) + text;
}

function printTicketContent(printer, dateStr, timeStr, ticket, count, service_name) {
  const datetime = `${dateStr} ${timeStr}`;
  const ticketNumber = `${ticket}${count}`;

  printer
    // Removed .align("ct") to fix the "a" bug!
    
    // 1. Header: Normal size (0,0), standard font
    .font("A")
    .style("NORMAL")
    .size(0, 0) 
    .text(centerText("DEVELOPMENT BANK"))
    .text(centerText("OF THE PHILIPPINES"))
    .text(centerText(datetime))
    .text("--------------------------------") // 32 dashes
    .feed(1)

    // 2. Ticket Number: Double Size (1,1)
    .style("B")
    .size(1, 1) 
    .text(centerText(ticketNumber, true)) // true = recalculate spaces for double size
    .feed(1)
    
    // 3. Service Name: Normal size (0,0), but bold
    .size(0, 0) 
    .text(centerText(service_name))
    .feed(1)
    .text("--------------------------------")

    // 4. Disclaimer: Smaller font (Font B)
    .style("NORMAL")
    .font("B") 
    .text(centerText("This Ticket is valid only on"))
    .text(centerText("the day it is dispensed."))
    
    .feed(3) 
    .cut()
    .close(() => {
      console.log(`🖨️ Ticket sent to CUPS queue (POS): ${ticketNumber}`);
    });
}

module.exports = { executephp };
