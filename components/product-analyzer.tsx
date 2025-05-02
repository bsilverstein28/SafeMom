"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ImageUploader } from "@/components/image-uploader"
import { AnalysisResults } from "@/components/analysis-results"
import { identifyProduct, findIngredients, analyzeIngredients } from "@/actions/analyze-product"
import { AlertCircle, ArrowRight, CheckCircle, Loader2, WifiOff } from "lucide-react"
import { StepIndicator } from "@/components/step-indicator"

type AnalysisStep = 1 | 2 | 3 | 4 // 4 is the results step

export function ProductAnalyzer() {
  // Store both the blob URL and the preview URL
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<AnalysisStep>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  // Step results
  const [productName, setProductName] = useState<string>("")
  const [ingredients, setIngredients] = useState<string[]>([])
  const [safetyResults, setSafetyResults] = useState<{
    harmfulIngredients: { name: string; reason: string }[]
    isSafe: boolean
    parsingError?: boolean
  } | null>(null)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Set initial state
    setIsOnline(navigator.onLine)

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleImageUpload = (blobUrl: string, preview: string) => {
    setImageUrl(blobUrl)
    setPreviewUrl(preview)
    setCurrentStep(1)
    resetResults()
  }

  const resetResults = () => {
    setProductName("")
    setIngredients([])
    setSafetyResults(null)
    setError(null)
  }

  const handleReset = () => {
    setImageUrl(null)
    setPreviewUrl(null)
    setCurrentStep(1)
    resetResults()
  }

  // Step 1: Identify the product
  const handleIdentifyProduct = async () => {
    if (!imageUrl) return

    // Check if online
    if (!isOnline) {
      setError("You appear to be offline. Please check your internet connection and try again.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await identifyProduct(imageUrl)

      // Check for error in the result
      if (result.error) {
        setError(result.error)
        return
      }

      if (result.product) {
        setProductName(result.product)
        setCurrentStep(2)
      } else {
        setError("Failed to identify the product. Please try again.")
      }
    } catch (err) {
      console.error("Product identification error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Find ingredients
  const handleFindIngredients = async () => {
    if (!productName) return

    // Check if online
    if (!isOnline) {
      setError("You appear to be offline. Please check your internet connection and try again.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await findIngredients(productName)

      // Check for error in the result
      if (result.error) {
        setError(result.error)
        return
      }

      if (result.ingredients) {
        setIngredients(result.ingredients)
        setCurrentStep(3)
      } else {
        setError("Failed to find ingredients. Please try again.")
      }
    } catch (err) {
      console.error("Ingredients lookup error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Analyze ingredients
  const handleAnalyzeIngredients = async () => {
    if (ingredients.length === 0) return

    // Check if online
    if (!isOnline) {
      setError("You appear to be offline. Please check your internet connection and try again.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await analyzeIngredients(ingredients)

      // Check for error in the result
      if (result.error) {
        setError(result.error)
        return
      }

      setSafetyResults(result)
      setCurrentStep(4)
    } catch (err) {
      console.error("Safety analysis error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Render the current step content
  const renderStepContent = () => {
    if (!imageUrl) {
      return <ImageUploader onImageSelected={handleImageUpload} />
    }

    // Use the preview URL for display, but the blob URL for API calls
    const displayImage = previewUrl || imageUrl

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-1/3 rounded-md overflow-hidden">
                <img
                  src={displayImage || "/placeholder.svg"}
                  alt="Uploaded product"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-medium text-purple-800">Step 1: Identify Product</h3>
                <p className="text-gray-600 text-sm">
                  First, we'll use ChatGPT to identify the skincare product in your photo.
                </p>
                <Button
                  onClick={handleIdentifyProduct}
                  disabled={isLoading || !isOnline}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Identifying Product...
                    </>
                  ) : !isOnline ? (
                    <>
                      <WifiOff className="mr-2 h-4 w-4" />
                      Offline - Check Connection
                    </>
                  ) : (
                    <>
                      Identify Product
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {error && renderError()}
              </div>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Upload Different Image
            </Button>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-1/3 space-y-4">
                <div className="rounded-md overflow-hidden">
                  <img
                    src={displayImage || "/placeholder.svg"}
                    alt="Uploaded product"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <h4 className="font-medium text-green-800">Product Identified</h4>
                  </div>
                  <p className="mt-1 text-green-700">{productName}</p>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-medium text-purple-800">Step 2: Find Ingredients</h3>
                <p className="text-gray-600 text-sm">
                  Next, we'll use ChatGPT to search for the active ingredients in this product.
                </p>
                <Button
                  onClick={handleFindIngredients}
                  disabled={isLoading || !isOnline}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding Ingredients...
                    </>
                  ) : !isOnline ? (
                    <>
                      <WifiOff className="mr-2 h-4 w-4" />
                      Offline - Check Connection
                    </>
                  ) : (
                    <>
                      Find Ingredients
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {error && renderError()}
              </div>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Start Over
            </Button>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-1/3 space-y-4">
                <div className="rounded-md overflow-hidden">
                  <img
                    src={displayImage || "/placeholder.svg"}
                    alt="Uploaded product"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <h4 className="font-medium text-green-800">Product Identified</h4>
                  </div>
                  <p className="mt-1 text-green-700">{productName}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <h4 className="font-medium text-green-800">Ingredients Found</h4>
                  </div>
                  <p className="mt-1 text-green-700 text-sm">{ingredients.length} ingredients identified</p>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-medium text-purple-800">Step 3: Analyze for Pregnancy Safety</h3>
                <p className="text-gray-600 text-sm">
                  Finally, we'll use ChatGPT to analyze if any ingredients are potentially harmful during pregnancy.
                </p>
                <div className="bg-purple-50 p-3 rounded-md border border-purple-200 max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-purple-700 mb-2">Identified Ingredients:</h4>
                  <ul className="text-sm text-purple-600 space-y-1">
                    {ingredients.map((ingredient, index) => (
                      <li key={index}>• {ingredient}</li>
                    ))}
                  </ul>
                </div>
                <Button
                  onClick={handleAnalyzeIngredients}
                  disabled={isLoading || !isOnline}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Ingredients...
                    </>
                  ) : !isOnline ? (
                    <>
                      <WifiOff className="mr-2 h-4 w-4" />
                      Offline - Check Connection
                    </>
                  ) : (
                    <>
                      Analyze for Pregnancy Safety
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {error && renderError()}
              </div>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Start Over
            </Button>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-1/3 rounded-md overflow-hidden">
                <img
                  src={displayImage || "/placeholder.svg"}
                  alt="Uploaded product"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="flex-1">
                {safetyResults && (
                  <AnalysisResults
                    results={{
                      product: productName,
                      ingredients: ingredients,
                      harmfulIngredients: safetyResults.harmfulIngredients,
                      isSafe: safetyResults.isSafe,
                      parsingError: safetyResults.parsingError,
                    }}
                  />
                )}
              </div>
            </div>
            <Button onClick={handleReset} className="w-full bg-purple-600 hover:bg-purple-700">
              Analyze Another Product
            </Button>
          </div>
        )
    }
  }

  const renderError = () => (
    <div className="bg-red-50 p-3 rounded-md border border-red-200 flex items-start gap-2">
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-red-700 text-sm">{error}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} />

      <Card className="w-full shadow-md bg-white border-purple-200">
        <CardContent className="p-6">{renderStepContent()}</CardContent>
      </Card>
    </div>
  )
}
