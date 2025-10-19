// User Database with predefined credentials
export const users = [
  {
    id: 1,
    name: 'Manya',
    email: 'manya@gmail.com',
    phone: '1234567890',
    password: 'manya123',
    userType: 'vendor',
    type: 'vendor',
    trustScore: 85,
    fssaiVerified: true,
    location: 'Mumbai'
  },
  {
    id: 2,
    name: 'Sakshi',
    email: 'sakshi07@gmail.com',
    phone: '0987654321',
    password: 'sakshi123',
    userType: 'supplier',
    type: 'supplier',
    trustScore: 92,
    fssaiVerified: true,
    location: 'Navi Mumbai'
  }
]

// Load registered users from localStorage
const loadRegisteredUsers = () => {
  const savedUsers = localStorage.getItem('vendorMitraUsers')
  if (savedUsers) {
    try {
      const loadedUsers = JSON.parse(savedUsers)
      // Add loaded users to the users array, avoiding duplicates
      loadedUsers.forEach(savedUser => {
        if (!users.find(u => u.email === savedUser.email)) {
          users.push(savedUser)
        }
      })
      console.log('Loaded registered users from localStorage:', loadedUsers.length)
    } catch (error) {
      console.error('Error loading users from localStorage:', error)
    }
  }
}

// Load users immediately
loadRegisteredUsers()

// Add more fake suppliers
users.push(
  {
    id: 3,
    name: 'Ravi Kumar',
    email: 'ravi.kumar@gmail.com',
    phone: '9876543210',
    password: 'ravi123',
    userType: 'supplier',
    type: 'supplier',
    trustScore: 80,
    fssaiVerified: true,
    location: 'Delhi'
  },
  {
    id: 4,
    name: 'Priya Singh',
    email: 'priya.singh@gmail.com',
    phone: '9123456780',
    password: 'priya123',
    userType: 'supplier',
    type: 'supplier',
    trustScore: 88,
    fssaiVerified: true,
    location: 'Bangalore'
  },
  {
    id: 5,
    name: 'Amit Patel',
    email: 'amit.patel@gmail.com',
    phone: '9988776655',
    password: 'amit123',
    userType: 'supplier',
    type: 'supplier',
    trustScore: 75,
    fssaiVerified: false,
    location: 'Ahmedabad'
  }
)

// Add new suppliers
users.push(
  {
    id: 6,
    name: 'Sunita Sharma',
    email: 'sunita.sharma@gmail.com',
    phone: '9001112233',
    password: 'sunita123',
    userType: 'supplier',
    type: 'supplier',
    trustScore: 90,
    fssaiVerified: true,
    location: 'Pune'
  },
  {
    id: 7,
    name: 'Deepak Joshi',
    email: 'deepak.joshi@gmail.com',
    phone: '9002223344',
    password: 'deepak123',
    userType: 'supplier',
    type: 'supplier',
    trustScore: 82,
    fssaiVerified: false,
    location: 'Chennai'
  },
  {
    id: 8,
    name: 'Meena Gupta',
    email: 'meena.gupta@gmail.com',
    phone: '9003334455',
    password: 'meena123',
    userType: 'supplier',
    type: 'supplier',
    trustScore: 87,
    fssaiVerified: true,
    location: 'Hyderabad'
  }
)

// Reviews Database
export const reviewsDatabase = {
  reviews: [],

  // Reviews CRUD operations
  addReview: (review) => {
    const newReview = {
      id: Date.now(),
      ...review,
      date: new Date().toISOString().split('T')[0],
      status: 'published'
    }
    reviewsDatabase.reviews.push(newReview)
    
    // Save to localStorage
    localStorage.setItem('vendorMitraReviews', JSON.stringify(reviewsDatabase.reviews))
    
    // Emit real-time sync event
    realTimeSync.emitReviewUpdate('add', newReview)
    
    return newReview
  },

  updateReview: (id, updates) => {
    const index = reviewsDatabase.reviews.findIndex(r => r.id === id)
    if (index !== -1) {
      reviewsDatabase.reviews[index] = { ...reviewsDatabase.reviews[index], ...updates }
      
      // Save to localStorage
      localStorage.setItem('vendorMitraReviews', JSON.stringify(reviewsDatabase.reviews))
      
      // Emit real-time sync event
      realTimeSync.emitReviewUpdate('update', reviewsDatabase.reviews[index])
      
      return reviewsDatabase.reviews[index]
    }
    return null
  },

  deleteReview: (id) => {
    const index = reviewsDatabase.reviews.findIndex(r => r.id === id)
    if (index !== -1) {
      reviewsDatabase.reviews.splice(index, 1)
      
      // Save to localStorage
      localStorage.setItem('vendorMitraReviews', JSON.stringify(reviewsDatabase.reviews))
      
      return true
    }
    return false
  },

  getReviewsBySupplier: (supplierId) => {
    return reviewsDatabase.reviews.filter(r => Number(r.supplierId) === Number(supplierId))
  },

  getReviewsByProduct: (productId) => {
    return reviewsDatabase.reviews.filter(r => r.productId === productId)
  },

  getAllReviews: () => {
    return reviewsDatabase.reviews
  },

  // Load reviews from localStorage on initialization
  initialize: () => {
    // Clear any fake/pre-populated reviews on first load
    const hasCleared = localStorage.getItem('vendorMitraReviewsCleared')
    if (!hasCleared) {
      console.log('Clearing fake reviews on first initialization...')
      localStorage.removeItem('vendorMitraReviews')
      localStorage.setItem('vendorMitraReviewsCleared', 'true')
      reviewsDatabase.reviews = []
      return
    }
    
    const savedReviews = localStorage.getItem('vendorMitraReviews')
    if (savedReviews) {
      reviewsDatabase.reviews = JSON.parse(savedReviews)
    }
  }
}

