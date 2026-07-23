const escpos = require("escpos");
escpos.USB = require("escpos-usb"); // Uses direct USB connection to printer
const path = require("path");

let argumentprevious = "";

function executephp(ticket, count, service_name) {
  const argument = `${ticket},${count},${service_name}`;

  if (argument === argumentprevious) {
    console.log("Duplicate argument detected, skipping execution.");
    return;
  }

  // Find the GSAN printer on USB
  let device;
  try {
    device = new escpos.USB();
  } catch (err) {
    console.error("❌ Printer USB connection failed:", err.message);
    return;
  }

  const printer = new escpos.Printer(device);
  const logoPath = path.join(__dirname, "../../images/dbp.png");

  device.open((error) => {
    if (error) {
      console.error("❌ Could not open printer device:", error.message);
      return;
    }

    argumentprevious = argument;

    // Get current Manila timestamp
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0];

    // Load logo image if it exists, then print ticket content
    escpos.Image.load(logoPath, (image) => {
      if (image) {
        printer.align("ct").raster(image);
      }

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
          console.log(`🖨️ Ticket printed: ${ticket}${count}`);
        });
    });
  });
}

module.exports = { executephp };
