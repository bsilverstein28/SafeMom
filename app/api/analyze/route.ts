import OpenAI from "openai"

// Use Node.js runtime instead of edge for larger payloads
export const runtime = "nodejs"

const openai = new OpenAI() // env var picked up automatically

export async function POST(req: Request) {
  try {
    const { imageUrl, prompt } = await req.json()

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

    return Response.json({
      product: completion.choices[0].message.content?.trim(),
    })
  } catch (error) {
    console.error("Error in analyze API:", error)
    return Response.json({ error: "Failed to analyze image" }, { status: 500 })
  }
}
