"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { StatCard } from "@/components/stat-card"
import { ArtificialHorizon } from "@/components/artificial-horizon"
import { CompassRose } from "@/components/compass-rose"
import { LiveCharts } from "@/components/live-charts"
import { AlertFeed } from "@/components/alert-feed"
import { GpsTracker } from "@/components/gps-tracker"
import { SignalStatus } from "@/components/signal-status"
import { FlightEventLog } from "@/components/flight-event-log"
import {
  ArrowUp,
  Gauge,
  Battery,
  Navigation2,
  Wind,
  Thermometer,
  Cpu,
  Clock,
} from "lucide-react"

/* ── Data simulator (original logic, new class) ────────────────────────────── */
class TelemetrySim {
  // Position (NED frame)
  x = 0; y = 0; z = -1.5
  vx = 0.2; vy = 0.1; vz = 0

  // Attitude
  roll = 0; pitch = 0; yaw = 0
  rollspeed = 0; pitchspeed = 0; yawspeed = 0

  // Global GPS
  lat = 28_538_000; lon = 77_209_000
  alt = 240_000; relAlt = 1500

  // Battery
  pct = 82; voltage = 11_800

  // IMU
  accX = 0; accY = 0; accZ = -9.81
  gyrX = 0; gyrY = 0; gyrZ = 0

  // Pattern
  angle = 0; radius = 6
  altDir = 0.008
  uptime = 0

  tick() {
    this.uptime += 1
    this.angle += 0.04

    const tx = this.radius * Math.sin(this.angle)
    const ty = this.radius * Math.sin(this.angle * 2) * 0.45

    this.x = this.x * 0.96 + tx * 0.04
    this.y = this.y * 0.96 + ty * 0.04
    this.vx = (tx - this.x) * 2.2
    this.vy = (ty - this.y) * 2.2

    if (Math.random() > 0.88)
      this.altDir = Math.max(-0.025, Math.min(0.025, this.altDir + (Math.random() - 0.5) * 0.006))
    this.z = Math.min(-0.4, Math.max(-4, this.z + this.altDir))
    this.vz = this.altDir

    const tRoll = this.vy * 0.45
    this.roll = this.roll * 0.9 + tRoll * 0.1
    this.rollspeed = tRoll - this.roll

    const tPitch = -this.vx * 0.28
    this.pitch = this.pitch * 0.9 + tPitch * 0.1
    this.pitchspeed = tPitch - this.pitch

    const tYaw = Math.atan2(this.vy, this.vx)
    let dYaw = tYaw - this.yaw
    if (dYaw > Math.PI) dYaw -= 2 * Math.PI
    if (dYaw < -Math.PI) dYaw += 2 * Math.PI
    this.yawspeed = dYaw * 0.08
    this.yaw += this.yawspeed
    if (this.yaw > Math.PI) this.yaw -= 2 * Math.PI
    if (this.yaw < -Math.PI) this.yaw += 2 * Math.PI

    this.lat += Math.floor(this.vy * 9)
    this.lon += Math.floor(this.vx * 9)
    this.relAlt = Math.floor(-this.z * 1000)
    this.alt = 240_000 + this.relAlt

    if (Math.random() > 0.96) {
      this.pct = Math.max(0, this.pct - 0.08)
      this.voltage = Math.max(10_000, this.voltage - 1)
    }

    // IMU noise
    this.accX = this.vx * 0.3 + (Math.random() - 0.5) * 0.08
    this.accY = this.vy * 0.3 + (Math.random() - 0.5) * 0.08
    this.accZ = -9.81 + (Math.random() - 0.5) * 0.04
    this.gyrX = this.rollspeed + (Math.random() - 0.5) * 0.005
    this.gyrY = this.pitchspeed + (Math.random() - 0.5) * 0.005
    this.gyrZ = this.yawspeed + (Math.random() - 0.5) * 0.005

    return this.snapshot()
  }

