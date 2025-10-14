import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface AdminUserParams {
  email: string
  password: string
  firstName: string
  lastName: string
  department?: string
  organizationId?: string
}

export async function createConfirmedAdminUser(params: AdminUserParams) {
  try {
    console.log("[v0] Starting admin user creation process")

    const { email, password, firstName, lastName, department = "IT", organizationId } = params

    // First, try to delete any existing user with this email
    console.log("[v0] Checking for existing users")
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find((user) => user.email === email)

    if (existingUser) {
      console.log("[v0] Found existing user, deleting:", existingUser.id)
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
      console.log("[v0] Deleted existing user")
    }

    // Create user with confirmed email using admin API
    console.log("[v0] Creating new admin user with email_confirm: true")
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This confirms the email immediately
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: "admin",
      },
    })

    if (error) {
      console.error("[v0] Error creating admin user:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] User created successfully:", {
      id: data.user?.id,
      email: data.user?.email,
      email_confirmed_at: data.user?.email_confirmed_at,
      confirmed_at: data.user?.confirmed_at,
    })

    // Create profile in our profiles table
    if (data.user) {
      console.log("[v0] Creating profile for user:", data.user.id)
      
      // If no organizationId provided, get the first available organization
      let finalOrganizationId = organizationId
      if (!finalOrganizationId) {
        const { data: orgs } = await supabaseAdmin.from("organizations").select("id").limit(1)
        finalOrganizationId = orgs?.[0]?.id
        if (!finalOrganizationId) {
          console.error("[v0] No organizations found in database")
          return { success: false, error: "No organizations available" }
        }
      }

      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: data.user.id,
        organization_id: finalOrganizationId,
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        role: "admin",
        department,
        is_active: true,
        timezone: "UTC",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("[v0] Error creating profile:", profileError)
        return { success: false, error: profileError.message }
      }
      console.log("[v0] Profile created successfully")
    }

    console.log("[v0] Admin user creation completed successfully")
    return { success: true, user: data.user }
  } catch (error) {
    console.error("[v0] Unexpected error in createConfirmedAdminUser:", error)
    return { success: false, error: "Unexpected error occurred" }
  }
}
