'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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
        // Get the hash fragment from the URL (contains tokens)
        const hashFragment = window.location.hash.substring(1)
        
        if (!hashFragment) {
          throw new Error('No authentication data found')
        }

        // Parse the hash fragment
        const params = new URLSearchParams(hashFragment)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (!accessToken) {
          throw new Error('No access token found')
        }

        // Set the session using the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })

        if (error) {
          throw error
        }

        if (data?.user) {
          console.log('User authenticated:', data.user.email)
          setStatus('success')
          setMessage(`Welcome, ${data.user.email}!`)

          // Check if this is an invite flow
          if (type === 'invite' || data.user.user_metadata?.invited) {
            // Redirect to password setup
            setTimeout(() => {
              router.push('/auth/set-password')
            }, 1500)
          } else {
            // Regular login - redirect to dashboard
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Confirming Authentication...
              </h2>
              <p className="text-gray-600">
                Please wait while we complete your sign-in.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Successful!
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
              <p className="text-sm text-gray-500 mt-2">
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to error page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}