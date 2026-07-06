import sys
import json
import time
import threading
from threading import Timer
from gpiozero import Button, LED
from RPLCD.i2c import CharLCD

# GPIO configuration
# button_gpio : (key, led_gpio)
buttons_config = {
    17: ("1", 18),
    27: ("2", 23),
    22: ("3", 24),
    10: ("4", 25),
    9:  ("5", 8),
    11: ("6", 7),
    5:  ("7", 12),
    6:  ("8", 16),
}

buttons = []
leds = {}

# Initialize LCD (Adjust address 0x27 if necessary for your Pi backpack)
try:
    lcd = CharLCD('PCF8574', 0x27, port=1, cols=16, rows=2)
    lcd.backlight_enabled = True
except Exception as e:
    print(f"LCD Initialization Error: {e}", file=sys.stderr)
    lcd = None

def led_off(led):
    led.off()

def on_press(button):
    pin = button.pin.number
    if pin not in buttons_config:
        return

    key, led_pin = buttons_config[pin]
    led = leds.get(led_pin)

    if led:
        led.on()
        Timer(0.2, led_off, args=[led]).start()

    # Send key press to Node.js
    print(f"KEY:{key}")
    sys.stdout.flush()

def handle_json_input(line):
    if not lcd:
        return
    try:
        data = json.loads(line)
        status = data.get("status")
        service = data.get("ticketservice", "")
        number = data.get("ticketnum", "")

        lcd.clear()
        
        # Line 1 based on status
        if status == "calling":
            lcd.cursor_pos = (0, 2)
            lcd.write_string("Now Serving:")
        elif status == "called":
            lcd.cursor_pos = (0, 0)
            lcd.write_string("Called Ticket:")
        elif status == "pending":
            lcd.cursor_pos = (0, 4)
            lcd.write_string("Ticket:")
        else:
            lcd.cursor_pos = (0, 2)
            lcd.write_string("Void Ticket:")

        # Line 2 format string
        lcd.cursor_pos = (1, 6)
        lcd.write_string(f"{service}{number}")

    except json.JSONDecodeError:
        # Fallback raw message treatment
        lcd.clear()
        lcd.cursor_pos = (0, 4)
        lcd.write_string("Ticket:")
        lcd.cursor_pos = (1, 6)
        lcd.write_string(line.strip()[:10])

def stdin_listener():
    """ Listens to the incoming backend data from Node.js """
    for line in sys.stdin:
        if line.strip():
            handle_json_input(line)

# Initialize LEDs
for _, (_, led_pin) in buttons_config.items():
    try:
        leds[led_pin] = LED(led_pin)
        leds[led_pin].off()
    except Exception as e:
        print(f"LED GPIO {led_pin}: {e}", file=sys.stderr)

# 🔹 Arduino Startup Parity Strategy
if lcd:
    lcd.clear()
    lcd.cursor_pos = (0, 0)
    lcd.write_string("Queueing System")
    lcd.cursor_pos = (1, 1)
    lcd.write_string("is now Ready")

# Turn all LEDs ON for 3 seconds
for led in leds.values():
    led.on()
time.sleep(3.0)
for led in leds.values():
    led.off()

# Default idle screen state
if lcd:
    lcd.clear()
    lcd.cursor_pos = (0, 4)
    lcd.write_string("Get Your")
    lcd.cursor_pos = (1, 5)
    lcd.write_string("Ticket")

# Initialize Buttons
for button_pin in buttons_config.keys():
    try:
        btn = Button(button_pin, pull_up=True, bounce_time=0.1)
        btn.when_pressed = on_press
        buttons.append(btn)
        print(f"GPIO {button_pin} initialized", file=sys.stderr)
    except Exception as e:
        print(f"Button GPIO {button_pin}: {e}", file=sys.stderr)

print("GPIO Bridge Ready", file=sys.stderr)
sys.stderr.flush()

# Start background Thread to consume Node.js standard input writes
input_thread = threading.Thread(target=stdin_listener, daemon=True)
input_thread.start()

# Keep main execution frame alive
import signal
signal.pause()
