import sys
import time
import signal
import threading

from gpiozero import Button, LED
from RPLCD.i2c import CharLCD

# -----------------------------
# GPIO Configuration
# button_gpio: (key, led_gpio)
# -----------------------------
buttons_config = {
    4:  ("4", 13),
    17: ("1", 18),
    27: ("2", 23),
    22: ("3", 24),
    10: ("5", 25),
    9:  ("6", 8),
    11: ("7", 7),
    5:  ("8", 12),
}

buttons = []
leds = {}
button_locked = {}

# -----------------------------
# LCD Initialization
# -----------------------------
try:
    lcd = CharLCD(
        i2c_expander='PCF8574',
        address=0x27,
        port=1,
        cols=16,
        rows=2
    )
    lcd.backlight_enabled = True
except Exception as e:
    print(f"LCD Initialization Error: {e}", file=sys.stderr)
    lcd = None


# -----------------------------
# Unlock button after delay
# -----------------------------
def unlock_button(pin, led):
    led.off()
    button_locked[pin] = False


# -----------------------------
# Button Press Event
# -----------------------------
def on_press(button):
    pin = button.pin.number

    if pin not in buttons_config:
        return

    if button_locked.get(pin, False):
        return

    key, led_pin = buttons_config[pin]
    led = leds.get(led_pin)

    button_locked[pin] = True

    if led:
        led.on()
        threading.Timer(3.0, unlock_button, args=[pin, led]).start()
    else:
        button_locked[pin] = False

    print(f"KEY:{key}")
    sys.stdout.flush()


# -----------------------------
# LCD Display
# -----------------------------
def handle_text_input(text):
    if not lcd:
        return

    lcd.clear()

    lcd.cursor_pos = (0, 4)
    lcd.write_string("Ticket:")

    start_col = max(0, (16 - len(text)) // 2)

    lcd.cursor_pos = (1, start_col)
    lcd.write_string(text)


# -----------------------------
# Listen to stdin
# -----------------------------
def stdin_listener():
    for line in sys.stdin:
        clean_line = line.strip()

        if clean_line:
            handle_text_input(clean_line)


# -----------------------------
# Initialize LEDs
# -----------------------------
for button_pin, (_, led_pin) in buttons_config.items():
    try:
        led = LED(led_pin)
        led.off()

        leds[led_pin] = led
        button_locked[button_pin] = False

    except Exception as e:
        print(f"LED GPIO {led_pin}: {e}", file=sys.stderr)
        button_locked[button_pin] = False


# -----------------------------
# Startup LCD
# -----------------------------
if lcd:
    lcd.clear()

    lcd.cursor_pos = (0, 0)
    lcd.write_string("Queueing System")

    lcd.cursor_pos = (1, 2)
    lcd.write_string("is now Ready")


# -----------------------------
# LED Startup Animation
# -----------------------------
for led in leds.values():
    led.on()

time.sleep(3)

for led in leds.values():
    led.off()


# -----------------------------
# Ready Screen
# -----------------------------
if lcd:
    lcd.clear()

    lcd.cursor_pos = (0, 4)
    lcd.write_string("Get Your")

    lcd.cursor_pos = (1, 5)
    lcd.write_string("Ticket")


# -----------------------------
# Initialize Buttons
# -----------------------------
for button_pin in buttons_config.keys():
    try:
        btn = Button(
            button_pin,
            pull_up=True,
            bounce_time=0.1
        )

        btn.when_pressed = lambda b=btn: on_press(b)

        buttons.append(btn)

    except Exception as e:
        print(f"Button GPIO {button_pin}: {e}", file=sys.stderr)


print("GPIO Bridge Ready", file=sys.stderr)
sys.stderr.flush()


# -----------------------------
# Start stdin listener
# -----------------------------
input_thread = threading.Thread(
    target=stdin_listener,
    daemon=True
)
input_thread.start()


# -----------------------------
# Keep Program Running
# -----------------------------
try:
    signal.pause()
except KeyboardInterrupt:
    print("\nExiting...")

    if lcd:
        lcd.clear()

    for led in leds.values():
        led.off()
