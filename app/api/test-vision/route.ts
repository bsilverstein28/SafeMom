export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const imageUrl = url.searchParams.get("imageUrl")

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image URL provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("Testing Vision API with image URL:", imageUrl.substring(0, 50) + "...")

    // Check for API key presence
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("API key missing in environment")
      return new Response(JSON.stringify({ error: "API key not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
                    url: imageUrl,
                  },
                },
                {
                  type: "text",
                  text: "What is shown in this image? Describe briefly.",
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

      const result = await response.json()

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Vision API test successful",
          result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (apiError: any) {
      console.error("Vision API test error:", apiError)
      return new Response(JSON.stringify({ error: `Vision API test error: ${apiError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error in test-vision endpoint:", error)
    return new Response(JSON.stringify({ error: `Test failed: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
