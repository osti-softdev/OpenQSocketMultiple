import serial
import time
import math

# ---------------- Configuration ----------------
PORT = 'COM9'
BAUD = 115200
TARGET = '+639988166518'
MESSAGE = ("Globe Prepaid Unli Data Guide: Buy SIM (₱40) at stores/7-Eleven. "
           "Insert, restart phone. Dial *143# to register (need ID). Load ₱50+ via GCash, "
           "Maya, or app. Text promo to 8080: GO50 ...")

MAX_UCS2_CHARS = 70  # Max chars per SMS in UCS-2
DELAY_BETWEEN_PARTS = 4  # seconds between parts
# ------------------------------------------------

def flash(msg):
    print(f"[FLASH] {msg}")

# ---------------- Serial Port Setup ----------------
ser = serial.Serial(PORT, BAUD, timeout=5)

def wait_for_response(expected='OK', timeout=10):
    """Wait for modem response containing expected text."""
    end_time = time.time() + timeout
    buffer = ''
    while time.time() < end_time:
        if ser.in_waiting:
            buffer += ser.read(ser.in_waiting).decode(errors='ignore')
        if expected in buffer:
            return buffer
    return buffer

def str_to_ucs2_hex(s):
    """Convert a string to UCS-2 hex (big-endian)."""
    return ''.join(f"{ord(c):04X}" for c in s)

def split_message(message, max_chars=MAX_UCS2_CHARS):
    """Split long message into parts of max_chars."""
    parts = []
    total_parts = math.ceil(len(message) / max_chars)
    for i in range(total_parts):
        part_text = message[i*max_chars:(i+1)*max_chars]
        parts.append(part_text)
    return parts

# ---------------- Main Sending ----------------
flash("Setting modem to text mode (AT+CMGF=1)...")
ser.write(b'AT+CMGF=1\r')
flash(wait_for_response())

flash('Setting character set to UCS2 (AT+CSCS="UCS2")...')
ser.write(b'AT+CSCS="UCS2"\r')
flash(wait_for_response())

flash("Splitting message into UCS-2 compatible parts...")
parts = split_message(MESSAGE)
flash(f"Message split into {len(parts)} part(s).")

for i, part in enumerate(parts, 1):
    flash(f"Sending part {i}/{len(parts)}...")

    # Convert target and message part to UCS-2 hex
    target_hex = str_to_ucs2_hex(TARGET)
    message_hex = str_to_ucs2_hex(part)

    # Send AT+CMGS command with UCS-2 number
    ser.write(f'AT+CMGS="{target_hex}"\r'.encode())
    time.sleep(0.5)

    # Wait for '>' prompt
    buf = ''
    while '>' not in buf:
        if ser.in_waiting:
            buf += ser.read(ser.in_waiting).decode(errors='ignore')

    # Send UCS-2 message + CTRL+Z
    ser.write(message_hex.encode() + b'\x1A')

    # Wait for modem OK
    resp = wait_for_response()
    flash(resp.strip())

    time.sleep(DELAY_BETWEEN_PARTS)

flash("✅ All message parts sent successfully!")
ser.close()
