import OpenAI from "openai"

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

// Create a singleton instance of the OpenAI client
let openaiInstance: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return null
    }

    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000, // Increase timeout to 60 seconds
    })
  }
  return openaiInstance
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
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { imageUrl, prompt } = body

    // Validate input
    if (!imageUrl) {
      console.error("No image URL provided")
      return new Response(JSON.stringify({ error: "No image URL provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("Image URL received:", imageUrl.substring(0, 50) + "...")

    // Get the OpenAI client
    const openai = getOpenAIClient()
    if (!openai) {
      console.error("OpenAI client initialization failed")
      return new Response(JSON.stringify({ error: "OpenAI client initialization failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("OpenAI client initialized successfully")

    try {
      console.log("Calling OpenAI API...")

      const messages = [
        {
          role: "system",
          content:
            "You are a skincare product identification expert. Identify the exact brand and product name from images.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                prompt ||
                "What skincare product is shown in this image? Provide ONLY the brand and product name, nothing else.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "auto" },
            },
          ],
        },
      ]

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 300,
      })

      const productName = completion.choices[0].message.content?.trim()
      console.log("Product identified:", productName)

      return new Response(JSON.stringify({ product: productName }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Return a proper error response instead of throwing
      return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error in analyze API:", error)
    return new Response(JSON.stringify({ error: `Failed to analyze image: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
