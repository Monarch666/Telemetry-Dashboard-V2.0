"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import type { TelemetrySnapshot } from "@/components/telemetry-hub"

interface LiveChartsProps {
  history: TelemetrySnapshot[]
}

const CHARTS = [
  {
    key: "altitude",
    label: "Altitude (m)",
    color: "hsl(42 96% 56%)",
    getValue: (s: TelemetrySnapshot) =>
      parseFloat((-s.globalPos.relative_alt / 1000).toFixed(2)),
  },
  {
    key: "speed",
    label: "Ground Speed (m/s)",
    color: "hsl(210 90% 60%)",
    getValue: (s: TelemetrySnapshot) => parseFloat(s.groundSpeed.toFixed(2)),
  },
  {
    key: "battery",
    label: "Battery (%)",
    color: "hsl(142 65% 42%)",
    getValue: (s: TelemetrySnapshot) => s.battery.battery_remaining,
  },
  {
    key: "roll",
    label: "Roll (°)",
    color: "hsl(265 70% 60%)",
    getValue: (s: TelemetrySnapshot) =>
      parseFloat((s.attitude.roll * 180 / Math.PI).toFixed(1)),
  },
]

export function LiveCharts({ history }: LiveChartsProps) {
  const data = history.slice(-60).map((snap, i) => ({
    t: i,
    altitude: CHARTS[0].getValue(snap),
    speed: CHARTS[1].getValue(snap),
    battery: CHARTS[2].getValue(snap),
    roll: CHARTS[3].getValue(snap),
  }))

  return (
    <div className="grid grid-cols-2 gap-4">
      {CHARTS.map((chart) => (
        <div key={chart.key}>
          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wide">
            {chart.label}
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis dataKey="t" hide />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 9, fill: "hsl(215 14% 46%)", fontFamily: "JetBrains Mono" }}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220 24% 10%)",
                  border: "1px solid hsl(220 18% 18%)",
                  borderRadius: 6,
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                  color: chart.color,
                }}
                itemStyle={{ color: chart.color }}
                labelFormatter={() => ""}
                formatter={(val: number) => [val, chart.label]}
              />
              <Line
                type="monotone"
                dataKey={chart.key}
                stroke={chart.color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
