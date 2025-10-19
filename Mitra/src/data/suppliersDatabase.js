// Real supplier accounts with login credentials
export const supplierAccounts = [
  {
    id: 'supplier_1',
    name: 'Sakshi Organic Farms',
    email: 'sakshi07@gmail.com',
    password: 'sakshi123',
    phone: '+91 98765 43210',
    businessName: 'Sakshi Fresh Vegetables',
    location: 'Sector 17, Chandigarh',
    coordinates: [30.7889, 76.8195],
    specialization: 'Organic Vegetables',
    fssaiLicense: 'FSSAI-12345678901',
    established: '2019',
    rating: 4.8,
    totalOrders: 1250,
    products: []
  },
  {
    id: 'supplier_2',
    name: 'Ravi Kumar Dairy',
    email: 'ravi.kumar@gmail.com',
    password: 'ravi123',
    phone: '+91 98765 43211',
    businessName: 'Kumar Dairy Products',
    location: 'Sector 22, Chandigarh',
    coordinates: [30.7989, 76.8295],
    specialization: 'Dairy Products',
    fssaiLicense: 'FSSAI-12345678902',
    established: '2017',
    rating: 4.6,
    totalOrders: 980,
    products: []
  },
  {
    id: 'supplier_3',
    name: 'Priya Singh Fruits',
    email: 'priya.singh@gmail.com',
    password: 'priya123',
    phone: '+91 98765 43212',
    businessName: 'Singh Fresh Fruits',
    location: 'Sector 35, Chandigarh',
    coordinates: [30.8249, 76.8555],
    specialization: 'Fresh Fruits',
    fssaiLicense: 'FSSAI-12345678903',
    established: '2020',
    rating: 4.7,
    totalOrders: 750,
    products: []
  },
  {
    id: 'supplier_4',
    name: 'Amit Patel Grains',
    email: 'amit.patel@gmail.com',
    password: 'amit123',
    phone: '+91 98765 43213',
    businessName: 'Patel Grain Store',
    location: 'Industrial Area, Chandigarh',
    coordinates: [30.7509, 76.7815],
    specialization: 'Grains & Pulses',
    fssaiLicense: 'FSSAI-12345678904',
    established: '2015',
    rating: 4.5,
    totalOrders: 1500,
    products: []
  },
  {
    id: 'supplier_5',
    name: 'Sunita Sharma Spices',
    email: 'sunita.sharma@gmail.com',
    password: 'sunita123',
    phone: '+91 98765 43214',
    businessName: 'Sharma Spice House',
    location: 'Sector 43, Chandigarh',
    coordinates: [30.8409, 76.8715],
    specialization: 'Spices & Herbs',
    fssaiLicense: 'FSSAI-12345678905',
    established: '2018',
    rating: 4.9,
    totalOrders: 650,
    products: []
  },
  {
    id: 'supplier_6',
    name: 'Deepak Joshi Poultry',
    email: 'deepak.joshi@gmail.com',
    password: 'deepak123',
    phone: '+91 98765 43215',
    businessName: 'Joshi Poultry Farm',
    location: 'Mohali, Punjab',
    coordinates: [30.7789, 76.8095],
    specialization: 'Poultry & Eggs',
    fssaiLicense: 'FSSAI-12345678906',
    established: '2016',
    rating: 4.4,
    totalOrders: 890,
    products: []
  },
  {
    id: 'supplier_7',
    name: 'Meena Gupta Bakery',
    email: 'meena.gupta@gmail.com',
    password: 'meena123',
    phone: '+91 98765 43216',
    businessName: 'Gupta Fresh Bakery',
    location: 'Sector 26, Chandigarh',
    coordinates: [30.8069, 76.8375],
    specialization: 'Bakery Items',
    fssaiLicense: 'FSSAI-12345678907',
    established: '2021',
    rating: 4.3,
    totalOrders: 420,
    products: []
  }
]

