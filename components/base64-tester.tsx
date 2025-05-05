"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload } from "lucide-react"

export function Base64Tester() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [requestData, setRequestData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert file to base64 exactly as specified
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (!reader.result) {
          reject(new Error("Failed to read file"))
          return
        }
        const base64 = (reader.result as string).split(",")[1] // strip the prefix
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (!file.type.match("image.*")) {
        setError("Please select an image file")
        return
      }

      setIsLoading(true)
      setError(null)
      setResult(null)
      setRequestData(null)

      try {
        // Create a preview URL
        const preview = URL.createObjectURL(file)
        setPreviewUrl(preview)

        // Convert to base64
        const base64Image = await fileToBase64(file)
        console.log("Image converted to base64 (length):", base64Image.length)

        // Prepare request data for display
        setRequestData({
          endpoint: "/api/analyze-base64",
          method: "POST",
          base64ImageLength: base64Image.length,
        })

        // Use the API route instead of the server action directly
        const response = await fetch("/api/analyze-base64", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64Image }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        setResult(data)
      } catch (error: any) {
        console.error("Error:", error)
        setError(error.message || "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-purple-800">Secure Server-Side Image Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-purple-700">
              This test uses a secure API route to analyze images. The OpenAI API call is made entirely server-side.
            </p>

            <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="image/*" className="hidden" />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Select Image
                </>
              )}
            </Button>

            {previewUrl && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-purple-800 mb-2">Image Preview:</h3>
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full h-auto max-h-48 rounded-md"
                />
              </div>
            )}

            {requestData && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-purple-800 mb-2">Request Info:</h3>
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-32">
                  <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(requestData, null, 2)}</pre>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-purple-800 mb-2">Server Response:</h3>
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
