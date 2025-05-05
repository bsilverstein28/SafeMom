"use server"

import { makeApiRequest, getBaseUrl, safeParseJson } from "@/lib/api-utils"

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
      return { error: "Invalid image URL provided" }
    }

    console.log("Image URL length:", imageUrl.length)
    console.log("Image URL type:", imageUrl.startsWith("data:") ? "data URL" : "regular URL")

    // For data URLs, extract the base64 part and use the analyze-base64 endpoint
    if (imageUrl.startsWith("data:")) {
      console.log("Processing data URL...")
      const base64Part = imageUrl.split(",")[1]

      if (!base64Part) {
        console.error("Invalid data URL format")
        return { error: "Invalid data URL format" }
      }

      try {
        const response = await fetch(`${getBaseUrl()}/api/analyze-base64`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64Image: base64Part }),
        })

        if (!response.ok) {
          console.error("Base64 API call failed, status:", response.status)
          return {
            error: `API error: ${response.status}`,
            diagnostics: {
              statusCode: response.status,
              endpoint: "/api/analyze-base64",
            },
          }
        }

        // Use the safe JSON parser to handle potential HTML responses
        const parseResult = await safeParseJson(response)

        if (parseResult.error) {
          console.error("Error parsing response:", parseResult.error)
          if (parseResult.html) {
            console.error("Received HTML instead of JSON:", parseResult.html.substring(0, 200))
          }
          return { error: parseResult.error, diagnostics: { htmlResponse: parseResult.html?.substring(0, 500) } }
        } else if (parseResult.data?.choices && parseResult.data.choices[0] && parseResult.data.choices[0].message) {
          const productName = parseResult.data.choices[0].message.content
          console.log("Product identified using data URL approach:", productName)

          // Check if the product name indicates inability to identify
          if (
            !productName ||
            productName.toLowerCase().includes("unable to identify") ||
            productName.toLowerCase().includes("can't identify") ||
            productName.toLowerCase().includes("cannot identify") ||
            productName.toLowerCase().includes("not clear") ||
            productName.toLowerCase().includes("not visible")
          ) {
            return { unidentifiable: true }
          }

          return { product: productName }
        }
      } catch (dataUrlError) {
        console.error("Error with data URL API call:", dataUrlError)
        return { error: `Data URL processing error: ${dataUrlError.message}` }
      }
    }

    // For HTTP URLs, try to convert to base64 first
    if (imageUrl.startsWith("http")) {
      console.log("Converting remote URL to base64...")
      const base64Image = await urlToBase64(imageUrl)

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

          if (!response.ok) {
            console.error("Base64 API call failed, status:", response.status)
            // Continue to fallback approach
          } else {
            // Use the safe JSON parser to handle potential HTML responses
            const parseResult = await safeParseJson(response)

            if (parseResult.error) {
              console.error("Error parsing response:", parseResult.error)
              if (parseResult.html) {
                console.error("Received HTML instead of JSON:", parseResult.html.substring(0, 200))
              }
              // Continue to fallback approach
            } else if (
              parseResult.data?.choices &&
              parseResult.data.choices[0] &&
              parseResult.data.choices[0].message
            ) {
              const productName = parseResult.data.choices[0].message.content
              console.log("Product identified using base64 approach:", productName)

              // Check if the product name indicates inability to identify
              if (
                !productName ||
                productName.toLowerCase().includes("unable to identify") ||
                productName.toLowerCase().includes("can't identify") ||
                productName.toLowerCase().includes("cannot identify") ||
                productName.toLowerCase().includes("not clear") ||
                productName.toLowerCase().includes("not visible")
              ) {
                return { unidentifiable: true }
              }

              return { product: productName }
            }
          }
        } catch (base64Error) {
          console.error("Error with base64 API call:", base64Error)
          // Continue to fallback approach
        }
      }
    }

    // Fallback to the original approach with the /api/analyze endpoint
    console.log("Falling back to original approach with /api/analyze endpoint...")

    // Make sure we're sending the correct data format
    const requestData = { imageUrl }
    console.log("Request data:", JSON.stringify(requestData).substring(0, 100) + "...")

    const { data, error, diagnostics } = await makeApiRequest({
      endpoint: "/api/analyze",
      data: requestData,
      method: "POST",
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

    if (
      !productName ||
      productName.toLowerCase().includes("unable to identify") ||
      productName.toLowerCase().includes("can't identify") ||
      productName.toLowerCase().includes("cannot identify") ||
      productName.toLowerCase().includes("not clear") ||
      productName.toLowerCase().includes("not visible")
    ) {
      console.error("No product name returned from API or unable to identify")
      return { unidentifiable: true }
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
      console.log("Is food product:", data.isFood)

      // Check if the product contains alcohol
      if (data.containsAlcohol) {
        console.log("Alcohol detected in product")
        return {
          ingredients: data.ingredients,
          containsAlcohol: true,
          alcoholWarning:
            data.alcoholWarning ||
            "This product appears to contain alcohol, which is never recommended for pregnant women",
          isFood: data.isFood,
        }
      }

      return {
        ingredients: data.ingredients,
        isFood: data.isFood,
      }
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
export async function analyzeIngredients(ingredients: string[], productName = "", isFood = false) {
  try {
    console.log("Analyzing ingredients for pregnancy safety:", ingredients)
    console.log("Product is food:", isFood)

    // Use the API route for analyzing ingredients
    try {
      // Use makeApiRequest helper to handle errors consistently
      const { data, error, diagnostics } = await makeApiRequest({
        endpoint: "/api/analyze-ingredients",
        data: { ingredients, productName, isFood },
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
