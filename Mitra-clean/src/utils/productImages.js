// Product Image Utility using Unsplash API
import { API_CONFIG, isApiKeyConfigured } from '../config/api.js';

// Cache for storing fetched images
const imageCache = new Map();

// Fallback placeholder images for different product types - using reliable, different images
const PLACEHOLDER_IMAGES = {
  default: 'https://picsum.photos/400/300?random=1',
  vegetables: 'https://picsum.photos/400/300?random=2',
  fruits: 'https://picsum.photos/400/300?random=3',
  grains: 'https://picsum.photos/400/300?random=4'
};

/**
 * Get appropriate placeholder image based on product name
 * @param {string} productName - Name of the product
 * @returns {string} - Placeholder image URL
 */
function getPlaceholderImage(productName) {
  if (!productName) return PLACEHOLDER_IMAGES.default;
  
  const name = productName.toLowerCase().trim();
  
  // Vegetable keywords - more comprehensive list
  const vegetables = [
    'spinach', 'tomato', 'potato', 'onion', 'carrot', 'cucumber', 'pepper', 'lettuce', 
    'cabbage', 'broccoli', 'cauliflower', 'garlic', 'ginger', 'chili', 'okra', 'eggplant',
    'zucchini', 'squash', 'pumpkin', 'beetroot', 'radish', 'turnip', 'parsnip', 'celery',
    'asparagus', 'artichoke', 'brussels', 'kale', 'collard', 'mustard', 'watercress',
    'arugula', 'endive', 'escarole', 'fennel', 'leek', 'shallot', 'scallion', 'chive'
  ];
  
  // Fruit keywords - more comprehensive list
  const fruits = [
    'apple', 'banana', 'orange', 'mango', 'grape', 'strawberry', 'pineapple', 'watermelon',
    'papaya', 'pear', 'peach', 'plum', 'apricot', 'cherry', 'blueberry', 'raspberry',
    'blackberry', 'cranberry', 'kiwi', 'pomegranate', 'fig', 'date', 'prune', 'raisin',
    'currant', 'gooseberry', 'mulberry', 'elderberry', 'boysenberry', 'loganberry'
  ];
  
  // Grain keywords - more comprehensive list
  const grains = [
    'rice', 'wheat', 'corn', 'oats', 'barley', 'quinoa', 'millet', 'sorghum', 'rye',
    'buckwheat', 'amaranth', 'teff', 'spelt', 'kamut', 'farro', 'bulgur', 'couscous'
  ];
  
  // Check if product name contains any vegetable keywords
  if (vegetables.some(veg => name.includes(veg))) {
    return PLACEHOLDER_IMAGES.vegetables;
  }
  
  // Check if product name contains any fruit keywords
  if (fruits.some(fruit => name.includes(fruit))) {
    return PLACEHOLDER_IMAGES.fruits;
  }
  
  // Check if product name contains any grain keywords
  if (grains.some(grain => name.includes(grain))) {
    return PLACEHOLDER_IMAGES.grains;
  }
  
  return PLACEHOLDER_IMAGES.default;
}

/**
 * Fetch product image from Unsplash API
 * @param {string} productName - Name of the product
 * @returns {Promise<string>} - Image URL
 */
export async function getProductImage(productName) {
  if (!productName || typeof productName !== 'string') {
    return getPlaceholderImage(productName);
  }

  // Check cache first
  const cacheKey = productName.toLowerCase().trim();
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    // If no API key, return appropriate placeholder
    if (!isApiKeyConfigured()) {
      console.warn('Unsplash API key not configured. Using placeholder images.');
      return getPlaceholderImage(productName);
    }

    // Build search query - add "food" or "vegetable" for better results
    const searchQuery = `${productName} food vegetable fruit`;
    
    const response = await fetch(
      `${API_CONFIG.UNSPLASH_API_URL}?query=${encodeURIComponent(searchQuery)}&per_page=${API_CONFIG.IMAGES_PER_REQUEST}&orientation=${API_CONFIG.IMAGE_ORIENTATION}`,
      {
        headers: {
          'Authorization': `Client-ID ${API_CONFIG.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular;
      
      // Cache the result
      imageCache.set(cacheKey, imageUrl);
      
      return imageUrl;
         } else {
       // No results found, use placeholder
       const placeholder = getPlaceholderImage(productName);
       imageCache.set(cacheKey, placeholder);
       return placeholder;
     }
   } catch (error) {
     console.error('Error fetching product image:', error);
     
     // Cache placeholder to avoid repeated failed requests
     const placeholder = getPlaceholderImage(productName);
     imageCache.set(cacheKey, placeholder);
     return placeholder;
   }
}

/**
 * Get cached image if available, otherwise return placeholder
 * @param {string} productName - Name of the product
 * @returns {string} - Cached image URL or placeholder
 */
export function getCachedProductImage(productName) {
  if (!productName) return getPlaceholderImage(productName);
  
  const cacheKey = productName.toLowerCase().trim();
  return imageCache.get(cacheKey) || getPlaceholderImage(productName);
}

/**
 * Clear image cache
 */
export function clearImageCache() {
  imageCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: imageCache.size,
    keys: Array.from(imageCache.keys())
  };
}
