import OpenAI from "openai"

// Explicitly set the runtime to nodejs for secure server-side execution
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    console.log("Received request to /api/find-ingredients")

    // Parse the request body
    let productName
    try {
      const body = await request.json()
      productName = body.productName
      console.log("Product name received:", productName)
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!productName) {
      console.error("No product name provided in request")
      return new Response(JSON.stringify({ error: "No product name provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Initialize OpenAI client directly in the API route
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    try {
      // Create a new OpenAI client instance for this request
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 60000, // 60 seconds timeout
      })

      console.log("Calling OpenAI API to find ingredients for:", productName)

      // Use a specific prompt asking for ingredients in the identified product
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a skincare ingredients expert. List ingredients accurately and concisely.",
          },
          {
            role: "user",
            content: `What ingredients are in ${productName}? Return ONLY the list of ingredients separated by commas. If you can't find the exact product, provide the most likely ingredients based on similar products from the same brand and line.`,
          },
        ],
        max_tokens: 1000,
      })

      const ingredientsText = completion.choices[0].message.content?.trim() || ""
      console.log("Ingredients text from OpenAI:", ingredientsText)

      const ingredientsList = ingredientsText
        .split(",")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length > 0)

      if (ingredientsList.length === 0) {
        console.error("No ingredients found in OpenAI response")
        return new Response(JSON.stringify({ error: "Could not find ingredients for the product" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      console.log("Returning ingredients list:", ingredientsList)
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
