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
      timeout: 60000, // Increase timeout to 60 seconds
    })
  }
  return openaiInstance
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    let productName
    try {
      const body = await request.json()
      productName = body.productName
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!productName) {
      return new Response(JSON.stringify({ error: "No product name provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get the OpenAI client
    const openai = getOpenAIClient()
    if (!openai) {
      return new Response(JSON.stringify({ error: "OpenAI client initialization failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    try {
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
        return new Response(JSON.stringify({ error: "Could not find ingredients for the product" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(JSON.stringify({ ingredients: ingredientsList }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error finding ingredients:", error)
    return new Response(JSON.stringify({ error: `Failed to find ingredients: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
