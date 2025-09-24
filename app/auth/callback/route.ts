import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle auth errors
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent(error_description || error)}`)
  }

  // If no code, this might be an implicit flow callback with hash fragment
  if (!code) {
    // For implicit flow, redirect to a page that can handle the hash fragment
    return NextResponse.redirect(`${requestUrl.origin}/auth/confirm`)
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`)
    }

    if (data?.user) {
      console.log('User authenticated successfully:', data.user.email)
      
      // Check if this is a new user who needs to set up their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      // Redirect based on user status
      if (!profile) {
        // If no profile exists, something went wrong - redirect to error
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('User profile not found')}`)
      }

      // Check if user needs to set password (invited users)
      if (data.user.user_metadata?.invited) {
        // Redirect to password setup page
        return NextResponse.redirect(`${requestUrl.origin}/auth/set-password`)
      }

      // Regular login - redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    }

    // If we get here, something unexpected happened
    return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('Authentication failed')}`)

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('Authentication process failed')}`)
  }
}