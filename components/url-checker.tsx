"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function UrlChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [urlInfo, setUrlInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkUrl = async () => {
    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch(`/api/url-info?_=${Date.now()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setUrlInfo(data)
    } catch (err: any) {
      console.error("Error checking URL:", err)
      setError(err.message || "Failed to check URL")
    } finally {
      setIsChecking(false)
    }
  }

  // Check URL on component mount
  useEffect(() => {
    checkUrl()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-purple-800">URL Configuration Check</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkUrl} disabled={isChecking} className="bg-purple-600 hover:bg-purple-700">
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check URL Configuration"
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {urlInfo && (
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <h3 className="font-medium text-green-800">Current URL</h3>
                <p className="text-green-700 mt-1 break-all">{urlInfo.requestInfo?.fullUrl || "Unknown"}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(urlInfo, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
