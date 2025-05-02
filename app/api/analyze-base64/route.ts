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

    // Access the API key securely
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("API key is missing")
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 })
    }

    try {
      // Construct the request exactly as shown in the example
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
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
                {
                  type: "text",
                  text: "What product is shown in this image? Provide ONLY the brand and product name.",
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
