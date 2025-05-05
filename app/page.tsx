import { ProductAnalyzer } from "@/components/product-analyzer"
import { ConnectivityCheck } from "@/components/connectivity-check"
import { ErrorBoundary } from "@/components/error-boundary"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bug } from "lucide-react"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gradient-to-b from-purple-100 to-white">
      <div className="max-w-3xl w-full">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/safemom-logo.png"
              alt="SafeMom Logo"
              width={300}
              height={100}
              priority
              className="h-auto"
            />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Analyze skincare products, makeup, shampoos, food, and other items to make sure they're safe for expecting
            mothers. Get started by uploading a picture.
          </p>
        </div>

        <ErrorBoundary>
          <ProductAnalyzer />
        </ErrorBoundary>

        <div className="mt-8 text-center">
          <Button asChild variant="ghost" size="sm" className="text-purple-600 text-xs">
            <Link href="/debug" className="flex items-center gap-1">
              <Bug className="h-3 w-3" />
              Troubleshoot
            </Link>
          </Button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-gray-500 max-w-2xl mx-auto border-t border-gray-200 pt-4">
            Please note: BabySafe's ingredient analysis is AI-powered and intended for informational purposes. It does
            not constitute medical advice. Consult your healthcare provider for any health concerns or decisions during
            pregnancy.
          </p>
        </div>
      </div>

      <ConnectivityCheck />
    </main>
  )
}
