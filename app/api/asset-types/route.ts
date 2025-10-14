import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

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

    // Get asset types for the organization - wrapped with cache
    const fetchAssetTypes = unstable_cache(
      async () => {
        return await supabase
          .from('asset_types')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true)
          .order('name')
      },
      [`asset-types-${profile.organization_id}`],
      {
        revalidate: 3600,
        tags: [CACHE_TAGS.assets],
      }
    )
    
    const { data: assetTypes, error } = await fetchAssetTypes()

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