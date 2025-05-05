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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add this to help with potential transpilation issues
  transpilePackages: ["lucide-react"],
}

module.exports = nextConfig
