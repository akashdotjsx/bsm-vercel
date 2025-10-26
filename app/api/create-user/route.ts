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

    // Use Supabase's inviteUserByEmail - creates user and sends invite
    let authUser = null
    let inviteResult = null
    
    try {
      console.log('📧 Inviting user:', email)
      
      // Use inviteUserByEmail which sends the proper invitation email
      const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`
      
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: redirectUrl,
          data: {
            first_name,
            last_name,
            invited: true
          }
        }
      )
      
      if (inviteError) {
        throw inviteError
      }
      
      authUser = inviteData
      inviteResult = inviteData
      console.log('✅ Invitation sent successfully to:', email)
      
    } catch (inviteError: any) {
      console.error('❌ Error inviting user:', inviteError)
      return NextResponse.json(
        { error: true, message: `Failed to invite user: ${inviteError.message}` },
        { status: 500 }
      )
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

    // Invitation email sent via Supabase - no temporary password needed

    // Try to generate a magic link for manual sharing (in case SMTP is not configured)
    let magicLink = null
    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
          redirectTo: redirectUrl
        }
      })
      magicLink = linkData?.properties?.action_link
    } catch (e) {
      console.warn('Could not generate magic link:', e)
    }

    return NextResponse.json({
      success: true,
      profile,
      message: magicLink 
        ? `User created! Share this link with ${email}: ${magicLink}`
        : `Invitation sent to ${email}. They will receive an email to set their password and activate their account.`,
      magicLink: magicLink // Include link for admin to copy
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: true, message: 'Internal server error' },
      { status: 500 }
    )
  }
}