import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('👤 Get User API Route called for ID:', params.id)
  
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      console.log('❌ Get User API - User not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    // supabase already created above
    
    // Fetch user profile with roles - wrapped with cache
    const fetchUserProfile = unstable_cache(
      async () => {
        return await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            avatar_url,
            bio,
            phone,
            department,
            position,
            status,
            created_at,
            updated_at,
            user_roles(
              roles(
                id,
                name,
                description
              )
            )
          `)
          .eq('organization_id', user.user_metadata.organization_id)
          .eq('id', params.id)
          .single()
      },
      [`user-${params.id}`],
      {
        revalidate: 300,
        tags: [CACHE_TAGS.users],
      }
    )
    
    const { data: userProfile, error } = await fetchUserProfile()

    if (error || !userProfile) {
      console.error('❌ Get User API - Database error:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ Get User API - Found user:', userProfile.full_name)

    return NextResponse.json(userProfile)

  } catch (error) {
    console.error('❌ Get User API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
