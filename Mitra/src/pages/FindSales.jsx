import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { Zap, ShoppingCart, Clock } from 'lucide-react'
import { flashSalesDatabase } from '../data/userDatabase'
import realTimeSync from '../utils/realTimeSync'
import FlashSaleTimer from '../components/FlashSales/FlashSaleTimer'
import BuyNowDialog from '../components/BuyNow/BuyNowDialog'
import QuantitySelector from '../components/Cart/QuantitySelector'

const FindSales = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [flashSales, setFlashSales] = useState([])
  const [expiredSales, setExpiredSales] = useState(new Set())
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false)
  const [buyNowItem, setBuyNowItem] = useState(null)
  const [showQuantitySelector, setShowQuantitySelector] = useState(false)
  const [selectedFlashSale, setSelectedFlashSale] = useState(null)
  const [purchaseQuantities, setPurchaseQuantities] = useState({})
  const [soldOutSales, setSoldOutSales] = useState(new Map())

  const loadFlashSales = useCallback(() => {
    console.log('=== LOADING FLASH SALES ===')
    const sales = flashSalesDatabase.getAllFlashSales()
    console.log('Flash sales from database:', sales.map(s => ({ id: s.id, product: s.product, sold: s.sold, total: s.total })))
    
    const currentTime = new Date()
    
    // Include all sales (expired and sold out will be shown for 10 hours)
    const validSales = sales.filter(sale => {
      const endTime = new Date(sale.endTime)
      const expiredAt = sale.expiredAt ? new Date(sale.expiredAt) : null
      const soldOutAt = sale.soldOutAt ? new Date(sale.soldOutAt) : null
      
      // Show if not expired yet
      if (currentTime < endTime) return true
      
      // Show expired sales for 10 hours after expiration
      if (expiredAt && (currentTime - expiredAt) < 10 * 60 * 60 * 1000) return true
      
      // Show sold out sales for 10 hours after sold out
      if (soldOutAt && (currentTime - soldOutAt) < 10 * 60 * 60 * 1000) return true
      
      return false
    })
    
    console.log('Valid flash sales after filtering:', validSales.map(s => ({ id: s.id, product: s.product, sold: s.sold, total: s.total })))
    
    // Check for sold out items and update soldOutSales state
    const newSoldOutMap = new Map()
    validSales.forEach(sale => {
      const remainingStock = sale.remainingStock !== undefined ? sale.remainingStock : (sale.total - sale.sold)
      if (remainingStock <= 0) {
        newSoldOutMap.set(sale.id, sale.soldOutAt ? new Date(sale.soldOutAt) : new Date())
        // Mark as sold out in database if not already marked
        if (!sale.soldOutAt) {
          flashSalesDatabase.updateFlashSale(sale.id, {
            ...sale,
            soldOutAt: new Date().toISOString()
          })
        }
      }
    })
    setSoldOutSales(newSoldOutMap)
    
    setFlashSales(validSales)
    console.log('Flash sales state updated')
  }, [])

  // Handle timer expiration
  const handleTimerExpired = useCallback((saleId) => {
    setExpiredSales(prev => new Set([...prev, saleId]))
    
    // Mark the sale as expired in the database
    const expiredSale = flashSales.find(sale => sale.id === saleId)
    if (expiredSale) {
      flashSalesDatabase.updateFlashSale(saleId, {
        ...expiredSale,
        expiredAt: new Date().toISOString()
      })
    }
    
    // Remove expired sale after 10 hours (36000000 ms)
    setTimeout(() => {
      const sale = flashSales.find(s => s.id === saleId)
      if (sale && sale.total > sale.sold) {
        // Move remaining stock back to normal product catalog
        const remainingStock = sale.total - sale.sold
        // Add back to product database with original price
        const productData = {
          name: sale.product,
          price: sale.oldPrice || sale.price,
          quantity: remainingStock,
          unit: 'kg', // Default unit
          description: `${sale.product} - Flash sale ended`,
          image: sale.image,
          isOrganic: false,
          supplier: sale.supplier,
          supplierId: sale.supplierId,
          category: 'general'
        }
        // Import productDatabase to add the product back
        import('../data/userDatabase').then(({ productDatabase }) => {
          productDatabase.addProduct(productData)
        })
      }
      
      setFlashSales(prev => prev.filter(s => s.id !== saleId))
      setExpiredSales(prev => {
        const newSet = new Set(prev)
        newSet.delete(saleId)
        return newSet
      })
      // Also remove from database
      flashSalesDatabase.deleteFlashSale(saleId)
      // Emit real-time sync
      realTimeSync.emit('flash_sale_update', {
        action: 'expired_remove',
        saleId: saleId,
        remainingStock: sale ? sale.total - sale.sold : 0
      })
    }, 10 * 60 * 60 * 1000) // 10 hours in milliseconds
  }, [flashSales])

  // Handle when flash sale is sold out
  const handleSoldOut = useCallback((saleId) => {
    const sale = flashSales.find(s => s.id === saleId)
    if (sale) {
      flashSalesDatabase.updateFlashSale(saleId, {
        ...sale,
        soldOutAt: new Date().toISOString()
      })
      setSoldOutSales(prev => new Map(prev).set(saleId, new Date()))
      
      // Remove sold out sale after 10 hours
      setTimeout(() => {
        setFlashSales(prev => prev.filter(s => s.id !== saleId))
        setSoldOutSales(prev => {
          const newMap = new Map(prev)
          newMap.delete(saleId)
          return newMap
        })
        flashSalesDatabase.deleteFlashSale(saleId)
      }, 10 * 60 * 60 * 1000)
    }
  }, [flashSales])

  const handleQuantityChange = (saleId, newQuantity) => {
    const sale = flashSales.find(s => s.id === saleId)
    const remainingStock = sale ? (sale.remainingStock !== undefined ? sale.remainingStock : (sale.total - sale.sold)) : 0
    const quantity = Math.max(1, parseInt(newQuantity) || 1)
    
    if (quantity > remainingStock) {
      alert(`Only ${remainingStock} units are available`)
      return
    }
    
    setPurchaseQuantities(prev => ({
      ...prev,
      [saleId]: quantity
    }))
  }

  useEffect(() => {
    loadFlashSales()

    // Subscribe to real-time flash sale updates
    const unsubscribe = realTimeSync.subscribe('flash_sale_update', (data) => {
      console.log('Real-time sync event received:', data)
      if (data && data.action) {
        console.log('Reloading flash sales due to real-time sync...')
        loadFlashSales()
      }
    })

    return unsubscribe
  }, [loadFlashSales])

  const handleAddToCart = (flashSale) => {
    if (!user) {
      alert('Please log in to add items to cart')
      navigate('/login')
      return
    }

    const remainingStock = flashSale.remainingStock !== undefined ? flashSale.remainingStock : (flashSale.total - flashSale.sold)
    if (remainingStock <= 0) {
      alert('This flash sale is sold out!')
      return
    }

    const quantity = purchaseQuantities[flashSale.id] || 1
    
    const cartItem = {
      id: flashSale.id,
      name: flashSale.product,
      price: flashSale.price,
      image: flashSale.image,
      supplier: flashSale.supplier,
      supplierId: flashSale.supplierId,
      quantity: quantity,
      isFlashSale: true,
      unit: flashSale.quantityUnit || 'piece'
    }
    
    addToCart(cartItem)
    
    // Reset quantity to 1
    setPurchaseQuantities(prev => ({
      ...prev,
      [flashSale.id]: 1
    }))
    
    // Don't update sold count when adding to cart - only when purchasing
    realTimeSync.emit('flash_sale_update', {
      action: 'add_to_cart',
      flashSale: flashSale,
      supplierId: flashSale.supplierId
    })
    
    alert(`${quantity} ${flashSale.quantityUnit || 'piece'}${quantity > 1 ? 's' : ''} of ${flashSale.product} added to cart!`)
  }

  const handleQuantityConfirm = (quantity) => {
    const cartItem = {
      id: selectedFlashSale.id,
      name: selectedFlashSale.product,
      price: selectedFlashSale.price,
      image: selectedFlashSale.image,
      supplier: selectedFlashSale.supplier,
      supplierId: selectedFlashSale.supplierId,
      quantity: quantity,
      isFlashSale: true,
      unit: selectedFlashSale.quantityUnit || 'piece'
    }
    
    addToCart(cartItem)
    
    // Don't update sold count when adding to cart - only when purchasing
    realTimeSync.emit('flash_sale_update', {
      action: 'add_to_cart',
      flashSale: selectedFlashSale,
      supplierId: selectedFlashSale.supplierId
    })
    
    alert(`${quantity} ${selectedFlashSale.quantityUnit || 'piece'}${quantity > 1 ? 's' : ''} of ${selectedFlashSale.product} added to cart!`)
  }

  const handleBuyNow = (flashSale) => {
    if (!user) {
      alert('Please log in to make a purchase')
      navigate('/login')
      return
    }

    const remainingStock = flashSale.remainingStock !== undefined ? flashSale.remainingStock : (flashSale.total - flashSale.sold)
    if (remainingStock <= 0) {
      alert('This flash sale is sold out!')
      return
    }

    const quantity = purchaseQuantities[flashSale.id] || 1

    setBuyNowItem({
      ...flashSale,
      id: flashSale.id,
      name: flashSale.product,
      supplier: flashSale.supplier,
      supplierId: flashSale.supplierId,
      unit: flashSale.quantityUnit || 'piece',
      price: flashSale.price,
      quantity: quantity,
      totalPrice: flashSale.price * quantity,
      isFlashSale: true,
      total: flashSale.total,
      sold: flashSale.sold,
      remainingStock: remainingStock
    })
    setShowBuyNowDialog(true)
  }

  const handleConfirmOrder = async (orderData) => {
    const { item, quantity, totalPrice, deliveryAddress, paymentMethod } = orderData
    
    console.log('=== PURCHASE STARTED ===')
    console.log('Before purchase - Item:', item.id, 'Sold:', item.sold, 'Total:', item.total, 'Quantity to buy:', quantity)
    
    // Use proper flash sale inventory management
    const updatedSale = flashSalesDatabase.decreaseFlashSaleStock(item.id, quantity)
    
    if (!updatedSale) {
      console.error('Failed to decrease stock!')
      alert('Failed to update flash sale inventory!')
      throw new Error('Failed to update flash sale inventory')
    }
    
    console.log('After decreaseFlashSaleStock - Updated Sale:', updatedSale.id, 'Sold:', updatedSale.sold, 'Total:', updatedSale.total)
    
    // Update local state immediately with the updated sale
    setFlashSales(prev => {
      const updated = prev.map(sale => 
        sale.id === item.id ? updatedSale : sale
      )
      const updatedItem = updated.find(s => s.id === item.id)
      console.log('State updated - Item in state:', updatedItem ? `Sold: ${updatedItem.sold}/${updatedItem.total}` : 'NOT FOUND')
      return updated
    })
    
    // Check if sold out after purchase
    const remainingStock = updatedSale.remainingStock !== undefined ? updatedSale.remainingStock : (updatedSale.total - updatedSale.sold)
    console.log('Remaining stock after purchase:', remainingStock)
    
    if (remainingStock <= 0) {
      console.log('Item is now sold out!')
      handleSoldOut(item.id)
    }
    
    // Create delivery record
    import('../data/userDatabase').then(({ deliveriesDatabase }) => {
      deliveriesDatabase.addDelivery({
        customer: user?.name || 'Customer',
        customerId: user?.id || 1,
        supplier: item.supplier,
        supplierId: item.supplierId,
        products: [`${quantity} ${item.unit || 'piece'} of ${item.name} (Flash Sale)`],
        totalAmount: totalPrice,
        status: 'in-transit',
        orderDate: new Date().toISOString(),
        deliveryDate: new Date().toISOString(),
        deliveryAddress,
        paymentMethod
      })
      console.log('Delivery record created')
    })

    // Emit real-time sync AFTER state update
    console.log('Emitting real-time sync event...')
    realTimeSync.emit('flash_sale_update', {
      action: 'purchase',
      flashSale: updatedSale,
      supplierId: item.supplierId
    })
    
    // Close dialog and show success message
    setShowBuyNowDialog(false)
    setBuyNowItem(null)
    
    console.log('=== PURCHASE COMPLETED ===')
    alert(`Order placed successfully! Total: ₹${totalPrice}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Flash Sales</h1>
              <p className="text-sm text-gray-600 mt-1">Limited time offers - Grab them before they're gone!</p>
            </div>
          </div>
        </div>

      {flashSales.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Flash Sales Available</h3>
          <p className="text-gray-500">Check back later for exciting deals!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashSales.map((sale) => {
            const isExpired = expiredSales.has(sale.id)
            const remainingStock = sale.remainingStock !== undefined ? sale.remainingStock : (sale.total - sale.sold)
            const isSoldOut = soldOutSales.has(sale.id) || remainingStock <= 0
            
            return (
              <div 
                key={sale.id} 
                className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  isSoldOut || isExpired ? 'bg-gray-50 opacity-70' : 'bg-white hover:shadow-2xl hover:-translate-y-1'
                }`}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={sale.image} 
                    alt={sale.product} 
                    className={`w-full h-56 object-cover transition-transform duration-500 ${
                      isSoldOut || isExpired ? 'grayscale' : 'group-hover:scale-110'
                    }`}
                  />
                  {/* Discount Badge - Animated */}
                  <div className={`absolute top-3 right-3 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg animate-pulse ${
                    isSoldOut || isExpired ? 'bg-gray-400/90' : 'bg-gradient-to-r from-red-500 to-orange-500'
                  }`}>
                    <div className="text-white font-bold text-lg">{sale.discount}% OFF</div>
                  </div>
                  {isExpired && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center">
                      <span className="text-white text-3xl font-bold mb-2">⏰ EXPIRED</span>
                      <span className="text-white text-sm">This sale has ended</span>
                    </div>
                  )}
                  {isSoldOut && !isExpired && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-70 flex flex-col items-center justify-center">
                      <span className="text-white text-3xl font-bold mb-2">🔴 SOLD OUT</span>
                      <span className="text-white text-sm">All items have been sold</span>
                    </div>
                  )}
                </div>
                
                <div className={`p-5 ${isSoldOut || isExpired ? 'text-gray-400' : ''}`}>
                  {/* Product Title */}
                  <h3 className={`text-xl font-bold mb-3 ${isSoldOut || isExpired ? 'text-gray-500' : 'text-gray-900'}`}>
                    {sale.product}
                  </h3>
                  
                  {/* Price Section */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className={`text-3xl font-bold ${isSoldOut || isExpired ? 'text-gray-400' : 'text-green-600'}`}>
                      ₹{sale.price}
                    </span>
                    <span className={`text-lg line-through ${isSoldOut || isExpired ? 'text-gray-400' : 'text-gray-500'}`}>
                      ₹{sale.oldPrice}
                    </span>
                    <span className={`text-sm ${isSoldOut || isExpired ? 'text-gray-400' : 'text-gray-600'}`}>
                      / {sale.quantityUnit || 'piece'}
                    </span>
                  </div>
                  
                  {/* Supplier */}
                  <p className={`text-sm mb-4 ${isSoldOut || isExpired ? 'text-gray-400' : 'text-gray-600'}`}>
                    by {sale.supplier}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold ${isSoldOut || isExpired ? 'text-gray-400' : 'text-gray-700'}`}>
                        {sale.sold} / {sale.total} sold
                      </span>
                      <div className={`flex items-center gap-1 text-xs font-semibold ${isSoldOut || isExpired ? 'text-gray-400' : 'text-red-600'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <FlashSaleTimer 
                          endTime={sale.endTime} 
                          onExpired={() => handleTimerExpired(sale.id)}
                        />
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSoldOut || isExpired ? 'bg-gray-400' : 'bg-gradient-to-r from-orange-500 to-red-500'
                        }`}
                        style={{ width: `${(sale.sold / sale.total) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Quantity Selector - Modern */}
                  <div className="mb-4">
                    <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${isSoldOut || isExpired ? 'text-gray-400' : 'text-gray-600'}`}>
                      Select Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center rounded-lg overflow-hidden ${
                        isSoldOut || isExpired ? 'bg-gray-100' : 'bg-gray-50 border-2 border-gray-200'
                      }`}>
                        <button
                          onClick={() => handleQuantityChange(sale.id, (purchaseQuantities[sale.id] || 1) - 1)}
                          disabled={isSoldOut || isExpired || (purchaseQuantities[sale.id] || 1) <= 1}
                          className={`w-10 h-10 flex items-center justify-center font-bold text-lg ${
                            isSoldOut || isExpired
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                          }`}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={remainingStock}
                          value={purchaseQuantities[sale.id] || 1}
                          onChange={(e) => handleQuantityChange(sale.id, e.target.value)}
                          disabled={isSoldOut || isExpired}
                          className={`w-16 h-10 text-center font-bold text-lg bg-transparent border-none outline-none ${
                            isSoldOut || isExpired ? 'text-gray-400' : 'text-gray-900'
                          }`}
                        />
                        <button
                          onClick={() => handleQuantityChange(sale.id, (purchaseQuantities[sale.id] || 1) + 1)}
                          disabled={isSoldOut || isExpired || (purchaseQuantities[sale.id] || 1) >= remainingStock}
                          className={`w-10 h-10 flex items-center justify-center font-bold text-lg ${
                            isSoldOut || isExpired
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                          }`}
                        >
                          +
                        </button>
                      </div>
                      <span className={`text-sm font-medium ${isSoldOut || isExpired ? 'text-gray-400' : 'text-gray-600'}`}>
                        {sale.quantityUnit || 'piece'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons - Modern */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAddToCart(sale)}
                      disabled={isSoldOut || isExpired}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                        isSoldOut || isExpired
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => handleBuyNow(sale)}
                      disabled={isSoldOut || isExpired}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                        isSoldOut || isExpired
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40'
                      }`}
                    >
                      ⚡ Buy Now - ₹{sale.price * (purchaseQuantities[sale.id] || 1)}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showBuyNowDialog && buyNowItem && (
        <BuyNowDialog
          isOpen={showBuyNowDialog}
          onClose={() => {
            setShowBuyNowDialog(false)
            setBuyNowItem(null)
          }}
          item={buyNowItem}
          quantity={buyNowItem.quantity}
          totalPrice={buyNowItem.totalPrice}
          onConfirmOrder={handleConfirmOrder}
        />
      )}

      {showQuantitySelector && selectedFlashSale && (
        <QuantitySelector
          isOpen={showQuantitySelector}
          onClose={() => {
            setShowQuantitySelector(false)
            setSelectedFlashSale(null)
          }}
          item={selectedFlashSale}
          onConfirm={handleQuantityConfirm}
        />
      )}
      </div>
    </div>
  )
}

export default FindSales
