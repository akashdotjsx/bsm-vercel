import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uzbozldsdzsfytsteqlb.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6Ym96bGRzZHpzZnl0c3RlcWxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIwNzUzMiwiZXhwIjoyMDczNzgzNTMyfQ.nyq1n2AGV8j5jg0uKci6XXncMcJ3RmlG18IL21VYAHs'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseServiceKey ? 'present' : 'missing')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setAdminUser() {
  const email = 'mohammedzufishan@gmail.com'
  
  console.log(`Setting ${email} as admin...`)
  
  // Update the profile role
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role: 'admin',
      updated_at: new Date().toISOString()
    })
    .eq('email', email)
    .select()
    .single()

  if (error) {
    console.error('Error updating user role:', error)
    return
  }

  console.log('Profile updated:', data)

  // Get the organization_id
  const organizationId = data.organization_id
  const userId = data.id

  // Get the System Administrator role ID
  const { data: roleData } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('name', 'System Administrator')
    .eq('is_system_role', true)
    .single()

  if (roleData) {
    // Deactivate old user_roles
    await supabaseAdmin
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', userId)

    console.log('Deactivated old roles')

    // Add admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: roleData.id,
        is_active: true
      })

    if (roleError) {
      console.error('Error updating user role in RBAC:', roleError)
      return
    }

    console.log('Successfully set user as System Administrator')
  }

  console.log('✅ User successfully updated to admin!')
}

setAdminUser()
