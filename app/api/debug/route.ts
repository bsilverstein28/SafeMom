import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return basic environment info for debugging
    return NextResponse.json({
      status: "ok",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      openaiKeyConfigured: !!process.env.OPENAI_API_KEY,
      vercelUrl: process.env.VERCEL_URL || "not set",
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "not set",
    })
  } catch (error) {
    return NextResponse.json({ error: "Debug endpoint error" }, { status: 500 })
  }
}
