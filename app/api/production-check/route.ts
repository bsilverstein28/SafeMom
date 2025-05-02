import { NextResponse } from "next/server"

// Explicitly set the runtime to nodejs
export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    // Get request information
    const requestUrl = request.url
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Check for API key presence (without logging the actual key)
    const apiKeyExists = !!process.env.OPENAI_API_KEY

    // Get environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      IS_PRODUCTION: process.env.NODE_ENV === "production",
      VERCEL_URL: process.env.VERCEL_URL || "not set",
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "not set",
      OPENAI_API_KEY_EXISTS: apiKeyExists,
      OPENAI_API_KEY_LENGTH: apiKeyExists ? process.env.OPENAI_API_KEY!.length : 0,
    }

    // Test OpenAI API connectivity
    let openaiStatus = "not_tested"
    let openaiError = null

    if (apiKeyExists) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant.",
              },
              {
                role: "user",
                content: "Say hello!",
              },
            ],
            max_tokens: 10,
          }),
        })

        if (response.ok) {
          openaiStatus = "connected"
        } else {
          openaiStatus = "error"
          const errorData = await response.text()
          openaiError = `Status ${response.status}: ${errorData.substring(0, 100)}...`
        }
      } catch (error: any) {
        openaiStatus = "error"
        openaiError = error.message
      }
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      request: {
        url: requestUrl,
        headers: {
          host: headers.host || "unknown",
          referer: headers.referer || "none",
          "user-agent": headers["user-agent"] || "unknown",
        },
      },
      environment: envInfo,
      openai: {
        status: openaiStatus,
        error: openaiError,
      },
    })
  } catch (error: any) {
    console.error("Error in production-check endpoint:", error)
    return NextResponse.json({ error: `Check failed: ${error.message}` }, { status: 500 })
  }
}
