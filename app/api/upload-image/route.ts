import { NextResponse } from "next/server"
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

export async function POST(request: Request) {
  try {
    let formData
    try {
      formData = await request.formData()
    } catch (formError) {
      console.error("Error parsing form data:", formError)
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }

    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Check file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 8MB limit" }, { status: 400 })
    }

    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    try {
      // Upload to Vercel Blob
      const blob = await put(`products/${Date.now()}-${file.name}`, file, {
        access: "public",
      })

      console.log(`File uploaded successfully. URL: ${blob.url}`)

      // Now try to identify the product using the OpenAI Vision API
      try {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("OpenAI API key not configured")
        }

        console.log("Identifying product from uploaded image...")

        // Make a direct fetch call to the OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
                    image_url: { url: blob.url, detail: "auto" },
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
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const productName = data.choices[0].message.content?.trim()
        console.log("Product identified:", productName)

        return NextResponse.json({
          success: true,
          url: blob.url,
          product: productName || "Unknown product",
        })
      } catch (openaiError) {
        console.error("Error identifying product:", openaiError)
        // Continue without product identification
      }

      // Return just the URL if product identification failed
      return NextResponse.json({
        success: true,
        url: blob.url,
      })
    } catch (blobError: any) {
      console.error("Error uploading to Vercel Blob:", blobError)
      return NextResponse.json({ error: `Blob storage error: ${blobError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: `Failed to upload image: ${error.message}` }, { status: 500 })
  }
}
