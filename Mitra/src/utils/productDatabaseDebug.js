// Product Database Debug Utility
// Use this in browser console to inspect and fix product data

export const debugProductDatabase = () => {
  console.log('=== Product Database Debug ===')
  
  // Check localStorage
  const storageKey = 'vendorMitraProducts'
  const rawData = localStorage.getItem(storageKey)
  
  if (!rawData) {
    console.log('❌ No products found in localStorage')
    return { products: [], count: 0 }
  }
  
  try {
    const products = JSON.parse(rawData)
    console.log(`✅ Found ${products.length} products in localStorage`)
    console.log('Products:', products)
    
    // Check for duplicates
    const ids = products.map(p => p.id)
    const uniqueIds = [...new Set(ids)]
    if (ids.length !== uniqueIds.length) {
      console.log(`⚠️ Found ${ids.length - uniqueIds.length} duplicate products`)
    }
    
    // Show product summary
    products.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name} - ₹${p.price} - Stock: ${p.stock || p.quantity || 0} - Supplier: ${p.supplierName}`)
    })
    
    return { products, count: products.length }
  } catch (error) {
    console.error('❌ Error parsing products:', error)
    return { products: [], count: 0, error }
  }
}

export const exportProducts = () => {
  const storageKey = 'vendorMitraProducts'
  const rawData = localStorage.getItem(storageKey)
  if (rawData) {
    const products = JSON.parse(rawData)
    console.log('Exporting products as JSON:')
    console.log(JSON.stringify(products, null, 2))
    return products
  }
  return []
}

export const importProducts = (productsArray) => {
  const storageKey = 'vendorMitraProducts'
  try {
    // Remove duplicates by ID
    const uniqueProducts = productsArray.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    )
    
    localStorage.setItem(storageKey, JSON.stringify(uniqueProducts))
    console.log(`✅ Imported ${uniqueProducts.length} products successfully`)
    
    // Trigger a page reload to refresh the UI
    window.location.reload()
    return true
  } catch (error) {
    console.error('❌ Error importing products:', error)
    return false
  }
}

export const clearProducts = () => {
  const storageKey = 'vendorMitraProducts'
  localStorage.removeItem(storageKey)
  console.log('✅ Cleared all products from database')
  window.location.reload()
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  window.debugProductDatabase = debugProductDatabase
  window.exportProducts = exportProducts
  window.importProducts = importProducts
  window.clearProducts = clearProducts
}

export default {
  debugProductDatabase,
  exportProducts,
  importProducts,
  clearProducts
}
