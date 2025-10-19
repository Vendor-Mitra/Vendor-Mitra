// Mock API service for product management
// Simulates REST API calls with localStorage persistence

// Import will be handled dynamically to avoid circular dependencies

class ProductAPI {
  constructor() {
    this.baseUrl = '/api/products' // Mock API base URL
    this.storageKey = 'vendorMitraProducts'
    this.initialize()
  }

  // Initialize products from localStorage
  initialize() {
    const saved = localStorage.getItem(this.storageKey)
    if (!saved) {
      // Add sample products for testing
      const sampleProducts = [
        {
          id: 1,
          name: 'Red Onions',
          price: 30,
          quantity: 75,
          stock: 75,
          unit: 'kg',
          supplierId: 2,
          supplierName: 'Farm Fresh Co',
          supplierRating: 4.2,
          category: 'vegetables',
          description: 'Premium red onions from Farm Fresh Co',
          isOrganic: false,
          image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem(this.storageKey, JSON.stringify(sampleProducts))
    }
  }

  // Simulate API delay
  async delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // GET /api/products - Fetch all products
  async getAllProducts() {
    await this.delay()
    try {
      const products = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      
      // Remove duplicates by ID at the API level
      const uniqueProducts = products.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      )
      
      // Save back the cleaned data
      if (uniqueProducts.length !== products.length) {
        console.log(`Removed ${products.length - uniqueProducts.length} duplicate products from storage`)
        localStorage.setItem(this.storageKey, JSON.stringify(uniqueProducts))
      }
      return {
        success: true,
        data: uniqueProducts,
        message: 'Products fetched successfully'
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Failed to fetch products',
        error: error.message
      }
    }
  }

  // GET /api/products/:id - Fetch product by ID
  async getProductById(id) {
    await this.delay()
    try {
      const products = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const product = products.find(p => p.id === id)
      
      if (product) {
        return {
          success: true,
          data: product,
          message: 'Product fetched successfully'
        }
      } else {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch product',
        error: error.message
      }
    }
  }

  // GET /api/products/supplier/:supplierId - Fetch products by supplier
  async getProductsBySupplier(supplierId) {
    await this.delay()
    try {
      const products = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const supplierProducts = products.filter(p => p.supplierId === supplierId)
      
      return {
        success: true,
        data: supplierProducts,
        message: 'Supplier products fetched successfully'
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Failed to fetch supplier products',
        error: error.message
      }
    }
  }

  // POST /api/products - Create new product
  async createProduct(productData) {
    await this.delay()
    try {
      const products = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      
      // Generate new ID
      const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0
      
      const newProduct = {
        id: maxId + 1,
        ...productData,
        image: productData.image || 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      products.push(newProduct)
      localStorage.setItem(this.storageKey, JSON.stringify(products))

      // Emit real-time sync event
      this.emitProductUpdate('create', newProduct)

      return {
        success: true,
        data: newProduct,
        message: 'Product created successfully'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to create product',
        error: error.message
      }
    }
  }

  // PUT /api/products/:id - Update product
  async updateProduct(id, updates) {
    await this.delay()
    try {
      const products = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const index = products.findIndex(p => p.id === id)
      
      if (index === -1) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      products[index] = {
        ...products[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      localStorage.setItem(this.storageKey, JSON.stringify(products))

      // Emit real-time sync event
      this.emitProductUpdate('update', products[index])

      return {
        success: true,
        data: products[index],
        message: 'Product updated successfully'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to update product',
        error: error.message
      }
    }
  }

  // DELETE /api/products/:id - Delete product
  async deleteProduct(id) {
    await this.delay()
    try {
      const products = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const index = products.findIndex(p => p.id === id)
      
      if (index === -1) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      const deletedProduct = products[index]
      products.splice(index, 1)
      localStorage.setItem(this.storageKey, JSON.stringify(products))

      // Emit real-time sync event with proper ID
      console.log('Emitting delete event for product:', deletedProduct.id)
      this.emitProductUpdate('delete', deletedProduct)

      return {
        success: true,
        data: deletedProduct,
        message: 'Product deleted successfully'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to delete product',
        error: error.message
      }
    }
  }

  // Inventory management methods
  async decreaseStock(productId, quantity) {
    await this.delay()
    try {
      const products = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const index = products.findIndex(p => p.id === productId)
      
      if (index === -1) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      const product = products[index]
      const currentStock = product.stock || product.quantity || 0
      
      if (currentStock < quantity) {
        return {
          success: false,
          data: null,
          message: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`
        }
      }

      const newStock = currentStock - quantity
      products[index] = {
        ...product,
        stock: newStock,
        quantity: newStock,
        updatedAt: new Date().toISOString()
      }

      localStorage.setItem(this.storageKey, JSON.stringify(products))

      // Emit real-time sync event for stock update with newStock in detail
      this.emitProductUpdate('stock_update', { ...products[index], newStock })

      return {
        success: true,
        data: products[index],
        message: `Stock decreased by ${quantity}. New stock: ${newStock}`
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to decrease stock',
        error: error.message
      }
    }
  }

  async increaseStock(productId, quantity) {
    await this.delay()
    try {
      const products = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const index = products.findIndex(p => p.id === productId)
      
      if (index === -1) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      const product = products[index]
      const currentStock = product.stock || product.quantity || 0
      const newStock = currentStock + quantity
      products[index] = {
        ...product,
        stock: newStock,
        quantity: newStock,
        updatedAt: new Date().toISOString()
      }

      localStorage.setItem(this.storageKey, JSON.stringify(products))

      // Emit real-time sync event for stock update with newStock in detail
      this.emitProductUpdate('stock_update', { ...products[index], newStock })

      return {
        success: true,
        data: products[index],
        message: `Stock increased by ${quantity}. New stock: ${newStock}`
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to increase stock',
        error: error.message
      }
    }
  }

  async getAvailableStock(productId) {
    await this.delay()
    try {
      const products = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const product = products.find(p => p.id === productId)
      
      if (product) {
        const stock = product.stock || product.quantity || 0
        return {
          success: true,
          data: { stock },
          message: 'Stock fetched successfully'
        }
      } else {
        return {
          success: false,
          data: { stock: 0 },
          message: 'Product not found'
        }
      }
    } catch (error) {
      return {
        success: false,
        data: { stock: 0 },
        message: 'Failed to fetch stock',
        error: error.message
      }
    }
  }

  // Real-time sync event emission
  emitProductUpdate(action, product) {
    const event = new CustomEvent('productUpdate', {
      detail: {
        action,
        product,
        timestamp: Date.now()
      }
    })
    window.dispatchEvent(event)

    // Also use localStorage for cross-tab sync
    const syncKey = `vendorMitra_sync_product_${Date.now()}`
    localStorage.setItem(syncKey, JSON.stringify({
      action,
      product,
      timestamp: Date.now()
    }))

    // Clean up sync key after delay
    setTimeout(() => {
      localStorage.removeItem(syncKey)
    }, 1000)
  }

  // Subscribe to real-time product updates
  subscribeToUpdates(callback) {
    const handleUpdate = (event) => {
      console.log('ProductAPI subscription received event:', event.detail)
      callback(event.detail)
    }

    const handleStorageUpdate = (event) => {
      if (event.key && event.key.startsWith('vendorMitra_sync_product_')) {
        const data = JSON.parse(event.newValue)
        console.log('ProductAPI storage sync received:', data)
        callback(data)
      }
    }

    window.addEventListener('productUpdate', handleUpdate)
    window.addEventListener('storage', handleStorageUpdate)

    // Return cleanup function
    return () => {
      window.removeEventListener('productUpdate', handleUpdate)
      window.removeEventListener('storage', handleStorageUpdate)
    }
  }
}

// Create singleton instance
const productApi = new ProductAPI()

export default productApi
