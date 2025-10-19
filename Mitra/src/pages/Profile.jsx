import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Save, Edit, Camera, MapPin, Phone, Mail, User, Award, Star, Package, Clock, MessageSquare, LogOut } from 'lucide-react'
import LicenseVerification from '../components/FSSAI/LicenseVerification'
import { deliveriesDatabase, reviewsDatabase } from '../data/userDatabase'
import ReviewSystem from '../components/Rating/ReviewSystem'
import realTimeSync from '../utils/realTimeSync'

const Profile = () => {
  const { user, updateProfile, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [showFssaiVerification, setShowFssaiVerification] = useState(false)
  const [recentOrders, setRecentOrders] = useState([])
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null)
  const [selectedProductForReview, setSelectedProductForReview] = useState(null)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    fssaiLicense: user?.fssaiLicense || '',
    businessName: user?.businessName || '',
    businessType: user?.businessType || '',
    description: user?.description || ''
  })

  // Ensure we don't display duplicate orders (may exist in storage from older sessions)
  const uniqueOrders = (orders) => {
    // Collapse orders with the same normalized product set for the same day into a single, most-recent entry
    const byKey = new Map()
    for (const o of orders) {
      const day = o.orderDate ? new Date(o.orderDate).toDateString() : (o.deliveryDate ? new Date(o.deliveryDate).toDateString() : '')
      const productsStr = Array.isArray(o.products)
        ? o.products.map(p => {
            const name = typeof p === 'object' ? (p.name || 'Item') : String(p)
            const normalizedName = name.replace(/\s*\(demo\)\s*/i, '')
            const qty = typeof p === 'object' ? (p.quantity || 1) : 1
            return `${normalizedName}:${qty}`
          }).join('|')
        : String(o.products || '')
      const key = `${o.supplierId}|${o.customerId}|${productsStr}|${day}`
      const existing = byKey.get(key)
      const existingTs = existing ? new Date(existing.orderDate || existing.id).getTime() : -Infinity
      const currentTs = new Date(o.orderDate || o.id).getTime()
      if (!existing || currentTs > existingTs) {
        byKey.set(key, o)
      }
    }
    return Array.from(byKey.values())
  }

  // Load recent orders from database
  useEffect(() => {
    if (user?.id) {
      const orders = uniqueOrders(deliveriesDatabase.getDeliveriesByVendor(user.id))
      // Sort orders by creation date (newest first)
      const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.orderDate || a.id)
        const dateB = new Date(b.orderDate || b.id)
        return dateB - dateA
      })
      setRecentOrders(sortedOrders)
    }
  }, [user?.id])

  // Listen for real-time order and delivery updates
  useEffect(() => {
    if (!user?.id) return

    let refreshTimeout
    let lastRefreshTime = 0
    
    const refreshOrders = () => {
      const now = Date.now()
      // Prevent too frequent refreshes (max once per 200ms)
      if (now - lastRefreshTime < 200) {
        clearTimeout(refreshTimeout)
        refreshTimeout = setTimeout(refreshOrders, 200)
        return
      }
      
      lastRefreshTime = now
      const orders = uniqueOrders(deliveriesDatabase.getDeliveriesByVendor(user.id))
      const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.orderDate || a.id)
        const dateB = new Date(b.orderDate || b.id)
        return dateB - dateA
      })
      
      // Only update if orders actually changed
      setRecentOrders(prevOrders => {
        if (JSON.stringify(prevOrders) === JSON.stringify(sortedOrders)) {
          return prevOrders // No change, don't trigger re-render
        }
        return sortedOrders
      })
    }

    // Listen to stock updates for new purchases
    const unsubscribePurchase = realTimeSync.subscribe('stock_update', (data) => {
      if (data.action === 'purchase' && data.vendorId === user.id) {
        refreshOrders()
      }
    })

    // Listen for delivery status changes (like delivered status updates)
    const unsubscribeDelivery = realTimeSync.subscribe('delivery_update', (data) => {
      if (data.vendorId === user.id || data.customerId === user.id) {
        refreshOrders()
      }
    })

    return () => {
      clearTimeout(refreshTimeout)
      unsubscribePurchase()
      unsubscribeDelivery()
    }
  }, [user?.id])

  // Check if user has already reviewed a specific product
  const hasReviewedProduct = (productId) => {
    if (!user?.id) return false
    const existingReviews = reviewsDatabase.getReviewsByProduct(productId)
    return existingReviews.some(review => review.vendorId === user.id)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    updateProfile(profileData)
    setEditing(false)
  }

  const handleReviewSubmit = (review) => {
    console.log('Review submitted:', review)
    // Refresh orders to update review status
    if (user?.id) {
      const orders = uniqueOrders(deliveriesDatabase.getDeliveriesByVendor(user.id))
      const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.orderDate || a.id)
        const dateB = new Date(b.orderDate || b.id)
        return dateB - dateA
      })
      setRecentOrders(sortedOrders)
    }
    setSelectedOrderForReview(null)
    setSelectedProductForReview(null)
  }

  const handleProductReviewSubmit = (review) => {
    console.log('Product review submitted:', review)
    // Refresh orders to update review status
    if (user?.id) {
      const orders = deliveriesDatabase.getDeliveriesByVendor(user.id)
      const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.orderDate || a.id)
        const dateB = new Date(b.orderDate || b.id)
        return dateB - dateA
      })
      setRecentOrders(sortedOrders)
    }
    setSelectedProductForReview(null)
  }

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👤 My Profile</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your account settings</p>
          </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing(!editing)}
            className="btn-secondary flex items-center gap-2"
          >
            {editing ? 'Cancel' : <Edit className="w-4 h-4" />}
            {editing ? '' : 'Edit Profile'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <User className="w-6 h-6 text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input-field"
                  />
                ) : (
                  <div className="text-gray-900">{user.name}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="text-gray-900">{user.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="input-field"
                  />
                ) : (
                  <div className="text-gray-900">{user.phone || 'Not provided'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                {editing ? (
                  <textarea
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="input-field"
                    rows="3"
                  />
                ) : (
                  <div className="text-gray-900">{user.address || 'Not provided'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Business Information */}
          {user.type === 'supplier' && (
            <div className="card">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profileData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className="input-field"
                    />
                  ) : (
                    <div className="text-gray-900">{user.businessName || 'Not provided'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  {editing ? (
                    <select
                      value={profileData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Type</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="distribution">Distribution</option>
                    </select>
                  ) : (
                    <div className="text-gray-900">{user.businessType || 'Not specified'}</div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Description
                  </label>
                  {editing ? (
                    <textarea
                      value={profileData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="input-field"
                      rows="3"
                    />
                  ) : (
                    <div className="text-gray-900">{user.description || 'No description'}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FSSAI Verification removed as per request */}

          {editing && (
            <div className="flex gap-4">
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Recent Orders Section - Only show for vendors, not suppliers */}
        {user?.type !== 'supplier' && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Package className="w-6 h-6 text-blue-600" />
            Recent Orders
          </h3>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No orders yet</p>
                <p className="text-sm">Your recent orders will appear here</p>
              </div>
            ) : (
              recentOrders.slice(0, 5).map((order, orderIndex) => (
                <div key={`${order.id}-${order.orderDate}-${orderIndex}`} className="border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        Order #{order.orderId || order.id}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">from {order.supplier}</p>
                      
                      {/* Products List */}
                      <div className="space-y-3">
                        {order.products && Array.isArray(order.products) ? (
                          order.products.map((product, index) => {
                            const productName = typeof product === 'string' ? product : product.name || 'Item'
                            const productQuantity = typeof product === 'object' ? product.quantity || 1 : 1
                            const productUnit = typeof product === 'object' ? product.unit || 'kg' : 'kg'
                            const productPrice = typeof product === 'object' ? product.price : null
                            const productImage = typeof product === 'object' ? product.image : null
                            
                            return (
                              <div key={`${order.id}-product-${index}-${productName}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                {/* Product Image */}
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                  {productImage ? (
                                    <img 
                                      src={productImage} 
                                      alt={productName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.nextSibling.style.display = 'flex'
                                      }}
                                    />
                                  ) : null}
                                  <div className="w-full h-12 bg-gray-300 flex items-center justify-center text-lg text-gray-500" style={{display: productImage ? 'none' : 'flex'}}>
                                    📦
                                  </div>
                                </div>
                                
                                {/* Product Details */}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">
                                      {productQuantity} {productUnit} {productName}
                                    </span>
                                    {productPrice && (
                                      <span className="text-sm text-gray-600">₹{productPrice}</span>
                                    )}
                                  </div>
                                  
                                  {/* Write Review Button for delivered orders */}
                                  {order.status === 'delivered' && order.supplierId && (
                                    <button
                                      onClick={() => {
                                        // Create unique product ID for this product
                                        const productId = product.id || `${order.supplierId}_${productName}`
                                        setSelectedProductForReview({
                                          id: productId,
                                          name: productName,
                                          ...product,
                                          orderId: order.orderId || order.id,
                                          supplierId: order.supplierId,
                                          supplierName: order.supplier
                                        })
                                      }}
                                      className={`text-sm px-3 py-1 rounded-md font-medium mt-2 transition-colors ${
                                        hasReviewedProduct(product.id || `${order.supplierId}_${productName}`)
                                          ? 'bg-gray-400 text-white cursor-not-allowed'
                                          : 'bg-green-600 hover:bg-green-700 text-white'
                                      }`}
                                      disabled={hasReviewedProduct(product.id || `${order.supplierId}_${productName}`)}
                                    >
                                      {hasReviewedProduct(product.id || `${order.supplierId}_${productName}`) 
                                        ? '✓ Reviewed' 
                                        : '✍️ Write Review'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-sm text-gray-700">
                            {order.products || 'Order Items'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.totalAmount}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : order.status === 'in-transit'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'Recent'}</span>
                    <span>Order ID: {order.orderId || order.id}</span>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
        )}

      </div>

      {/* Review Modal for Individual Products */}
      {selectedProductForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Review {selectedProductForReview.name}
              </h3>
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
              supplierName={selectedProductForReview.supplierName}
              onClose={() => setSelectedProductForReview(null)}
              onSubmit={handleProductReviewSubmit}
              readOnly={false}
            />
          </div>
        </div>
      )}

      {/* FSSAI Verification Modal */}
      {showFssaiVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">FSSAI License Verification</h3>
            <LicenseVerification 
              onVerify={(license) => {
                updateProfile({ fssaiLicense: license, fssaiVerified: true })
                setShowFssaiVerification(false)
              }}
            />
            <button
              onClick={() => setShowFssaiVerification(false)}
              className="w-full btn-secondary mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Profile 