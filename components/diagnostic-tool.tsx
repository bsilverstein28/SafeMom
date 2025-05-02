"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function DiagnosticTool() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults(null)

    try {
      // Test basic API connectivity
      const pingResponse = await fetch("/api/ping?_" + new Date().getTime(), {
        method: "GET",
        cache: "no-store",
      })

      // Test debug endpoint with our test API
      const debugResponse = await fetch("/api/debug-request?target=/api/test&_=" + new Date().getTime(), {
        method: "GET",
        cache: "no-store",
      })

      // Test the environment variables
      const envResponse = await fetch("/api/debug?_=" + new Date().getTime(), {
        method: "GET",
        cache: "no-store",
      })

      setResults({
        ping: {
          ok: pingResponse.ok,
          status: pingResponse.status,
          data: pingResponse.ok ? await pingResponse.json() : await pingResponse.text(),
        },
        debug: {
          ok: debugResponse.ok,
          status: debugResponse.status,
          data: debugResponse.ok ? await debugResponse.json() : await debugResponse.text(),
        },
        env: {
          ok: envResponse.ok,
          status: envResponse.status,
          data: envResponse.ok ? await envResponse.json() : await envResponse.text(),
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        isOnline: navigator.onLine,
      })
    } catch (error: any) {
      setResults({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-purple-800">API Diagnostics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runDiagnostics} disabled={isRunning} className="bg-purple-600 hover:bg-purple-700">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                "Run Diagnostics"
              )}
            </Button>
          </div>

          {results && (
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
              <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
