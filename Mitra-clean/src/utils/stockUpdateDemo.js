// Stock Update Demo - Working examples of product stock updates after purchase
import { updateProductStockAfterPurchase, batchUpdateStockAfterPurchase, checkPurchaseAvailability } from './purchaseHandler'
import { productDatabase } from '../data/userDatabase'

/**
 * Demo function showing stock updates after purchases
 * This demonstrates the exact functionality requested:
 * - Product A: quantity = 10 → vendor buys 2 → new quantity = 8
 * - Product B: quantity = 20 → vendor buys 5 → new quantity = 15
 */
export const demonstrateStockUpdates = async () => {
  console.log('=== Stock Update Demonstration ===')
  
  // Initialize some test products if they don't exist
  await initializeTestProducts()
  
  console.log('\n1. Initial Stock Levels:')
  const productA = productDatabase.getProductById(1)
  const productB = productDatabase.getProductById(2)
  console.log(`Product A (${productA?.name}): ${productA?.quantity || 0} units`)
  console.log(`Product B (${productB?.name}): ${productB?.quantity || 0} units`)
  
  // Example 1: Product A: quantity = 10 → vendor buys 2 → new quantity = 8
  console.log('\n2. Processing Purchase: Product A - Buy 2 units')
  const purchaseA = await updateProductStockAfterPurchase(1, 2, {
    vendorId: 'vendor_001',
    orderId: 'ORD_DEMO_001'
  })
  
  if (purchaseA.success) {
    console.log(`✅ Success: ${purchaseA.data.productName}`)
    console.log(`   Previous Stock: ${purchaseA.data.previousStock}`)
    console.log(`   Purchased: ${purchaseA.data.purchaseAmount}`)
    console.log(`   New Stock: ${purchaseA.data.newStock}`)
    console.log(`   Calculation: ${purchaseA.data.previousStock} - ${purchaseA.data.purchaseAmount} = ${purchaseA.data.newStock}`)
  } else {
    console.log(`❌ Failed: ${purchaseA.error}`)
  }
  
  // Example 2: Product B: quantity = 20 → vendor buys 5 → new quantity = 15
  console.log('\n3. Processing Purchase: Product B - Buy 5 units')
  const purchaseB = await updateProductStockAfterPurchase(2, 5, {
    vendorId: 'vendor_002',
    orderId: 'ORD_DEMO_002'
  })
  
  if (purchaseB.success) {
    console.log(`✅ Success: ${purchaseB.data.productName}`)
    console.log(`   Previous Stock: ${purchaseB.data.previousStock}`)
    console.log(`   Purchased: ${purchaseB.data.purchaseAmount}`)
    console.log(`   New Stock: ${purchaseB.data.newStock}`)
    console.log(`   Calculation: ${purchaseB.data.previousStock} - ${purchaseB.data.purchaseAmount} = ${purchaseB.data.newStock}`)
  } else {
    console.log(`❌ Failed: ${purchaseB.error}`)
  }
  
  // Example 3: Test negative stock prevention
  console.log('\n4. Testing Negative Stock Prevention: Try to buy 100 units from Product A')
  const purchaseExcessive = await updateProductStockAfterPurchase(1, 100, {
    vendorId: 'vendor_003',
    orderId: 'ORD_DEMO_003'
  })
  
  if (purchaseExcessive.success) {
    console.log(`✅ Purchase completed`)
  } else {
    console.log(`❌ Purchase rejected: ${purchaseExcessive.error}`)
    if (purchaseExcessive.data) {
      console.log(`   Available: ${purchaseExcessive.data.availableStock}`)
      console.log(`   Requested: ${purchaseExcessive.data.requestedAmount}`)
      console.log(`   Shortfall: ${purchaseExcessive.data.shortfall}`)
    }
  }
  
  // Example 4: Batch purchase
  console.log('\n5. Batch Purchase: Multiple products at once')
  const batchPurchase = await batchUpdateStockAfterPurchase([
    { productId: 1, amount: 1 },
    { productId: 2, amount: 2 }
  ], {
    vendorId: 'vendor_batch',
    orderId: 'ORD_BATCH_001'
  })
  
  console.log(`Batch Purchase Result: ${batchPurchase.success ? 'SUCCESS' : 'FAILED'}`)
  console.log(`Total: ${batchPurchase.summary.total}, Successful: ${batchPurchase.summary.successful}, Failed: ${batchPurchase.summary.failed}`)
  
  batchPurchase.results.forEach((result, index) => {
    if (result.success) {
      console.log(`  Product ${result.productId}: ${result.data.previousStock} → ${result.data.newStock} (-${result.data.purchaseAmount})`)
    } else {
      console.log(`  Product ${result.productId}: FAILED - ${result.error}`)
    }
  })
  
  // Final stock levels
  console.log('\n6. Final Stock Levels:')
  const finalProductA = productDatabase.getProductById(1)
  const finalProductB = productDatabase.getProductById(2)
  console.log(`Product A (${finalProductA?.name}): ${finalProductA?.quantity || 0} units`)
  console.log(`Product B (${finalProductB?.name}): ${finalProductB?.quantity || 0} units`)
  
  return {
    purchaseA,
    purchaseB,
    purchaseExcessive,
    batchPurchase
  }
}

