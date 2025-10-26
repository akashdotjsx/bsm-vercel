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

    const { userId, newEmail } = await request.json()

    if (!userId || !newEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if email is already in use by another user
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', newEmail)
      .neq('id', userId)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use by another user' }, { status: 400 })
    }

    // Update user email in auth.users using admin client
    const { data: authUpdateData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    )

    if (authError) {
      console.error('Error updating auth email:', authError)
      return NextResponse.json({ error: 'Failed to update authentication email' }, { status: 500 })
    }

    // Update email in profiles table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        email: newEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('organization_id', currentProfile.organization_id)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating profile email:', profileError)
      // Try to rollback auth email change
      await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: authUpdateData.user.email }
      )
      return NextResponse.json({ error: 'Failed to update profile email' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile: profileData,
      message: 'Email updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error in update-user-email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
