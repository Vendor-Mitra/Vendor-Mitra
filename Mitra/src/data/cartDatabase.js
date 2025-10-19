// Cart Database - Persists cart items per user in localStorage
// This ensures cart items persist across login/logout

const CART_STORAGE_KEY = 'vendorMitraUserCarts'

// Load all user carts from localStorage
const loadCarts = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch (error) {
    console.error('Error loading carts from localStorage:', error)
    return {}
  }
}

// Save all user carts to localStorage
const saveCarts = (carts) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(carts))
  } catch (error) {
    console.error('Error saving carts to localStorage:', error)
  }
}

// Cart Database API
export const cartDatabase = {
  // Get cart for a specific user
  getUserCart: (userId) => {
    if (!userId) return []
    const carts = loadCarts()
    return carts[userId] || []
  },

  // Save cart for a specific user
  saveUserCart: (userId, cartItems) => {
    if (!userId) return
    const carts = loadCarts()
    carts[userId] = cartItems
    saveCarts(carts)
    console.log(`💾 Saved cart for user ${userId}:`, cartItems.length, 'items')
  },

  // Add item to user's cart
  addToUserCart: (userId, item) => {
    if (!userId) return
    const cart = cartDatabase.getUserCart(userId)
    const existingIndex = cart.findIndex(i => i.id === item.id)
    
    if (existingIndex >= 0) {
      // Update quantity
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + (item.quantity || 1)
    } else {
      // Add new item
      cart.push({ ...item, quantity: item.quantity || 1 })
    }
    
    cartDatabase.saveUserCart(userId, cart)
    return cart
  },

  // Remove item from user's cart
  removeFromUserCart: (userId, itemId) => {
    if (!userId) return
    const cart = cartDatabase.getUserCart(userId)
    const filtered = cart.filter(i => i.id !== itemId)
    cartDatabase.saveUserCart(userId, filtered)
    return filtered
  },

  // Update item quantity in user's cart
  updateUserCartQuantity: (userId, itemId, quantity) => {
    if (!userId) return
    const cart = cartDatabase.getUserCart(userId)
    const updated = cart.map(i => 
      i.id === itemId ? { ...i, quantity } : i
    )
    cartDatabase.saveUserCart(userId, updated)
    return updated
  },

  // Clear user's cart
  clearUserCart: (userId) => {
    if (!userId) return
    cartDatabase.saveUserCart(userId, [])
    console.log(`🗑️ Cleared cart for user ${userId}`)
  },

  // Get all carts (for debugging)
  getAllCarts: () => {
    return loadCarts()
  },

  // Migrate old cart to user-specific cart (one-time migration)
  migrateOldCart: (userId, oldCart) => {
    if (!userId || !oldCart || oldCart.length === 0) return
    
    const carts = loadCarts()
    if (!carts[userId] || carts[userId].length === 0) {
      carts[userId] = oldCart
      saveCarts(carts)
      console.log(`🔄 Migrated ${oldCart.length} items to user ${userId}'s cart`)
    }
  }
}

export default cartDatabase
