// Purchase Handler - Updates product stock after vendor purchases
import { productDatabase, deliveriesDatabase } from '../data/userDatabase'
import realTimeSync from './realTimeSync'

/**
 * Updates product stock after a purchase
 * @param {number} productId - The ID of the product being purchased
 * @param {number} purchasedAmount - The quantity being purchased
 * @param {Object} options - Additional options (vendorId, orderId, etc.)
 * @returns {Object} Result object with success status and updated data
 */
export const updateProductStockAfterPurchase = async (productId, purchasedAmount, options = {}) => {
  try {
    // Input validation
    if (!productId || purchasedAmount <= 0) {
      return {
        success: false,
        error: 'Invalid product ID or purchase amount',
        code: 'INVALID_INPUT'
      }
    }

    // Get the current product from database
    const product = productDatabase.getProductById(productId)
    if (!product) {
      return {
        success: false,
        error: `Product with ID ${productId} not found`,
        code: 'PRODUCT_NOT_FOUND'
      }
    }

    // Get current stock (support both 'quantity' and 'stock' fields)
    const currentStock = parseInt(product.quantity || product.stock || 0)
    const purchaseAmount = parseInt(purchasedAmount)

    console.log(`Processing purchase: Product ${product.name}, Current Stock: ${currentStock}, Purchase Amount: ${purchaseAmount}`)

    // Check if sufficient stock is available
    if (currentStock < purchaseAmount) {
      return {
        success: false,
        error: `Insufficient stock. Available: ${currentStock}, Requested: ${purchaseAmount}`,
        code: 'INSUFFICIENT_STOCK',
        data: {
          productName: product.name,
          availableStock: currentStock,
          requestedAmount: purchaseAmount,
          shortfall: purchaseAmount - currentStock
        }
      }
    }

    // Calculate new stock (ensure it never goes negative)
    const newStock = Math.max(0, currentStock - purchaseAmount)
    
    console.log(`Stock calculation: ${currentStock} - ${purchaseAmount} = ${newStock}`)

    // Update the product in database
    const updatedProduct = {
      ...product,
      quantity: newStock,
      stock: newStock, // Update both fields for compatibility
      availableStock: newStock, // Also update availableStock field
      lastPurchase: {
        amount: purchaseAmount,
        timestamp: new Date().toISOString(),
        vendorId: options.vendorId,
        orderId: options.orderId
      },
      updatedAt: new Date().toISOString()
    }

    // Save to database
    const updateResult = productDatabase.updateProduct(productId, updatedProduct)
    if (!updateResult) {
      return {
        success: false,
        error: 'Failed to update product in database',
        code: 'DATABASE_UPDATE_FAILED'
      }
    }

    // Emit real-time stock update for cross-tab synchronization
    realTimeSync.emitStockUpdate('purchase', {
      productId,
      productName: product.name,
      previousStock: currentStock,
      newStock,
      quantityPurchased: purchaseAmount,
      product: updatedProduct,
      vendorId: options.vendorId,
      orderId: options.orderId,
      timestamp: Date.now()
    })

    // Feature 1: Update supplier deliveries when vendor buys something
    if (options.vendorId && options.deliveryAddress) {
      const deliveryData = {
        customer: options.vendorName || `Vendor ${options.vendorId}`,
        customerId: options.vendorId,
        supplier: product.supplierName || `Supplier ${product.supplierId}`,
        supplierId: product.supplierId,
        products: [{
          id: productId,
          name: product.name,
          quantity: purchaseAmount,
          unit: product.unit || 'kg',
          price: product.price,
          image: product.image
        }],
        totalAmount: product.price * purchaseAmount,
        paymentMethod: options.paymentMethod || 'UPI',
        deliveryAddress: options.deliveryAddress,
        orderDate: new Date().toISOString()
      }
      
      const newDelivery = deliveriesDatabase.addDelivery(deliveryData)
      console.log('Added delivery to supplier dashboard:', newDelivery)
      
      // Feature 2: Update vendor's recent orders in real-time
      realTimeSync.emitOrderUpdate('new_order', {
        vendorId: options.vendorId,
        order: newDelivery
      })
    }

    // Log the transaction
    logPurchaseTransaction({
      productId,
      productName: product.name,
      previousStock: currentStock,
      newStock,
      purchaseAmount,
      vendorId: options.vendorId,
      orderId: options.orderId,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      data: {
        productId,
        productName: product.name,
        previousStock: currentStock,
        newStock,
        purchaseAmount,
        updatedProduct
      }
    }

  } catch (error) {
    console.error('Error updating product stock after purchase:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      code: 'UNEXPECTED_ERROR'
    }
  }
}

/**
 * Batch update multiple products after purchase
 * @param {Array} purchases - Array of {productId, amount} objects
 * @param {Object} options - Additional options
 * @returns {Object} Result with success/failure details for each product
 */
export const batchUpdateStockAfterPurchase = async (purchases, options = {}) => {
  const results = []
  let successCount = 0
  let failureCount = 0

  for (const purchase of purchases) {
    const result = await updateProductStockAfterPurchase(
      purchase.productId, 
      purchase.amount, 
      { ...options, ...purchase.options }
    )
    
    results.push({
      productId: purchase.productId,
      ...result
    })

    if (result.success) {
      successCount++
    } else {
      failureCount++
    }
  }

  return {
    success: failureCount === 0,
    results,
    summary: {
      total: purchases.length,
      successful: successCount,
      failed: failureCount
    }
  }
}

/**
 * Check if purchase is possible before processing
 * @param {number} productId - Product ID
 * @param {number} requestedAmount - Requested purchase amount
 * @returns {Object} Availability check result
 */
export const checkPurchaseAvailability = (productId, requestedAmount) => {
  try {
    const product = productDatabase.getProductById(productId)
    if (!product) {
      return {
        available: false,
        error: 'Product not found'
      }
    }

    const currentStock = parseInt(product.quantity || product.stock || 0)
    const requested = parseInt(requestedAmount || 0)

    return {
      available: currentStock >= requested,
      productName: product.name,
      currentStock,
      requestedAmount: requested,
      shortfall: Math.max(0, requested - currentStock)
    }
  } catch (error) {
    return {
      available: false,
      error: error.message
    }
  }
}

/**
 * Log purchase transaction for audit trail
 * @param {Object} transaction - Transaction details
 */
const logPurchaseTransaction = (transaction) => {
  try {
    const logs = JSON.parse(localStorage.getItem('vendorMitraPurchaseLogs') || '[]')
    logs.push(transaction)
    
    // Keep only last 1000 transactions
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000)
    }
    
    localStorage.setItem('vendorMitraPurchaseLogs', JSON.stringify(logs))
  } catch (error) {
    console.warn('Failed to log purchase transaction:', error)
  }
}

