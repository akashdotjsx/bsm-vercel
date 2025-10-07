import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// POST /api/auth/reset-password
// Body: { email: string }
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    // Generate a recovery link using the service role
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
      },
    })

    if (error) {
      console.error("[auth.reset-password] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Many providers don't send email for admin.generateLink; return link so caller can display/copy
    return NextResponse.json({ action_link: data?.action_link })
  } catch (err) {
    console.error("[auth.reset-password] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
