import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message 
      }, { status: 401 })
    }

    if (!session?.user) {
      return NextResponse.json({ 
        authenticated: false 
      }, { status: 401 })
    }

    // Get user profile for additional context
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, organization_id, role')
      .eq('id', session.user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        profile: profile || null
      },
      session: {
        expires_at: session.expires_at,
        expires_in: session.expires_in
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"