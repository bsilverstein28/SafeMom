import { cookies } from "next/headers"

export async function GET() {
  try {
    // Check if this is a preview deployment
    const isPreview = process.env.VERCEL_ENV === "preview"

    // Check for authentication token in cookies
    const cookieStore = cookies()
    const token = cookieStore.get("preview-auth-token")

    return new Response(
      JSON.stringify({
        isPreview,
        isAuthenticated: !!token,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("Error in auth-status endpoint:", error)
    return new Response(JSON.stringify({ error: `Auth status error: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
