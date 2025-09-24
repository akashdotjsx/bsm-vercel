import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ModeProvider } from "@/lib/contexts/mode-context"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { NotificationProvider } from "@/lib/contexts/notification-context"
import { SearchProvider } from "@/lib/contexts/search-context"
import { Suspense } from "react"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Kroolo BSM - Executive Dashboard",
  description: "Executive leadership dashboard for business service management platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ModeProvider>
            <NotificationProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <SearchProvider>
                  <div className="min-h-screen">{children}</div>
                </SearchProvider>
              </Suspense>
            </NotificationProvider>
          </ModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
