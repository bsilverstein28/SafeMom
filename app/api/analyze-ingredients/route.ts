import { getOpenAIClient } from "@/lib/openai-client"

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
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(JSON.stringify({ error: "No ingredients provided" }), {
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
      })

      const safetyAnalysisText = completion.choices[0].message.content?.trim() || ""

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

      return new Response(
        JSON.stringify({
          harmfulIngredients: safetyResults.harmfulIngredients || [],
          isSafe: safetyResults.isSafe,
          parsingError: safetyResults.parsingError,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error analyzing ingredients:", error)
    return new Response(JSON.stringify({ error: `Failed to analyze ingredients: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
