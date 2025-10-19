// Comprehensive Stock Management System
// Handles all stock operations with real-time synchronization

import realTimeSync from './realTimeSync'

class StockManager {
  constructor() {
    this.productDatabase = null
    this.initialized = false
  }

  // Initialize the stock manager with product database
  async initialize() {
    if (!this.initialized) {
      try {
        const { productDatabase } = await import('../data/userDatabase')
        this.productDatabase = productDatabase
        this.initialized = true
      } catch (error) {
        console.error('Failed to initialize StockManager:', error)
        throw error
      }
    }
  }

  // Ensure initialization before any operation
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  // Purchase operation - decreases stock
  async purchase(productId, quantity, options = {}) {
    await this.ensureInitialized()
    
    try {
      const product = this.productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        }
      }

      const currentStock = this.getCurrentStock(product)
      const purchaseQuantity = this.validateQuantity(quantity)

      if (purchaseQuantity <= 0) {
        return {
          success: false,
          error: 'Invalid purchase quantity',
          code: 'INVALID_QUANTITY'
        }
      }

      if (currentStock < purchaseQuantity) {
        return {
          success: false,
          error: `Insufficient stock. Available: ${currentStock}${product.unit || 'units'}, Requested: ${purchaseQuantity}${product.unit || 'units'}`,
          code: 'INSUFFICIENT_STOCK',
          data: { 
            availableStock: currentStock,
            requestedQuantity: purchaseQuantity,
            shortfall: purchaseQuantity - currentStock
          }
        }
      }

      const newStock = currentStock - purchaseQuantity
      const result = await this.updateProductStock(product, newStock, {
        action: 'purchase',
        quantityChanged: -purchaseQuantity,
        ...options
      })

      if (result.success) {
        // Log the purchase for analytics
        this.logStockTransaction({
          type: 'purchase',
          productId,
          productName: product.name,
          previousStock: currentStock,
          newStock,
          quantityChanged: -purchaseQuantity,
          vendorId: options.vendorId,
          orderId: options.orderId,
          timestamp: new Date().toISOString()
        })
      }

