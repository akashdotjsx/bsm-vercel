import { createConfirmedAdminUser } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Admin user creation API called")
    const result = await createConfirmedAdminUser()

    console.log("[v0] Admin user creation result:", result)

    if (!result.success) {
      console.log("[v0] Admin user creation failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log("[v0] Admin user creation succeeded")
    return NextResponse.json({
      success: true,
      message: "Admin user created successfully with confirmed email",
      user: result.user,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in admin API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
