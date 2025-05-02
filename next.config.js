/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Make sure environment variables are accessible
    NEXT_PUBLIC_BASE_URL:
      process.env.NODE_ENV === "production"
        ? "https://safemom.vercel.app"
        : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  },
  // Ensure images from OpenAI and other sources can be used
  images: {
    domains: ["oaidalleapiprodscus.blob.core.windows.net", "replicate.delivery"],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
