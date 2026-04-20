# ✅ Raspberry Pi GPIO Button System - Implementation Complete

## Summary of Changes

Your application has been successfully updated to use **Raspberry Pi GPIO buttons** instead of Arduino USB serial connections. The buttons now connect directly to GPIO pins on your Raspberry Pi.

---

## 📝 Files Modified

### 1. **`reso/node/gpiobuttons.js`** (NEW)
- New GPIO button handler module using the `onoff` library
- Handles button press detection on 11 GPIO pins
- Performs the same database operations as the Arduino system
- Includes debouncing (50ms) to prevent false triggers
- Proper cleanup on application shutdown

### 2. **`package.json`**
- Added `"onoff": "^6.4.0"` dependency
- Install with: `npm install`

### 3. **`index.js`**
- Imported GPIO module: `const { initializeGPIO, cleanupGPIO } = require("./reso/node/gpiobuttons")`
- Added `RASPBERRY_PI_GPIO` to system types
- Added `isRaspberryPiGpio` boolean flag
- Added GPIO initialization in Socket.IO connection handler
- Added GPIO cleanup in graceful shutdown handler

### 4. **`outfolder/config/.env`**
- Changed: `SYSTEM_TYPE=ARDUINO_UNO` → `SYSTEM_TYPE=RASPBERRY_PI_GPIO`
- Application now uses GPIO mode instead of serial/Arduino mode

### 5. **`GPIO_SETUP_GUIDE.md`** (NEW)
- Comprehensive guide for Raspberry Pi GPIO configuration
- GPIO pin mapping table
- Wiring instructions (active-high and active-low options)
- Raspberry Pi GPIO header layout diagram
- Installation and setup steps
- Testing procedures
- Troubleshooting guide
- Customization instructions

---

## 🔌 GPIO Pin Mapping

| Function | GPIO Pin | Button Key |
|---|---|---|
| Ticket Service 1 | GPIO 17 | `2` |
| Ticket Service 2 | GPIO 27 | `3` |
| Ticket Service 3 | GPIO 22 | `4` |
| Call Counter A | GPIO 10 | `A` |
| Call Counter B | GPIO 9 | `B` |
| Call Counter C | GPIO 11 | `C` |
| Call Counter D | GPIO 5 | `D` |
| Recall Last | GPIO 6 | `#` |
| Void Ticket | GPIO 13 | `0` |
| Satisfied | GPIO 19 | `5` |
| Unsatisfied | GPIO 26 | `6` |

---

## 🚀 Quick Start on Raspberry Pi

### 1. Install Dependencies
```bash
npm install
```

### 2. Connect Buttons to GPIO Pins
- Reference: [GPIO_SETUP_GUIDE.md](GPIO_SETUP_GUIDE.md)
- Wire each button from its GPIO pin to 3.3V power
- OR wire to GND for active-low configuration

### 3. Run the Application
```bash
# Option A: With sudo (simpler)
sudo npm start

# Option B: With GPIO group permissions (recommended)
npm start
```

### 4. Verify Setup
You should see in the logs:
```
📌 Setting up GPIO button: btn2 on pin 17
📌 Setting up GPIO button: btn3 on pin 27
...
✨ GPIO button system ready with 11 buttons
```

---

## 📖 Button Functions (Unchanged)

The button functions remain identical to the Arduino system:

- **Buttons 2, 3, 4**: Create tickets for the first 3 services
- **Buttons A, B, C, D**: Call next ticket from specific counters
- **Button #**: Recall the last called ticket
- **Button 0**: Void the last called ticket
- **Buttons 5, 6**: Record satisfied/unsatisfied feedback

---

## 🔧 Key Features

✅ **Event-driven**: Uses GPIO state watching (no polling)
✅ **Debounced**: 50ms debounce to prevent multiple triggers
✅ **Clean shutdown**: Properly unexports GPIO pins on app exit
✅ **Error handling**: Graceful error handling for GPIO issues
✅ **Backward compatible**: Same button-to-database logic as Arduino
✅ **Responsive**: Instant button response (no serial latency)
✅ **Low CPU**: Minimal resource usage compared to serial monitoring

---

## ⚙️ Customization

### Change GPIO Pins
Edit `reso/node/gpiobuttons.js`:
```javascript
const GPIO_BUTTON_CONFIG = {
  btn2: { pin: 17, key: "2" },  // Change 17 to your pin number
  btn3: { pin: 27, key: "3" },
  // ... etc
};
```

### Change Debounce Time
Edit in `reso/node/gpiobuttons.js`:
```javascript
const gpio = new Gpio(config.pin, "in", "both", { 
  debounceTimeout: 100  // Increase from 50 to 100ms if needed
});
```

### Use Active-Low Buttons (GND instead of 3.3V)
Edit the watcher in `reso/node/gpiobuttons.js`:
```javascript
if (value === 0) {  // Change from 1 to 0
  processButtonPress(config.key);
}
```

---

## 🛠️ Troubleshooting

### GPIO Permission Denied
```bash
# Add user to GPIO group
sudo usermod -aG gpio $USER
# Then log out and log back in
```

### Buttons Not Responding
1. Verify GPIO pins with: `raspi-gpio get`
2. Check button wiring (GPIO pin ↔ 3.3V)
3. Test with: `raspi-gpio set 17 dh` (simulates button press on pin 17)
4. Check logs: `tail -f reso/outfolder/logs/logs.log`

### Multiple Triggers from Single Press
- Increase debounce timeout to 100ms
- Verify button contacts are clean
- Check GPIO voltage is exactly 3.3V

---

## 📚 Documentation

- **Setup Guide**: See [GPIO_SETUP_GUIDE.md](GPIO_SETUP_GUIDE.md)
- **GPIO Code**: See [reso/node/gpiobuttons.js](reso/node/gpiobuttons.js)
- **Main Entry**: See [index.js](index.js) (lines ~35-40, ~245-250, ~417-425, ~717-719)

---

## ✨ What's Next?

1. **Review the GPIO_SETUP_GUIDE.md** for detailed wiring instructions
2. **Connect your buttons** to the correct GPIO pins
3. **Install npm packages**: `npm install`
4. **Test the application**: `sudo npm start`
5. **Press buttons** and verify database updates

---

## 🔄 Reverting to Arduino (if needed)

To switch back to Arduino mode:
```bash
# Edit .env
nano outfolder/config/.env

# Change:
# SYSTEM_TYPE=ARDUINO_UNO

# Then restart:
npm start
```

---

## ❓ Need Help?

Refer to:
1. **GPIO_SETUP_GUIDE.md** - Comprehensive setup and troubleshooting
2. **reso/node/gpiobuttons.js** - GPIO implementation
3. **Raspberry Pi GPIO Documentation** - https://www.raspberrypi.org/documentation/computers/raspberry-pi.html

---

**Status**: ✅ Ready to use on Raspberry Pi with GPIO buttons!
