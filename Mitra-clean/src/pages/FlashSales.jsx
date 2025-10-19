import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { Zap, Clock, TrendingUp, Users, ShoppingCart } from 'lucide-react'
import FlashSaleTimer from '../components/FlashSales/FlashSaleTimer'
import { flashSalesDatabase } from '../data/userDatabase'

const FlashSales = () => {
  const { user } = useAuth()
  const { cart, addToCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart()
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [flashSales, setFlashSales] = useState([])

  // Load flash sales from database
  useEffect(() => {
    // Set flash sales to empty array for manual addition
    setFlashSales([])
  }, [])

  const getDiscountPercentage = (oldPrice, newPrice) => {
    return Math.round(((oldPrice - newPrice) / oldPrice) * 100)
  }

  const getProgressPercentage = (sold, total) => {
    return (sold / total) * 100
  }

  const handleBuyNow = (sale) => {
    // Add sale item to cart instead of showing modal
    const cartItem = {
      id: sale.id,
      name: sale.product,
      price: `₹${sale.price}`,
      image: sale.image || '',
      supplier: sale.supplier,
      quantity: 1
    }
    addToCart(cartItem)
    alert(`${sale.product} added to cart!`)
  }

  const handleAddToCart = (sale) => {
    addToCart(sale)
    alert(`${sale.product} added to cart!`)
  }

  const confirmPurchase = () => {
    alert(`Purchase confirmed for ${selectedSale.product}!`)
    setShowBuyModal(false)
    setSelectedSale(null)
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Zap className="w-8 h-8 text-yellow-500" />
        <h1 className="text-3xl font-bold text-primary-600">Flash Sales</h1>
      </div>

      {flashSales.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No active flash sales at the moment.</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for exciting deals!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashSales.map(sale => (
            <div key={sale.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={sale.image || 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'} 
                  alt={sale.product}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop'
                  }}
                />
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                  {sale.discount}% OFF
                </div>
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm font-medium">
                  <FlashSaleTimer endTime={sale.endTime} />
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{sale.product}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-green-600">₹{sale.price}</span>
                  <span className="text-gray-500 line-through">₹{sale.oldPrice}</span>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  by {sale.supplier}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sold: {sale.sold}/{sale.total}</span>
                    <span>{Math.round(getProgressPercentage(sale.sold, sale.total))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(sale.sold, sale.total)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    className="flex-1 btn-primary"
                    onClick={() => handleBuyNow(sale)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats - Only for suppliers */}
      {user && (user.type === 'supplier' || user.userType === 'supplier') && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">₹2,450</div>
            <div className="text-gray-600">Total Savings</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{flashSales.length}</div>
            <div className="text-gray-600">Active Sales</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">1,234</div>
            <div className="text-gray-600">Participants</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Clock className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">45m</div>
            <div className="text-gray-600">Avg Time Left</div>
          </div>
        </div>
      )}

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Cart ({getCartCount()} items)</h3>
          <div className="space-y-2">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="text-xs bg-gray-200 hover:bg-gray-300 px-1 rounded"
                    >
                      -
                    </button>
                    <span className="text-xs">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-xs bg-gray-200 hover:bg-gray-300 px-1 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-medium">₹{item.price}</span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-red-500 hover:text-red-700 ml-2"
                  >
                    Remove
                  </button>
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
          <button className="w-full btn-primary mt-4">Buy Now</button>
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Purchase</h3>
            <div className="mb-4">
              <p><strong>Product:</strong> {selectedSale.product}</p>
              <p><strong>Price:</strong> ₹{selectedSale.price}</p>
              <p><strong>Supplier:</strong> {selectedSale.supplier}</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="flex-1 btn-primary"
                onClick={confirmPurchase}
              >
                Confirm Purchase
              </button>
              <button 
                className="flex-1 btn-secondary"
                onClick={() => setShowBuyModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlashSales 