"use client"

import { useState, useEffect } from "react"
import type { TelemetrySnapshot } from "@/components/telemetry-hub"
import { cn } from "@/lib/utils"

interface LogEntry {
  id: number
  ts: string
  type: string
  message: string
  color: string
}

let eid = 0

const BOOT_EVENTS: LogEntry[] = [
  { id: eid++, ts: ts(), type: "SYS",  message: "AeroSync telemetry initialized",           color: "text-muted-foreground" },
  { id: eid++, ts: ts(), type: "MAV",  message: "MAVLink heartbeat received",                color: "text-as-green" },
  { id: eid++, ts: ts(), type: "GPS",  message: "GPS lock acquired — HDOP 0.9 — 12 SV",    color: "text-as-green" },
  { id: eid++, ts: ts(), type: "AHRS", message: "AHRS converged — attitude valid",           color: "text-as-green" },
  { id: eid++, ts: ts(), type: "BAT",  message: "Battery monitor active — 11.8V",            color: "text-as-green" },
  { id: eid++, ts: ts(), type: "RC",   message: "RC input detected — 8 channels",            color: "text-amber-500" },
]

function ts() {
  return new Date().toTimeString().slice(0, 8)
}

export function FlightEventLog({ telem }: { telem: TelemetrySnapshot | null }) {
  const [log, setLog] = useState<LogEntry[]>(BOOT_EVENTS)

  // Periodic synthetic events
  useEffect(() => {
    const EVENTS = [
      { type: "IMU",  message: "IMU calibration check passed",          color: "text-muted-foreground" },
      { type: "BARO", message: "Barometer datum updated",                color: "text-muted-foreground" },
      { type: "MAG",  message: "Compass health OK",                      color: "text-muted-foreground" },
      { type: "EKF",  message: "EKF innovation within bounds",           color: "text-muted-foreground" },
      { type: "RC",   message: "RC failsafe check passed",               color: "text-as-green" },
    ]
    let idx = 0
    const id = setInterval(() => {
      const e = EVENTS[idx % EVENTS.length]
      setLog((prev) => [{ id: eid++, ts: ts(), ...e }, ...prev].slice(0, 80))
      idx++
    }, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="overflow-auto max-h-[160px]">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-muted-foreground py-1 pr-4 w-16">Time</th>
            <th className="text-left text-muted-foreground py-1 pr-4 w-12">Type</th>
            <th className="text-left text-muted-foreground py-1">Message</th>
          </tr>
        </thead>
        <tbody>
          {log.map((e) => (
            <tr key={e.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
              <td suppressHydrationWarning className="py-1 pr-4 text-muted-foreground">{e.ts}</td>
              <td className={cn("py-1 pr-4 font-semibold", e.color)}>{e.type}</td>
              <td className="py-1 text-foreground/80">{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
