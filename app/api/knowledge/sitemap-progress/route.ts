import { NextResponse } from "next/server"

// Lightweight endpoint to prevent 404 noise from legacy UI polling sitemap progress.
// Returns a static payload indicating the feature is disabled in this build.
export async function POST() {
  return NextResponse.json({ status: "disabled", progress: 0 }, { status: 200 })
}

export const dynamic = "force-dynamic"
