"use client"

import { useEffect, useRef } from "react"

interface CompassRoseProps {
  heading: number // degrees 0-360
}

export function CompassRose({ heading }: CompassRoseProps) {
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
    const R = Math.min(W, H) / 2 - 8

    ctx.clearRect(0, 0, W, H)

    // Outer ring background
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    const bg = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R)
    bg.addColorStop(0, "hsl(222 28% 9%)")
    bg.addColorStop(1, "hsl(220 24% 11%)")
    ctx.fillStyle = bg
    ctx.fill()
    ctx.strokeStyle = "hsl(220 18% 20%)"
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Rotating dial
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((-heading * Math.PI) / 180)

    // Cardinal tick marks
    const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    for (let i = 0; i < 360; i += 5) {
      const a = (i * Math.PI) / 180
      const isMajor = i % 90 === 0
      const isCardinal = i % 45 === 0
      const inner = R - (isMajor ? 18 : isCardinal ? 13 : 7)
      const outer = R - 3

      ctx.beginPath()
      ctx.moveTo(Math.sin(a) * inner, -Math.cos(a) * inner)
      ctx.lineTo(Math.sin(a) * outer, -Math.cos(a) * outer)
      ctx.strokeStyle = isMajor
        ? "rgba(255,255,255,0.85)"
        : isCardinal
        ? "rgba(255,255,255,0.55)"
        : "rgba(255,255,255,0.2)"
      ctx.lineWidth = isMajor ? 2 : 1
      ctx.stroke()
    }

    // Degree labels every 30°
    ctx.font = "bold 10px 'JetBrains Mono', monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    for (let i = 0; i < 360; i += 30) {
      const a = (i * Math.PI) / 180
      const lr = R - 26
      const x = Math.sin(a) * lr
      const y = -Math.cos(a) * lr
      ctx.fillStyle = i % 90 === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)"
      ctx.fillText(i === 0 ? "N" : i === 90 ? "E" : i === 180 ? "S" : i === 270 ? "W" : String(i), x, y)
    }

    // Inner amber ring
    ctx.beginPath()
    ctx.arc(0, 0, R * 0.42, 0, Math.PI * 2)
    ctx.strokeStyle = "hsl(42 96% 56% / 0.3)"
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.restore()

    // Fixed North pointer triangle
    ctx.save()
    ctx.translate(cx, cy)
    ctx.beginPath()
    ctx.moveTo(0, -(R - 5))
    ctx.lineTo(-5, -(R - 17))
    ctx.lineTo(5, -(R - 17))
    ctx.closePath()
    ctx.fillStyle = "hsl(16 88% 54%)"
    ctx.fill()
    ctx.restore()

    // Center hub
    ctx.save()
    ctx.translate(cx, cy)
    const hub = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.38)
    hub.addColorStop(0, "hsl(220 28% 12%)")
    hub.addColorStop(1, "hsl(220 24% 10%)")
    ctx.beginPath()
    ctx.arc(0, 0, R * 0.38, 0, Math.PI * 2)
    ctx.fillStyle = hub
    ctx.fill()
    ctx.strokeStyle = "hsl(220 18% 22%)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Heading readout
    ctx.font = "bold 18px 'JetBrains Mono', monospace"
    ctx.fillStyle = "hsl(42 96% 56%)"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${String(heading).padStart(3, "0")}°`, 0, -6)

    ctx.font = "10px 'Inter', sans-serif"
    ctx.fillStyle = "hsl(215 14% 46%)"
    ctx.fillText("HDG", 0, 10)

    ctx.restore()
  }, [heading])

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      style={{ filter: "drop-shadow(0 0 10px hsl(42 96% 56% / 0.12))" }}
    />
  )
}
