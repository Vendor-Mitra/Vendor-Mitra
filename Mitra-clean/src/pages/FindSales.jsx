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

  const loadFlashSales = useCallback(() => {
    const sales = flashSalesDatabase.getAllFlashSales()
    const currentTime = new Date()
    
    // Filter out expired sales
    const validSales = sales.filter(sale => {
      const endTime = new Date(sale.endTime)
      return currentTime < endTime
    })
    setFlashSales(validSales)
  }, [])

  // Handle timer expiration
  const handleTimerExpired = useCallback((saleId) => {
    setExpiredSales(prev => new Set([...prev, saleId]))
    // Remove expired sale after a short delay to show "EXPIRED" state
    setTimeout(() => {
      const expiredSale = flashSales.find(sale => sale.id === saleId)
      if (expiredSale && expiredSale.total > expiredSale.sold) {
        // Move remaining stock back to normal product catalog
        const remainingStock = expiredSale.total - expiredSale.sold
        // Add back to product database with original price
        const productData = {
          name: expiredSale.product,
          price: expiredSale.oldPrice || expiredSale.price,
          quantity: remainingStock,
          unit: 'kg', // Default unit
          description: `${expiredSale.product} - Flash sale ended`,
          image: expiredSale.image,
          isOrganic: false,
          supplier: expiredSale.supplier,
          supplierId: expiredSale.supplierId,
          category: 'general'
        }
        // Import productDatabase to add the product back
        import('../data/userDatabase').then(({ productDatabase }) => {
          productDatabase.addProduct(productData)
        })
      }
      
      setFlashSales(prev => prev.filter(sale => sale.id !== saleId))
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
        remainingStock: expiredSale ? expiredSale.total - expiredSale.sold : 0
      })
    }, 2000)
  }, [flashSales])

  useEffect(() => {
    loadFlashSales()

    // Subscribe to real-time flash sale updates
    const unsubscribe = realTimeSync.subscribe('flash_sale_update', (data) => {
      if (data && data.action) {
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

    if (flashSale.sold >= flashSale.total) {
      alert('This flash sale is sold out!')
      return
    }

    // Double check remaining stock
    const remainingStock = flashSale.remainingStock !== undefined ? flashSale.remainingStock : (flashSale.total - flashSale.sold)
    if (remainingStock <= 0) {
      alert('This flash sale is sold out!')
      return
    }

    setSelectedFlashSale(flashSale)
    setShowQuantitySelector(true)
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

    if (flashSale.sold >= flashSale.total) {
      alert('This flash sale is sold out!')
      return
    }

    // Double check remaining stock
    const remainingStock = flashSale.remainingStock !== undefined ? flashSale.remainingStock : (flashSale.total - flashSale.sold)
    if (remainingStock <= 0) {
      alert('This flash sale is sold out!')
      return
    }

    setBuyNowItem({
      ...flashSale,
      name: flashSale.product,
      supplier: flashSale.supplier,
      unit: flashSale.quantityUnit || 'piece',
      quantity: 1,
      totalPrice: flashSale.price
    })
    setShowBuyNowDialog(true)
  }

  const handleConfirmOrder = async (orderData) => {
    const { item, quantity, totalPrice, deliveryAddress, paymentMethod } = orderData
    
    // Use proper flash sale inventory management
    const updatedSale = flashSalesDatabase.decreaseFlashSaleStock(item.id, quantity)
    
    if (!updatedSale) {
      alert('Failed to update flash sale inventory!')
      return
    }
    
    // Create delivery record
    import('../data/userDatabase').then(({ deliveriesDatabase }) => {
      deliveriesDatabase.addDelivery({
        customer: user?.name || 'Customer',
        customerId: user?.id || 1,
        supplier: item.supplier,
        supplierId: item.supplierId,
        products: [`${quantity} piece of ${item.product} (Flash Sale)`],
        totalAmount: totalPrice,
        status: 'in-transit',
        deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryAddress,
        paymentMethod
      })
    })

    realTimeSync.emit('flash_sale_update', {
      action: 'purchase',
      flashSale: updatedSale,
      supplierId: item.supplierId
    })
    
    loadFlashSales()
    alert(`Order placed successfully! Total: ₹${totalPrice}`)
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Zap className="w-8 h-8 text-orange-600" />
        <h1 className="text-3xl font-bold text-orange-600">Flash Sales</h1>
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
            const isSoldOut = remainingStock <= 0
            
            return (
              <div 
                key={sale.id} 
                className={`bg-white rounded-lg shadow-md overflow-hidden border transition-all duration-300 ${
                  isSoldOut || isExpired ? 'opacity-60 bg-gray-100' : 'hover:shadow-lg'
                }`}
              >
                <div className="relative">
                  <img 
                    src={sale.image} 
                    alt={sale.product} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    {sale.discount}% OFF
                  </div>
                  {isExpired && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">EXPIRED</span>
                    </div>
                  )}
                  {isSoldOut && !isExpired && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">SOLD OUT</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{sale.product}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">₹{sale.price}</span>
                      <span className="text-sm text-gray-500 line-through">₹{sale.oldPrice}</span>
                      <span className="text-xs text-gray-500">per {sale.quantityUnit || 'piece'}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">by {sale.supplier}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">
                      Sold: {sale.sold}/{sale.total} per {sale.quantityUnit || 'piece'}
                    </span>
                    <div className="flex items-center gap-1 text-red-500">
                      <Clock className="w-4 h-4" />
                      <FlashSaleTimer 
                        endTime={sale.endTime} 
                        onExpired={() => handleTimerExpired(sale.id)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(sale)}
                      disabled={isSoldOut || isExpired}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => handleBuyNow(sale)}
                      disabled={isSoldOut || isExpired}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Buy Now
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
  )
}

export default FindSales
