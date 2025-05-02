"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Camera, Loader2 } from "lucide-react"

interface ImageUploaderProps {
  onImageSelected: (imageUrl: string, previewUrl: string) => void
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

  const handleFile = async (file: File) => {
    if (!file.type.match("image.*")) {
      setUploadError("Please select an image file")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create a local preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string

        // Upload to Vercel Blob
        uploadToBlob(file, previewUrl)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error handling file:", error)
      setUploadError("Failed to process the image")
      setIsUploading(false)
    }
  }

  const uploadToBlob = async (file: File, previewUrl: string) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image")
      }

      // Pass both the blob URL and the preview URL to the parent component
      onImageSelected(result.url, previewUrl)
    } catch (error) {
      console.error("Error uploading to Blob:", error)
      setUploadError("Failed to upload the image")
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
