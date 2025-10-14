import { NextResponse } from "next/server"

// Lightweight endpoint to prevent 404 noise from legacy clients trying to sync tokens.
// Returns a no-op success response.
export async function GET() {
  return NextResponse.json({ ok: true, message: "token sync noop" }, { status: 200 })
}

export const dynamic = "force-dynamic"
