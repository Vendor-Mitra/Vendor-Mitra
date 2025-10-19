import React, { useState, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { useProducts } from '../contexts/ProductContext'
import { Search, Filter, Store, Star, MapPin } from 'lucide-react'
import realTimeSync from '../utils/realTimeSync'
import ReviewSystem from '../components/Rating/ReviewSystem'
import { reviewsDatabase, users } from '../data/userDatabase'
const Organic = () => {
  const { addToCart } = useCart()
  const { products: allProducts, loading: productsLoading } = useProducts()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProductForReview, setSelectedProductForReview] = useState(null)
  const [productReviews, setProductReviews] = useState({})
  const [showReviews, setShowReviews] = useState(false)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(200)
  const [minRating, setMinRating] = useState(0)
  const [organicOnly, setOrganicOnly] = useState(false)
  const [fssaiOnly, setFssaiOnly] = useState(false)
  const [products, setProducts] = useState([])

  useEffect(() => {
    const loadOrganicProducts = () => {
      try {
        console.log('All products for organic page:', allProducts)
        if (allProducts && allProducts.length > 0) {
          const buildDesc = (p) => {
            const cat = (p.category || '').toLowerCase()
            const isOrganicComputed = Boolean(p.isOrganic || p.organic || cat === 'fruits' || cat === 'fruit' || cat === 'vegetables' || cat === 'vegetable')
            let base = p.description || `Fresh ${isOrganicComputed ? 'organic ' : ''}${p.name} from ${p.supplierName}`
            // Do NOT append FSSAI tag in Organic page
            return base
          }
          const organicProducts = allProducts
            .filter(product => {
              const cat = (product.category || '').toLowerCase()
              const name = (product.name || '').toLowerCase()
              if (name.includes('laptop') || name.includes('paper')) return false
              return product.isOrganic === true || product.organic === true || cat === 'fruits' || cat === 'fruit' || cat === 'vegetables' || cat === 'vegetable'
            })
            .map(product => ({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              supplier: product.supplierName,
              supplierId: product.supplierId,
              description: buildDesc(product),
              rating: 0, // Will be calculated from actual reviews
              reviews: 0, // Will be calculated from actual reviews
              quantity: `${product.stock || product.quantity || 0} ${product.unit || 'kg'}`,
              availableStock: product.stock || product.quantity || 0,
              unit: product.unit || 'kg',
              certifications: ['Organic']
            }))
          console.log('Filtered organic products:', organicProducts)
          setProducts(organicProducts)
        } else {
          setProducts([])
        }
      } catch (error) {
        console.error('Error loading organic products:', error)
        setProducts([])
      }
    }

    loadOrganicProducts()
    
    // Subscribe to product updates for real-time sync
    const unsubscribe = realTimeSync.subscribe('product_update', (data) => {
      console.log('Product update received in Organic page:', data)
      if (data && data.action) {
        setTimeout(() => {
          loadOrganicProducts()
        }, 200)
      }
    })

    return () => unsubscribe()
  }, [allProducts])

  const filteredProducts = products.filter(product => {
    const nameMatches = product.name.toLowerCase().includes(search.toLowerCase()) ||
                       product.supplier.toLowerCase().includes(search.toLowerCase())
    const priceMatches = product.price >= minPrice && product.price <= maxPrice
    const ratingMatches = product.rating >= minRating
    const organicMatches = !organicOnly || product.certifications.includes('Organic')
    const fssaiMatches = !fssaiOnly || product.certifications.includes('FSSAI')
    
    return nameMatches && priceMatches && ratingMatches && organicMatches && fssaiMatches
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price
      case 'rating':
        return b.rating - a.rating
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  // Calculate average rating for each product from actual reviews
  useEffect(() => {
    const calculateProductRatings = () => {
      const ratings = {}
      products.forEach(product => {
        const productReviews = reviewsDatabase.getReviewsByProduct(product.id)
        if (productReviews && productReviews.length > 0) {
          const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
          ratings[product.id] = {
            rating: avgRating,
            count: productReviews.length
          }
        } else {
          ratings[product.id] = {
            rating: 0,
            count: 0
          }
        }
      })
      setProductReviews(ratings)
    }
    
    if (products.length > 0) {
      calculateProductRatings()
    }
  }, [products])

  const buyNow = (product) => {
    // Check stock availability
    if (product.availableStock <= 0) {
      alert('This product is out of stock!')
      return
    }
    
    // Add product to cart instead of direct purchase
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

  const handleReviewSubmit = (review) => {
    console.log('New review submitted:', review)
  }

  const totalFarmers = new Set(products.map(p => p.supplier)).size
  const organicProducts = products.filter(p => p.certifications.includes('Organic')).length
  const avgRating = products.length > 0 ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-green-600 to-lime-600 rounded-lg shadow-lg">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organic Marketplace</h1>
              <p className="text-sm text-gray-600 mt-1">100% certified organic products from trusted suppliers</p>
            </div>
          </div>
        </div>

      {/* Search Bar and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-green-600 transition-colors" />
            <input
              type="text"
              placeholder="Search Organic Products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl shadow-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price (₹/kg)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={minPrice}
                  onChange={e => setMinPrice(Number(e.target.value))}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price (₹/kg)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="input-field"
                  placeholder="200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Rating
                </label>
                <select
                  value={minRating}
                  onChange={e => setMinRating(Number(e.target.value))}
                  className="input-field"
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Product List */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map(product => {
              const isOutOfStock = product.availableStock <= 0
              return (
              <div key={product.id} className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                isOutOfStock 
                  ? 'bg-gray-50 opacity-70' 
                  : 'bg-white hover:shadow-2xl hover:-translate-y-1'
              }`}>
                {/* Image with Overlay */}
                <div className="relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className={`w-full h-56 object-cover transition-transform duration-500 ${
                      isOutOfStock ? 'grayscale' : 'group-hover:scale-110'
                    }`}
                  />
                  
                  {/* Price Badge */}
                  <div className={`absolute top-3 right-3 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg ${
                    isOutOfStock ? 'bg-gray-400/90' : 'bg-green-600/90'
                  }`}>
                    <div className="text-white font-bold text-lg">₹{product.price}</div>
                    <div className="text-white/90 text-xs">per {product.unit}</div>
                  </div>
                  
                  {/* Stock Badge */}
                  {!isOutOfStock && (
                    <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-md ${
                      product.availableStock < 10 ? 'bg-orange-500/90' : 'bg-green-500/90'
                    }`}>
                      <div className="text-white text-xs font-semibold">
                        {product.availableStock} {product.unit} left
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
                    {product.name}
                  </h3>
                  
                  {/* Supplier Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <Store className={`w-4 h-4 ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.supplier}
                    </span>
                  </div>

                  <p className={`text-sm mb-4 line-clamp-2 ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>
                    {product.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    {productReviews[product.id]?.count > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                          isOutOfStock ? 'bg-gray-100' : 'bg-yellow-50'
                        }`}>
                          <Star className={`w-4 h-4 ${isOutOfStock ? 'text-gray-400' : 'text-yellow-500 fill-current'}`} />
                          <span className={`text-sm font-semibold ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>
                            {productReviews[product.id].rating.toFixed(1)}
                          </span>
                        </div>
                        <span className={`text-xs ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({productReviews[product.id].count} reviews)
                        </span>
                      </div>
                    ) : (
                      <span className={`text-xs ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
                        No reviews yet
                      </span>
                    )}
                  </div>

                  {/* Certifications */}
                  <div className="flex gap-2 mb-4">
                    {product.certifications.map(cert => (
                      <span key={cert} className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                        isOutOfStock 
                          ? 'bg-gray-200 text-gray-500' 
                          : cert === 'Organic' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {cert === 'Organic' ? '🌱 ' : '✓ '}{cert}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button 
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                        product.availableStock <= 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40'
                      }`}
                      onClick={() => buyNow(product)}
                      disabled={product.availableStock <= 0}
                    >
                      {product.availableStock <= 0 ? 'Out of Stock' : '🌱 Add to Cart'}
                    </button>
                    <button 
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold transition-all ${
                        isOutOfStock 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-2 border-orange-200'
                      }`}
                      onClick={() => setSelectedProductForReview(product)}
                      disabled={isOutOfStock}
                    >
                      <Star className="w-4 h-4" />
                      View Reviews
                    </button>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sidebar content can go here */}
        </div>
      </div>

      {/* Review System Modal */}
      {selectedProductForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reviews for {selectedProductForReview.name}</h3>
              <button
                onClick={() => setSelectedProductForReview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ReviewSystem
              itemId={selectedProductForReview.id}
              itemName={selectedProductForReview.name}
              supplierId={selectedProductForReview.supplierId}
              supplierName={selectedProductForReview.supplier}
              onClose={() => setSelectedProductForReview(null)}
              onSubmit={handleReviewSubmit}
              readOnly={true}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Organic 