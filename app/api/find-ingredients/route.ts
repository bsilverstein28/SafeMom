import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Make sure we're using the Node.js runtime
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { productName } = await request.json()

    if (!productName) {
      return NextResponse.json({ error: "No product name provided" }, { status: 400 })
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
          content: "You are a skincare ingredients expert. List ingredients accurately and concisely.",
        },
        {
          role: "user",
          content: `Find the list of active ingredients for the skincare product: "${productName}". 
          Return ONLY the list of ingredients separated by commas. If you can't find the exact product, 
          provide the most likely ingredients based on similar products from the same brand and line.`,
        },
      ],
      max_tokens: 1000,
    })

    const ingredientsText = completion.choices[0].message.content?.trim() || ""

    const ingredientsList = ingredientsText
      .split(",")
      .map((ingredient) => ingredient.trim())
      .filter((ingredient) => ingredient.length > 0)

    if (ingredientsList.length === 0) {
      return NextResponse.json({ error: "Could not find ingredients for the product" }, { status: 400 })
    }

    return NextResponse.json({ ingredients: ingredientsList })
  } catch (error) {
    console.error("Error finding ingredients:", error)
    return NextResponse.json({ error: "Failed to find ingredients" }, { status: 500 })
  }
}
