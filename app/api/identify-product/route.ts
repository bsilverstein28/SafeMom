import { NextResponse } from "next/server"

// Drop Edge runtime, use Node.js for higher size limit
export const runtime = "nodejs"

// Raise body-parser cap to 10MB
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
}

export async function POST(request: Request) {
  try {
    console.log("Received request to identify-product API")

    // Parse the request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { imageUrl } = requestBody

    if (!imageUrl) {
      console.error("No image URL provided")
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    console.log("Processing image URL:", imageUrl.substring(0, 50) + "...")

    // Access the API key securely
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("API key is missing")
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 })
    }

    try {
      console.log("Calling OpenAI API...")

      // Validate the image URL before sending to OpenAI
      if (!imageUrl.startsWith("http")) {
        console.error("Invalid image URL format")
        return NextResponse.json({ error: "Invalid image URL format" }, { status: 400 })
      }

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
                "You are a product identification expert. Identify the exact brand and product name from images.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "What product is shown in this image? Provide ONLY the brand and product name, nothing else.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl, detail: "auto" },
                },
              ],
            },
          ],
          max_tokens: 300,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`OpenAI API error (${response.status}):`, errorText)
        return NextResponse.json(
          {
            error: `OpenAI API error: ${response.status} ${response.statusText}`,
            details: errorText,
          },
          { status: 500 },
        )
      }

      const data = await response.json()
      const productName = data.choices[0].message.content?.trim()
      console.log("Product identified:", productName)

      if (!productName) {
        return NextResponse.json({ error: "Could not identify product from image" }, { status: 400 })
      }

      return NextResponse.json({ product: productName })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Check if it's an OpenAI API error with a response
      if (openaiError.response) {
        console.error("OpenAI API error response:", openaiError.response)
      }

      return NextResponse.json(
        {
          error: `OpenAI API error: ${openaiError.message}`,
          details: openaiError.response || "No additional details",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error identifying product:", error)
    return NextResponse.json({ error: `Failed to identify product: ${error.message}` }, { status: 500 })
  }
}
