export interface AnalysisResult {
  id: string
  timestamp: string
  product: string
  imageUrl: string
  ingredients: string[]
  harmfulIngredients: { name: string; reason: string }[]
  isSafe: boolean
  parsingError?: boolean
  isFood?: boolean
}

export interface SavedSearches {
  searches: AnalysisResult[]
}
