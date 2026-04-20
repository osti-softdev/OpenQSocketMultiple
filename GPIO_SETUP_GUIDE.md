# Raspberry Pi GPIO Button Configuration Guide

## Overview
This application has been updated to support **Raspberry Pi GPIO buttons** instead of Arduino USB serial connections. Buttons are now connected directly to GPIO pins on the Raspberry Pi.

## System Type Configuration
The system is now configured to use: `SYSTEM_TYPE=RASPBERRY_PI_GPIO` in your `.env` file.

## GPIO Pin Mapping

The following GPIO pins are used for button inputs:

| Button Function | GPIO Pin | BCM Pin | Physical Pin | Key Value |
|---|---|---|---|---|
| Ticket Service 1 | GPIO 17 | BCM 17 | Pin 11 | `2` |
| Ticket Service 2 | GPIO 27 | BCM 27 | Pin 13 | `3` |
| Ticket Service 3 | GPIO 22 | BCM 22 | Pin 15 | `4` |
| Call Next (Counter A) | GPIO 10 | BCM 10 | Pin 19 | `A` |
| Call Next (Counter B) | GPIO 9 | BCM 9 | Pin 21 | `B` |
| Call Next (Counter C) | GPIO 11 | BCM 11 | Pin 23 | `C` |
| Call Next (Counter D) | GPIO 5 | BCM 5 | Pin 29 | `D` |
| Recall Last Ticket | GPIO 6 | BCM 6 | Pin 31 | `#` |
| Void Ticket | GPIO 13 | BCM 13 | Pin 33 | `0` |
| Satisfied Feedback | GPIO 19 | BCM 19 | Pin 35 | `5` |
| Unsatisfied Feedback | GPIO 26 | BCM 26 | Pin 37 | `6` |

## Wiring Instructions

### What You Need
- Momentary push buttons (11 total, or as needed)
- Jumper wires or button connectors
- GPIO header pins on your Raspberry Pi
- Optional: pull-down resistors (if buttons are not internally pulldown)

### Wiring Method 1: Active-High Configuration (Recommended)
1. Connect one side of each button to the corresponding **GPIO pin** (see table above)
2. Connect the other side to **3.3V power** on the Raspberry Pi
3. **Note:** The code expects the GPIO to go HIGH (3.3V) when the button is pressed

### Wiring Method 2: Active-Low Configuration (Modify Code)
If your buttons connect to GND instead:
1. Connect one side of each button to the corresponding GPIO pin
2. Connect the other side to **GND** (Ground)
3. Modify the `gpiobuttons.js` watcher logic to detect `value === 0` instead of `value === 1`

### Typical Raspberry Pi GPIO Header Layout
```
Pin 1:  3.3V Power
Pin 2:  5V Power
Pin 3:  GPIO 2 (SDA) - I2C
Pin 4:  5V Power
Pin 5:  GPIO 3 (SCL) - I2C
Pin 6:  GND
Pin 7:  GPIO 4
Pin 8:  GPIO 14 (TX)
Pin 9:  GND
Pin 10: GPIO 15 (RX)
Pin 11: GPIO 17  ✓ (Ticket Service 1)
Pin 12: GPIO 18
Pin 13: GPIO 27  ✓ (Ticket Service 2)
Pin 14: GND
Pin 15: GPIO 22  ✓ (Ticket Service 3)
Pin 16: GPIO 23
Pin 17: 3.3V Power
Pin 18: GPIO 24
Pin 19: GPIO 10  ✓ (Counter A)
Pin 20: GND
Pin 21: GPIO 9   ✓ (Counter B)
Pin 22: GPIO 25
Pin 23: GPIO 11  ✓ (Counter C)
Pin 24: GPIO 8
Pin 25: GND
Pin 26: GPIO 7
Pin 27: GPIO 0 (ID_SD)
Pin 28: GPIO 1 (ID_SC)
Pin 29: GPIO 5   ✓ (Counter D)
Pin 30: GND
Pin 31: GPIO 6   ✓ (Recall Last)
Pin 32: GPIO 12
Pin 33: GPIO 13  ✓ (Void Ticket)
Pin 34: GND
Pin 35: GPIO 19  ✓ (Satisfied Feedback)
Pin 36: GPIO 16
Pin 37: GPIO 26  ✓ (Unsatisfied Feedback)
Pin 38: GPIO 20
Pin 39: GND
Pin 40: GPIO 21
```

