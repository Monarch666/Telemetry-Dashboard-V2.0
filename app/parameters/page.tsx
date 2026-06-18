"use client"

import { useEffect, useState } from "react"
import { Sliders, Search, RefreshCw, Download } from "lucide-react"

const PARAM_TYPES = [
  "LOCAL_POSITION_NED",
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
]

interface ParamData {
  type: string
  data: Record<string, unknown> | null
  status: "loading" | "live" | "error"
  lastUpdate: string
}

export default function ParametersPage() {
  const [params, setParams] = useState<ParamData[]>(
    PARAM_TYPES.map((t) => ({ type: t, data: null, status: "loading", lastUpdate: "—" }))
  )
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  const fetchAll = async () => {
    const results = await Promise.all(
      PARAM_TYPES.map(async (t) => {
        try {
          const r = await fetch(`/params/${t}.json?t=${Date.now()}`)
          if (r.ok) {
            const data = await r.json()
            return { type: t, data, status: "live" as const, lastUpdate: new Date().toTimeString().slice(0, 8) }
          }
        } catch {}
        // Return demo data for development
        return { type: t, data: getDemoData(t), status: "error" as const, lastUpdate: new Date().toTimeString().slice(0, 8) }
      })
    )
    setParams(results)
  }

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 2000)
    return () => clearInterval(id)
  }, [])

  const exportJson = () => {
    const out = Object.fromEntries(params.filter(p => p.data).map(p => [p.type, p.data]))
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `aerosync-params-${Date.now()}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = params.filter((p) =>
    p.type.toLowerCase().includes(search.toLowerCase())
  )
  const selectedParam = params.find(p => p.type === selected)

  return (
    <div className="flex flex-col gap-4 p-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide">Flight Parameters</h1>
          <p className="text-sm text-muted-foreground mt-0.5">MAVLink telemetry parameters — live from vehicle</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={exportJson} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search parameter types…"
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50 font-mono"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Parameter list */}
        <div className="as-panel lg:col-span-1">
          <div className="as-panel-header">
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span className="as-panel-label">Parameter Types</span>
            <span className="ml-auto text-xs font-mono text-muted-foreground">{filtered.length}</span>
          </div>
          <div className="divide-y divide-border/50">
            {filtered.map((p) => (
              <button
                key={p.type}
                onClick={() => setSelected(p.type === selected ? null : p.type)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30 ${selected === p.type ? "bg-amber-500/8 border-l-2 border-amber-500" : ""}`}
              >
                <div>
                  <p className="text-xs font-mono font-medium text-foreground">{p.type}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.lastUpdate}</p>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === "live" ? "bg-as-green animate-pulse-live" : "bg-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="as-panel lg:col-span-2">
          <div className="as-panel-header">
            <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
            <span className="as-panel-label">
              {selectedParam ? selectedParam.type : "Select a parameter"}
            </span>
            {selectedParam && (
              <span className={`ml-auto text-xs font-mono ${selectedParam.status === "live" ? "text-as-green" : "text-muted-foreground"}`}>
                {selectedParam.status === "live" ? "LIVE" : "DEMO"}
              </span>
            )}
          </div>
          {!selectedParam ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <Sliders className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select a parameter type to view its data</p>
            </div>
          ) : !selectedParam.data ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No data available</div>
          ) : (
            <div className="p-4 overflow-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-muted-foreground py-2 pr-6 font-medium">Field</th>
                    <th className="text-right text-muted-foreground py-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedParam.data).map(([k, v]) => (
                    <tr key={k} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="py-2 pr-6 text-muted-foreground">{k}</td>
                      <td className="py-2 text-right font-medium text-amber-400">
                        {typeof v === "number" ? v.toFixed(4) : String(v)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getDemoData(type: string): Record<string, number> {
  const now = Date.now() / 1000
  const demos: Record<string, Record<string, number>> = {
    ATTITUDE:    { roll: 0.023, pitch: -0.009, yaw: 1.234, rollspeed: 0.001, pitchspeed: 0.0, yawspeed: 0.002, time_boot_ms: Math.floor(now * 1000) },
    HEARTBEAT:   { type: 2, autopilot: 3, base_mode: 89, system_status: 4, mavlink_version: 3 },
    BATTERY_STATUS: { id: 0, battery_function: 0, type: 0, temperature: 2500, voltages: 11800, current_battery: 3200, current_consumed: 1240, energy_consumed: -1, battery_remaining: 78 },
    GLOBAL_POSITION_INT: { lat: 28538000, lon: 77209000, alt: 240000, relative_alt: 1500, vx: 20, vy: 10, vz: 0, hdg: 45 },
    LOCAL_POSITION_NED:  { time_boot_ms: Math.floor(now * 1000), x: 1.23, y: -0.45, z: -1.5, vx: 0.2, vy: 0.1, vz: 0, ax: 0, ay: 0, az: 0 },
    RAW_IMU:     { time_usec: Math.floor(now * 1e6), xacc: -24, yacc: 12, zacc: -9814, xgyro: 3, ygyro: -2, zgyro: 1, xmag: 210, ymag: -89, zmag: -483 },
    RANGEFINDER: { distance: 1.52, voltage: 0 },
  }
  return demos[type] ?? { value: Math.random().toFixed(4) }
}
