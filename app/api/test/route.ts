export async function GET() {
  try {
    return new Response(JSON.stringify({ message: "API is working" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("Error in test endpoint:", error)
    return new Response(JSON.stringify({ error: `Test endpoint error: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
