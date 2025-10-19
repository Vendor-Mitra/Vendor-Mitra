import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useProducts } from '../contexts/ProductContext'
import { ShoppingCart, Trash2, ArrowLeft, CreditCard, MessageSquare } from 'lucide-react'
import { deliveriesDatabase, flashSalesDatabase, productDatabase, bargainsDatabase } from '../data/userDatabase'
import realTimeSync from '../utils/realTimeSync'
import { getAllSupplierProducts } from '../data/suppliersDatabase'
import BuyNowDialog from '../components/BuyNow/BuyNowDialog'
import Negotiation from '../components/Bargain/Negotiation'
import stockManager from '../utils/stockManager'

const Cart = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const { decreaseStock } = useProducts()
  const [showCodModal, setShowCodModal] = useState(false)
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false)
  const [availableStock, setAvailableStock] = useState({})
  const [showBargainModal, setShowBargainModal] = useState(false)
  const [selectedItemForBargain, setSelectedItemForBargain] = useState(null)
  const [currentBargainId, setCurrentBargainId] = useState(null)
  const [bargainedItems, setBargainedItems] = useState(() => {
    // Load bargained prices from shared localStorage (same as Bargains page)
    try {
      const saved = localStorage.getItem('vendorMitraBargainedPrices')
      const parsed = saved ? JSON.parse(saved) : {}
      console.log('💰 Initial bargained items loaded:', parsed)
      return parsed
    } catch {
      return {}
    }
  })

  // Reload bargained prices when cart page loads
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vendorMitraBargainedPrices')
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('💰 Reloading bargained prices on mount:', parsed)
        setBargainedItems(parsed)
      }
      
      // Verify cart is intact
      const cartSaved = localStorage.getItem('vendorMitraCart')
      if (cartSaved) {
        const cartParsed = JSON.parse(cartSaved)
        console.log('✅ Cart verified on page load:', cartParsed.length, 'items')
        if (cartParsed.length === 0) {
          console.warn('⚠️ Cart is empty! This might indicate an issue.')
        }
      }
    } catch (e) {
      console.error('Error loading bargained prices:', e)
    }
  }, [])

  // Listen for storage changes to update bargained prices in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('vendorMitraBargainedPrices')
        if (saved) {
          const updated = JSON.parse(saved)
          setBargainedItems(updated)
          console.log('🔄 Cart updated with new bargained prices:', updated)
          console.log('📦 Current cart items:', cart.map(i => ({ id: i.id, name: i.name })))
        }
      } catch (e) {
        console.error('Error updating bargained prices:', e)
      }
    }

    // Also listen for custom event (for same-window updates)
    const handleBargainUpdate = (e) => {
      console.log('🔔 Bargain update event received')
      handleStorageChange()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('bargainPriceUpdated', handleBargainUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('bargainPriceUpdated', handleBargainUpdate)
    }
  }, [cart])

  // Also subscribe to real-time bargain updates to refresh prices instantly
  useEffect(() => {
    const unsubscribe = realTimeSync.subscribe('bargain_update', () => {
      try {
        const saved = localStorage.getItem('vendorMitraBargainedPrices')
        if (saved) {
          const updated = JSON.parse(saved)
          setBargainedItems(updated)
        }
      } catch {}
    })
    return () => unsubscribe()
  }, [])

  // Validate bargained prices against active bargains and cart items
  useEffect(() => {
    if (user && user.id && cart.length > 0) {
      const allBargains = bargainsDatabase.getAllBargains()
      const validBargainedItems = {}
      
      // Only keep bargained prices for items actually in cart with matching bargains
      cart.forEach(cartItem => {
        const productId = cartItem.id.toString()
        
        // Check if there's a bargained price for this product
        if (bargainedItems[productId]) {
          // Find a completed bargain that matches this exact product
          const bargain = allBargains.find(b => 
            b.productId === cartItem.id && 
            b.vendorId === user.id && 
            b.supplierId === cartItem.supplierId && // Must be same supplier
            b.productName === cartItem.name && // Must be same product name
            b.status === 'agreed' // Must be completed
          )
          
          if (bargain) {
            // Valid bargain found - keep the price
            validBargainedItems[productId] = bargainedItems[productId]
            console.log(`✅ Valid bargain for ${cartItem.name}:`, bargain.finalPrice)
          } else {
            // No valid bargain - remove the old price
            console.log(`❌ Removing invalid bargained price for ${cartItem.name} (no matching bargain)`)
          }
        }
      })
      
      // Update state if validation removed any items
      if (Object.keys(validBargainedItems).length !== Object.keys(bargainedItems).length) {
        console.log(`🧹 Cleaned up ${Object.keys(bargainedItems).length - Object.keys(validBargainedItems).length} invalid bargained prices`)
        setBargainedItems(validBargainedItems)
        localStorage.setItem('vendorMitraBargainedPrices', JSON.stringify(validBargainedItems))
      }
    }
  }, [cart, user, bargainedItems])

  const handleBuyNow = () => {
    if (!user) {
      alert('Please log in to make a purchase')
      navigate('/login')
      return
    }
    setShowBuyNowDialog(true)
  }

  // Bargain functionality - open modal on same page
  const openBargainModal = (item) => {
    try {
      const vendorId = user?.id || 1
      
      console.log('\n💬 Opening bargain for:', item.name, 'Product ID:', item.id)
      console.log('📦 Cart items remain visible during bargaining')
      
      // Find existing ACTIVE bargain for this product (only pending/accepted, not rejected or agreed)
      const allBargains = bargainsDatabase.getAllBargains()
      
      // Only reuse bargains that are still in progress (pending/accepted)
      // Exclude completed bargains (agreed) and failed bargains (rejected)
      let bargain = allBargains.find(b => 
        b.productId === item.id && 
        b.vendorId === vendorId && 
        b.status !== 'rejected' && 
        b.status !== 'agreed' &&
        (b.status === 'pending' || b.status === 'accepted')
      )
      
      if (bargain) {
        console.log('🔄 FOUND existing bargain - REUSING:', bargain.id)
      } else {
        console.log('❌ No existing bargain found - CREATING NEW')
        // Create new bargain only if no active one exists
        // Store per-unit price for bargaining
        const pricePerUnit = extractPrice(item.price)
        bargain = bargainsDatabase.addBargain({
          productId: item.id,
          productName: item.name,
          supplierId: item.supplierId,
          supplierName: item.supplier,
          vendorId,
          vendorName: user?.name || 'Vendor',
          originalPrice: pricePerUnit, // Store per-unit price for bargaining
          pricePerUnit: pricePerUnit, // Store per unit price
          quantity: item.quantity, // Store quantity for reference
          unit: item.unit || 'kg',
          status: 'pending',
          messages: [] // Start with no messages
        })
        
        console.log('✅ Created new bargain:', bargain.id)
      }
      
      // Open modal instead of navigating away
      setSelectedItemForBargain(item)
      setCurrentBargainId(bargain.id)
      setShowBargainModal(true)
    } catch (e) {
      console.error('Error opening bargain:', e)
    }
  }

  const closeBargainModal = () => {
    setShowBargainModal(false)
    setSelectedItemForBargain(null)
    setCurrentBargainId(null)
    
    // Reload bargained prices
    try {
      const saved = localStorage.getItem('vendorMitraBargainedPrices')
      if (saved) {
        const parsed = JSON.parse(saved)
        setBargainedItems(parsed)
        console.log('🔄 Reloaded bargained prices after closing modal')
      }
    } catch (e) {
      console.error('Error reloading bargained prices:', e)
    }
  }

  const handleBargainConfirmed = ({ product, agreedPrice }) => {
    console.log('✅ Bargain confirmed in cart!', product.name, agreedPrice)
    closeBargainModal()
    // Force reload bargained prices
    setTimeout(() => {
      const saved = localStorage.getItem('vendorMitraBargainedPrices')
      if (saved) {
        setBargainedItems(JSON.parse(saved))
      }
    }, 100)
  }

  // These handlers are no longer needed since we redirect to Bargains page
  // Keeping them for backward compatibility if needed

  // Helper function to extract numeric price from string
  const extractPrice = (priceString) => {
    if (typeof priceString === 'number') return priceString
    if (!priceString) return 0
    const match = priceString.toString().match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }

  // Calculate total with bargained prices
  const getCartTotalWithBargains = () => {
    console.log('💰 Calculating cart total with bargains...')
    console.log('📦 Cart items:', cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })))
    console.log('🤝 Bargained items:', Object.keys(bargainedItems).map(key => ({ key, pricePerUnit: bargainedItems[key].bargainedPricePerUnit })))
    
    return cart.reduce((total, item) => {
      const bargainedItem = bargainedItems[item.id]
      
      if (bargainedItem?.isBargained && bargainedItem?.bargainedPricePerUnit) {
        // Calculate total using bargained per-unit price × quantity
        const itemTotal = bargainedItem.bargainedPricePerUnit * item.quantity
        console.log(`  ${item.name} (ID: ${item.id}): BARGAINED ₹${bargainedItem.bargainedPricePerUnit}/${bargainedItem.unit} × ${item.quantity} = ₹${itemTotal}`)
        return total + itemTotal
      } else {
        // Regular price calculation
        const price = extractPrice(item.price)
        const itemTotal = price * item.quantity
        console.log(`  ${item.name} (ID: ${item.id}): REGULAR ₹${price} × ${item.quantity} = ₹${itemTotal}`)
        return total + itemTotal
      }
    }, 0)
  }

  // Get savings from bargains
  const getBargainSavings = () => {
    return cart.reduce((savings, item) => {
      const bargainedItem = bargainedItems[item.id]
      if (bargainedItem?.isBargained && bargainedItem?.bargainedPricePerUnit) {
        const originalPricePerUnit = extractPrice(item.price)
        const originalTotal = originalPricePerUnit * item.quantity
        const bargainedTotal = bargainedItem.bargainedPricePerUnit * item.quantity
        return savings + (originalTotal - bargainedTotal)
      }
      return savings
    }, 0)
  }

  const handleConfirmOrder = async (orderData) => {
    const { deliveryAddress, paymentMethod } = orderData
    
    try {
      // First, check stock availability for all items
      const stockChecks = []
      for (const item of cart) {
        if (!item.isFlashSale && !item.isNearbySupplier) {
          const stockCheck = await stockManager.checkAvailability(item.id, item.quantity)
          if (!stockCheck.success || !stockCheck.data.isAvailable) {
            alert(`Insufficient stock for ${item.name}. Available: ${stockCheck.data?.currentStock || 0}, Requested: ${item.quantity}`)
            return
          }
          stockChecks.push({ item, stockCheck })
        } else if (item.isNearbySupplier) {
          // For nearby supplier items, check against the stock stored in the item
          const itemStock = item.stock || 100
          if (item.quantity > itemStock) {
            alert(`Insufficient stock for ${item.name}. Available: ${itemStock}, Requested: ${item.quantity}`)
            return
          }
        }
      }

      // Process stock updates using ProductContext
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const stockUpdatePromises = []
      
      for (const item of cart) {
        if (!item.isFlashSale && !item.isNearbySupplier) {
          stockUpdatePromises.push(
            decreaseStock(item.id, item.quantity, {
              vendorId: user?.id,
              vendorName: user?.name,
              deliveryAddress: deliveryAddress,
              paymentMethod: paymentMethod
            }).then(result => ({
              item,
              result
            }))
          )
        }
        // Note: Nearby supplier items don't need stock updates as they're demo items
      }

      if (stockUpdatePromises.length > 0) {
        const stockResults = await Promise.all(stockUpdatePromises)
        const failedItems = stockResults.filter(({ result }) => !result.success)
        
        if (failedItems.length > 0) {
          const failedNames = failedItems.map(({ item }) => item.name).join(', ')
          alert(`Purchase failed for some items: ${failedNames}`)
          return
        }

        console.log('Stock updated successfully for all items')
      }

      // Group cart items by supplierId
      const deliveriesBySupplier = {}
      console.log('\n=========================================')
      console.log('🛒 PURCHASE STARTED')
      console.log('=========================================')
      console.log('📦 Processing cart items for delivery:', cart.length, 'items')
      console.log('Cart contents:', cart.map(i => `${i.name} x${i.quantity} @ ₹${i.price}`))
      
      cart.forEach(item => {
        if (!deliveriesBySupplier[item.supplierId]) {
          deliveriesBySupplier[item.supplierId] = {
            supplier: item.supplier,
            supplierId: item.supplierId,
            products: [],
            totalAmount: 0
          }
        }
        // Use bargained per-unit price if available, otherwise use original price
        const bargainedItem = bargainedItems[item.id]
        let pricePerUnit
        
        if (bargainedItem?.isBargained && bargainedItem?.bargainedPricePerUnit) {
          pricePerUnit = bargainedItem.bargainedPricePerUnit
        } else {
          pricePerUnit = extractPrice(item.price)
        }
        
        const itemTotal = pricePerUnit * item.quantity
        
        console.log(`  • ${item.name}:`, {
          originalPricePerUnit: extractPrice(item.price),
          bargainedPricePerUnit: bargainedItem?.bargainedPricePerUnit,
          pricePerUnitUsed: pricePerUnit,
          quantity: item.quantity,
          total: itemTotal
        })
        
        deliveriesBySupplier[item.supplierId].products.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || 'piece',
          price: pricePerUnit,
          image: item.image
        })
        deliveriesBySupplier[item.supplierId].totalAmount += itemTotal
      })
      
      // Create a delivery for each supplier
      const deliverySummaries = []
      console.log('🚚 Creating deliveries for', Object.keys(deliveriesBySupplier).length, 'supplier(s)')
      
      Object.values(deliveriesBySupplier).forEach(delivery => {
        console.log(`  Creating delivery for ${delivery.supplier}:`, {
          products: delivery.products.length,
          totalAmount: delivery.totalAmount,
          productDetails: delivery.products
        })
        
        const newDelivery = deliveriesDatabase.addDelivery({
          customer: user?.name || 'Customer',
          customerId: user?.id || 1,
          supplier: delivery.supplier,
          supplierId: delivery.supplierId,
          products: delivery.products,
          totalAmount: delivery.totalAmount,
          status: 'delivered', // Set to delivered for testing review functionality
          paymentMethod: paymentMethod,
          deliveryAddress: deliveryAddress,
          deliveryDate: new Date().toISOString()
        })
        
        console.log(`  ✅ Created delivery:`, {
          orderId: newDelivery.orderId,
          totalAmount: newDelivery.totalAmount,
          products: newDelivery.products.map(p => `${p.name} @ ₹${p.price}`)
        })
        console.log('\n⚠️ IMPORTANT: This is ONE delivery for ONE purchase!')
        console.log('If you see multiple orders, you made multiple purchases!\n')
        
        const productNames = delivery.products.map(p => 
          typeof p === 'string' ? p : `${p.quantity} ${p.unit} ${p.name}`
        )
        deliverySummaries.push(`${delivery.supplier}: ${productNames.join(', ')} (₹${delivery.totalAmount})`)
      })

      // Update sold count for flash sale items using proper inventory management
      cart.forEach(item => {
        if (item.isFlashSale) {
          console.log('=== CART PURCHASE - FLASH SALE ITEM ===')
          console.log('Item:', item.name, 'Quantity:', item.quantity)
          
          const updatedSale = flashSalesDatabase.decreaseFlashSaleStock(item.id, item.quantity)
          
          if (updatedSale) {
            console.log('Flash sale stock decreased:', updatedSale.id, 'Sold:', updatedSale.sold, '/', updatedSale.total)
            
            // Emit real-time sync event to update supplier dashboard
            import('../utils/realTimeSync').then(({ default: realTimeSync }) => {
              realTimeSync.emit('flash_sale_update', {
                action: 'purchase',
                flashSale: updatedSale,
                supplierId: item.supplierId
              })
            })
          } else {
            console.error('Failed to decrease flash sale stock for item:', item.id)
          }
        }
      })
      
      const totalWithBargains = getCartTotalWithBargains()
      const savings = getBargainSavings()
      const savingsMessage = savings > 0 ? `\n\nYou saved ₹${savings} through bargaining!` : ''
      // Clear bargained prices for purchased items
      const updatedBargainedItems = { ...bargainedItems }
      cart.forEach(item => {
        if (updatedBargainedItems[item.id]) {
          console.log(`🗑️ Clearing bargained price for purchased item: ${item.name}`)
          delete updatedBargainedItems[item.id]
        }
      })
      setBargainedItems(updatedBargainedItems)
      localStorage.setItem('vendorMitraBargainedPrices', JSON.stringify(updatedBargainedItems))
      
      // Also mark bargains as completed (change status from 'agreed' to 'completed')
      cart.forEach(item => {
        const bargain = bargainsDatabase.getAllBargains().find(b => 
          b.productId === item.id && 
          b.vendorId === user?.id && 
          b.status === 'agreed'
        )
        if (bargain) {
          console.log(`✅ Marking bargain as completed: ${item.name}`)
          bargainsDatabase.updateBargain(bargain.id, { status: 'completed' })
        }
      })
      
      alert(`Thank you for your purchase! Total: ₹${totalWithBargains}${savingsMessage}\n\nStock has been automatically updated for all items.`)
      clearCart()
      
      // Refresh stock data
      loadStock()
      
    } catch (error) {
      console.error('Error processing order:', error)
      alert('Failed to process your order. Please try again.')
    }
  }

  // Load available stock for cart items
  const loadStock = async () => {
    const stockData = {}
    
    for (const item of cart) {
      if (item.isFlashSale) {
        // For flash sales, get available stock from flash sales database
        const flashSale = flashSalesDatabase.getFlashSaleById(item.id)
        if (flashSale) {
          stockData[item.id] = flashSale.total - flashSale.sold
        }
      } else if (item.isNearbySupplier) {
        // For nearby supplier items, use the stock property from the item itself
        stockData[item.id] = item.stock || 100 // Default to 100 if not specified
      } else {
        // For regular products, use stock manager to get real-time stock
        try {
          const stockResult = await stockManager.getStock(item.id)
          if (stockResult.success) {
            stockData[item.id] = stockResult.data.stock
          } else {
            // Fallback to supplier products if stock manager fails
            const supplierProducts = getAllSupplierProducts()
            const product = supplierProducts.find(p => p.id === item.id)
            if (product) {
              stockData[item.id] = product.stock || product.quantity || 0
            }
          }
        } catch (error) {
          console.error('Error loading stock for item:', item.id, error)
          // Fallback to supplier products
          const supplierProducts = getAllSupplierProducts()
          const product = supplierProducts.find(p => p.id === item.id)
          if (product) {
            stockData[item.id] = product.stock || product.quantity || 0
          }
        }
      }
    }
    
    setAvailableStock(stockData)
  }

  useEffect(() => {
    if (cart.length > 0) {
      loadStock()
    }
  }, [cart])

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    const maxStock = availableStock[itemId] || 0
    if (newQuantity > maxStock) {
      alert(`Only ${maxStock} items available in stock!`)
      return
    }

    updateQuantity(itemId, newQuantity)
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
            <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8">Add some products from our suppliers to get started!</p>
            <Link 
              to="/supplier-finder" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Find Suppliers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get cart summary for checkout
  const getCartSummary = () => {
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0)
    const totalPrice = getCartTotalWithBargains()
    
    // Get unique suppliers
    const suppliers = [...new Set(cart.map(item => item.supplier).filter(Boolean))]
    const supplierName = suppliers.length === 1 ? suppliers[0] : 'Multiple Suppliers'
    
    // Calculate price per item (average)
    const pricePerItem = totalQuantity > 0 ? totalPrice / totalQuantity : 0
    
    return {
      name: `Cart Items (${cart.length} items)`,
      supplier: supplierName,
      unit: 'items',
      price: pricePerItem,
      quantity: totalQuantity,
      totalPrice: totalPrice
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Buy Now Dialog */}
      <BuyNowDialog
        isOpen={showBuyNowDialog}
        onClose={() => setShowBuyNowDialog(false)}
        item={getCartSummary()}
        quantity={cart.reduce((total, item) => total + item.quantity, 0)}
        totalPrice={getCartTotalWithBargains()}
        onConfirmOrder={handleConfirmOrder}
        cartItems={cart}
        bargainedItems={bargainedItems}
      />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/supplier-finder" className="p-2 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🛒 Shopping Cart</h1>
              <p className="text-sm text-gray-600 mt-1">{cart.length} items in your cart</p>
            </div>
          </div>
          <button 
            onClick={clearCart}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {/* Debug: Log cart items */}
          {console.log('Cart items:', cart)}
          {console.log('Nearby supplier items:', cart.filter(item => item.isNearbySupplier))}
          {console.log('Regular items:', cart.filter(item => !item.isNearbySupplier))}
          
          {/* Regular Items */}
          {cart.filter(item => !item.isNearbySupplier).length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-xl font-bold text-gray-900">🛍️ Cart Items</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {cart.filter(item => !item.isNearbySupplier).map((item, index) => (
                  <div key={index} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          {item.supplier && (
                            <p className="text-sm text-gray-500">from {item.supplier}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const bargainedItem = bargainedItems[item.id]
                            console.log(`💵 Checking price for ${item.name} (ID: ${item.id}):`, {
                              hasBargain: !!bargainedItem,
                              isBargained: bargainedItem?.isBargained,
                              bargainedPricePerUnit: bargainedItem?.bargainedPricePerUnit,
                              originalPrice: item.price
                            })
                            
                            if (bargainedItem?.isBargained && bargainedItem?.bargainedPricePerUnit) {
                              const originalTotal = extractPrice(item.price) * item.quantity
                              const bargainedTotal = bargainedItem.bargainedPricePerUnit * item.quantity
                              return (
                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400 line-through">₹{originalTotal}</span>
                                    <span className="font-medium text-green-600">₹{bargainedTotal}</span>
                                  </div>
                                  <span className="text-xs text-green-600">Bargained! (₹{bargainedItem.bargainedPricePerUnit}/{bargainedItem.unit})</span>
                                </div>
                              )
                            } else {
                              return <span className="font-medium text-gray-900">₹{extractPrice(item.price) * item.quantity}</span>
                            }
                          })()}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            +
                          </button>
                          {availableStock[item.id] !== undefined && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({availableStock[item.id]} available)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!item.isFlashSale && !bargainedItems[item.id]?.isBargained && (
                            <button 
                              onClick={() => openBargainModal(item)}
                              className="text-orange-500 hover:text-orange-700 text-sm flex items-center gap-1"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Bargain
                            </button>
                          )}
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Supplier Items */}
          {cart.filter(item => item.isNearbySupplier).length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b bg-blue-50">
                <h2 className="text-xl font-semibold text-blue-900">Nearby Supplier Items</h2>
                <p className="text-sm text-blue-700 mt-1">Items from demo suppliers (bargaining not available)</p>
              </div>
              <div className="divide-y">
                {cart.filter(item => item.isNearbySupplier).map((item, index) => (
                <div key={index} className="p-6 flex items-start gap-4">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        {item.supplier && (
                          <p className="text-sm text-gray-500">from {item.supplier}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {bargainedItems[item.id]?.isBargained ? (
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400 line-through">{item.price}</span>
                              <span className="font-medium text-green-600">₹{bargainedItems[item.id].bargainedPrice}</span>
                            </div>
                            <span className="text-xs text-green-600">Bargained!</span>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-900">{item.price}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          +
                        </button>
                        {availableStock[item.id] !== undefined && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({availableStock[item.id]} available)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* No bargain option for nearby supplier items */}
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-6 text-gray-900">📋 Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {getBargainSavings() > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-semibold">💰 You saved:</span>
                    <span className="font-bold text-green-600 text-lg">₹{getBargainSavings()}</span>
                  </div>
                </div>
              )}
              <div className="border-t-2 border-gray-100 pt-4">
                <div className="flex justify-between items-center font-bold text-xl mb-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600">₹{getCartTotalWithBargains()}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </div>
                {getBargainSavings() > 0 && (
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>Original total:</span>
                    <span className="line-through">₹{getCartTotal()}</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleBuyNow}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Buy Now
            </button>

            <div className="mt-4 text-center">
              <Link 
                to="/find-items" 
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bargain Modal */}
      {showBargainModal && selectedItemForBargain && currentBargainId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Bargain for {selectedItemForBargain.name}</h3>
                <p className="text-sm text-gray-600 mt-1">from {selectedItemForBargain.supplier}</p>
              </div>
              <button 
                onClick={closeBargainModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <Negotiation 
                mode="vendor"
                bargainId={currentBargainId}
                product={{ 
                  id: selectedItemForBargain.id, 
                  name: selectedItemForBargain.name, 
                  supplierId: selectedItemForBargain.supplierId, 
                  supplier: selectedItemForBargain.supplier,
                  price: extractPrice(selectedItemForBargain.price)
                }}
                onBargainConfirmed={handleBargainConfirmed}
                onBargainRejected={() => closeBargainModal()}
                onClose={closeBargainModal}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Cart 