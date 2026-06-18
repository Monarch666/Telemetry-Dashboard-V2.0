"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Navigation2,
  MapPin,
  Sliders,
  TrendingUp,
  Bell,
  Radio,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Activity,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Navigation items ──────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    href: "/",
    icon: LayoutDashboard,
    label: "Overview",
    description: "Telemetry summary",
  },
  {
    href: "/attitude",
    icon: Navigation2,
    label: "Attitude",
    description: "Roll · Pitch · Yaw",
  },
  {
    href: "/position",
    icon: MapPin,
    label: "Position",
    description: "GPS & local nav",
  },
  {
    href: "/charts",
    icon: TrendingUp,
    label: "Live Charts",
    description: "Time-series data",
  },
  {
    href: "/parameters",
    icon: Sliders,
    label: "Parameters",
    description: "Flight parameters",
  },
  {
    href: "/alerts",
    icon: Bell,
    label: "Alerts",
    description: "Events & warnings",
  },
]

/* ── App Shell ─────────────────────────────────────────────────────────────── */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [connected] = useState(true) // TODO: wire to real connection state
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          collapsed ? "w-[64px]" : "w-[230px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[64px]">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-[0_0_12px_rgba(255,255,255,0.1)]">
            {/* The user will place the logo image in public/wingspann-logo.png */}
            <img src="/wingspann-logo.png" alt="Wingspann" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-display font-bold text-base leading-tight text-foreground tracking-wide truncate">
                WINGSPANN
              </p>
              <p className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase truncate">
                GLOBAL PVT LTD
              </p>
            </div>
          )}
        </div>

        {/* Connection status */}
        {!collapsed && (
          <div className="mx-3 my-3 flex items-center gap-2 rounded-md px-3 py-2 text-xs border"
            style={{
              background: connected
                ? "hsl(142 65% 42% / 0.08)"
                : "hsl(16 88% 54% / 0.08)",
              borderColor: connected
                ? "hsl(142 65% 42% / 0.25)"
                : "hsl(16 88% 54% / 0.25)",
            }}
          >
            {connected ? (
              <Wifi className="w-3 h-3 text-as-green flex-shrink-0" />
            ) : (
              <WifiOff className="w-3 h-3 text-destructive flex-shrink-0" />
            )}
            <div className="overflow-hidden">
              <p className={cn("font-medium truncate", connected ? "text-as-green" : "text-destructive")}>
                {connected ? "MAVLink Active" : "Disconnected"}
              </p>
              <p className="text-muted-foreground truncate">57600 baud</p>
            </div>
            {connected && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live flex-shrink-0" />
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2 py-2 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-150 group relative",
                  isActive
                    ? "bg-amber-500/12 text-amber-500 border border-amber-500/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground border border-transparent"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-full" />
                )}
                <item.icon
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    collapsed ? "w-5 h-5" : "w-4 h-4",
                    isActive ? "text-amber-500" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && (
                  <div className="overflow-hidden">
                    <p className={cn("font-medium leading-none", isActive ? "text-amber-500" : "")}>{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: signal indicator + collapse */}
        <div className="border-t border-sidebar-border p-3 flex flex-col gap-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-1">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <div className="flex gap-0.5 flex-1">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm transition-all duration-300"
                    style={{
                      height: `${6 + Math.sin(i * 1.3) * 4}px`,
                      background: i < 9 ? "hsl(42 96% 56% / 0.7)" : "hsl(220 18% 22%)",
                    }}
                  />
                ))}
              </div>
              <Zap className="w-3 h-3 text-amber-500" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full rounded-md h-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors border border-transparent hover:border-sidebar-border"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full border border-sidebar-border bg-sidebar flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-amber-500/40 transition-all z-10"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top header bar */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-border bg-card/40 backdrop-blur-sm sticky top-0 z-20 min-h-[52px]">
          <div className="flex items-center gap-2 flex-1">
            <span className="w-1.5 h-1.5 rounded-full bg-as-green animate-pulse-live" />
            <span className="text-xs font-mono text-muted-foreground">SYS:NOMINAL</span>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-xs font-mono text-muted-foreground" id="utc-clock">
              UTC —
            </span>
          </div>
          <UTCClock />
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="text-as-green">●</span> AHRS
            </span>
            <span className="flex items-center gap-1">
              <span className="text-as-green">●</span> GPS
            </span>
            <span className="flex items-center gap-1">
              <span className="text-amber-500">●</span> RC
            </span>
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">●</span> LIDAR
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>

        {/* Footer */}
        <footer className="flex items-center justify-between px-6 py-2 border-t border-border bg-card/30 text-[11px] font-mono text-muted-foreground">
          <span>Wingspann Global Pvt Ltd v1.0.0</span>
          <span className="flex items-center gap-1">
            <span className="text-as-green">●</span> All systems nominal
          </span>
          <span>MAVLink Protocol 2.0</span>
        </footer>
      </div>
    </div>
  )
}

/* ── UTC Clock ─────────────────────────────────────────────────────────────── */
function UTCClock() {
  const [time, setTime] = useState("--:--:--")

  useEffect(() => {
    const update = () => setTime(new Date().toUTCString().slice(17, 25))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="text-xs font-mono text-muted-foreground">
      {time} UTC
    </span>
  )
}
