import { CheckCircle } from "lucide-react"

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: "Upload & Identify" },
    { number: 2, label: "Find Ingredients" },
    { number: 3, label: "Analyze Safety" },
    { number: 4, label: "View Results" },
  ]

  return (
    <div className="w-full">
      <div className="flex justify-between">
        {steps.map((step) => {
          const isActive = currentStep >= step.number
          const isCompleted = currentStep > step.number

          return (
            <div
              key={step.number}
              className={`flex flex-col items-center space-y-2 ${isActive ? "text-purple-700" : "text-gray-400"}`}
            >
              <div className="relative">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isActive ? "bg-purple-100 border-purple-500" : "bg-gray-100 border-gray-300"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                  ) : (
                    <span className={isActive ? "text-purple-700" : "text-gray-500"}>{step.number}</span>
                  )}
                </div>
              </div>
              <span className={`text-xs font-medium ${isActive ? "text-purple-700" : "text-gray-500"}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="relative mt-2">
        <div className="absolute top-0 h-1 w-full bg-gray-200 rounded"></div>
        <div
          className="absolute top-0 h-1 bg-purple-500 rounded transition-all duration-300"
          style={{
            width: `${((currentStep - 1) / 3) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  )
}
