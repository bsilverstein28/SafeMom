import OpenAI from "openai"

// Create a singleton instance of the OpenAI client
let openaiInstance: OpenAI | null = null

export function getOpenAIClient() {
  // Check if we're running on the client side
  if (typeof window !== "undefined") {
    console.error("Attempted to initialize OpenAI client on the client side")
    throw new Error("OpenAI client can only be initialized on the server")
  }

  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return null
    }

    try {
      openaiInstance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 60000, // Increase timeout to 60 seconds
        // Remove dangerouslyAllowBrowser flag to prevent client-side usage
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
// Mark this function as server-only
export async function analyzeImageWithVisionAPI(imageUrl: string, prompt: string) {
  // Check if we're running on the client side
  if (typeof window !== "undefined") {
    throw new Error("This function can only be called from the server")
  }

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
      model: "gpt-4-vision-preview",
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
