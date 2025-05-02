"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function ProductionStatus() {
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch(`/api/production-check?_=${Date.now()}`, {
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
      setStatus(data)
    } catch (err: any) {
      console.error("Error checking production status:", err)
      setError(err.message || "Failed to check production status")
    } finally {
      setIsChecking(false)
    }
  }

  // Check status on component mount
  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-purple-800">Production Environment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkStatus} disabled={isChecking} className="bg-purple-600 hover:bg-purple-700">
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Production Status"
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {status && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-800">Environment</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-32">Production Mode:</span>
                    {status.environment.IS_PRODUCTION ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" /> Enabled
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" /> Disabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-32">OpenAI API Key:</span>
                    {status.environment.OPENAI_API_KEY_EXISTS ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" /> Present (Length:{" "}
                        {status.environment.OPENAI_API_KEY_LENGTH})
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" /> Missing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-32">OpenAI Status:</span>
                    {status.openai.status === "connected" ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" /> Connected
                      </span>
                    ) : status.openai.status === "error" ? (
                      <span className="flex items-center text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" /> Error: {status.openai.error}
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" /> Not Tested
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-800">Request Information</h3>
                <p className="text-sm text-gray-600 mt-1">URL: {status.request.url}</p>
                <p className="text-sm text-gray-600">Host: {status.request.headers.host}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                <h3 className="font-medium text-gray-800 mb-2">Full Details</h3>
                <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(status, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
