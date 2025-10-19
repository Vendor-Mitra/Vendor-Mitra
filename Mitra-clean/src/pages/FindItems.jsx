import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useProducts } from '../contexts/ProductContext'
import { Star, ShoppingCart, MessageSquare, Zap, Clock, Package, Search, Filter } from 'lucide-react'
import { reviewsDatabase, bargainsDatabase, deliveriesDatabase, flashSalesDatabase } from '../data/userDatabase'
import ReviewSystem from '../components/Rating/ReviewSystem'
import Negotiation from '../components/Bargain/Negotiation'
import FlashSaleTimer from '../components/FlashSales/FlashSaleTimer'
import BuyNowDialog from '../components/BuyNow/BuyNowDialog'
import realTimeSync from '../utils/realTimeSync'
import { updateProductStockAfterPurchase } from '../utils/purchaseHandler'

const FindItems = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { products, loading: productsLoading, searchProducts, decreaseStock } = useProducts()
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockLevels, setStockLevels] = useState({})
  const [purchaseQuantities, setPurchaseQuantities] = useState({})

  // Helper functions
  const getUIStock = (id, fallback) => {
    const stock = stockLevels[id] ?? fallback ?? 0
    console.log(`getUIStock for product ${id}: stockLevels[${id}] = ${stockLevels[id]}, fallback = ${fallback}, result = ${stock}`)
    return stock
  }
  const displayUnit = (unit) => unit === 'kg' ? 'kg' : (unit || 'kg')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showReviews, setShowReviews] = useState(false)
  const [showNegotiation, setShowNegotiation] = useState(false)
  const [showBuyNow, setShowBuyNow] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [bargainModal, setBargainModal] = useState({ open: false, bargain: null, item: null })
  const [bargainMessage, setBargainMessage] = useState('')
  const [bargainOffer, setBargainOffer] = useState('')
  const [filterOrganic, setFilterOrganic] = useState('all')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedItemForReview, setSelectedItemForReview] = useState(null)
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false)
  const [buyNowItem, setBuyNowItem] = useState(null)

  // Load products from API
  const loadProducts = () => {
    try {
      console.log('Loading products from API in FindItems:', products)
      
      if (products && products.length > 0) {
        // Get current flash sale product IDs to exclude them
        const flashSaleProducts = flashSalesDatabase.getAllFlashSales()
        const flashSaleProductNames = new Set(flashSaleProducts.map(fs => fs.product.toLowerCase()))
        
        const transformedItems = products
          .filter(product => !flashSaleProductNames.has(product.name.toLowerCase()))
          .map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          supplier: product.supplierName,
          supplierId: product.supplierId,
          category: product.category ? product.category.toLowerCase() : 'general',
          description: product.description || `Fresh ${product.name} from ${product.supplierName}`,
          rating: product.supplierRating || 4.5,
          reviews: Math.floor(Math.random() * 50) + 10,
          quantity: product.stock || product.quantity || 0,
          availableStock: product.stock || product.quantity || 0,
          unit: product.unit || 'kg',
          isOrganic: product.isOrganic || product.organic || false,
          isVerified: product.fssaiVerified || true,
          location: product.supplierLocation,
          deliveryTime: product.deliveryTime || '2-4 hours',
          minimumOrder: product.minimumOrder || 100
        }))
        console.log('Transformed items:', transformedItems)
        setItems(transformedItems)
        setIsLoading(false)
        
        // Initialize stock levels and purchase quantities using real product data
        const initialStock = {}
        const initialQuantities = {}
        transformedItems.forEach(item => {
          // Use local item data, not getAvailableStock during init
          const actualStock = parseInt(item.availableStock) || 0
          initialStock[item.id] = actualStock
          initialQuantities[item.id] = actualStock > 0 ? 1 : 0
        })
        console.log('Initial stock levels:', initialStock)
        setStockLevels(initialStock)
        setPurchaseQuantities(initialQuantities)
      } else {
        console.log('No products found')
        setItems([])
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setItems([])
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()

    // Subscribe to bargain updates
    const unsubscribeBargain = realTimeSync.subscribe('bargain_update', (data) => {
      console.log('Bargain update received in FindItems:', data)
      // Handle bargain updates if needed
    })

    // Subscribe to real-time stock updates
    const unsubscribeStock = realTimeSync.subscribe('stock_update', (data) => {
      console.log('Stock update received in FindItems:', data)
      
      if (data && data.productId) {
        const newStock = data.newStock ?? data.product?.stock ?? 0
        console.log('Stock update for product:', data.productId, 'new stock:', newStock)
        
        setStockLevels(prev => ({
          ...prev,
          [data.productId]: newStock
        }))
        
        // Update items list with new stock
        setItems(prev => prev.map(item => 
          item.id === data.productId 
            ? { ...item, stock: newStock, quantity: newStock, availableStock: newStock }
            : item
        ))
      }
    })

    // Subscribe to product updates
    const unsubscribeProduct = realTimeSync.subscribe('product_update', (data) => {
      console.log('Product update received in FindItems:', data)
      
      if (data && data.action === 'create') {
        // Handle new product creation - add single product to avoid duplicates
        const newProduct = data.product
        console.log('New product created, adding to items list:', newProduct)
        
        // Check if product already exists to prevent duplicates
        setItems(prev => {
          const exists = prev.some(item => item.id === newProduct.id)
          if (exists) {
            console.log('Product already exists, skipping duplicate')
            return prev
          }
          
          // Transform new product to match items format
          const transformedProduct = {
            id: newProduct.id,
            name: newProduct.name,
            price: newProduct.price,
            image: newProduct.image,
            supplier: newProduct.supplierName,
            supplierId: newProduct.supplierId,
            category: newProduct.category ? newProduct.category.toLowerCase() : 'general',
            description: newProduct.description || `Fresh ${newProduct.name} from ${newProduct.supplierName}`,
            rating: newProduct.supplierRating || 4.5,
            reviews: Math.floor(Math.random() * 50) + 10,
            quantity: newProduct.stock || newProduct.quantity || 0,
            availableStock: newProduct.stock || newProduct.quantity || 0,
            unit: newProduct.unit || 'kg',
            isOrganic: newProduct.isOrganic || newProduct.organic || false,
            isVerified: newProduct.fssaiVerified || true,
            location: newProduct.supplierLocation,
            deliveryTime: newProduct.deliveryTime || '2-4 hours',
            minimumOrder: newProduct.minimumOrder || 100
          }
          
          return [...prev, transformedProduct]
        })
        
        // Initialize stock and purchase quantity for new product
        const actualStock = parseInt(newProduct.stock || newProduct.quantity || 0)
        setStockLevels(prev => ({
          ...prev,
          [newProduct.id]: actualStock
        }))
        setPurchaseQuantities(prev => ({
          ...prev,
          [newProduct.id]: actualStock > 0 ? 1 : 0
        }))
      }
    })

    return () => {
      unsubscribeBargain()
      unsubscribeStock()
      unsubscribeProduct()
    }
  }, [])

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  // Get unique categories and suppliers
  const categories = Array.from(new Set(items.map(i => i.category)))
  const suppliers = Array.from(new Set(items.map(i => i.supplier)))

  // Apply filters including search
  const filteredItems = sortedItems.filter(item => {
    // Search filter
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && 
        !item.supplier.toLowerCase().includes(search.toLowerCase()) &&
        !item.description.toLowerCase().includes(search.toLowerCase())) return false
    
    if (filterOrganic === 'organic' && !item.isOrganic) return false
    if (filterOrganic === 'inorganic' && item.isOrganic) return false
    if (filterPriceMin && item.price < parseFloat(filterPriceMin)) return false
    if (filterPriceMax && item.price > parseFloat(filterPriceMax)) return false
    if (filterCategory !== 'all' && item.category !== filterCategory) return false
    if (filterSupplier && item.supplier !== filterSupplier) return false
    if (minRating > 0 && item.rating < minRating) return false
    return true
  })
  
  const handleQuantityChange = (itemId, newQuantity) => {
    const item = items.find(i => i.id === itemId)
    const availableStock = getUIStock(itemId, item?.availableStock || 0)
    const quantity = Math.max(1, parseInt(newQuantity) || 1)
    
    if (quantity > availableStock) {
      alert(`Only ${availableStock} units are available`)
      setPurchaseQuantities(prev => ({
        ...prev,
        [itemId]: Math.min(prev[itemId] ?? 1, availableStock)
      }))
      return
    }
    
    setPurchaseQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }))
  }

  const openBargainModal = (item) => {
    // Try to find an existing bargain for this vendor/product
    const vendorId = 1 // Manya (for demo)
    let bargain = bargainsDatabase.getAllBargains().find(b => b.productId === item.id && b.vendorId === vendorId)
    if (!bargain) {
      // Create new bargain
      bargain = bargainsDatabase.addBargain({
        productId: item.id,
        productName: item.name,
        supplierId: item.supplierId || 2,
        supplierName: item.supplier,
        vendorId,
        vendorName: 'Manya',
        messages: []
      })
    }
    setBargainModal({ open: true, bargain, item })
  }

  const sendBargainMessage = () => {
    if (!bargainOffer && !bargainMessage) return
    bargainsDatabase.addMessage(bargainModal.bargain.id, {
      sender: 'vendor',
      offer: bargainOffer ? parseFloat(bargainOffer) : undefined,
      message: bargainMessage
    })
    // Refresh bargain from DB
    const updated = bargainsDatabase.getBargainById(bargainModal.bargain.id)
    setBargainModal({ ...bargainModal, bargain: updated })
    setBargainMessage('')
    setBargainOffer('')
  }

  // Feature 3: Handle confirmed bargain and add to cart
  const handleBargainConfirmed = ({ product, agreedPrice, originalPrice }) => {
    if (!user) {
      alert('Please log in to add items to cart')
      return
    }

    const quantity = 1 // Default quantity for bargained items
    const cartItem = {
      ...product,
      price: agreedPrice,
      originalPrice: originalPrice,
      quantity: quantity,
      isBargained: true
    }

    addToCart(cartItem, quantity)
    setBargainModal({ open: false, bargain: null, item: null })
    alert(`Item added to cart at bargained price ₹${agreedPrice}!`)
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

      // Update items array
      setItems(prev => prev.map(i => 
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

  const totalItems = filteredItems.length

  return (
    <div className="max-w-none mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Package className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-primary-600">Find Items</h1>
      </div>


      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for items, suppliers, or descriptions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>

          {/* Quantity of Items beside Filter button */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-md px-4 py-2">
            <span className="text-sm font-medium text-gray-700">Quantity of Items:</span>
            <span className="text-lg font-bold text-blue-600">{totalItems}</span>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <select value={filterOrganic} onChange={e => setFilterOrganic(e.target.value)} className="border rounded px-2 py-1">
              <option value="all">All Types</option>
              <option value="organic">Organic</option>
              <option value="inorganic">Inorganic</option>
            </select>
            <input type="number" placeholder="Min Price" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} className="border rounded px-2 py-1 w-24" />
            <input type="number" placeholder="Max Price" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} className="border rounded px-2 py-1 w-24" />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border rounded px-2 py-1">
              <option value="all">All Categories</option>
              <option value="fruits">Fruits</option>
              <option value="vegetables">Vegetables</option>
              <option value="oils">Oils</option>
              <option value="grains">Grains</option>
              <option value="grams">Grams</option>
              <option value="flours">Flours</option>
              <option value="nuts">Nuts</option>
            </select>
            <select value={minRating} onChange={e => setMinRating(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>
        </div>
      )}

      <div className={`flex flex-col gap-8 ${showNegotiation && selectedItem ? 'lg:flex-row' : ''}`}>
        {/* Items List */}
        <div className="flex-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No items found matching your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const isOutOfStock = getUIStock(item.id, item.availableStock) <= 0
                return (
                <div key={item.id} className={`rounded-lg shadow-md overflow-hidden transition-shadow ${
                  isOutOfStock 
                    ? 'bg-gray-100 opacity-60' 
                    : 'bg-white hover:shadow-lg'
                }`}>
                  <div className={`w-full h-48 flex items-center justify-center overflow-hidden ${
                    isOutOfStock ? 'bg-gray-200' : 'bg-gray-100'
                  }`}>
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className={`w-full h-full object-cover ${
                        isOutOfStock ? 'grayscale' : ''
                      }`}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className={`w-full h-48 flex items-center justify-center text-4xl ${
                      isOutOfStock ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-400'
                    }`} style={{display: 'none'}}>
                      📦
                    </div>
                  </div>
                  <div className={`p-4 ${isOutOfStock ? 'text-gray-500' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-xl font-bold ${isOutOfStock ? 'text-gray-600' : ''}`}>{item.name}</h3>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${isOutOfStock ? 'text-gray-500' : 'text-blue-600'}`}>₹{item.price}/{item.unit}</div>
                        <div className={`text-sm font-medium ${
                          getUIStock(item.id, item.availableStock) <= 0 
                            ? 'text-red-600' 
                            : getUIStock(item.id, item.availableStock) < 10 
                              ? 'text-orange-600' 
                              : 'text-gray-600'
                        }`}>
                          {getUIStock(item.id, item.availableStock) <= 0 
                            ? 'Out of Stock' 
                            : `${getUIStock(item.id, item.availableStock)} ${displayUnit(item.unit)} available`
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${isOutOfStock ? 'text-gray-500' : 'text-green-600'}`}>₹{item.price}</span>
                        <span className={`text-xs ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>per {item.unit || 'piece'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>Stock: {getUIStock(item.id, item.availableStock)} {displayUnit(item.unit)}</span>
                      </div>
                    </div>

                    <p className={`mb-4 ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</p>

                    {/* Out of Stock Notification */}
                    {isOutOfStock && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700 font-medium">
                          📧 We will notify you when this product is available
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${isOutOfStock ? 'text-gray-400' : 'text-yellow-400'}`} />
                        <span className={`text-sm ${isOutOfStock ? 'text-gray-400' : ''}`}>{item.rating.toFixed(1)}</span>
                        <span className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>({item.reviews})</span>
                      </div>
                      <div className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
                        by {item.supplier}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.isOrganic && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          isOutOfStock 
                            ? 'bg-gray-200 text-gray-500' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          Organic
                        </span>
                      )}
                      {!item.isOrganic && item.isVerified && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          isOutOfStock 
                            ? 'bg-gray-200 text-gray-500' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          FSSAI Verified
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        isOutOfStock 
                          ? 'bg-gray-200 text-gray-500' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.category}
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 mb-4">
                      <label className={`text-sm font-medium ${isOutOfStock ? 'text-gray-400' : 'text-gray-700'}`}>Quantity:</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, (purchaseQuantities[item.id] || 1) - 1)}
                          disabled={getUIStock(item.id, item.availableStock) <= 0 || (purchaseQuantities[item.id] || 1) <= 1}
                          className={`w-8 h-8 rounded border flex items-center justify-center ${
                            isOutOfStock 
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={getUIStock(item.id, item.availableStock)}
                          value={purchaseQuantities[item.id] || 1}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          disabled={getUIStock(item.id, item.availableStock) <= 0}
                          className={`w-16 text-center border rounded px-2 py-1 ${
                            isOutOfStock 
                              ? 'border-gray-200 bg-gray-100 text-gray-400' 
                              : 'border-gray-300 disabled:bg-gray-100'
                          }`}
                        />
                        <button
                          onClick={() => handleQuantityChange(item.id, (purchaseQuantities[item.id] || 1) + 1)}
                          disabled={getUIStock(item.id, item.availableStock) <= 0 || (purchaseQuantities[item.id] || 1) >= getUIStock(item.id, item.availableStock)}
                          className={`w-8 h-8 rounded border flex items-center justify-center ${
                            isOutOfStock 
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          +
                        </button>
                        <span className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>{displayUnit(item.unit)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                          getUIStock(item.id, item.availableStock) <= 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        onClick={() => handleAddToCart(item)}
                        disabled={getUIStock(item.id, item.availableStock) <= 0}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {getUIStock(item.id, item.availableStock) <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      <button 
                        className={`flex items-center gap-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                          isOutOfStock 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                        onClick={() => openBargainModal(item)}
                        disabled={getUIStock(item.id, item.availableStock) <= 0}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Bargain
                      </button>

                      <button 
                        className={`flex items-center gap-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                          isOutOfStock 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                        onClick={() => setSelectedItemForReview(item)}
                        disabled={isOutOfStock}
                      >
                        <Star className="w-4 h-4" />
                        Reviews
                      </button>
                    </div>
                    
                    <button 
                      className={`w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                        getUIStock(item.id, item.availableStock) <= 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      onClick={() => {
                        console.log('Buy Now clicked for item:', item)
                        handleBuyNow(item)
                      }}
                      disabled={getUIStock(item.id, item.availableStock) <= 0}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {getUIStock(item.id, item.availableStock) <= 0 ? 'Out of Stock' : `Buy Now - ₹${item.price * (purchaseQuantities[item.id] || 1)}`}
                    </button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar - Only show when negotiation is active */}
        {showNegotiation && selectedItem && (
          <div className="w-80 space-y-6">
            {/* Negotiation Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Bargain with {selectedItem.supplier}
              </h3>
              <Negotiation 
                initialOffer={selectedItem.price} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Review System Modal */}
      {selectedItemForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reviews for {selectedItemForReview.name}</h3>
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

      {bargainModal.open && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bargain Chat for {bargainModal.item.name}</h3>
              <button onClick={() => setBargainModal({ open: false, bargain: null, item: null })} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            {/* Feature 3: Use updated Negotiation component with confirm functionality */}
            <Negotiation 
              initialOffer={bargainModal.item.price}
              product={bargainModal.item}
              onBargainConfirmed={handleBargainConfirmed}
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
  )
}

export default FindItems