import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile and organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, first_name, last_name, department')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const body = await request.json()
    const {
      serviceId,
      requestName,
      department,
      priority,
      urgency,
      expectedDeliveryDate,
      costCenter,
      approverEmail,
      description,
      businessJustification,
      additionalRequirements
    } = body

    // Validate required fields
    if (!serviceId || !requestName || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('is_requestable', true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found or not requestable' }, { status: 404 })
    }

    // Generate request number
    const requestNumber = `SR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Prepare form data
    const formData = {
      requestName,
      department: department || profile.department,
      priority,
      urgency,
      expectedDeliveryDate,
      costCenter,
      approverEmail,
      description,
      businessJustification,
      additionalRequirements
    }

    // Calculate estimated delivery date
    const estimatedDeliveryDate = service.estimated_delivery_days
      ? new Date(Date.now() + service.estimated_delivery_days * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Create the service request
    const { data: serviceRequest, error: createError } = await supabase
      .from('service_requests')
      .insert({
        organization_id: profile.organization_id,
        request_number: requestNumber,
        service_id: serviceId,
        title: requestName,
        description: description,
        business_justification: businessJustification,
        urgency: urgency,
        priority: priority,
        status: service.requires_approval ? 'pending' : 'in_progress',
        requester_id: user.id,
        approver_id: null, // Will be set when approval workflow is implemented
        form_data: formData,
        estimated_delivery_date: estimatedDeliveryDate,
        cost_center: costCenter
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating service request:', createError)
      return NextResponse.json({ error: 'Failed to create service request' }, { status: 500 })
    }

    // If approval is required, we could trigger approval workflow here
    // For now, we'll just log it
    if (service.requires_approval) {
      console.log('Service request requires approval:', requestNumber)
      // TODO: Implement approval workflow trigger
    }

    // Update service request count
    await supabase
      .from('services')
      .update({ total_requests: (service.total_requests || 0) + 1 })
      .eq('id', serviceId)

    return NextResponse.json({ 
      serviceRequest,
      requestNumber,
      requiresApproval: service.requires_approval
    }, { status: 201 })

  } catch (error) {
    console.error('Error in service requests API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile and organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role, manager_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'own' // own, team, all
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build base query
    let query = supabase
      .from('service_requests')
      .select(`
        *,
        service:services(name, category_id, estimated_delivery_days),
        requester:profiles!service_requests_requester_id_fkey(first_name, last_name, email, department),
        assignee:profiles!service_requests_assignee_id_fkey(first_name, last_name, email),
        approver:profiles!service_requests_approver_id_fkey(first_name, last_name, email)
      `, { count: 'exact' })
      .eq('organization_id', profile.organization_id)

    // Apply scope-based filtering
    if (scope === 'own') {
      // Users see only their own requests
      query = query.eq('requester_id', user.id)
    } else if (scope === 'team' && profile.role in ['manager', 'admin']) {
      // Managers see their team's requests + their own
      // This relies on RLS policies to enforce proper access
    } else if (scope === 'all' && profile.role === 'admin') {
      // Admins see all requests
      // This relies on RLS policies to enforce proper access
    } else {
      // Default to own requests for security
      query = query.eq('requester_id', user.id)
    }

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    const { data: serviceRequests, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching service requests:', error)
      return NextResponse.json({ error: 'Failed to fetch service requests' }, { status: 500 })
    }

    return NextResponse.json({ 
      serviceRequests, 
      count,
      scope,
      userRole: profile.role
    }, { status: 200 })

  } catch (error) {
    console.error('Error in service requests API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
