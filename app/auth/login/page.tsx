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
import dynamic from "next/dynamic"

// Dynamic import to prevent hydration issues
const KrooloMainLoader = dynamic(() => import('@/components/common/kroolo-main-loader'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-background" />
})

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
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
          console.log('User already authenticated, redirecting to tickets')
          setRedirecting(true)
          setTimeout(() => {
            router.push('/tickets')
          }, 300)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        // Continue to show login page on error
      }
    }
    
    checkAuth()
  }, [router, supabase])

  // Show loader when redirecting after successful login
  if (redirecting) {
    return <KrooloMainLoader />
  }

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
        password: password.trim(),
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

      console.log("Login successful, redirecting to tickets")
      
      // Show loading screen and then redirect
      setRedirecting(true)
      
      // Small delay to show the loading screen, then redirect
      setTimeout(() => {
        window.location.href = "/tickets"
      }, 500)

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
    <div className="flex h-screen w-full 0 overflow-hidden">
      {/* Main Container - 7/12 width like reference */}
      <div className="flex lg:w-7/12 w-full overflow-hidden 0 justify-center items-center">
        <div className="w-full max-w-[440px] mx-auto">
          {/* Login Form Card */}
          <div 
            className="0 border border-[#EAECF0] rounded-xl p-6 flex flex-col gap-4 relative"
            style={{ 
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08), 0px 0px 1px rgba(0, 0, 0, 0.1)',
              width: '440px',
              maxWidth: '100%'
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
                <div className="h-8 w-48 bg-muted animate-pulse rounded mx-auto" />
              )}
            </div>

            {/* Header */}
            <div className="text-center mb-2">
              <h1 
                className="text-[16px] font-semibold text-foreground" 
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 600,
                  lineHeight: '24px',
                  color: '#101828'
                }}
              >
                Welcome to <span style={{ color: '#6366F1' }}>Kroolo BSM</span>
              </h1>
              <p 
                className="text-[#667085] mt-2" 
                style={{
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '18px'
                }}
              >
                Unlock your team's knowledge base with Kroolo BSM.
              </p>
            </div>

            {/* Sign in heading */}
            <div className="mt-4 mb-4">
              <h2 
                className="text-[16px] font-semibold" 
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 600,
                  lineHeight: '24px',
                  color: '#101828'
                }}
              >
                Sign in
              </h2>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <Label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-[#344054] mb-1" 
                  style={{ 
                    fontWeight: 500,
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
                    className="w-full bg-white text-[#101828] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent border border-[#D0D5DD] hover:border-[#D0D5DD] transition-all duration-200"
                    style={{
                      fontSize: '13px',
                      fontWeight: 400,
                      height: '36px',
                      color: '#101828',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)'
                    }}
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-1.5">
                <Label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-[#344054] mb-1" 
                  style={{ 
                    fontWeight: 500,
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
                    className="w-full bg-white text-[#101828] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent border border-[#D0D5DD] hover:border-[#D0D5DD] transition-all duration-200 pr-10"
                    style={{
                      fontSize: '13px',
                      fontWeight: 400,
                      height: '36px',
                      color: '#101828',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#667085] hover:text-[#344054]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Forgot Password Link */}
                <div className="mt-2 text-right">
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-sm text-[#6366F1] hover:text-[#5558E3] inline-block"
                    style={{ 
                      fontSize: '11px',
                      lineHeight: '16px',
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
                className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white font-medium text-sm transition-colors duration-200"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  lineHeight: '20px',
                  textTransform: 'none',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                  border: 'none',
                  borderRadius: '6px',
                  height: '36px',
                  padding: '8px 16px'
                }}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

            </form>

          </div>
          
          {/* Terms and Privacy - Outside the card */}
          <div className="mt-4 text-center mx-auto">
            <div 
              className="text-xs text-[#667085] leading-relaxed" 
              style={{ 
                fontSize: '11px',
                lineHeight: '16px',
                fontWeight: 400
              }}
            >
              By signing up, You agree to Kroolo's{" "}
              <Link 
                href="https://kroolo.com/legal/terms-of-use?_gl=1*1sl9z05*_gcl_au*NDYwMzU3NTY0LjE3NjEwMzM2NjU" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6366F1] hover:text-[#5558E3]"
                style={{ fontWeight: 400, textDecoration: 'underline' }}
              >
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link 
                href="https://kroolo.com/legal/privacy-policy?_gl=1*s3golz*_gcl_au*NDYwMzU3NTY0LjE3NjEwMzM2NjU"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6366F1] hover:text-[#5558E3]"
                style={{ fontWeight: 400, textDecoration: 'underline' }}
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
