import { NextResponse, type NextRequest } from "next/server"
import { getCookieCache, getSessionCookie } from "better-auth/cookies"

const publicRoutes = ["/sign-in"]

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)
  const isPublicRoute = publicRoutes.includes(pathname)

  if (!sessionCookie) {
    if (isPublicRoute) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  const cookieCache = await getCookieCache(request)
  const role = cookieCache?.user.role
  const dashboard = role === "admin" ? "/admin/dashboard" : "/agents/dashboard"

  if (isPublicRoute || pathname === "/") {
    return NextResponse.redirect(new URL(dashboard, request.url))
  }

  if (pathname.startsWith("/admin") && role && role !== "admin") {
    return NextResponse.redirect(new URL("/agents/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
}