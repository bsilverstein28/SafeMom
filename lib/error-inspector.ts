/**
 * Utility to analyze responses and help debug when we get HTML instead of JSON
 */

export function isHtmlResponse(contentType: string | null): boolean {
  return Boolean(contentType && contentType.includes("text/html"))
}

export async function inspectHtmlResponse(response: Response): Promise<string> {
  try {
    const html = await response.text()

    // Try to extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : "Unknown page"

    // Try to extract error message if it's a Next.js error page
    const nextJsErrorMatch = html.match(/<pre.*?>(.*?)<\/pre>/s)
    const errorText = nextJsErrorMatch
      ? nextJsErrorMatch[1].replace(/<[^>]*>/g, "") // Remove HTML tags
      : "No specific error found"

    // Try to determine if it's a 404 page or other common error page
    const is404 = title.includes("404") || html.includes("page not found")
    const is500 = title.includes("500") || html.includes("server error")
    const isNextAuth = html.includes("signin") || html.includes("auth")

    return JSON.stringify(
      {
        title,
        errorType: is404 ? "404 Page" : is500 ? "500 Server Error" : isNextAuth ? "Auth Page" : "Unknown HTML",
        statusCode: response.status,
        errorText: errorText.substring(0, 200) + (errorText.length > 200 ? "..." : ""),
      },
      null,
      2,
    )
  } catch (error) {
    return `Failed to inspect HTML: ${error instanceof Error ? error.message : String(error)}`
  }
}

export function getUrlDetails(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return JSON.stringify(
      {
        protocol: parsedUrl.protocol,
        host: parsedUrl.host,
        pathname: parsedUrl.pathname,
        search: parsedUrl.search,
        hash: parsedUrl.hash,
        isAbsolute: url.startsWith("http"),
      },
      null,
      2,
    )
  } catch (error) {
    return `Invalid URL: ${url}`
  }
}
