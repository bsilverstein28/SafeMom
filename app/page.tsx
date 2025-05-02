import { ProductAnalyzer } from "@/components/product-analyzer"
import { ConnectivityCheck } from "@/components/connectivity-check"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bug } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gradient-to-b from-purple-100 to-white">
      <div className="max-w-3xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2">Pregnancy-Safe Skincare Analyzer</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload a photo of your skincare product and follow the steps to check if it's safe during pregnancy.
            <span className="block mt-1 text-sm text-purple-600">Powered by ChatGPT</span>
          </p>
        </div>

        <ProductAnalyzer />

        <div className="mt-8 text-center">
          <Button asChild variant="ghost" size="sm" className="text-purple-600 text-xs">
            <Link href="/debug" className="flex items-center gap-1">
              <Bug className="h-3 w-3" />
              Troubleshoot
            </Link>
          </Button>
        </div>
      </div>

      <ConnectivityCheck />
    </main>
  )
}
