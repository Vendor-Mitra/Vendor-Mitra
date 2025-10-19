import React, { useState } from 'react'
import { MapPin, CreditCard, Smartphone, Banknote, X } from 'lucide-react'

const BuyNowDialog = ({ isOpen, onClose, item, quantity, totalPrice, onConfirmOrder }) => {
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [isProcessing, setIsProcessing] = useState(false)

  const paymentOptions = [
    { id: 'COD', label: 'Cash on Delivery', icon: Banknote },
    { id: 'UPI', label: 'UPI Payment', icon: Smartphone },
    { id: 'CARD', label: 'Credit/Debit Card', icon: CreditCard },
    { id: 'NETBANKING', label: 'Net Banking', icon: CreditCard }
  ]

  const handleConfirmOrder = async () => {
    if (!deliveryAddress.trim()) {
      alert('Please enter a delivery address')
      return
    }

    setIsProcessing(true)
    
    try {
      await onConfirmOrder({
        item,
        quantity,
        totalPrice,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod
      })
      
      // Reset form
      setDeliveryAddress('')
      setPaymentMethod('COD')
      onClose()
    } catch (error) {
      alert('Failed to place order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Complete Your Order</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-3">Order Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{item?.name}</span>
              <span>{quantity} {item?.unit}</span>
            </div>
            <div className="flex justify-between">
              <span>Price per {item?.unit}</span>
              <span>₹{item?.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Supplier</span>
              <span>{item?.supplier}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount</span>
              <span>₹{totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Delivery Address *
          </label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Enter your complete delivery address..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            disabled={isProcessing}
          />
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="space-y-2">
            {paymentOptions.map((option) => {
              const Icon = option.icon
              return (
                <label
                  key={option.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.id}
                    checked={paymentMethod === option.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                    disabled={isProcessing}
                  />
                  <Icon className="w-5 h-5 mr-2 text-gray-600" />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmOrder}
            disabled={isProcessing || !deliveryAddress.trim()}
            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : `Place Order - ₹${totalPrice}`}
          </button>
        </div>

        {/* Payment Info */}
        {paymentMethod !== 'COD' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              You will be redirected to the payment gateway after confirming your order.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BuyNowDialog
