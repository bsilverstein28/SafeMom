import { NextResponse } from "next/server"
import OpenAI from "openai"

// Explicitly set the runtime to nodejs
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

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    // Get the OpenAI client
    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json({ error: "OpenAI client initialization failed" }, { status: 500 })
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
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
                text: "What skincare product is shown in this image? Provide ONLY the brand and product name, nothing else.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl, detail: "auto" },
              },
            ],
          },
        ],
        max_tokens: 300,
      })

      const productName = completion.choices[0].message.content?.trim()

      if (!productName) {
        return NextResponse.json({ error: "Could not identify product from image" }, { status: 400 })
      }

      return NextResponse.json({ product: productName })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      return NextResponse.json({ error: `OpenAI API error: ${openaiError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error identifying product:", error)
    return NextResponse.json({ error: `Failed to identify product: ${error.message}` }, { status: 500 })
  }
}
