import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Check if user has permission to reject (admin or manager)
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { comment } = body

    // Update the service request
    const { data: updatedRequest, error } = await supabase
      .from('service_requests')
      .update({
        status: 'rejected',
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
      console.error('Error rejecting service request:', error)
      return NextResponse.json({ error: 'Failed to reject service request' }, { status: 500 })
    }

    // TODO: Send notification to requester
    
    return NextResponse.json({ serviceRequest: updatedRequest }, { status: 200 })

  } catch (error) {
    console.error('Error in reject service request API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}