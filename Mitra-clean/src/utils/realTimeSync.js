// Real-time synchronization utility using localStorage events
// This provides cross-tab communication for real-time updates

// Import required functions (these should be implemented in your project)
// import { getProductById, updateProduct } from '../database/productDatabase'
// For now, we'll assume these functions are available globally or imported elsewhere
class RealTimeSync {
  constructor() {
    this.listeners = new Map()
    this.setupStorageListener()
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('vendorMitra_sync_')) {
        const eventType = e.key.replace('vendorMitra_sync_', '')
        const data = e.newValue ? JSON.parse(e.newValue) : null
        
        if (this.listeners.has(eventType)) {
          this.listeners.get(eventType).forEach(callback => callback(data))
        }
      }
    })
  }

  // Subscribe to real-time updates
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType).add(callback)

    // Return unsubscribe function
    return () => {
      if (this.listeners.has(eventType)) {
        this.listeners.get(eventType).delete(callback)
      }
    }
  }

  // Emit real-time update
  emit(eventType, data) {
    const key = `vendorMitra_sync_${eventType}`
    const value = JSON.stringify({
      ...data,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    })
    
    localStorage.setItem(key, value)
    
    // Clean up after a short delay to prevent localStorage bloat
    setTimeout(() => {
      localStorage.removeItem(key)
    }, 1000)
  }

  // Emit product updates
  emitProductUpdate(action, product) {
    this.emit('product_update', {
      action, // 'add', 'update', 'delete'
      product,
      supplierId: product.supplierId
    })
  }

  // Emit bargain updates
  emitBargainUpdate(action, bargain) {
    this.emit('bargain_update', {
      action, // 'create', 'message', 'status_change'
      bargain,
      supplierId: bargain.supplierId,
      vendorId: bargain.vendorId
    })
  }

  // Emit flash sale updates
  emitFlashSaleUpdate(action, flashSale) {
    this.emit('flash_sale_update', {
      action, // 'create', 'update', 'delete', 'purchase'
      flashSale,
      supplierId: flashSale.supplierId
    })
  }

  // Emit review updates
  emitReviewUpdate(action, review) {
    this.emit('review_update', {
      action, // 'add', 'update'
      review,
      supplierId: review.supplierId,
      vendorId: review.vendorId
    })
  }

  // Emit delivery updates
  emitDeliveryUpdate(action, delivery) {
    this.emit('delivery_update', {
      action, // 'create', 'update', 'status_change'
      delivery,
      supplierId: delivery.supplierId,
      vendorId: delivery.customerId
    })
  }

  // Emit stock updates
  emitStockUpdate(action, stockData) {
    this.emit('stock_update', {
      action, // 'purchase', 'restock', 'update'
      ...stockData
    })
  }

  // Emit order updates for vendor profile
  emitOrderUpdate(action, orderData) {
    this.emit('order_update', {
      action, // 'new_order', 'status_change'
      ...orderData
    })
  }
}

// Create singleton instance
const realTimeSync = new RealTimeSync()