/**
 * Get purchase transaction history
 * @param {number} productId - Optional product ID filter
 * @param {number} limit - Maximum number of records to return
 * @returns {Array} Transaction history
 */
export const getPurchaseHistory = (productId = null, limit = 50) => {
  try {
    const logs = JSON.parse(localStorage.getItem('vendorMitraPurchaseLogs') || '[]')
    let filteredLogs = logs

    if (productId) {
      filteredLogs = logs.filter(log => log.productId === productId)
    }

    return filteredLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  } catch (error) {
    console.error('Error getting purchase history:', error)
    return []
  }
}

// Example usage and test cases
export const runPurchaseExamples = async () => {
  console.log('=== Purchase Handler Examples ===')
  
  // Example 1: Product A: quantity = 10 → vendor buys 2 → new quantity = 8
  console.log('\nExample 1: Normal purchase')
  const result1 = await updateProductStockAfterPurchase(1, 2, {
    vendorId: 'vendor_123',
    orderId: 'ORD_001'
  })
  console.log('Result:', result1)
  
  // Example 2: Product B: quantity = 20 → vendor buys 5 → new quantity = 15
  console.log('\nExample 2: Larger purchase')
  const result2 = await updateProductStockAfterPurchase(2, 5, {
    vendorId: 'vendor_456',
    orderId: 'ORD_002'
  })
  console.log('Result:', result2)
  
  // Example 3: Insufficient stock scenario
  console.log('\nExample 3: Insufficient stock (should fail)')
  const result3 = await updateProductStockAfterPurchase(1, 100, {
    vendorId: 'vendor_789',
    orderId: 'ORD_003'
  })
  console.log('Result:', result3)
  
  // Example 4: Batch purchase
  console.log('\nExample 4: Batch purchase')
  const batchResult = await batchUpdateStockAfterPurchase([
    { productId: 1, amount: 1 },
    { productId: 2, amount: 3 }
  ], {
    vendorId: 'vendor_batch',
    orderId: 'ORD_BATCH'
  })
  console.log('Batch Result:', batchResult)
}

export default updateProductStockAfterPurchase
