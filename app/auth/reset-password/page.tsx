"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Check if there's a valid session from the reset link
    const checkSession = async () => {
      try {
        // First check if there's a hash in the URL (tokens from email)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        console.log('Reset password - URL params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type })

        // If we have tokens in the URL and it's a recovery type, set the session
        if (accessToken && type === 'recovery') {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })

          if (error) {
            console.error('Error setting session from URL:', error)
            setIsValidToken(false)
            toast({
              title: "Invalid or expired link",
              description: "This password reset link is invalid or has expired. Please request a new one.",
              variant: "destructive"
            })
          } else if (data.session) {
            console.log('Session set successfully from URL')
            setIsValidToken(true)
          } else {
            setIsValidToken(false)
          }
        } else {
          // Check if there's already a session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error || !session) {
            console.error('No valid session found')
            setIsValidToken(false)
            toast({
              title: "Invalid or expired link",
              description: "This password reset link is invalid or has expired. Please request a new one.",
              variant: "destructive"
            })
          } else {
            console.log('Existing session found')
            setIsValidToken(true)
          }
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setIsValidToken(false)
        toast({
          title: "Error",
          description: "An error occurred while validating the reset link.",
          variant: "destructive"
        })
      } finally {
        setIsCheckingToken(false)
      }
    }

    checkSession()
  }, [supabase, toast])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      toast({
        title: "Password updated successfully",
        description: "You can now log in with your new password",
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error: any) {
      console.error("Error updating password:", error)
      toast({
        title: "Error updating password",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying reset link...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              Invalid Reset Link
            </CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/auth/login")} 
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Reset Your Password
          </CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {password && confirmPassword && password === confirmPassword && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Passwords match</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
