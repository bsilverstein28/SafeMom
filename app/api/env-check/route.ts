import { NextResponse } from "next/server"

// Explicitly set the runtime to nodejs
export const runtime = "nodejs"

export async function GET() {
  try {
    // Check for API key presence (without logging the actual key)
    const apiKeyExists = !!process.env.OPENAI_API_KEY

    // Get a list of available environment variables (excluding any with "key" in the name for security)
    const safeEnvVars = Object.keys(process.env)
      .filter(
        (key) =>
          !key.toLowerCase().includes("key") &&
          !key.toLowerCase().includes("secret") &&
          !key.toLowerCase().includes("token"),
      )
      .reduce(
        (obj, key) => {
          obj[key] = process.env[key]?.substring(0, 3) + "..." || null
          return obj
        },
        {} as Record<string, string | null>,
      )

    return NextResponse.json({
      status: "ok",
      environment: process.env.NODE_ENV,
      vercelEnvironment: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString(),
      openaiKeyConfigured: apiKeyExists,
      openaiKeyLength: apiKeyExists ? process.env.OPENAI_API_KEY!.length : 0,
      availableEnvVars: safeEnvVars,
    })
  } catch (error: any) {
    console.error("Error in env-check endpoint:", error)
    return NextResponse.json({ error: `Environment check error: ${error.message}` }, { status: 500 })
  }
}
