"use client"

import { useEffect, useState, useRef } from "react"
import { ArtificialHorizon } from "@/components/artificial-horizon"
import { CompassRose } from "@/components/compass-rose"
import { StatCard } from "@/components/stat-card"
import { Navigation2, RotateCcw, ArrowUpDown, Gauge } from "lucide-react"

/* ── Attitude simulator ─────────────────────────────────────────────────────── */
class AttSim {
  roll = 0; pitch = 0; yaw = 0
  rollspeed = 0; pitchspeed = 0; yawspeed = 0
  angle = 0

  tick() {
    this.angle += 0.04
    const tr = 0.22 * Math.sin(this.angle)
    const tp = 0.12 * Math.sin(this.angle * 1.3)
    const ty = this.angle * 0.25
    this.roll  = this.roll * 0.92 + tr * 0.08
    this.pitch = this.pitch * 0.92 + tp * 0.08
    this.rollspeed = tr - this.roll
    this.pitchspeed = tp - this.pitch
    this.yaw = ty % (Math.PI * 2)
    this.yawspeed = 0.01
    return {
      roll: this.roll, pitch: this.pitch, yaw: this.yaw,
      rollspeed: this.rollspeed, pitchspeed: this.pitchspeed, yawspeed: this.yawspeed,
    }
  }
}

export default function AttitudePage() {
  const [att, setAtt] = useState({ roll: 0, pitch: 0, yaw: 0, rollspeed: 0, pitchspeed: 0, yawspeed: 0 })
  const sim = useRef(new AttSim())

  useEffect(() => {
    const fetchAtt = async () => {
      try {
        const r = await fetch(`/params/ATTITUDE.json?t=${Date.now()}`)
        if (r.ok) { setAtt(await r.json()); return }
      } catch {}
      setAtt(sim.current.tick())
    }
    fetchAtt()
    const id = setInterval(fetchAtt, 250)
    return () => clearInterval(id)
  }, [])

  const r = (att.roll * 180 / Math.PI).toFixed(2)
  const p = (att.pitch * 180 / Math.PI).toFixed(2)
  const y = ((att.yaw * 180 / Math.PI) + 180).toFixed(1)
  const rs = (att.rollspeed * 180 / Math.PI).toFixed(3)
  const ps = (att.pitchspeed * 180 / Math.PI).toFixed(3)
  const ys = (att.yawspeed * 180 / Math.PI).toFixed(3)
  const hdg = Math.round(((att.yaw + Math.PI) * 180) / Math.PI) % 360

  return (
    <div className="flex flex-col gap-4 p-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide">Attitude & Heading</h1>
        <p className="text-sm text-muted-foreground mt-0.5">3D orientation monitoring — Roll · Pitch · Yaw</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={RotateCcw}  label="Roll"       value={r}  unit="°" sub={`${rs} °/s`}  accentColor="amber"  className="lg:col-span-2" />
        <StatCard icon={ArrowUpDown} label="Pitch"     value={p}  unit="°" sub={`${ps} °/s`}  accentColor="cyan"   className="lg:col-span-2" />
        <StatCard icon={Navigation2} label="Yaw"       value={y}  unit="°" sub={`${ys} °/s`}  accentColor="purple" className="lg:col-span-2" />
      </div>

      {/* Main panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="as-panel">
          <div className="as-panel-header">
            <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
            <span className="as-panel-label">Artificial Horizon (HUD)</span>
          </div>
          <div className="p-6 flex items-center justify-center" style={{ height: 380 }}>
            <ArtificialHorizon roll={att.roll} pitch={att.pitch} />
          </div>
        </div>

        <div className="as-panel">
          <div className="as-panel-header">
            <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
            <span className="as-panel-label">Heading Compass</span>
          </div>
          <div className="p-6 flex items-center justify-center" style={{ height: 380 }}>
            <CompassRose heading={hdg} />
          </div>
        </div>
      </div>

      {/* Angular rates */}
      <div className="as-panel">
        <div className="as-panel-header">
          <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
          <span className="as-panel-label">Angular Rate Data</span>
        </div>
        <div className="p-4 grid grid-cols-3 gap-4">
          {[
            { label: "Roll Rate",  value: rs, color: "text-amber-500" },
            { label: "Pitch Rate", value: ps, color: "text-cyan-400" },
            { label: "Yaw Rate",   value: ys, color: "text-purple-400" },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1 rounded-lg border border-border bg-muted/20 p-4">
              <span className="telem-label">{row.label}</span>
              <span className={`font-telem text-2xl font-semibold ${row.color}`}>{row.value}</span>
              <span className="telem-unit">°/s</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
