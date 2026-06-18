"use client"

import { useState, useEffect } from "react"
import type { TelemetrySnapshot } from "@/components/telemetry-hub"
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type AlertLevel = "info" | "warn" | "crit" | "ok"

interface Alert {
  id: number
  level: AlertLevel
  message: string
  ts: string
}

const LEVEL_STYLES: Record<AlertLevel, { icon: React.ElementType; color: string; bg: string }> = {
  info: { icon: Info,          color: "text-blue-400",      bg: "bg-blue-500/10" },
  warn: { icon: AlertTriangle, color: "text-amber-500",     bg: "bg-amber-500/10" },
  crit: { icon: XCircle,       color: "text-destructive",   bg: "bg-destructive/10" },
  ok:   { icon: CheckCircle,   color: "text-as-green",      bg: "bg-as-green/10" },
}

let alertId = 0

export function AlertFeed({ telem }: { telem: TelemetrySnapshot | null }) {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: alertId++, level: "ok",   message: "MAVLink connection established", ts: now() },
    { id: alertId++, level: "info", message: "GPS 3D fix acquired — 12 satellites", ts: now() },
    { id: alertId++, level: "info", message: "AHRS initialized", ts: now() },
  ])

  useEffect(() => {
    if (!telem) return
    const add = (level: AlertLevel, msg: string) => {
      setAlerts((prev) => [{ id: alertId++, level, message: msg, ts: now() }, ...prev].slice(0, 20))
    }

    if (telem.battery.battery_remaining < 20) {
      add("crit", `CRITICAL: Battery ${telem.battery.battery_remaining}% — RTL advised`)
    } else if (telem.battery.battery_remaining < 35) {
      add("warn", `Low battery: ${telem.battery.battery_remaining}%`)
    }

    const altM = -telem.globalPos.relative_alt / 1000
    if (altM > 3.5) add("warn", `Altitude ${altM.toFixed(1)}m exceeds geofence (3.5m)`)

    const rollDeg = Math.abs(telem.attitude.roll * 180 / Math.PI)
    if (rollDeg > 25) add("warn", `High roll angle: ${rollDeg.toFixed(1)}°`)

    const pitchDeg = Math.abs(telem.attitude.pitch * 180 / Math.PI)
    if (pitchDeg > 20) add("warn", `High pitch: ${pitchDeg.toFixed(1)}°`)

  }, [telem?.battery.battery_remaining, telem?.globalPos.relative_alt])

  return (
    <div className="as-panel flex flex-col flex-1">
      <div className="as-panel-header">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-live" />
        <span className="as-panel-label">Alerts</span>
        <span className="ml-auto text-xs font-mono text-muted-foreground">{alerts.length}</span>
      </div>
      <div className="divide-y divide-border overflow-y-auto max-h-[180px]">
        {alerts.map((a) => {
          const style = LEVEL_STYLES[a.level]
          return (
            <div key={a.id} className={cn("flex items-start gap-2 px-3 py-2 text-xs", style.bg)}>
              <style.icon className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", style.color)} />
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium leading-tight", style.color)}>{a.message}</p>
                <p suppressHydrationWarning className="text-muted-foreground font-mono text-[10px] mt-0.5">{a.ts}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function now() {
  return new Date().toTimeString().slice(0, 8)
}
