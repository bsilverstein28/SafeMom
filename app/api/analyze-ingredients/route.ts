import { NextResponse } from "next/server"

// Explicitly set the runtime to nodejs
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    console.log("Received request to /api/analyze-ingredients")

    // Log environment information
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("VERCEL_ENV:", process.env.VERCEL_ENV)

    // Check for API key presence (without logging the actual key)
    const apiKeyExists = !!process.env.OPENAI_API_KEY
    console.log("OPENAI_API_KEY exists:", apiKeyExists)
    console.log("OPENAI_API_KEY length:", apiKeyExists ? process.env.OPENAI_API_KEY.length : 0)

    // Parse the request body
    let ingredients
    let productName
    let isFood = false
    try {
      const body = await request.json()
      ingredients = body.ingredients
      productName = body.productName || ""
      isFood = body.isFood || false
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "No ingredients provided" }, { status: 400 })
    }

    // Access the API key securely with detailed error logging
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("API key missing in environment")
      console.error(
        "Available environment variables:",
        Object.keys(process.env)
          .filter((key) => !key.toLowerCase().includes("key"))
          .join(", "),
      )
      return NextResponse.json({ error: "API key not found" }, { status: 500 })
    }

    try {
      // Make a direct fetch call to the OpenAI API
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
              content:
                "You are an expert in pregnancy safety for both skincare products and food items. You provide accurate analysis of ingredients based on current medical guidelines for pregnant women.",
            },
            {
              role: "user",
              content: `Analyze these ingredients ${
                productName ? `from "${productName}"` : ""
              } for safety during pregnancy:
              ${ingredients.join(", ")}
              
              ${
                isFood
                  ? `This is a food product. Consider common food safety concerns during pregnancy such as:
                  - High mercury fish (shark, swordfish, king mackerel, tilefish)
                  - Raw or undercooked seafood, eggs, or meat
                  - Unpasteurized dairy products or juices
                  - Deli meats and hot dogs (unless heated until steaming)
                  - High caffeine content
                  - Alcohol
                  - Raw sprouts
                  - Unwashed produce
                  - Excessive added sugars
                  - Artificial sweeteners (in moderation)
                  - Food additives like nitrates/nitrites
                  - Herbs that may stimulate contractions (e.g., sage, rosemary in large amounts)`
                  : `This is a skincare/cosmetic product. Consider ingredients that may be absorbed through the skin and potentially affect pregnancy, such as:
                  - Retinoids (retinol, tretinoin, adapalene, etc.)
                  - High-concentration salicylic acid
                  - Hydroquinone
                  - Chemical sunscreens (oxybenzone)
                  - Formaldehyde and formaldehyde-releasing preservatives
                  - Phthalates
                  - Parabens
                  - Essential oils in high concentrations
                  - Aluminum chloride
                  - Thioglycolic acid
                  - Dihydroxyacetone (DHA) in spray tans
                  - Botulinum toxin
                  - Certain hair dyes`
              }
              
              For each potentially harmful ingredient, explain why it's concerning during pregnancy and the potential risks.
              
              You MUST respond with ONLY a valid JSON object using this exact structure:
              {
                "harmfulIngredients": [
                  {"name": "ingredient name", "reason": "why it's harmful during pregnancy"}
                ],
                "isSafe": boolean
              }
              
              If none are harmful, return an empty array for harmfulIngredients and set isSafe to true.
              Do not include any text before or after the JSON.`,
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
      const safetyAnalysisText = data.choices[0].message.content?.trim() || ""

      // Try to parse the JSON response, with fallback for malformed JSON
      let safetyResults
      try {
        // Clean the response to ensure it's valid JSON
        const jsonText = safetyAnalysisText.trim()
        // Extract JSON if it's wrapped in backticks or other text
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
        const cleanedJson = jsonMatch ? jsonMatch[0] : jsonText

        safetyResults = JSON.parse(cleanedJson)

        // Validate the structure
        if (!safetyResults.hasOwnProperty("harmfulIngredients") || !safetyResults.hasOwnProperty("isSafe")) {
          throw new Error("Invalid response structure")
        }
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError)
        // Fallback to a default structure
        safetyResults = {
          harmfulIngredients: [],
          isSafe: false,
          parsingError: true,
        }
      }

      return NextResponse.json({
        harmfulIngredients: safetyResults.harmfulIngredients || [],
        isSafe: safetyResults.isSafe,
        parsingError: safetyResults.parsingError,
      })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      return NextResponse.json({ error: `OpenAI API error: ${openaiError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error analyzing ingredients:", error)
    return NextResponse.json({ error: `Failed to analyze ingredients: ${error.message}` }, { status: 500 })
  }
}
