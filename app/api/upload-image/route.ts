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
