import { NextResponse } from "next/server"

// Explicitly set the runtime to nodejs for secure server-side execution
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    console.log("Received request to /api/find-ingredients")

    // Log environment information
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("VERCEL_ENV:", process.env.VERCEL_ENV)
    console.log("Request URL:", request.url)

    // Check for API key presence (without logging the actual key)
    const apiKeyExists = !!process.env.OPENAI_API_KEY
    console.log("OPENAI_API_KEY exists:", apiKeyExists)
    console.log("OPENAI_API_KEY length:", apiKeyExists ? process.env.OPENAI_API_KEY.length : 0)

    // Parse the request body
    let productName
    try {
      const body = await request.json()
      productName = body.productName
      console.log("Product name received:", productName)
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!productName) {
      console.error("No product name provided in request")
      return NextResponse.json({ error: "No product name provided" }, { status: 400 })
    }

    // Access the API key securely with detailed error logging
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("API key missing in environment")
      console.error(
        "Available environment variables:",
        Object.keys(process.env)
          .filter((key) => !key.toLowerCase().includes("key") && !key.toLowerCase().includes("secret"))
          .join(", "),
      )
      return NextResponse.json({ error: "API key not found" }, { status: 500 })
    }

    try {
      console.log("Calling OpenAI API to find ingredients for:", productName)

      // Make a direct fetch call to the OpenAI API with a more structured prompt
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a skincare ingredients expert. List ingredients accurately and concisely.",
            },
            {
              role: "user",
              content: `What ingredients are in ${productName}? Return the list of ingredients separated by commas. 
              
              CRITICAL DISTINCTION:
              - Alcoholic beverages: Products meant to be consumed/drunk that contain ethanol (e.g., wine, beer, spirits, cocktails)
              - Cosmetics/skincare with alcohol: Products meant for external use that may list alcohol as an ingredient
              
              RULES TO FOLLOW:
              
              1. IF AND ONLY IF the product is clearly an alcoholic beverage meant for drinking (wine, beer, spirits, hard seltzer, etc.):
                 Return EXACTLY: "CONTAINS_ALCOHOL: YES" on a new line after listing ingredients.
              
              2. For ALL cosmetics, skincare, cleaning products, or any non-consumable products:
                 Return "CONTAINS_ALCOHOL: NO" on a new line after listing ingredients
                 EVEN IF these products contain alcohol in their ingredients list (like cetyl alcohol, denatured alcohol, etc.)
                 EVEN IF the product has 'alcohol' in its name (like 'Alcohol-Free Toner' or 'Denatured Alcohol')
              
              EXAMPLES:
              - Wine → "Water, grapes, ethanol, sulfites" followed by "CONTAINS_ALCOHOL: YES"
              - Face toner with alcohol → "Water, glycerin, alcohol denat, fragrance" followed by "CONTAINS_ALCOHOL: NO"
              - Hand sanitizer → "Ethyl alcohol, water, glycerin" followed by "CONTAINS_ALCOHOL: NO"
              
              REMEMBER: ONLY consumable alcoholic beverages should be marked with "CONTAINS_ALCOHOL: YES". ALL other products, even if they contain alcohol as an ingredient, should be marked with "CONTAINS_ALCOHOL: NO".
              
              If you can't find the exact product, provide the most likely ingredients based on similar products from the same brand and line.`,
            },
          ],
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`OpenAI API error (${response.status}):`, errorText)
        return NextResponse.json(
          { error: `OpenAI API error: ${response.status} ${response.statusText}` },
          { status: 500 },
        )
      }

      const data = await response.json()
      const responseText = data.choices[0].message.content?.trim() || ""
      console.log("Full response text from OpenAI:", responseText)

      // Split the response to separate ingredients from the alcohol indicator
      const parts = responseText.split(/\r?\n/)

      // Get the ingredients from the first part
      const ingredientsText = parts[0]
      const ingredientsList = ingredientsText
        .split(",")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length > 0)

      // Check if any part contains the alcohol indicator
      const containsAlcohol = parts.some((part) => part.trim().toUpperCase().includes("CONTAINS_ALCOHOL: YES"))

      console.log("Parsed ingredients:", ingredientsList)
      console.log("Contains alcohol:", containsAlcohol)

      if (ingredientsList.length === 0) {
        console.error("No ingredients found in OpenAI response")
        return NextResponse.json({ error: "Could not find ingredients for the product" }, { status: 400 })
      }

      if (containsAlcohol) {
        console.log("Alcohol detected in product")
        return NextResponse.json({
          ingredients: ingredientsList,
          containsAlcohol: true,
          alcoholWarning: "This product appears to contain alcohol, which is not recommended for pregnant women",
        })
      } else {
        return NextResponse.json({ ingredients: ingredientsList, containsAlcohol: false })
      }
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      return NextResponse.json({ error: `OpenAI API error: ${openaiError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error finding ingredients:", error)
    return NextResponse.json({ error: `Failed to find ingredients: ${error.message}` }, { status: 500 })
  }
}
