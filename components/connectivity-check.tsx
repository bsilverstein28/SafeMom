"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function ConnectivityCheck() {
  const [isOnline, setIsOnline] = useState(true)
  const [apiReachable, setApiReachable] = useState(true)

  // Check online status
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

  // Check API reachability
  useEffect(() => {
    if (!isOnline) {
      setApiReachable(false)
      return
    }

    const checkApi = async () => {
      try {
        const response = await fetch("/api/ping", {
          method: "GET",
          cache: "no-store",
        })
        setApiReachable(response.ok)
      } catch (error) {
        console.error("API connectivity check failed:", error)
        setApiReachable(false)
      }
    }

    checkApi()

    // Check API reachability every 30 seconds
    const interval = setInterval(checkApi, 30000)

    return () => clearInterval(interval)
  }, [isOnline])

  if (isOnline && apiReachable) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-50 p-3 rounded-md border border-red-200 shadow-lg flex items-center gap-2 max-w-xs">
      <WifiOff className="h-5 w-5 text-red-500 flex-shrink-0" />
      <div>
        <p className="font-medium text-red-700">{!isOnline ? "You are offline" : "API is unreachable"}</p>
        <p className="text-xs text-red-600">
          {!isOnline ? "Please check your internet connection" : "The application may not function correctly"}
        </p>
      </div>
    </div>
  )
}
