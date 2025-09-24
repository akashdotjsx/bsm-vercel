"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

export default function Page() {
  const [email, setEmail] = useState("admin@kroolo.com")
  const [password, setPassword] = useState("KrooloAdmin123!")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleBypass = () => {
    console.log("[v0] Bypassing authentication, redirecting to dashboard")
    router.push("/dashboard")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Demo login attempt")

    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("[v0] Demo login successful, redirecting to dashboard")
    router.push("/dashboard")
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <Image src="/images/kroolo-logo.png" alt="Kroolo Logo" width={120} height={40} className="h-10 w-auto" />
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-foreground">Business Service Management</h1>
              <p className="text-sm text-muted-foreground">AI-Native Enterprise Platform</p>
            </div>
          </div>

          <Card className="border border-border shadow-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your service management platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-10" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button type="button" variant="outline" className="w-full h-10 bg-transparent" onClick={handleBypass}>
                    Continue as Demo User
                  </Button>
                </div>
                <div className="mt-6 text-center text-sm">
                  <Link href="/auth/sign-up" className="text-primary hover:underline">
                    Need an account? Contact your administrator
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
