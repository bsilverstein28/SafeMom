"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ImageUploader } from "@/components/image-uploader"
import { AnalysisResults } from "@/components/analysis-results"
import { SavedSearches } from "@/components/saved-searches"
import { identifyProduct, findIngredients, analyzeIngredients } from "@/actions/analyze-product"
import {
  ArrowRight,
  CheckCircle,
  Loader2,
  WifiOff,
  Save,
  Check,
  AlertTriangle,
  Utensils,
  Sparkles,
  ImageOff,
  RefreshCw,
} from "lucide-react"
import { StepIndicator } from "@/components/step-indicator"
import { ErrorDisplay } from "@/components/error-display"
import { saveSearchResult } from "@/lib/saved-searches"
import type { AnalysisResult } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

type AnalysisStep = 1 | 2 | 3 | 4 // 4 is the results step

export function ProductAnalyzer() {
  // Store both the blob URL and the preview URL
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<AnalysisStep>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDiagnostics, setErrorDiagnostics] = useState<any>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isFromSavedSearch, setIsFromSavedSearch] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [alcoholWarning, setAlcoholWarning] = useState<string | null>(null)
  const [isFood, setIsFood] = useState(false)
  const [isUnidentifiable, setIsUnidentifiable] = useState(false)
  const [hasJsonParseError, setHasJsonParseError] = useState(false)
  const [hasBadRequestError, setHasBadRequestError] = useState(false)

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

  const handleImageUpload = (blobUrl: string, preview: string, detectedProduct?: string) => {
    console.log("Image uploaded:", { blobUrl, preview, detectedProduct })
    setImageUrl(blobUrl)
    setPreviewUrl(preview)
    setIsFromSavedSearch(false)
    setIsSaved(false)
    setAlcoholWarning(null)
    setIsFood(false)
    setIsUnidentifiable(false)
    setHasJsonParseError(false)
    setHasBadRequestError(false)

    // If we already have a product name from the direct analysis, use it and skip to step 2
    if (detectedProduct) {
      console.log("Product detected during upload:", detectedProduct)

      // Check if the product name indicates inability to identify
      if (
        detectedProduct.toLowerCase().includes("unable to identify") ||
        detectedProduct.toLowerCase().includes("can't identify") ||
        detectedProduct.toLowerCase().includes("cannot identify") ||
        detectedProduct.toLowerCase().includes("not clear") ||
        detectedProduct.toLowerCase().includes("not visible")
      ) {
        setIsUnidentifiable(true)
        setCurrentStep(1)
        setProductName("")
      } else {
        setProductName(detectedProduct)
        setCurrentStep(2)
      }
    } else {
      console.log("No product detected during upload, staying at step 1")
      setCurrentStep(1)
      // Reset product name if we're going back to step 1
      setProductName("")
    }

    resetResults()
  }

  const resetResults = () => {
    // Don't reset product name here, as it's handled in handleImageUpload
    setIngredients([])
    setSafetyResults(null)
    setError(null)
    setErrorDiagnostics(null)
    setIsSaved(false)
    setAlcoholWarning(null)
    setIsFood(false)
    setIsUnidentifiable(false)
    setHasJsonParseError(false)
    setHasBadRequestError(false)
  }

  const handleReset = () => {
    setImageUrl(null)
    setPreviewUrl(null)
    setCurrentStep(1)
    setProductName("")
    setIsFromSavedSearch(false)
    setIsSaved(false)
    setAlcoholWarning(null)
    setIsFood(false)
    setIsUnidentifiable(false)
    setHasJsonParseError(false)
    setHasBadRequestError(false)
    resetResults()
  }

  // Handle selecting a saved search
  const handleSelectSavedSearch = (search: AnalysisResult) => {
    // Ensure we have a valid image URL
    const imageUrl = search.imageUrl || "/placeholder.svg"

    setImageUrl(imageUrl)
    setPreviewUrl(imageUrl)
    setProductName(search.product)
    setIngredients(search.ingredients)
    setSafetyResults({
      harmfulIngredients: search.harmfulIngredients,
      isSafe: search.isSafe,
      parsingError: search.parsingError,
    })
    setCurrentStep(4)
    setIsFromSavedSearch(true)
    setIsSaved(true) // It's already saved
    setError(null)
    setErrorDiagnostics(null)
    setAlcoholWarning(null)
    setIsFood(search.isFood || false)
    setIsUnidentifiable(false)
    setHasJsonParseError(false)
    setHasBadRequestError(false)
  }

  // Save the current result
  const handleSaveResult = () => {
    if (!imageUrl || !productName || !safetyResults || ingredients.length === 0) {
      return
    }

    setIsSaving(true)

    try {
      const searchResult: AnalysisResult = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        product: productName,
        imageUrl: previewUrl || imageUrl || "/placeholder.svg",
        ingredients: ingredients,
        harmfulIngredients: safetyResults.harmfulIngredients || [],
        isSafe: safetyResults.isSafe,
        parsingError: safetyResults.parsingError,
        isFood: isFood,
      }

      saveSearchResult(searchResult)
      setIsSaved(true)

      // Small delay to show the saving animation
      setTimeout(() => {
        setIsSaving(false)
      }, 800)
    } catch (error) {
      console.error("Error saving result:", error)
      setIsSaving(false)
    }
  }

  // Step 1: Identify the product
  const handleIdentifyProduct = async () => {
    if (!imageUrl) {
      setError("No image available. Please upload an image first.")
      return
    }

    // Check if online
    if (!isOnline) {
      setError("You appear to be offline. Please check your internet connection and try again.")
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDiagnostics(null)
    setAlcoholWarning(null)
    setIsFood(false)
    setIsUnidentifiable(false)
    setHasJsonParseError(false)
    setHasBadRequestError(false)

    try {
      console.log("Identifying product from image URL:", imageUrl.substring(0, 50) + "...")
      const result = await identifyProduct(imageUrl)
      console.log("Product identification result:", result)

      // Check if there was a JSON parse error
      if (result.error && result.error.includes("Failed to parse JSON")) {
        setHasJsonParseError(true)
        setError("There was an error processing the image. Please try again or use a different image.")
        return
      }

      // Check for 400 Bad Request error
      if (result.diagnostics && result.diagnostics.statusCode === 400) {
        setHasBadRequestError(true)
        setError("The server couldn't process this image. Please try a different image or format.")
        setErrorDiagnostics(result.diagnostics)
        return
      }

      // Check for unidentifiable result
      if (result.unidentifiable) {
        setIsUnidentifiable(true)
        setError("I'm unable to identify this. Please try another image.")
        return
      }

      // Check for error in the result
      if (result.error) {
        setError(result.error)
        if (result.diagnostics) {
          setErrorDiagnostics(result.diagnostics)
        }
        return
      }

      if (result.product) {
        console.log("Product identified successfully:", result.product)
        setProductName(result.product)
        setCurrentStep(2)
      } else {
        // If we don't have a product name but also no error or unidentifiable flag
        setError("I'm unable to identify this. Please try another image.")
        setIsUnidentifiable(true)
      }
    } catch (err: any) {
      console.error("Product identification error:", err)
      setError(`An unexpected error occurred: ${err.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Find ingredients
  const handleFindIngredients = async () => {
    if (!productName || productName.trim() === "") {
      console.error("No product name available for ingredient lookup")
      setError("No product name available. Please identify the product first.")
      return
    }

    // Check if online
    if (!isOnline) {
      setError("You appear to be offline. Please check your internet connection and try again.")
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDiagnostics(null)
    setAlcoholWarning(null)
    setHasJsonParseError(false)
    setHasBadRequestError(false)

    try {
      console.log("Finding ingredients for product:", productName)

      // Call the server action directly with the product name
      const result = await findIngredients(productName)
      console.log("Find ingredients result:", result)

      // Check for JSON parse error
      if (result.error && result.error.includes("Failed to parse JSON")) {
        setHasJsonParseError(true)
        setError("There was an error processing the request. Please try again.")
        return
      }

      // Check for 400 Bad Request error
      if (result.diagnostics && result.diagnostics.statusCode === 400) {
        setHasBadRequestError(true)
        setError("The server couldn't process this request. Please try again with a different product name.")
        setErrorDiagnostics(result.diagnostics)
        return
      }

      // Check for error in the result
      if (result.error) {
        setError(result.error)
        if (result.diagnostics) {
          setErrorDiagnostics(result.diagnostics)
        }
        return
      }

      // Set the isFood flag based on the API response
      setIsFood(result.isFood || false)

      // Check if the product contains alcohol
      if (result.containsAlcohol && result.alcoholWarning) {
        console.log("Alcohol detected in product")
        setAlcoholWarning(result.alcoholWarning)

        // Set ingredients and skip to results
        setIngredients(result.ingredients)

        // Create safety results for alcohol
        setSafetyResults({
          harmfulIngredients: [
            {
              name: "Alcohol (Ethanol)",
              reason:
                "Alcohol in skincare products can be absorbed through the skin. While the risk is lower than with consumption, it's generally recommended to avoid alcohol-containing products during pregnancy as a precaution.",
            },
          ],
          isSafe: false,
        })

        // Skip to results
        setCurrentStep(4)
        return
      }

      if (result.ingredients && result.ingredients.length > 0) {
        console.log("Ingredients found:", result.ingredients)
        setIngredients(result.ingredients)
        setCurrentStep(3)
      } else {
        console.error("No ingredients returned from API")
        setError("Failed to find ingredients. Please try again.")
      }
    } catch (err: any) {
      console.error("Ingredients lookup error:", err)
      setError(`An unexpected error occurred: ${err.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Analyze ingredients
  const handleAnalyzeIngredients = async () => {
    if (ingredients.length === 0) {
      setError("No ingredients available. Please find ingredients first.")
      return
    }

    // Check if online
    if (!isOnline) {
      setError("You appear to be offline. Please check your internet connection and try again.")
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDiagnostics(null)
    setIsSaved(false)
    setHasJsonParseError(false)
    setHasBadRequestError(false)

    try {
      console.log("Analyzing ingredients:", ingredients)
      console.log("Product is food:", isFood)
      const result = await analyzeIngredients(ingredients, productName, isFood)
      console.log("Ingredient analysis result:", result)

      // Check for JSON parse error
      if (result.error && result.error.includes("Failed to parse JSON")) {
        setHasJsonParseError(true)
        setError("There was an error processing the request. Please try again.")
        return
      }

      // Check for 400 Bad Request error
      if (result.diagnostics && result.diagnostics.statusCode === 400) {
        setHasBadRequestError(true)
        setError("The server couldn't process these ingredients. Please try again.")
        setErrorDiagnostics(result.diagnostics)
        return
      }

      // Check for error in the result
      if (result.error) {
        setError(result.error)
        if (result.diagnostics) {
          setErrorDiagnostics(result.diagnostics)
        }
        return
      }

      setSafetyResults(result)
      setCurrentStep(4)

      // No longer automatically save the result
      // Now the user will explicitly save using the Save button
    } catch (err: any) {
      console.error("Safety analysis error:", err)
      setError(`An unexpected error occurred: ${err.message || "Unknown error"}`)
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

    // Special case for alcohol warning
    if (alcoholWarning && currentStep === 4) {
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
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-red-800">{alcoholWarning}</h2>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-1 text-purple-800">Identified Product</h3>
                  <p className="text-gray-700">{productName}</p>
                </div>

                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <h3 className="text-lg font-medium mb-2 text-red-700">Warning</h3>
                  <p className="text-red-700">
                    Alcohol consumption during pregnancy can lead to fetal alcohol spectrum disorders (FASDs), which can
                    cause physical, behavioral, and learning problems in the baby. No amount of alcohol is known to be
                    safe during pregnancy.
                  </p>
                  <p className="text-red-700 mt-2">
                    The American College of Obstetricians and Gynecologists, the American Academy of Pediatrics, and the
                    Centers for Disease Control and Prevention all advise pregnant women not to drink any alcohol.
                  </p>
                </div>
              </div>
              {isFromSavedSearch && (
                <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-200">
                  <p className="text-blue-700 text-sm">
                    This is a saved result. No new API calls were made to retrieve this information.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleReset} className="w-full bg-purple-600 hover:bg-purple-700">
              Analyze Another Product
            </Button>

            {!isFromSavedSearch && (
              <Button
                onClick={handleSaveResult}
                disabled={isSaving || isSaved}
                variant={isSaved ? "outline" : "secondary"}
                className={`w-full ${
                  isSaved
                    ? "border-green-300 text-green-700 bg-green-50"
                    : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Result
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )
    }

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
                <p className="text-gray-600 text-sm">First, we'll use AI to identify the product in your photo.</p>

                {hasJsonParseError ? (
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Server Error</h4>
                        <p className="text-amber-700 text-sm mt-1">
                          There was an error processing your request. Please try again.
                        </p>
                        <Button
                          onClick={handleIdentifyProduct}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : hasBadRequestError ? (
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Invalid Image Format</h4>
                        <p className="text-amber-700 text-sm mt-1">
                          The server couldn't process this image. Please try a different image or format.
                        </p>
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          Upload Different Image
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : isUnidentifiable ? (
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <div className="flex items-start gap-2">
                      <ImageOff className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Unable to Identify Image</h4>
                        <p className="text-amber-700 text-sm mt-1">
                          I'm unable to identify this. Please try another image.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}

                {error && !isUnidentifiable && !hasJsonParseError && !hasBadRequestError && (
                  <ErrorDisplay error={error} diagnostics={errorDiagnostics} />
                )}
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
                  <p className="mt-1 text-green-700 font-medium">{productName}</p>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-medium text-purple-800">Step 2: Find Ingredients</h3>
                <p className="text-gray-600 text-sm">
                  Next, we'll use AI to search for the ingredients in {productName}.
                </p>
                {hasJsonParseError ? (
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Server Error</h4>
                        <p className="text-amber-700 text-sm mt-1">
                          There was an error processing your request. Please try again.
                        </p>
                        <Button
                          onClick={handleFindIngredients}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : hasBadRequestError ? (
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Invalid Request</h4>
                        <p className="text-amber-700 text-sm mt-1">
                          The server couldn't process this request. Please try again with a different product name.
                        </p>
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          Start Over
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleFindIngredients}
                    disabled={isLoading || !isOnline || !productName}
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
                    ) : !productName ? (
                      "No Product Identified"
                    ) : (
                      <>
                        Find Ingredients
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
                {error && !hasJsonParseError && !hasBadRequestError && (
                  <ErrorDisplay error={error} diagnostics={errorDiagnostics} />
                )}
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
                  <p className="mt-1 text-green-700 font-medium">{productName}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <h4 className="font-medium text-green-800">Ingredients Found</h4>
                  </div>
                  <p className="mt-1 text-green-700 text-sm">{ingredients.length} ingredients identified</p>
                  {isFood && (
                    <div className="flex items-center gap-1 mt-1 text-green-700 text-sm">
                      <Utensils className="h-4 w-4" />
                      <span>Food product</span>
                    </div>
                  )}
                  {!isFood && (
                    <div className="flex items-center gap-1 mt-1 text-green-700 text-sm">
                      <Sparkles className="h-4 w-4" />
                      <span>Skincare/cosmetic product</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-medium text-purple-800">Step 3: Analyze for Pregnancy Safety</h3>
                <p className="text-gray-600 text-sm">
                  Finally, we'll use AI to analyze if any ingredients are potentially harmful during pregnancy.
                </p>
                <div className="bg-purple-50 p-3 rounded-md border border-purple-200 max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-purple-700 mb-2">Identified Ingredients:</h4>
                  <ul className="text-sm text-purple-600 space-y-1">
                    {ingredients.map((ingredient, index) => (
                      <li key={index}>• {ingredient}</li>
                    ))}
                  </ul>
                </div>
                {hasJsonParseError ? (
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Server Error</h4>
                        <p className="text-amber-700 text-sm mt-1">
                          There was an error processing your request. Please try again.
                        </p>
                        <Button
                          onClick={handleAnalyzeIngredients}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : hasBadRequestError ? (
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Invalid Request</h4>
                        <p className="text-amber-700 text-sm mt-1">
                          The server couldn't process these ingredients. Please try again.
                        </p>
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          Start Over
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleAnalyzeIngredients}
                    disabled={isLoading || !isOnline || ingredients.length === 0}
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
                )}
                {error && !hasJsonParseError && !hasBadRequestError && (
                  <ErrorDisplay error={error} diagnostics={errorDiagnostics} />
                )}
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
                      isFood: isFood,
                    }}
                  />
                )}
                {isFromSavedSearch && (
                  <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-blue-700 text-sm">
                      This is a saved result. No new API calls were made to retrieve this information.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleReset} className="w-full bg-purple-600 hover:bg-purple-700">
                Analyze Another Product
              </Button>

              {!isFromSavedSearch && (
                <Button
                  onClick={handleSaveResult}
                  disabled={isSaving || isSaved}
                  variant={isSaved ? "outline" : "secondary"}
                  className={`w-full ${
                    isSaved
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Result
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} />

      <Card className="w-full shadow-md bg-white border-purple-200">
        <CardContent className="p-6">{renderStepContent()}</CardContent>
      </Card>

      <SavedSearches onSelectSearch={handleSelectSavedSearch} />
    </div>
  )
}
