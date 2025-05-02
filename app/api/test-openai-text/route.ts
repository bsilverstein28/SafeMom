export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    console.log("Testing OpenAI API for text completion with direct fetch...")

    // Check for API key presence
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("API key missing in environment")
      return new Response(JSON.stringify({ error: "API key not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Test a simple text completion
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
              role: "system",
              content: "You are a skincare ingredients expert. List ingredients accurately and concisely.",
            },
            {
              role: "user",
              content: "List the common ingredients in CeraVe Moisturizing Cream.",
            },
          ],
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      const responseText = data.choices[0].message.content?.trim() || "No response"

      return new Response(
        JSON.stringify({
          status: "success",
          message: "OpenAI text completion is working correctly",
          response: responseText,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (apiError: any) {
      console.error("OpenAI API test error:", apiError)
      return new Response(JSON.stringify({ error: `OpenAI API test error: ${apiError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error in test-openai-text endpoint:", error)
    return new Response(JSON.stringify({ error: `Test failed: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
