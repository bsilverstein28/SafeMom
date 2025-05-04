// This file now only contains helper functions for making direct fetch calls to OpenAI API
// No SDK is used

/**
 * Helper function to make a direct API call to the OpenAI API for text completion
 */
export async function fetchOpenAICompletion(
  prompt: string,
  systemPrompt = "You are a helpful assistant.",
  model = "gpt-4o-mini",
  maxTokens = 1000,
) {
  if (typeof window !== "undefined") {
    throw new Error("OpenAI API should not be called from browser environment")
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
  }

  return await response.json()
}

/**
 * Helper function to make a direct API call to the OpenAI Vision API
 */
export async function analyzeImageWithVisionAPI(imageUrl: string, prompt: string) {
  if (typeof window !== "undefined") {
    throw new Error("Vision API should not be called from browser environment")
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

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
              text: prompt || "What product is shown in this image? Provide ONLY the brand and product name.",
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
