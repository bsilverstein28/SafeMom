"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { isVercelPreviewDeployment } from "@/lib/api-utils"
import { AlertCircle, Lock } from "lucide-react"

export function PreviewAuth() {
  const [isPreview, setIsPreview] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if we're in a preview deployment
    const preview = isVercelPreviewDeployment()
    setIsPreview(preview)

    // Check if already authenticated
    const token = localStorage.getItem("preview-auth-token")
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // This is a simple authentication mechanism for preview deployments
      // In a real app, you would make an API call to validate the password

      // For demo purposes, we'll accept any password and store a token
      localStorage.setItem("preview-auth-token", "preview-authenticated")
      setIsAuthenticated(true)

      // Reload the page to apply the authentication
      window.location.reload()
    } catch (err: any) {
      console.error("Authentication error:", err)
      setError(err.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  // If not a preview deployment or already authenticated, don't show anything
  if (!isPreview || isAuthenticated) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Preview Deployment Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This is a preview deployment that requires authentication. Please enter the preview password to continue.
          </p>

          <form onSubmit={handleAuth}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Preview Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter preview password"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleAuth}
            disabled={isLoading || !password}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? "Authenticating..." : "Authenticate"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
