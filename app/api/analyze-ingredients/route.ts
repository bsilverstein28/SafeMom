import { NextResponse } from "next/server"

// Explicitly set the runtime to nodejs
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    // Parse the request body
    let ingredients
    try {
      const body = await request.json()
      ingredients = body.ingredients
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "No ingredients provided" }, { status: 400 })
    }

    // Access the API key securely
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("API key is missing")
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 })
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
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a pregnancy safety expert for skincare ingredients. Provide accurate analysis in JSON format.",
            },
            {
              role: "user",
              content: `Analyze these skincare ingredients for safety during pregnancy:
              ${ingredients.join(", ")}
              
              For each potentially harmful ingredient, explain why it's concerning during pregnancy.
              
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
