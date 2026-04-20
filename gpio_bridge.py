# gpio_bridge.py
from gpiozero import Button
import sys
import signal

# Map GPIO pin numbers to the keys your app expects
buttons_map = {
    "17": "2", "27": "3", "22": "4",
    "10": "A", "9": "B", "11": "C", "5": "D",
    "6": "#", "13": "0", "19": "5", "26": "6"
}

def on_press(button):
    pin_num = str(button.pin.number)
    key = buttons_map.get(pin_num)
    if key:
        # Send the key to Node.js via stdout
        print(f"KEY:{key}")
        sys.stdout.flush()

# Setup all buttons
active_buttons = []
for pin_num in buttons_map.keys():
    try:
        btn = Button(int(pin_num), pull_up=True, bounce_time=0.1)
        btn.when_pressed = on_press
        active_buttons.append(btn)
    except Exception as e:
        print(f"DEBUG: Could not setup pin {pin_num}: {e}", file=sys.stderr)

print(f"DEBUG: Python GPIO Bridge Ready with {len(active_buttons)} buttons", file=sys.stderr)
sys.stderr.flush()

# Wait forever
signal.pause()
