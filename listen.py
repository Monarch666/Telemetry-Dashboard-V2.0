"""
AeroSync Telemetry — MAVLink listener
Reads MAVLink telemetry from a connected vehicle and writes structured
JSON files to public/params/ for consumption by the dashboard.

Usage:
    python listen.py [--port /dev/ttyUSB0] [--baud 57600] [--udp 14550]
"""

import json
import os
import sys
import time
import argparse
import logging
from pathlib import Path

try:
    from pymavlink import mavutil
except ImportError:
    print("[ERROR] pymavlink not installed. Run: pip install pymavlink")
    sys.exit(1)

# ── Configuration ──────────────────────────────────────────────────────────────
OUTPUT_DIR = Path("public") / "params"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PARAM_TYPES = [
    "ATTITUDE",
    "AHRS",
    "AHRS2",
    "BATTERY_STATUS",
    "HEARTBEAT",
    "DISTANCE_SENSOR",
    "GLOBAL_POSITION_INT",
    "RANGEFINDER",
    "RAW_IMU",
    "SCALED_IMU2",
    "LOCAL_POSITION_NED",
]

DATA_STREAM_RATE_HZ = 10  # Request 10 Hz data streams

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("aerosync")


# ── MAVLink connection ─────────────────────────────────────────────────────────
def create_connection(args: argparse.Namespace) -> mavutil.mavfile:
    """Create a MAVLink connection from CLI args."""
    if args.udp:
        addr = f"udpin:0.0.0.0:{args.udp}"
        log.info(f"Connecting via UDP on port {args.udp}…")
    else:
        addr = args.port
        log.info(f"Connecting via serial: {addr} @ {args.baud} baud…")
    return mavutil.mavlink_connection(addr, baud=args.baud)


def wait_for_heartbeat(conn: mavutil.mavfile, timeout: float = 30.0) -> bool:
    """Block until heartbeat received or timeout exceeded."""
    log.info("Waiting for vehicle heartbeat…")
    msg = conn.wait_heartbeat(timeout=timeout)
    if msg:
        log.info(
            f"Heartbeat received — system {conn.target_system}, "
            f"component {conn.target_component}"
        )
        return True
    log.warning("Heartbeat timeout — continuing without confirmation")
    return False


def request_streams(conn: mavutil.mavfile) -> None:
    """Request all data streams at the configured rate."""
    try:
        conn.mav.request_data_stream_send(
            conn.target_system,
            conn.target_component,
            mavutil.mavlink.MAV_DATA_STREAM_ALL,
            DATA_STREAM_RATE_HZ,
            1,  # start
        )
        log.info(f"Requested all data streams at {DATA_STREAM_RATE_HZ} Hz")
    except Exception as exc:
        log.warning(f"Could not request data streams: {exc}")


# ── Data writing ───────────────────────────────────────────────────────────────
def write_param(conn: mavutil.mavfile, param_type: str, timeout: float = 0.5) -> bool:
    """
    Wait for a specific MAVLink message type and write it to JSON.
    Returns True on success, False on timeout or error.
    """
    try:
        msg = conn.recv_match(type=param_type, blocking=True, timeout=timeout)
        if msg is None:
            return False

        data = msg.to_dict()
        out_path = OUTPUT_DIR / f"{param_type}.json"
        with open(out_path, "w") as f:
            json.dump(data, f, indent=2)
        return True

    except Exception as exc:
        log.error(f"Error processing {param_type}: {exc}")
        return False


# ── Main loop ──────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description="AeroSync MAVLink Telemetry Listener")
    parser.add_argument("--port",  default="/dev/tty.usbserial-0001", help="Serial port")
    parser.add_argument("--baud",  type=int, default=57600,            help="Baud rate")
    parser.add_argument("--udp",   type=int, default=None,             help="UDP port (overrides --port)")
    parser.add_argument("--rate",  type=float, default=1.0,            help="Cycle delay between full param sweeps (s)")
    args = parser.parse_args()

    conn = create_connection(args)
    wait_for_heartbeat(conn)
    request_streams(conn)

    log.info(f"Listening for {len(PARAM_TYPES)} parameter types…")
    cycle = 0

    while True:
        cycle += 1
        received, missed = 0, 0

        for param_type in PARAM_TYPES:
            ok = write_param(conn, param_type)
            if ok:
                received += 1
            else:
                missed += 1

        log.info(f"Cycle {cycle:04d}: {received}/{len(PARAM_TYPES)} received, {missed} missed")
        time.sleep(args.rate)


if __name__ == "__main__":
    main()