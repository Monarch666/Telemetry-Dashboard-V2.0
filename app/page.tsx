import type { Metadata } from "next"
import { TelemetryHub } from "@/components/telemetry-hub"

export const metadata: Metadata = {
  title: "AeroSync Telemetry",
  description: "Real-time UAV telemetry overview — altitude, speed, battery, attitude",
}

export default function OverviewPage() {
  return <TelemetryHub />
}
