import type { AnalysisResult, SavedSearches } from "./types"

// Maximum number of saved searches to keep
const MAX_SAVED_SEARCHES = 10

// Save a new search result to localStorage
export function saveSearchResult(result: AnalysisResult): void {
  if (typeof window === "undefined") return

  try {
    // Get existing searches
    const savedSearches = getSavedSearches()

    // Add new search to the beginning of the array
    savedSearches.searches = [result, ...savedSearches.searches]

    // Limit to max number of searches
    if (savedSearches.searches.length > MAX_SAVED_SEARCHES) {
      savedSearches.searches = savedSearches.searches.slice(0, MAX_SAVED_SEARCHES)
    }

    // Save back to localStorage
    localStorage.setItem("savedSearches", JSON.stringify(savedSearches))
    console.log("Search result saved successfully")
  } catch (error) {
    console.error("Error saving search result:", error)
  }
}

// Get all saved searches from localStorage
export function getSavedSearches(): SavedSearches {
  if (typeof window === "undefined") return { searches: [] }

  try {
    const savedData = localStorage.getItem("savedSearches")
    if (!savedData) return { searches: [] }

    return JSON.parse(savedData) as SavedSearches
  } catch (error) {
    console.error("Error retrieving saved searches:", error)
    return { searches: [] }
  }
}

// Delete a specific saved search by ID
export function deleteSearchResult(id: string): void {
  if (typeof window === "undefined") return

  try {
    const savedSearches = getSavedSearches()
    savedSearches.searches = savedSearches.searches.filter((search) => search.id !== id)
    localStorage.setItem("savedSearches", JSON.stringify(savedSearches))
    console.log("Search result deleted successfully")
  } catch (error) {
    console.error("Error deleting search result:", error)
  }
}

// Clear all saved searches
export function clearAllSearches(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("savedSearches", JSON.stringify({ searches: [] }))
    console.log("All searches cleared successfully")
  } catch (error) {
    console.error("Error clearing searches:", error)
  }
}

// Get a specific saved search by ID
export function getSearchById(id: string): AnalysisResult | null {
  if (typeof window === "undefined") return null

  try {
    const savedSearches = getSavedSearches()
    return savedSearches.searches.find((search) => search.id === id) || null
  } catch (error) {
    console.error("Error retrieving search by ID:", error)
    return null
  }
}
