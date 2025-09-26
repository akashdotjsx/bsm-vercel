import { createConfirmedAdminUser } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Admin user creation API called")
    
    // Get parameters from request body - all required
    const body = await request.json()
    const { email, password, firstName, lastName, department, organizationId } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          message: "email, password, firstName, and lastName are required" 
        }, 
        { status: 400 }
      )
    }

    const result = await createConfirmedAdminUser({
      email,
      password,
      firstName,
      lastName,
      department: department || "IT",
      organizationId
    })

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
