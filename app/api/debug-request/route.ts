import type { NextRequest } from "next/server"
import { getBaseUrl } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const target = searchParams.get("target") || "/api/test"

    try {
      const baseUrl = getBaseUrl()
      const url = target.startsWith("/") ? `${baseUrl}${target}` : `${baseUrl}/${target}`

      console.log(`Debug request: Testing API call to ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Debug-Request": "1",
        },
        cache: "no-store",
        redirect: "follow",
      })

      const contentType = response.headers.get("content-type") || ""
      const headers: Record<string, string> = {}

      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      let responseData: any

      if (contentType.includes("application/json")) {
        try {
          responseData = await response.json()
        } catch (e) {
          responseData = { error: "Failed to parse JSON response" }
        }
      } else {
        // For non-JSON responses, get the text
        const text = await response.text()
        responseData = {
          text: text.length > 500 ? text.substring(0, 500) + "..." : text,
        }
      }

      return new Response(
        JSON.stringify({
          debug: {
            target,
            baseUrl,
            url,
            timestamp: new Date().toISOString(),
            responseStatus: response.status,
            responseStatusText: response.statusText,
            responseType: contentType,
            responseSize: headers["content-length"] || "unknown",
            headers,
          },
          response: responseData,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (fetchError: any) {
      return new Response(
        JSON.stringify({
          error: `Debug request failed: ${fetchError.message}`,
          baseUrl: getBaseUrl(),
          target,
          stack: fetchError.stack,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error: any) {
    console.error("Error in debug-request endpoint:", error)
    return new Response(JSON.stringify({ error: `Debug request error: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
