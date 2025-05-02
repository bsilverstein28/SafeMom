import { getOpenAIClient } from "@/lib/openai-client"

export async function GET() {
  try {
    console.log("Testing OpenAI client initialization...")

    // Get the OpenAI client
    const openai = getOpenAIClient()
    if (!openai) {
      console.error("OpenAI client initialization failed")
      return new Response(JSON.stringify({ error: "OpenAI client initialization failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Test a simple completion to verify the client works
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: "Say hello!",
          },
        ],
        max_tokens: 50,
      })

      const response = completion.choices[0].message.content?.trim() || "No response"

      return new Response(
        JSON.stringify({
          status: "success",
          message: "OpenAI client is working correctly",
          response,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (openaiError: any) {
      console.error("OpenAI API test error:", openaiError)
      return new Response(JSON.stringify({ error: `OpenAI API test error: ${openaiError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error in test-openai endpoint:", error)
    return new Response(JSON.stringify({ error: `Test failed: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
