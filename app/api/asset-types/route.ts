import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get asset types for the organization
    const { data: assetTypes, error } = await supabase
      .from('asset_types')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('name')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch asset types' }, { status: 500 })
    }

    return NextResponse.json({
      assetTypes: assetTypes || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}