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

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export async function POST(req: Request) {
  try {
    console.log("Received request to /api/analyze-image")

    // Handle form data with image file
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      console.error("No file provided")
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      console.error("File must be an image")
      return new Response(JSON.stringify({ error: "File must be an image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`Processing image: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    try {
      // Convert the file to base64
      const base64DataUrl = await fileToBase64(file)
      const base64Image = base64DataUrl.split(",")[1] // Remove the data:image/jpeg;base64, prefix
      console.log("Image converted to base64 (length):", base64Image.length)

      // Also upload to Vercel Blob as a backup approach
      const blob = await put(`skincare-products/${Date.now()}-${file.name}`, file, {
        access: "public",
      })
      console.log(`File also uploaded to Blob. URL: ${blob.url}`)

      // Make a direct fetch call to the OpenAI API with the updated instructions
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
                  type: "text",
                  text: "You are an AI assistant helping determine whether a product is an alcoholic beverage, which is not recommended for pregnant women. Your goal is to issue a warning ONLY when the product is clearly meant for drinking and contains ethanol alcohol.\n\nCRITICAL DISTINCTION:\n- Alcoholic beverages: Products meant to be consumed/drunk that contain ethanol (e.g., wine, beer, spirits, cocktails)\n- Cosmetics/skincare with alcohol: Products meant for external use that may list alcohol as an ingredient\n\nRULES TO FOLLOW:\n\n1. IF AND ONLY IF the product is clearly an alcoholic beverage meant for drinking (wine, beer, spirits, hard seltzer, etc.):\n   Return EXACTLY: 'This product appears to contain alcohol, which is not recommended for pregnant women.'\n\n2. For ALL cosmetics, skincare, cleaning products, or any non-consumable products:\n   Return ONLY the product name/type, such as 'Neutrogena Face Toner' or 'Hand Sanitizer'\n   EVEN IF these products contain alcohol in their ingredients list\n   EVEN IF the product has 'alcohol' in its name (like 'Alcohol-Free Toner' or 'Denatured Alcohol')\n\n3. If you cannot identify the product with confidence:\n   Return EXACTLY: 'I could not confidently identify this product. Please try another image.'\n\nEXAMPLES:\n- Wine bottle → 'This product appears to contain alcohol, which is not recommended for pregnant women.'\n- Vodka → 'This product appears to contain alcohol, which is not recommended for pregnant women.'\n- Face toner with alcohol → 'Facial Toner' (NO WARNING)\n- Hand sanitizer → 'Hand Sanitizer' (NO WARNING)\n- Rubbing alcohol → 'Rubbing Alcohol' (NO WARNING)\n- Makeup remover with denatured alcohol → 'Makeup Remover' (NO WARNING)\n\nREMEMBER: ONLY consumable alcoholic beverages should trigger the warning message. ALL other products, even if they contain alcohol as an ingredient, should NOT trigger the warning.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`OpenAI API error (${response.status}):`, errorText)

        // If base64 approach fails, try with the blob URL as fallback
        if (response.status === 400) {
          console.log("Trying fallback with blob URL...")

          const fallbackResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
                      type: "text",
                      text: "You are an AI assistant helping determine whether a product is an alcoholic beverage, which is not recommended for pregnant women. Your goal is to issue a warning ONLY when the product is clearly meant for drinking and contains ethanol alcohol.\n\nCRITICAL DISTINCTION:\n- Alcoholic beverages: Products meant to be consumed/drunk that contain ethanol (e.g., wine, beer, spirits, cocktails)\n- Cosmetics/skincare with alcohol: Products meant for external use that may list alcohol as an ingredient\n\nRULES TO FOLLOW:\n\n1. IF AND ONLY IF the product is clearly an alcoholic beverage meant for drinking (wine, beer, spirits, hard seltzer, etc.):\n   Return EXACTLY: 'This product appears to contain alcohol, which is not recommended for pregnant women.'\n\n2. For ALL cosmetics, skincare, cleaning products, or any non-consumable products:\n   Return ONLY the product name/type, such as 'Neutrogena Face Toner' or 'Hand Sanitizer'\n   EVEN IF these products contain alcohol in their ingredients list\n   EVEN IF the product has 'alcohol' in its name (like 'Alcohol-Free Toner' or 'Denatured Alcohol')\n\n3. If you cannot identify the product with confidence:\n   Return EXACTLY: 'I could not confidently identify this product. Please try another image.'\n\nEXAMPLES:\n- Wine bottle → 'This product appears to contain alcohol, which is not recommended for pregnant women.'\n- Vodka → 'This product appears to contain alcohol, which is not recommended for pregnant women.'\n- Face toner with alcohol → 'Facial Toner' (NO WARNING)\n- Hand sanitizer → 'Hand Sanitizer' (NO WARNING)\n- Rubbing alcohol → 'Rubbing Alcohol' (NO WARNING)\n- Makeup remover with denatured alcohol → 'Makeup Remover' (NO WARNING)\n\nREMEMBER: ONLY consumable alcoholic beverages should trigger the warning message. ALL other products, even if they contain alcohol as an ingredient, should NOT trigger the warning.",
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: blob.url, // Using the blob URL instead
                      },
                    },
                  ],
                },
              ],
              max_tokens: 1000,
            }),
          })

          if (!fallbackResponse.ok) {
            const fallbackErrorText = await fallbackResponse.text()
            console.error(`Fallback OpenAI API error (${fallbackResponse.status}):`, fallbackErrorText)
            return new Response(
              JSON.stringify({
                error: `OpenAI API error: ${fallbackResponse.status} ${fallbackResponse.statusText}`,
                details: fallbackErrorText,
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              },
            )
          }

          const fallbackResult = await fallbackResponse.json()
          let productName = "Unknown product"
          if (
            fallbackResult &&
            fallbackResult.choices &&
            fallbackResult.choices[0] &&
            fallbackResult.choices[0].message
          ) {
            productName = fallbackResult.choices[0].message.content || "Unknown product"
          }

          console.log("Product identified (fallback):", productName)

          return new Response(
            JSON.stringify({
              product: productName,
              imageUrl: blob.url,
              note: "Used fallback method with blob URL",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          )
        }

        return new Response(
          JSON.stringify({
            error: `OpenAI API error: ${response.status} ${response.statusText}`,
            details: errorText,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      const result = await response.json()

      // Extract the product name from the response
      let productName = "Unknown product"
      if (result && result.choices && result.choices[0] && result.choices[0].message) {
        productName = result.choices[0].message.content || "Unknown product"
      }

      console.log("Product identified:", productName)

      return new Response(
        JSON.stringify({
          product: productName,
          imageUrl: blob.url, // Return the blob URL for reference in the UI
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)
      console.error("Error stack:", openaiError.stack)

      return new Response(JSON.stringify({ error: `OpenAI API error: ${openaiError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error: any) {
    console.error("Error in analyze-image API:", error)
    console.error("Error stack:", error.stack)
    return new Response(JSON.stringify({ error: `Failed to analyze image: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
