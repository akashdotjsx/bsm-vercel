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

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, category_id, estimated_delivery_days, popularity_score } = body

    if (!name || !category_id) {
      return NextResponse.json({ error: 'Name and category_id are required' }, { status: 400 })
    }

    // Add the new service to Supabase
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        name,
        description: description || '',
        category_id,
        estimated_delivery_days: estimated_delivery_days || 3,
        popularity_score: popularity_score || 3,
        organization_id: profile.organization_id,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding service:', error)
      return NextResponse.json({ error: 'Failed to add service' }, { status: 500 })
    }

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error('Error in services API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const body = await request.json()
    const { id, name, description, estimated_delivery_days, popularity_score } = body

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    // Update the service in Supabase
    const { data: service, error } = await supabase
      .from('services')
      .update({
        name,
        description: description || '',
        estimated_delivery_days: estimated_delivery_days || 3,
        popularity_score: popularity_score || 3,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
    }

    return NextResponse.json({ service }, { status: 200 })
  } catch (error) {
    console.error('Error in services API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    // Delete the service from Supabase
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (error) {
      console.error('Error deleting service:', error)
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Service deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in services API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
