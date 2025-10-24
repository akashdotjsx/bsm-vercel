import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// POST /api/auth/reset-password
// Body: { email: string }
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    // Use resetPasswordForEmail to actually send the email
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      console.error("[auth.reset-password] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[auth.reset-password] Password reset email sent to:", email)
    return NextResponse.json({ 
      success: true,
      message: "Password reset email sent successfully" 
    })
  } catch (err) {
    console.error("[auth.reset-password] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