      return result
    } catch (error) {
      console.error('Error in purchase operation:', error)
      return {
        success: false,
        error: error.message || 'Purchase operation failed',
        code: 'PURCHASE_ERROR'
      }
    }
  }

  // Restock operation - increases stock
  async restock(productId, quantity, options = {}) {
    await this.ensureInitialized()
    
    try {
      const product = this.productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        }
      }

      const currentStock = this.getCurrentStock(product)
      const restockQuantity = this.validateQuantity(quantity)

      if (restockQuantity <= 0) {
        return {
          success: false,
          error: 'Invalid restock quantity',
          code: 'INVALID_QUANTITY'
        }
      }

      const newStock = currentStock + restockQuantity
      const result = await this.updateProductStock(product, newStock, {
        action: 'restock',
        quantityChanged: restockQuantity,
        ...options
      })

      if (result.success) {
        // Log the restock for analytics
        this.logStockTransaction({
          type: 'restock',
          productId,
          productName: product.name,
          previousStock: currentStock,
          newStock,
          quantityChanged: restockQuantity,
          supplierId: options.supplierId,
          timestamp: new Date().toISOString()
        })
      }

      return result
    } catch (error) {
      console.error('Error in restock operation:', error)
      return {
        success: false,
        error: error.message || 'Restock operation failed',
        code: 'RESTOCK_ERROR'
      }
    }
  }

  // Set stock to a specific value
  async setStock(productId, newStockValue, options = {}) {
    await this.ensureInitialized()
    
    try {
      const product = this.productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        }
      }

      const currentStock = this.getCurrentStock(product)
      const newStock = Math.max(0, this.validateQuantity(newStockValue))
      const quantityChanged = newStock - currentStock

      const result = await this.updateProductStock(product, newStock, {
        action: 'update',
        quantityChanged,
        ...options
      })

      if (result.success) {
        // Log the stock update for analytics
        this.logStockTransaction({
          type: 'update',
          productId,
          productName: product.name,
          previousStock: currentStock,
          newStock,
          quantityChanged,
          supplierId: options.supplierId,
          timestamp: new Date().toISOString()
        })
      }

      return result
    } catch (error) {
      console.error('Error in setStock operation:', error)
      return {
        success: false,
        error: error.message || 'Set stock operation failed',
        code: 'SET_STOCK_ERROR'
      }
    }
  }

  // Check stock availability
  async checkAvailability(productId, requestedQuantity) {
    await this.ensureInitialized()
    
    try {
      const product = this.productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        }
      }

      const currentStock = this.getCurrentStock(product)
      const requested = this.validateQuantity(requestedQuantity)
      const isAvailable = currentStock >= requested

      return {
        success: true,
        data: {
          productId,
          productName: product.name,
          currentStock,
          requestedQuantity: requested,
          isAvailable,
          shortfall: isAvailable ? 0 : requested - currentStock,
          stockStatus: this.getStockStatus(currentStock, product),
          unit: product.unit || 'units'
        }
      }
    } catch (error) {
      console.error('Error checking stock availability:', error)
      return {
        success: false,
        error: error.message || 'Stock availability check failed',
        code: 'AVAILABILITY_CHECK_ERROR'
      }
    }
  }

  // Get current stock for a product
  async getStock(productId) {
    await this.ensureInitialized()
    
    try {
      const product = this.productDatabase.getProductById(productId)
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        }
      }

      const currentStock = this.getCurrentStock(product)
      
      return {
        success: true,
        data: {
          productId,
          productName: product.name,
          stock: currentStock,
          stockStatus: this.getStockStatus(currentStock, product),
          unit: product.unit || 'units',
          lastUpdated: product.updatedAt || product.createdAt
        }
      }
    } catch (error) {
      console.error('Error getting stock:', error)
      return {
        success: false,
        error: error.message || 'Get stock operation failed',
        code: 'GET_STOCK_ERROR'
      }
    }
  }

  // Batch operations for multiple products
  async batchPurchase(purchases) {
    const results = []
    
    for (const purchase of purchases) {
      const result = await this.purchase(
        purchase.productId, 
        purchase.quantity, 
        purchase.options || {}
      )
      results.push({
        productId: purchase.productId,
        ...result
      })
    }
    
    return {
      success: results.every(r => r.success),
      results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    }
  }

  // Helper methods
  getCurrentStock(product) {
    return parseInt(product.stock || product.quantity || 0)
  }

  validateQuantity(quantity) {
    const num = parseInt(quantity)
    return isNaN(num) ? 0 : Math.max(0, num)
  }

  getStockStatus(stock, product) {
    const lowStockThreshold = product.lowStockThreshold || 10
    const outOfStockThreshold = product.outOfStockThreshold || 0
    
    if (stock <= outOfStockThreshold) return 'out_of_stock'
    if (stock <= lowStockThreshold) return 'low_stock'
    return 'in_stock'
  }

  async updateProductStock(product, newStock, options = {}) {
    try {
      const updatedProduct = {
        ...product,
        stock: newStock,
        quantity: newStock, // Support both fields
        updatedAt: new Date().toISOString(),
        lastStockUpdate: new Date().toISOString()
      }

      const updateResult = this.productDatabase.updateProduct(product.id, updatedProduct)
      if (!updateResult) {
        return {
          success: false,
          error: 'Failed to update product in database',
          code: 'DATABASE_UPDATE_ERROR'
        }
      }

      // Emit real-time stock update
      realTimeSync.emitStockUpdate(options.action || 'update', {
        productId: product.id,
        productName: product.name,
        previousStock: this.getCurrentStock(product),
        newStock,
        quantityChanged: options.quantityChanged || 0,
        product: updatedProduct,
        vendorId: options.vendorId,
        supplierId: options.supplierId,
        orderId: options.orderId,
        timestamp: Date.now()
      })

      return {
        success: true,
        data: {
          product: updatedProduct,
          previousStock: this.getCurrentStock(product),
          newStock,
          quantityChanged: options.quantityChanged || 0
        }
      }
    } catch (error) {
      console.error('Error updating product stock:', error)
      return {
        success: false,
        error: error.message || 'Failed to update product stock',
        code: 'UPDATE_ERROR'
      }
    }
  }

  logStockTransaction(transaction) {
    try {
      // Store transaction log in localStorage for analytics
      const logs = JSON.parse(localStorage.getItem('vendorMitraStockLogs') || '[]')
      logs.push(transaction)
      
      // Keep only last 1000 transactions to prevent storage bloat
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000)
      }
      
      localStorage.setItem('vendorMitraStockLogs', JSON.stringify(logs))
      console.log('Stock transaction logged:', transaction)
    } catch (error) {
      console.warn('Failed to log stock transaction:', error)
    }
  }

  // Get stock transaction history
  getStockHistory(productId = null, limit = 100) {
    try {
      const logs = JSON.parse(localStorage.getItem('vendorMitraStockLogs') || '[]')
      let filteredLogs = logs
      
      if (productId) {
        filteredLogs = logs.filter(log => log.productId === productId)
      }
      
      return filteredLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting stock history:', error)
      return []
    }
  }
}

// Create singleton instance
const stockManager = new StockManager()

// Export both the class and the singleton instance
export default stockManager
export { StockManager }
