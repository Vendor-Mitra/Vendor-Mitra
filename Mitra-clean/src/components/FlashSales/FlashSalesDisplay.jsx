import React, { useState, useEffect, useCallback } from 'react'
import { flashSalesDatabase } from '../../data/userDatabase'
import FlashSaleTimer from './FlashSaleTimer'
import realTimeSync from '../../utils/realTimeSync'
import { Zap, ShoppingCart } from 'lucide-react'

const FlashSalesDisplay = ({ onAddToCart }) => {
  const [flashSales, setFlashSales] = useState([])
  const [expiredSales, setExpiredSales] = useState(new Set())

  const loadFlashSales = useCallback(() => {
    const activeFlashSales = flashSalesDatabase.getAllFlashSales()
    // Filter out expired sales that haven't been removed yet
    const currentTime = new Date()
    const validSales = activeFlashSales.filter(sale => {
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
        import('../../data/userDatabase').then(({ productDatabase }) => {
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

    // Set up interval to check for expired sales every 30 seconds
    const intervalId = setInterval(() => {
      loadFlashSales()
    }, 30000)

    return () => {
      unsubscribe()
      clearInterval(intervalId)
    }
  }, [loadFlashSales])

  const handlePurchase = (flashSale) => {
    // Check available stock using remainingStock or calculated value
    const remainingStock = flashSale.remainingStock !== undefined 
      ? flashSale.remainingStock 
      : (flashSale.total - flashSale.sold)
    
    if (remainingStock <= 0) {
      alert('This flash sale is sold out!')
      return
    }

    if (onAddToCart) {
      onAddToCart({
        id: flashSale.id,
        name: flashSale.product,
        price: `₹${flashSale.price}`,
        image: flashSale.image,
        supplier: flashSale.supplier,
        supplierId: flashSale.supplierId,
        quantity: 1,
        isFlashSale: true
      })
    }

    // Use proper inventory management for flash sales
    const updatedSale = flashSalesDatabase.decreaseFlashSaleStock(flashSale.id, 1)
    
    if (!updatedSale) {
      alert('Failed to update flash sale inventory!')
      return
    }
    
    console.log(`Flash sale stock updated: ${flashSale.product} - Remaining: ${updatedSale.remainingStock}`)

    // Reload flash sales to reflect changes
    loadFlashSales()
  }

  if (flashSales.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-800">⚡ Flash Sales</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashSales.map((sale) => {
          const remainingStock = sale.remainingStock !== undefined ? sale.remainingStock : (sale.total - sale.sold)
          const isSoldOut = remainingStock <= 0
          const isExpired = expiredSales.has(sale.id)
          const cardBgClass = isSoldOut ? 'bg-gray-200' : isExpired ? 'bg-gray-100' : 'bg-white'
          const borderClass = isSoldOut ? 'border-gray-400' : isExpired ? 'border-gray-300' : 'border-red-200'
          
          return (
          <div key={sale.id} className={`${cardBgClass} rounded-lg shadow-md p-4 border-2 ${borderClass} relative`}>
            {/* Sold Out / Expired Overlay */}
            {(isSoldOut || isExpired) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center z-10">
                <span className="bg-red-600 text-white text-xl font-bold px-4 py-2 rounded-lg">
                  {isExpired ? 'EXPIRED' : 'SOLD OUT'}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-2">
              <h3 className={`font-bold text-lg ${isSoldOut || isExpired ? 'text-gray-500' : ''}`}>{sale.product}</h3>
              <span className={`text-white text-sm px-2 py-1 rounded-full ${
                isSoldOut || isExpired ? 'bg-gray-400' : 'bg-red-500'
              }`}>
                {sale.discount}% OFF
              </span>
            </div>
            
            {sale.image && (
              <img 
                src={sale.image} 
                alt={sale.product}
                className="w-full h-48 object-cover rounded mb-3"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
                }}
              />
            )}
            
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className={`line-through ${isSoldOut || isExpired ? 'text-gray-400' : 'text-gray-500'}`}>₹{sale.oldPrice}</span>
                <span className={`text-2xl font-bold ${
                  isSoldOut || isExpired ? 'text-gray-500' : 'text-green-600'
                }`}>₹{sale.price}</span>
              </div>
              
              <div className={`text-sm ${isSoldOut || isExpired ? 'text-gray-400' : 'text-gray-600'}`}>
                by {sale.supplier}
              </div>
              
              <div className="flex justify-between text-sm">
                <span className={isSoldOut || isExpired ? 'text-gray-400' : ''}>Sold: {sale.sold}/{sale.total}</span>
                <span className={`font-medium ${
                  isExpired ? 'text-gray-400' : isSoldOut ? 'text-gray-500' : 'text-red-600'
                }`}>
                  <FlashSaleTimer 
                    endTime={sale.endTime} 
                    onExpired={() => handleTimerExpired(sale.id)}
                  />
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isSoldOut || isExpired ? 'bg-gray-400' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((sale.sold / sale.total) * 100, 100)}%` }}
              ></div>
            </div>
            
            <button
              onClick={() => handlePurchase(sale)}
              disabled={isSoldOut || isExpired}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                isSoldOut || isExpired
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {isExpired ? 'Expired' : isSoldOut ? 'Sold Out' : 'Buy Now'}
            </button>
          </div>
          )
        })}
      </div>
    </div>
  )
}

export default FlashSalesDisplay