// Flash Sales Database
export const flashSalesDatabase = {
  flashSales: [],
  initialized: false,

  // Flash Sales CRUD operations
  addFlashSale: (flashSale) => {
    const newFlashSale = {
      id: Date.now(),
      ...flashSale,
      sold: 0,
      remainingStock: flashSale.total || flashSale.totalQuantity || 0,
      status: 'active',
      endTime: flashSale.endTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Default 2 hours
      createdAt: new Date().toISOString().split('T')[0]
    }
    flashSalesDatabase.flashSales.push(newFlashSale)
    
    // Save to localStorage
    localStorage.setItem('vendorMitraFlashSales', JSON.stringify(flashSalesDatabase.flashSales))
    
    // Emit real-time sync event
    realTimeSync.emitFlashSaleUpdate('create', newFlashSale)
    
    return newFlashSale
  },

  updateFlashSale: (id, updates) => {
    const index = flashSalesDatabase.flashSales.findIndex(f => f.id === id)
    if (index !== -1) {
      flashSalesDatabase.flashSales[index] = { ...flashSalesDatabase.flashSales[index], ...updates }
      
      // Save to localStorage
      localStorage.setItem('vendorMitraFlashSales', JSON.stringify(flashSalesDatabase.flashSales))
      
      // Emit real-time sync event
      realTimeSync.emitFlashSaleUpdate('update', flashSalesDatabase.flashSales[index])
      
      return flashSalesDatabase.flashSales[index]
    }
    return null
  },

  deleteFlashSale: (id) => {
    const index = flashSalesDatabase.flashSales.findIndex(f => f.id === id)
    if (index !== -1) {
      flashSalesDatabase.flashSales.splice(index, 1)
      
      // Save to localStorage
      localStorage.setItem('vendorMitraFlashSales', JSON.stringify(flashSalesDatabase.flashSales))
      
      return true
    }
    return false
  },

  getFlashSalesBySupplier: (supplierId) => {
    return flashSalesDatabase.flashSales.filter(f => f.supplierId === supplierId)
  },

  getAllFlashSales: () => {
    return flashSalesDatabase.flashSales.filter(f => f.status === 'active')
  },

  getFlashSaleById: (id) => {
    return flashSalesDatabase.flashSales.find(f => f.id === id)
  },
  
  // Flash sale inventory management
  decreaseFlashSaleStock: (id, quantity) => {
    console.log('decreaseFlashSaleStock called with:', { id, quantity })
    console.log('Current flashSales array:', flashSalesDatabase.flashSales)
    
    const index = flashSalesDatabase.flashSales.findIndex(f => f.id === id)
    console.log('Found index:', index)
    
    if (index !== -1) {
      const sale = flashSalesDatabase.flashSales[index]
      console.log('Current sale before update:', sale)
      
      const currentRemaining = sale.remainingStock !== undefined ? sale.remainingStock : (sale.total - sale.sold)
      console.log('Current remaining stock:', currentRemaining)
      
      if (currentRemaining < quantity) {
        console.error(`Insufficient flash sale stock. Available: ${currentRemaining}, Requested: ${quantity}`)
        return null
      }
      
      const newSold = sale.sold + quantity
      const newRemaining = sale.total - newSold
      
      console.log('Updating to:', { newSold, newRemaining })
      
      flashSalesDatabase.flashSales[index] = {
        ...sale,
        sold: newSold,
        remainingStock: newRemaining
      }
      
      console.log('Updated sale:', flashSalesDatabase.flashSales[index])
      
      // Save to localStorage
      const dataToSave = JSON.stringify(flashSalesDatabase.flashSales)
      localStorage.setItem('vendorMitraFlashSales', dataToSave)
      console.log('Saved to localStorage:', dataToSave)
      
      // Verify it was saved
      const verification = localStorage.getItem('vendorMitraFlashSales')
      console.log('Verification - Data in localStorage:', verification)
      
      // Emit real-time sync event
      realTimeSync.emitFlashSaleUpdate('stock_update', flashSalesDatabase.flashSales[index])
      
      return flashSalesDatabase.flashSales[index]
    }
    
    console.error('Flash sale not found with id:', id)
    return null
  },

  // Load flash sales from localStorage on initialization
  initialize: () => {
    // Prevent double initialization
    if (flashSalesDatabase.initialized) {
      console.log('Flash sales database already initialized, skipping...')
      return
    }
    
    try {
      console.log('=== INITIALIZING FLASH SALES DATABASE ===')
      const saved = localStorage.getItem('vendorMitraFlashSales')
      console.log('Saved data from localStorage:', saved)
      
      if (saved) {
        const parsedData = JSON.parse(saved)
        console.log('Parsed flash sales:', parsedData)
        flashSalesDatabase.flashSales = parsedData
        
        // DON'T clean up expired sales on initialization - keep them for display
        // The FindSales page will handle filtering for display
        console.log(`Loaded ${flashSalesDatabase.flashSales.length} flash sales from localStorage`)
        console.log('Flash sales after initialization:', flashSalesDatabase.flashSales.map(s => ({
          id: s.id,
          product: s.product,
          sold: s.sold,
          total: s.total
        })))
      } else {
        console.log('No saved flash sales found, initializing empty array')
        flashSalesDatabase.flashSales = []
      }
      
      flashSalesDatabase.initialized = true
      console.log('Flash sales database initialization complete')
    } catch (error) {
      console.error('Error initializing flash sales:', error)
      flashSalesDatabase.flashSales = []
      flashSalesDatabase.initialized = true
    }
  }
}

