import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Delete user request for userId:', userId)

    // Verify the requesting user is authenticated
    const supabase = await createClient()
    
    // Try to get session first (more reliable than getUser)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('🔐 Session check:', { 
      hasSession: !!session,
      sessionError: sessionError?.message
    })
    
    if (!session?.user) {
      console.error('❌ No active session found')
      return NextResponse.json({ error: 'Unauthorized - Please log in again' }, { status: 401 })
    }
    
    const user = session.user
    console.log('👤 Authenticated user:', { userId: user.id, email: user.email })

    // Check if current user is admin
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can delete users' },
        { status: 403 }
      )
    }

    // Verify the user to be deleted is in the same organization
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (targetProfile.organization_id !== currentProfile.organization_id) {
      return NextResponse.json(
        { error: 'Cannot delete users from other organizations' },
        { status: 403 }
      )
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    console.log(`Admin ${user.email} attempting to delete user ${userId}`)

    // Delete related data first (in case of FK constraints)
    
    // 1. Remove user as team lead (set to null)
    await supabaseAdmin
      .from('teams')
      .update({ lead_id: null })
      .eq('lead_id', userId)

    // 2. Delete user_roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    // 3. Delete team memberships
    await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('user_id', userId)

    // 4. Delete user permissions (if any)
    await supabaseAdmin
      .from('user_permissions')
      .delete()
      .eq('user_id', userId)

    // 5. Delete the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return NextResponse.json(
        { error: `Database error: ${profileError.message}` },
        { status: 500 }
      )
    }

    // Finally, delete the user from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting user from auth:', authError)
      // Profile is already deleted, but auth deletion failed
      // This is not ideal but the user is effectively deleted
      return NextResponse.json(
        { 
          success: true, 
          message: 'User profile deleted, but authentication cleanup failed',
          warning: authError.message
        },
        { status: 200 }
      )
    }

    console.log(`Successfully deleted user ${userId}`)
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error in delete-user API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}
