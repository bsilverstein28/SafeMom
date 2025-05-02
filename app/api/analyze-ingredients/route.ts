import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Make sure we're using the Node.js runtime
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { ingredients } = await request.json()

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "No ingredients provided" }, { status: 400 })
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

    return NextResponse.json({
      harmfulIngredients: safetyResults.harmfulIngredients || [],
      isSafe: safetyResults.isSafe,
      parsingError: safetyResults.parsingError,
    })
  } catch (error) {
    console.error("Error analyzing ingredients:", error)
    return NextResponse.json({ error: "Failed to analyze ingredients" }, { status: 500 })
  }
}
