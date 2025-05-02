import { analyzeImageWithVisionAPI } from "@/lib/openai-client"

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

    try {
      const result = await analyzeImageWithVisionAPI(imageUrl, "What is shown in this image? Describe briefly.")

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
