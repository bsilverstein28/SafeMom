"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Camera, Loader2 } from "lucide-react"

interface ImageUploaderProps {
  onImageSelected: (imageUrl: string, previewUrl: string, productName?: string) => void
}

export function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

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

  const handleFile = async (file: File) => {
    if (!file.type.match("image.*")) {
      setUploadError("Please select an image file")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create a preview URL for display
      const previewUrl = URL.createObjectURL(file)

      // Convert file to base64
      const base64Image = await fileToBase64(file)
      console.log("Image converted to base64 (length):", base64Image.length)

      // Instead of using the server action directly, use the API route
      try {
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

        // Extract the product name from the OpenAI response
        let productName = null
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          productName = data.choices[0].message.content || null
          console.log("Product identified:", productName)
        }

        // If we have a product name, pass it to the parent component
        if (productName) {
          onImageSelected(previewUrl, previewUrl, productName)
          setIsUploading(false)
          return
        }
      } catch (apiError: any) {
        console.error("Error with API call:", apiError)
        // Fall back to blob upload
      }

      // If we get here, either the API call failed or we couldn't extract the product name
      uploadToBlob(file, previewUrl)
    } catch (error: any) {
      console.error("Error handling file:", error)
      setUploadError(error.message || "Failed to process the image")

      // If we have a preview URL, try the blob upload as fallback
      if (error.previewUrl) {
        uploadToBlob(file, error.previewUrl)
      } else {
        setIsUploading(false)
      }
    }
  }

  const uploadToBlob = async (file: File, previewUrl: string) => {
    try {
      console.log("Falling back to blob upload...")
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Upload error response:", errorText)
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`)
      }

      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error("Error parsing upload response:", jsonError)
        throw new Error("Invalid response from upload service")
      }

      if (!result.url) {
        throw new Error("No URL returned from upload service")
      }

      console.log("Image uploaded successfully:", result.url)

      // Validate the URL before passing it to the parent component
      if (!result.url.startsWith("http")) {
        throw new Error("Invalid URL format returned from upload service")
      }

      // If we have a product name in the result, pass it along
      if (result.product) {
        console.log("Product identified from blob upload:", result.product)
        onImageSelected(result.url, previewUrl, result.product)
      } else {
        // Pass both the blob URL and the preview URL to the parent component
        onImageSelected(result.url, previewUrl)
      }
    } catch (error: any) {
      console.error("Error uploading to Blob:", error)
      setUploadError(error.message || "Failed to upload the image")
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? "border-purple-500 bg-purple-50" : "border-purple-200"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="image/*" className="hidden" />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-purple-100 rounded-full">
          <Camera className="h-8 w-8 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-purple-800">Upload Product Photo</h3>
          <p className="text-sm text-gray-600 mt-1">Drag and drop an image, or click to browse</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
          <Button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Browse Files
              </>
            )}
          </Button>
          <Button
            onClick={triggerFileInput}
            variant="outline"
            disabled={isUploading}
            className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
        </div>
        {uploadError ? (
          <p className="text-xs text-red-500">{uploadError}</p>
        ) : (
          <p className="text-xs text-gray-500">Supported formats: JPG, PNG, GIF</p>
        )}
      </div>
    </div>
  )
}
