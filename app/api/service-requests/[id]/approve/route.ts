import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

export async function PATCH(
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

    // Check if user has permission to approve (admin or manager)
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { comment } = body

    // Update the service request
    const { data: updatedRequest, error } = await supabase
      .from('service_requests')
      .update({
        status: 'approved',
        approver_id: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: comment || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error approving service request:', error)
      return NextResponse.json({ error: 'Failed to approve service request' }, { status: 500 })
    }

    // TODO: Send notification to requester
    // TODO: Trigger workflow if configured

    return NextResponse.json({ serviceRequest: updatedRequest }, { status: 200 })

  } catch (error) {
    console.error('Error in approve service request API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}