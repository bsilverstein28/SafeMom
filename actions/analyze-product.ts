"use server"

// Helper function to get the base URL with better fallbacks
function getBaseUrl() {
  // For Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // For local development with NEXT_PUBLIC_BASE_URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }

  // Absolute fallback for server-side
  return "http://localhost:3000"
}

// Step 1: Identify the product from the image
export async function identifyProduct(imageUrl: string) {
  try {
    console.log("Starting product identification with ChatGPT...")

    // Get the base URL
    const baseUrl = getBaseUrl()
    console.log("Using base URL:", baseUrl)

    // Call our API endpoint
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    })

    // Parse the response
    const data = await response.json()

    // Check for errors in the response
    if (!response.ok) {
      console.error("API error:", data.error || response.statusText)
      return { error: data.error || `API responded with status: ${response.status}` }
    }

    const productName = data.product

    if (!productName) {
      console.error("No product name returned from API")
      return { error: "Could not identify product from image" }
    }

    console.log("Identified product:", productName)
    return { product: productName }
  } catch (error) {
    console.error("Error identifying product:", error)
    // Return error object instead of throwing
    return { error: `Failed to identify product: ${error.message}` }
  }
}

// Step 2: Find ingredients for the identified product
export async function findIngredients(productName: string) {
  try {
    console.log("Looking up ingredients for:", productName)

    // Get the base URL
    const baseUrl = getBaseUrl()

    // Call our API endpoint
    const response = await fetch(`${baseUrl}/api/find-ingredients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productName }),
    })

    // Parse the response
    const data = await response.json()

    // Check for errors in the response
    if (!response.ok) {
      console.error("API error:", data.error || response.statusText)
      return { error: data.error || `API responded with status: ${response.status}` }
    }

    const ingredientsList = data.ingredients

    if (!ingredientsList || ingredientsList.length === 0) {
      console.error("No ingredients returned from API")
      return { error: "Could not find ingredients for the product" }
    }

    console.log("Found ingredients:", ingredientsList)
    return { ingredients: ingredientsList }
  } catch (error) {
    console.error("Error finding ingredients:", error)
    // Return error object instead of throwing
    return { error: `Failed to find ingredients: ${error.message}` }
  }
}

// Step 3: Analyze if any ingredients are harmful for pregnant women
export async function analyzeIngredients(ingredients: string[]) {
  try {
    console.log("Analyzing ingredients for pregnancy safety:", ingredients)

    // Get the base URL
    const baseUrl = getBaseUrl()

    // Call our API endpoint
    const response = await fetch(`${baseUrl}/api/analyze-ingredients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients }),
    })

    // Parse the response
    const data = await response.json()

    // Check for errors in the response
    if (!response.ok) {
      console.error("API error:", data.error || response.statusText)
      return { error: data.error || `API responded with status: ${response.status}` }
    }

    console.log("Parsed safety results:", data)
    return {
      harmfulIngredients: data.harmfulIngredients || [],
      isSafe: data.isSafe,
      parsingError: data.parsingError,
    }
  } catch (error) {
    console.error("Error analyzing ingredients:", error)
    // Return error object instead of throwing
    return { error: `Failed to analyze ingredients: ${error.message}` }
  }
}
