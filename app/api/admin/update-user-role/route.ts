import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { userId, newRole } = await request.json()

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'agent', 'user']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Update user role using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('organization_id', currentProfile.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }

    // Update corresponding user_roles in RBAC system
    // First, get the role ID for the new role
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('organization_id', currentProfile.organization_id)
      .eq('name', newRole === 'admin' ? 'System Administrator' : 
                  newRole === 'manager' ? 'Manager' : 
                  newRole === 'agent' ? 'Agent' : 'User')
      .eq('is_system_role', true)
      .single()

    if (roleData) {
      // Deactivate old user_roles
      await supabaseAdmin
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)

      // Add new role
      await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userId,
          role_id: roleData.id,
          assigned_by: user.id,
          is_active: true
        })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error('Unexpected error in update-user-role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
