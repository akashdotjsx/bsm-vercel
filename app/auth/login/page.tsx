"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/contexts/auth-context"

export default function Page() {
  const [email, setEmail] = useState("admin@kroolo.com")
  const [password, setPassword] = useState("KrooloAdmin123!")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { setUser } = useStore()
  const { user, loading } = useAuth()
  
  // Auto-redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('User already authenticated, redirecting to dashboard')
      router.push('/dashboard')
      return
    }
    setCheckingAuth(false)
  }, [user, loading, router])
  
  // Show loading while checking authentication status
  if (loading || checkingAuth) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-sm text-muted-foreground">Checking authentication...</span>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError("Authentication failed")
        return
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        setError("Failed to load user profile")
        console.error("Profile fetch error:", profileError)
        return
      }

      if (!profile) {
        setError("User profile not found. Contact your administrator.")
        return
      }

      // Update global state
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.display_name || `${profile.first_name} ${profile.last_name}`,
        avatar: profile.avatar_url,
        role: profile.role,
      })

      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id)

      console.log("Login successful, redirecting to dashboard")
      router.push("/dashboard")

    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first")
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setError(error.message)
      } else {
        setError(null)
        alert("Password reset email sent! Check your inbox.")
      }
    } catch (err) {
      setError("Failed to send reset email")
    }
  }

  // Demo bypass - keep for development but hide in production
  const handleBypass = () => {
    console.log("[DEV] Demo bypass - this should be removed in production")
    router.push("/dashboard")
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

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-xs text-muted-foreground"
                  >
                    Forgot your password?
                  </Button>

                  {/* Development only - remove in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Dev Only</span>
                        </div>
                      </div>
                      <Button type="button" variant="outline" className="w-full h-10 bg-transparent" onClick={handleBypass}>
                        Continue as Demo User (Dev)
                      </Button>
                    </>
                  )}
                </div>
                <div className="mt-6 text-center text-sm">
                  <span className="text-muted-foreground">
                    Need an account?{" "}
                  </span>
                  <Link href="/auth/contact" className="text-primary hover:underline">
                    Contact your administrator
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