const realTimeSyncApi = {
  // General subscribe method - expose the core subscribe functionality
  subscribe: (eventType, callback) => {
    return realTimeSync.subscribe(eventType, callback)
  },

  // General emit method - expose the core emit functionality
  emit: (eventType, data) => {
    return realTimeSync.emit(eventType, data)
  },

  // Emit stock update events
  emitStockUpdate: (data) => {
    realTimeSync.emit('stock_update', data)
  },

  // Subscribe to stock update events
  subscribeToStockUpdates: (callback) => {
    return realTimeSync.subscribe('stock_update', callback)
  },

  // Emit product CRUD events
  emitProductUpdate: (data) => {
    realTimeSync.emit('product_update', data)
  },

  // Subscribe to product CRUD events
  subscribeToProductUpdates: (callback) => {
    return realTimeSync.subscribe('product_update', callback)
  },

  // Emit bargain update events
  emitBargainUpdate: (data) => {
    realTimeSync.emit('bargain_update', data)
  },

  // Subscribe to bargain update events
  subscribeToBargainUpdates: (callback) => {
    return realTimeSync.subscribe('bargain_update', callback)
  },

  // Comprehensive stock management functions
  decreaseStock: async (productId, quantity, options = {}) => {
    try {
      // Import productDatabase dynamically to avoid circular dependencies
      const { productDatabase } = await import('../data/userDatabase')
      
      // Get current product data
      const product = productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          data: null
        }
      }

      // Calculate new stock (cannot go below 0)
      const currentStock = parseInt(product.stock || product.quantity || 0)
      const decreaseAmount = parseInt(quantity || 0)
      
      if (decreaseAmount <= 0) {
        return {
          success: false,
          error: 'Invalid quantity to decrease',
          data: null
        }
      }

      if (currentStock < decreaseAmount) {
        return {
          success: false,
          error: `Insufficient stock. Available: ${currentStock}, Requested: ${decreaseAmount}`,
          data: { availableStock: currentStock }
        }
      }

      const newStock = Math.max(0, currentStock - decreaseAmount)

      // Update product in database/state
      const updatedProduct = {
        ...product,
        stock: newStock,
        quantity: newStock, // Support both stock and quantity fields
        updatedAt: new Date().toISOString()
      }

      const updateResult = productDatabase.updateProduct(productId, updatedProduct)
      if (!updateResult) {
        return {
          success: false,
          error: 'Failed to update product stock',
          data: null
        }
      }

      // Emit real-time stock update
      realTimeSync.emitStockUpdate('purchase', {
        productId,
        previousStock: currentStock,
        newStock,
        quantityPurchased: decreaseAmount,
        product: updatedProduct,
        vendorId: options.vendorId,
        orderId: options.orderId,
        timestamp: Date.now()
      })

      return {
        success: true,
        data: {
          product: updatedProduct,
          stock: newStock,
          newStock,
          previousStock: currentStock,
          quantityPurchased: decreaseAmount
        }
      }

    } catch (error) {
      console.error('Error decreasing stock:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        data: null
      }
    }
  },

  // Increase stock function (for restocking)
  increaseStock: async (productId, quantity, options = {}) => {
    try {
      // Import productDatabase dynamically to avoid circular dependencies
      const { productDatabase } = await import('../data/userDatabase')
      
      // Get current product data
      const product = productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          data: null
        }
      }

      // Calculate new stock
      const currentStock = parseInt(product.stock || product.quantity || 0)
      const increaseAmount = parseInt(quantity || 0)
      
      if (increaseAmount <= 0) {
        return {
          success: false,
          error: 'Invalid quantity to increase',
          data: null
        }
      }

      const newStock = currentStock + increaseAmount

      // Update product in database/state
      const updatedProduct = {
        ...product,
        stock: newStock,
        quantity: newStock, // Support both stock and quantity fields
        updatedAt: new Date().toISOString()
      }

      const updateResult = productDatabase.updateProduct(productId, updatedProduct)
      if (!updateResult) {
        return {
          success: false,
          error: 'Failed to update product stock',
          data: null
        }
      }

      // Emit real-time stock update
      realTimeSync.emitStockUpdate('restock', {
        productId,
        previousStock: currentStock,
        newStock,
        quantityAdded: increaseAmount,
        product: updatedProduct,
        supplierId: options.supplierId,
        timestamp: Date.now()
      })

      return {
        success: true,
        data: {
          product: updatedProduct,
          stock: newStock,
          newStock,
          previousStock: currentStock,
          quantityAdded: increaseAmount
        }
      }

    } catch (error) {
      console.error('Error increasing stock:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        data: null
      }
    }
  },

  // Set stock to a specific value
  setStock: async (productId, newStockValue, options = {}) => {
    try {
      // Import productDatabase dynamically to avoid circular dependencies
      const { productDatabase } = await import('../data/userDatabase')
      
      // Get current product data
      const product = productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          data: null
        }
      }

      const currentStock = parseInt(product.stock || product.quantity || 0)
      const newStock = Math.max(0, parseInt(newStockValue || 0))

      // Update product in database/state
      const updatedProduct = {
        ...product,
        stock: newStock,
        quantity: newStock, // Support both stock and quantity fields
        updatedAt: new Date().toISOString()
      }

      const updateResult = productDatabase.updateProduct(productId, updatedProduct)
      if (!updateResult) {
        return {
          success: false,
          error: 'Failed to update product stock',
          data: null
        }
      }

      // Emit real-time stock update
      realTimeSync.emitStockUpdate('update', {
        productId,
        previousStock: currentStock,
        newStock,
        stockChange: newStock - currentStock,
        product: updatedProduct,
        supplierId: options.supplierId,
        timestamp: Date.now()
      })

      return {
        success: true,
        data: {
          product: updatedProduct,
          stock: newStock,
          newStock,
          previousStock: currentStock,
          stockChange: newStock - currentStock
        }
      }

    } catch (error) {
      console.error('Error setting stock:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        data: null
      }
    }
  },

  // Get current stock for a product
  getStock: async (productId) => {
    try {
      // Import productDatabase dynamically to avoid circular dependencies
      const { productDatabase } = await import('../data/userDatabase')
      
      const product = productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          data: null
        }
      }

      const currentStock = parseInt(product.stock || product.quantity || 0)
      
      return {
        success: true,
        data: {
          productId,
          stock: currentStock,
          product: product
        }
      }

    } catch (error) {
      console.error('Error getting stock:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        data: null
      }
    }
  },

  // Check if sufficient stock is available
  checkStockAvailability: async (productId, requestedQuantity) => {
    try {
      // Import productDatabase dynamically to avoid circular dependencies
      const { productDatabase } = await import('../data/userDatabase')
      
      const product = productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          data: null
        }
      }

      const currentStock = parseInt(product.stock || product.quantity || 0)
      const requested = parseInt(requestedQuantity || 0)
      const isAvailable = currentStock >= requested

      return {
        success: true,
        data: {
          productId,
          currentStock,
          requestedQuantity: requested,
          isAvailable,
          shortfall: isAvailable ? 0 : requested - currentStock,
          product: product
        }
      }

    } catch (error) {
      console.error('Error checking stock availability:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        data: null
      }
    }
  }
}

export default realTimeSyncApi
export { realTimeSync }
