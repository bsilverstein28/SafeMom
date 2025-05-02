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

  // For preview deployments
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // Absolute fallback for server-side
  return "http://localhost:3000"
}

// Helper function to make API requests with better error handling
async function makeApiRequest(endpoint: string, data: any) {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}${endpoint}`

  console.log(`Making API request to: ${url}`)

  try {
    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Check if the response is HTML instead of JSON
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("text/html")) {
      console.error(`Received HTML response from ${endpoint} instead of JSON`)
      const htmlContent = await response.text()
      console.error("HTML content preview:", htmlContent.substring(0, 200))
      return { error: "Server returned HTML instead of JSON. Please try again later." }
    }

    // Parse the response as JSON
    let responseData
    try {
      responseData = await response.json()
    } catch (jsonError) {
      console.error(`Error parsing JSON response from ${endpoint}:`, jsonError)
      return { error: "Failed to parse server response. Please try again later." }
    }

    // Check for errors in the response
    if (!response.ok) {
      console.error(`API error from ${endpoint}:`, responseData.error || response.statusText)
      return { error: responseData.error || `API responded with status: ${response.status}` }
    }

    return responseData
  } catch (error: any) {
    // Handle abort error specifically
    if (error.name === "AbortError") {
      console.error(`Request to ${endpoint} timed out after 30 seconds`)
      return { error: "Request timed out. Please try again later." }
    }

    // Handle network errors
    console.error(`Network error when calling ${endpoint}:`, error)

    // Provide a more specific error message for common network issues
    if (!navigator.onLine) {
      return { error: "You appear to be offline. Please check your internet connection and try again." }
    }

    return { error: `Network error: ${error.message}` }
  }
}

// Step 1: Identify the product from the image
export async function identifyProduct(imageUrl: string) {
  try {
    console.log("Starting product identification with ChatGPT...")

    // Use the helper function to make the API request
    const data = await makeApiRequest("/api/analyze", { imageUrl })

    // Check for errors
    if (data.error) {
      return { error: data.error }
    }

    const productName = data.product

    if (!productName) {
      console.error("No product name returned from API")
      return { error: "Could not identify product from image" }
    }

    console.log("Identified product:", productName)
    return { product: productName }
  } catch (error: any) {
    console.error("Error identifying product:", error)
    return { error: `Failed to identify product: ${error.message}` }
  }
}

// Step 2: Find ingredients for the identified product
export async function findIngredients(productName: string) {
  try {
    console.log("Looking up ingredients for:", productName)

    // Use the helper function to make the API request
    const data = await makeApiRequest("/api/find-ingredients", { productName })

    // Check for errors
    if (data.error) {
      return { error: data.error }
    }

    const ingredientsList = data.ingredients

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
    const data = await makeApiRequest("/api/analyze-ingredients", { ingredients })

    // Check for errors
    if (data.error) {
      return { error: data.error }
    }

    console.log("Parsed safety results:", data)
    return {
      harmfulIngredients: data.harmfulIngredients || [],
      isSafe: data.isSafe,
      parsingError: data.parsingError,
    }
  } catch (error: any) {
    console.error("Error analyzing ingredients:", error)
    return { error: `Failed to analyze ingredients: ${error.message}` }
  }
}
