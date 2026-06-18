import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/app-shell"

export const metadata: Metadata = {
  title: {
    default: "Wingspann Global Telemetry",
    template: "%s | Wingspann",
  },
  description:
    "Production-grade UAV telemetry dashboard with real-time MAVLink data visualization, attitude monitoring, GPS tracking, and flight analytics.",
  keywords: ["Wingspann", "UAV", "telemetry", "MAVLink", "drone"],
  authors: [{ name: "Wingspann Global Pvt Ltd" }],
  creator: "Wingspann Global Pvt Ltd",
  robots: "noindex, nofollow",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Rajdhani:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen w-full bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
