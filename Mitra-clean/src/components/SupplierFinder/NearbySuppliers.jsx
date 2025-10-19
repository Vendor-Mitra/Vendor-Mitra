import React, { useState, useEffect } from 'react'
import {
  MapPin,
  Star,
  Search,
  Filter,
  Map as MapIcon,
  List,
  Plus,
  Minus
} from 'lucide-react'

// --- NEW: react-leaflet / leaflet imports ---
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Import the enhanced suppliers database
import { generateNearbySuppliers as generateSuppliersFromDB } from '../../data/suppliersDatabase.js'
import realTimeSync from '../../utils/realTimeSync'

// --- Fix default marker icon paths for CRA/Vite bundlers ---
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// Helper to recenter the leaflet map when user location changes
const ChangeView = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

const NearbySuppliers = () => {
  const [search, setSearch] = useState('')
  const [radius, setRadius] = useState(0)
  const [organicOnly, setOrganicOnly] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100)
  const [minPrice, setMinPrice] = useState(0)
  const [viewMode, setViewMode] = useState('list')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [locationDetected, setLocationDetected] = useState(false)
  const [error, setError] = useState(null)
  const [cart, setCart] = useState([])
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState(null)

  // Reverse geocode - unchanged
  const getAreaNameFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        {
          headers: {
            // polite header to avoid being throttled
            'User-Agent': 'vendor_mitraa_demo/1.0'
          }
        }
      )
      const data = await response.json()

      if (data && data.address) {
        const {
          suburb,
          neighbourhood,
          village,
          town,
          city_district,
          city,
          state_district
        } = data.address
        return (
          suburb ||
          neighbourhood ||
          village ||
          town ||
          city_district ||
          city ||
          state_district ||
          'Unknown Area'
        )
      }
      return 'Unknown Area'
    } catch (error) {
      console.error('Error getting area name:', error)
      return 'Unknown Area'
    }
  }

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Function to generate suppliers including existing login suppliers
  const generateNearbySuppliers = async (userLat, userLng, searchRadius) => {
    
    // Get suppliers from the enhanced database
    let allSuppliers = generateSuppliersFromDB(userLat, userLng, searchRadius)
    
    // Add existing supplier logins as real suppliers
    const existingSuppliers = [
      {
        id: 'existing_1',
        name: 'Ravi Kumar (Verified Supplier)',
        coordinates: [userLat + (Math.random() - 0.5) * 0.005, userLng + (Math.random() - 0.5) * 0.005],
        location: 'Sector 15, Chandigarh',
        address: 'Shop 15, Market Complex, Sector 15 - Fresh produce supplier',
        distance: calculateDistance(userLat, userLng, userLat + (Math.random() - 0.5) * 0.005, userLng + (Math.random() - 0.5) * 0.005),
        rating: '4.2',
        trustScore: 85,
        price: '₹45/kg',
        products: [
          { name: 'Fresh Tomatoes', price: '₹45/kg', image: '🍅' },
          { name: 'Organic Onions', price: '₹35/kg', image: '🧅' },
          { name: 'Premium Potatoes', price: '₹30/kg', image: '🥔' },
          { name: 'Fresh Carrots', price: '₹40/kg', image: '🥕' }
        ],
        organic: true,
        fssaiVerified: true,
        lastActive: 'Just now',
        deliveryTime: '2-4 hours',
        minimumOrder: '₹200',
        paymentMethods: ['Cash', 'UPI', 'Card'],
        specialOffers: ['10% off on first order'],
        supplierType: 'Individual Farmer'
      },
      // Add guaranteed nearby suppliers
      {
        id: 'guaranteed_1',
        name: 'Local Market (Always Nearby)',
        coordinates: [userLat + 0.001, userLng + 0.001], // Very close to user
        location: 'Sector 1, Chandigarh',
        address: 'Local Market - Always within range',
        distance: 0.1, // Always within 0.1km
        rating: '4.5',
        trustScore: 90,
        price: '₹40/kg',
        products: [
          { name: 'Fresh Vegetables', price: '₹40/kg', image: '🥬' },
          { name: 'Local Fruits', price: '₹60/kg', image: '🍎' },
          { name: 'Fresh Herbs', price: '₹80/kg', image: '🌿' }
        ],
        organic: false,
        fssaiVerified: true,
        lastActive: 'Just now',
        deliveryTime: '1-2 hours',
        minimumOrder: '₹100',
        paymentMethods: ['Cash', 'UPI'],
        specialOffers: ['Local delivery free'],
        supplierType: 'Retailer'
      },
      {
        id: 'guaranteed_2',
        name: 'Neighborhood Store (Close By)',
        coordinates: [userLat - 0.002, userLng - 0.002], // Very close to user
        location: 'Sector 2, Chandigarh',
        address: 'Neighborhood Store - Always accessible',
        distance: 0.2, // Always within 0.2km
        rating: '4.3',
        trustScore: 85,
        price: '₹35/kg',
        products: [
          { name: 'Daily Essentials', price: '₹35/kg', image: '🥕' },
          { name: 'Fresh Produce', price: '₹45/kg', image: '🍅' },
          { name: 'Local Dairy', price: '₹70/liter', image: '🥛' }
        ],
        organic: false,
        fssaiVerified: true,
        lastActive: '5 minutes ago',
        deliveryTime: '1-3 hours',
        minimumOrder: '₹150',
        paymentMethods: ['Cash', 'UPI'],
        specialOffers: ['Same day delivery'],
        supplierType: 'Retailer'
      },
      {
        id: 'existing_2',
        name: 'Priya Singh (Organic Farm)',
        coordinates: [userLat + (Math.random() - 0.5) * 0.008, userLng + (Math.random() - 0.5) * 0.008],
        location: 'Sector 20, Chandigarh',
        address: 'Farm 23, Organic Valley, Sector 20 - 100% organic produce',
        distance: calculateDistance(userLat, userLng, userLat + (Math.random() - 0.5) * 0.008, userLng + (Math.random() - 0.5) * 0.008),
        rating: '4.7',
        trustScore: 92,
        price: '₹60/kg',
        products: [
          { name: 'Organic Spinach', price: '₹60/kg', image: '🥬' },
          { name: 'Organic Kale', price: '₹70/kg', image: '🥬' },
          { name: 'Organic Lettuce', price: '₹55/kg', image: '🥬' },
          { name: 'Organic Cabbage', price: '₹40/kg', image: '🥬' }
        ],
        organic: true,
        fssaiVerified: true,
        lastActive: '15 minutes ago',
        deliveryTime: '3-5 hours',
        minimumOrder: '₹300',
        paymentMethods: ['UPI', 'Card'],
        specialOffers: ['Free delivery above ₹500'],
        supplierType: 'Cooperative'
      },
      {
        id: 'existing_3',
        name: 'Amit Patel (Fresh Market)',
        coordinates: [userLat + (Math.random() - 0.5) * 0.003, userLng + (Math.random() - 0.5) * 0.003],
        location: 'Sector 10, Chandigarh',
        address: 'Market Stall 7, Sector 10 - Daily fresh vegetables',
        distance: calculateDistance(userLat, userLng, userLat + (Math.random() - 0.5) * 0.003, userLng + (Math.random() - 0.5) * 0.003),
        rating: '4.0',
        trustScore: 78,
        price: '₹35/kg',
        products: [
          { name: 'Fresh Cauliflower', price: '₹35/kg', image: '🥦' },
          { name: 'Green Peas', price: '₹50/kg', image: '🫛' },
          { name: 'Fresh Beans', price: '₹45/kg', image: '🫘' },
          { name: 'Fresh Corn', price: '₹30/kg', image: '🌽' }
        ],
        organic: false,
        fssaiVerified: true,
        lastActive: '1 hour ago',
        deliveryTime: '1-3 hours',
        minimumOrder: '₹150',
        paymentMethods: ['Cash', 'UPI'],
        specialOffers: [],
        supplierType: 'Retailer'
      },
      {
        id: 'existing_4',
        name: 'Sunita Sharma (Dairy Farm)',
        coordinates: [userLat + (Math.random() - 0.5) * 0.006, userLng + (Math.random() - 0.5) * 0.006],
        location: 'Sector 11, Chandigarh',
        address: 'Dairy Farm 12, Sector 11 - Fresh dairy products',
        distance: calculateDistance(userLat, userLng, userLat + (Math.random() - 0.5) * 0.006, userLng + (Math.random() - 0.5) * 0.006),
        rating: '4.5',
        trustScore: 88,
        price: '₹80/liter',
        products: [
          { name: 'Fresh Milk', price: '₹80/liter', image: '🥛' },
          { name: 'Curd', price: '₹60/kg', image: '🥛' },
          { name: 'Butter', price: '₹120/kg', image: '🧈' },
          { name: 'Cheese', price: '₹200/kg', image: '🧀' }
        ],
        organic: true,
        fssaiVerified: true,
        lastActive: '30 minutes ago',
        deliveryTime: '2-4 hours',
        minimumOrder: '₹250',
        paymentMethods: ['Cash', 'UPI', 'Card'],
        specialOffers: ['Buy 2 get 1 free on milk'],
        supplierType: 'Individual Farmer'
      },
      {
        id: 'existing_5',
        name: 'Deepak Joshi (Grain Supplier)',
        coordinates: [userLat + (Math.random() - 0.5) * 0.004, userLng + (Math.random() - 0.5) * 0.004],
        location: 'Sector 12, Chandigarh',
        address: 'Grain Store 45, Sector 12 - Quality grains and pulses',
        distance: calculateDistance(userLat, userLng, userLat + (Math.random() - 0.5) * 0.004, userLng + (Math.random() - 0.5) * 0.004),
        rating: '4.3',
        trustScore: 82,
        price: '₹50/kg',
        products: [
          { name: 'Basmati Rice', price: '₹50/kg', image: '🍚' },
          { name: 'Wheat Flour', price: '₹40/kg', image: '🌾' },
          { name: 'Red Lentils', price: '₹60/kg', image: '🫘' },
          { name: 'Chickpeas', price: '₹55/kg', image: '🫘' }
        ],
        organic: false,
        fssaiVerified: true,
        lastActive: '2 hours ago',
        deliveryTime: '4-6 hours',
        minimumOrder: '₹200',
        paymentMethods: ['Cash', 'UPI'],
        specialOffers: ['Bulk discount above 10kg'],
        supplierType: 'Wholesaler'
      },
      {
        id: 'existing_6',
        name: 'Meena Gupta (Fruit Garden)',
        coordinates: [userLat + (Math.random() - 0.5) * 0.007, userLng + (Math.random() - 0.5) * 0.007],
        location: 'Sector 13, Chandigarh',
        address: 'Fruit Garden 8, Sector 13 - Fresh seasonal fruits',
        distance: calculateDistance(userLat, userLng, userLat + (Math.random() - 0.5) * 0.007, userLng + (Math.random() - 0.5) * 0.007),
        rating: '4.6',
        trustScore: 90,
        price: '₹120/kg',
        products: [
          { name: 'Fresh Apples', price: '₹120/kg', image: '🍎' },
          { name: 'Sweet Bananas', price: '₹80/dozen', image: '🍌' },
          { name: 'Fresh Oranges', price: '₹100/kg', image: '🍊' },
          { name: 'Sweet Grapes', price: '₹150/kg', image: '🍇' }
        ],
        organic: true,
        fssaiVerified: true,
        lastActive: '45 minutes ago',
        deliveryTime: '3-5 hours',
        minimumOrder: '₹350',
        paymentMethods: ['UPI', 'Card'],
        specialOffers: ['Seasonal fruit basket discount'],
        supplierType: 'Cooperative'
      }
    ]

    // Filter existing suppliers by distance
    const nearbyExistingSuppliers = existingSuppliers.filter(supplier => 
      supplier.distance <= searchRadius
    )

    // Combine both supplier lists
    const combinedSuppliers = [...nearbyExistingSuppliers, ...allSuppliers]
    
    // Sort by distance and remove duplicates
    const uniqueSuppliers = combinedSuppliers.filter((supplier, index, self) => 
      index === self.findIndex(s => s.id === supplier.id)
    )
    
    return uniqueSuppliers.sort((a, b) => a.distance - b.distance)
  }

  const extractPrice = priceString => {
    if (!priceString) return 0
    const match = priceString.toString().match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }

  const getMinProductPrice = products => {
    if (!products || !Array.isArray(products) || products.length === 0) return 0

    const prices = products
      .map(p => {
        if (typeof p === 'object' && p.price) {
          return extractPrice(p.price)
        }
        return 0
      })
      .filter(price => price > 0)

    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    try {
      
      if (
        !supplier ||
        !supplier.name
      ) {
        return false
      }

      // Check if products exist and format them properly if needed
      let supplierProducts = supplier.products
      if (!supplierProducts || !Array.isArray(supplierProducts)) {
        // If products is missing or not an array, create a default product
        supplierProducts = [{ name: 'Fresh Produce', price: supplier.price || '₹50/kg', image: '🥬' }]
        supplier.products = supplierProducts
      }

      const nameMatches = supplier.name
        .toLowerCase()
        .includes(search.toLowerCase())
      const organicMatches = !organicOnly || supplier.organic
      const verifiedMatches = !verifiedOnly || supplier.fssaiVerified
      const ratingMatches = (supplier.rating || 0) >= minRating

      const price = extractPrice(supplier.price)
      const priceMatches = price >= minPrice && price <= maxPrice

      // Show suppliers within the specified radius
      const supplierDistance = supplier.distance || 0
      const distanceMatches = supplierDistance <= radius

      const result = (
        nameMatches &&
        distanceMatches &&
        organicMatches &&
        verifiedMatches &&
        ratingMatches &&
        priceMatches
      )
      
      return result
    } catch (error) {
      console.error('Error filtering supplier:', supplier, error)
      return false
    }
  })

  const getLocation = async () => {
    setIsGettingLocation(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      setIsGettingLocation(false)
      return
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      setUserLocation(newLocation)

      const nearbySuppliers = await generateNearbySuppliers(
        newLocation.lat,
        newLocation.lng,
        radius
      )

      if (!nearbySuppliers || nearbySuppliers.length === 0) {
        setError(
          'No suppliers found in your area. Try increasing the search radius.'
        )
      }

      setSuppliers(nearbySuppliers || [])
      setLocationDetected(true)
      alert(
        `Location detected! Found ${nearbySuppliers?.length || 0} suppliers within ${radius}km of your location.`
      )
    } catch (error) {
      console.error('Error getting location:', error)
      let errorMessage = 'Unable to get your location. '

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += 'Please allow location access in your browser.'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage += 'Location information is unavailable.'
          break
        case error.TIMEOUT:
          errorMessage += 'Location request timed out.'
          break
        default:
          errorMessage += 'Please check your browser permissions.'
          break
      }

      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setIsGettingLocation(false)
    }
  }

  useEffect(() => {
    const updateSuppliers = async () => {
      if (userLocation && locationDetected) {
        const nearbySuppliers = await generateNearbySuppliers(
          userLocation.lat,
          userLocation.lng,
          radius
        )
        setSuppliers(nearbySuppliers || [])
      }
    }
    updateSuppliers()
  }, [radius, userLocation, locationDetected])

  // Subscribe to product updates to refresh suppliers when products are added
  useEffect(() => {
    const unsubscribe = realTimeSync.subscribe('product_update', (data) => {
      console.log('Product update received in NearbySuppliers:', data)
      if (userLocation && locationDetected) {
        generateNearbySuppliers(userLocation.lat, userLocation.lng, radius).then(nearbySuppliers => {
          setSuppliers(nearbySuppliers || [])
        })
      }
    })
    
    return () => {
      unsubscribe()
    }
  }, [userLocation, locationDetected, radius])

  // Cart logic (unchanged)
  const addToCart = item => {
    setCart(prevCart => {
      const existingItem = prevCart.find(
        cartItem => cartItem.id === item.id
      )
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = id => {
    setCart(prevCart => prevCart.filter(item => item.id !== id))
  }

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = extractPrice(item.price)
      return total + price * item.quantity
    }, 0)
  }

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleAddToCart = supplier => {
    try {
      if (
        !supplier ||
        !supplier.products ||
        !Array.isArray(supplier.products) ||
        supplier.products.length === 0
      ) {
        alert('No products available from this supplier')
        return
      }

      supplier.products.forEach(product => {
        if (product && product.name) {
          const cartItem = {
            id: `${supplier.id}_${product.name}`,
            name: product.name,
            price: product.price || '₹0',
            image: product.image || '',
            supplier: supplier.name
          }
          addToCart(cartItem)
        }
      })
      alert(
        `${supplier.products.length} products from ${supplier.name} added to cart!`
      )
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Error adding products to cart')
    }
  }

  const indiaCenter = [20.5937, 78.9629]

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-600">Supplier Finder</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-green-100 text-green-600'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
          <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'map'
                ? 'bg-green-100 text-green-600'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MapIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {!locationDetected && !isGettingLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Location Not Detected
            </span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Click "Get My Location" to find nearby suppliers in your area
          </p>
        </div>
      )}

      {userLocation && locationDetected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Location Active</span>
            <span className="text-green-600 text-sm">
              ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
            </span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Found {suppliers.length} suppliers within {radius}km of your
            location
          </p>
        </div>
      )}

      {/* Search / Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={getLocation}
            disabled={isGettingLocation}
            className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors ${
              isGettingLocation ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <MapPin className="w-4 h-4" />
            {isGettingLocation ? 'Getting Location...' : 'Get My Location'}
          </button>
          <button
            onClick={() => {
              // Test supplier generation with Mumbai coordinates
              const testLat = 19.0760
              const testLng = 72.8777
              generateNearbySuppliers(testLat, testLng, radius).then(suppliers => {
                setSuppliers(suppliers || [])
                setUserLocation({ lat: testLat, lng: testLng })
                setLocationDetected(true)
              })
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            🧪 Test Suppliers
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radius ({radius} km)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRadius(Math.max(0, radius - 1))}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="flex-1 accent-green-600"
                />
                <button
                  onClick={() => setRadius(Math.min(25, radius + 1))}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Rating
              </label>
              <select
                value={minRating}
                onChange={e => setMinRating(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              >
                <option value={0}>Any Rating</option>
                <option value={3}>3+ Rating</option>
                <option value={4}>4+ Rating</option>
                <option value={4.5}>4.5+ Rating</option>
              </select>
            </div>
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
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
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
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                placeholder="100"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="organic"
                checked={organicOnly}
                onChange={e => setOrganicOnly(e.target.checked)}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="organic" className="text-sm">
                Organic Only
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="verified"
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="verified" className="text-sm">
                FSSAI Verified
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier List / Map */}
        <div className="lg:col-span-2">
          {viewMode === 'list' ? (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">
                  {locationDetected
                    ? `${filteredSuppliers.length} Suppliers Found`
                    : 'Nearby Suppliers'}
                </h2>
              </div>

              {!locationDetected && !isGettingLocation && (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No Location Detected
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Please click "Get My Location" to find suppliers near you
                  </p>
                </div>
              )}

              {isGettingLocation && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Detecting Your Location...
                  </h3>
                  <p className="text-gray-500">
                    Please allow location access in your browser
                  </p>
                </div>
              )}

              {locationDetected &&
                filteredSuppliers.length === 0 &&
                suppliers.length > 0 && (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      No Suppliers Match Filters
                    </h3>
                    <p className="text-gray-500 mb-4">
                      No suppliers match your current filters within {radius}km
                    </p>
                    <button
                      onClick={() => {
                        setSearch('')
                        setRadius(0)
                        setOrganicOnly(false)
                        setVerifiedOnly(false)
                        setMinRating(0)
                        setMinPrice(0)
                        setMaxPrice(100)
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

              {locationDetected && suppliers.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No Suppliers Found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    No suppliers found in your area. Try increasing the search
                    radius.
                  </p>
                  <button
                    onClick={() => setRadius(1)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Increase Search Radius
                  </button>
                </div>
              )}

              {locationDetected && filteredSuppliers.length > 0 && (
                <div className="divide-y">
                  {filteredSuppliers.map(supplier => (
                    <div
                      key={supplier.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">
                              {supplier.name}
                            </h3>
                            {supplier.fssaiVerified && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                FSSAI
                              </span>
                            )}
                            {supplier.organic && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                Organic
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span>{supplier.rating || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{supplier.distance.toFixed(1)} km</span>
                            </div>
                            <span className="text-green-600 font-medium">
                              Trust Score: {supplier.trustScore || 'N/A'}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {supplier.location}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            <span className="font-medium">Products:</span>{' '}
                            {supplier.products.map(p => p.name).join(', ')}
                          </div>
                          <div className="text-sm text-green-600 mb-2 font-medium">
                            Starting from: ₹{getMinProductPrice(supplier.products)}
                            /kg
                          </div>
                          <div className="text-xs text-gray-400">
                            Last active: {supplier.lastActive}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                            onClick={() => {
                              setSelectedSupplierForProducts(supplier)
                              setShowProductsModal(true)
                            }}
                          >
                            <span>📦</span>
                            Show Products
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // --------------------- REAL MAP VIEW ---------------------
            <div className="bg-white rounded-lg shadow-md p-4">
              {!locationDetected && !isGettingLocation && (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      No Location Detected
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Please click "Get My Location" to view suppliers on the
                      map
                    </p>
                  </div>
                </div>
              )}

              {isGettingLocation && (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Detecting Your Location...
                    </h3>
                    <p className="text-gray-500">
                      Please allow location access in your browser
                    </p>
                  </div>
                </div>
              )}

              {locationDetected && (
                <div className="h-[500px] rounded-lg overflow-hidden">
                  <MapContainer
                    center={
                      userLocation
                        ? [userLocation.lat, userLocation.lng]
                        : indiaCenter
                    }
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                  >
                    <ChangeView
                      center={
                        userLocation
                          ? [userLocation.lat, userLocation.lng]
                          : indiaCenter
                      }
                      zoom={13}
                    />
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* User marker + radius */}
                    {userLocation && (
                      <>
                        <Marker
                          position={[userLocation.lat, userLocation.lng]}
                        >
                          <Popup>You are here</Popup>
                        </Marker>
                        <Circle
                          center={[userLocation.lat, userLocation.lng]}
                          radius={radius * 1000}
                          pathOptions={{ color: 'green', fillOpacity: 0.1 }}
                        />
                      </>
                    )}

                    {/* Supplier markers */}
                    {filteredSuppliers.map(s => (
                      <Marker
                        key={s.id}
                        position={s.coordinates}
                        eventHandlers={{
                          click: () => setSelectedSupplier(s)
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-semibold">{s.name}</div>
                            <div className="text-gray-500">
                              {s.distance.toFixed(1)} km
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span>{s.rating}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              )}
            </div>
            // ---------------------------------------------------------
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location Tracker */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Location Tracker</h3>
            </div>

            <button
              onClick={getLocation}
              disabled={isGettingLocation}
              className={`w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 mb-4 transition-colors ${
                isGettingLocation ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <MapPin className="w-4 h-4" />
              {isGettingLocation ? 'Getting Location...' : 'Get My Location'}
            </button>

            {userLocation && (
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Your Location:</span>
                </div>
                <div className="text-gray-600">
                  Latitude: {userLocation.lat.toFixed(6)}
                </div>
                <div className="text-gray-600">
                  Longitude: {userLocation.lng.toFixed(6)}
                </div>
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Cart ({getCartCount()} items)
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded">
                    <div className="text-2xl">{item.image}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.supplier && (
                            <p className="text-xs text-gray-500">from {item.supplier}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium">{item.price}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded flex items-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-medium min-w-[20px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded flex items-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-red-500 hover:text-red-700 ml-auto transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹{getCartTotal()}</span>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mt-4 transition-colors">
                Proceed to Checkout
              </button>
            </div>
          )}

          {/* Selected Supplier Details */}
          {selectedSupplier && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Supplier Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-lg">{selectedSupplier.name}</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedSupplier.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{selectedSupplier.rating}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Distance:</span>
                    <p>{selectedSupplier.distance.toFixed(1)} km</p>
                  </div>
                  <div>
                    <span className="font-medium">Trust Score:</span>
                    <p>{selectedSupplier.trustScore}%</p>
                  </div>
                  <div>
                    <span className="font-medium">Last Active:</span>
                    <p>{selectedSupplier.lastActive}</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium">Products:</span>
                  <div className="mt-2 space-y-2">
                    {selectedSupplier.products.map((product, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{product.image || '🥬'}</span>
                          <span>{product.name || 'Unknown Product'}</span>
                        </div>
                        <span className="font-medium text-green-600">{product.price || '₹50/kg'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                    onClick={() => handleAddToCart(selectedSupplier)}
                  >
                    Add All to Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {locationDetected && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Search Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Suppliers:</span>
                  <span className="font-medium">{suppliers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtered Results:</span>
                  <span className="font-medium">{filteredSuppliers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Search Radius:</span>
                  <span className="font-medium">{radius} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Organic Suppliers:</span>
                  <span className="font-medium">{suppliers.filter(s => s.organic).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>FSSAI Verified:</span>
                  <span className="font-medium">{suppliers.filter(s => s.fssaiVerified).length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Modal - SHOWING ONLY PRODUCTS, NO REVIEWS */}
      {showProductsModal && selectedSupplierForProducts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header - Only supplier name */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                📦 Products from {selectedSupplierForProducts.name}
              </h3>
              <button
                onClick={() => {
                  setShowProductsModal(false)
                  setSelectedSupplierForProducts(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            
            {/* ONLY PRODUCTS - NO REVIEWS, NO SUPPLIER INFO */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🛍️ Available Products
              </h4>
              
              {/* Force display products - either real ones or fallback */}
              <div className="space-y-3">
                {/* Try to show real products first */}
                {selectedSupplierForProducts.products && 
                 Array.isArray(selectedSupplierForProducts.products) && 
                 selectedSupplierForProducts.products.length > 0 ? (
                  
                  selectedSupplierForProducts.products.map((product, index) => (
                    <div key={index} className="bg-white border-2 border-green-200 rounded-lg p-4 hover:border-green-300 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{product.image || '🥬'}</span>
                  <div>
                            <h5 className="text-lg font-bold text-gray-800">{product.name || 'Fresh Produce'}</h5>
                            <p className="text-sm text-gray-600">Premium quality, fresh from farm</p>
                  </div>
                  </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{product.price || '₹50/kg'}</p>
                          <p className="text-xs text-gray-500">per kilogram</p>
                    </div>
                  </div>
                  </div>
                  ))
                  
                ) : (
                  
                  /* Fallback products - always show these */
                  [
                    { name: 'Fresh Tomatoes', price: '₹45/kg', image: '🍅' },
                    { name: 'Organic Onions', price: '₹35/kg', image: '🧅' },
                    { name: 'Premium Potatoes', price: '₹30/kg', image: '🥔' },
                    { name: 'Fresh Carrots', price: '₹40/kg', image: '🥕' },
                    { name: 'Local Spinach', price: '₹50/kg', image: '🥬' }
                  ].map((product, index) => (
                    <div key={index} className="bg-white border-2 border-green-200 rounded-lg p-4 hover:border-green-300 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{product.image}</span>
              <div>
                            <h5 className="text-lg font-bold text-gray-800">{product.name}</h5>
                            <p className="text-sm text-gray-600">Premium quality, fresh from farm</p>
                        </div>
                      </div>
                      <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{product.price}</p>
                          <p className="text-xs text-gray-500">per kilogram</p>
                      </div>
                    </div>
                    </div>
                  ))
                )}
                </div>
              </div>

            {/* Action Button */}
            <div className="border-t pt-4">
                <button 
                className="w-full px-6 py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                  onClick={() => handleAddToCart(selectedSupplierForProducts)}
                >
                🛒 Add All Products to Cart
                </button>
              </div>
            
          </div>
        </div>
      )}
    </div>
  )
}

export default NearbySuppliers
