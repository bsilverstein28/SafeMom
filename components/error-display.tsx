"use client"

import { AlertCircle, ChevronDown, ChevronUp, Lightbulb, Lock } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { isVercelPreviewDeployment } from "@/lib/api-utils"

interface ErrorDisplayProps {
  error: string
  diagnostics?: any
}

export function ErrorDisplay({ error, diagnostics }: ErrorDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const hasDiagnostics = !!diagnostics && Object.keys(diagnostics).length > 0
  const errorPattern = diagnostics?.errorPattern
  const is401Error = diagnostics?.statusCode === 401
  const isPreview = isVercelPreviewDeployment()

  const handleAuthRefresh = () => {
    // Clear any stored auth tokens
    localStorage.removeItem("preview-auth-token")
    // Reload the page to trigger authentication
    window.location.reload()
  }

  return (
    <div className="bg-red-50 p-4 rounded-md border border-red-200">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-700 font-medium">{error}</p>

          {is401Error && isPreview && (
            <div className="mt-2 bg-amber-50 p-3 rounded-md border border-amber-200">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 text-sm font-medium">Preview Deployment Authentication Required</p>
                  <p className="text-amber-700 text-sm mt-1">
                    This preview deployment requires authentication to access API endpoints.
                  </p>
                  <Button
                    onClick={handleAuthRefresh}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Authenticate
                  </Button>
                </div>
              </div>
            </div>
          )}

          {errorPattern && !is401Error && (
            <div className="mt-2 bg-amber-50 p-3 rounded-md border border-amber-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 text-sm font-medium">Suggested Solution:</p>
                  <p className="text-amber-700 text-sm mt-1">{errorPattern.solution}</p>
                </div>
              </div>
            </div>
          )}

          {hasDiagnostics && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs border-red-300 text-red-700 hover:bg-red-100 inline-flex items-center"
              >
                {expanded ? "Hide" : "Show"} Technical Details
                {expanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
              </Button>

              {expanded && (
                <div className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-48">
                  <pre className="whitespace-pre-wrap break-words text-red-800">
                    {JSON.stringify(diagnostics, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
