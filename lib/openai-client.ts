import OpenAI from "openai"

// Create a singleton instance of the OpenAI client
let openaiInstance: OpenAI | null = null

export function getOpenAIClient() {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return null
    }

    try {
      openaiInstance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 60000, // Increase timeout to 60 seconds
        dangerouslyAllowBrowser: true, // Allow browser usage (though this should only be used in server contexts)
      })
      console.log("OpenAI client initialized successfully")
    } catch (error) {
      console.error("Error initializing OpenAI client:", error)
      return null
    }
  }
  return openaiInstance
}