  snapshot() {
    const groundSpeed = Math.sqrt(this.vx ** 2 + this.vy ** 2)
    const hdg = Math.round(((this.yaw + Math.PI) * 180) / Math.PI) % 360
    return {
      localPos: { x: this.x, y: this.y, z: this.z, vx: this.vx, vy: this.vy, vz: this.vz },
      attitude: {
        roll: this.roll, pitch: this.pitch, yaw: this.yaw,
        rollspeed: this.rollspeed, pitchspeed: this.pitchspeed, yawspeed: this.yawspeed,
      },
      globalPos: {
        lat: this.lat, lon: this.lon, alt: this.alt,
        relative_alt: this.relAlt,
        vx: Math.floor(this.vx * 100),
        vy: Math.floor(this.vy * 100),
        vz: Math.floor(this.vz * 100),
        hdg,
      },
      battery: { battery_remaining: Math.floor(this.pct), voltages: [this.voltage] },
      imu: {
        xacc: this.accX, yacc: this.accY, zacc: this.accZ,
        xgyro: this.gyrX, ygyro: this.gyrY, zgyro: this.gyrZ,
      },
      groundSpeed,
      uptime: this.uptime,
    }
  }
}

export type TelemetrySnapshot = ReturnType<TelemetrySim["snapshot"]>

/* ── Helper: fetch or fall back to sim ─────────────────────────────────────── */
async function fetchJson(url: string): Promise<any | null> {
  try {
    const r = await fetch(url + `?t=${Date.now()}`)
    return r.ok ? r.json() : null
  } catch {
    return null
  }
}

