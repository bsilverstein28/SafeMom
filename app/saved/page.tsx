"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSavedSearches, deleteSearchResult, clearAllSearches } from "@/lib/saved-searches"
import type { AnalysisResult } from "@/lib/types"
import { CheckCircle, AlertTriangle, Trash2, ArrowLeft, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { AnalysisResults } from "@/components/analysis-results"
import { ErrorBoundary } from "@/components/error-boundary"
import Image from "next/image"

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<AnalysisResult[]>([])
  const [selectedSearch, setSelectedSearch] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load saved searches on component mount
  useEffect(() => {
    try {
      const { searches } = getSavedSearches()
      setSavedSearches(searches)

      // Select the first search by default if available
      if (searches.length > 0) {
        setSelectedSearch(searches[0])
      }
    } catch (err) {
      console.error("Error loading saved searches:", err)
      setError("Failed to load saved searches")
    }
  }, [])

  // Handle deleting a search
  const handleDelete = (id: string) => {
    try {
      deleteSearchResult(id)
      setSavedSearches((prev) => {
        const updated = prev.filter((search) => search.id !== id)

        // If the deleted search was selected, select another one
        if (selectedSearch && selectedSearch.id === id) {
          if (updated.length > 0) {
            setSelectedSearch(updated[0])
          } else {
            setSelectedSearch(null)
          }
        }

        return updated
      })
    } catch (err) {
      console.error("Error deleting search:", err)
      setError("Failed to delete search")
    }
  }

  // Handle clearing all searches
  const handleClearAll = () => {
    try {
      clearAllSearches()
      setSavedSearches([])
      setSelectedSearch(null)
    } catch (err) {
      console.error("Error clearing searches:", err)
      setError("Failed to clear searches")
    }
  }

  // Format the timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      return "Unknown time"
    }
  }

  return (
    <ErrorBoundary>
      <main className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gradient-to-b from-purple-100 to-white">
        <div className="max-w-5xl w-full">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-purple-800">Saved Product Analyses</h1>
            <Button asChild variant="outline" className="border-purple-300 text-purple-700">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Analyzer
              </Link>
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200 mb-6 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {savedSearches.length === 0 && !error ? (
            <Card className="w-full">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Image src="/images/safemom-logo.png" alt="SafeMom Logo" width={200} height={70} className="h-auto" />
                </div>
                <p className="text-gray-600 mb-4">You don't have any saved product analyses yet.</p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/">Analyze a Product</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card className="w-full">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-purple-800">Saved Products ({savedSearches.length})</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-0">
                    <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                      {savedSearches.map((search) => (
                        <div
                          key={search.id}
                          onClick={() => setSelectedSearch(search)}
                          className={`flex items-center gap-3 p-3 rounded-md border ${
                            selectedSearch?.id === search.id
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                          } cursor-pointer transition-colors`}
                        >
                          <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={search.imageUrl || "/placeholder.svg"}
                              alt={search.product}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg"
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {search.isSafe ? (
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              )}
                              <h4 className="font-medium text-sm text-gray-800 truncate">{search.product}</h4>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">{formatTimestamp(search.timestamp)}</p>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(search.id)
                            }}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                {selectedSearch ? (
                  <Card className="w-full">
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg text-purple-800">{selectedSearch.product}</CardTitle>
                      <p className="text-sm text-gray-500">Analyzed {formatTimestamp(selectedSearch.timestamp)}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/3 rounded-md overflow-hidden">
                          <img
                            src={selectedSearch.imageUrl || "/placeholder.svg"}
                            alt={selectedSearch.product}
                            className="w-full h-auto object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <AnalysisResults
                            results={{
                              product: selectedSearch.product,
                              ingredients: selectedSearch.ingredients,
                              harmfulIngredients: selectedSearch.harmfulIngredients,
                              isSafe: selectedSearch.isSafe,
                              parsingError: selectedSearch.parsingError,
                              isFood: selectedSearch.isFood,
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="w-full h-full flex items-center justify-center">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-600">Select a saved product to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 text-center w-full">
            <p className="text-xs text-gray-500 max-w-2xl mx-auto border-t border-gray-200 pt-4">
              Please note: BabySafe's ingredient analysis is AI-powered and intended for informational purposes. It does
              not constitute medical advice. Consult your healthcare provider for any health concerns or decisions
              during pregnancy.
            </p>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  )
}
