import React, { createContext, useContext, useEffect, useState } from 'react'
import { cartDatabase } from '../data/cartDatabase'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  console.log('useCart hook called, cart state:', context.cart)
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)

  // Load cart when user changes or component mounts
  useEffect(() => {
    const loadUserCart = () => {
      // Get current user from localStorage
      const userStr = localStorage.getItem('vendorMitraUser')
      console.log('🔍 Checking for logged-in user...', userStr ? 'Found' : 'Not found')
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          const userId = user.id
          console.log('👤 User ID:', userId, 'Current ID:', currentUserId)
          
          if (userId !== currentUserId) {
            console.log('🔄 User changed, loading cart for user:', userId)
            setCurrentUserId(userId)
            
            // One-time migration: Move old cart to user-specific cart (guarded by a flag)
            const oldCart = localStorage.getItem('vendorMitraCart')
            const migratedFlagKey = `vendorMitraCartMigrated_${userId}`
            const alreadyMigrated = localStorage.getItem(migratedFlagKey) === 'true'
            if (oldCart && !alreadyMigrated) {
              try {
                const parsed = JSON.parse(oldCart)
                if (Array.isArray(parsed) && parsed.length > 0) {
                  cartDatabase.migrateOldCart(userId, parsed)
                  localStorage.setItem(migratedFlagKey, 'true')
                  localStorage.removeItem('vendorMitraCart') // Remove old cart
                  console.log('🔄 Migrated old cart to user-specific cart (one-time)')
                }
              } catch {}
            }
            
            // Load user's cart from database
            const userCart = cartDatabase.getUserCart(userId)
            setCart(userCart)
            console.log(`📦 Loaded cart for user ${userId}:`, userCart.length, 'items', userCart)
          }
        } catch (error) {
          console.error('Error loading user cart:', error)
        }
      } else {
        // No user logged in, clear cart
        console.log('❌ No user logged in, clearing cart')
        if (currentUserId !== null) {
          setCurrentUserId(null)
          setCart([])
        }
      }
    }

    // Load cart immediately
    loadUserCart()

    // Also listen for storage events (when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'vendorMitraUser') {
        console.log('🔔 User changed in localStorage, reloading cart')
        loadUserCart()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [currentUserId])

  // Save cart to database whenever it changes
  useEffect(() => {
    if (currentUserId) {
      cartDatabase.saveUserCart(currentUserId, cart)
    }
  }, [cart, currentUserId])

  const addToCart = (item) => {
    console.log('CartContext: Adding item to cart:', item)
    try {
      // Resolve userId for persistence even if currentUserId not yet set
      const resolvedUserId = currentUserId || (() => {
        try {
          const userStr = localStorage.getItem('vendorMitraUser')
          return userStr ? JSON.parse(userStr).id : null
        } catch { return null }
      })()

      if (resolvedUserId) {
        const updated = cartDatabase.addToUserCart(resolvedUserId, item)
        console.log('CartContext: Persisted add, new cart:', updated)
        setCart(updated)
      } else {
        // Fallback to in-memory if no user yet
        setCart(prevCart => {
          const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
          if (existingItem) {
            const newCart = prevCart.map(cartItem =>
              cartItem.id === item.id
                ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
                : cartItem
            )
            console.log('CartContext: Updated existing item (no user yet), new cart:', newCart)
            return newCart
          }
          const newCart = [...prevCart, { ...item, quantity: item.quantity || 1 }]
          console.log('CartContext: Added new item (no user yet), new cart:', newCart)
          return newCart
        })
      }
    } catch (e) {
      console.warn('CartContext: addToCart persistence failed, falling back to state only', e)
      setCart(prev => [...prev, { ...item, quantity: item.quantity || 1 }])
    }
  }

  const removeFromCart = (itemId) => {
    console.log('⚠️ CartContext: Removing item from cart:', itemId)
    console.trace('Remove cart called from:')
    
    // Check if item has an active bargain
    try {
      const bargains = JSON.parse(localStorage.getItem('vendorMitraBargains') || '[]')
      const activeBargain = bargains.find(b => 
        b.productId === itemId && 
        b.status !== 'rejected' && 
        b.status !== 'agreed' &&
        b.status !== 'completed'
      )
      
      if (activeBargain) {
        console.warn('⚠️ WARNING: Item has an active bargain! Consider completing the bargain first.')
        console.log('Active bargain:', activeBargain)
      }
    } catch (e) {
      // Ignore errors in bargain check
    }
    
    try {
      const resolvedUserId = currentUserId || (() => {
        try { const u = localStorage.getItem('vendorMitraUser'); return u ? JSON.parse(u).id : null } catch { return null }
      })()
      if (resolvedUserId) {
        const updated = cartDatabase.removeFromUserCart(resolvedUserId, itemId)
        console.log('CartContext: Persisted removal, new cart:', updated)
        setCart(updated)
        return
      }
    } catch {}
    setCart(prevCart => prevCart.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    try {
      const resolvedUserId = currentUserId || (() => {
        try { const u = localStorage.getItem('vendorMitraUser'); return u ? JSON.parse(u).id : null } catch { return null }
      })()
      if (resolvedUserId) {
        const updated = cartDatabase.updateUserCartQuantity(resolvedUserId, itemId, quantity)
        console.log('CartContext: Persisted quantity update, new cart:', updated)
        setCart(updated)
        return
      }
    } catch {}
    setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantity } : item))
  }

  const clearCart = () => {
    console.log('⚠️ CartContext: Clearing entire cart')
    console.trace('Clear cart called from:')
    setCart([])
    try {
      if (currentUserId) {
        // Persistently clear the user's cart in storage
        cartDatabase.clearUserCart(currentUserId)
      }
      // Remove legacy cart key to prevent migration from re-adding items after reload
      localStorage.removeItem('vendorMitraCart')
    } catch (e) {
      console.warn('Failed to fully clear persisted cart:', e)
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = typeof item.price === 'string' 
        ? parseInt(item.price.replace(/[^\d]/g, '')) 
        : item.price
      return total + (price * item.quantity)
    }, 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
} 