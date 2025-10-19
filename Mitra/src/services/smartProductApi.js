// Smart Product API - Automatically uses Firebase or localStorage
// This wrapper provides seamless fallback when Firebase is not configured

let productApi

try {
  // Try to import Firebase config
  const { isConfigured } = await import('../config/firebase.js')
  
  if (isConfigured) {
    // Use Firebase for cross-device sync
    console.log('🔥 Using Firebase for data persistence (cross-device sync enabled)')
    const { default: firebaseApi } = await import('./firebaseProductApi.js')
    productApi = firebaseApi
  } else {
    // Fallback to localStorage (single-device only)
    console.log('💾 Using localStorage for data persistence (single-device only)')
    console.log('ℹ️ To enable cross-device sync, install and configure Firebase')
    const { default: localApi } = await import('./productApi.js')
    productApi = localApi
  }
} catch (error) {
  // If Firebase import fails, use localStorage
  console.log('💾 Using localStorage for data persistence (single-device only)')
  console.log('📦 Firebase not installed. To enable cross-device sync:')
  console.log('   1. Run: npm install firebase')
  console.log('   2. See: FIREBASE_SETUP_INSTRUCTIONS.md')
  const { default: localApi } = await import('./productApi.js')
  productApi = localApi
}

export default productApi
