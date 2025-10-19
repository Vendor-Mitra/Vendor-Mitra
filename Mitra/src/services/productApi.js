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
    const shouldSeed = (() => {
      if (!saved) return true
      try {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) && parsed.length === 0
      } catch {
        return true
      }
    })()
    if (shouldSeed) {
      // Seed permanent catalog across categories (tied to supplier accounts)
      // Matches the categories shown in the Find Items filters
      const nowIso = new Date().toISOString()
      const seed = [
        // Fruits (supplierId 4: Priya Singh)
        { id: 1, name: 'Apples', price: 120, quantity: 50, stock: 50, unit: 'kg', supplierId: 4, supplierName: 'Priya Singh', supplierRating: 4.5, category: 'fruits', description: 'Fresh crunchy apples from Priya Singh', image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 2, name: 'Bananas', price: 60, quantity: 40, stock: 40, unit: 'dozen', supplierId: 4, supplierName: 'Priya Singh', supplierRating: 4.5, category: 'fruits', description: 'Sweet ripe bananas', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 10, name: 'Oranges', price: 80, quantity: 70, stock: 70, unit: 'kg', supplierId: 4, supplierName: 'Priya Singh', supplierRating: 4.5, category: 'fruits', description: 'Juicy oranges', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 11, name: 'Mangoes', price: 150, quantity: 60, stock: 60, unit: 'kg', supplierId: 4, supplierName: 'Priya Singh', supplierRating: 4.6, category: 'fruits', description: 'Seasonal mangoes', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        // Vegetables (supplierId 2: Sakshi, supplierId 3: Ravi Kumar)
        { id: 3, name: 'Tomatoes', price: 30, quantity: 100, stock: 100, unit: 'kg', supplierId: 2, supplierName: 'Sakshi', supplierRating: 4.7, category: 'vegetables', description: 'Juicy tomatoes from Sakshi', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 4, name: 'Onions', price: 25, quantity: 120, stock: 120, unit: 'kg', supplierId: 3, supplierName: 'Ravi Kumar', supplierRating: 4.4, category: 'vegetables', description: 'Fresh red onions from Ravi Kumar', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 12, name: 'Potatoes', price: 28, quantity: 150, stock: 150, unit: 'kg', supplierId: 2, supplierName: 'Sakshi', supplierRating: 4.7, category: 'vegetables', description: 'Farm potatoes', image: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 13, name: 'Carrots', price: 40, quantity: 90, stock: 90, unit: 'kg', supplierId: 3, supplierName: 'Ravi Kumar', supplierRating: 4.4, category: 'vegetables', description: 'Fresh carrots', image: 'https://images.unsplash.com/photo-1447175008436-170170e0a121?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        // Oils (supplierId 6: Sunita Sharma)
        { id: 5, name: 'Sunflower Oil', price: 150, quantity: 60, stock: 60, unit: 'liter', supplierId: 6, supplierName: 'Sunita Sharma', supplierRating: 4.6, category: 'oils', description: 'Refined sunflower oil', image: 'https://source.unsplash.com/600x400/?sunflower%20oil,bottle', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 14, name: 'Olive Oil', price: 350, quantity: 40, stock: 40, unit: 'liter', supplierId: 6, supplierName: 'Sunita Sharma', supplierRating: 4.6, category: 'oils', description: 'Extra virgin olive oil', image: 'https://source.unsplash.com/600x400/?olive%20oil,bottle', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        // Grains (supplierId 5: Amit Patel)
        { id: 6, name: 'Basmati Rice', price: 90, quantity: 200, stock: 200, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', supplierRating: 4.3, category: 'grains', description: 'Premium basmati rice', image: 'https://images.unsplash.com/photo-1604335399105-a0b0f33e32e3?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 15, name: 'Wheat', price: 45, quantity: 220, stock: 220, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', supplierRating: 4.3, category: 'grains', description: 'Clean wheat grains', image: 'https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        // Grams (Pulses) (supplierId 5: Amit Patel)
        { id: 7, name: 'Chana Dal', price: 85, quantity: 150, stock: 150, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', supplierRating: 4.3, category: 'grams', description: 'Protein-rich chana dal', image: 'https://images.unsplash.com/photo-1601004898875-91e9fbe6f52b?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 16, name: 'Toor Dal', price: 110, quantity: 120, stock: 120, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', supplierRating: 4.3, category: 'grams', description: 'Premium toor dal', image: 'https://images.unsplash.com/photo-1615486364131-1f3f95496536?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        // Flours (supplierId 7: Deepak Joshi)
        { id: 8, name: 'Wheat Flour', price: 55, quantity: 180, stock: 180, unit: 'kg', supplierId: 7, supplierName: 'Deepak Joshi', supplierRating: 4.1, category: 'flours', description: 'Stone-ground wheat flour', image: 'https://images.unsplash.com/photo-1518544801976-3e188ed8a8ff?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 17, name: 'Rice Flour', price: 65, quantity: 100, stock: 100, unit: 'kg', supplierId: 7, supplierName: 'Deepak Joshi', supplierRating: 4.1, category: 'flours', description: 'Finely milled rice flour', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        // Nuts (supplierId 8: Meena Gupta)
        { id: 9, name: 'Almonds', price: 700, quantity: 30, stock: 30, unit: 'kg', supplierId: 8, supplierName: 'Meena Gupta', supplierRating: 4.8, category: 'nuts', description: 'Premium quality almonds', image: 'https://images.unsplash.com/photo-1604908812839-8a99a3dd8c5a?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
        { id: 18, name: 'Cashews', price: 800, quantity: 35, stock: 35, unit: 'kg', supplierId: 8, supplierName: 'Meena Gupta', supplierRating: 4.8, category: 'nuts', description: 'Whole cashew nuts', image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&h=300&fit=crop', isOrganic: true, createdAt: nowIso, updatedAt: nowIso },
      ]
      localStorage.setItem(this.storageKey, JSON.stringify(seed))
    } else {
      // Merge: ensure baseline permanent items exist alongside existing ones
      try {
        const existing = JSON.parse(saved) || []
        const nowIso = new Date().toISOString()
        const baseline = [
          { name: 'Apples', price: 120, quantity: 50, stock: 50, unit: 'kg', supplierId: 4, supplierName: 'Priya Singh', supplierRating: 4.5, category: 'fruits', description: 'Fresh crunchy apples from Priya Singh', image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&h=300&fit=crop', isOrganic: true },
          { name: 'Bananas', price: 60, quantity: 40, stock: 40, unit: 'dozen', supplierId: 4, supplierName: 'Priya Singh', supplierRating: 4.5, category: 'fruits', description: 'Sweet ripe bananas', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop' },
          { name: 'Oranges', price: 80, quantity: 70, stock: 70, unit: 'kg', supplierId: 4, supplierName: 'Priya Singh', supplierRating: 4.5, category: 'fruits', description: 'Juicy oranges', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop', isOrganic: true },
          { name: 'Mangoes', price: 150, quantity: 60, stock: 60, unit: 'kg', supplierId: 4, supplierName: 'Priya Singh', supplierRating: 4.6, category: 'fruits', description: 'Seasonal mangoes', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop' },
          { name: 'Tomatoes', price: 30, quantity: 100, stock: 100, unit: 'kg', supplierId: 2, supplierName: 'Sakshi', supplierRating: 4.7, category: 'vegetables', description: 'Juicy tomatoes from Sakshi', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=300&fit=crop', isOrganic: true },
          { name: 'Onions', price: 25, quantity: 120, stock: 120, unit: 'kg', supplierId: 3, supplierName: 'Ravi Kumar', supplierRating: 4.4, category: 'vegetables', description: 'Fresh red onions from Ravi Kumar', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop' },
          { name: 'Potatoes', price: 28, quantity: 150, stock: 150, unit: 'kg', supplierId: 2, supplierName: 'Sakshi', supplierRating: 4.7, category: 'vegetables', description: 'Farm potatoes', image: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&h=300&fit=crop' },
          { name: 'Carrots', price: 40, quantity: 90, stock: 90, unit: 'kg', supplierId: 3, supplierName: 'Ravi Kumar', supplierRating: 4.4, category: 'vegetables', description: 'Fresh carrots', image: 'https://images.unsplash.com/photo-1447175008436-170170e0a121?w=400&h=300&fit=crop' },
          { name: 'Sunflower Oil', price: 150, quantity: 60, stock: 60, unit: 'liter', supplierId: 6, supplierName: 'Sunita Sharma', supplierRating: 4.6, category: 'oils', description: 'Refined sunflower oil', image: 'https://source.unsplash.com/600x400/?sunflower%20oil,bottle' },
          { name: 'Olive Oil', price: 350, quantity: 40, stock: 40, unit: 'liter', supplierId: 6, supplierName: 'Sunita Sharma', supplierRating: 4.6, category: 'oils', description: 'Extra virgin olive oil', image: 'https://source.unsplash.com/600x400/?olive%20oil,bottle' },
          { name: 'Basmati Rice', price: 90, quantity: 200, stock: 200, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', supplierRating: 4.3, category: 'grains', description: 'Premium basmati rice', image: 'https://images.unsplash.com/photo-1604335399105-a0b0f33e32e3?w=400&h=300&fit=crop', isOrganic: true },
          { name: 'Wheat', price: 45, quantity: 220, stock: 220, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', supplierRating: 4.3, category: 'grains', description: 'Clean wheat grains', image: 'https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?w=400&h=300&fit=crop' },
          { name: 'Chana Dal', price: 85, quantity: 150, stock: 150, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', supplierRating: 4.3, category: 'grams', description: 'Protein-rich chana dal', image: 'https://images.unsplash.com/photo-1601004898875-91e9fbe6f52b?w=400&h=300&fit=crop', isOrganic: true },
          { name: 'Toor Dal', price: 110, quantity: 120, stock: 120, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', supplierRating: 4.3, category: 'grams', description: 'Premium toor dal', image: 'https://images.unsplash.com/photo-1615486364131-1f3f95496536?w=400&h=300&fit=crop' },
          { name: 'Wheat Flour', price: 55, quantity: 180, stock: 180, unit: 'kg', supplierId: 7, supplierName: 'Deepak Joshi', supplierRating: 4.1, category: 'flours', description: 'Stone-ground wheat flour', image: 'https://images.unsplash.com/photo-1518544801976-3e188ed8a8ff?w=400&h=300&fit=crop', isOrganic: true },
          { name: 'Rice Flour', price: 65, quantity: 100, stock: 100, unit: 'kg', supplierId: 7, supplierName: 'Deepak Joshi', supplierRating: 4.1, category: 'flours', description: 'Finely milled rice flour', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop' },
          { name: 'Almonds', price: 700, quantity: 30, stock: 30, unit: 'kg', supplierId: 8, supplierName: 'Meena Gupta', supplierRating: 4.8, category: 'nuts', description: 'Premium quality almonds', image: 'https://images.unsplash.com/photo-1604908812839-8a99a3dd8c5a?w=400&h=300&fit=crop', isOrganic: true },
          { name: 'Cashews', price: 800, quantity: 35, stock: 35, unit: 'kg', supplierId: 8, supplierName: 'Meena Gupta', supplierRating: 4.8, category: 'nuts', description: 'Whole cashew nuts', image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&h=300&fit=crop' },
        ]
        const existsSig = (p) => `${(p.name||'').toLowerCase()}|${p.supplierId}`
        const existingSigs = new Set(existing.map(existsSig))
        let maxId = existing.length > 0 ? Math.max(...existing.map(p => p.id || 0)) : 0
        const toAdd = []
        for (const b of baseline) {
          if (!existingSigs.has(existsSig(b))) {
            toAdd.push({ id: ++maxId, ...b, createdAt: nowIso, updatedAt: nowIso })
          }
        }
        if (toAdd.length > 0) {
          const merged = [...existing, ...toAdd]
          localStorage.setItem(this.storageKey, JSON.stringify(merged))
        }
      } catch (error) {
        console.error('Error merging baseline products:', error)
      }
    }

    // One-time migration: mark some known items as organic if missing
    try {
      const curr = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const organicNames = new Set(['apples','oranges','tomatoes','basmati rice','chana dal','wheat flour'])
      let changed = false
      const updated = curr.map(p => {
        const name = (p.name || '').toLowerCase()
        if (!p.isOrganic && organicNames.has(name)) {
          changed = true
          return { ...p, isOrganic: true, updatedAt: new Date().toISOString() }
        }
        return p
      })
      if (changed) {
        localStorage.setItem(this.storageKey, JSON.stringify(updated))
      }
    } catch {}

    // Purge banned products so they don't appear in Find Items
    try {
      const banned = [
        /\bcarrot(s)?\b/i,
        /\bonion(s)?\b/i,
        /\balmond(s)?\b/i,
        /\bcashew(s)?\b/i,
        /\bchana\s*dal\b/i,
        /\btoor\s*d(al|aal)\b/i,
        /\brice\s*flour\b/i,
        /\bwheat\s*flour\b/i,
      ]
      const current = JSON.parse(localStorage.getItem(this.storageKey) || '[]')
      const filtered = current.filter(p => !banned.some(rx => rx.test((p.name || ''))))
      if (filtered.length !== current.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(filtered))
      }
    } catch {}
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
