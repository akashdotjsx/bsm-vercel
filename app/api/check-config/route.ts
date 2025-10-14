import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const config = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not set',
      // Don't expose the actual keys for security
      serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
        process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : 'not set'
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Configuration check complete'
    })

  } catch (error) {
    console.error('Config check error:', error)
    return NextResponse.json(
      { error: true, message: 'Configuration check failed' },
      { status: 500 }
    )
  }
}