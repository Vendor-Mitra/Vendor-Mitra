import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProducts } from '../contexts/ProductContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useSearchParams } from 'react-router-dom'
import { flashSalesDatabase, reviewsDatabase, bargainsDatabase, deliveriesDatabase } from '../data/userDatabase'
import ImageUpload from '../components/ImageUpload'
import FlashSaleTimer from '../components/FlashSales/FlashSaleTimer'
import Negotiation from '../components/Bargain/Negotiation'
import productApi from '../services/productApi'
import realTimeSync from '../utils/realTimeSync'
import { 
  Package, 
  Shield, 
  MessageSquare, 
  Zap, 
  Star, 
  Truck, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Save,
  X
} from 'lucide-react'

export default function SupplierDashboard() {
  const { user } = useAuth()
  const { products: allProducts, addProduct, updateProduct, deleteProduct, getProductsBySupplier, loading: productsLoading } = useProducts()
  const { bargainNotifications } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [bargains, setBargains] = useState([])
  const [reviews, setReviews] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [flashSales, setFlashSales] = useState([])
  const [finalizingOrderId, setFinalizingOrderId] = useState(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddFlashSale, setShowAddFlashSale] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingFlashSale, setEditingFlashSale] = useState(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    quantity: '',
    unit: 'kg',
    description: '',
    image: '',
    isOrganic: false,
    licenseNumber: '',
    isVerified: false,
    category: 'vegetables'
  })


  const [newFlashSale, setNewFlashSale] = useState({
    product: '',
    oldPrice: '',
    newPrice: '',
    discount: '',
    totalQuantity: '',
    quantityUnit: 'kg',
    durationDays: '',
    durationHours: '',
    durationMinutes: '',
    image: ''
  })

  const [selectedBargain, setSelectedBargain] = useState(null)

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['products', 'bargains', 'flashsales', 'reviews', 'deliveries'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])


  // Load data with real-time sync
  useEffect(() => {
    if (user && user.id) {
      const loadData = () => {
        try {
          const userBargains = bargainsDatabase.getBargainsBySupplier(user.id)
          console.log('📦 Supplier loading bargains for supplier ID:', user.id)
          console.log('📦 Found bargains:', userBargains.length, userBargains)
          // Sort: newest first
          const sorted = userBargains.sort((a, b) => b.id - a.id)
          setBargains(sorted)
          
          const userReviews = reviewsDatabase.getReviewsBySupplier(user.id)
          setReviews(userReviews)
          
          const userDeliveries = deliveriesDatabase.getDeliveriesBySupplier(user.id)
          // Extra UI-level de-duplication guard (by orderId, or by signature)
          const uniqueBySignature = userDeliveries.reduce((acc, cur) => {
            const signature = cur.orderId || `${cur.supplierId}|${cur.customerId}|${cur.totalAmount}|${(Array.isArray(cur.products)?cur.products.join(','):cur.products)||''}`
            const existing = acc.get(signature)
            if (!existing || cur.id > existing.id) {
              acc.set(signature, cur)
            }
            return acc
          }, new Map())
          // Newest first
          const dedupedSorted = Array.from(uniqueBySignature.values()).sort((a, b) => (b.id || 0) - (a.id || 0))
          setDeliveries(dedupedSorted)
          
          const userFlashSales = flashSalesDatabase.getFlashSalesBySupplier(user.id)
          setFlashSales(userFlashSales)
        } catch (error) {
          console.error('Error loading supplier data:', error)
        }
      }

      loadData()

      // Subscribe to real-time updates
      const unsubscribeBargain = realTimeSync.subscribe('bargain_update', (data) => {
        if (data && data.supplierId === user.id) {
          const userBargains = bargainsDatabase.getBargainsBySupplier(user.id)
          // Sort: newest first
          const sorted = userBargains.sort((a, b) => b.id - a.id)
          setBargains(sorted)
          
          // Update selected bargain if it's currently open
          if (selectedBargain && data.bargain && selectedBargain.id === data.bargain.id) {
            setSelectedBargain(data.bargain)
          }
        }
      })

      const unsubscribeReview = realTimeSync.subscribe('review_update', (data) => {
        if (data && data.supplierId === user.id) {
          const userReviews = reviewsDatabase.getReviewsBySupplier(user.id)
          setReviews(userReviews)
        }
      })

      const unsubscribeFlashSale = realTimeSync.subscribe('flash_sale_update', (data) => {
        console.log('SupplierDashboard: flash_sale_update received', data)
        if (data && Number(data.supplierId) === Number(user.id)) {
          console.log('SupplierDashboard: Reloading flash sales for supplier', user.id)
          const userFlashSales = flashSalesDatabase.getFlashSalesBySupplier(user.id)
          console.log('SupplierDashboard: Updated flash sales:', userFlashSales.map(s => ({ id: s.id, product: s.product, sold: s.sold, total: s.total })))
          setFlashSales(userFlashSales)
        }
      })

      const unsubscribeDelivery = realTimeSync.subscribe('delivery_update', (data) => {
        if (data && data.delivery && Number(data.delivery.supplierId) === Number(user.id)) {
          const userDeliveries = deliveriesDatabase.getDeliveriesBySupplier(user.id)
          setDeliveries(userDeliveries)
        }
      })

      return () => {
        unsubscribeBargain()
        unsubscribeReview()
        unsubscribeFlashSale()
        unsubscribeDelivery()
      }
    }
  }, [user])

  // Load products from ProductContext - only when allProducts changes
  useEffect(() => {
    if (user && user.id) {
      const userProducts = getProductsBySupplier(user.id)
      console.log('Loading products for supplier from context:', user.id, userProducts)
      
      // Remove duplicates by ID before setting
      const uniqueProducts = userProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      )
      
      setProducts(uniqueProducts)
    }
  }, [user, allProducts, getProductsBySupplier])


  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity,
      unit: product.unit || 'kg',
      description: product.description,
      image: product.image,
      isOrganic: product.isOrganic,
      licenseNumber: product.licenseNumber || '',
      isVerified: product.isVerified,
      category: product.category || 'vegetables'
    })
    setShowAddProduct(true)
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity || !newProduct.unit) {
      alert('Please fill all required fields')
      return
    }

    const productData = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      quantity: parseInt(newProduct.quantity),
      stock: parseInt(newProduct.quantity),
      supplierId: user.id,
      supplierName: user.name,
      supplierRating: user.rating || 4.5,
      image: newProduct.image || '🥬',
      category: newProduct.category || 'vegetables'
    }

    const addedProduct = await addProduct(productData)
    console.log('Product added via API:', addedProduct)
    console.log('Product data sent:', productData)
    
    if (addedProduct) {
      // Don't manually update local state - let ProductContext real-time sync handle it
      alert('Product added successfully!')
    } else {
      alert('Failed to add product. Please try again.')
    }

    setNewProduct({
      name: '',
      price: '',
      quantity: '',
      unit: 'kg',
      description: '',
      category: 'vegetables',
      isOrganic: false
    })
    setShowAddProduct(false)
  }

  const handleUpdateProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity || !newProduct.unit) {
      alert('Please fill all required fields')
      return
    }

    const updatedData = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      quantity: parseInt(newProduct.quantity),
      stock: parseInt(newProduct.quantity),
      unit: newProduct.unit,
      description: newProduct.description,
      image: newProduct.image || editingProduct.image,
      isOrganic: newProduct.isOrganic,
      licenseNumber: newProduct.isOrganic ? null : newProduct.licenseNumber,
      isVerified: newProduct.isOrganic ? true : newProduct.isVerified,
      category: newProduct.category
    }

    const updated = await updateProduct(editingProduct.id, updatedData)
    if (updated) {
      // Don't manually update local state - let ProductContext real-time sync handle it
      alert('Product updated successfully!')
    }

    setNewProduct({
      name: '',
      price: '',
      quantity: '',
      description: '',
      image: '',
      isOrganic: false,
      licenseNumber: '',
      isVerified: false,
      category: 'vegetables'
    })
    setShowAddProduct(false)
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const deleted = await deleteProduct(productId)
      if (deleted) {
        // Don't manually update local state - let ProductContext real-time sync handle it
        alert('Product deleted successfully!')
      } else {
        alert('Failed to delete product')
      }
    }
  }

  const verifyFSSAILicense = async (licenseNumber) => {
    // Simulate FSSAI license verification
    // In a real application, this would call the FSSAI API
    return new Promise((resolve) => {
      setTimeout(() => {
        // FSSAI license must be exactly 14 digits
        const isValid = licenseNumber.length === 14 && /^\d{14}$/.test(licenseNumber)
        
        if (!isValid) {
          if (licenseNumber.length !== 14) {
            resolve({
              isValid: false,
              message: `FSSAI license must be exactly 14 digits. You entered ${licenseNumber.length} digits.`
            })
          } else {
            resolve({
              isValid: false,
              message: 'FSSAI license must contain only numbers.'
            })
          }
        } else {
          resolve({
            isValid: true,
            message: 'FSSAI License verified successfully!'
          })
        }
      }, 1000)
    })
  }

  const handleProductNameChange = (name) => {
    setNewProduct({ ...newProduct, name })
  }

  const handleOrganicChange = (isOrganic) => {
    setNewProduct({ ...newProduct, isOrganic })
  }

  const handleVerifyLicense = async () => {
    if (!newProduct.licenseNumber.trim()) {
      alert('Please enter a license number')
      return
    }

    try {
      const result = await verifyFSSAILicense(newProduct.licenseNumber)
      if (result.isValid) {
        setNewProduct({ ...newProduct, isVerified: true })
        alert('✅ ' + result.message)
      } else {
        setNewProduct({ ...newProduct, isVerified: false })
        alert('❌ ' + result.message)
      }
    } catch (error) {
      alert('Error verifying license. Please try again.')
    }
  }

  const handleAddFlashSale = async () => {
    console.log('Creating flash sale with data:', newFlashSale)
    console.log('User data:', user)
    
    // Enhanced validation with better error messages
    if (!newFlashSale.product?.trim()) {
      alert('Please enter a product name')
      return
    }
    if (!newFlashSale.newPrice || parseFloat(newFlashSale.newPrice) <= 0) {
      alert('Please enter a valid sale price')
      return
    }
    if (!newFlashSale.oldPrice || parseFloat(newFlashSale.oldPrice) <= 0) {
      alert('Please enter a valid original price')
      return
    }
    if (!newFlashSale.totalQuantity || parseInt(newFlashSale.totalQuantity) <= 0) {
      alert('Please enter a valid quantity')
      return
    }
    if (!newFlashSale.durationDays && !newFlashSale.durationHours && !newFlashSale.durationMinutes) {
      alert('Please set a duration for the flash sale')
      return
    }

    try {
      // Calculate endTime from duration
      const now = new Date()
      const days = parseInt(newFlashSale.durationDays) || 0
      const hours = parseInt(newFlashSale.durationHours) || 0
      const minutes = parseInt(newFlashSale.durationMinutes) || 0
      const endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000 + minutes * 60 * 1000).toISOString()
      
      // Use uploaded image if available
      const imageUrl = newFlashSale.image
      
      const flashSaleData = {
        product: newFlashSale.product.trim(),
        oldPrice: parseFloat(newFlashSale.oldPrice),
        price: parseFloat(newFlashSale.newPrice),
        discount: parseFloat(newFlashSale.discount) || 0,
        total: parseInt(newFlashSale.totalQuantity),
        quantityUnit: newFlashSale.quantityUnit || 'kg',
        endTime,
        supplier: user.name,
        supplierId: user.id,
        image: imageUrl,
        status: 'active',
        sold: 0
      }
      
      const addedFlashSale = flashSalesDatabase.addFlashSale(flashSaleData)
      if (addedFlashSale) {
        setFlashSales([...flashSales, addedFlashSale])
        setNewFlashSale({
          product: '',
          oldPrice: '',
          newPrice: '',
          discount: '',
          totalQuantity: '',
          quantityUnit: 'kg',
          durationDays: '',
          durationHours: '',
          durationMinutes: '',
          image: ''
        })
        setShowAddFlashSale(false)
        alert('Flash sale created successfully!')
      } else {
        alert('Failed to create flash sale. Please try again.')
      }
    } catch (error) {
      console.error('Error creating flash sale:', error)
      alert('An error occurred while creating the flash sale. Please try again.')
    }
  }

  const handleEditFlashSale = (sale) => {
    setNewFlashSale({
      product: sale.product,
      oldPrice: sale.oldPrice.toString(),
      newPrice: sale.price.toString(),
      discount: sale.discount.toString(),
      totalQuantity: sale.total.toString(),
      durationHours: '',
      durationMinutes: '',
      image: sale.image || ''
    })
    setEditingFlashSale(sale)
    setShowAddFlashSale(true)
  }

  const handleUpdateFlashSale = async () => {
    if (newFlashSale.product && newFlashSale.newPrice && editingFlashSale) {
      // Calculate endTime from duration
      const now = new Date()
      const hours = parseInt(newFlashSale.durationHours) || 0
      const minutes = parseInt(newFlashSale.durationMinutes) || 0
      const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000).toISOString()
      
      // Use uploaded image if available, otherwise keep existing
      const imageUrl = newFlashSale.image || editingFlashSale.image
      
      const updatedData = {
        product: newFlashSale.product,
        oldPrice: parseFloat(newFlashSale.oldPrice),
        price: parseFloat(newFlashSale.newPrice),
        discount: parseFloat(newFlashSale.discount),
        total: parseInt(newFlashSale.totalQuantity),
        endTime,
        image: imageUrl
      }
      
      const updatedFlashSale = flashSalesDatabase.updateFlashSale(editingFlashSale.id, updatedData)
      if (updatedFlashSale) {
        setFlashSales(flashSales.map(fs => fs.id === editingFlashSale.id ? updatedFlashSale : fs))
        setEditingFlashSale(null)
        setNewFlashSale({
          product: '',
          oldPrice: '',
          newPrice: '',
          discount: '',
          totalQuantity: '',
          durationHours: '',
          durationMinutes: '',
          image: ''
        })
        setShowAddFlashSale(false)
      }
    } else {
      alert('Please fill in all required fields')
    }
  }

  const handleDeleteFlashSale = (saleId) => {
    if (window.confirm('Are you sure you want to delete this flash sale?')) {
      const success = flashSalesDatabase.deleteFlashSale(saleId)
      if (success) {
        setFlashSales(flashSales.filter(fs => fs.id !== saleId))
        alert('Flash sale deleted successfully')
      } else {
        alert('Failed to delete flash sale')
      }
    }
  }

  const handleDeleteDelivery = (deliveryId) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      const success = deliveriesDatabase.deleteDelivery(deliveryId)
      if (success) {
        setDeliveries(deliveries.filter(d => d.id !== deliveryId))
        alert('Delivery deleted successfully')
      } else {
        alert('Failed to delete delivery')
      }
    }
  }

  const openBargainChat = (bargain) => {
    setSelectedBargain(bargain)
  }

  const closeBargainChat = () => {
    setSelectedBargain(null)
    // Refresh bargains list to show updated status
    if (user && user.id) {
      const updated = bargainsDatabase.getBargainsBySupplier(user.id)
      // Sort: newest first
      const sorted = updated.sort((a, b) => b.id - a.id)
      setBargains(sorted)
    }
  }

  const handleBargainResponse = (bargainId, response) => {
    setBargains(bargains.map(bargain => 
      bargain.id === bargainId 
        ? { ...bargain, status: response }
        : bargain
    ))
  }

  const isFarmer = user?.userType === 'farmer' || user?.type === 'farmer'

  const stats = {
    totalProducts: products.length,
    activeBargains: bargains.filter(b => b.status === 'pending').length,
    activeFlashSales: flashSales.filter(f => f.status === 'active').length,
    totalRevenue: 25000,
    totalOrders: 45,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : 0,
    totalReviews: reviews.length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your products, sales, and orders</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex space-x-2 px-6">
              {[
                { id: 'products', name: 'Product Catalog', icon: Package },
                { id: 'bargains', name: 'Bargain Requests', icon: MessageSquare, hasNotification: true },
                { id: 'flashsales', name: 'Flash Sales', icon: Zap },
                { id: 'reviews', name: 'Reviews', icon: Star },
                { id: 'deliveries', name: 'Deliveries', icon: Truck },
              ].map((tab) => {
                const Icon = tab.icon
                const showBadge = tab.hasNotification && bargainNotifications > 0
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-4 border-b-2 font-semibold text-sm flex items-center gap-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                    {showBadge && (
                      <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-2 flex items-center justify-center font-bold animate-pulse">
                        {bargainNotifications}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-xl">
        {/* Product Catalog Tab */}
        {activeTab === 'products' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Product Catalog</h2>
              {!isFarmer && (
                <button
                  onClick={() => {
                    setEditingProduct(null)
                    setShowAddProduct(true)
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="group relative rounded-2xl overflow-hidden bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  {/* Product Image */}
                  <div className="relative overflow-hidden">
                    {product.image && product.image !== '🥬' ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-56 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center"
                      style={{ display: product.image && product.image !== '🥬' ? 'none' : 'flex' }}
                    >
                      <span className="text-6xl">🥬</span>
                    </div>
                    
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg bg-emerald-600/90">
                      <div className="text-white font-bold text-lg">₹{product.price}</div>
                      <div className="text-white/90 text-xs">per {product.unit || 'kg'}</div>
                    </div>
                    
                    {/* Stock Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-md bg-blue-500/90">
                      <div className="text-white text-xs font-semibold">{product.quantity} {product.unit || 'kg'} in stock</div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    
                    {/* Certifications */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {!product.isOrganic && product.isVerified && (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          FSSAI Verified
                        </span>
                      )}
                      {!product.isOrganic && product.licenseNumber && !product.isVerified && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {product.isOrganic && (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          🌱 Organic
                        </span>
                      )}
                    </div>
                    
                    {!isFarmer && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-semibold transition-all"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bargain Requests Tab */}
        {activeTab === 'bargains' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Bargain Requests</h2>
            {bargains.length === 0 ? (
              <div className="text-gray-400 text-center">No bargains yet.</div>
            ) : (
              <div className="space-y-4">
                {bargains.map((bargain) => {
                  const isCompleted = bargain.status === 'agreed' || bargain.status === 'rejected'
                  return (
                    <div 
                      key={bargain.id} 
                      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                        isCompleted ? 'bg-gray-50 opacity-75' : 'bg-white hover:shadow-xl border-2 border-gray-100'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className={`text-xl font-bold mb-1 ${
                              isCompleted ? 'text-gray-500' : 'text-gray-900'
                            }`}>{bargain.vendorName}</h3>
                            <p className="text-sm text-gray-600 font-medium">{bargain.productName}</p>
                          </div>
                          <button 
                            onClick={() => openBargainChat(bargain)} 
                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                              isCompleted 
                                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/30'
                            }`}
                          >
                            💬 {isCompleted ? 'View Chat' : 'Open Chat'}
                          </button>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            bargain.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            bargain.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            bargain.status === 'agreed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bargain.status === 'accepted' ? '✓ Both Accepted' :
                             bargain.status === 'rejected' ? '✗ Rejected' :
                             bargain.status === 'agreed' ? '🤝 Deal Done' :
                             bargain.supplierAccepted ? '⏳ Waiting for Vendor' :
                             bargain.vendorAccepted ? '👀 Your Turn' :
                             '⏱️ Pending'}
                          </span>
                          {bargain.finalPrice && (
                            <div className="px-4 py-2 bg-green-50 rounded-full">
                              <span className="text-green-700 font-bold text-lg">₹{bargain.finalPrice}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {selectedBargain && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Bargain Chat for {selectedBargain.productName}</h3>
                    <button onClick={() => setSelectedBargain(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                  </div>
                  <Negotiation 
                    mode="supplier"
                    bargainId={selectedBargain.id}
                    product={{ id: selectedBargain.productId, name: selectedBargain.productName, vendorId: selectedBargain.vendorId, vendor: selectedBargain.vendorName }}
                    onClose={closeBargainChat}
                    readOnly={selectedBargain.status === 'agreed' || selectedBargain.status === 'rejected'}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Flash Sales Tab */}
        {activeTab === 'flashsales' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Flash Sales</h2>
              <button
                onClick={() => setShowAddFlashSale(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Flash Sale
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flashSales.map((sale) => {
                const remaining = (sale.remainingStock !== undefined) ? sale.remainingStock : ((sale.total || 0) - (sale.sold || 0))
                const isSoldOut = remaining <= 0
                return (
                <div key={sale.id} className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${isSoldOut ? 'bg-gray-50 opacity-70' : 'bg-white hover:shadow-2xl hover:-translate-y-1'}`}>
                  {/* Flash Sale Image */}
                  <div className="relative overflow-hidden">
                    {sale.image ? (
                      <img 
                        src={sale.image} 
                        alt={sale.product}
                        className={`w-full h-56 object-cover transition-transform duration-500 ${isSoldOut ? 'grayscale' : 'group-hover:scale-110'}`}
                      />
                    ) : (
                      <div className="w-full h-56 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                        <span className="text-6xl">📦</span>
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    <div className={`absolute top-3 right-3 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg animate-pulse ${isSoldOut ? 'bg-gray-400/90' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}>
                      <div className="text-white font-bold text-lg">{sale.discount}% OFF</div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <button
                        onClick={() => handleEditFlashSale(sale)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFlashSale(sale.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-gray-800 bg-opacity-70 flex flex-col items-center justify-center">
                        <span className="text-white text-3xl font-bold mb-2">🔴 SOLD OUT</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{sale.product}</h3>
                    
                    {/* Price Section */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold text-green-600">₹{sale.price}</span>
                      <span className="text-lg line-through text-gray-500">₹{sale.oldPrice}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">
                          {sale.sold} / {sale.total} sold
                        </span>
                        <div className="flex items-center gap-1 text-xs font-semibold text-red-600">
                          <FlashSaleTimer endTime={sale.endTime} />
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-500 to-red-500"
                          style={{ width: `${(sale.sold / sale.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No reviews yet.</p>
                <p className="text-gray-400 text-sm mt-2">Reviews from vendors will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.sort((a, b) => new Date(b.date) - new Date(a.date)).map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border-2 border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{review.vendorName}</h3>
                        <p className="text-sm text-gray-600 font-medium">{review.productName}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-2 rounded-lg">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= review.rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-bold text-gray-900">{review.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">{review.date}</span>
                      <button
                        onClick={() => {
                          reviewsDatabase.deleteReview(review.id)
                          setReviews(reviews.filter(r => r.id !== review.id))
                        }}
                        className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Delivery Management</h2>
            {deliveries.length === 0 ? (
              <div className="text-gray-400 text-center">No deliveries yet.</div>
            ) : (
              <div className="space-y-4">
                {deliveries
                  .sort((a, b) => new Date(b.orderDate || b.deliveryDate || b.id) - new Date(a.orderDate || a.deliveryDate || a.id))
                  .map((delivery) => (
                  <div key={delivery.id} className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border-2 border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">Order #{delivery.orderId}</h3>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                            delivery.status === 'in-transit' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : delivery.status === 'delivered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {delivery.status === 'in-transit' ? '🚚 In Transit' : 
                             delivery.status === 'delivered' ? '✓ Delivered' : 
                             '📦 ' + delivery.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">Customer:</span> {delivery.customer}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Products:</span> {Array.isArray(delivery.products) 
                            ? delivery.products.map(p => typeof p === 'string' ? p : p.name || 'Item').join(', ')
                            : delivery.products || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Delivery Date:</span> {new Date(delivery.deliveryDate || delivery.orderDate || delivery.id).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-bold text-emerald-600">
                          ₹{delivery.totalAmount}
                        </div>
                        <button
                          onClick={() => handleDeleteDelivery(delivery.id)}
                          className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  {editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddProduct(false)
                    setEditingProduct(null)
                    setNewProduct({
                      name: '',
                      price: '',
                      quantity: '',
                      unit: 'kg',
                      description: '',
                      image: '',
                      isOrganic: false,
                      licenseNumber: '',
                      isVerified: false,
                      category: 'vegetables'
                    })
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => handleProductNameChange(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Price per unit"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="flex-1 p-2 border rounded"
                />
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  className="w-32 p-2 border rounded"
                >
                  <option value="kg">Kg</option>
                  <option value="litre">Litre</option>
                  <option value="dozen">Dozen</option>
                  <option value="piece">Piece</option>
                  <option value="grams">Grams</option>
                  <option value="ml">ML</option>
                  <option value="quintal">Quintal</option>
                  <option value="ton">Ton</option>
                  <option value="box">Box</option>
                  <option value="bag">Bag</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Total quantity available"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                className="w-full p-2 border rounded"
                rows="3"
              />
              
              {/* Product Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="productType"
                      value="organic"
                      checked={newProduct.isOrganic}
                      onChange={() => handleOrganicChange(true)}
                      className="mr-2"
                    />
                    Organic
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="productType"
                      value="non-organic"
                      checked={!newProduct.isOrganic}
                      onChange={() => handleOrganicChange(false)}
                      className="mr-2"
                    />
                    Non-Organic
                  </label>
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Category
                </label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="grains">Grains</option>
                  <option value="dairy">Dairy Products</option>
                  <option value="nuts">Nuts & Flours</option>
                  <option value="other">Other Materials</option>
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image (Optional)
                </label>
                <ImageUpload
                  onImageSelect={(imageData) => setNewProduct({...newProduct, image: imageData})}
                  currentImage={newProduct.image}
                  onRemoveImage={() => setNewProduct({...newProduct, image: ''})}
                />
              </div>
              
              {/* FSSAI Verification - Only for Non-Organic Products */}
              {!newProduct.isOrganic && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      FSSAI License Number (Required for Non-Organic Products)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 14-digit FSSAI license number"
                        value={newProduct.licenseNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          if (value.length <= 14) {
                            setNewProduct({...newProduct, licenseNumber: value, isVerified: false})
                          }
                        }}
                        maxLength={14}
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyLicense}
                        disabled={newProduct.licenseNumber.length !== 14}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Verify
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {newProduct.licenseNumber.length}/14 digits entered
                    </p>
                    {newProduct.isVerified && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        License verified successfully
                      </p>
                    )}
                    {newProduct.licenseNumber && !newProduct.isVerified && (
                      <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Please verify your license number
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Organic Products Info */}
              {newProduct.isOrganic && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Organic products do not require FSSAI verification
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button 
                onClick={editingProduct ? handleUpdateProduct : handleAddProduct} 
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {editingProduct ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button 
                onClick={() => {
                  setShowAddProduct(false)
                  setEditingProduct(null)
                  setNewProduct({
                    name: '',
                    price: '',
                    quantity: '',
                    description: '',
                    image: '',
                    isOrganic: false,
                    licenseNumber: '',
                    isVerified: false
                  })
                }} 
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Flash Sale Modal */}
      {showAddFlashSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  {editingFlashSale ? '⚡ Edit Flash Sale' : '⚡ Create Flash Sale'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddFlashSale(false)
                    setEditingFlashSale(null)
                    setNewFlashSale({
                      product: '',
                      oldPrice: '',
                      newPrice: '',
                      discount: '',
                      totalQuantity: '',
                      durationHours: '',
                      durationMinutes: '',
                      image: ''
                    })
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <input
                type="text"
                placeholder="Product Name"
                value={newFlashSale.product}
                onChange={(e) => setNewFlashSale({...newFlashSale, product: e.target.value})}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Original Price"
                value={newFlashSale.oldPrice}
                onChange={(e) => setNewFlashSale({...newFlashSale, oldPrice: e.target.value})}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Sale Price"
                value={newFlashSale.newPrice}
                onChange={(e) => setNewFlashSale({...newFlashSale, newPrice: e.target.value})}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Discount %"
                value={newFlashSale.discount}
                onChange={(e) => setNewFlashSale({...newFlashSale, discount: e.target.value})}
                className="w-full p-2 border rounded"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Total Quantity"
                  value={newFlashSale.totalQuantity}
                  onChange={(e) => setNewFlashSale({...newFlashSale, totalQuantity: e.target.value})}
                  className="flex-1 p-2 border rounded"
                />
                <select
                  value={newFlashSale.quantityUnit}
                  onChange={(e) => setNewFlashSale({...newFlashSale, quantityUnit: e.target.value})}
                  className="w-20 p-2 border rounded"
                >
                  <option value="kg">Kg</option>
                  <option value="g">g</option>
                  <option value="litre">L</option>
                  <option value="ml">mL</option>
                  <option value="piece">Pc</option>
                  <option value="dozen">Dz</option>
                  <option value="box">Box</option>
                  <option value="bag">Bag</option>
                  <option value="quintal">Q</option>
                  <option value="ton">Ton</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Days"
                  value={newFlashSale.durationDays}
                  onChange={e => setNewFlashSale({ ...newFlashSale, durationDays: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Hours"
                  value={newFlashSale.durationHours}
                  onChange={e => setNewFlashSale({ ...newFlashSale, durationHours: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Minutes"
                  value={newFlashSale.durationMinutes}
                  onChange={e => setNewFlashSale({ ...newFlashSale, durationMinutes: e.target.value })}
                  className="p-2 border rounded"
                />
              </div>
              
              {/* Flash Sale Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image (Optional)
                </label>
                <ImageUpload
                  onImageSelect={(imageData) => setNewFlashSale({...newFlashSale, image: imageData})}
                  currentImage={newFlashSale.image}
                  onRemoveImage={() => setNewFlashSale({...newFlashSale, image: ''})}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button 
                onClick={editingFlashSale ? handleUpdateFlashSale : handleAddFlashSale} 
                className="btn-primary flex-1"
              >
                {editingFlashSale ? 'Update Sale' : 'Create Sale'}
              </button>
              <button 
                onClick={() => {
                  setShowAddFlashSale(false)
                  setEditingFlashSale(null)
                  setNewFlashSale({
                    product: '',
                    oldPrice: '',
                    newPrice: '',
                    discount: '',
                    totalQuantity: '',
                    durationHours: '',
                    durationMinutes: '',
                    image: ''
                  })
                }} 
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

 