## Installation & Setup

### 1. Install Node Modules
```bash
npm install
```
This will install the `onoff` package (required for GPIO control).

### 2. Configure the System Type
Edit `outfolder/config/.env`:
```
SYSTEM_TYPE=RASPBERRY_PI_GPIO
```

### 3. Enable GPIO Access
The `onoff` library requires access to `/sys/class/gpio/`. You have two options:

**Option A: Run as Root (Simpler)**
```bash
sudo npm start
```

**Option B: Grant Permissions (More Secure)**
Add your user to the GPIO group:
```bash
sudo usermod -aG gpio $USER
```
Then log out and log back in, or run:
```bash
newgrp gpio
```

### 4. Start the Application
```bash
npm start
```

You should see GPIO initialization messages:
```
📌 Setting up GPIO button: btn2 on pin 17
📌 Setting up GPIO button: btn3 on pin 27
...
✨ GPIO button system ready with 11 buttons
```

## Testing Your Setup

### Manual GPIO Testing
Use the `raspi-gpio` tool to test individual pins:

```bash
# Check GPIO status
raspi-gpio get

# Test GPIO 17 (pull high to trigger)
raspi-gpio set 17 op  # Set as output
raspi-gpio set 17 dh  # Set to 1 (high) - simulates button press
```

### Application Testing
1. Start the app: `npm start`
2. Press a button connected to GPIO 17 (should create a ticket for Service 1)
3. Check the console logs for confirmation
4. Check the database: transactions should be updated

### Enable Debug Logging
To see more detailed GPIO events, modify `reso/node/gpiobuttons.js` and add:
```javascript
console.log(`[GPIO ${config.pin}] Value changed to:`, value);
```

## Troubleshooting

### "Cannot access /sys/class/gpio/" Error
**Solution:** Run with sudo or add user to gpio group (see Installation step 3).

### Buttons Not Responding
1. Verify GPIO pin numbers match the wiring
2. Check GPIO header voltage (should be 3.3V)
3. Verify button connections are secure
4. Use `raspi-gpio get` to manually test pins
5. Check application logs for GPIO initialization errors

### "Only one GPIO per pin" Error
**Solution:** The GPIO was not properly cleaned up from a previous run. Restart the Raspberry Pi or use:
```bash
sudo systemctl restart
```

### Buttons Triggering Multiple Times
**Solution:** The code includes debouncing (50ms timeout). If still occurring, increase the debounce timeout in `gpiobuttons.js`:
```javascript
{ debounceTimeout: 100 }  // Increase from 50 to 100ms
```

## Customizing GPIO Pins

To use different GPIO pins, edit the `GPIO_BUTTON_CONFIG` object in `reso/node/gpiobuttons.js`:

```javascript
const GPIO_BUTTON_CONFIG = {
  btn2: { pin: 17, key: "2" },     // Change 17 to your desired pin
  btn3: { pin: 27, key: "3" },
  // ... etc
};
```

**Important:** Restart the application after changing pin numbers.

## Performance Notes

- **Debounce delay:** 50ms (prevents multiple triggers from button bounce)
- **GPIO state check interval:** Continuous via `watch()` method
- **No polling:** Uses event-driven model for low CPU usage
- **Cleanup:** Proper GPIO unexport on app shutdown

## Migration from Arduino

If you're migrating from the Arduino system:

1. **Old:** Button presses sent via USB serial (9600 baud)
2. **New:** Button presses detected via GPIO state changes (instant)

The database operations remain identical—only the input method changed.

## Hardware Recommendations

- **Buttons:** 5mm momentary tactile switches (common)
- **Jumper wires:** 22-28 AWG, male-to-female
- **Power supply:** 5A+ (Raspberry Pi + buttons draw minimal current)
- **Protection:** Consider adding 100Ω resistors on GPIO pins for safety

## Support

For issues or questions about GPIO configuration:
1. Check the application logs: `tail -f reso/outfolder/logs/logs.log`
2. Verify GPIO pins: `raspi-gpio get`
3. Test connectivity with a multimeter or LED
