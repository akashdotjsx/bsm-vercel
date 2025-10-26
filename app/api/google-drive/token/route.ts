import { NextResponse } from "next/server";
import { createConnectToken } from "@/lib/pipedream";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await createConnectToken(user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create token:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
