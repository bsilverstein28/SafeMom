import { isHtmlResponse, inspectHtmlResponse, getUrlDetails } from "./error-inspector"
import { detectErrorPattern, getSolutionForStatus } from "./error-patterns"

export interface ApiRequestOptions {
  endpoint: string
  data: any
  method?: "GET" | "POST" | "PUT" | "DELETE"
  timeoutMs?: number
  retries?: number
  retryDelay?: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  diagnostics?: {
    url?: string
    urlDetails?: string
    statusCode?: number
    contentType?: string
    htmlResponse?: string
    responseSize?: number
    retryAttempt?: number
    errorPattern?: {
      name: string
      description: string
      solution: string
    }
  }
}

export function getBaseUrl() {
  // Client-side
  if (typeof window !== "undefined") {
    // Always use the current window location when running in the browser
    return window.location.origin
  }

  // Server-side
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }

  // For preview deployments
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // Fallback for server-side
  return "http://localhost:3000"
}

// Helper function to make API requests with better error handling
export async function makeApiRequest<T = any>({
  endpoint,
  data,
  method = "POST",
  timeoutMs = 30000,
  retries = 2,
  retryDelay = 1000,
}: ApiRequestOptions): Promise<ApiResponse<T>> {
  const baseUrl = getBaseUrl()
  // Ensure endpoint starts with / and remove any trailing slashes
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const url = `${baseUrl}${normalizedEndpoint}`

  console.log(`Making API request to: ${url}, method: ${method}`)
  console.log(`URL details:`, getUrlDetails(url))

  let lastError: Error | null = null
  let retryCount = 0

  while (retryCount <= retries) {
    try {
      // Add a timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const requestOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
        redirect: "follow", // Important: follow redirects
      }

      if (method !== "GET" && data) {
        requestOptions.body = JSON.stringify(data)
      }

      const response = await fetch(url, requestOptions)
      clearTimeout(timeoutId)

      const contentType = response.headers.get("content-type") || ""
      const contentLength = response.headers.get("content-length") || "unknown"

      // Check if the response is HTML instead of JSON
      if (isHtmlResponse(contentType)) {
        const htmlContent = await response.text()
        const htmlInspection = await inspectHtmlResponse(response)
        console.error(`Received HTML response from ${endpoint} instead of JSON`)

        // Try to detect common error patterns
        const errorPattern = detectErrorPattern(response, htmlContent)

        // Only retry server errors (500s), not client errors (400s)
        if ((response.status >= 500 || response.status === 0) && retryCount < retries) {
          retryCount++
          console.log(`Retry attempt ${retryCount} for ${endpoint} after delay...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1))) // Exponential backoff
          continue
        }

        return {
          error: errorPattern
            ? `${errorPattern.name}: ${errorPattern.description}`
            : `Server returned HTML instead of JSON. Status: ${response.status}`,
          diagnostics: {
            url,
            urlDetails: getUrlDetails(url),
            statusCode: response.status,
            contentType,
            htmlResponse: htmlInspection,
            responseSize: Number.parseInt(contentLength) || 0,
            retryAttempt: retryCount,
            errorPattern: errorPattern
              ? {
                  name: errorPattern.name,
                  description: errorPattern.description,
                  solution: errorPattern.solution,
                }
              : undefined,
          },
        }
      }

      // Parse the response as JSON
      let responseData: T
      try {
        responseData = await response.json()
      } catch (jsonError) {
        console.error(`Error parsing JSON response from ${endpoint}:`, jsonError)

        if (retryCount < retries) {
          retryCount++
          console.log(`Retry attempt ${retryCount} for ${endpoint} after JSON parse error...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)))
          continue
        }

        return {
          error: "Failed to parse server response. Please try again later.",
          diagnostics: {
            url,
            statusCode: response.status,
            contentType,
            responseSize: Number.parseInt(contentLength) || 0,
            retryAttempt: retryCount,
          },
        }
      }

      // Check for errors in the response
      if (!response.ok) {
        console.error(`API error from ${endpoint}:`, responseData)

        if (response.status >= 500 && retryCount < retries) {
          retryCount++
          console.log(`Retry attempt ${retryCount} for ${endpoint} after server error...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)))
          continue
        }

        return {
          error: (responseData as any).error || getSolutionForStatus(response.status),
          diagnostics: {
            url,
            statusCode: response.status,
            contentType,
            responseSize: Number.parseInt(contentLength) || 0,
            retryAttempt: retryCount,
          },
        }
      }

      return { data: responseData }
    } catch (error: any) {
      lastError = error

      // Handle abort error specifically
      if (error.name === "AbortError") {
        console.error(`Request to ${endpoint} timed out after ${timeoutMs}ms`)

        if (retryCount < retries) {
          retryCount++
          console.log(`Retry attempt ${retryCount} for ${endpoint} after timeout...`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)))
          continue
        }

        return {
          error: "Request timed out. Please try again later.",
          diagnostics: {
            url,
            retryAttempt: retryCount,
          },
        }
      }

      // Handle network errors
      console.error(`Network error when calling ${endpoint}:`, error)

      if (retryCount < retries) {
        retryCount++
        console.log(`Retry attempt ${retryCount} for ${endpoint} after network error...`)
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)))
        continue
      }

      // Provide a more specific error message for common network issues
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return { error: "You appear to be offline. Please check your internet connection and try again." }
      }

      return {
        error: `Network error: ${error.message}`,
        diagnostics: {
          url,
          retryAttempt: retryCount,
        },
      }
    }
  }

  return {
    error: `Request failed after ${retries} retries: ${lastError?.message || "Unknown error"}`,
    diagnostics: {
      url,
      retryAttempt: retries,
    },
  }
}
