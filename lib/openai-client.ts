import OpenAI from "openai"

// Create a singleton instance of the OpenAI client
let openaiInstance: OpenAI | null = null

export function getOpenAIClient() {
  // In API routes, we're definitely on the server
  // No need to check for window as API routes always run on the server
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return null
    }

    try {
      openaiInstance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 60000, // Increase timeout to 60 seconds
      })
      console.log("OpenAI client initialized successfully")
    } catch (error) {
      console.error("Error initializing OpenAI client:", error)
      return null
    }
  }
  return openaiInstance
}

// Helper function to make a direct API call to the vision API
export async function analyzeImageWithVisionAPI(imageUrl: string, prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  // Create the request body exactly as specified in the example
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
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl, // This should be either a public URL or a data:image/jpeg;base64 string
              },
            },
            {
              type: "text",
              text: prompt || "What skincare product is shown in this image? Provide ONLY the brand and product name.",
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
  }

  return await response.json()
}
