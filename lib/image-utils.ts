/**
 * Utility functions for handling images
 */

/**
 * Check if an image URL is valid and accessible
 * @param url The image URL to check
 * @returns Promise that resolves to true if the image is valid, false otherwise
 */
export function isImageUrlValid(url: string): Promise<boolean> {
  // If it's a data URL or a relative URL, assume it's valid
  if (url.startsWith("data:") || url.startsWith("/")) {
    return Promise.resolve(true)
  }

  // For remote URLs, check if they're accessible
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/**
 * Get a valid image URL, falling back to a placeholder if needed
 * @param url The primary image URL to try
 * @param fallbackUrl Optional fallback URL
 * @returns A valid image URL
 */
export function getValidImageUrl(url: string | null | undefined, fallbackUrl = "/placeholder.svg"): string {
  if (!url) return fallbackUrl

  // If it's a data URL or a relative URL, use it
  if (url.startsWith("data:") || url.startsWith("/")) {
    return url
  }

  // Otherwise, use the URL but be prepared for it to fail
  return url
}