// Get all products from all suppliers for marketplace display
export const getAllSupplierProducts = () => {
  try {
    // Import productDatabase here to avoid circular dependencies
    const { productDatabase } = require('./userDatabase')
    
    // Get products from the dynamic productDatabase (supplier-added products)
    const dynamicProducts = productDatabase.getAllProducts()
    console.log('Dynamic products from productDatabase:', dynamicProducts)
    
    // Get products from static supplier accounts (if any remain)
    const staticProducts = []
    supplierAccounts.forEach(supplier => {
      supplier.products.forEach(product => {
        staticProducts.push({
          ...product,
          supplierId: supplier.id,
          supplierName: supplier.businessName,
          supplierLocation: supplier.location,
          supplierRating: supplier.rating,
          supplierPhone: supplier.phone,
          fssaiVerified: true,
          organic: supplier.specialization.toLowerCase().includes('organic'),
          deliveryTime: '2-4 hours',
          minimumOrder: 100
        })
      })
    })
    
    // Combine both sources, prioritizing dynamic products
    const allProducts = [...dynamicProducts, ...staticProducts]
    console.log('All products combined:', allProducts)
    return allProducts
  } catch (error) {
    console.error('Error in getAllSupplierProducts:', error)
    return []
  }
}

// Get supplier by email for login
export const getSupplierByEmail = (email) => {
  return supplierAccounts.find(supplier => supplier.email === email)
}

// Get supplier by ID
export const getSupplierById = (id) => {
  return supplierAccounts.find(supplier => supplier.id === id)
}

