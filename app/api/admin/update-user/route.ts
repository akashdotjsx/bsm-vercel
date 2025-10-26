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

    const { userId, updates } = await request.json()

    if (!userId || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Handle email update if provided
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(updates.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      // Check if email is already in use
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', updates.email)
        .neq('id', userId)
        .single()

      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }

      // Update email in auth.users
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: updates.email }
      )

      if (authError) {
        console.error('Error updating auth email:', authError)
        return NextResponse.json({ error: 'Failed to update authentication email' }, { status: 500 })
      }
    }

    // Handle role update if provided
    if (updates.role) {
      const validRoles = ['admin', 'manager', 'agent', 'user']
      if (!validRoles.includes(updates.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      // Update RBAC user_roles
      const { data: roleData } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('organization_id', currentProfile.organization_id)
        .eq('name', updates.role === 'admin' ? 'System Administrator' : 
                    updates.role === 'manager' ? 'Manager' : 
                    updates.role === 'agent' ? 'Agent' : 'User')
        .eq('is_system_role', true)
        .single()

      if (roleData) {
        // Deactivate old roles
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
    }

    // Update profile with all changes
    const profileUpdates: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)
      .eq('organization_id', currentProfile.organization_id)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile: profileData,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error in admin/update-user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
