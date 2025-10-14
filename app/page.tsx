"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Bot,
  BarChart3,
  Users,
  Ticket,
  Workflow,
  Shield,
  Database,
  MessageSquare,
  Clock,
  Target,
  Zap,
  Sun,
  Moon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useTheme } from "next-themes"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, profile, loading, signOut } = useAuth()

  // Prevent hydration mismatch with theme
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignIn = () => {
    console.log("[v0] Sign in button clicked, navigating to login")
    router.push("/auth/login")
  }

  console.log("[v0] Landing page component rendering")

  const features = [
    {
      icon: <Ticket className="h-6 w-6" />,
      title: "Smart Ticketing System",
      description: "AI-powered ticket classification, routing, and resolution with Kanban and List views",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI-Powered Automation",
      description: "Intelligent triage, sentiment analysis, and automated response generation",
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
    {
      icon: <Workflow className="h-6 w-6" />,
      title: "Workflow Builder",
      description: "Visual workflow designer with approval processes and SLA management",
      color: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Advanced Analytics",
      description: "Real-time dashboards with MTTR, SLA compliance, and performance metrics",
      color: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Customer Management",
      description: "Comprehensive customer profiles with activity tracking and communication history",
      color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400",
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Asset Management (CMDB)",
      description: "Complete configuration management database with dependency mapping",
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Knowledge Base",
      description: "AI-enhanced knowledge management with gap detection and content generation",
      color: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Integrations",
      description: "Connect with CRM, HR, telephony, and collaboration tools seamlessly",
      color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    },
  ]

  const stats = [
    { label: "Faster Resolution", value: "60%", icon: <Clock className="h-5 w-5" /> },
    { label: "SLA Compliance", value: "99.5%", icon: <Target className="h-5 w-5" /> },
    { label: "Automation Rate", value: "85%", icon: <Zap className="h-5 w-5" /> },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              {mounted ? (
                <Image
                  src={theme === 'dark' ? '/images/kroolo-light-logo1.svg' : '/images/kroolo-dark-logo2.svg'}
                  alt="Kroolo Logo"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
              ) : (
                <div className="h-8 w-30 bg-muted animate-pulse rounded" />
              )}
              <Badge variant="secondary" className="text-[12px]">
                BSM
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-8 w-8 p-0"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                </div>
              ) : user && profile ? (
                <div className="flex items-center space-x-2">
                  <span className="text-[12px] text-muted-foreground">
                    Logged in as <span className="font-medium text-foreground">{profile.first_name || user.email}</span>
                  </span>
                  <Button 
                    onClick={() => signOut().then(() => router.push('/auth/login'))} 
                    variant="outline" 
                    size="sm" 
                    className="text-[12px]"
                  >
                    Sign Out
                  </Button>
                  <Button 
                    onClick={() => router.push('/dashboard')} 
                    className="bg-foreground text-background hover:bg-foreground/90 text-[12px]"
                  >
                    Dashboard
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button onClick={handleSignIn} className="bg-foreground text-background hover:bg-foreground/90 text-[12px]">
                  Sign In
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 text-sm">
              AI-Powered Business Service Management
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Transform Your Service Operations with <span className="text-primary">Intelligent Automation</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Transform Enterprise Business Service Management for IT, HR, Finance, Legal and others. Built for modern
              enterprises.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" onClick={handleSignIn} className="bg-foreground text-background hover:bg-foreground/90">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mr-3">
                    {stat.icon}
                  </div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </div>
              <div className="text-base text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need for modern service management
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comprehensive platform with AI-powered features designed for enterprise-scale operations
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 hover:border-border transition-colors">
                <CardHeader className="pb-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.color} mb-4`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to transform your service operations?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of organizations already using Kroolo BSM to deliver exceptional service experiences.
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={handleSignIn} className="bg-foreground text-background hover:bg-foreground/90">
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {mounted ? (
                <Image
                  src={theme === 'dark' ? '/images/kroolo-light-logo1.svg' : '/images/kroolo-dark-logo2.svg'}
                  alt="Kroolo Logo"
                  width={96}
                  height={24}
                  className="h-6 w-auto"
                />
              ) : (
                <div className="h-6 w-24 bg-muted dark:bg-gray-700 animate-pulse rounded" />
              )}
              <Badge variant="secondary" className="text-[12px]">
                BSM
              </Badge>
            </div>
            <p className="text-[12px] text-muted-foreground">© 2025 Kroolo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
