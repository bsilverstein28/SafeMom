import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Make sure we're using the Node.js runtime
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    // Check if we have an API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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
  } catch (error) {
    console.error("Error identifying product:", error)
    return NextResponse.json({ error: "Failed to identify product" }, { status: 500 })
  }
}
