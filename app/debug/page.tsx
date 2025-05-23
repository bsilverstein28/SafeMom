import { DiagnosticTool } from "@/components/diagnostic-tool"
import { Troubleshooter } from "@/components/troubleshooter"
import { UrlChecker } from "@/components/url-checker"
import { ProductionStatus } from "@/components/production-status"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DebugPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-purple-100 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-purple-800">Skincare Analyzer - Debug</h1>
          <Button asChild variant="outline" className="border-purple-300 text-purple-700">
            <Link href="/">Return to App</Link>
          </Button>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-purple-700 mb-4">Production Environment Status</h2>
            <ProductionStatus />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-purple-700 mb-4">URL Configuration</h2>
            <UrlChecker />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-purple-700 mb-4">Common Issues & Solutions</h2>
            <Troubleshooter />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-purple-700 mb-4">API Diagnostics</h2>
            <DiagnosticTool />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-purple-700 mb-4">Testing Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                <h3 className="font-medium text-purple-800 mb-2">Base64 Image Test</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Test the direct base64 image upload and analysis with the OpenAI Vision API.
                </p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/debug/base64-test">Open Base64 Tester</Link>
                </Button>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                <h3 className="font-medium text-purple-800 mb-2">Secure Server-Side Test</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Test the secure server-side image analysis using Server Actions.
                </p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/debug/secure-test">Open Secure Tester</Link>
                </Button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-purple-700 mb-4">Environment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                <h3 className="font-medium text-purple-800 mb-2">Runtime</h3>
                <p className="text-sm text-gray-600">
                  This page is running in <code className="bg-gray-100 px-1 py-0.5 rounded">server</code>
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                <h3 className="font-medium text-purple-800 mb-2">Base URL</h3>
                <p className="text-sm text-gray-600">Server-side rendering</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
