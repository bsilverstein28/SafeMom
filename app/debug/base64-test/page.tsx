import { Base64Tester } from "@/components/base64-tester"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Base64TestPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-purple-100 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-purple-800">Base64 Image Test</h1>
          <Button asChild variant="outline" className="border-purple-300 text-purple-700">
            <Link href="/debug">Return to Debug</Link>
          </Button>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-purple-700 mb-4">Test Base64 Image Upload</h2>
            <p className="text-gray-600 mb-4">
              This page tests the direct base64 image upload and analysis with the OpenAI Vision API.
            </p>
            <Base64Tester />
          </section>
        </div>
      </div>
    </main>
  )
}
