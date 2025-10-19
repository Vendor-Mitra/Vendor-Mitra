import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useProducts } from '../contexts/ProductContext'
import { useAuth } from '../contexts/AuthContext'
import { Search, Filter, Store, Star, MapPin, Package, ShoppingCart } from 'lucide-react'
import realTimeSync from '../utils/realTimeSync'
import ReviewSystem from '../components/Rating/ReviewSystem'
import { reviewsDatabase, flashSalesDatabase, deliveriesDatabase, users } from '../data/userDatabase'
import FlashSaleTimer from '../components/FlashSales/FlashSaleTimer'
import BuyNowDialog from '../components/BuyNow/BuyNowDialog'
import { updateProductStockAfterPurchase } from '../utils/purchaseHandler'
import { debugProductDatabase } from '../utils/productDatabaseDebug'

const FindItems = () => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products: allProducts, loading: productsLoading, decreaseStock } = useProducts()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showReviews, setShowReviews] = useState(false)
  const [productReviews, setProductReviews] = useState({})
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(Infinity)
  const [minRating, setMinRating] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [products, setProducts] = useState([])
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false)
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState(null)
  const [purchaseQuantities, setPurchaseQuantities] = useState({})
  const [stockLevels, setStockLevels] = useState({})
  const [buyNowItem, setBuyNowItem] = useState(null)
  const [selectedItemForReview, setSelectedItemForReview] = useState(null)
  const [filterOrganic, setFilterOrganic] = useState('all')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    const loadProducts = () => {
      try {
        // Debug: Check what's in localStorage
        const dbDebug = debugProductDatabase()
        console.log('FindItems: Database contains', dbDebug.count, 'products')
        
        console.log('FindItems: Loading products from context, count:', allProducts?.length || 0)
        if (allProducts && allProducts.length > 0) {
          const buildDesc = (p) => {
            const base = p.description || `Fresh ${p.name} from ${p.supplierName}`
            const cat = (p.category || '').toLowerCase()
            const isFruitVeg = cat === 'fruits' || cat === 'fruit' || cat === 'vegetables' || cat === 'vegetable'
            const supplier = users.find(u => Number(u.id) === Number(p.supplierId))
            const isFssai = Boolean(p.isVerified) || Boolean(supplier?.fssaiVerified)
            const isOrganicCandidate = isFruitVeg || Boolean(p.isOrganic || p.organic)
            if (isOrganicCandidate) {
              return /\borganic\b/i.test(base) ? base : `${base} • Organic`
            }
            if (isFssai) {
              return /fssai\s*verified/i.test(base) ? base : `${base} • FSSAI Verified`
            }
            return base
          }
          let mappedProducts = allProducts.map(product => ({
            id: product.id,
            name: `${product.name} (demo)`,
            price: product.price,
            image: product.image,
            supplier: product.supplierName,
            supplierId: product.supplierId,
            category: product.category ? product.category.toLowerCase() : 'general',
            description: buildDesc(product),
            rating: 0,
            reviews: 0,
            quantity: product.stock || product.quantity || 0,
            availableStock: product.stock || product.quantity || 0,
            unit: product.unit || 'kg',
            isFlashSale: false
          }))
          // Prefer localStorage if it contains more products than context
          try {
            const saved = localStorage.getItem('vendorMitraProducts')
            if (saved) {
              const parsed = JSON.parse(saved)
              if (Array.isArray(parsed) && parsed.length > mappedProducts.length) {
                mappedProducts = parsed.map(product => ({
                  id: product.id,
                  name: `${product.name} (demo)`,
                  price: product.price,
                  image: product.image,
                  supplier: product.supplierName,
                  supplierId: product.supplierId,
                  category: product.category ? product.category.toLowerCase() : 'general',
                  description: buildDesc(product),
                  rating: 0,
                  reviews: 0,
                  quantity: product.stock || product.quantity || 0,
                  availableStock: product.stock || product.quantity || 0,
                  unit: product.unit || 'kg',
                  isFlashSale: false
                }))
                console.log('FindItems: Using larger localStorage dataset instead of context. Count:', mappedProducts.length)
              }
            }
          } catch {}
          mappedProducts = mappedProducts.filter(p => typeof p.image === 'string' && p.image.startsWith('http'))
          console.log('FindItems: Mapped products:', mappedProducts.length)
          console.log('FindItems: Product details:', mappedProducts.map(p => `${p.name} (₹${p.price})`).join(', '))
          setProducts(mappedProducts)
        } else {
          console.log('FindItems: No products available from context; trying localStorage fallback')
          const saved = localStorage.getItem('vendorMitraProducts')
          if (saved) {
            try {
              const parsed = JSON.parse(saved)
              if (Array.isArray(parsed) && parsed.length > 0) {
                const mappedProducts = parsed.map(product => ({
                  id: product.id,
                  name: `${product.name} (demo)`,
                  price: product.price,
                  image: product.image,
                  supplier: product.supplierName,
                  supplierId: product.supplierId,
                  category: product.category ? product.category.toLowerCase() : 'general',
                  description: (() => {
                    const supplier = users.find(u => Number(u.id) === Number(product.supplierId))
                    const isOrganic = Boolean(product.isOrganic)
                    const isFssai = Boolean(product.isVerified) || Boolean(supplier?.fssaiVerified)
                    let base = product.description || `Fresh ${product.name} from ${product.supplierName}`
                    const needOrganic = isOrganic && !/\borganic\b/i.test(base)
                    const needFssai = isFssai && !/fssai\s*verified/i.test(base)
                    const tags = []
                    if (needOrganic) tags.push('Organic')
                    if (needFssai) tags.push('FSSAI Verified')
                    return tags.length ? `${base} • ${tags.join(' • ')}` : base
                  })(),
                  rating: 0,
                  reviews: 0,
                  quantity: product.stock || product.quantity || 0,
                  availableStock: product.stock || product.quantity || 0,
                  unit: product.unit || 'kg',
                  isFlashSale: false
                }))
                const filtered = mappedProducts.filter(p => typeof p.image === 'string' && p.image.startsWith('http'))
                console.log('FindItems: Loaded from localStorage fallback:', filtered.length)
                setProducts(filtered)
              } else {
                console.log('FindItems: localStorage fallback empty')
                // UI-level last resort seeding to guarantee visibility
                const nowIso = new Date().toISOString()
                const seed = [
                  { id: 1, name: 'Apples', price: 120, quantity: 50, stock: 50, unit: 'kg', supplierId: 4, supplierName: 'Priya Singh', category: 'fruits', description: 'Fresh crunchy apples from Priya Singh', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop', createdAt: nowIso },
                  { id: 2, name: 'Bananas', price: 60, quantity: 40, stock: 40, unit: 'dozen', supplierId: 4, supplierName: 'Priya Singh', category: 'fruits', description: 'Sweet ripe bananas', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop', createdAt: nowIso },
                  { id: 3, name: 'Tomatoes', price: 30, quantity: 100, stock: 100, unit: 'kg', supplierId: 2, supplierName: 'Sakshi', category: 'vegetables', description: 'Juicy tomatoes from Sakshi', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=300&fit=crop', createdAt: nowIso },
                  { id: 4, name: 'Onions', price: 25, quantity: 120, stock: 120, unit: 'kg', supplierId: 3, supplierName: 'Ravi Kumar', category: 'vegetables', description: 'Fresh red onions from Ravi Kumar', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop', createdAt: nowIso },
                  { id: 5, name: 'Sunflower Oil', price: 150, quantity: 60, stock: 60, unit: 'liter', supplierId: 6, supplierName: 'Sunita Sharma', category: 'oils', description: 'Refined sunflower oil', image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?w=400&h=300&fit=crop', createdAt: nowIso },
                  { id: 6, name: 'Basmati Rice', price: 90, quantity: 200, stock: 200, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', category: 'grains', description: 'Premium basmati rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop', createdAt: nowIso },
                  { id: 7, name: 'Chana Dal', price: 85, quantity: 150, stock: 150, unit: 'kg', supplierId: 5, supplierName: 'Amit Patel', category: 'grams', description: 'Protein-rich chana dal', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop', createdAt: nowIso },
                  { id: 8, name: 'Wheat Flour', price: 55, quantity: 180, stock: 180, unit: 'kg', supplierId: 7, supplierName: 'Deepak Joshi', category: 'flours', description: 'Stone-ground wheat flour', image: 'https://images.unsplash.com/photo-1518544801976-3e188ed8a8ff?w=400&h=300&fit=crop', createdAt: nowIso },
                  { id: 9, name: 'Almonds', price: 700, quantity: 30, stock: 30, unit: 'kg', supplierId: 8, supplierName: 'Meena Gupta', category: 'nuts', description: 'Premium quality almonds', image: 'https://images.unsplash.com/photo-1604908812839-8a99a3dd8c5a?w=400&h=300&fit=crop', createdAt: nowIso },
                ]
                localStorage.setItem('vendorMitraProducts', JSON.stringify(seed))
                const mappedProducts = seed.map(product => ({
                  id: product.id,
                  name: `${product.name} (demo)`,
                  price: product.price,
                  image: product.image,
                  supplier: product.supplierName,
                  supplierId: product.supplierId,
                  category: product.category ? product.category.toLowerCase() : 'general',
                  description: product.description || `Fresh ${product.name} from ${product.supplierName}`,
                  rating: 0,
                  reviews: 0,
                  quantity: product.stock || product.quantity || 0,
                  availableStock: product.stock || product.quantity || 0,
                  unit: product.unit || 'kg',
                  isFlashSale: false
                }))
                const filteredSeed = mappedProducts.filter(p => typeof p.image === 'string' && p.image.startsWith('http'))
                console.log('FindItems: Seeded via UI fallback:', filteredSeed.length)
                setProducts(filteredSeed)
              }
            } catch (e) {
              console.warn('FindItems: Failed to parse localStorage vendorMitraProducts', e)
            }
          }
        }
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }

    loadProducts()

    const unsubscribeProduct = realTimeSync.subscribe('product_update', (data) => {
      if (data && data.action) {
        setTimeout(() => {
          loadProducts()
        }, 200)
      }
    })

    const unsubscribeStock = realTimeSync.subscribe('stock_update', (data) => {
      if (data && data.productId) {
        setProducts(prev => prev.map(p =>
          p.id === data.productId ? { ...p, availableStock: data.newStock, quantity: data.newStock } : p
        ))
      }
    })

    // Listen to localStorage updates for vendorMitraProducts to refresh instantly
    const handleStorage = (e) => {
      if (e.key === 'vendorMitraProducts' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          const mappedProducts = parsed.map(product => ({
            id: product.id,
            name: `${product.name} (demo)`,
            price: product.price,
            image: product.image,
            supplier: product.supplierName,
            supplierId: product.supplierId,
            category: product.category ? product.category.toLowerCase() : 'general',
            description: (() => {
              const base = product.description || `Fresh ${product.name} from ${product.supplierName}`
              const cat = (product.category || '').toLowerCase()
              const isFruitVeg = cat === 'fruits' || cat === 'fruit' || cat === 'vegetables' || cat === 'vegetable'
              const supplier = users.find(u => Number(u.id) === Number(product.supplierId))
              const isFssai = Boolean(product.isVerified) || Boolean(supplier?.fssaiVerified)
              const isOrganicCandidate = isFruitVeg || Boolean(product.isOrganic || product.organic)
              if (isOrganicCandidate) {
                return /\borganic\b/i.test(base) ? base : `${base} • Organic`
              }
              if (isFssai) {
                return /fssai\s*verified/i.test(base) ? base : `${base} • FSSAI Verified`
              }
              return base
            })(),
            rating: 0,
            reviews: 0,
            quantity: product.stock || product.quantity || 0,
            availableStock: product.stock || product.quantity || 0,
            unit: product.unit || 'kg',
            isFlashSale: false
          }))
          const filtered = mappedProducts.filter(p => typeof p.image === 'string' && p.image.startsWith('http'))
          setProducts(filtered)
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      unsubscribeStock()
      unsubscribeProduct()
      window.removeEventListener('storage', handleStorage)
    }
  }, [allProducts])

  // Calculate average rating for each product from actual reviews
  useEffect(() => {
    const calculateProductRatings = () => {
      const ratings = {}
      products.forEach(product => {
        const reviews = reviewsDatabase.getReviewsByProduct(product.id)
        if (reviews && reviews.length > 0) {
          const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ratings[product.id] = { rating: avgRating, count: reviews.length }
        } else {
          ratings[product.id] = { rating: 0, count: 0 }
        }
      })
      setProductReviews(ratings)
    }
    if (products.length > 0) {
      calculateProductRatings()
    }
  }, [products])

  // Filter products using useMemo to avoid recomputation
  const filteredProducts = useMemo(() => {
    const minP = filterPriceMin === '' ? 0 : Number(filterPriceMin)
    const maxP = filterPriceMax === '' ? Infinity : Number(filterPriceMax)
    const filtered = products.filter(product => {
      const nameMatches = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.supplier.toLowerCase().includes(search.toLowerCase())
      const priceMatches = product.price >= minP && product.price <= maxP
      const ratingMatches = (productReviews[product.id]?.rating || 0) >= minRating
      const organicMatches = filterOrganic === 'all'
        ? true
        : (filterOrganic === 'organic' ? Boolean(product.isOrganic) : !Boolean(product.isOrganic))
      const categoryMatches = filterCategory === 'all' || product.category === filterCategory
      const supplierMatches = selectedSupplier === 'all' || product.supplier === selectedSupplier
      return nameMatches && priceMatches && ratingMatches && organicMatches && categoryMatches && supplierMatches
    })
    return filtered
  }, [products, search, filterPriceMin, filterPriceMax, minRating, filterOrganic, filterCategory, selectedSupplier, productReviews])

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return a.price - b.price
        case 'rating':
          return (productReviews[b.id]?.rating || 0) - (productReviews[a.id]?.rating || 0)
        default:
          return 0
      }
    })
  }, [filteredProducts, sortBy, productReviews])

  // Get unique categories and suppliers
  const categories = Array.from(new Set(products.map(p => p.category)))
  const suppliers = Array.from(new Set(products.map(p => p.supplier)))

  const getUIStock = (itemId, defaultStock) => {
    return defaultStock || 0
  }

  const displayUnit = (unit) => {
    return unit || 'piece'
  }

  const handleQuantityChange = (itemId, newQuantity) => {
    const item = products.find(i => i.id === itemId)
    const availableStock = item?.availableStock || 0
    const quantity = Math.max(1, parseInt(newQuantity) || 1)
    
    if (quantity > availableStock) {
      alert(`Only ${availableStock} units are available`)
      return
    }
    
    // Update the purchase quantity state
    setPurchaseQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }))
  }

  const buyNow = (product) => {
    if (product.availableStock <= 0) {
      alert('This product is out of stock!')
      return
    }
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      supplier: product.supplier,
      supplierId: product.supplierId,
      quantity: 1,
      unit: product.unit
    }
    addToCart(cartItem)
    alert(`${product.name} added to cart!`)
  }



  const handleAddToCart = (item) => {
    if (!user) {
      alert('Please log in to add items to cart')
      navigate('/login')
      return
    }

    const quantity = purchaseQuantities[item.id] || 1
    const availableStock = getUIStock(item.id, item.availableStock || 0)
    
    if (availableStock <= 0) {
      alert('This item is out of stock!')
      return
    }

    if (quantity > availableStock) {
      alert(`Only ${availableStock} units are available`)
      return
    }

    // Additional check to ensure quantity is valid
    if (quantity <= 0) {
      alert('Please select a valid quantity')
      return
    }

    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      supplier: item.supplier,
      supplierId: item.supplierId,
      quantity: quantity,
      unit: item.unit
    }
    
    addToCart(cartItem)
    
    // Reset purchase quantity to 1 after adding to cart
    setPurchaseQuantities(prev => ({
      ...prev,
      [item.id]: 1
    }))
    
    alert(`${item.name} (${quantity} ${item.unit}) added to cart!`)
  }

  const handleBuyNow = (item) => {
    console.log('handleBuyNow called with item:', item)
    
    if (!user) {
      alert('Please log in to buy items')
      navigate('/login')
      return
    }

    const quantity = purchaseQuantities[item.id] || 1
    const availableStock = getUIStock(item.id, item.availableStock || 0)
    
    console.log(`Buy Now validation - Quantity: ${quantity}, Available: ${availableStock}`)
    
    if (availableStock <= 0) {
      alert('This item is out of stock!')
      return
    }

    if (quantity > availableStock) {
      alert(`Only ${availableStock} units are available`)
      return
    }

    if (quantity <= 0) {
      alert('Please select a valid quantity')
      return
    }

    const buyNowData = {
      ...item,
      name: item.name,
      supplier: item.supplier,
      unit: item.unit,
      quantity: quantity,
      totalPrice: item.price * quantity
    }
    
    console.log('Setting buyNowItem:', buyNowData)
    setBuyNowItem(buyNowData)
    setShowBuyNowDialog(true)
    console.log('Buy Now dialog should open now')
  }

