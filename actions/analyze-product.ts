"use server"

import { makeApiRequest, getBaseUrl } from "@/lib/api-utils"
import { analyzeImageWithVisionAPI } from "@/lib/openai-client"

// Helper function to convert a URL to base64
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch image from URL: ${url}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString("base64")
  } catch (error) {
    console.error("Error converting URL to base64:", error)
    return null
  }
}

// Step 1: Identify the product from the image
export async function identifyProduct(imageUrl: string) {
  try {
    console.log("Starting product identification with ChatGPT...")
    console.log("Base URL:", getBaseUrl())

    // Validate the image URL
    if (!imageUrl || typeof imageUrl !== "string") {
      console.error("Invalid image URL provided")
      return { error: "Invalid image URL provided" }
    }

    console.log("Image URL length:", imageUrl.length)

    // Try to convert the image URL to base64 if it's a remote URL
    let base64Image = null
    if (imageUrl.startsWith("http")) {
      console.log("Converting remote URL to base64...")
      base64Image = await urlToBase64(imageUrl)

      if (base64Image) {
        console.log("Successfully converted image to base64")

        // Make a direct fetch call to the analyze-base64 endpoint
        try {
          const response = await fetch(`${getBaseUrl()}/api/analyze-base64`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ base64Image }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.choices && data.choices[0] && data.choices[0].message) {
              const productName = data.choices[0].message.content
              console.log("Product identified using base64 approach:", productName)
              return { product: productName }
            }
          } else {
            console.log("Base64 approach failed, status:", response.status)
          }
        } catch (base64Error) {
          console.error("Error with base64 API call:", base64Error)
          // Continue to fallback approach
        }
      }
    }

    // If the image is already a data URL (base64)
    if (imageUrl.startsWith("data:image")) {
      console.log("Image is already a data URL")

      // Extract the base64 part
      const base64Part = imageUrl.split(",")[1]
      if (base64Part) {
        try {
          const response = await fetch(`${getBaseUrl()}/api/analyze-base64`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ base64Image: base64Part }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.choices && data.choices[0] && data.choices[0].message) {
              const productName = data.choices[0].message.content
              console.log("Product identified using data URL approach:", productName)
              return { product: productName }
            }
          } else {
            console.log("Data URL approach failed, status:", response.status)
          }
        } catch (dataUrlError) {
          console.error("Error with data URL API call:", dataUrlError)
          // Continue to fallback approach
        }
      }
    }

    // Fallback to the original approach
    console.log("Falling back to original approach...")
    const { data, error, diagnostics } = await makeApiRequest({
      endpoint: "/api/analyze",
      data: { imageUrl },
    })

    // Check for errors and return diagnostics if available
    if (error) {
      console.error("Error in identifyProduct:", error)
      if (diagnostics) {
        console.error("Error diagnostics:", JSON.stringify(diagnostics, null, 2))
      }
      return {
        error,
        diagnostics,
      }
    }

    const productName = data?.product

    if (!productName) {
      console.error("No product name returned from API")
      return { error: "Could not identify product from image" }
    }

    console.log("Identified product:", productName)
    return { product: productName }
  } catch (error: any) {
    console.error("Error identifying product:", error)
    console.error("Error stack:", error.stack)
    return { error: `Failed to identify product: ${error.message}` }
  }
}

// Step 2: Find ingredients for the identified product
export async function findIngredients(productName: string) {
  try {
    console.log("Looking up ingredients for:", productName)

    // Use the helper function to make the API request
    const { data, error, diagnostics } = await makeApiRequest({
      endpoint: "/api/find-ingredients",
      data: { productName },
    })

    // Check for errors and return diagnostics if available
    if (error) {
      console.error("Error in findIngredients:", error)
      if (diagnostics) {
        console.error("Error diagnostics:", JSON.stringify(diagnostics, null, 2))
      }
      return {
        error,
        diagnostics,
      }
    }

    const ingredientsList = data?.ingredients

    if (!ingredientsList || ingredientsList.length === 0) {
      console.error("No ingredients returned from API")
      return { error: "Could not find ingredients for the product" }
    }

    console.log("Found ingredients:", ingredientsList)
    return { ingredients: ingredientsList }
  } catch (error: any) {
    console.error("Error finding ingredients:", error)
    return { error: `Failed to find ingredients: ${error.message}` }
  }
}

// Step 3: Analyze if any ingredients are harmful for pregnant women
export async function analyzeIngredients(ingredients: string[]) {
  try {
    console.log("Analyzing ingredients for pregnancy safety:", ingredients)

    // Use the helper function to make the API request
    const { data, error, diagnostics } = await makeApiRequest({
      endpoint: "/api/analyze-ingredients",
      data: { ingredients },
    })

    // Check for errors and return diagnostics if available
    if (error) {
      console.error("Error in analyzeIngredients:", error)
      if (diagnostics) {
        console.error("Error diagnostics:", JSON.stringify(diagnostics, null, 2))
      }
      return {
        error,
        diagnostics,
      }
    }

    console.log("Parsed safety results:", data)
    return {
      harmfulIngredients: data?.harmfulIngredients || [],
      isSafe: data?.isSafe,
      parsingError: data?.parsingError,
    }
  } catch (error: any) {
    console.error("Error analyzing ingredients:", error)
    return { error: `Failed to analyze ingredients: ${error.message}` }
  }
}

// Direct server action for image analysis - properly exported for client use
export async function analyzeImageDirect(base64Image: string) {
  "use server"

  try {
    console.log("Analyzing image directly from server action")

    if (!base64Image) {
      return { error: "No image data provided" }
    }

    try {
      // Make the API call directly from the server
      const result = await analyzeImageWithVisionAPI(
        `data:image/jpeg;base64,${base64Image}`,
        "What skincare product is shown in this image? Provide ONLY the brand and product name.",
      )

      if (result.choices && result.choices[0] && result.choices[0].message) {
        const productName = result.choices[0].message.content
        console.log("Product identified:", productName)
        return { product: productName }
      } else {
        return { error: "Could not extract product name from API response" }
      }
    } catch (apiError: any) {
      console.error("API error:", apiError)
      return { error: `API error: ${apiError.message}` }
    }
  } catch (error: any) {
    console.error("Error in analyzeImageDirect:", error)
    return { error: `Failed to analyze image: ${error.message}` }
  }
}
