# AeroSync Telemetry Platform
# Your UAV telemetry dashboard — built from scratch

## About

AeroSync is a **production-grade UAV telemetry dashboard** for real-time monitoring of MAVLink-based flight systems. Built with Next.js, TypeScript, Three.js, and a Python MAVLink listener backend.

## Features

- **Live Telemetry Overview** — altitude, ground speed, battery, attitude at a glance
- **Artificial Horizon (HUD)** — canvas-rendered pitch/roll indicator with aircraft symbol
- **Compass Rose** — real-time heading dial with cardinal marks
- **GPS Flight Track** — 2D local position track with gradient history
- **Live Charts** — scrolling time-series for altitude, speed, battery, roll
- **Signal Status** — RSSI, SNR, packet drop rate monitor
- **Alert System** — automatic threshold alerts (battery, geofence, attitude)
- **Flight Event Log** — timestamped system event stream
- **Parameter Browser** — inspect all MAVLink parameters with JSON export
- **Alerts Page** — acknowledge and filter flight safety alerts

## Tech Stack

- Next.js 15 + TypeScript
- Tailwind CSS (custom AeroSync design system)
- Three.js (3D visualization on attitude page)
- Recharts (time-series charts)
- Python + pymavlink (telemetry backend)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start the frontend

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 3. Run the MAVLink listener

#### Serial connection (Pixhawk/ArduPilot)
```bash
python listen.py --port /dev/ttyUSB0 --baud 57600
```

#### UDP connection (SITL or radio)
```bash
python listen.py --udp 14550
```

#### Options
| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `/dev/tty.usbserial-0001` | Serial port |
| `--baud` | `57600` | Baud rate |
| `--udp`  | — | UDP port (overrides `--port`) |
| `--rate` | `1.0` | Seconds between full telemetry cycles |

## Data Flow

1. `listen.py` reads MAVLink messages and writes JSON files to `public/params/`
2. The dashboard fetches these files every second
3. If no live data is found, the simulator runs automatically for development

## Directory Structure

```
├── app/
│   ├── page.tsx              # Overview dashboard
│   ├── attitude/page.tsx     # Attitude & HUD
│   ├── position/page.tsx     # Position & GPS
│   ├── charts/page.tsx       # Live charts
│   ├── parameters/page.tsx   # Parameter browser
│   └── alerts/page.tsx       # Alerts & events
├── components/
│   ├── app-shell.tsx         # Sidebar + layout shell
│   ├── telemetry-hub.tsx     # Main dashboard orchestrator
│   ├── stat-card.tsx         # Animated metric cards
│   ├── artificial-horizon.tsx # Canvas HUD
│   ├── compass-rose.tsx      # Canvas compass
│   ├── gps-tracker.tsx       # Canvas GPS track
│   ├── live-charts.tsx       # Recharts time-series
│   ├── alert-feed.tsx        # Threshold alert widget
│   ├── signal-status.tsx     # Link quality panel
│   └── flight-event-log.tsx  # Event log table
├── listen.py                 # MAVLink telemetry listener
└── public/params/            # JSON telemetry files (auto-created)
```

## License

MIT License — Copyright (c) 2026 AeroSync
