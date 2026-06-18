"use client"

import { useEffect, useState, useRef } from "react"
import { LiveCharts } from "@/components/live-charts"
import { TrendingUp, BarChart2, Activity, Clock } from "lucide-react"
import type { TelemetrySnapshot } from "@/components/telemetry-hub"

class ChartSim {
  tick = 0
  z = -1.5; altDir = 0.008; angle = 0
  bat = 82; voltage = 11800
  roll = 0; vx = 0.2; vy = 0.1

  next(): TelemetrySnapshot {
    this.tick++
    this.angle += 0.04
    this.vx = 0.2 * Math.cos(this.angle)
    this.vy = 0.15 * Math.sin(this.angle * 2)
    if (Math.random() > 0.88) this.altDir = Math.max(-0.02, Math.min(0.02, this.altDir + (Math.random() - 0.5) * 0.005))
    this.z = Math.min(-0.4, Math.max(-4, this.z + this.altDir))
    const tRoll = this.vy * 0.45
    this.roll = this.roll * 0.9 + tRoll * 0.1
    if (Math.random() > 0.97) { this.bat = Math.max(0, this.bat - 0.1); this.voltage -= 1 }
    const gs = Math.sqrt(this.vx ** 2 + this.vy ** 2)
    return {
      localPos: { x: 0, y: 0, z: this.z, vx: this.vx, vy: this.vy, vz: this.altDir },
      attitude: { roll: this.roll, pitch: 0, yaw: 0, rollspeed: 0, pitchspeed: 0, yawspeed: 0 },
      globalPos: { lat: 0, lon: 0, alt: 0, relative_alt: Math.floor(-this.z * 1000), vx: Math.floor(this.vx * 100), vy: Math.floor(this.vy * 100), vz: 0, hdg: 0 },
      battery: { battery_remaining: Math.floor(this.bat), voltages: [this.voltage] },
      imu: { xacc: 0, yacc: 0, zacc: -9.81, xgyro: 0, ygyro: 0, zgyro: 0 },
      groundSpeed: gs,
      uptime: this.tick,
    }
  }
}

export default function ChartsPage() {
  const [history, setHistory] = useState<TelemetrySnapshot[]>([])
  const sim = useRef(new ChartSim())

  useEffect(() => {
    // Pre-fill history
    const pre: TelemetrySnapshot[] = []
    for (let i = 0; i < 60; i++) pre.push(sim.current.next())
    setHistory(pre)

    const id = setInterval(() => {
      setHistory(h => [...h.slice(-299), sim.current.next()])
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const stats = [
    { label: "Max Altitude", value: history.length ? Math.max(...history.map(h => -h.globalPos.relative_alt / 1000)).toFixed(1) + " m" : "—", color: "text-amber-400" },
    { label: "Avg Speed",    value: history.length ? (history.reduce((s, h) => s + h.groundSpeed, 0) / history.length).toFixed(2) + " m/s" : "—", color: "text-blue-400" },
    { label: "Min Battery",  value: history.length ? Math.min(...history.map(h => h.battery.battery_remaining)) + "%" : "—", color: "text-as-green" },
    { label: "Data Points",  value: history.length.toString(), color: "text-purple-400" },
  ]

  return (
    <div className="flex flex-col gap-4 p-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide">Live Telemetry Charts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Time-series data visualization — last 60 data points shown</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Activity className="w-3.5 h-3.5" />
          <span>{history.length} samples @ 1 Hz</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="as-panel p-4 flex flex-col gap-1">
            <span className="telem-label">{s.label}</span>
            <span className={`font-telem text-xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Main charts */}
      <div className="as-panel">
        <div className="as-panel-header">
          <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
          <span className="as-panel-label">Real-Time Telemetry</span>
          <Clock className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
        </div>
        <div className="p-6">
          <LiveCharts history={history} />
        </div>
      </div>
    </div>
  )
}
