import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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

    // Exchange code for session (sets cookies via the cookie bridge above)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`)
    }

    if (data?.user) {
      console.log('User authenticated successfully:', data.user.email)
      
      // Confirm profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('User profile not found')}`)
      }

      if (data.user.user_metadata?.invited) {
        return NextResponse.redirect(`${requestUrl.origin}/auth/set-password`)
      }

      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    }

    return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('Authentication failed')}`)

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${encodeURIComponent('Authentication process failed')}`)
  }
}
