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

    // Check if user has permission to update status (admin or manager)
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { status, comment } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update the service request
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Set completion date if status is completed
    if (status === 'completed') {
      updateData.actual_delivery_date = new Date().toISOString()
    }

    const { data: updatedRequest, error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service request status:', error)
      return NextResponse.json({ error: 'Failed to update service request status' }, { status: 500 })
    }

    // TODO: Log the status change with comment
    // TODO: Send notification to requester about status change

    return NextResponse.json({ serviceRequest: updatedRequest }, { status: 200 })

  } catch (error) {
    console.error('Error in status update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}