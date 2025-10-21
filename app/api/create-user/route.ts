import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
      manager_id 
    } = userData

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: true, message: 'Missing required fields: email, first_name, last_name' },
        { status: 400 }
      )
    }

    // Get organization_id from the authenticated user making the request
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: true, message: 'Unauthorized - must be logged in to invite users' },
        { status: 401 }
      )
    }

    // Get the inviting user's profile to find their organization
    const { data: inviterProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !inviterProfile?.organization_id) {
      return NextResponse.json(
        { error: true, message: 'Could not determine organization - inviter profile not found' },
        { status: 400 }
      )
    }

    const organization_id = inviterProfile.organization_id

    // Try to invite user first (this will create the user and send invite email)
    let authUser = null
    let inviteResult = null
    
    try {
      // Use inviteUserByEmail - this creates the user AND sends the invite email in one step
      // Use /auth/confirm because Supabase sends tokens as hash fragments, not query params
      const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`
      console.log('🔗 Sending invitation with redirect URL:', redirectUrl)
      
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
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

    // Ensure we have the user ID
    const userId = authUser?.user?.id
    if (!userId) {
      console.error('No user ID found in authUser:' , authUser)
      return NextResponse.json(
        { error: true, message: 'Failed to get user ID from auth response' },
        { status: 500 }
      )
    }

    // Create the profile record
    const { data: profile, error: profileCreationError } = await supabaseAdmin
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

    if (profileCreationError) {
      // If profile creation fails, we should delete the auth user to maintain consistency
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      } catch (deleteError) {
        console.error('Error cleaning up auth user after profile creation failed:', deleteError)
      }
      
      console.error('Error creating profile:', profileCreationError)
      return NextResponse.json(
        { error: true, message: `Failed to create user profile: ${profileCreationError.message}` },
        { status: 500 }
      )
    }

    // Assign user to the appropriate RBAC role
    try {
      // Map the legacy role names to RBAC role names
      const roleMap = {
        'admin': 'System Administrator',
        'manager': 'Manager', 
        'agent': 'Agent',
        'user': 'User'
      }
      
      const rbacRoleName = roleMap[role as keyof typeof roleMap] || 'User'
      
      // Find the role ID (try organization-specific first, then system roles)
      let { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', rbacRoleName)
        .eq('organization_id', organization_id)
        .single()
      
      // If no org-specific role found, try system roles
      if (roleError || !roleData) {
        const { data: systemRoleData, error: systemRoleError } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', rbacRoleName)
          .eq('is_system_role', true)
          .single()
        
        roleData = systemRoleData
        roleError = systemRoleError
      }
      
      if (roleError || !roleData) {
        console.warn(`Role '${rbacRoleName}' not found, user will need manual role assignment`)
      } else {
        // Assign the role to the user
        const { error: userRoleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: roleData.id,
            assigned_by: userId, // Self-assignment during creation
            assigned_at: new Date().toISOString(),
            is_active: true
          })
        
        if (userRoleError) {
          console.error('Error assigning role to user:', userRoleError)
        } else {
          console.log(`Successfully assigned '${rbacRoleName}' role to user ${email}`)
        }
      }
    } catch (roleAssignmentError) {
      console.error('Error during role assignment:', roleAssignmentError)
      // Don't fail the entire user creation process if role assignment fails
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