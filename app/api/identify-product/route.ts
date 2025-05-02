import { NextResponse } from "next/server"
import OpenAI from "openai"

// Drop Edge runtime, use Node.js for higher size limit
export const runtime = "nodejs"

// Raise body-parser cap to 10MB
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
}

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
    console.log("Received request to identify-product API")

    // Parse the request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { imageUrl } = requestBody

    if (!imageUrl) {
      console.error("No image URL provided")
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    console.log("Processing image URL:", imageUrl.substring(0, 50) + "...")

    // Get the OpenAI client
    const openai = getOpenAIClient()
    if (!openai) {
      console.error("OpenAI client initialization failed")
      return NextResponse.json({ error: "OpenAI client initialization failed" }, { status: 500 })
    }

    try {
      console.log("Calling OpenAI API...")

      // Validate the image URL before sending to OpenAI
      if (!imageUrl.startsWith("http")) {
        console.error("Invalid image URL format")
        return NextResponse.json({ error: "Invalid image URL format" }, { status: 400 })
      }

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
      console.log("Product identified:", productName)

      if (!productName) {
        return NextResponse.json({ error: "Could not identify product from image" }, { status: 400 })
      }

      return NextResponse.json({ product: productName })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Check if it's an OpenAI API error with a response
      if (openaiError.response) {
        console.error("OpenAI API error response:", openaiError.response)
      }

      return NextResponse.json(
        {
          error: `OpenAI API error: ${openaiError.message}`,
          details: openaiError.response || "No additional details",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error identifying product:", error)
    return NextResponse.json({ error: `Failed to identify product: ${error.message}` }, { status: 500 })
  }
}
