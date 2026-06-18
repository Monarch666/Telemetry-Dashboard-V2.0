"use client"

import { useEffect, useState, useRef } from "react"
import { GpsTracker } from "@/components/gps-tracker"
import { StatCard } from "@/components/stat-card"
import { MapPin, ArrowUp, Gauge, Navigation2 } from "lucide-react"

interface Pos {
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
}
interface GlobalPos {
  lat: number; lon: number; alt: number
  relative_alt: number; vx: number; vy: number; vz: number; hdg: number
}
interface Snap {
  localPos: Pos
  attitude: any
  globalPos: GlobalPos
  battery: any
  imu: any
  groundSpeed: number
  uptime: number
}

export default function PositionPage() {
  const [snaps, setSnaps] = useState<Snap[]>([])
  const [curr, setCurr] = useState<Snap | null>(null)
  const angleRef = useRef(0)
  const simRef = useRef({ x: 0, y: 0, z: -1.5, vx: 0.2, vy: 0.1, vz: 0, lat: 28_538_000, lon: 77_209_000, alt: 240_000, relAlt: 1500 })

  useEffect(() => {
    const tick = async () => {
      try {
        const [lp, gp] = await Promise.all([
          fetch(`/params/LOCAL_POSITION_NED.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
          fetch(`/params/GLOBAL_POSITION_INT.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        ])
        if (lp && gp) {
          const snap: Snap = {
            localPos: lp,
            attitude: { roll: 0, pitch: 0, yaw: 0, rollspeed: 0, pitchspeed: 0, yawspeed: 0 },
            globalPos: gp,
            battery: { battery_remaining: 80, voltages: [11800] },
            imu: {},
            groundSpeed: Math.sqrt(gp.vx ** 2 + gp.vy ** 2) / 100,
            uptime: 0,
          }
          setCurr(snap)
          setSnaps(p => [...p.slice(-119), snap])
          return
        }
      } catch {}

      // Sim
      angleRef.current += 0.04
      const s = simRef.current
      s.x = 6 * Math.sin(angleRef.current)
      s.y = 6 * Math.sin(angleRef.current * 2) * 0.45
      s.z = -1.5 - 0.5 * Math.abs(Math.sin(angleRef.current * 0.3))
      s.vx = 0.2 * Math.cos(angleRef.current)
      s.vy = 0.2 * Math.cos(angleRef.current * 2)
      s.lat += Math.floor(s.vy * 9)
      s.lon += Math.floor(s.vx * 9)
      s.relAlt = Math.floor(-s.z * 1000)

      const snap: Snap = {
        localPos: { x: s.x, y: s.y, z: s.z, vx: s.vx, vy: s.vy, vz: s.vz },
        attitude: { roll: 0, pitch: 0, yaw: Math.atan2(s.vy, s.vx), rollspeed: 0, pitchspeed: 0, yawspeed: 0 },
        globalPos: {
          lat: s.lat, lon: s.lon, alt: s.alt, relative_alt: s.relAlt,
          vx: Math.floor(s.vx * 100), vy: Math.floor(s.vy * 100), vz: 0,
          hdg: Math.round(((Math.atan2(s.vy, s.vx) + Math.PI) * 180) / Math.PI) % 360,
        },
        battery: { battery_remaining: 80, voltages: [11800] },
        imu: {},
        groundSpeed: Math.sqrt(s.vx ** 2 + s.vy ** 2),
        uptime: 0,
      }
      setCurr(snap)
      setSnaps(p => [...p.slice(-119), snap])
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const alt = curr ? (-curr.globalPos.relative_alt / 1000).toFixed(2) : "—"
  const spd = curr ? curr.groundSpeed.toFixed(2) : "—"
  const vspd = curr ? (-curr.localPos.vz).toFixed(2) : "—"
  const hdg = curr ? curr.globalPos.hdg : 0
  const latDeg = curr ? (curr.globalPos.lat / 1e7).toFixed(6) : "—"
  const lonDeg = curr ? (curr.globalPos.lon / 1e7).toFixed(6) : "—"

  return (
    <div className="flex flex-col gap-4 p-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide">Position & Navigation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">GPS coordinates, local NED position, and velocity vectors</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ArrowUp}    label="Altitude"      value={alt}  unit="m"   sub="AGL"          accentColor="amber" />
        <StatCard icon={Gauge}      label="Ground Speed"  value={spd}  unit="m/s" sub="horizontal"   accentColor="blue" />
        <StatCard icon={ArrowUp}    label="Vert Speed"    value={vspd} unit="m/s" sub="climb rate"   accentColor="purple" />
        <StatCard icon={Navigation2} label="Heading"      value={`${hdg}`} unit="°" sub="magnetic"  accentColor="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GPS Track */}
        <div className="as-panel">
          <div className="as-panel-header">
            <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
            <span className="as-panel-label">GPS Flight Track</span>
          </div>
          <div className="p-4" style={{ height: 340 }}>
            <GpsTracker history={snaps} />
          </div>
        </div>

        {/* Coordinates panel */}
        <div className="as-panel">
          <div className="as-panel-header">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span className="as-panel-label">Coordinates & Velocity</span>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: "Latitude",   value: `${latDeg}°`,  color: "text-amber-400" },
              { label: "Longitude",  value: `${lonDeg}°`,  color: "text-amber-400" },
              { label: "Altitude (MSL)", value: curr ? `${(curr.globalPos.alt / 1000).toFixed(1)} m` : "—", color: "text-blue-400" },
              { label: "Altitude (AGL)", value: `${alt} m`, color: "text-cyan-400" },
              { label: "Local X",    value: curr ? `${curr.localPos.x.toFixed(2)} m` : "—", color: "text-purple-400" },
              { label: "Local Y",    value: curr ? `${curr.localPos.y.toFixed(2)} m` : "—", color: "text-purple-400" },
              { label: "Local Z",    value: curr ? `${curr.localPos.z.toFixed(2)} m` : "—", color: "text-purple-400" },
              { label: "Vx",        value: curr ? `${curr.localPos.vx.toFixed(2)} m/s` : "—", color: "text-as-green" },
              { label: "Vy",        value: curr ? `${curr.localPos.vy.toFixed(2)} m/s` : "—", color: "text-as-green" },
              { label: "Vz",        value: curr ? `${curr.localPos.vz.toFixed(2)} m/s` : "—", color: "text-as-green" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-mono text-xs">{row.label}</span>
                <span className={`font-telem font-medium ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
