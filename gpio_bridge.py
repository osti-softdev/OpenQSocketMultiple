import sys
import time
import threading
from threading import Timer
from gpiozero import Button, LED
from RPLCD.i2c import CharLCD

# GPIO configuration
# button_gpio : (key, led_gpio)
buttons_config = {
      4:  ("4", 13),  # 🔹 Updated: Sample 1 Button on Pin 4 triggers Key "4", blinks LED on Pin 13
    17: ("1", 18),
    27: ("2", 23),
    22: ("3", 24),
    10: ("5", 25), # shifted others out of collision conflict
    9:  ("6", 8),
    11: ("7", 7),
    5:  ("8", 12),
}

buttons = []
leds = {}

# Initialize LCD (Adjust I2C address 0x27 if necessary)
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
        Timer(3.0, led_off, args=[led]).start()

    # Send key press to Node.js
    print(f"KEY:{key}")
    sys.stdout.flush()

def handle_text_input(text):
    if not lcd:
        return
    
    lcd.clear()
    lcd.cursor_pos = (0, 4)
    lcd.write_string("Ticket:")
    
    # Center text on line 2 based on its length
    start_col = max(0, (16 - len(text)) // 2)
    lcd.cursor_pos = (1, start_col)
    lcd.write_string(text)

def stdin_listener():
    """ Listens to raw string updates from Node.js """
    for line in sys.stdin:
        clean_line = line.strip()
        if clean_line:
            handle_text_input(clean_line)

# Initialize LEDs
for _, (_, led_pin) in buttons_config.items():
    try:
        leds[led_pin] = LED(led_pin)
        leds[led_pin].off()
    except Exception as e:
        print(f"LED GPIO {led_pin}: {e}", file=sys.stderr)

# 🔹 Arduino Startup Initialization Parity
if lcd:
    lcd.clear()
    lcd.cursor_pos = (0, 0)
    lcd.write_string("Queueing System")
    lcd.cursor_pos = (1, 1)
    lcd.write_string("is now Ready")

# Flash all LEDs for 3 seconds
for led in leds.values():
    led.on()
time.sleep(3.0)
for led in leds.values():
    led.off()

# Default idle state
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

# Start background Thread to read incoming terminal text strings
input_thread = threading.Thread(target=stdin_listener, daemon=True)
input_thread.start()

import signal
signal.pause()
