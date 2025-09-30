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

    // Check if user has permission to assign (admin or manager)
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { assigneeEmail, comment } = body

    if (!assigneeEmail) {
      return NextResponse.json({ error: 'Assignee email is required' }, { status: 400 })
    }

    // Find the assignee by email
    const { data: assignee, error: assigneeError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('email', assigneeEmail)
      .eq('organization_id', profile.organization_id)
      .single()

    if (assigneeError || !assignee) {
      return NextResponse.json({ error: 'Assignee not found in organization' }, { status: 404 })
    }

    // Update the service request
    const { data: updatedRequest, error } = await supabase
      .from('service_requests')
      .update({
        assignee_id: assignee.id,
        status: 'in_progress', // Automatically move to in_progress when assigned
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error assigning service request:', error)
      return NextResponse.json({ error: 'Failed to assign service request' }, { status: 500 })
    }

    // TODO: Send notification to assignee
    // TODO: Log the assignment with comment

    return NextResponse.json({ 
      serviceRequest: updatedRequest,
      assignee: {
        id: assignee.id,
        name: `${assignee.first_name} ${assignee.last_name}`,
        email: assignee.email
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Error in assign service request API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}