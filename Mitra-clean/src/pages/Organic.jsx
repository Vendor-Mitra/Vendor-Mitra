import React, { useState, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { useProducts } from '../contexts/ProductContext'
import { Search, Filter, Store, Star, MapPin, MessageSquare } from 'lucide-react'
import realTimeSync from '../utils/realTimeSync'
import Negotiation from '../components/Bargain/Negotiation'
import ReviewSystem from '../components/Rating/ReviewSystem'
const Organic = () => {
  const { addToCart } = useCart()
  const { products: allProducts, loading: productsLoading } = useProducts()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showNegotiation, setShowNegotiation] = useState(false)
  const [selectedProductForReview, setSelectedProductForReview] = useState(null)
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
          const organicProducts = allProducts
            .filter(product => product.isOrganic === true || product.organic === true)
            .map(product => ({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              supplier: product.supplierName,
              supplierId: product.supplierId,
              description: product.description || `Fresh organic ${product.name} from ${product.supplierName}`,
              rating: product.supplierRating || 4.5,
              reviews: Math.floor(Math.random() * 50) + 10,
              quantity: `${product.stock || product.quantity || 0} ${product.unit || 'kg'}`,
              availableStock: product.stock || product.quantity || 0,
              unit: product.unit || 'kg',
              certifications: ['Organic', 'FSSAI']
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

  const startBargain = (product) => {
    setSelectedProduct(product)
    setShowNegotiation(true)
  }

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
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Store className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold text-primary-600">Organic Products Marketplace</h1>
      </div>

      {/* Search Bar and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search Organic Products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product List */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedProducts.map(product => {
              const isOutOfStock = product.availableStock <= 0
              return (
              <div key={product.id} className={`rounded-lg shadow-md overflow-hidden transition-shadow ${
                isOutOfStock 
                  ? 'bg-gray-100 opacity-60' 
                  : 'bg-white hover:shadow-lg'
              }`}>
                <img 
                  src={product.image} 
                  alt={product.name}
                  className={`w-full h-48 object-cover ${
                    isOutOfStock ? 'grayscale' : ''
                  }`}
                />
                <div className={`p-6 ${isOutOfStock ? 'text-gray-500' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-xl font-bold ${isOutOfStock ? 'text-gray-600' : ''}`}>{product.name}</h3>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isOutOfStock ? 'text-gray-500' : 'text-green-600'}`}>₹{product.price}/{product.unit}</div>
                      <div className={`text-sm font-medium ${
                        product.availableStock <= 0 
                          ? 'text-red-600' 
                          : product.availableStock < 10 
                            ? 'text-orange-600' 
                            : 'text-gray-600'
                      }`}>
                        {product.availableStock <= 0 
                          ? 'Out of Stock' 
                          : `${product.availableStock} ${product.unit} available`
                        }
                      </div>
                    </div>
                  </div>

                  <p className={`mb-4 ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>{product.description}</p>

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
                      <span className={`text-sm ${isOutOfStock ? 'text-gray-400' : ''}`}>{product.rating}</span>
                      <span className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>({product.reviews})</span>
                    </div>
                    <div className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
                      by {product.supplier}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.certifications.map(cert => (
                      <span key={cert} className={`text-xs px-2 py-1 rounded ${
                        isOutOfStock 
                          ? 'bg-gray-200 text-gray-500' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {cert}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      className={`flex-1 ${product.availableStock <= 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'btn-primary'}`}
                      onClick={() => buyNow(product)}
                      disabled={product.availableStock <= 0}
                    >
                      {product.availableStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button 
                      className={`flex items-center gap-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        isOutOfStock 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                      onClick={() => startBargain(product)}
                      disabled={product.availableStock <= 0}
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
                      onClick={() => setSelectedProductForReview(product)}
                      disabled={isOutOfStock}
                    >
                      <Star className="w-4 h-4" />
                      Reviews
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
          {/* Negotiation Panel */}
          {showNegotiation && selectedProduct && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Bargain with {selectedProduct.supplier}
              </h3>
              <Negotiation 
                initialOffer={selectedProduct.price} 
              />
            </div>
          )}
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
  )
}

export default Organic 