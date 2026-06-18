"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle, XCircle, Info, Bell, BellOff } from "lucide-react"
import { cn } from "@/lib/utils"

type Level = "info" | "warn" | "crit" | "ok"

interface AlertEntry {
  id: number
  level: Level
  title: string
  message: string
  ts: string
  acknowledged: boolean
}

let aid = 0

const INITIAL: AlertEntry[] = [
  { id: aid++, level: "ok",   title: "System Ready",        message: "All sensors initialized and online",                acknowledged: false, ts: "10:30:00" },
  { id: aid++, level: "ok",   title: "GPS Acquired",        message: "3D fix — HDOP 0.9 — 12 satellites",               acknowledged: false, ts: "10:30:01" },
  { id: aid++, level: "info", title: "EKF Initialized",     message: "Extended Kalman Filter convergence complete",      acknowledged: false, ts: "10:30:02" },
  { id: aid++, level: "info", title: "RC Link Active",       message: "8-channel RC input detected — SBUS",              acknowledged: false, ts: "10:30:03" },
  { id: aid++, level: "warn", title: "RC Latency",          message: "RC input latency elevated: 45ms",                  acknowledged: false, ts: "10:31:12" },
  { id: aid++, level: "warn", title: "Altitude Geofence",   message: "Vehicle exceeded 3.5m soft limit",                 acknowledged: false, ts: "10:32:44" },
  { id: aid++, level: "crit", title: "Battery Warning",     message: "Battery below 30% — recommend RTL",                acknowledged: false, ts: "10:33:55" },
]

const LEVEL_CONFIG: Record<Level, { icon: React.ElementType; label: string; headerBg: string; border: string; iconColor: string }> = {
  info: { icon: Info,          label: "INFO",     headerBg: "bg-blue-500/10",    border: "border-blue-500/25",    iconColor: "text-blue-400" },
  warn: { icon: AlertTriangle, label: "WARNING",  headerBg: "bg-amber-500/10",   border: "border-amber-500/25",   iconColor: "text-amber-500" },
  crit: { icon: XCircle,       label: "CRITICAL", headerBg: "bg-destructive/10", border: "border-destructive/25", iconColor: "text-destructive" },
  ok:   { icon: CheckCircle,   label: "OK",       headerBg: "bg-as-green/10",    border: "border-as-green/25",    iconColor: "text-as-green" },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertEntry[]>(INITIAL)
  const [filter, setFilter] = useState<Level | "all">("all")

  const ack = (id: number) => setAlerts(a => a.map(x => x.id === id ? { ...x, acknowledged: true } : x))
  const ackAll = () => setAlerts(a => a.map(x => ({ ...x, acknowledged: true })))
  const clear = () => setAlerts([])

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.level === filter)
  const counts: Record<Level, number> = { info: 0, warn: 0, crit: 0, ok: 0 }
  alerts.forEach(a => counts[a.level]++)

  return (
    <div className="flex flex-col gap-4 p-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide">Alerts & Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Flight safety alerts and system notifications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={ackAll} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted transition-colors">
            <Bell className="w-3.5 h-3.5" /> Acknowledge All
          </button>
          <button onClick={clear} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted transition-colors">
            <BellOff className="w-3.5 h-3.5" /> Clear Log
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {(["crit", "warn", "info", "ok"] as Level[]).map((lvl) => {
          const c = LEVEL_CONFIG[lvl]
          return (
            <button
              key={lvl}
              onClick={() => setFilter(filter === lvl ? "all" : lvl)}
              className={cn(
                "rounded-lg border p-3 text-left transition-all flex items-center gap-3",
                c.border, c.headerBg,
                filter === lvl ? "ring-1 ring-offset-1 ring-offset-background" : ""
              )}
              style={filter === lvl ? { ringColor: "currentColor" } : {}}
            >
              <c.icon className={cn("w-5 h-5", c.iconColor)} />
              <div>
                <p className={cn("font-display font-bold text-lg leading-none", c.iconColor)}>{counts[lvl]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Alert list */}
      <div className="as-panel">
        <div className="as-panel-header">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-live" />
          <span className="as-panel-label">Alert Log</span>
          <span className="ml-auto text-xs font-mono text-muted-foreground">{filtered.length} entries</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No alerts</div>
          )}
          {filtered.map((a) => {
            const c = LEVEL_CONFIG[a.level]
            return (
              <div key={a.id} className={cn("flex items-start gap-3 px-4 py-3 transition-colors", a.acknowledged ? "opacity-50" : "")}>
                <c.icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", c.iconColor)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold font-display tracking-wide", c.iconColor)}>{c.label}</span>
                    <span className="text-sm font-medium text-foreground">{a.title}</span>
                    {a.acknowledged && <span className="text-xs text-muted-foreground ml-auto">ACK</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-mono text-muted-foreground">{a.ts}</span>
                  {!a.acknowledged && (
                    <button
                      onClick={() => ack(a.id)}
                      className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
                    >
                      ACK
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
