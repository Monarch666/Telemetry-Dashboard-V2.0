"use client"

import { useEffect, useRef } from "react"
import type { TelemetrySnapshot } from "@/components/telemetry-hub"

interface GpsTrackerProps {
  history: TelemetrySnapshot[]
}

export function GpsTracker({ history }: GpsTrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Grid backdrop
    ctx.strokeStyle = "hsl(220 18% 18% / 0.5)"
    ctx.lineWidth = 0.5
    const step = 40
    for (let x = 0; x <= W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y <= H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    if (history.length < 2) {
      ctx.font = "12px 'Inter', sans-serif"
      ctx.fillStyle = "hsl(215 14% 40%)"
      ctx.textAlign = "center"
      ctx.fillText("Acquiring GPS…", W / 2, H / 2)
      return
    }

    // Normalize track to canvas
    const lats = history.map((h) => h.localPos.x)
    const lons = history.map((h) => h.localPos.y)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const rangeX = maxLon - minLon || 1
    const rangeY = maxLat - minLat || 1
    const pad = 28

    const toCanvas = (x: number, y: number) => ({
      cx: pad + ((y - minLon) / rangeX) * (W - pad * 2),
      cy: H - pad - ((x - minLat) / rangeY) * (H - pad * 2),
    })

    // Draw track with color gradient (age)
    for (let i = 1; i < history.length; i++) {
      const prev = toCanvas(history[i - 1].localPos.x, history[i - 1].localPos.y)
      const curr = toCanvas(history[i].localPos.x, history[i].localPos.y)
      const t = i / history.length
      ctx.beginPath()
      ctx.moveTo(prev.cx, prev.cy)
      ctx.lineTo(curr.cx, curr.cy)
      ctx.strokeStyle = `hsl(${42 + t * 100} ${60 + t * 36}% ${45 + t * 15}% / ${0.3 + t * 0.7})`
      ctx.lineWidth = 1.5 + t * 1.5
      ctx.stroke()
    }

    // Current position
    const last = history[history.length - 1]
    const { cx: px, cy: py } = toCanvas(last.localPos.x, last.localPos.y)

    // Pulse rings
    ctx.beginPath()
    ctx.arc(px, py, 14, 0, Math.PI * 2)
    ctx.fillStyle = "hsl(142 65% 42% / 0.1)"
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px, py, 9, 0, Math.PI * 2)
    ctx.fillStyle = "hsl(142 65% 42% / 0.2)"
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fillStyle = "hsl(142 65% 42%)"
    ctx.fill()

    // Heading arrow
    const hdgRad = (last.globalPos.hdg * Math.PI) / 180
    const arrLen = 18
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + Math.sin(hdgRad) * arrLen, py - Math.cos(hdgRad) * arrLen)
    ctx.strokeStyle = "hsl(42 96% 56%)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Start point marker
    if (history.length > 5) {
      const first = history[0]
      const { cx: fx, cy: fy } = toCanvas(first.localPos.x, first.localPos.y)
      ctx.beginPath()
      ctx.arc(fx, fy, 4, 0, Math.PI * 2)
      ctx.fillStyle = "hsl(210 90% 60%)"
      ctx.fill()
    }

    // Labels
    ctx.font = "9px 'JetBrains Mono', monospace"
    ctx.fillStyle = "hsl(215 14% 42%)"
    ctx.textAlign = "left"
    ctx.fillText(`X: ${last.localPos.x.toFixed(1)}m`, 4, H - 16)
    ctx.fillText(`Y: ${last.localPos.y.toFixed(1)}m`, 4, H - 6)
    ctx.textAlign = "right"
    ctx.fillText(`${history.length} pts`, W - 4, H - 6)

  }, [history])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={220}
      className="w-full h-full"
      style={{ maxWidth: "100%", maxHeight: "100%" }}
    />
  )
}
