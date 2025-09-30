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
    const { name, description, icon, color, parent_id, sort_order } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Insert the new service category
    const { data: category, error } = await supabase
      .from('service_categories')
      .insert({
        organization_id: profile.organization_id,
        name,
        description,
        icon: icon || 'Settings',
        color: color || 'bg-blue-500',
        parent_id: parent_id || null,
        sort_order: sort_order || 0,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service category:', error)
      return NextResponse.json({ error: 'Failed to create service category' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error in service categories API:', error)
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

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // Get all service categories for the organization
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select(`
        *,
        services:services(*)
      `)
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching service categories:', error)
      return NextResponse.json({ error: 'Failed to fetch service categories' }, { status: 500 })
    }

    // Filter out categories that have no services and group by name to avoid duplicates
    const categoryMap = new Map()
    
    categories?.forEach(category => {
      const key = category.name
      if (!categoryMap.has(key) || (category.services && category.services.length > 0)) {
        categoryMap.set(key, category)
      }
    })

    const filteredCategories = Array.from(categoryMap.values())

    return NextResponse.json({ categories: filteredCategories }, { status: 200 })
  } catch (error) {
    console.error('Error in service categories API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
