"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSavedSearches, deleteSearchResult, clearAllSearches } from "@/lib/saved-searches"
import type { AnalysisResult } from "@/lib/types"
import { CheckCircle, AlertTriangle, Trash2, Clock, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SavedSearchesProps {
  onSelectSearch: (search: AnalysisResult) => void
}

export function SavedSearches({ onSelectSearch }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<AnalysisResult[]>([])
  const [expanded, setExpanded] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load saved searches on component mount
  useEffect(() => {
    try {
      const { searches } = getSavedSearches()
      setSavedSearches(searches)
    } catch (err) {
      console.error("Error loading saved searches:", err)
      setError("Failed to load saved searches")
    }
  }, [])

  // Handle deleting a search
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent click
    try {
      deleteSearchResult(id)
      setSavedSearches((prev) => prev.filter((search) => search.id !== id))
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

  if (savedSearches.length === 0 && !error) {
    return null
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader className="py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-purple-800 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Previous Searches ({savedSearches.length})
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {error && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200 mb-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {savedSearches.length > 0 && (
              <div className="flex justify-end">
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
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  onClick={() => onSelectSearch(search)}
                  className="flex items-center gap-3 p-3 rounded-md border border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
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
                      <p className="text-xs text-gray-500">{search.ingredients.length} ingredients</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(search.id, e)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
