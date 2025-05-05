import { CheckCircle, AlertTriangle, AlertCircle, Utensils, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AnalysisResultsProps {
  results: {
    product: string
    ingredients: string[]
    harmfulIngredients: { name: string; reason: string }[]
    isSafe: boolean
    parsingError?: boolean
    isFood?: boolean
  }
}

export function AnalysisResults({ results }: AnalysisResultsProps) {
  const { product, ingredients, harmfulIngredients, isSafe, parsingError, isFood } = results

  return (
    <div className="space-y-4">
      {parsingError && (
        <div className="bg-amber-50 p-3 rounded-md border border-amber-200 flex items-start gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 text-sm">
            We encountered an issue analyzing this product. The results below may be incomplete.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isSafe ? (
          <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
        )}
        <h2 className="text-xl font-semibold text-purple-800">
          {isSafe ? "Product appears safe for pregnancy" : "Product contains potentially harmful ingredients"}
        </h2>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-1 text-purple-800">Identified Product</h3>
        <div className="flex items-center gap-2">
          <p className="text-gray-700">{product}</p>
          {isFood ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <Utensils className="h-3 w-3 mr-1" />
              Food
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Skincare/Cosmetic
            </Badge>
          )}
        </div>
      </div>

      {harmfulIngredients && harmfulIngredients.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2 text-amber-700">Potentially Harmful Ingredients</h3>
          <ul className="space-y-3">
            {harmfulIngredients.map((ingredient, index) => (
              <li key={index} className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <div className="font-medium text-amber-800">{ingredient.name}</div>
                <div className="text-sm text-amber-700 mt-1">{ingredient.reason}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium mb-2 text-purple-800">All Identified Ingredients</h3>
        {ingredients && ingredients.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient, index) => {
              const isHarmful =
                harmfulIngredients &&
                harmfulIngredients.some((harmful) => harmful.name.toLowerCase() === ingredient.toLowerCase())

              return (
                <Badge
                  key={index}
                  variant={isHarmful ? "destructive" : "secondary"}
                  className={
                    isHarmful
                      ? "bg-red-100 text-red-800 border-red-200"
                      : isFood
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-purple-100 text-purple-800 border-purple-200"
                  }
                >
                  {ingredient}
                </Badge>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No ingredients were identified.</p>
        )}
      </div>

      {isFood && (
        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-1">Food Safety During Pregnancy</h4>
          <p className="text-sm text-blue-700">
            Always ensure food is properly washed, cooked thoroughly, and stored at safe temperatures. Consult with your
            healthcare provider about specific dietary restrictions during your pregnancy.
          </p>
        </div>
      )}
    </div>
  )
}
