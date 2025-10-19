import React, { useState } from 'react'
import { ShoppingCart, X, Plus, Minus } from 'lucide-react'

const QuantitySelector = ({ isOpen, onClose, item, onConfirm }) => {
  const [quantity, setQuantity] = useState(1)
  const maxStock = item?.total - item?.sold || 0

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return
    if (newQuantity > maxStock) {
      alert(`Only ${maxStock} items available!`)
      return
    }
    setQuantity(newQuantity)
  }

  const handleConfirm = () => {
    onConfirm(quantity)
    setQuantity(1)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Select Quantity</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            {item?.image && (
              <img 
                src={item.image} 
                alt={item.product}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium">{item?.product}</h4>
              <p className="text-sm text-gray-600">by {item?.supplier}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-green-600">₹{item?.price}</span>
                <span className="text-sm text-gray-500 line-through">₹{item?.oldPrice}</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                  {item?.discount}% OFF
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quantity
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-20 text-center text-lg font-medium border border-gray-300 rounded-lg py-2"
                min="1"
                max={maxStock}
              />
              <span className="text-sm text-gray-500">{item?.quantityUnit || 'piece'}</span>
            </div>
            
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
              disabled={quantity >= maxStock}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-center mt-2">
            <span className="text-sm text-gray-500">
              {maxStock} per {item?.quantityUnit || 'piece'} available
            </span>
          </div>
        </div>

        {/* Total Price */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Price:</span>
            <span className="text-xl font-bold text-blue-600">
              ₹{(item?.price * quantity).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuantitySelector
