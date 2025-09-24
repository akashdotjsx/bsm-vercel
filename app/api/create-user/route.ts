import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This is the service role key with admin privileges
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Generate a secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    
    const { 
      email, 
      first_name, 
      last_name, 
      role, 
      department, 
      manager_id,
      organization_id 
    } = userData

    // Validate required fields
    if (!email || !first_name || !last_name || !organization_id) {
      return NextResponse.json(
        { error: true, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Try to invite user first (this will create the user and send invite email)
    let authUser = null
    let inviteResult = null
    
    try {
      // Use inviteUserByEmail - this creates the user AND sends the invite email in one step
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/callback`,
        data: {
          first_name,
          last_name,
          invited: true
        }
      })
      
      if (inviteError) {
        throw inviteError
      }
      
      authUser = inviteData
      inviteResult = inviteData
      console.log('User invited successfully via inviteUserByEmail:', authUser)
      
    } catch (inviteError) {
      console.warn('Could not invite user via email, falling back to manual creation:', inviteError)
      
      // Fallback: Create user manually
      const tempPassword = generateTempPassword()
      
      const { data: createdUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email for invited users
        user_metadata: {
          first_name,
          last_name,
          invited: true
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        return NextResponse.json(
          { error: true, message: `Failed to create user account: ${authError.message}` },
          { status: 500 }
        )
      }

      if (!createdUser.user) {
        return NextResponse.json(
          { error: true, message: 'User creation failed - no user returned' },
          { status: 500 }
        )
      }
      
      authUser = createdUser
      inviteResult = null // No invite email was sent
    }

    // Ensure we have the user ID - handle different response structures
    const userId = authUser?.user?.id || authUser?.id
    if (!userId) {
      console.error('No user ID found in authUser:', authUser)
      return NextResponse.json(
        { error: true, message: 'Failed to get user ID from auth response' },
        { status: 500 }
      )
    }

    // Create the profile record
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        organization_id,
        email,
        first_name,
        last_name,
        display_name: `${first_name} ${last_name}`,
        role,
        department,
        manager_id,
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      // If profile creation fails, we should delete the auth user to maintain consistency
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      } catch (deleteError) {
        console.error('Error cleaning up auth user after profile creation failed:', deleteError)
      }
      
      console.error('Error creating profile:', profileError)
      return NextResponse.json(
        { error: true, message: `Failed to create user profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // If we didn't successfully send an invite email during user creation, try additional methods
    if (!inviteResult) {
      try {
        // Try password reset email as alternative to invite
        await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/reset-password`
        })
        console.log('Sent password reset email as alternative to invite')
        inviteResult = { user: authUser?.user || { id: userId } } // Mark as successful
      } catch (resetError) {
        console.warn('Could not send password reset email either:', resetError)
        
        // For development: Set a known password so user can log in for testing
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: 'Welcome123!'
          })
          console.log('Set temporary password: Welcome123!')
        } catch (pwError) {
          console.warn('Could not set temporary password:', pwError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      message: inviteResult 
        ? `User ${email} has been invited successfully. They will receive an email to set up their account.`
        : `User ${email} has been created successfully. Temporary password: Welcome123! (SMTP not configured, using temporary password for testing)`,
      hasEmail: !!inviteResult,
      tempPassword: inviteResult ? null : 'Welcome123!'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    )
  }
}