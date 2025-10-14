import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

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

    // Invalidate cache
    revalidateTag(CACHE_TAGS.services)

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

    // Get all service categories for the organization - wrapped with cache
    const fetchCategories = unstable_cache(
      async () => {
        return await supabase
          .from('service_categories')
          .select(`
            *,
            services:services(*)
          `)
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      },
      [`service-categories-${profile.organization_id}`],
      {
        revalidate: 3600,
        tags: [CACHE_TAGS.services],
      }
    )
    
    const { data: categories, error } = await fetchCategories()

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
    const { id, name, description, icon, color } = body

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Update the service category
    const { data: category, error } = await supabase
      .from('service_categories')
      .update({
        name,
        description: description || '',
        icon: icon || 'Settings',
        color: color || 'bg-blue-500',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service category:', error)
      return NextResponse.json({ error: 'Failed to update service category' }, { status: 500 })
    }

    // Invalidate cache
    revalidateTag(CACHE_TAGS.services)

    return NextResponse.json({ category }, { status: 200 })
  } catch (error) {
    console.error('Error in service categories API:', error)
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
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // First delete all services in this category (cascade delete)
    const { error: servicesDeleteError } = await supabase
      .from('services')
      .delete()
      .eq('category_id', id)
      .eq('organization_id', profile.organization_id)

    if (servicesDeleteError) {
      console.error('Error deleting services in category:', servicesDeleteError)
      return NextResponse.json({ error: 'Failed to delete services in category' }, { status: 500 })
    }

    // Now delete the service category
    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (error) {
      console.error('Error deleting service category:', error)
      return NextResponse.json({ error: 'Failed to delete service category' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Service category deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in service categories API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
