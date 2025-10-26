import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  console.log("[Middleware ENTRY] Path:", request.nextUrl.pathname, "| Method:", request.method)
  
  // Fast path for static assets, API routes, and public pages
  if (request.nextUrl.pathname.startsWith('/_next/') || 
      request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.includes('.') ||
      request.nextUrl.pathname === '/') {  // Landing page is public
    return NextResponse.next()
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

  // Fast auth check using getSession() - reads cookie, no API call
  const { data: { session }, error } = await supabase.auth.getSession()
  
  // Debug logging
  console.log("[Middleware] Path:", request.nextUrl.pathname)
  console.log("[Middleware] Session:", session ? 'EXISTS' : 'NULL')
  console.log("[Middleware] Error:", error?.message || 'none')
  console.log("[Middleware] Cookies:", request.cookies.getAll().map(c => c.name).join(', '))
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/login')
  const isPublicPage = request.nextUrl.pathname === '/'
  const isAuthenticated = !!session
  
  // Redirect unauthenticated users to login (except if already on auth/public pages)
  if (!isAuthenticated && !isAuthPage && !isPublicPage) {
    const loginUrl = new URL('/auth/login', request.url)
    console.log("[Middleware] ❌ No session - Redirecting to login:", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Redirect authenticated users away from login page
  if (isAuthenticated && isAuthPage) {
    const dashboardUrl = new URL('/dashboard', request.url)
    console.log("[Middleware] Redirecting to dashboard:", request.nextUrl.pathname)
    return NextResponse.redirect(dashboardUrl)
  }
  
  console.log("[Middleware] Auth check passed:", request.nextUrl.pathname)
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
