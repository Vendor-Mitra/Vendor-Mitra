// Firebase configuration
// Follow FIREBASE_SETUP_INSTRUCTIONS.md to get your config values

// Firebase is not installed by default - this file exports null values
// When you install Firebase and configure it, the app will automatically use it

console.warn('⚠️ Firebase not installed. Using localStorage fallback.')
console.warn('📦 To enable cross-device sync, run: npm install firebase')
console.warn('📖 Then see FIREBASE_SETUP_INSTRUCTIONS.md for setup guide')

// Export null values - app will use localStorage fallback
export const app = null
export const db = null
export const auth = null
export const isConfigured = false

export default app
