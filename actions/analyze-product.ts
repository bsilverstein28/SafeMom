"use server"

import { makeApiRequest, getBaseUrl } from "@/lib/api-utils"

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

    // First, try the direct approach
    try {
      console.log("Trying direct API call...")

      // Make a direct fetch call to the API
      const response = await fetch(`${getBaseUrl()}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.product) {
          console.log("Direct API call successful, product identified:", data.product)
          return { product: data.product }
        }
      } else {
        console.log("Direct API call failed, status:", response.status)
      }
    } catch (directError) {
      console.error("Error with direct API call:", directError)
      // Continue to fallback approach
    }

    // Fallback to the makeApiRequest helper
    console.log("Falling back to makeApiRequest helper...")
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
