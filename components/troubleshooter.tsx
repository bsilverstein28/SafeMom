"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Troubleshooter() {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)

  const issues = [
    {
      id: "redirect",
      name: "Redirect Loop (302)",
      description: "API returns a 302 redirect followed by HTML",
      solution: "Add redirect: 'follow' to fetch options or correct the URL path. Check for auth middleware redirects.",
      code: `// In your fetch call:
const response = await fetch(url, {
  // ...other options
  redirect: 'follow' // Add this line
});

// Or in your makeApiRequest function:
const requestOptions: RequestInit = {
  method,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  redirect: "follow", // Add this line
  // ...other options
};`,
    },
    {
      id: "notfound",
      name: "Route Not Found (404)",
      description: "API route returns a 404 Not Found error",
      solution: "Make sure your API route is in the correct location and format.",
      code: `// For App Router:
// File should be at: app/api/analyze/route.ts

export async function POST(request: Request) {
  // Your code here
  return new Response(
    JSON.stringify({ data: "your response" }),
    { headers: { "Content-Type": "application/json" } }
  )
}

// For Pages Router:
// File should be at: pages/api/analyze.ts

export default function handler(req, res) {
  // Your code here
  res.status(200).json({ data: "your response" })
}`,
    },
    {
      id: "servererror",
      name: "Server Error (500)",
      description: "API throws an uncaught exception",
      solution: "Wrap your API handler in try/catch and always return proper JSON responses.",
      code: `export async function POST(request: Request) {
  try {
    // Your code here that might throw
    const data = await someOperation()
    
    return new Response(
      JSON.stringify({ data }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("API error:", error)
    
    return new Response(
      JSON.stringify({ 
        error: \`Error: \${error.message}\` 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    )
  }
}`,
    },
    {
      id: "payloadtoolarge",
      name: "Payload Too Large (413)",
      description: "Request body is too large for Edge runtime",
      solution: "Switch to Node.js runtime, increase bodyParser limit, or use Blob storage.",
      code: `// In your API route file:

// Switch to Node.js runtime
export const runtime = "nodejs"

// Increase body parser limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
}

// Or use Blob storage instead of base64:
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  
  const blob = await put(file.name, file, { access: "public" })
  
  return new Response(
    JSON.stringify({ url: blob.url }),
    { headers: { "Content-Type": "application/json" } }
  )
}`,
    },
    {
      id: "timeout",
      name: "Gateway Timeout (502/524)",
      description: "Request to upstream service (OpenAI) timed out",
      solution: "Implement retry with exponential back-off and increase timeout in OpenAI client.",
      code: `// Increase OpenAI client timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 2 minutes
});

// Implement retry logic
async function callWithRetry(fn, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(\`Attempt \${i + 1} failed: \${error.message}\`);
      lastError = error;
      
      // Only retry certain errors
      if (!error.message.includes("timeout")) throw error;
      
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  
  throw lastError;
}`,
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-purple-800">Common Issues & Solutions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {issues.map((issue) => (
              <Button
                key={issue.id}
                variant={selectedIssue === issue.id ? "default" : "outline"}
                className={selectedIssue === issue.id ? "bg-purple-600" : "border-purple-300 text-purple-700"}
                onClick={() => setSelectedIssue(issue.id === selectedIssue ? null : issue.id)}
              >
                {issue.name}
              </Button>
            ))}
          </div>

          {selectedIssue && (
            <div className="mt-4 border border-purple-200 rounded-md p-4 bg-purple-50">
              <h3 className="font-medium text-purple-800 mb-1">{issues.find((i) => i.id === selectedIssue)?.name}</h3>
              <p className="text-sm text-purple-700 mb-3">{issues.find((i) => i.id === selectedIssue)?.description}</p>
              <div className="bg-white p-3 rounded-md border border-purple-200 mb-3">
                <h4 className="text-sm font-medium text-purple-800 mb-1">Solution:</h4>
                <p className="text-sm text-gray-700">{issues.find((i) => i.id === selectedIssue)?.solution}</p>
              </div>
              <div className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto">
                <pre className="text-xs">
                  <code>{issues.find((i) => i.id === selectedIssue)?.code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
