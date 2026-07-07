import sys
import time
import threading
from threading import Timer
from gpiozero import Button, LED
from RPLCD.i2c import CharLCD
import signal

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

try:
    lcd = CharLCD('PCF8574', 0x27, port=1, cols=16, rows=2)
    lcd.backlight_enabled = True
except Exception as e:
    print(f"LCD Initialization Error: {e}", file=sys.stderr)
    lcd = None


def unlock_button(pin, led):
    led.off()
    button_locked[pin] = False


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
        Timer(3.0, unlock_button, args=[pin, led]).start()
    else:
        button_locked[pin] = False

    print(f"KEY:{key}")
    sys.stdout.flush()


def handle_text_input(text):
    if not lcd:
        return

    lcd.clear()
    lcd.cursor_pos = (0, 4)
    lcd.write_string("Ticket:")

    start_col = max(0, (16 - len(text)) // 2)
    lcd.cursor_pos = (1, start_col)
    lcd.write_string(text)


def stdin_listener():
    for line in sys.stdin:
        clean_line = line.strip()
        if clean_line:
            handle_text_input(clean_line)


# Initialize LEDs and locks
for button_pin, (_, led_pin) in buttons_config.items():
    try:
        leds[led_pin] = LED(led_pin)
        leds[led_pin].off()
        button_locked[button_pin] = False
    except Exception as e:
        print(f"LED GPIO {led_pin}: {e}", file=sys.stderr)
        button_locked[button_pin] = False


if lcd:
    lcd.clear()
    lcd.cursor_pos = (0, 0)
    lcd.write_string("Queueing System")
    lcd.cursor_pos = (1, 1)
    lcd.write_string("is now Ready")


for led in leds.values():
    led.on()

time.sleep(3.0)

for led in leds.values():
    led.off()


if lcd:
    lcd.clear()
    lcd.cursor_pos = (0, 4)
    lcd.write_string("Get Your")
    lcd.cursor_pos = (1, 5)
    lcd.write_string("Ticket")


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

input_thread = threading.Thread(target=stdin_listener, daemon=True)
input_thread.start()

signal.pause()
