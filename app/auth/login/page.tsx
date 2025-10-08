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
import { Eye, EyeOff } from "lucide-react"

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { setUser } = useStore()
  
  // Force light mode on login page
  useEffect(() => {
    setMounted(true)
    // Force light mode
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
    
    // Check if user is already authenticated (but don't show loading)
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('User already authenticated, redirecting to dashboard')
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        // Continue to show login page on error
      }
    }
    
    checkAuth()
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log('Login attempt with email:', email)
    console.log('Password provided:', !!password)
    console.log('Email length:', email.length)
    console.log('Password length:', password.length)

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    try {
      console.log('About to call supabase.auth.signInWithPassword')
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      console.log('Auth response:', { authData, authError })

      if (authError) {
        console.error('Supabase auth error:', authError)
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
      
      // Force a hard navigation to ensure the redirect works
      window.location.href = "/dashboard"

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
      {/* Main Container - 7/12 width like reference */}
      <div className="flex lg:w-7/12 w-full overflow-hidden bg-white justify-center items-center">
        <div className="w-full max-w-[440px] mx-auto">
          {/* Login Form Card */}
          <div 
            className="bg-white border border-[#EAECF0] rounded-xl p-6 flex flex-col gap-4 relative"
            style={{ 
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08), 0px 0px 1px rgba(0, 0, 0, 0.1)',
              width: '440px',
              maxWidth: '100%',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {/* Logo */}
            <div className="flex justify-center h-12">
              {mounted && (
                <Link href="/" className="flex items-center">
                  <Image 
                    src="/images/kroolo-dark-logo2.svg"
                    alt="Kroolo Logo" 
                    width={200} 
                    height={32} 
                    className="h-8 w-auto" 
                  />
                </Link>
              )}
              {!mounted && (
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mx-auto" />
              )}
            </div>

            {/* Header */}
            <div className="text-center">
              <h1 
                className="text-xl font-medium text-gray-900" 
                style={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                  fontSize: '20px', 
                  fontWeight: 500,
                  lineHeight: '28px',
                  color: '#101828',
                  marginBottom: '4px'
                }}
              >
                Sign in with
              </h1>
            </div>

            {/* Social Login Buttons */}
            <div className="flex flex-col gap-6">
              <div className="w-full">
                <Button 
                  type="button" 
                  className="w-full h-[35px] bg-transparent border border-[rgba(0,0,0,0.1)] text-[#344054] hover:bg-[rgba(0,0,0,0.05)] transition-all duration-300 rounded-sm flex justify-center items-center font-normal text-sm px-6 py-2"
                  style={{
                    boxShadow: 'none',
                    textTransform: 'none',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '20px'
                  }}
                  onClick={() => alert('Google sign-in coming soon!')}
                >
                  <svg className="mr-3" viewBox="0 0 24 24" style={{ width: '32px', height: '32px' }}>
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
              
              <div className="w-full">
                <Button 
                  type="button" 
                  className="w-full h-[35px] bg-transparent border border-[rgba(0,0,0,0.1)] text-[#344054] hover:bg-[rgba(0,0,0,0.05)] transition-all duration-300 rounded-sm flex justify-center items-center font-normal text-sm px-6 py-2"
                  style={{
                    boxShadow: 'none',
                    textTransform: 'none',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '20px'
                  }}
                  onClick={() => alert('Microsoft sign-in coming soon!')}
                >
                  <svg className="mr-3" viewBox="0 0 24 24" style={{ width: '32px', height: '32px' }}>
                    <path fill="#f25022" d="M1 1h10v10H1z"/>
                    <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                    <path fill="#7fba00" d="M1 13h10v10H1z"/>
                    <path fill="#ffb900" d="M13 13h10v10H13z"/>
                  </svg>
                  Sign in with Microsoft
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="flex-grow border-t border-[#EAECF0]"></div>
              <span className="px-4 text-sm text-[#667085] bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '20px' }}>Or</span>
              <div className="flex-grow border-t border-[#EAECF0]"></div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-1.5">
                <Label 
                  htmlFor="email" 
                  className="block text-sm font-semibold text-[#2D2F34] mb-1" 
                  style={{ 
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: '#344054',
                    lineHeight: '18px'
                  }}
                >
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white text-[#2D2F34] placeholder-[#ACB1B9] placeholder-opacity-60 focus:outline-none focus:ring-0 border border-transparent focus:border-[#6E72FF] hover:border-[#6E72FF] transition-colors duration-200"
                    style={{
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '13px',
                      fontWeight: 400,
                      height: '32px',
                      color: '#101828',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      boxShadow: 'none'
                    }}
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-1.5">
                <Label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-[#2D2F34] mb-1" 
                  style={{ 
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: '#344054',
                    lineHeight: '18px'
                  }}
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white text-[#2D2F34] placeholder-[#ACB1B9] placeholder-opacity-60 focus:outline-none focus:ring-0 border border-transparent focus:border-[#6E72FF] hover:border-[#6E72FF] transition-colors duration-200 pr-8"
                    style={{
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '14px',
                      fontWeight: 400,
                      height: '32px',
                      color: '#101828',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      boxShadow: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Forgot Password Link */}
                <div className="mt-3 text-right">
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-sm text-[#6E72FF] hover:text-[#5A5FE0] inline-block"
                    style={{ 
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '12px',
                      lineHeight: '18px',
                      fontWeight: 400,
                      textDecoration: 'none'
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#6E72FF] hover:bg-[#5A5FE0] text-white font-medium text-sm rounded-sm transition-colors duration-200"
                style={{
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '20px',
                  textTransform: 'capitalize',
                  boxShadow: 'none',
                  border: 'none',
                  height: '35px'
                }}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

            </form>

            {/* SSO Link */}
            <div className="text-center">
              <Link 
                href="/auth/sso" 
                className="text-sm text-[#6E72FF] hover:text-[#5A5FE0]" 
                style={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontWeight: 400,
                  textDecoration: 'none'
                }}
              >
                Login with SSO
              </Link>
            </div>

            {/* Footer Links */}
            <div className="text-center">
              <div 
                className="text-sm" 
                style={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                  fontSize: '13px',
                  lineHeight: '20px',
                  fontWeight: 400
                }}
              >
                <span className="text-[#667085]">
                  Don't have an account?
                </span>
                <span className="ml-1">
                  <Link 
                    href="/auth/contact" 
                    className="text-[#6E72FF] hover:text-[#5A5FE0]"
                    style={{
                      fontWeight: 500,
                      textDecoration: 'none'
                    }}
                  >
                    Sign up
                  </Link>
                </span>
              </div>
            </div>
          </div>
          
          {/* Terms and Privacy - Outside the card */}
          <div className="mt-6 text-center max-w-[315px] mx-auto">
            <div 
              className="text-xs text-[#667085] leading-relaxed" 
              style={{ 
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '12px',
                lineHeight: '18px',
                fontWeight: 400
              }}
            >
              By signing up, I agree to Kroolo's{" "}
              <Link 
                href="#" 
                className="text-[#6E72FF] hover:text-[#5A5FE0]"
                style={{ fontWeight: 400, textDecoration: 'none' }}
              >
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link 
                href="#" 
                className="text-[#6E72FF] hover:text-[#5A5FE0]"
                style={{ fontWeight: 400, textDecoration: 'none' }}
              >
                Privacy Policy
              </Link>.
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image (5/12 width) */}
      <div className="hidden lg:block lg:w-5/12 relative overflow-hidden" style={{ backgroundColor: '#ccdafa' }}>
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
