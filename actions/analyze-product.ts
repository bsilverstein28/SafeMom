"use server"

import { makeApiRequest, getBaseUrl } from "@/lib/api-utils"

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
    console.log("Starting product identification with API route...")
    console.log("Base URL:", getBaseUrl())

    // Validate the image URL
    if (!imageUrl || typeof imageUrl !== "string") {
      console.error("Invalid image URL provided")
      return { unidentifiable: true }
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

              // Check if the product name indicates inability to identify
              if (
                productName.toLowerCase().includes("unable to identify") ||
                productName.toLowerCase().includes("can't identify") ||
                productName.toLowerCase().includes("cannot identify") ||
                productName.toLowerCase().includes("not clear") ||
                productName.toLowerCase().includes("not visible") ||
                productName.toLowerCase().includes("i don't know") ||
                productName.toLowerCase().includes("i do not know") ||
                productName.toLowerCase().includes("unknown") ||
                productName.toLowerCase().includes("not sure") ||
                productName.toLowerCase().includes("can't tell") ||
                productName.toLowerCase().includes("cannot tell") ||
                productName.toLowerCase().includes("no product") ||
                productName.toLowerCase() === "unknown product" ||
                productName.toLowerCase() === "i don't know"
              ) {
                return { unidentifiable: true }
              }

              return { product: productName }
            }
          } else {
            // Check for specific error message in the response
            try {
              const errorData = await response.json()
              if (errorData.error && errorData.error.includes("No base64Image provided")) {
                console.log("Base64 image error: No base64Image provided")
                return { unidentifiable: true }
              }
            } catch (parseError) {
              // If we can't parse the error, continue with other approaches
              console.log("Couldn't parse error response:", parseError)
            }

            console.log("Base64 approach failed, status:", response.status)
          }
        } catch (base64Error) {
          console.error("Error with base64 API call:", base64Error)
          // Check if the error message contains the specific text
          if (base64Error.message && base64Error.message.includes("No base64Image provided")) {
            return { unidentifiable: true }
          }
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

              // Check if the product name indicates inability to identify
              if (
                productName.toLowerCase().includes("unable to identify") ||
                productName.toLowerCase().includes("can't identify") ||
                productName.toLowerCase().includes("cannot identify") ||
                productName.toLowerCase().includes("not clear") ||
                productName.toLowerCase().includes("not visible") ||
                productName.toLowerCase().includes("i don't know") ||
                productName.toLowerCase().includes("i do not know") ||
                productName.toLowerCase().includes("unknown") ||
                productName.toLowerCase().includes("not sure") ||
                productName.toLowerCase().includes("can't tell") ||
                productName.toLowerCase().includes("cannot tell") ||
                productName.toLowerCase().includes("no product") ||
                productName.toLowerCase() === "unknown product" ||
                productName.toLowerCase() === "i don't know"
              ) {
                return { unidentifiable: true }
              }

              return { product: productName }
            }
          } else {
            // Check for specific error message in the response
            try {
              const errorData = await response.json()
              if (errorData.error && errorData.error.includes("No base64Image provided")) {
                console.log("Data URL error: No base64Image provided")
                return { unidentifiable: true }
              }
            } catch (parseError) {
              // If we can't parse the error, continue with other approaches
              console.log("Couldn't parse error response:", parseError)
            }

            console.log("Data URL approach failed, status:", response.status)
          }
        } catch (dataUrlError) {
          console.error("Error with data URL API call:", dataUrlError)
          // Check if the error message contains the specific text
          if (dataUrlError.message && dataUrlError.message.includes("No base64Image provided")) {
            return { unidentifiable: true }
          }
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

    // Check for specific error message
    if (error && error.includes("No base64Image provided")) {
      console.log("API error: No base64Image provided")
      return { unidentifiable: true }
    }

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
      return { unidentifiable: true }
    }

    // Check if the product name indicates inability to identify
    if (
      productName.toLowerCase().includes("unable to identify") ||
      productName.toLowerCase().includes("can't identify") ||
      productName.toLowerCase().includes("cannot identify") ||
      productName.toLowerCase().includes("not clear") ||
      productName.toLowerCase().includes("not visible") ||
      productName.toLowerCase().includes("i don't know") ||
      productName.toLowerCase().includes("i do not know") ||
      productName.toLowerCase().includes("unknown") ||
      productName.toLowerCase().includes("not sure") ||
      productName.toLowerCase().includes("can't tell") ||
      productName.toLowerCase().includes("cannot tell") ||
      productName.toLowerCase().includes("no product") ||
      productName.toLowerCase() === "unknown product" ||
      productName.toLowerCase() === "i don't know"
    ) {
      return { unidentifiable: true }
    }

    console.log("Identified product:", productName)

    return { product: productName }
  } catch (error: any) {
    console.error("Error identifying product:", error)
    console.error("Error stack:", error.stack)

    // Check if the error message contains the specific text
    if (error.message && error.message.includes("No base64Image provided")) {
      return { unidentifiable: true }
    }

    return { error: `Failed to identify product: ${error.message}` }
  }
}

// Step 2: Find ingredients for the identified product
export async function findIngredients(productName: string) {
  console.log("Server action: findIngredients called with product name:", productName)

  try {
    if (!productName || productName.trim() === "") {
      return { error: "No product name provided" }
    }

    // Use the API route for finding ingredients
    console.log("Calling find-ingredients API for:", productName)

    // Make a direct fetch call to the API route
    try {
      // Use makeApiRequest helper to handle errors consistently
      const { data, error, diagnostics } = await makeApiRequest({
        endpoint: "/api/find-ingredients",
        data: { productName },
        method: "POST",
      })

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

      if (!data || !data.ingredients || !Array.isArray(data.ingredients) || data.ingredients.length === 0) {
        console.error("No ingredients returned from API")
        return { error: "Could not find ingredients for the product" }
      }

      console.log("Found ingredients:", data.ingredients)

      // Check if the product contains alcohol
      if (data.containsAlcohol) {
        console.log("Alcohol detected in product")
        return {
          ingredients: data.ingredients,
          containsAlcohol: true,
          alcoholWarning:
            data.alcoholWarning ||
            "This product appears to contain alcohol, which is never recommended for pregnant women",
        }
      }

      return { ingredients: data.ingredients }
    } catch (fetchError: any) {
      console.error("Error fetching from API:", fetchError)
      return { error: `Failed to fetch from API: ${fetchError.message}` }
    }
  } catch (error: any) {
    console.error("Error finding ingredients:", error)
    return { error: `Failed to find ingredients: ${error.message}` }
  }
}

// Step 3: Analyze if any ingredients are harmful for pregnant women
export async function analyzeIngredients(ingredients: string[]) {
  try {
    console.log("Analyzing ingredients for pregnancy safety:", ingredients)

    // Use the API route for analyzing ingredients
    try {
      // Use makeApiRequest helper to handle errors consistently
      const { data, error, diagnostics } = await makeApiRequest({
        endpoint: "/api/analyze-ingredients",
        data: { ingredients },
        method: "POST",
      })

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

      return {
        harmfulIngredients: data?.harmfulIngredients || [],
        isSafe: data?.isSafe,
        parsingError: data?.parsingError,
      }
    } catch (fetchError: any) {
      console.error("Error fetching from API:", fetchError)
      return { error: `Failed to fetch from API: ${fetchError.message}` }
    }
  } catch (error: any) {
    console.error("Error analyzing ingredients:", error)
    return { error: `Failed to analyze ingredients: ${error.message}` }
  }
}
