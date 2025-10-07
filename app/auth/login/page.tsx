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
  const [email, setEmail] = useState("bhive@kroolo.com")
  const [password, setPassword] = useState("KrooloAdmin123!")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { setUser } = useStore()
  const { user, loading } = useAuth()
  
  // Force light mode on login page
  useEffect(() => {
    setMounted(true)
    // Force light mode
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
  }, [])

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


  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">

      {/* Left side - Login Form */}
      <div className="flex lg:w-1/2 w-full overflow-y-auto bg-white">
        <div className="flex flex-col w-full max-w-sm mx-auto p-8 lg:p-12">
          {/* Top spacer - 30% of viewport height */}
          <div className="h-[25vh] min-h-12"></div>
          
          <div className="space-y-5">
            {/* Logo and Header */}
            <div className="text-center space-y-3">
              {mounted && (
                <Image 
                  src="/images/kroolo-dark-logo2.svg"
                  alt="Kroolo Logo" 
                  width={120} 
                  height={40} 
                  className="h-12 w-auto mx-auto" 
                />
              )}
              {!mounted && (
                <div className="h-12 w-32 bg-gray-200 animate-pulse rounded mx-auto" />
              )}
              <h1 className="text-xl font-semibold text-gray-900">Sign in with</h1>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => alert('Google sign-in coming soon!')}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => alert('Microsoft sign-in coming soon!')}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M1 1h10v10H1z"/>
                  <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                  <path fill="#7fba00" d="M1 13h10v10H1z"/>
                  <path fill="#ffb900" d="M13 13h10v10H13z"/>
                </svg>
                Sign up with Microsoft
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Or</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 px-4 bg-white border-gray-300"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 px-4 bg-white border-gray-300"
                />
              </div>
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Forgot your password?
                </Button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="text-center space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">
                  Don't have an account?{" "}
                </span>
                <Link href="/auth/contact" className="text-blue-600 hover:underline font-medium">
                  Sign up
                </Link>
              </div>
              
              <div className="text-xs text-gray-500 leading-relaxed">
                By signing up, I agree to Kroolo's{" "}
                <Link href="#" className="text-blue-600 hover:underline">Terms</Link>
                {" "}and{" "}
                <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </div>
            </div>
          </div>
          
          {/* Bottom spacer - flexible to fill remaining space */}
          <div className="flex-1 min-h-8"></div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
        <Image
          src="/images/login_page_image.png"
          alt="AI WorkOS for All"
          fill
          className="object-cover object-center"
          style={{ transform: 'scale(0.8)' }}
          priority
        />
      </div>
    </div>
  )
}
