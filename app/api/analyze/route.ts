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
    console.log("Received request to /api/analyze")

    // Parse the request body
    let body
    try {
      body = await req.json()
      console.log("Request body parsed successfully")
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Check for either imageUrl or base64Image
    const { imageUrl, base64Image } = body

    if (!imageUrl && !base64Image) {
      console.error("Neither imageUrl nor base64Image provided in request body")
      console.log("Request body keys:", Object.keys(body))
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    // Log what we received
    if (imageUrl) {
      console.log("Image URL received (length):", imageUrl.length)
    }
    if (base64Image) {
      console.log("Base64 image received (length):", base64Image.length)
    }

    // Access the API key securely
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("API key is missing")
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 })
    }

    try {
      // Determine which image source to use
      let imageSource
      if (base64Image) {
        imageSource = {
          url: `data:image/jpeg;base64,${base64Image}`,
        }
      } else if (imageUrl) {
        imageSource = {
          url: imageUrl,
        }
      } else {
        return NextResponse.json({ error: "No valid image source provided" }, { status: 400 })
      }

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
                  image_url: imageSource,
                },
                {
                  type: "text",
                  text: "What product is shown in this image? This could be a skincare product, makeup, food item (including prepared foods), or other consumer product. Provide ONLY the brand and product name or dish name for prepared foods. If you cannot identify the product clearly, respond with exactly: 'I'm unable to identify this. Please try another image.'",
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
      }

      console.log("Product identified:", productName)

      return NextResponse.json({ product: productName, rawResponse: data })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      console.error("Error stack:", openaiError.stack)

      return NextResponse.json({ error: `OpenAI API error: ${openaiError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in analyze API:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ error: `Failed to analyze image: ${error.message}` }, { status: 500 })
  }
}