// ...
  const handleConfirmOrder = async (orderData) => {
    try {
      console.log('handleConfirmOrder called with:', orderData)
      const { item, quantity, totalPrice, deliveryAddress, paymentMethod } = orderData
      
      // Use the ProductContext decreaseStock method for proper stock management
      // Include vendor and delivery information for Feature 1 & 2
      const stockUpdateResult = await decreaseStock(item.id, quantity, {
        vendorId: user?.id,
        vendorName: user?.name,
        deliveryAddress: deliveryAddress,
        paymentMethod: paymentMethod
      })
      
      console.log('Stock update result:', stockUpdateResult)
      
      if (!stockUpdateResult || !stockUpdateResult.success) {
        console.error('Stock update failed:', stockUpdateResult)
        alert(`Failed to update inventory: ${stockUpdateResult?.message || 'Unknown error'}`)
        return
      }
      
      // Get the updated stock from the API response
      const newStock = stockUpdateResult.data.stock || stockUpdateResult.data.quantity || 0
      
      console.log(`Stock update successful:`)
      console.log(`  - Product ID: ${item.id}`)
      console.log(`  - Quantity bought: ${quantity}`)
      console.log(`  - New stock: ${newStock}`)
      
      // Update stock levels immediately
      setStockLevels(prev => ({
        ...prev,
        [item.id]: newStock
      }))

      // Update products array
      setProducts(prev => prev.map(i => 
        i.id === item.id 
          ? { 
              ...i, 
              availableStock: newStock, 
              quantity: newStock, 
              stock: newStock 
            }
          : i
      ))

      // Update purchase quantities based on remaining stock
      if (newStock > 0) {
        setPurchaseQuantities(prev => ({
          ...prev,
          [item.id]: Math.min(prev[item.id] ?? 1, newStock)
        }))
      } else {
        setPurchaseQuantities(prev => ({
          ...prev,
          [item.id]: 1 // Reset to 1 but it will be disabled
        }))
      }

      deliveriesDatabase.addDelivery({
        customer: user?.name || 'Manya',
        customerId: user?.id || 1,
        supplier: item.supplier,
        supplierId: item.supplierId,
        products: [{
          id: item.id,
          name: item.name,
          quantity: quantity,
          price: item.price,
          unit: item.unit,
          image: item.image
        }],
        totalAmount: totalPrice,
        deliveryAddress: deliveryAddress,
        paymentMethod: paymentMethod,
        status: 'delivered', // Set to delivered for testing review functionality
        orderDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      alert(`Order placed successfully! Your ${item.name} will be delivered soon.`)
      setShowBuyNowDialog(false)
      setBuyNowItem(null)
      
    } catch (error) {
      console.error('Error in handleConfirmOrder:', error)
      alert('Failed to place order. Please try again.')
    }
  }

  const handleReviewSubmit = (review) => {
    alert('Handler called!');
    const reviewData = {
      productId: selectedItemForReview.id,
      productName: selectedItemForReview.name,
      supplierId: selectedItemForReview.supplierId,
      supplierName: selectedItemForReview.supplier,
      vendorId: 1, // Manya (for demo)
      vendorName: 'Manya',
      rating: review.rating,
      comment: review.comment
    }
    console.log('Submitting review:', reviewData)
    reviewsDatabase.addReview(reviewData)
    alert('Review submitted successfully!')
    setSelectedItemForReview(null)
  }

  const totalItems = sortedProducts.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Discover Products</h1>
              <p className="text-sm text-gray-600 mt-1">Browse our fresh collection from trusted suppliers</p>
            </div>
          </div>
        </div>

        {/* Search Bar - Enhanced */}
        <div className="mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search for items, suppliers, or descriptions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
        </div>
        
        {/* Filter Bar - Redesigned */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
              showFilters 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-4 py-2.5 border border-gray-200">
            <span className="text-sm font-medium text-gray-600">Items Found:</span>
            <span className="text-lg font-bold text-blue-600">{totalItems}</span>
          </div>
        </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Advanced Filters</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <select value={filterOrganic} onChange={e => setFilterOrganic(e.target.value)} className="border rounded px-2 py-1 bg-white text-gray-900 border-gray-300">
              <option value="all">All Types</option>
              <option value="organic">Organic</option>
              <option value="inorganic">Inorganic</option>
            </select>
            <input type="number" placeholder="Min Price" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} className="border rounded px-2 py-1 w-24 bg-white text-gray-900 border-gray-300" />
            <input type="number" placeholder="Max Price" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} className="border rounded px-2 py-1 w-24 bg-white text-gray-900 border-gray-300" />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border rounded px-2 py-1 bg-white text-gray-900 border-gray-300">
              <option value="all">All Categories</option>
              <option value="fruits">Fruits</option>
              <option value="vegetables">Vegetables</option>
              <option value="oils">Oils</option>
              <option value="grains">Grains</option>
              <option value="grams">Grams</option>
              <option value="flours">Flours</option>
              <option value="nuts">Nuts</option>
            </select>
            <select value={minRating} onChange={e => setMinRating(Number(e.target.value))} className="border rounded px-2 py-1 bg-white text-gray-900 border-gray-300">
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Items List */}
        <div className="flex-1">
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No items found matching your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map(item => {
                const isOutOfStock = item.availableStock <= 0
                return (
                <div key={item.id} className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOutOfStock 
                    ? 'bg-gray-50 opacity-70' 
                    : 'bg-white hover:shadow-2xl hover:-translate-y-1'
                }`}>
                  {/* Image Section with Overlay */}
                  <div className="relative overflow-hidden">
                    <div className={`w-full h-56 flex items-center justify-center overflow-hidden ${
                      isOutOfStock ? 'bg-gray-200' : 'bg-gradient-to-br from-blue-50 to-indigo-50'
                    }`}>
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isOutOfStock ? 'grayscale' : 'group-hover:scale-110'
                        }`}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                      <div className={`w-full h-56 flex items-center justify-center text-5xl ${
                        isOutOfStock ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-400'
                      }`} style={{display: 'none'}}>
                        📦
                      </div>
                    </div>
                    
                    {/* Price Badge - Top Right */}
                    <div className={`absolute top-3 right-3 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg ${
                      isOutOfStock ? 'bg-gray-400/90' : 'bg-blue-600/90'
                    }`}>
                      <div className="text-white font-bold text-lg">₹{item.price}</div>
                      <div className="text-white/90 text-xs">per {item.unit}</div>
                    </div>
                    
                    {/* Stock Badge - Top Left */}
                    {!isOutOfStock && (
                      <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-md ${
                        getUIStock(item.id, item.availableStock) < 10 
                          ? 'bg-orange-500/90' 
                          : 'bg-green-500/90'
                      }`}>
                        <div className="text-white text-xs font-semibold">
                          {getUIStock(item.id, item.availableStock)} {displayUnit(item.unit)} left
                        </div>
                      </div>
                    )}
                    
                    {isOutOfStock && (
                      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-red-500/90 backdrop-blur-md shadow-md">
                        <div className="text-white text-xs font-semibold">Out of Stock</div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-5 ${isOutOfStock ? 'text-gray-500' : ''}`}>
                    {/* Product Title */}
                    <h3 className={`text-xl font-bold mb-2 ${isOutOfStock ? 'text-gray-600' : 'text-gray-900'}`}>
                      {item.name}
                    </h3>
                    
                    {/* Supplier Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <Store className={`w-4 h-4 ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.supplier}
                      </span>
                    </div>

                    <p className={`text-sm mb-4 line-clamp-2 ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.description}
                    </p>

                    {/* Out of Stock Notification */}
                    {isOutOfStock && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700 font-medium">
                          📧 We will notify you when this product is available
                        </p>
                      </div>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                      {productReviews[item.id]?.count > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                            isOutOfStock ? 'bg-gray-100' : 'bg-yellow-50'
                          }`}>
                            <Star className={`w-4 h-4 ${isOutOfStock ? 'text-gray-400' : 'text-yellow-500 fill-current'}`} />
                            <span className={`text-sm font-semibold ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>
                              {productReviews[item.id].rating.toFixed(1)}
                            </span>
                          </div>
                          <span className={`text-xs ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
                            ({productReviews[item.id].count} reviews)
                          </span>
                        </div>
                      ) : (
                        <span className={`text-xs ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
                          No reviews yet
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.isOrganic && (
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                          isOutOfStock 
                            ? 'bg-gray-200 text-gray-500' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          🌱 Organic
                        </span>
                      )}
                      {!item.isOrganic && item.isVerified && (
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                          isOutOfStock 
                            ? 'bg-gray-200 text-gray-500' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          ✓ FSSAI Verified
                        </span>
                      )}
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                        isOutOfStock 
                          ? 'bg-gray-200 text-gray-500' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.category}
                      </span>
                    </div>

                    {/* Quantity Selector - Modern */}
                    <div className="mb-4">
                      <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>
                        Select Quantity
                      </label>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center rounded-lg overflow-hidden ${
                          isOutOfStock ? 'bg-gray-100' : 'bg-gray-50 border-2 border-gray-200'
                        }`}>
                          <button
                            onClick={() => handleQuantityChange(item.id, (purchaseQuantities[item.id] || 1) - 1)}
                            disabled={getUIStock(item.id, item.availableStock) <= 0 || (purchaseQuantities[item.id] || 1) <= 1}
                            className={`w-10 h-10 flex items-center justify-center font-bold text-lg ${
                              isOutOfStock 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                            }`}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={getUIStock(item.id, item.availableStock)}
                            value={purchaseQuantities[item.id] || 1}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            disabled={getUIStock(item.id, item.availableStock) <= 0}
                            className={`w-16 h-10 text-center font-bold text-lg bg-transparent border-none outline-none ${
                              isOutOfStock ? 'text-gray-400' : 'text-gray-900'
                            }`}
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, (purchaseQuantities[item.id] || 1) + 1)}
                            disabled={getUIStock(item.id, item.availableStock) <= 0 || (purchaseQuantities[item.id] || 1) >= getUIStock(item.id, item.availableStock)}
                            className={`w-10 h-10 flex items-center justify-center font-bold text-lg ${
                              isOutOfStock 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                            }`}
                          >
                            +
                          </button>
                        </div>
                        <span className={`text-sm font-medium ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>
                          {displayUnit(item.unit)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons - Modern */}
                    <div className="space-y-2">
                      <button 
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                          getUIStock(item.id, item.availableStock) <= 0
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                        }`}
                        onClick={() => handleAddToCart(item)}
                        disabled={getUIStock(item.id, item.availableStock) <= 0}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {getUIStock(item.id, item.availableStock) <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>

                      <div className="flex gap-2">
                        <button 
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold transition-all ${
                            getUIStock(item.id, item.availableStock) <= 0
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40'
                          }`}
                          onClick={() => {
                            console.log('Buy Now clicked for item:', item)
                            handleBuyNow(item)
                          }}
                          disabled={getUIStock(item.id, item.availableStock) <= 0}
                        >
                          {getUIStock(item.id, item.availableStock) <= 0 ? 'Sold Out' : `₹${item.price * (purchaseQuantities[item.id] || 1)}`}
                        </button>

                        <button 
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-semibold transition-all ${
                            isOutOfStock 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-2 border-orange-200'
                          }`}
                          onClick={() => setSelectedItemForReview(item)}
                          disabled={isOutOfStock}
                        >
                          <Star className="w-4 h-4" />
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Review System Modal */}
      {selectedItemForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reviews for {selectedItemForReview.name}</h3>
              <button
                onClick={() => setSelectedItemForReview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ReviewSystem
              itemId={selectedItemForReview.id}
              itemName={selectedItemForReview.name}
              supplierId={selectedItemForReview.supplierId}
              supplierName={selectedItemForReview.supplier}
              onClose={() => setSelectedItemForReview(null)}
              onSubmit={handleReviewSubmit}
              readOnly={true}
            />
          </div>
        </div>
      )}


      {/* Buy Now Dialog */}
      <BuyNowDialog
        isOpen={showBuyNowDialog}
        onClose={() => setShowBuyNowDialog(false)}
        item={buyNowItem}
        quantity={buyNowItem?.quantity}
        totalPrice={buyNowItem?.totalPrice}
        onConfirmOrder={handleConfirmOrder}
      />
      </div>
    </div>
  )
}

export default FindItems