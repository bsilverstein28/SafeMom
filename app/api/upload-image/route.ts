import { put } from "@vercel/blob"
import { getOpenAIClient } from "@/lib/openai-client"

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

export async function POST(request: Request) {
  try {
    let formData
    try {
      formData = await request.formData()
    } catch (formError) {
      console.error("Error parsing form data:", formError)
      return new Response(JSON.stringify({ error: "Invalid form data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const file = formData.get("file") as File

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "File must be an image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File size exceeds 8MB limit" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    try {
      // Upload to Vercel Blob
      const blob = await put(`skincare-products/${Date.now()}-${file.name}`, file, {
        access: "public",
      })

      console.log(`File uploaded successfully. URL: ${blob.url}`)

      // Now try to identify the product using the OpenAI Vision API
      try {
        const openai = getOpenAIClient()
        if (openai) {
          console.log("Identifying product from uploaded image...")
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
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
                    text: "What skincare product is shown in this image? Provide ONLY the brand and product name, nothing else.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: blob.url, detail: "auto" },
                  },
                ],
              },
            ],
            max_tokens: 300,
          })

          const productName = completion.choices[0].message.content?.trim()
          console.log("Product identified:", productName)

          return new Response(
            JSON.stringify({
              success: true,
              url: blob.url,
              product: productName || "Unknown product",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          )
        }
      } catch (openaiError) {
        console.error("Error identifying product:", openaiError)
        // Continue without product identification
      }

      // Return just the URL if product identification failed
      return new Response(
        JSON.stringify({
          success: true,
          url: blob.url,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (blobError: any) {
      console.error("Error uploading to Vercel Blob:", blobError)
      return new Response(JSON.stringify({ error: `Blob storage error: ${blobError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error uploading image:", error)
    return new Response(JSON.stringify({ error: `Failed to upload image: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
