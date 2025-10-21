import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('📞 CALLBACK ROUTE HIT!')
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const token = requestUrl.searchParams.get('token') // Alternative token parameter
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const access_token = requestUrl.searchParams.get('access_token')
  const refresh_token = requestUrl.searchParams.get('refresh_token')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Debug: Log all URL parameters
  console.log('🔍 Auth callback received:')
  console.log('  Full URL:', requestUrl.toString())
  console.log('  All params:', Object.fromEntries(requestUrl.searchParams.entries()))
  console.log('  code:', code)
  console.log('  token_hash:', token_hash)
  console.log('  token:', token)
  console.log('  type:', type)
  console.log('  access_token:', access_token ? 'present' : 'null')
  console.log('  refresh_token:', refresh_token ? 'present' : 'null')
  console.log('  error:', error)
  console.log('  error_description:', error_description)

  // Handle auth errors
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent(error_description || error)}`)
  }

  try {
    // Create Supabase server client with cookie bridging so session persists
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    let authData = null
    let authError = null

    // First, check if there's already an active session (Supabase might have set it already)
    console.log('🔍 Checking for existing session...')
    const { data: existingSession, error: sessionError } = await supabase.auth.getSession()
    
    console.log('📊 Session check result:', {
      hasSession: !!existingSession?.session,
      hasUser: !!existingSession?.session?.user,
      userEmail: existingSession?.session?.user?.email,
      sessionError: sessionError?.message
    })
    
    if (existingSession?.session?.user) {
      console.log('✅ Session already exists for user:', existingSession.session.user.email)
      authData = existingSession
      authError = null
    }
    // If no session found, try refreshing session (Supabase might need a moment to set cookies)
    else {
      console.log('🔄 No session found, attempting to refresh session...')
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
      
      console.log('🔄 Refresh result:', {
        hasSession: !!refreshedSession?.session,
        hasUser: !!refreshedSession?.session?.user,
        userEmail: refreshedSession?.session?.user?.email,
        refreshError: refreshError?.message
      })
      
      if (refreshedSession?.session?.user) {
        console.log('✅ Session found after refresh for user:', refreshedSession.session.user.email)
        authData = refreshedSession
        authError = null
      }
    }
    
    // Only try URL parameter flows if we don't have a session yet
    if (!authData?.session?.user) {
      console.log('🔗 No session found, checking URL parameters for auth flows...')
      
      // Handle PKCE code exchange flow
      if (code) {
      console.log('Processing PKCE code exchange...')
      const result = await supabase.auth.exchangeCodeForSession(code)
      authData = result.data
      authError = result.error
    }
    // Handle direct access token (already authenticated)
    else if (access_token && refresh_token) {
      console.log('Processing direct token authentication...')
      const result = await supabase.auth.setSession({
        access_token,
        refresh_token
      })
      authData = result.data
      authError = result.error
    }
    // Handle OTP/invitation token verification flow
    else if (token_hash && type) {
      console.log('Processing invitation token verification...', { type, token_hash: token_hash.substring(0, 10) + '...' })
      const result = await supabase.auth.verifyOtp({ 
        token_hash, 
        type 
      })
      authData = result.data
      authError = result.error
    }
    // Handle alternative token parameter with type
    else if (token && type) {
      console.log('Processing alternative token format...', { type, token: token.substring(0, 10) + '...' })
      const result = await supabase.auth.verifyOtp({ 
        token_hash: token, 
        type 
      })
      authData = result.data
      authError = result.error
      }
      // If no authentication parameters found in URL, this might be an implicit flow with hash fragments
      else {
        console.log('No URL parameters found. This might be an implicit flow with hash fragments.')
        console.log('Supabase should have set session cookies during the /auth/v1/verify step.')
        console.log('If no session was found, there might be a configuration issue.')
        
        // Try one more time to get session after a brief moment
        console.log('🔄 Making final session check attempt...')
        const { data: finalSession } = await supabase.auth.getSession()
        
        if (finalSession?.session?.user) {
          console.log('✅ Final session check found user:', finalSession.session.user.email)
          authData = finalSession
          authError = null
        } else {
          console.log('❌ No session found even after final check. Redirecting to confirm page for hash handling.')
          return NextResponse.redirect(`${requestUrl.origin}/auth/confirm`)
        }
      }
    }

    if (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent(authError.message)}`)
    }

    if (authData?.user) {
      console.log('User authenticated successfully:', authData.user.email)
      
      // Confirm profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!profile) {
        console.error('User profile not found for user:', authData.user.id)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('User profile not found')}`)
      }

      // Check if user was invited and needs to set password
      if (authData.user.user_metadata?.invited) {
        console.log('User was invited, redirecting to set password')
        return NextResponse.redirect(`${requestUrl.origin}/auth/set-password`)
      }

      console.log('User authentication complete, redirecting to dashboard')
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    }

    return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('Authentication failed - no user data')}`)

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('Authentication process failed')}`)
  }
}
