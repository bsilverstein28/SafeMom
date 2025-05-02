import type { NextRequest } from "next/server"
import { getBaseUrl } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const requestUrl = request.url
    const parsedUrl = new URL(requestUrl)
    const baseUrl = getBaseUrl()

    return new Response(
      JSON.stringify({
        requestInfo: {
          fullUrl: requestUrl,
          protocol: parsedUrl.protocol,
          host: parsedUrl.host,
          pathname: parsedUrl.pathname,
          search: parsedUrl.search,
          origin: parsedUrl.origin,
        },
        environmentInfo: {
          baseUrl,
          vercelUrl: process.env.VERCEL_URL || "not set",
          publicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL || "not set",
          publicVercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL || "not set",
          nodeEnv: process.env.NODE_ENV,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("Error in url-info endpoint:", error)
    return new Response(JSON.stringify({ error: `URL info error: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