/* ── Main hub component ─────────────────────────────────────────────────────── */
export function TelemetryHub() {
  const [telem, setTelem] = useState<TelemetrySnapshot | null>(null)
  const [history, setHistory] = useState<TelemetrySnapshot[]>([])
  const sim = useRef(new TelemetrySim())

  const fetchAll = useCallback(async () => {
    const [lp, att, bat, gp] = await Promise.all([
      fetchJson("/params/LOCAL_POSITION_NED.json"),
      fetchJson("/params/ATTITUDE.json"),
      fetchJson("/params/BATTERY_STATUS.json"),
      fetchJson("/params/GLOBAL_POSITION_INT.json"),
    ])

    let snap: TelemetrySnapshot
    if (lp && att && bat && gp) {
      snap = {
        localPos: lp,
        attitude: att,
        globalPos: gp,
        battery: bat,
        imu: { xacc: 0, yacc: 0, zacc: -9.81, xgyro: 0, ygyro: 0, zgyro: 0 },
        groundSpeed: Math.sqrt(gp.vx ** 2 + gp.vy ** 2) / 100,
        uptime: sim.current.uptime,
      }
      sim.current.uptime += 1
    } else {
      snap = sim.current.tick()
    }

    setTelem(snap)
    setHistory((prev) => [...prev.slice(-119), snap])
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 1000)
    return () => clearInterval(id)
  }, [fetchAll])

  const altM = telem ? (-telem.globalPos.relative_alt / 1000).toFixed(2) : "—"
  const spd = telem ? telem.groundSpeed.toFixed(2) : "—"
  const batPct = telem ? telem.battery.battery_remaining : 0
  const volts = telem ? (telem.battery.voltages[0] / 1000).toFixed(1) : "—"
  const rollDeg = telem ? (telem.attitude.roll * 180 / Math.PI).toFixed(1) : "—"
  const pitchDeg = telem ? (telem.attitude.pitch * 180 / Math.PI).toFixed(1) : "—"
  const yawDeg = telem ? (telem.attitude.yaw * 180 / Math.PI + 180).toFixed(0) : "—"
  const hdg = telem ? telem.globalPos.hdg : 0
  const vertSpeed = telem ? (-telem.localPos.vz).toFixed(2) : "—"

  return (
    <div className="flex flex-col gap-4 p-6 animate-fade-up">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-foreground">
            Telemetry Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time UAV flight data · MAVLink Protocol 2.0
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            UP {telem ? formatUptime(telem.uptime) : "00:00"}
          </span>
          <span className="ml-2 px-2 py-0.5 rounded border border-as-green/30 bg-as-green/10 text-as-green font-semibold">
            LIVE
          </span>
        </div>
      </div>

      {/* ── Stat cards row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard
          icon={ArrowUp}
          label="Altitude"
          value={altM}
          unit="m"
          sub="above home"
          accentColor="amber"
          className="xl:col-span-2"
        />
        <StatCard
          icon={Gauge}
          label="Ground Speed"
          value={spd}
          unit="m/s"
          sub={telem ? `${(telem.groundSpeed * 3.6).toFixed(1)} km/h` : ""}
          accentColor="blue"
          className="xl:col-span-2"
        />
        <StatCard
          icon={Battery}
          label="Battery"
          value={`${batPct}`}
          unit="%"
          sub={`${volts} V`}
          accentColor={batPct < 20 ? "red" : batPct < 40 ? "amber" : "green"}
          className="xl:col-span-2"
        />
        <StatCard
          icon={Navigation2}
          label="Heading"
          value={yawDeg}
          unit="°"
          sub="magnetic"
          accentColor="cyan"
          className="xl:col-span-2"
        />
        <StatCard
          icon={Wind}
          label="Vert Speed"
          value={vertSpeed}
          unit="m/s"
          sub="climb rate"
          accentColor="purple"
          className="xl:col-span-2"
        />
        <StatCard
          icon={Thermometer}
          label="Roll"
          value={rollDeg}
          unit="°"
          sub={`Pitch ${pitchDeg}°`}
          accentColor="amber"
          className="xl:col-span-2"
        />
        <StatCard
          icon={Cpu}
          label="Satellites"
          value="12"
          unit="sv"
          sub="3D Fix · HDOP 0.9"
          accentColor="green"
          className="xl:col-span-2"
        />
        <StatCard
          icon={Gauge}
          label="Mode"
          value="STAB"
          unit=""
          sub="ARMED"
          accentColor="amber"
          className="xl:col-span-2"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Artificial Horizon */}
        <div className="as-panel">
          <div className="as-panel-header">
            <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
            <span className="as-panel-label">Artificial Horizon</span>
          </div>
          <div className="p-4 flex items-center justify-center" style={{ height: 280 }}>
            <ArtificialHorizon
              roll={telem?.attitude.roll ?? 0}
              pitch={telem?.attitude.pitch ?? 0}
            />
          </div>
        </div>

        {/* Compass rose */}
        <div className="as-panel">
          <div className="as-panel-header">
            <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
            <span className="as-panel-label">Heading Compass</span>
          </div>
          <div className="p-4 flex items-center justify-center" style={{ height: 280 }}>
            <CompassRose heading={hdg} />
          </div>
        </div>

        {/* GPS Tracker */}
        <div className="as-panel">
          <div className="as-panel-header">
            <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
            <span className="as-panel-label">GPS Track</span>
          </div>
          <div className="p-4" style={{ height: 280 }}>
            <GpsTracker history={history} />
          </div>
        </div>
      </div>

      {/* ── Charts + Signal + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 as-panel">
          <div className="as-panel-header">
            <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
            <span className="as-panel-label">Live Telemetry Charts</span>
          </div>
          <div className="p-4">
            <LiveCharts history={history} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SignalStatus />
          <AlertFeed telem={telem} />
        </div>
      </div>

      {/* ── Event log ── */}
      <div className="as-panel">
        <div className="as-panel-header">
          <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
          <span className="as-panel-label">Flight Event Log</span>
        </div>
        <div className="p-4">
          <FlightEventLog telem={telem} />
        </div>
      </div>
    </div>
  )
}

function formatUptime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
