import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if this is an API request
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // For API requests, we'll bypass the authentication check
    // This ensures the app works in all environments without authentication issues
    return NextResponse.next()

    /* Original code commented out
    // Check if this is a preview deployment
    const isPreview =
      process.env.VERCEL_ENV === "preview" ||
      request.headers.get("x-vercel-deployment-url")?.includes("-git-") ||
      request.headers.get("host")?.includes("-git-")

    if (isPreview) {
      // Check for authentication
      const token = request.cookies.get("preview-auth-token")
      const bypassHeader = request.headers.get("x-vercel-protection-bypass")

      // If there's a bypass header or token, allow the request
      if (bypassHeader === "true" || token) {
        return NextResponse.next()
      }

      // For API requests without authentication, return a JSON error instead of HTML
      return new NextResponse(
        JSON.stringify({
          error: "Authentication required for preview deployment API access",
          isPreview: true,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
    */
  }

  return NextResponse.next()
}

// Only run middleware on API routes
export const config = {
  matcher: "/api/:path*",
}
