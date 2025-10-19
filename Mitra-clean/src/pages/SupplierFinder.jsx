import React, { useState, useEffect, useRef } from 'react'
import { useCart } from '../contexts/CartContext'
import { MapPin, Star, Search, Filter, Map, ShoppingCart, MessageSquare } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import NearbySuppliers from '../components/SupplierFinder/NearbySuppliers'
import TrustScore from '../components/Rating/TrustScore'
import Negotiation from '../components/Bargain/Negotiation'
import ReviewSystem from '../components/Rating/ReviewSystem'
import { generateNearbySuppliers, calculateDistance, getRegionFromCoordinates } from '../data/suppliersDatabase'
import realTimeSync from '../utils/realTimeSync'

// Fix for default markers in react-leaflet
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const SupplierFinder = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [radius, setRadius] = useState(0)
  const [organicOnly, setOrganicOnly] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100)
  const [minPrice, setMinPrice] = useState(0)
  const [viewMode, setViewMode] = useState('map') // 'list' or 'map' - default to map
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [showBargain, setShowBargain] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [locationDetected, setLocationDetected] = useState(false)
  const [error, setError] = useState(null) // Add error state
  const [showReviews, setShowReviews] = useState(false)
  const [selectedSupplierForReview, setSelectedSupplierForReview] = useState(null)
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState(null)
  const mapRef = useRef(null)

  // Add debugging for suppliers array
  useEffect(() => {
    console.log('Suppliers state updated:', suppliers)
    console.log('Location detected:', locationDetected)
  }, [suppliers, locationDetected])

  // Regenerate suppliers when radius changes and location is detected
  useEffect(() => {
    if (userLocation && locationDetected) {
      const nearbySuppliers = generateNearbySuppliers(userLocation.lat, userLocation.lng, radius)
      setSuppliers(nearbySuppliers || [])
    }
  }, [radius, userLocation, locationDetected])

  // Subscribe to product updates to refresh suppliers when products are added
  useEffect(() => {
    const unsubscribe = realTimeSync.subscribe('product_update', (data) => {
      console.log('Product update received in SupplierFinder:', data)
      if (userLocation && locationDetected) {
        const nearbySuppliers = generateNearbySuppliers(userLocation.lat, userLocation.lng, radius)
        setSuppliers(nearbySuppliers || [])
      }
    })
    
    return () => {
      unsubscribe()
    }
  }, [userLocation, locationDetected, radius])

  // Helper function to safely extract price
  const extractPrice = (priceString) => {
    if (!priceString) return 0
    const match = priceString.toString().match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }

  // Helper function to get minimum product price
  const getMinProductPrice = (products) => {
    if (!products || !Array.isArray(products) || products.length === 0) return 0
    
    const prices = products.map(p => {
      // Handle different product structures
      if (typeof p === 'object' && p.price) {
        return extractPrice(p.price)
      } else if (typeof p === 'string') {
        // If product is just a string, return 0 as we don't have price info
        return 0
      }
      return 0
    }).filter(price => price > 0)
    
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    try {
      // Validate supplier object structure
      if (!supplier || !supplier.name || !supplier.products || !Array.isArray(supplier.products)) {
        console.warn('Invalid supplier object:', supplier)
        return false
      }

      const nameMatches = supplier.name.toLowerCase().includes(search.toLowerCase())
      const organicMatches = !organicOnly || supplier.organic
      const verifiedMatches = !verifiedOnly || supplier.fssaiVerified
      const ratingMatches = (supplier.rating || 0) >= minRating
      
      // Extract price from supplier.price (e.g., "₹40/kg" -> 40)
      const price = extractPrice(supplier.price)
      const priceMatches = price >= minPrice && price <= maxPrice
      
      // Calculate distance if user location is available
      let distanceMatches = true
      if (userLocation && supplier.coordinates && Array.isArray(supplier.coordinates) && supplier.coordinates.length >= 2) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          supplier.coordinates[0],
          supplier.coordinates[1]
        )
        distanceMatches = distance <= radius
      } else {
        // If no user location, use the default distance
        const supplierDistance = supplier.distance || 0
        distanceMatches = supplierDistance <= radius
      }
      
      return nameMatches && distanceMatches && organicMatches && verifiedMatches && ratingMatches && priceMatches
    } catch (error) {
      console.error('Error filtering supplier:', supplier, error)
      return false
    }
  })

  const getLocation = async () => {
    console.log('getLocation called')
    setIsGettingLocation(true)
    setError(null)
    // DON'T clear suppliers here - keep existing ones until new ones arrive
    
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
      
      console.log('New location obtained:', newLocation)
      setUserLocation(newLocation)
      
      // Update map center to user location
      if (mapRef.current && mapRef.current._map) {
        mapRef.current._map.setView([newLocation.lat, newLocation.lng], 12)
      }
      
      // Generate nearby suppliers based on user location
      const nearbySuppliers = generateNearbySuppliers(newLocation.lat, newLocation.lng, radius)
      console.log('Generated suppliers:', nearbySuppliers)
      console.log('First supplier structure:', nearbySuppliers[0])
      
      if (!nearbySuppliers || nearbySuppliers.length === 0) {
        console.warn('No suppliers generated')
        setError('No suppliers found in your area. Try increasing the search radius.')
      }
      
      // Set suppliers and location detected together
      setSuppliers(nearbySuppliers || [])
      setLocationDetected(true)
      
      // Show success message
      const region = getRegionFromCoordinates(newLocation.lat, newLocation.lng)
      const regionName = {
        mumbai: 'Mumbai',
        naviMumbai: 'Navi Mumbai', 
        thane: 'Thane',
        pune: 'Pune',
        default: 'your area'
      }[region]
      
      alert(`Location detected in ${regionName}! Found ${nearbySuppliers?.length || 0} suppliers within ${radius}km of your location.`)
      
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

  // Update suppliers when radius changes and location is detected
  useEffect(() => {
    if (userLocation && locationDetected) {
      console.log('Updating suppliers due to radius change:', radius)
      const nearbySuppliers = generateNearbySuppliers(userLocation.lat, userLocation.lng, radius)
      setSuppliers(nearbySuppliers || [])
    }
  }, [radius, userLocation, locationDetected])

  const handleAddToCart = (supplier) => {
    try {
      if (!supplier || !supplier.products || !Array.isArray(supplier.products) || supplier.products.length === 0) {
        alert('No products available from this supplier')
        return
      }

      // Add all products from the supplier to cart
      let addedCount = 0
      supplier.products.forEach(product => {
        if (product) {
          // Handle both string products and object products
          const productName = typeof product === 'string' ? product : product.name
          const productPrice = typeof product === 'string' ? supplier.price : (product.price || supplier.price)
          
          const cartItem = {
            id: `${supplier.id}_${productName}`,
            name: productName,
            price: productPrice || '₹0',
            image: typeof product === 'object' ? (product.image || '') : '',
            supplier: supplier.name,
            quantity: 1
          }
          addToCart(cartItem)
          addedCount++
        }
      })
      
      // Show success message instead of navigating away
      alert(`${addedCount} products from ${supplier.name} added to cart!`)
      
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Error adding products to cart')
    }
  }

  const startBargain = (supplier) => {
    setSelectedSupplier(supplier)
    setShowBargain(true)
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-600">Supplier Finder</h1>
      </div>

      {/* Error Display - only show if no suppliers found */}
      {error && filteredSuppliers.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Location Status */}
      {!locationDetected && !isGettingLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Location Not Detected</span>
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
            Found {suppliers.length} suppliers within {radius}km of your location
          </p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search suppliers"
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
          <button
            onClick={getLocation}
            disabled={isGettingLocation}
            className={`btn-primary flex items-center gap-2 ${isGettingLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <MapPin className="w-4 h-4" />
            {isGettingLocation ? 'Getting Location...' : 'Get My Location'}
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
                  className="flex-1"
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
                className="input-field"
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
                placeholder="100"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="organic"
                checked={organicOnly}
                onChange={e => setOrganicOnly(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="organic">Organic Only</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="verified"
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="verified">Verified Only</label>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4">
            {!locationDetected && !isGettingLocation && (
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Location Detected</h3>
                  <p className="text-gray-500 mb-4">Please click "Get My Location" to view suppliers on the map</p>
                </div>
              </div>
            )}
            
            {isGettingLocation && (
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Detecting Your Location...</h3>
                  <p className="text-gray-500">Please allow location access in your browser</p>
                </div>
              </div>
            )}
            
            {locationDetected && (
              <div className="relative">
                {/* Map Controls - Keep only location center button */}
                <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-2">
                  <button 
                    onClick={() => {
                      if (userLocation && mapRef.current) {
                        mapRef.current.setView([userLocation.lat, userLocation.lng], 13)
                      }
                    }}
                    className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                    title="Center on your location"
                  >
                    📍
                  </button>
                </div>
                
                {/* Map Info */}
                <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Your Location</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Suppliers ({filteredSuppliers.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full opacity-20"></div>
                      <span>Search Radius ({radius}km)</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[600px] rounded-lg overflow-hidden border">
                  <MapContainer 
                    ref={mapRef}
                    center={userLocation ? [userLocation.lat, userLocation.lng] : [19.0760, 72.8777]} 
                    zoom={userLocation ? 13 : 10} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* User Location Marker with Blue Circle */}
                    {userLocation && (
                      <>
                        <Marker 
                          position={[userLocation.lat, userLocation.lng]}
                          icon={L.divIcon({
                            className: 'custom-div-icon',
                            html: '<div style="background-color: #3B82F6; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 15px rgba(59,130,246,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">📍</div>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                          })}
                        >
                          <Popup>
                            <div className="text-center">
                              <h3 className="font-bold text-blue-600">📍 Your Location</h3>
                              <p className="text-sm text-gray-600">Lat: {userLocation.lat.toFixed(6)}</p>
                              <p className="text-sm text-gray-600">Lng: {userLocation.lng.toFixed(6)}</p>
                            </div>
                          </Popup>
                        </Marker>
                        
                        {/* Search Radius Circle */}
                        <Circle
                          center={[userLocation.lat, userLocation.lng]}
                          radius={radius * 1000}
                          pathOptions={{
                            color: '#3B82F6',
                            fillColor: '#3B82F6',
                            fillOpacity: 0.1,
                            weight: 2
                          }}
                        />
                      </>
                    )}
                    
                    {/* Supplier Markers */}
                    {filteredSuppliers.map(supplier => {
                      // Calculate actual distance if user location is available
                      let actualDistance = supplier.distance || 0
                      if (userLocation && supplier.coordinates && supplier.coordinates.length >= 2) {
                        actualDistance = calculateDistance(
                          userLocation.lat,
                          userLocation.lng,
                          supplier.coordinates[0],
                          supplier.coordinates[1]
                        )
                      }
                      
                      return (
                        <Marker 
                          key={supplier.id} 
                          position={supplier.coordinates}
                          icon={L.divIcon({
                            className: 'supplier-marker',
                            html: `<div style="background-color: #10B981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">🏪</div>`,
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
                          })}
                        >
                          <Popup>
                            <div className="min-w-[250px] max-w-[300px]">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-lg text-green-600">{supplier.name}</h3>
                                {supplier.fssaiVerified && (
                                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">FSSAI</span>
                                )}
                                {supplier.organic && (
                                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Organic</span>
                                )}
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-500">⭐</span>
                                  <span><strong>Rating:</strong> {supplier.rating || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-500">📍</span>
                                  <span><strong>Distance:</strong> {actualDistance.toFixed(1)} km</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-green-500">💰</span>
                                  <span><strong>Starting from:</strong> ₹{getMinProductPrice(supplier.products) || extractPrice(supplier.price) || 'N/A'}/kg</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">🏠</span>
                                  <span><strong>Location:</strong> {supplier.location || supplier.address || 'Location not specified'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-500">🛒</span>
                                  <span><strong>Products:</strong> {supplier.products && supplier.products.length > 0 
                                    ? supplier.products.slice(0, 3).map(p => typeof p === 'object' ? p.name : p).filter(name => name && name.trim()).join(', ')
                                    : 'No products listed'
                                  }</span>
                                </div>
                              </div>
                              
                              <div className="mt-4 space-y-2">
                                <button 
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded transition-colors flex items-center gap-1 justify-center"
                                  onClick={() => {
                                    setSelectedSupplierForProducts(supplier)
                                    setShowProductsModal(true)
                                  }}
                                >
                                  <span>📦</span>
                                  Show Products
                                </button>
                                <button 
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded transition-colors"
                                >
                                  Bargain
                                </button>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    })}
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier List */}
          {locationDetected && filteredSuppliers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Nearby Suppliers ({filteredSuppliers.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredSuppliers.map(supplier => {
                  // Calculate actual distance if user location is available
                  let actualDistance = supplier.distance || 0
                  if (userLocation && supplier.coordinates && supplier.coordinates.length >= 2) {
                    actualDistance = calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      supplier.coordinates[0],
                      supplier.coordinates[1]
                    )
                  }
                  
                  return (
                    <div key={supplier.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                          <p className="text-sm text-gray-600">{supplier.location}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {supplier.fssaiVerified && (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">FSSAI</span>
                          )}
                          {supplier.organic && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Organic</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span>{supplier.rating || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-blue-500">📍</span>
                          <span>{actualDistance.toFixed(1)} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">💰</span>
                          <span>₹{getMinProductPrice(supplier.products) || extractPrice(supplier.price) || 'N/A'}/kg</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-orange-500">🛒</span>
                          <span>{supplier.products?.length || 0} products</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded transition-colors flex items-center gap-1 justify-center"
                          onClick={() => {
                            setSelectedSupplierForProducts(supplier)
                            setShowProductsModal(true)
                          }}
                        >
                          <span>📦</span>
                          Show Products
                        </button>
                        <button 
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded transition-colors"
                        >
                          Bargain
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selected Supplier Details */}
          {selectedSupplier && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Supplier Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{selectedSupplier.name}</h4>
                  <p className="text-sm text-gray-600">{selectedSupplier.location}</p>
                </div>
                
                {/* Trust Score Component */}
                <TrustScore supplierId={selectedSupplier.id} />
                
                {/* Negotiation Component */}
                {showBargain && selectedSupplier && (
                  <Negotiation 
                    initialOffer={parseInt(selectedSupplier.price.replace(/[^\d]/g, ''))} 
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Modal - SHOWING ONLY PRODUCTS, NO REVIEWS */}
      {showProductsModal && selectedSupplierForProducts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
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
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{product.price || '₹50/kg'}</p>
                            <p className="text-xs text-gray-500">per kilogram</p>
                          </div>
                          <button 
                            className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                            onClick={() => {
                              alert(`${product.name || 'Product'} added to cart!`)
                            }}
                          >
                            🛒 Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                  
                ) : (
                  
                  /* Fallback products - ACTUAL INDIAN VENDOR PRODUCTS (no tea/coffee) */
                  [
                    { name: 'Fresh Tomatoes', price: '₹45/kg', image: '🍅' },
                    { name: 'Organic Onions', price: '₹35/kg', image: '🧅' },
                    { name: 'Premium Potatoes', price: '₹30/kg', image: '🥔' },
                    { name: 'Fresh Carrots', price: '₹40/kg', image: '🥕' },
                    { name: 'Local Spinach', price: '₹50/kg', image: '🥬' },
                    { name: 'Green Peas', price: '₹60/kg', image: '🫛' },
                    { name: 'Cauliflower', price: '₹25/kg', image: '🥦' },
                    { name: 'Brinjal (Eggplant)', price: '₹40/kg', image: '🍆' },
                    { name: 'Cucumber', price: '₹30/kg', image: '🥒' },
                    { name: 'Bell Peppers', price: '₹80/kg', image: '🫑' },
                    { name: 'Ginger', price: '₹120/kg', image: '🫘' },
                    { name: 'Garlic', price: '₹100/kg', image: '🧄' },
                    { name: 'Coriander Leaves', price: '₹40/kg', image: '🌿' },
                    { name: 'Mint Leaves', price: '₹60/kg', image: '🌱' },
                    { name: 'Lemon', price: '₹80/kg', image: '🍋' }
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
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{product.price}</p>
                            <p className="text-xs text-gray-500">per kilogram</p>
                          </div>
                          <button 
                            className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                            onClick={() => {
                              alert(`${product.name} added to cart!`)
                            }}
                          >
                            🛒 Add
                          </button>
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
                onClick={() => {
                  // Add to cart functionality
                  alert('Products added to cart!')
                  setShowProductsModal(false)
                  setSelectedSupplierForProducts(null)
                }}
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

export default SupplierFinder