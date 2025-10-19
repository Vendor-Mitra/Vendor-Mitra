// API Configuration
export const API_CONFIG = {
  // Get your free Unsplash API key from: https://unsplash.com/developers
  UNSPLASH_ACCESS_KEY: 'YOUR_UNSPLASH_ACCESS_KEY_HERE',
  
  // API endpoints
  UNSPLASH_API_URL: 'https://api.unsplash.com/search/photos',
  
  // Rate limiting (free tier: 50 requests/hour)
  MAX_REQUESTS_PER_HOUR: 50,
  
  // Image settings
  IMAGE_QUALITY: 'regular', // 'thumb', 'small', 'regular', 'full'
  IMAGE_ORIENTATION: 'landscape',
  IMAGES_PER_REQUEST: 1
}

// Helper function to check if API key is configured
export function isApiKeyConfigured() {
  return API_CONFIG.UNSPLASH_ACCESS_KEY && 
         API_CONFIG.UNSPLASH_ACCESS_KEY !== 'YOUR_UNSPLASH_ACCESS_KEY_HERE'
}
