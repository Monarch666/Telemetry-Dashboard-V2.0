"use client"

import { useState, useEffect } from "react"
import { Wifi } from "lucide-react"

interface BarProps { strength: number; color: string }

function SignalBars({ bars, color }: { bars: number; color: string }) {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[1, 2, 3, 4, 5].map((b) => (
        <div
          key={b}
          className="w-2 rounded-sm transition-all duration-300"
          style={{
            height: `${(b / 5) * 100}%`,
            background: b <= bars ? color : "hsl(220 18% 22%)",
          }}
        />
      ))}
    </div>
  )
}

export function SignalStatus() {
  const [rssi, setRssi] = useState(78)
  const [snr, setSnr] = useState(24)
  const [dropPct, setDropPct] = useState(0.8)

  useEffect(() => {
    const id = setInterval(() => {
      setRssi((v) => Math.max(30, Math.min(99, v + (Math.random() - 0.5) * 3)))
      setSnr((v) => Math.max(8, Math.min(35, v + (Math.random() - 0.5) * 1.5)))
      setDropPct((v) => Math.max(0, Math.min(5, v + (Math.random() - 0.5) * 0.2)))
    }, 1200)
    return () => clearInterval(id)
  }, [])

  const bars = rssi > 85 ? 5 : rssi > 70 ? 4 : rssi > 55 ? 3 : rssi > 40 ? 2 : 1
  const barColor =
    bars >= 4 ? "hsl(142 65% 42%)" : bars === 3 ? "hsl(42 96% 56%)" : "hsl(16 88% 54%)"

  const rows = [
    { label: "RSSI",       value: `${rssi.toFixed(0)} dBm`,  color: barColor },
    { label: "SNR",        value: `${snr.toFixed(0)} dB`,    color: "hsl(210 90% 60%)" },
    { label: "Packet drop",value: `${dropPct.toFixed(1)}%`,  color: dropPct > 2 ? "hsl(16 88% 54%)" : "hsl(142 65% 42%)" },
    { label: "Link",       value: "57600 baud",              color: "hsl(215 14% 60%)" },
    { label: "Protocol",   value: "MAVLink 2.0",             color: "hsl(215 14% 60%)" },
  ]

  return (
    <div className="as-panel">
      <div className="as-panel-header">
        <Wifi className="w-3.5 h-3.5 text-as-green" />
        <span className="as-panel-label">Signal Status</span>
        <SignalBars bars={bars} color={barColor} />
      </div>
      <div className="p-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono">{r.label}</span>
            <span className="font-mono font-medium" style={{ color: r.color }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
