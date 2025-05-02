import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

// Drop Edge runtime, use Node.js for higher size limit
export const runtime = "nodejs"

// Raise body-parser cap to 10MB
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
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

    // Upload to Vercel Blob
    const blob = await put(`skincare-products/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    console.log(`File uploaded successfully. URL: ${blob.url}`)

    return NextResponse.json({
      success: true,
      url: blob.url,
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
