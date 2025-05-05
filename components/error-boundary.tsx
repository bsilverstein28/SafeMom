"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">
            The application encountered an unexpected error. Please try refreshing the page.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
          {this.state.error && (
            <div className="mt-4 p-3 bg-red-100 rounded text-left overflow-auto max-h-32 text-xs">
              <p className="font-mono text-red-800">{this.state.error.toString()}</p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
