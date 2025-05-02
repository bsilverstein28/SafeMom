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

    const { imageUrl } = body

    // Validate input
    if (!imageUrl || typeof imageUrl !== "string") {
      console.error("No valid image URL provided")
      return new Response(JSON.stringify({ error: "No valid image URL provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("Image URL received (length):", imageUrl.length)

    // Initialize OpenAI client directly in this function
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    try {
      // Create a new instance of the OpenAI client for this request
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      })

      console.log("OpenAI client initialized successfully")

      // Create a simple text-only prompt first to test the client
      const textCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: "Identify a skincare product from the description I'll provide next.",
          },
        ],
        max_tokens: 50,
      })

      console.log("Text completion successful")

      // Now try with the image
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a skincare product identification expert.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What skincare product is shown in this image? Provide ONLY the brand and product name.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      })

      // Safely extract the product name
      let productName = "Unknown product"
      if (completion && completion.choices && completion.choices[0] && completion.choices[0].message) {
        productName = completion.choices[0].message.content || "Unknown product"
      }

      console.log("Product identified:", productName)

      return new Response(JSON.stringify({ product: productName }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      console.error("Error stack:", openaiError.stack)

      // Check for specific error patterns
      if (openaiError.message && openaiError.message.includes("toLowerCase")) {
        console.error("toLowerCase error detected - likely an issue with the image URL format")
        return new Response(
          JSON.stringify({
            error: "There was an issue processing the image. Please try a different image or format.",
            details: "Image URL format may be incompatible with the API.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error in analyze API:", error)
    console.error("Error stack:", error.stack)
    return new Response(JSON.stringify({ error: `Failed to analyze image: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
