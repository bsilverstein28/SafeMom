import { NextResponse } from "next/server"

// Drop Edge runtime, use Node.js for higher size limit
export const runtime = "nodejs"

// Raise body-parser cap to 10MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
}

export async function POST(req: Request) {
  try {
    console.log("Received request to /api/analyze-base64")

    // Log environment information
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("VERCEL_ENV:", process.env.VERCEL_ENV)

    // Check for API key presence (without logging the actual key)
    const apiKeyExists = !!process.env.OPENAI_API_KEY
    console.log("OPENAI_API_KEY exists:", apiKeyExists)
    console.log("OPENAI_API_KEY length:", apiKeyExists ? process.env.OPENAI_API_KEY.length : 0)

    // Parse the request body
    let body
    try {
      body = await req.json()
      console.log("Request body parsed successfully")
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { base64Image } = body

    if (!base64Image) {
      console.error("No base64Image provided in request body")
      console.log("Request body keys:", Object.keys(body))
      return NextResponse.json({ error: "No base64Image provided" }, { status: 400 })
    }

    console.log("Base64 image received (length):", base64Image.length)

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
      // Updated request with the new instructions
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
              role: "user",
              content: [
                {
                  type: "text",
                  text: "You are an AI assistant helping determine whether a product is an alcoholic beverage, which is not recommended for pregnant women. Your goal is to issue a warning ONLY when the product is clearly meant for drinking and contains ethanol alcohol.\n\nCRITICAL DISTINCTION:\n- Alcoholic beverages: Products meant to be consumed/drunk that contain ethanol (e.g., wine, beer, spirits, cocktails)\n- Cosmetics/skincare with alcohol: Products meant for external use that may list alcohol as an ingredient\n\nRULES TO FOLLOW:\n\n1. IF AND ONLY IF the product is clearly an alcoholic beverage meant for drinking (wine, beer, spirits, hard seltzer, etc.):\n   Return EXACTLY: 'This product appears to contain alcohol, which is not recommended for pregnant women.'\n\n2. For ALL cosmetics, skincare, cleaning products, or any non-consumable products:\n   Return ONLY the product name/type, such as 'Neutrogena Face Toner' or 'Hand Sanitizer'\n   EVEN IF these products contain alcohol in their ingredients list\n   EVEN IF the product has 'alcohol' in its name (like 'Alcohol-Free Toner' or 'Denatured Alcohol')\n\n3. If you cannot identify the product with confidence:\n   Return EXACTLY: 'I could not confidently identify this product. Please try another image.'\n\nEXAMPLES:\n- Wine bottle → 'This product appears to contain alcohol, which is not recommended for pregnant women.'\n- Vodka → 'This product appears to contain alcohol, which is not recommended for pregnant women.'\n- Face toner with alcohol → 'Facial Toner' (NO WARNING)\n- Hand sanitizer → 'Hand Sanitizer' (NO WARNING)\n- Rubbing alcohol → 'Rubbing Alcohol' (NO WARNING)\n- Makeup remover with denatured alcohol → 'Makeup Remover' (NO WARNING)\n\nREMEMBER: ONLY consumable alcoholic beverages should trigger the warning message. ALL other products, even if they contain alcohol as an ingredient, should NOT trigger the warning.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
      })

      const data = await response.json()
      console.log("OpenAI API response:", data)

      if (!response.ok) {
        console.error("OpenAI API error:", data)
        return NextResponse.json({ error: "Error from OpenAI", details: data }, { status: response.status })
      }

      // Extract the product name from the response
      let productName = "Unknown product"
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        productName = data.choices[0].message.content || "Unknown product"
        console.log("Extracted product name:", productName)
      }

      // Return both the raw response and the extracted product name
      return NextResponse.json({ ...data, product: productName })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      console.error("Error stack:", openaiError.stack)

      return NextResponse.json({ error: `OpenAI API error: ${openaiError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in analyze-base64 API:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ error: `Failed to analyze image: ${error.message}` }, { status: 500 })
  }
}
