'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthConfirm() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('🔍 Auth confirm page loaded')
        console.log('🔍 Full URL:', window.location.href)
        
        // First, check if Supabase already set a session via cookies
        // This is the most common scenario after email verification
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        console.log('🔍 Session check:', {
          hasSession: !!sessionData?.session,
          hasUser: !!sessionData?.session?.user,
          email: sessionData?.session?.user?.email,
          error: sessionError?.message
        })

        if (sessionData?.session?.user) {
          // Session already exists (Supabase set it via cookies)
          console.log('✅ Session found via cookies:', sessionData.session.user.email)
          setStatus('success')
          setMessage(`Welcome, ${sessionData.session.user.email}!`)

          // Check if this is an invite flow
          if (sessionData.session.user.user_metadata?.invited) {
            console.log('🔄 Invite flow detected, redirecting to set password')
            setTimeout(() => {
              router.push('/auth/set-password')
            }, 1500)
          } else {
            console.log('� Regular login, redirecting to dashboard')
            setTimeout(() => {
              router.push('/dashboard')
            }, 1500)
          }
          return
        }

        // If no session in cookies, try to get tokens from hash fragment
        const hashFragment = window.location.hash.substring(1)
        console.log('🔍 Hash fragment:', hashFragment || '(empty)')
        
        if (!hashFragment) {
          // No hash fragment and no session - something went wrong
          console.error('❌ No session in cookies and no hash fragment in URL')
          throw new Error('No authentication data found. Please click the link in your invitation email again.')
        }

        // Parse the hash fragment
        const params = new URLSearchParams(hashFragment)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        console.log('🔍 Hash params:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type
        })

        if (!accessToken) {
          throw new Error('No access token found in URL')
        }

        // Set the session using the tokens from hash
        console.log('🔄 Setting session from hash tokens...')
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })

        if (error) {
          console.error('❌ Error setting session:', error)
          throw error
        }

        if (data?.user) {
          console.log('✅ Session set successfully:', data.user.email)
          setStatus('success')
          setMessage(`Welcome, ${data.user.email}!`)

          // Check if this is an invite flow
          if (type === 'invite' || data.user.user_metadata?.invited) {
            console.log('🔄 Invite flow detected, redirecting to set password')
            setTimeout(() => {
              router.push('/auth/set-password')
            }, 1500)
          } else {
            console.log('🔄 Regular login, redirecting to dashboard')
            setTimeout(() => {
              router.push('/dashboard')
            }, 1500)
          }
        } else {
          throw new Error('Authentication successful but no user data received')
        }

      } catch (error: any) {
        console.error('Auth confirm error:', error)
        setStatus('error')
        setMessage(error.message || 'Authentication failed')
        
        // Redirect to error page after delay
        setTimeout(() => {
          router.push(`/auth/error?error=${encodeURIComponent(error.message || 'Authentication failed')}`)
        }, 3000)
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="max-w-md w-full 0 shadow-md rounded-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-80 mx-auto" />
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[13px] font-semibold text-foreground mb-2">
                Authentication Successful!
              </h2>
              <p className="text-muted-foreground">
                {message}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting you now...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-[13px] font-semibold text-foreground mb-2">
                Authentication Failed
              </h2>
              <p className="text-muted-foreground mb-4">
                {message}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to error page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}