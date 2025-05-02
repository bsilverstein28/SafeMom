import OpenAI from "openai"
import { NextResponse } from "next/server"

// Explicitly set the runtime to nodejs instead of edge
export const runtime = "nodejs"

// Create a singleton instance of the OpenAI client
let openaiInstance: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return null
    }

    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const { imageUrl, prompt } = await req.json()

    // Validate input
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    // Get the OpenAI client
    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json({ error: "OpenAI client initialization failed" }, { status: 500 })
    }

    try {
      const messages = [
        {
          role: "system",
          content:
            "You are a skincare product identification expert. Identify the exact brand and product name from images.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                prompt ||
                "What skincare product is shown in this image? Provide ONLY the brand and product name, nothing else.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "auto" },
            },
          ],
        },
      ]

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 300,
      })

      return NextResponse.json({
        product: completion.choices[0].message.content?.trim(),
      })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Return a proper error response instead of throwing
      return NextResponse.json(
        {
          error: `OpenAI API error: ${openaiError.message}`,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in analyze API:", error)
    return NextResponse.json({ error: `Failed to analyze image: ${error.message}` }, { status: 500 })
  }
}
