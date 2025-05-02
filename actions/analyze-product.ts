"use server"

// Helper function to get the base URL
function getBaseUrl() {
  // For Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // For local development
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
}

// Step 1: Identify the product from the image
export async function identifyProduct(imageUrl: string) {
  try {
    console.log("Starting product identification with ChatGPT...")

    // Call our API endpoint with the correct base URL
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/identify-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API responded with status: ${response.status}`)
    }

    const data = await response.json()
    const productName = data.product

    console.log("Identified product:", productName)

    if (!productName) {
      throw new Error("Could not identify product from image")
    }

    return { product: productName }
  } catch (error) {
    console.error("Error identifying product:", error)
    throw new Error(`Failed to identify product: ${error.message}`)
  }
}

// Step 2: Find ingredients for the identified product
export async function findIngredients(productName: string) {
  try {
    console.log("Looking up ingredients for:", productName)

    // Call our API endpoint with the correct base URL
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/find-ingredients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productName }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API responded with status: ${response.status}`)
    }

    const data = await response.json()
    const ingredientsList = data.ingredients

    console.log("Ingredients found:", ingredientsList)

    if (ingredientsList.length === 0) {
      throw new Error("Could not find ingredients for the product")
    }

    return { ingredients: ingredientsList }
  } catch (error) {
    console.error("Error finding ingredients:", error)
    throw new Error(`Failed to find ingredients: ${error.message}`)
  }
}

// Step 3: Analyze if any ingredients are harmful for pregnant women
export async function analyzeIngredients(ingredients: string[]) {
  try {
    console.log("Analyzing ingredients for pregnancy safety:", ingredients)

    // Call our API endpoint with the correct base URL
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/analyze-ingredients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API responded with status: ${response.status}`)
    }

    const safetyResults = await response.json()
    console.log("Parsed safety results:", safetyResults)

    return {
      harmfulIngredients: safetyResults.harmfulIngredients || [],
      isSafe: safetyResults.isSafe,
      parsingError: safetyResults.parsingError,
    }
  } catch (error) {
    console.error("Error analyzing ingredients:", error)
    throw new Error(`Failed to analyze ingredients: ${error.message}`)
  }
}
