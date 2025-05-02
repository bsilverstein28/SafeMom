import OpenAI from "openai"
import { put } from "@vercel/blob"

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
    console.log("Received request to /api/analyze-image")

    // Handle form data with image file
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      console.error("No file provided")
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      console.error("File must be an image")
      return new Response(JSON.stringify({ error: "File must be an image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`Processing image: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    try {
      // Upload to Vercel Blob to get a stable URL
      const blob = await put(`skincare-products/${Date.now()}-${file.name}`, file, {
        access: "public",
      })

      console.log(`File uploaded successfully. URL: ${blob.url}`)

      // Initialize OpenAI client
      if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API key not configured")
        return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      })

      // Use the blob URL for the OpenAI API
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
                  url: blob.url,
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

      return new Response(
        JSON.stringify({
          product: productName,
          imageUrl: blob.url,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      console.error("Error stack:", openaiError.stack)

      return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error in analyze-image API:", error)
    console.error("Error stack:", error.stack)
    return new Response(JSON.stringify({ error: `Failed to analyze image: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
