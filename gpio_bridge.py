# gpio_bridge.py

from gpiozero import Button, LED
import signal
import sys
from threading import Timer

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


def led_off(led):
    led.off()


def on_press(button):
    pin = button.pin.number

    if pin not in buttons_config:
        return

    key, led_pin = buttons_config[pin]
    led = leds[led_pin]

    # Turn LED on
    led.on()

    # Turn LED off after 200 ms
    Timer(0.2, led_off, args=[led]).start()

    # Send key to Node.js
    print(f"KEY:{key}")
    sys.stdout.flush()


# Initialize LEDs
for _, (_, led_pin) in buttons_config.items():
    try:
        leds[led_pin] = LED(led_pin)
        leds[led_pin].off()
    except Exception as e:
        print(f"LED GPIO {led_pin}: {e}", file=sys.stderr)

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


signal.pause()
