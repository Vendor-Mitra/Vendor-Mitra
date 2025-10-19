import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useProducts } from '../contexts/ProductContext'
import { ShoppingCart, Trash2, ArrowLeft, CreditCard } from 'lucide-react'
import { deliveriesDatabase, flashSalesDatabase, productDatabase } from '../data/userDatabase'
import { getAllSupplierProducts } from '../data/suppliersDatabase'
import BuyNowDialog from '../components/BuyNow/BuyNowDialog'
import stockManager from '../utils/stockManager'

const Cart = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const { decreaseStock } = useProducts()
  const [showCodModal, setShowCodModal] = useState(false)
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false)
  const [availableStock, setAvailableStock] = useState({})

  const handleBuyNow = () => {
    if (!user) {
      alert('Please log in to make a purchase')
      navigate('/login')
      return
    }
    setShowBuyNowDialog(true)
  }

  const handleConfirmOrder = async (orderData) => {
    const { deliveryAddress, paymentMethod } = orderData
    
    try {
      // First, check stock availability for all items
      const stockChecks = []
      for (const item of cart) {
        if (!item.isFlashSale) {
          const stockCheck = await stockManager.checkAvailability(item.id, item.quantity)
          if (!stockCheck.success || !stockCheck.data.isAvailable) {
            alert(`Insufficient stock for ${item.name}. Available: ${stockCheck.data?.currentStock || 0}, Requested: ${item.quantity}`)
            return
          }
          stockChecks.push({ item, stockCheck })
        }
      }

      // Process stock updates using ProductContext
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const stockUpdatePromises = []
      
      for (const item of cart) {
        if (!item.isFlashSale) {
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
      cart.forEach(item => {
        if (!deliveriesBySupplier[item.supplierId]) {
          deliveriesBySupplier[item.supplierId] = {
            supplier: item.supplier,
            supplierId: item.supplierId,
            products: [],
            totalAmount: 0
          }
        }
        // Remove currency symbol for calculation
        const priceNum = typeof item.price === 'string' ? parseInt(item.price.replace(/[^\d]/g, '')) : item.price
        deliveriesBySupplier[item.supplierId].products.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || 'piece',
          price: priceNum,
          image: item.image
        })
        deliveriesBySupplier[item.supplierId].totalAmount += priceNum * item.quantity
      })
      
      // Create a delivery for each supplier
      const deliverySummaries = []
      Object.values(deliveriesBySupplier).forEach(delivery => {
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
          deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        const productNames = delivery.products.map(p => 
          typeof p === 'string' ? p : `${p.quantity} ${p.unit} ${p.name}`
        )
        deliverySummaries.push(`${delivery.supplier}: ${productNames.join(', ')} (₹${delivery.totalAmount})`)
      })

      // Update sold count for flash sale items
      cart.forEach(item => {
        if (item.isFlashSale) {
          const flashSale = flashSalesDatabase.getFlashSaleById(item.id)
          if (flashSale) {
            flashSalesDatabase.updateFlashSale(item.id, {
              sold: flashSale.sold + item.quantity
            })
          }
        }
      })
      
      alert(`Thank you for your purchase! Total: ₹${getCartTotal()}\n\nStock has been automatically updated for all items.`)
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
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-6">Add some products from our suppliers to get started!</p>
          <Link 
            to="/supplier-finder" 
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Find Suppliers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Buy Now Dialog */}
      <BuyNowDialog
        isOpen={showBuyNowDialog}
        onClose={() => setShowBuyNowDialog(false)}
        item={{
          name: `Cart Items (${cart.length} items)`,
          supplier: 'Multiple Suppliers',
          unit: 'items'
        }}
        quantity={cart.reduce((total, item) => total + item.quantity, 0)}
        totalPrice={getCartTotal()}
        onConfirmOrder={handleConfirmOrder}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/supplier-finder" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-primary-600">Shopping Cart</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{cart.length} items</span>
          <button 
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Cart Items</h2>
            </div>
            <div className="divide-y">
              {cart.map((item, index) => (
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
                        <span className="font-medium text-gray-900">{item.price}</span>
                        <span className="text-xs text-gray-500">per {item.unit || 'piece'}</span>
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
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total ({cart.length} items)</span>
                  <span>₹{getCartTotal()}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleBuyNow}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg"
            >
              <CreditCard className="w-5 h-5" />
              Buy Now
            </button>

            <div className="mt-4 text-center">
              <Link 
                to="/supplier-finder" 
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart 