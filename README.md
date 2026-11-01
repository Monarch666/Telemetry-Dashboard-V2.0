# Telemetry Dashboard V2.0 — Real-Time MAVLink Flight HUD & Ground Station

Real-time aerospace flight telemetry dashboard and Head-Up Display (HUD) parsing live MAVLink telemetry packets, flight logs (.tlog), and sensor streams.

Developed by **Aadarsh Sinha** ([@Monarch666](https://github.com/Monarch666)).

---

## 🛸 Dashboard Highlights

- **Live Flight HUD**: 3D attitude gyro indicator, airspeed, barometric altitude, climb rate, and battery telemetry.
- **MAVLink Packet Parser**: Low-latency listener (`listen.py`) parsing heartbeat, SYS_STATUS, and GLOBAL_POSITION_INT frames.
- **Interactive UI**: Next.js and Tailwind CSS responsive flight controls and satellite map overlay.

---

## 🚀 Setup & Launch

### Quick Launch
```cmd
AeroSync_Launch.bat
```

### Manual Setup
```bash
# Install frontend packages
npm install

# Run telemetry listener
python listen.py

# Launch dashboard
npm run dev
```

Visit: `http://localhost:3000`

---

## 📄 License
MIT License © 2024 [Aadarsh Sinha](https://github.com/Monarch666).
