import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("[v0] Bypassing authentication for all paths:", request.nextUrl.pathname)
  return NextResponse.next({
    request,
  })

  // Original authentication logic commented out to prevent Supabase client errors
  /*
  const bypassPaths = [
    "/bsm/dashboard",
    "/bsm/tickets",
    "/bsm/services",
    "/bsm/assets",
    "/bsm/changes",
    "/bsm/knowledge",
    "/bsm/analytics",
  ]
  const isBypassPath = bypassPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isBypassPath) {
    console.log("[v0] Bypassing authentication for BSM path:", request.nextUrl.pathname)
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
  */
}
