export async function GET() {
  try {
    // Return basic environment info for debugging
    return new Response(
      JSON.stringify({
        status: "ok",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        openaiKeyConfigured: !!process.env.OPENAI_API_KEY,
        vercelUrl: process.env.VERCEL_URL || "not set",
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "not set",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("Error in debug endpoint:", error)
    return new Response(JSON.stringify({ error: `Debug endpoint error: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