/**
 * Initialize test products for demonstration
 */
const initializeTestProducts = async () => {
  // Check if products already exist
  let productA = productDatabase.getProductById(1)
  let productB = productDatabase.getProductById(2)
  
  // Create Product A if it doesn't exist
  if (!productA) {
    productA = productDatabase.addProduct({
      name: 'Fresh Tomatoes',
      price: 40,
      quantity: 10,
      stock: 10,
      unit: 'kg',
      supplierId: 1,
      supplierName: 'Green Valley Farms',
      category: 'vegetables',
      description: 'Fresh organic tomatoes',
      isOrganic: true
    })
  } else {
    // Reset to initial quantity for demo
    productDatabase.updateProduct(1, { quantity: 10, stock: 10 })
  }
  
  // Create Product B if it doesn't exist
  if (!productB) {
    productB = productDatabase.addProduct({
      name: 'Red Onions',
      price: 30,
      quantity: 20,
      stock: 20,
      unit: 'kg',
      supplierId: 2,
      supplierName: 'Farm Fresh Co',
      category: 'vegetables',
      description: 'Premium red onions',
      isOrganic: false
    })
  } else {
    // Reset to initial quantity for demo
    productDatabase.updateProduct(2, { quantity: 20, stock: 20 })
  }
}

/**
 * Real-world purchase simulation
 * Simulates actual vendor purchases with realistic scenarios
 */
export const simulateRealPurchases = async () => {
  console.log('\n=== Real-World Purchase Simulation ===')
  
  const scenarios = [
    { productId: 1, amount: 3, vendor: 'Restaurant A', description: 'Restaurant buying tomatoes for daily menu' },
    { productId: 2, amount: 8, vendor: 'Grocery Store B', description: 'Bulk purchase of onions' },
    { productId: 1, amount: 2, vendor: 'Cafe C', description: 'Small cafe buying tomatoes' },
    { productId: 2, amount: 15, vendor: 'Hotel D', description: 'Large hotel kitchen order' }
  ]
  
  for (const scenario of scenarios) {
    console.log(`\n${scenario.description}:`)
    
    // Check availability first
    const availability = checkPurchaseAvailability(scenario.productId, scenario.amount)
    console.log(`  Available: ${availability.available ? 'YES' : 'NO'} (Stock: ${availability.currentStock}, Requested: ${availability.requestedAmount})`)
    
    if (availability.available) {
      const result = await updateProductStockAfterPurchase(scenario.productId, scenario.amount, {
        vendorId: scenario.vendor.toLowerCase().replace(' ', '_'),
        orderId: `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      })
      
      if (result.success) {
        console.log(`  ✅ Purchase completed: ${result.data.previousStock} → ${result.data.newStock} units`)
      } else {
        console.log(`  ❌ Purchase failed: ${result.error}`)
      }
    } else {
      console.log(`  ❌ Purchase rejected: ${availability.error || 'Insufficient stock'}`)
    }
  }
}

// Export for use in components
export default demonstrateStockUpdates
