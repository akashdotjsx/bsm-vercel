import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// PATCH /api/profiles/[id]
// Body: { first_name?, last_name?, display_name?, email?, role?, department?, is_active? }
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await _req.json().catch(() => ({}))
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 })
    }

    const allowed: Record<string, unknown> = {}
    const fields = [
      "first_name",
      "last_name",
      "display_name",
      "email",
      "role",
      "department",
      "is_active",
    ] as const

    for (const key of fields) {
      if (key in body) allowed[key] = body[key]
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("[profiles.patch] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (err) {
    console.error("[profiles.patch] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
