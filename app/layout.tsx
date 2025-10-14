import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ModeProvider } from "@/lib/contexts/mode-context"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { NotificationProvider } from "@/lib/contexts/notification-context"
import { SearchProvider } from "@/lib/contexts/search-context"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { Suspense } from "react"
import { NavbarFixProvider } from "@/components/providers/navbar-fix-provider"
import { ReactQueryProvider } from "@/components/providers/react-query-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Kroolo BSM - AI-Native Business Service Management",
    template: "%s | Kroolo BSM"
  },
  description: "Transform your Enterprise Business Service Management with AI-powered automation for IT, HR, Finance, Legal and more. Built for modern enterprises.",
  keywords: ["Business Service Management", "BSM", "IT Service Management", "ITSM", "AI", "Enterprise", "Kroolo"],
  authors: [{ name: "Kroolo" }],
  creator: "Kroolo",
  publisher: "Kroolo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/kroolo-light-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/kroolo-light-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <TooltipProvider delayDuration={200}>
              <NavbarFixProvider>
                <AuthProvider>
                  <ModeProvider>
                    <NotificationProvider>
                      <Suspense fallback={null}>
                        <SearchProvider>
                          <div className="h-screen">{children}</div>
                        </SearchProvider>
                      </Suspense>
                    </NotificationProvider>
                  </ModeProvider>
                </AuthProvider>
              </NavbarFixProvider>
              <Toaster />
            </TooltipProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