export const productDatabase = {
  products: [],
  nextId: 1,

  // Product CRUD operations
  addProduct(productData) {
    const newProduct = {
      id: this.nextId++,
      ...productData,
      createdAt: new Date().toISOString()
    }
    this.products.push(newProduct)
    this.saveToStorage()
    
    // Emit real-time sync event
    realTimeSync.emitProductUpdate('add', newProduct)
    
    return newProduct
  },

  updateProduct(id, updates) {
    const index = this.products.findIndex(p => p.id === id)
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updates }
      this.saveToStorage()
      
      // Emit real-time sync event
      realTimeSync.emitProductUpdate('update', this.products[index])
      
      return this.products[index]
    }
    return null
  },

  deleteProduct(id) {
    const index = this.products.findIndex(p => p.id === id)
    if (index !== -1) {
      const deletedProduct = this.products[index]
      this.products.splice(index, 1)
      this.saveToStorage()
      
      // Emit real-time sync event
      realTimeSync.emitProductUpdate('delete', deletedProduct)
      
      return true
    }
    return false
  },

  saveToStorage() {
    localStorage.setItem('vendorMitraProducts', JSON.stringify(this.products))
  },

  getProductById(id) {
    return this.products.find(p => p.id === id)
  },

  getProductsBySupplier(supplierId) {
    return this.products.filter(p => p.supplierId === supplierId)
  },

  getProductsByCategory(category) {
    return this.products.filter(p => p.category === category)
  },

  getAllProducts() {
    return this.products
  },

  // Enhanced inventory management methods
  decreaseStock(productId, quantity) {
    const product = this.getProductById(productId)
    if (!product) {
      console.error(`Product with ID ${productId} not found`)
      return null
    }
    
    const currentStock = product.stock || product.quantity || 0
    if (currentStock < quantity) {
      console.error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`)
      return null
    }
    
    const newStock = Math.max(0, currentStock - quantity)
    const updatedProduct = this.updateProduct(productId, {
      stock: newStock,
      quantity: newStock,
      lastStockUpdate: new Date().toISOString()
    })
    
    console.log(`Stock decreased for ${product.name}: ${currentStock} -> ${newStock} (${quantity} units purchased)`)
    return updatedProduct
  },
  
  increaseStock(productId, quantity) {
    const product = this.getProductById(productId)
    if (!product) {
      console.error(`Product with ID ${productId} not found`)
      return null
    }
    
    const currentStock = product.stock || product.quantity || 0
    const newStock = currentStock + quantity
    const updatedProduct = this.updateProduct(productId, {
      stock: newStock,
      quantity: newStock,
      lastStockUpdate: new Date().toISOString()
    })
    
    console.log(`Stock increased for ${product.name}: ${currentStock} -> ${newStock} (${quantity} units added)`)
    return updatedProduct
  },

  setStock(productId, newStockValue) {
    const product = this.getProductById(productId)
    if (!product) {
      console.error(`Product with ID ${productId} not found`)
      return null
    }
    
    const currentStock = product.stock || product.quantity || 0
    const newStock = Math.max(0, parseInt(newStockValue || 0))
    const updatedProduct = this.updateProduct(productId, {
      stock: newStock,
      quantity: newStock,
      lastStockUpdate: new Date().toISOString()
    })
    
    console.log(`Stock set for ${product.name}: ${currentStock} -> ${newStock}`)
    return updatedProduct
  },
  
  getAvailableStock(productId) {
    const product = this.getProductById(productId)
    if (!product) {
      return 0
    }
    return parseInt(product.stock || product.quantity || 0)
  },

  checkStockAvailability(productId, requestedQuantity) {
    const product = this.getProductById(productId)
    if (!product) {
      return {
        available: false,
        error: 'Product not found'
      }
    }
    
    const currentStock = this.getAvailableStock(productId)
    const requested = parseInt(requestedQuantity || 0)
    
    return {
      available: currentStock >= requested,
      currentStock,
      requestedQuantity: requested,
      shortfall: Math.max(0, requested - currentStock),
      product: product
    }
  },

  getStockStatus(productId) {
    const product = this.getProductById(productId)
    if (!product) {
      return 'unknown'
    }
    
    const stock = this.getAvailableStock(productId)
    const lowStockThreshold = product.lowStockThreshold || 10
    
    if (stock === 0) return 'out_of_stock'
    if (stock <= lowStockThreshold) return 'low_stock'
    return 'in_stock'
  },

  // Batch stock operations
  batchUpdateStock(updates) {
    const results = []
    
    for (const update of updates) {
      try {
        let result = null
        
        switch (update.operation) {
          case 'decrease':
            result = this.decreaseStock(update.productId, update.quantity)
            break
          case 'increase':
            result = this.increaseStock(update.productId, update.quantity)
            break
          case 'set':
            result = this.setStock(update.productId, update.quantity)
            break
          default:
            console.error(`Unknown operation: ${update.operation}`)
        }
        
        results.push({
          productId: update.productId,
          success: result !== null,
          result: result
        })
      } catch (error) {
        results.push({
          productId: update.productId,
          success: false,
          error: error.message
        })
      }
    }
    
    return results
  },
  
  // Load products from localStorage on initialization
  initialize() {
    const savedProducts = localStorage.getItem('vendorMitraProducts')
    if (savedProducts) {
      this.products = JSON.parse(savedProducts)
      this.nextId = Math.max(...this.products.map(p => p.id), 0) + 1
    } else {
      // Seed permanent catalog items across categories (tied to real supplier accounts)
      // These are persisted and will survive reloads and system restarts
      const seed = [
        // Fruits
        { name: 'Apples', price: 120, unit: 'kg', category: 'fruits', stock: 50, quantity: 50, supplierId: 4, supplierName: 'Priya Singh', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop' },
        { name: 'Bananas', price: 60, unit: 'dozen', category: 'fruits', stock: 40, quantity: 40, supplierId: 4, supplierName: 'Priya Singh', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop' },
        // Vegetables
        { name: 'Tomatoes', price: 30, unit: 'kg', category: 'vegetables', stock: 100, quantity: 100, supplierId: 2, supplierName: 'Sakshi', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=300&fit=crop' },
        { name: 'Onions', price: 25, unit: 'kg', category: 'vegetables', stock: 120, quantity: 120, supplierId: 3, supplierName: 'Ravi Kumar', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop' },
        // Oils
        { name: 'Sunflower Oil', price: 150, unit: 'liter', category: 'oils', stock: 60, quantity: 60, supplierId: 6, supplierName: 'Sunita Sharma', image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?w=400&h=300&fit=crop' },
        // Grains
        { name: 'Basmati Rice', price: 90, unit: 'kg', category: 'grains', stock: 200, quantity: 200, supplierId: 5, supplierName: 'Amit Patel', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop' },
        // Grams (Pulses)
        { name: 'Chana Dal', price: 85, unit: 'kg', category: 'grams', stock: 150, quantity: 150, supplierId: 5, supplierName: 'Amit Patel', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop' },
        // Flours
        { name: 'Wheat Flour', price: 55, unit: 'kg', category: 'flours', stock: 180, quantity: 180, supplierId: 7, supplierName: 'Deepak Joshi', image: 'https://images.unsplash.com/photo-1518544801976-3e188ed8a8ff?w=400&h=300&fit=crop' },
        // Nuts
        { name: 'Almonds', price: 700, unit: 'kg', category: 'nuts', stock: 30, quantity: 30, supplierId: 8, supplierName: 'Meena Gupta', image: 'https://images.unsplash.com/photo-1604908812839-8a99a3dd8c5a?w=400&h=300&fit=crop' },
      ]
      let idCounter = 1
      this.products = seed.map(p => ({ id: idCounter++, ...p, createdAt: new Date().toISOString() }))
      this.nextId = idCounter
      this.saveToStorage()
    }
  }
}





// Product database with proper image mapping
export const productImageMap = {
  // Vegetables
  'tomatoes': {
    organic: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  'onions': {
    organic: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  'potatoes': {
    organic: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  'carrots': {
    organic: 'https://images.unsplash.com/photo-1447175008436-170170e0a121?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  'spinach': {
    organic: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  'cabbage': {
    organic: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  'cauliflower': {
    organic: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  'broccoli': {
    organic: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  'cucumber': {
    organic: 'https://images.unsplash.com/photo-1447175008436-170170e0a121?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  'bell peppers': {
    organic: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
  },
  
  // Fruits
  'apples': {
    organic: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop'
  },
  'bananas': {
    organic: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop'
  },
  'oranges': {
    organic: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop'
  },
  'mangoes': {
    organic: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop'
  },
  
  // Grains
  'rice': {
    organic: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop'
  },
  'wheat': {
    organic: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop'
  },
  'pulses': {
    organic: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop'
  },
  
  // Dairy
  'milk': {
    organic: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop'
  },
  'cheese': {
    organic: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop'
  },
  'yogurt': {
    organic: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop',
    nonOrganic: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop'
  }
}

// Function to get appropriate product image
export const getProductImage = (productName, isOrganic = true) => {
  const productKey = productName.toLowerCase().trim()
  const imageType = isOrganic ? 'organic' : 'nonOrganic'
  
  // Check if we have a specific image for this product
  if (productImageMap[productKey]) {
    return productImageMap[productKey][imageType]
  }
  
  // Check for partial matches
  for (const [key, images] of Object.entries(productImageMap)) {
    if (productKey.includes(key) || key.includes(productKey)) {
      return images[imageType]
    }
  }
  
  // Default images based on category
  if (productKey.includes('tomato')) {
    return productImageMap['tomatoes'][imageType]
  } else if (productKey.includes('onion')) {
    return productImageMap['onions'][imageType]
  } else if (productKey.includes('carrot')) {
    return productImageMap['carrots'][imageType]
  } else if (productKey.includes('spinach')) {
    return productImageMap['spinach'][imageType]
  } else if (productKey.includes('rice')) {
    return productImageMap['rice'][imageType]
  } else if (productKey.includes('milk')) {
    return productImageMap['milk'][imageType]
  }
  
  // Fallback to a generic image
  return 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
}

// Shared product database for both vendors and suppliers (legacy - keeping for compatibility)
export const sharedProducts = []

// Flash sales data (legacy - keeping for compatibility)
export const flashSales = []

// Reviews data
export const reviews = []

// Bargain requests
export const bargainRequests = []

// Delivery data
export const deliveries = []

// Bargains Database
export const bargainsDatabase = {
  bargains: [
    // Example:
    // {
    //   id: 1,
    //   productId: 1,
    //   productName: 'Organic Tomatoes',
    //   supplierId: 2,
    //   supplierName: 'Sakshi',
    //   vendorId: 1,
    //   vendorName: 'Manya',
    //   messages: [
    //     { sender: 'vendor', offer: 50, message: 'Can you do 50?', timestamp: '2024-07-27T12:00:00Z' },
    //     { sender: 'supplier', offer: 80, message: 'Best I can do is 80', timestamp: '2024-07-27T12:01:00Z' }
    //   ],
    //   status: 'open'
    // }
  ],

  addBargain: (bargain) => {
    const newBargain = {
      id: Date.now(),
      ...bargain,
      messages: bargain.messages || [],
      // normalized fields for consistent status handling
      status: 'pending',
      vendorAccepted: Boolean(bargain.vendorAccepted) || false,
      supplierAccepted: Boolean(bargain.supplierAccepted) || false,
      finalPrice: typeof bargain.finalPrice === 'number' ? bargain.finalPrice : undefined,
      // single-accept flow fields
      acceptedBy: bargain.acceptedBy || undefined,
      vendorDealDone: Boolean(bargain.vendorDealDone) || false,
      supplierDealDone: Boolean(bargain.supplierDealDone) || false
    }
    bargainsDatabase.bargains.push(newBargain)
    localStorage.setItem('vendorMitraBargains', JSON.stringify(bargainsDatabase.bargains))
    
    // Emit real-time sync event
    realTimeSync.emitBargainUpdate('create', newBargain)
    
    return newBargain
  },

  addMessage: (bargainId, messageObj) => {
    const bargain = bargainsDatabase.bargains.find(b => b.id === bargainId)
    if (bargain) {
      bargain.messages.push({ ...messageObj, timestamp: new Date().toISOString() })
      localStorage.setItem('vendorMitraBargains', JSON.stringify(bargainsDatabase.bargains))
      
      // Emit real-time sync event for message
      realTimeSync.emitBargainUpdate('message', bargain)
      return bargain
    }
    return null
  },

  updateBargain: (id, updates) => {
    const index = bargainsDatabase.bargains.findIndex(b => b.id === id)
    if (index !== -1) {
      bargainsDatabase.bargains[index] = { ...bargainsDatabase.bargains[index], ...updates }
      localStorage.setItem('vendorMitraBargains', JSON.stringify(bargainsDatabase.bargains))
      // Emit real-time sync event for status/field changes
      realTimeSync.emitBargainUpdate('status_change', bargainsDatabase.bargains[index])
      return bargainsDatabase.bargains[index]
    }
    return null
  },

  getBargainsBySupplier: (supplierId) => {
    return bargainsDatabase.bargains.filter(b => b.supplierId === supplierId)
  },

  getBargainsByVendor: (vendorId) => {
    return bargainsDatabase.bargains.filter(b => b.vendorId === vendorId)
  },

  getBargainById: (id) => {
    return bargainsDatabase.bargains.find(b => b.id === id)
  },

  getAllBargains: () => {
    return bargainsDatabase.bargains
  },

  initialize: () => {
    const saved = localStorage.getItem('vendorMitraBargains')
    if (saved) {
      // Backfill older records to normalized shape
      const loaded = JSON.parse(saved)
      bargainsDatabase.bargains = loaded.map(b => ({
        ...b,
        status: b.status === 'open' ? 'pending' : (b.status || 'pending'),
        vendorAccepted: typeof b.vendorAccepted === 'boolean' ? b.vendorAccepted : false,
        supplierAccepted: typeof b.supplierAccepted === 'boolean' ? b.supplierAccepted : false,
        finalPrice: typeof b.finalPrice === 'number' ? b.finalPrice : b.finalPrice,
        acceptedBy: b.acceptedBy || undefined,
        vendorDealDone: typeof b.vendorDealDone === 'boolean' ? b.vendorDealDone : false,
        supplierDealDone: typeof b.supplierDealDone === 'boolean' ? b.supplierDealDone : false
      }))
    }
  }
}

// Collaborative Orders Database
export const collabOrdersDatabase = {
  collabOrders: [],

  addCollabOrder: (order) => {
    const newOrder = {
      id: Date.now(),
      ...order,
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    collabOrdersDatabase.collabOrders.push(newOrder)
    localStorage.setItem('vendorMitraCollabOrders', JSON.stringify(collabOrdersDatabase.collabOrders))
    return newOrder
  },

  updateCollabOrder: (id, updates) => {
    const index = collabOrdersDatabase.collabOrders.findIndex(o => o.id === id)
    if (index !== -1) {
      collabOrdersDatabase.collabOrders[index] = { ...collabOrdersDatabase.collabOrders[index], ...updates }
      localStorage.setItem('vendorMitraCollabOrders', JSON.stringify(collabOrdersDatabase.collabOrders))
      return collabOrdersDatabase.collabOrders[index]
    }
    return null
  },

  deleteCollabOrder: (id) => {
    const index = collabOrdersDatabase.collabOrders.findIndex(o => o.id === id)
    if (index !== -1) {
      collabOrdersDatabase.collabOrders.splice(index, 1)
      localStorage.setItem('vendorMitraCollabOrders', JSON.stringify(collabOrdersDatabase.collabOrders))
      return true
    }
    return false
  },

  getCollabOrdersBySupplier: (supplierId) => {
    return collabOrdersDatabase.collabOrders.filter(o => Number(o.supplierId) === Number(supplierId))
  },

  getCollabOrdersByVendor: (vendorId) => {
    return collabOrdersDatabase.collabOrders.filter(o => o.vendors.some(v => Number(v.vendorId) === Number(vendorId)))
  },

  getAllCollabOrders: () => {
    return collabOrdersDatabase.collabOrders
  },

  initialize: () => {
    const saved = localStorage.getItem('vendorMitraCollabOrders')
    if (saved) {
      collabOrdersDatabase.collabOrders = JSON.parse(saved)
    }
  }
}
collabOrdersDatabase.initialize()

// Authentication functions
export const authenticateUser = (email, password) => {
  const user = users.find(u => u.email === email && u.password === password)
  return user || null
}

// Import supplier accounts for authentication
import { supplierAccounts, getSupplierByEmail } from './suppliersDatabase'
import realTimeSync from '../utils/realTimeSync'

// Enhanced authentication that checks both users and suppliers
export const authenticateUserOrSupplier = (email, password) => {
  // First check regular users
  const user = users.find(u => u.email === email && u.password === password)
  if (user) return user

  // Then check supplier accounts
  const supplier = getSupplierByEmail(email)
  if (supplier && supplier.password === password) {
    return {
      id: supplier.id,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      userType: 'supplier',
      type: 'supplier',
      businessName: supplier.businessName,
      location: supplier.location,
      specialization: supplier.specialization,
      fssaiLicense: supplier.fssaiLicense,
      rating: supplier.rating,
      trustScore: Math.floor(supplier.rating * 20), // Convert rating to trust score
      fssaiVerified: true
    }
  }

  return null
}

export const registerUser = (userData) => {
  const newUser = {
    id: users.length + 1,
    ...userData,
    trustScore: Math.floor(Math.random() * 30) + 70,
    fssaiVerified: Math.random() > 0.5,
    location: userData.location || 'Mumbai'
  }
  users.push(newUser)
  // Save to localStorage so user can login later
  localStorage.setItem('vendorMitraUsers', JSON.stringify(users))
  console.log('User registered and saved:', newUser.email)
  return newUser
}

export const getUserById = (id) => {
  return users.find(user => user.id === id)
}

export const getUserByEmail = (email) => {
  return users.find(user => user.email === email)
}

// Initialize databases when module loads
reviewsDatabase.initialize()
flashSalesDatabase.initialize()
bargainsDatabase.initialize()
productDatabase.initialize()

export const deliveriesDatabase = {
  deliveries: [],

  addDelivery: (delivery) => {
    const newDelivery = {
      id: Date.now(),
      orderId: 'ORD' + Math.floor(1000 + Math.random() * 9000),
      ...delivery,
      // Respect provided dates if present; otherwise, set accurately now
      orderDate: delivery?.orderDate || new Date().toISOString(),
      status: delivery?.status || 'delivered',
      deliveryDate: delivery?.deliveryDate || new Date().toISOString()
    }
    console.log('Adding new delivery:', newDelivery)

    // Strong duplicate guard: prevent inserting the same logical delivery twice
    // Build a signature from stable fields and compare against recent entries
    const productsStr = Array.isArray(newDelivery.products)
      ? newDelivery.products.map(p => (typeof p === 'object' ? `${p.name}:${p.quantity || 1}` : String(p))).join('|')
      : String(newDelivery.products || '')
    const signature = `${newDelivery.supplierId}|${newDelivery.customerId}|${newDelivery.totalAmount}|${productsStr}`
    const nowTs = newDelivery.id
    const existingIdx = deliveriesDatabase.deliveries.findIndex(d => {
      const dProductsStr = Array.isArray(d.products)
        ? d.products.map(p => (typeof p === 'object' ? `${p.name}:${p.quantity || 1}` : String(p))).join('|')
        : String(d.products || '')
      const sig = `${d.supplierId}|${d.customerId}|${d.totalAmount}|${dProductsStr}`
      // Consider duplicates if signature matches and created within 10 seconds
      return sig === signature && Math.abs((d.id || 0) - nowTs) < 10000
    })

    if (existingIdx !== -1) {
      console.log('Duplicate delivery prevented (signature match):', signature)
      // Return the existing delivery instead of inserting a duplicate
      const existing = deliveriesDatabase.deliveries[existingIdx]
      return existing
    }

    deliveriesDatabase.deliveries.push(newDelivery)
    localStorage.setItem('vendorMitraDeliveries', JSON.stringify(deliveriesDatabase.deliveries))
    console.log('Total deliveries after adding:', deliveriesDatabase.deliveries.length)
    // Emit real-time update for supplier dashboards
    try {
      // Emit structured delivery update with vendorId so vendor Profile can refresh immediately
      realTimeSync.emitDeliveryUpdate('create', newDelivery)
    } catch (e) {
      console.warn('Failed to emit delivery_update:', e)
    }
    return newDelivery
  },

  getDeliveriesBySupplier: (supplierId) => {
    const deliveries = deliveriesDatabase.deliveries
      .filter(d => Number(d.supplierId) === Number(supplierId))
      // Newest first by orderDate (fallback id)
      .sort((a, b) => new Date(b.orderDate || b.id).getTime() - new Date(a.orderDate || a.id).getTime())
    console.log('Raw deliveries for supplier', supplierId, ':', deliveries.length, deliveries)
    
    // Remove actual duplicates based on orderId, keeping the latest one
    const uniqueDeliveries = deliveries.reduce((acc, current) => {
      const existing = acc.find(item => item.orderId === current.orderId)
      if (!existing) {
        acc.push(current)
      } else if (current.id > existing.id) {
        // Keep the newer delivery if duplicate orderId found
        const index = acc.indexOf(existing)
        acc[index] = current
      }
      return acc
    }, [])
    
    console.log('Unique deliveries for supplier', supplierId, ':', uniqueDeliveries.length, uniqueDeliveries)
    // Ensure newest first after de-duplication
    return uniqueDeliveries.sort((a, b) => (b.id || 0) - (a.id || 0))
  },

  getDeliveriesByVendor: (vendorId) => {
    const deliveries = deliveriesDatabase.deliveries
      .filter(d => Number(d.customerId) === Number(vendorId))
      // Newest first by orderDate (fallback id)
      .sort((a, b) => new Date(b.orderDate || b.id).getTime() - new Date(a.orderDate || a.id).getTime())
    // Remove actual duplicates based on orderId, keeping the latest one
    const uniqueDeliveries = deliveries.reduce((acc, current) => {
      const existing = acc.find(item => item.orderId === current.orderId)
      if (!existing) {
        acc.push(current)
      } else if (current.id > existing.id) {
        // Keep the newer delivery if duplicate orderId found
        const index = acc.indexOf(existing)
        acc[index] = current
      }
      return acc
    }, [])
    return uniqueDeliveries
  },

  getAllDeliveries: () => {
    return deliveriesDatabase.deliveries
  },

  deleteDelivery: (deliveryId) => {
    const index = deliveriesDatabase.deliveries.findIndex(d => d.id === deliveryId)
    if (index !== -1) {
      deliveriesDatabase.deliveries.splice(index, 1)
      localStorage.setItem('vendorMitraDeliveries', JSON.stringify(deliveriesDatabase.deliveries))
      console.log('Delivery deleted:', deliveryId)
      return true
    }
    return false
  },

  initialize: () => {
    const saved = localStorage.getItem('vendorMitraDeliveries')
    if (saved) {
      deliveriesDatabase.deliveries = JSON.parse(saved)
    }
  }
}

// Initialize deliveries database after definition
deliveriesDatabase.initialize()

// Persistent Categories Database
export const categoriesDatabase = {
  storageKey: 'vendorMitraCategories',
  categories: [],
  defaults: ['Fruits', 'Vegetables', 'Oils', 'Grains', 'Grams', 'Flours', 'Nuts'],
  initialize() {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categories = parsed
          return
        }
      }
    } catch {}
    // Seed defaults if nothing saved
    this.categories = [...this.defaults]
    localStorage.setItem(this.storageKey, JSON.stringify(this.categories))
  },
  getAll() { return [...this.categories] },
  add(name) {
    if (!name) return
    if (!this.categories.includes(name)) {
      this.categories.push(name)
      localStorage.setItem(this.storageKey, JSON.stringify(this.categories))
    }
  },
  remove(name) {
    // Only remove when explicitly called
    this.categories = this.categories.filter(c => c !== name)
    localStorage.setItem(this.storageKey, JSON.stringify(this.categories))
  }
}
categoriesDatabase.initialize()

// Clear all localStorage data to ensure clean slate
export const clearAllData = () => {
  localStorage.removeItem('vendorMitraProducts')
  localStorage.removeItem('vendorMitraFlashSales')
  localStorage.removeItem('vendorMitraReviews')
  localStorage.removeItem('vendorMitraBargains')
  localStorage.removeItem('vendorMitraCollabOrders')
  localStorage.removeItem('vendorMitraDeliveries')
  
  // Reset all databases to empty arrays
  productDatabase.products = []
  flashSalesDatabase.flashSales = []
  reviewsDatabase.reviews = []
  bargainsDatabase.bargains = []
  collabOrdersDatabase.collabOrders = []
  deliveriesDatabase.deliveries = []
  
  console.log('All data cleared successfully')
}

// Clear only product data
export const clearProductData = () => {
  localStorage.removeItem('vendorMitraProducts')
  productDatabase.products = []
  console.log('Product catalog cleared successfully')
}

// Note: All databases are initialized at the top of the file 