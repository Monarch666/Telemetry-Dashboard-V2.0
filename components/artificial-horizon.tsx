"use client"

import { useEffect, useRef } from "react"

interface ArtificialHorizonProps {
  roll: number   // radians
  pitch: number  // radians
}

export function ArtificialHorizon({ roll, pitch }: ArtificialHorizonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const R = Math.min(W, H) / 2 - 4

    ctx.clearRect(0, 0, W, H)

    // Clip to circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.clip()

    // Sky / ground horizon
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(-roll)

    const pitchPx = pitch * (H / (Math.PI / 2)) * 0.6

    // Sky gradient
    const sky = ctx.createLinearGradient(0, -R - pitchPx, 0, pitchPx)
    sky.addColorStop(0, "#0a1628")
    sky.addColorStop(1, "#1e4a8a")
    ctx.fillStyle = sky
    ctx.fillRect(-W, -H - pitchPx, W * 2, H * 2)

    // Ground gradient
    const ground = ctx.createLinearGradient(0, pitchPx, 0, R - pitchPx)
    ground.addColorStop(0, "#5c3a0e")
    ground.addColorStop(1, "#2e1b06")
    ctx.fillStyle = ground
    ctx.fillRect(-W, pitchPx, W * 2, H)

    // Horizon line
    ctx.beginPath()
    ctx.moveTo(-W, pitchPx)
    ctx.lineTo(W, pitchPx)
    ctx.strokeStyle = "rgba(255,255,255,0.85)"
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Pitch ladder
    ctx.font = "bold 9px 'JetBrains Mono', monospace"
    ctx.textAlign = "center"
    for (let deg = -30; deg <= 30; deg += 5) {
      if (deg === 0) continue
      const y = pitchPx - (deg * (H / 90) * 0.55)
      const lineW = deg % 10 === 0 ? 28 : 14
      ctx.beginPath()
      ctx.moveTo(-lineW, y)
      ctx.lineTo(lineW, y)
      ctx.strokeStyle = deg % 10 === 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)"
      ctx.lineWidth = deg % 10 === 0 ? 1.5 : 1
      ctx.stroke()
      if (deg % 10 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.7)"
        ctx.fillText(`${Math.abs(deg)}`, lineW + 10, y + 3)
        ctx.fillText(`${Math.abs(deg)}`, -lineW - 10, y + 3)
      }
    }

    ctx.restore()

    // Roll arc + tick marks
    ctx.save()
    ctx.translate(cx, cy)
    const arcR = R - 8
    ctx.strokeStyle = "rgba(255,255,255,0.45)"
    ctx.lineWidth = 1

    for (const deg of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
      const a = ((deg - 90) * Math.PI) / 180
      const inner = arcR - (deg % 30 === 0 ? 9 : 5)
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner)
      ctx.lineTo(Math.cos(a) * arcR, Math.sin(a) * arcR)
      ctx.strokeStyle = deg === 0 ? "rgba(255,200,0,0.9)" : "rgba(255,255,255,0.5)"
      ctx.lineWidth = deg === 0 ? 2 : 1
      ctx.stroke()
    }

    // Triangle roll indicator
    const rollA = (-roll - Math.PI / 2)
    ctx.save()
    ctx.rotate(-roll)
    ctx.beginPath()
    ctx.moveTo(0, -(arcR - 5))
    ctx.lineTo(-5, -(arcR - 13))
    ctx.lineTo(5, -(arcR - 13))
    ctx.closePath()
    ctx.fillStyle = "hsl(42 96% 56%)"
    ctx.fill()
    ctx.restore()

    ctx.restore()

    // Fixed aircraft symbol
    ctx.save()
    ctx.translate(cx, cy)
    ctx.strokeStyle = "hsl(42 96% 56%)"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    // Wings
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-14, 0); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(14, 0); ctx.stroke()
    // Center
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.stroke()
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2)
    ctx.fillStyle = "hsl(42 96% 56%)"; ctx.fill()
    // Center dot
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -3)
    ctx.stroke()
    ctx.restore()

    // Border circle
    ctx.restore()
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.strokeStyle = "hsl(220 18% 28%)"
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Roll readout
    ctx.font = "bold 11px 'JetBrains Mono', monospace"
    ctx.textAlign = "center"
    ctx.fillStyle = "hsl(42 96% 56%)"
    ctx.fillText(`R ${(roll * 180 / Math.PI).toFixed(1)}°  P ${(pitch * 180 / Math.PI).toFixed(1)}°`, cx, cy + R + 16)

  }, [roll, pitch])

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={240}
        height={240}
        className="rounded-full"
        style={{ filter: "drop-shadow(0 0 12px hsl(42 96% 56% / 0.15))" }}
      />
    </div>
  )
}