export const generateNearbySuppliers = (userLat, userLng, radius) => {
  const suppliers = []
  
  // Return empty array if radius is 0
  if (radius === 0) {
    return suppliers
  }
  
  // Import productDatabase to get real supplier products
  let realProducts = []
  try {
    const { productDatabase } = require('./userDatabase')
    realProducts = productDatabase.getAllProducts()
  } catch (error) {
    console.warn('Could not load real products:', error)
  }
  
  // Progressive supplier distribution based on radius - start showing from 7km
  const getMaxSuppliersForRadius = (radius) => {
    if (radius < 7) return 0  // No suppliers until 7km
    if (radius === 7) return 1
    if (radius === 8) return 2
    if (radius === 9) return 3
    if (radius === 10) return 5
    if (radius <= 12) return 8
    if (radius <= 15) return 12
    if (radius <= 18) return 16
    if (radius <= 20) return 20
    if (radius <= 22) return 24
    if (radius <= 25) return 30
    return 30 // 25km max
  }
  
  // Helper function to get product emojis
  const getProductEmoji = (productName) => {
    const emojiMap = {
      'Tomatoes': '🍅', 'Onions': '🧅', 'Potatoes': '🥔', 'Carrots': '🥕',
      'Spinach': '🥬', 'Kale': '🥬', 'Lettuce': '🥬', 'Cabbage': '🥬',
      'Apples': '🍎', 'Bananas': '🍌', 'Oranges': '🍊', 'Grapes': '🍇',
      'Milk': '🥛', 'Yogurt': '🥛', 'Cheese': '🧀', 'Butter': '🧈',
      'Rice': '🍚', 'Wheat': '🌾', 'Pulses': '🫘', 'Flour': '🌾',
      'Chicken': '🍗', 'Fish': '🐟', 'Eggs': '🥚', 'Meat': '🥩',
      'Honey': '🍯', 'Jams': '🍯', 'Pickles': '🥒', 'Sauces': '🥫',
      'Ginger': '🫘', 'Garlic': '🧄', 'Coriander': '🌿', 'Mint': '🌱',
      'Nuts': '🥜', 'Dry Fruits': '🍇', 'Seeds': '🌱', 'Oils': '🫗',
      'Bread': '🍞', 'Cakes': '🍰', 'Cookies': '🍪', 'Pastries': '🥐'
    }
    return emojiMap[productName] || '🥬' // Default to leafy green if not found
  }
  
  // Expanded supplier names with more variety
  const supplierNames = [
    'Fresh Farms', 'Green Valley', 'Organic Harvest', 'Farm Direct', 'Local Produce Co.',
    'Nature Fresh', 'Eco Farms', 'Pure Greens', 'Healthy Harvest', 'Garden Fresh',
    'Farm to Table', 'Green Earth', 'Organic Plus', 'Fresh Choice', 'Natural Farms',
    'Veggie Paradise', 'Harvest Hub', 'Fresh Market', 'Organic Oasis', 'Green Grocer',
    'Farm Fresh', 'Village Veggies', 'Organic Corner', 'Fresh & Pure', 'Green Market',
    'Harvest Time', 'Organic World', 'Fresh Daily', 'Green Paradise', 'Farm Market',
    'Veggie Valley', 'Organic Express', 'Fresh Hub', 'Green Corner', 'Harvest Fresh',
    'Organic Market', 'Fresh Paradise', 'Green Harvest', 'Farm Oasis', 'Veggie Hub'
  ]
  
  // More diverse product categories - ACTUAL INDIAN VENDOR PRODUCTS (no tea/coffee)
  const productCategories = [
    ['Tomatoes', 'Onions', 'Potatoes', 'Carrots'],
    ['Spinach', 'Kale', 'Lettuce', 'Cabbage'],
    ['Apples', 'Bananas', 'Oranges', 'Grapes'],
    ['Milk', 'Yogurt', 'Cheese', 'Butter'],
    ['Rice', 'Wheat', 'Pulses', 'Flour'],
    ['Chicken', 'Fish', 'Eggs', 'Meat'],
    ['Honey', 'Jams', 'Pickles', 'Sauces'],
    ['Ginger', 'Garlic', 'Coriander', 'Mint'],
    ['Nuts', 'Dry Fruits', 'Seeds', 'Oils'],
    ['Bread', 'Cakes', 'Cookies', 'Pastries']
  ]
  
  // First, add real suppliers with their actual products from productDatabase
  const realSupplierProducts = {}
  realProducts.forEach(product => {
    if (!realSupplierProducts[product.supplierId]) {
      realSupplierProducts[product.supplierId] = []
    }
    realSupplierProducts[product.supplierId].push({
      name: product.name,
      price: `₹${product.price}/${product.unit || 'kg'}`,
      image: product.image || getProductEmoji(product.name)
    })
  })
  
  // Add real suppliers with their actual products
  supplierAccounts.forEach(supplier => {
    const distance = calculateDistance(userLat, userLng, supplier.coordinates[0], supplier.coordinates[1])
    if (distance <= radius) {
      const supplierProducts = realSupplierProducts[supplier.id] || []
      
      suppliers.push({
        id: supplier.id,
        name: supplier.businessName,
        coordinates: supplier.coordinates,
        distance: distance,
        rating: supplier.rating,
        price: supplierProducts.length > 0 ? supplierProducts[0].price : '₹50/kg',
        products: supplierProducts.length > 0 ? supplierProducts : [
          { name: 'Fresh Produce', price: '₹50/kg', image: getProductEmoji('Fresh Produce') }
        ],
        organic: supplier.specialization.toLowerCase().includes('organic'),
        fssaiVerified: true,
        trustScore: Math.floor(supplier.rating * 20),
        location: supplier.location,
        address: `${supplier.businessName}, ${supplier.location}`,
        lastActive: 'Just now',
        deliveryTime: '2-4 hours',
        minimumOrder: '₹200',
        paymentMethods: ['Cash', 'UPI', 'Card'],
        specialOffers: ['Direct from supplier'],
        supplierType: 'Verified Supplier'
      })
    }
  })
  
  // Generate additional demo suppliers dynamically around the user's location
  // Real Chandigarh area names and approximate coordinates for better location matching
  const chandigarhAreas = [
    { name: 'Sector 1, Chandigarh', lat: 30.7569, lng: 76.7875 },
    { name: 'Sector 2, Chandigarh', lat: 30.7589, lng: 76.7895 },
    { name: 'Sector 3, Chandigarh', lat: 30.7609, lng: 76.7915 },
    { name: 'Sector 4, Chandigarh', lat: 30.7629, lng: 76.7935 },
    { name: 'Sector 5, Chandigarh', lat: 30.7649, lng: 76.7955 },
    { name: 'Sector 6, Chandigarh', lat: 30.7669, lng: 76.7975 },
    { name: 'Sector 7, Chandigarh', lat: 30.7689, lng: 76.7995 },
    { name: 'Sector 8, Chandigarh', lat: 30.7709, lng: 76.8015 },
    { name: 'Sector 9, Chandigarh', lat: 30.7729, lng: 76.8035 },
    { name: 'Sector 10, Chandigarh', lat: 30.7749, lng: 76.8055 },
    { name: 'Sector 11, Chandigarh', lat: 30.7769, lng: 76.8075 },
    { name: 'Sector 12, Chandigarh', lat: 30.7789, lng: 76.8095 },
    { name: 'Sector 13, Chandigarh', lat: 30.7809, lng: 76.8115 },
    { name: 'Sector 14, Chandigarh', lat: 30.7829, lng: 76.8135 },
    { name: 'Sector 15, Chandigarh', lat: 30.7849, lng: 76.8155 },
    { name: 'Sector 16, Chandigarh', lat: 30.7869, lng: 76.8175 },
    { name: 'Sector 17, Chandigarh', lat: 30.7889, lng: 76.8195 },
    { name: 'Sector 18, Chandigarh', lat: 30.7909, lng: 76.8215 },
    { name: 'Sector 19, Chandigarh', lat: 30.7929, lng: 76.8235 },
    { name: 'Sector 20, Chandigarh', lat: 30.7949, lng: 76.8255 },
    { name: 'Sector 21, Chandigarh', lat: 30.7969, lng: 76.8275 },
    { name: 'Sector 22, Chandigarh', lat: 30.7989, lng: 76.8295 },
    { name: 'Sector 23, Chandigarh', lat: 30.8009, lng: 76.8315 },
    { name: 'Sector 24, Chandigarh', lat: 30.8029, lng: 76.8335 },
    { name: 'Sector 25, Chandigarh', lat: 30.8049, lng: 76.8355 },
    { name: 'Sector 26, Chandigarh', lat: 30.8069, lng: 76.8375 },
    { name: 'Sector 27, Chandigarh', lat: 30.8089, lng: 76.8395 },
    { name: 'Sector 28, Chandigarh', lat: 30.8109, lng: 76.8415 },
    { name: 'Sector 29, Chandigarh', lat: 30.8129, lng: 76.8435 },
    { name: 'Sector 30, Chandigarh', lat: 30.8149, lng: 76.8455 },
    { name: 'Sector 31, Chandigarh', lat: 30.8169, lng: 76.8475 },
    { name: 'Sector 32, Chandigarh', lat: 30.8189, lng: 76.8495 },
    { name: 'Sector 33, Chandigarh', lat: 30.8209, lng: 76.8515 },
    { name: 'Sector 34, Chandigarh', lat: 30.8229, lng: 76.8535 },
    { name: 'Sector 35, Chandigarh', lat: 30.8249, lng: 76.8555 },
    { name: 'Sector 36, Chandigarh', lat: 30.8269, lng: 76.8575 },
    { name: 'Sector 37, Chandigarh', lat: 30.8289, lng: 76.8595 },
    { name: 'Sector 38, Chandigarh', lat: 30.8309, lng: 76.8615 },
    { name: 'Sector 39, Chandigarh', lat: 30.8329, lng: 76.8635 },
    { name: 'Sector 40, Chandigarh', lat: 30.8349, lng: 76.8655 },
    { name: 'Sector 41, Chandigarh', lat: 30.8369, lng: 76.8675 },
    { name: 'Sector 42, Chandigarh', lat: 30.8389, lng: 76.8695 },
    { name: 'Sector 43, Chandigarh', lat: 30.8409, lng: 76.8715 },
    { name: 'Sector 44, Chandigarh', lat: 30.8429, lng: 76.8735 },
    { name: 'Sector 45, Chandigarh', lat: 30.8449, lng: 76.8755 },
    { name: 'Sector 46, Chandigarh', lat: 30.8469, lng: 76.8775 },
    { name: 'Sector 47, Chandigarh', lat: 30.8489, lng: 76.8795 },
    { name: 'Industrial Area, Chandigarh', lat: 30.7509, lng: 76.7815 },
    { name: 'Industrial Area Phase 1, Chandigarh', lat: 30.7529, lng: 76.7835 },
    { name: 'Industrial Area Phase 2, Chandigarh', lat: 30.7549, lng: 76.7855 },
    { name: 'Manimajra, Chandigarh', lat: 30.7569, lng: 76.7875 },
    { name: 'Burail, Chandigarh', lat: 30.7589, lng: 76.7895 },
    { name: 'Maloya, Chandigarh', lat: 30.7609, lng: 76.7915 },
    { name: 'Dhanas, Chandigarh', lat: 30.7629, lng: 76.7935 },
    { name: 'Kajheri, Chandigarh', lat: 30.7649, lng: 76.7955 },
    { name: 'Palsora, Chandigarh', lat: 30.7669, lng: 76.7975 },
    { name: 'Hallomajra, Chandigarh', lat: 30.7689, lng: 76.7995 },
    { name: 'Raipur Khurd, Chandigarh', lat: 30.7709, lng: 76.8015 },
    { name: 'Raipur Kalan, Chandigarh', lat: 30.7729, lng: 76.8035 },
    { name: 'Kaimbwala, Chandigarh', lat: 30.7749, lng: 76.8055 },
    { name: 'Kharar, Punjab', lat: 30.7769, lng: 76.8075 },
    { name: 'Mohali, Punjab', lat: 30.7789, lng: 76.8095 },
    { name: 'Panchkula, Haryana', lat: 30.7809, lng: 76.8115 },
    { name: 'Zirakpur, Punjab', lat: 30.7829, lng: 76.8135 },
    { name: 'Dera Bassi, Punjab', lat: 30.7849, lng: 76.8155 },
    { name: 'Banur, Punjab', lat: 30.7869, lng: 76.8175 },
    { name: 'Kurali, Punjab', lat: 30.7889, lng: 76.8195 },
    { name: 'Morinda, Punjab', lat: 30.7909, lng: 76.8215 },
    { name: 'Pinjore, Haryana', lat: 30.7929, lng: 76.8235 },
    { name: 'Barwala, Haryana', lat: 30.7949, lng: 76.8255 }
  ]
  
  // Create all potential suppliers first, then filter by distance and limit by radius
  const allPotentialSuppliers = []
  
  // Generate demo suppliers with varying distances (50 total for progressive loading)
  for (let i = 0; i < 50; i++) {
    // Use real Chandigarh area coordinates with varying distances
    const area = chandigarhAreas[i % chandigarhAreas.length]
    
    // Create suppliers starting from 7km distance range
    let distanceMultiplier
    if (i < 5) {
      // Start at 7km distance (first suppliers)
      distanceMultiplier = 0.063  // ~7km
    } else if (i < 15) {
      // 7-10km suppliers
      distanceMultiplier = 0.090  // ~10km
    } else if (i < 25) {
      // 10-15km suppliers
      distanceMultiplier = 0.135  // ~15km
    } else if (i < 35) {
      // 15-20km suppliers
      distanceMultiplier = 0.180  // ~20km
    } else {
      // 20-25km suppliers
      distanceMultiplier = 0.225  // ~25km
    }
    
    // Calculate coordinates to place suppliers at specific distances from user
    const angle = Math.random() * 2 * Math.PI
    const targetDistance = 7 + (i / 50) * 18 // Distribute from 7km to 25km
    
    // Convert distance to lat/lng offset (approximate)
    const latOffset = (targetDistance / 111) * Math.cos(angle) // 1 degree lat ≈ 111km
    const lngOffset = (targetDistance / (111 * Math.cos(userLat * Math.PI / 180))) * Math.sin(angle)
    
    const randomLat = userLat + latOffset + (Math.random() - 0.5) * 0.01 // Small random variation
    const randomLng = userLng + lngOffset + (Math.random() - 0.5) * 0.01
    
    const distance = calculateDistance(userLat, userLng, randomLat, randomLng)
    
    // Add all suppliers to potential list regardless of radius
    {
      // Select random product category
      const productCategory = productCategories[i % productCategories.length]
      
      // Convert product strings to objects with proper format
      const formattedProducts = productCategory.map(productName => ({
        name: productName,
        price: `₹${Math.floor(Math.random() * 50 + 20)}/kg`,
        image: getProductEmoji(productName)
      }))
      
      // Generate more realistic pricing
      const basePrice = Math.floor(Math.random() * 100 + 20)
      const priceUnit = ['kg', 'dozen', 'pack', 'bundle', 'piece'][Math.floor(Math.random() * 5)]
      
      // Generate more realistic ratings
      const rating = (Math.random() * 2 + 3).toFixed(1)
      
      // Generate more realistic trust scores
      const trustScore = Math.floor(Math.random() * 30 + 65)
      
      // Generate more realistic last active times
      const lastActiveOptions = [
        'Just now', '5 minutes ago', '15 minutes ago', '30 minutes ago', 
        '1 hour ago', '2 hours ago', '3 hours ago', '4 hours ago', 
        '6 hours ago', '8 hours ago', '12 hours ago', '1 day ago'
      ]
      const lastActive = lastActiveOptions[Math.floor(Math.random() * lastActiveOptions.length)]
      
      // Use real Chandigarh area names
      const locationName = area.name
      
      // Generate more realistic addresses
      const streetNames = [
        'Main Road', 'Station Road', 'Market Street', 'Gandhi Road', 'Nehru Marg',
        'Church Street', 'Temple Road', 'School Lane', 'Hospital Road', 'Park Street',
        'Railway Road', 'Bus Stand Road', 'Police Station Road', 'Post Office Road',
        'Bank Street', 'College Road', 'University Road', 'Airport Road', 'Harbor Road'
      ]
      const streetName = streetNames[Math.floor(Math.random() * streetNames.length)]
      const buildingNumber = Math.floor(Math.random() * 999 + 1)
      
      allPotentialSuppliers.push({
        id: `demo_${i + 1}`,
        name: `${supplierNames[i]} (Demo Supplier)`,
        coordinates: [randomLat, randomLng],
        distance: distance,
        rating: rating,
        price: `₹${basePrice}/${priceUnit}`,
        products: formattedProducts,
        organic: Math.random() > 0.4, // 60% chance of being organic
        fssaiVerified: Math.random() > 0.2, // 80% chance of being FSSAI verified
        trustScore: trustScore,
        location: locationName,
        address: `${buildingNumber}, ${streetName}, ${locationName} - ${Math.floor(distance * 1000)}m from your location`,
        lastActive: lastActive,
        // Additional demo fields
        deliveryTime: `${Math.floor(Math.random() * 3 + 1)}-${Math.floor(Math.random() * 2 + 4)} hours`,
        minimumOrder: `₹${Math.floor(Math.random() * 200 + 100)}`,
        paymentMethods: ['Cash', 'UPI', 'Card'][Math.floor(Math.random() * 3)],
        specialOffers: Math.random() > 0.6 ? ['10% off on first order', 'Free delivery above ₹500'][Math.floor(Math.random() * 2)] : [],
        supplierType: ['Individual Farmer', 'Cooperative', 'Wholesaler', 'Retailer'][Math.floor(Math.random() * 4)]
      })
    }
  }
  
  // Filter suppliers by radius and sort by distance
  const filteredSuppliers = allPotentialSuppliers
    .filter(supplier => supplier.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
  
  // Limit number of suppliers based on radius for progressive loading
  const maxSuppliers = getMaxSuppliersForRadius(radius)
  const limitedSuppliers = filteredSuppliers.slice(0, maxSuppliers)
  
  // Add limited suppliers to final list
  suppliers.push(...limitedSuppliers)
  
  return suppliers
}

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export const getRegionFromCoordinates = (lat, lng) => {
  return 'default'
} 