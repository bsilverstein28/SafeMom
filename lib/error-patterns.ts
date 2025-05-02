/**
 * Utility to detect common error patterns and provide specific solutions
 */

export interface ErrorPattern {
  name: string
  description: string
  solution: string
  detect: (response: Response, html?: string) => boolean
}

export const commonErrorPatterns: ErrorPattern[] = [
  {
    name: "Redirect Loop",
    description: "Your fetch hit an API but Next.js redirected (e.g., missing trailing slash or auth middleware)",
    solution: "Add redirect: 'follow' to fetch options or correct the URL path",
    detect: (response) => response.status === 302 || response.redirected,
  },
  {
    name: "Route Not Found",
    description: "The API route file name/path is wrong or deployed under the wrong directory",
    detect: (response, html) =>
      response.status === 404 && (html?.includes("NEXT_NOT_FOUND") || html?.includes("This page could not be found")),
  },
  {
    name: "Server Error",
    description: "An uncaught exception in the API route (JSON.parse error, Edge limit, OpenAI error)",
    solution: "Check server logs. Wrap handler in try/catch and return proper JSON errors",
    detect: (response, html) =>
      response.status === 500 && (html?.includes("Server Error") || html?.includes("Application error")),
  },
  {
    name: "Payload Too Large",
    description: "Request body (e.g., base64 image) is too big for the Edge function",
    solution: "Switch route to Node.js runtime, increase bodyParser.sizeLimit, or use Blob storage",
    detect: (response) => response.status === 413,
  },
  {
    name: "Gateway Timeout",
    description: "Upstream service (OpenAI) timed out or Cloudflare edge hiccup",
    solution: "Implement retry with exponential back-off; increase timeout in OpenAI client",
    detect: (response) => response.status === 502 || response.status === 524,
  },
]

export function detectErrorPattern(response: Response, html?: string): ErrorPattern | null {
  for (const pattern of commonErrorPatterns) {
    if (pattern.detect(response, html)) {
      return pattern
    }
  }
  return null
}

export function getSolutionForStatus(status: number): string {
  switch (status) {
    case 302:
      return "Redirect detected. Add redirect: 'follow' to fetch options or fix the URL path."
    case 404:
      return "API route not found. Check if the file is in the correct location (/app/api/analyze/route.ts)."
    case 413:
      return "Payload too large. Use Node.js runtime or increase bodyParser.sizeLimit."
    case 500:
      return "Server error. Check server logs for uncaught exceptions."
    case 502:
    case 524:
      return "Gateway timeout. Implement retry with exponential back-off."
    default:
      return `Unexpected status code: ${status}. Check server logs.`
  }
}
