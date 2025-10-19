import React, { useState } from 'react'

const Negotiation = ({ initialOffer = 100, product = null, onBargainConfirmed = null }) => {
  const [messages, setMessages] = useState([
    { sender: 'supplier', text: `Current price: ₹${initialOffer}` }
  ])
  const [agreedPrice, setAgreedPrice] = useState(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Update messages when initialOffer changes
  React.useEffect(() => {
    setMessages([{ sender: 'supplier', text: `Current price: ₹${initialOffer}` }])
  }, [initialOffer])
  const [input, setInput] = useState('')

  const sendMessage = (text, sender, offer = null) => {
    setMessages([...messages, { sender, text, offer }])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // Check if input is a price offer (number)
    const offerMatch = input.match(/(\d+)/)
    const offer = offerMatch ? parseInt(offerMatch[1]) : null
    
    sendMessage(input, 'vendor', offer)
    setInput('')
    
    // Removed automatic supplier responses - suppliers must manually respond
  }

  // Feature 3: Confirm option to settle at agreed price
  const handleConfirmBargain = () => {
    if (agreedPrice && product) {
      setIsConfirmed(true)
      if (onBargainConfirmed) {
        onBargainConfirmed({
          product,
          agreedPrice,
          originalPrice: initialOffer
        })
      }
    }
  }

  return (
    <div className="card space-y-4">
      <h4 className="font-bold">Bargain/Negotiate</h4>
      <div className="h-40 overflow-y-auto bg-gray-50 p-2 rounded">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.sender === 'vendor' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-1 rounded ${msg.sender === 'vendor' ? 'bg-primary-100' : 'bg-gray-200'}`}>
              <b>{msg.sender === 'vendor' ? 'You' : 'Supplier'}:</b> {msg.text}
              {msg.offer && <div className="font-bold text-green-600">Offer: ₹{msg.offer}</div>}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input-field flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your offer or message..."
          disabled={isConfirmed}
        />
        <button className="btn-primary" type="submit" disabled={isConfirmed}>Send</button>
      </form>
      
      {/* Agreement section - only shows when manually set by supplier */}
      {agreedPrice && !isConfirmed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-semibold text-green-800 mb-2">Agreement Reached!</h5>
          <p className="text-green-700 mb-3">
            Both parties agree on ₹{agreedPrice} (Original: ₹{initialOffer})
          </p>
          <div className="flex gap-2">
            <button 
              onClick={handleConfirmBargain}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Confirm & Add to Cart
            </button>
          </div>
        </div>
      )}
      
      {isConfirmed && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 font-semibold">✓ Deal confirmed! Item added to cart at ₹{agreedPrice}</p>
        </div>
      )}
    </div>
  )
}

export default Negotiation 