"use client"

import type React from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type AccentColor = "amber" | "green" | "blue" | "red" | "cyan" | "purple"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  unit: string
  sub?: string
  accentColor?: AccentColor
  className?: string
}

const ACCENT_STYLES: Record<AccentColor, { bg: string; border: string; icon: string; value: string }> = {
  amber:  { bg: "hsl(42 96% 56% / 0.07)",  border: "hsl(42 96% 56% / 0.22)",  icon: "text-amber-500",  value: "text-amber-400" },
  green:  { bg: "hsl(142 65% 42% / 0.07)", border: "hsl(142 65% 42% / 0.22)", icon: "text-as-green",   value: "text-emerald-400" },
  blue:   { bg: "hsl(210 90% 60% / 0.07)", border: "hsl(210 90% 60% / 0.22)", icon: "text-blue-400",   value: "text-blue-300" },
  red:    { bg: "hsl(16 88% 54% / 0.07)",  border: "hsl(16 88% 54% / 0.25)",  icon: "text-destructive", value: "text-orange-400" },
  cyan:   { bg: "hsl(190 80% 52% / 0.07)", border: "hsl(190 80% 52% / 0.22)", icon: "text-cyan-400",   value: "text-cyan-300" },
  purple: { bg: "hsl(265 70% 60% / 0.07)", border: "hsl(265 70% 60% / 0.22)", icon: "text-purple-400", value: "text-purple-300" },
}

export function StatCard({ icon: Icon, label, value, unit, sub, accentColor = "amber", className }: StatCardProps) {
  const style = ACCENT_STYLES[accentColor]

  return (
    <div
      className={cn(
        "rounded-lg border p-3 flex flex-col gap-2 transition-all duration-200 hover:scale-[1.01] animate-fade-up",
        className
      )}
      style={{ background: style.bg, borderColor: style.border }}
    >
      <div className="flex items-center justify-between">
        <span className="telem-label">{label}</span>
        <Icon className={cn("w-3.5 h-3.5", style.icon)} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("font-telem text-xl font-semibold leading-none", style.value)}>
          {value}
        </span>
        {unit && <span className="telem-unit">{unit}</span>}
      </div>
      {sub && (
        <p className="text-xs text-muted-foreground truncate">{sub}</p>
      )}
    </div>
  )
}
