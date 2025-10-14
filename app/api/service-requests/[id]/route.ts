import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'

// Get single service request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // Get the service request (RLS will handle access control) - wrapped with cache
    const fetchServiceRequest = unstable_cache(
      async () => {
        return await supabase
          .from('service_requests')
          .select(`
            *,
            service:services(name, category_id, estimated_delivery_days),
            requester:profiles!service_requests_requester_id_fkey(first_name, last_name, email, department),
            assignee:profiles!service_requests_assignee_id_fkey(first_name, last_name, email),
            approver:profiles!service_requests_approver_id_fkey(first_name, last_name, email)
          `)
          .eq('id', params.id)
          .single()
      },
      [`service-request-${params.id}`],
      {
        revalidate: 60,
        tags: [CACHE_TAGS.serviceRequests],
      }
    )
    
    const { data: serviceRequest, error } = await fetchServiceRequest()

    if (error) {
      console.error('Error fetching service request:', error)
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    return NextResponse.json({ serviceRequest }, { status: 200 })

  } catch (error) {
    console.error('Error in service request API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}