import React, { useEffect, useMemo, useState } from 'react'
import { bargainsDatabase } from '../../data/userDatabase'
import realTimeSync from '../../utils/realTimeSync'
import { useCart } from '../../contexts/CartContext'

// mode: 'vendor' | 'supplier'
// Syncs with bargainsDatabase so both sides see the same conversation in real time
const Negotiation = ({ mode = 'vendor', bargainId = null, product = null, onBargainConfirmed = null, onBargainRejected = null, onClose = null, readOnly = false }) => {
  const { addToCart } = useCart()
  const [bargain, setBargain] = useState(null)
  const [input, setInput] = useState('')
  const [isFinal, setIsFinal] = useState(false)
  const [dealDoneByMe, setDealDoneByMe] = useState(false)

  useEffect(() => {
    if (!bargainId) return
    const load = () => {
      const b = bargainsDatabase.getBargainById(bargainId)
      setBargain(b || null)
    }
    load()
    const unsub = realTimeSync.subscribe('bargain_update', (data) => {
      if (data?.bargain?.id === bargainId) load()
    })
    return () => unsub()
  }, [bargainId])

  const lastOffer = useMemo(() => {
    if (!bargain || !bargain.messages?.length) return null
    const withOffer = [...bargain.messages].reverse().find(m => typeof m.offer === 'number')
    return withOffer || null
  }, [bargain])

  const canRespondToLastOffer = useMemo(() => {
    if (!lastOffer) return false
    // Only the opposite side can accept/reject
    return (mode === 'vendor' && lastOffer.sender !== 'vendor') || (mode === 'supplier' && lastOffer.sender !== 'supplier')
  }, [lastOffer, mode])

  const sendMessage = (text, sender, offer = undefined) => {
    if (!bargainId) return
    bargainsDatabase.addMessage(bargainId, { sender, message: text, offer })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || !bargainId) return
    // Prevent sending new messages once a deal has been accepted
    const current = bargainsDatabase.getBargainById(bargainId)
    if (current?.status === 'accepted' || current?.status === 'agreed') return
    const offerMatch = input.match(/(\d+)/)
    const offer = offerMatch ? parseInt(offerMatch[1]) : undefined
    sendMessage(input, mode, offer)
    setInput('')
    
    // Immediately reload the bargain to show the new message
    setTimeout(() => {
      const updated = bargainsDatabase.getBargainById(bargainId)
      setBargain(updated)
    }, 100)
  }

  const handleAccept = () => {
    if (!bargainId || !lastOffer || !canRespondToLastOffer) return
    // Single-acceptance locking: first acceptance finalizes the price and locks chat
    const updates = {
      finalPrice: lastOffer.offer,
      vendorAccepted: mode === 'vendor' ? true : bargain?.vendorAccepted || false,
      supplierAccepted: mode === 'supplier' ? true : bargain?.supplierAccepted || false,
      acceptedBy: mode,
      status: 'accepted'
    }
    bargainsDatabase.updateBargain(bargainId, updates)
    sendMessage(`Accepted at ₹${lastOffer.offer}`, mode, lastOffer.offer)
    
    // Immediately reload the bargain to show updated state in current view
    const updated = bargainsDatabase.getBargainById(bargainId)
    setBargain(updated)
    
    // Clear input after accepting
    setInput('')
  }

  const handleReject = () => {
    if (!bargainId || !lastOffer || !canRespondToLastOffer) return
    bargainsDatabase.updateBargain(bargainId, { status: 'rejected', vendorAccepted: false, supplierAccepted: false, finalPrice: undefined })
    sendMessage(`Rejected offer ₹${lastOffer.offer}`, mode)
    
    // Immediately reload the bargain to show updated state in current view
    const updated = bargainsDatabase.getBargainById(bargainId)
    setBargain(updated)
    
    if (onBargainRejected && product) {
      onBargainRejected({ product, rejectedPrice: lastOffer.offer, originalPrice: undefined })
    }
  }

  const handleDealDone = () => {
    if (readOnly || !bargainId || !bargain?.finalPrice) return
    
    // Mark that this user clicked Deal Done
    const updates = {
      vendorDealDone: mode === 'vendor' ? true : bargain?.vendorDealDone || false,
      supplierDealDone: mode === 'supplier' ? true : bargain?.supplierDealDone || false
    }
    
    // If single-accept flow: allow only the other side to finalize immediately
    if (bargain?.status === 'accepted' && bargain?.acceptedBy && mode !== bargain.acceptedBy) {
      updates.vendorDealDone = true
      updates.supplierDealDone = true
      updates.status = 'agreed'
      
      // Save bargained per-unit price to localStorage immediately
      if (bargain) {
        try {
          const saved = localStorage.getItem('vendorMitraBargainedPrices')
          const bargainedPrices = saved ? JSON.parse(saved) : {}
          bargainedPrices[bargain.productId] = {
            isBargained: true,
            bargainedPricePerUnit: bargain.finalPrice,
            originalPricePerUnit: bargain.originalPrice,
            quantity: bargain.quantity,
            unit: bargain.unit || 'kg',
            supplierId: bargain.supplierId,
            supplierName: bargain.supplierName
          }
          localStorage.setItem('vendorMitraBargainedPrices', JSON.stringify(bargainedPrices))
          window.dispatchEvent(new Event('bargainPriceUpdated'))
          window.dispatchEvent(new Event('storage'))
        } catch (e) {
          console.error('Error saving bargained price (single finalize):', e)
        }
      }
      
      setIsFinal(true)
      if (onBargainConfirmed && product) {
        onBargainConfirmed({ product, agreedPrice: bargain.finalPrice, originalPrice: product?.price })
      }
      alert(`Deal confirmed at ₹${bargain.finalPrice}! ${mode === 'vendor' ? 'Cart price updated. Check your cart to see the bargained price!' : 'Deal completed!'}`)
      if (onClose) {
        setTimeout(() => onClose(), 1000)
      }
    } else if (updates.vendorDealDone && updates.supplierDealDone) {
      updates.status = 'agreed'
      
      // Save bargained per-unit price to localStorage
      // IMPORTANT: Save regardless of mode (vendor or supplier) to ensure it's always saved
      if (bargain) {
        try {
          const saved = localStorage.getItem('vendorMitraBargainedPrices')
          const bargainedPrices = saved ? JSON.parse(saved) : {}
          
          // Store the bargained per-unit price
          bargainedPrices[bargain.productId] = {
            isBargained: true,
            bargainedPricePerUnit: bargain.finalPrice, // This is the per-unit price
            originalPricePerUnit: bargain.originalPrice, // This is the original per-unit price
            quantity: bargain.quantity,
            unit: bargain.unit || 'kg',
            supplierId: bargain.supplierId,
            supplierName: bargain.supplierName
          }
          
          localStorage.setItem('vendorMitraBargainedPrices', JSON.stringify(bargainedPrices))
          console.log('✅ Saved bargained per-unit price:', bargain.finalPrice, '/' + (bargain.unit || 'kg'), 'for', bargain.productName)
          console.log('🔑 Bargain Product ID (key used):', bargain.productId)
          console.log('📦 All bargained prices:', bargainedPrices)
          console.log('👤 Saved by:', mode)
          
          // Trigger custom event to update cart in real-time (same window)
          window.dispatchEvent(new Event('bargainPriceUpdated'))
          // Also trigger storage event for cross-window updates
          window.dispatchEvent(new Event('storage'))
        } catch (e) {
          console.error('Error saving bargained price:', e)
        }
      }
      
      setIsFinal(true)
      if (onBargainConfirmed && product) {
        onBargainConfirmed({ product, agreedPrice: bargain.finalPrice, originalPrice: product?.price })
      }
      
      // Show success message
      alert(`Deal confirmed at ₹${bargain.finalPrice}! ${mode === 'vendor' ? 'Cart price updated. Check your cart to see the bargained price!' : 'Deal completed!'}`)
      
      if (onClose) {
        setTimeout(() => onClose(), 1000)
      }
    } else {
      // Just this user clicked, wait for other side
      setDealDoneByMe(true)
    }
    
    bargainsDatabase.updateBargain(bargainId, updates)
    
    // Reload bargain to show updated state
    const updated = bargainsDatabase.getBargainById(bargainId)
    setBargain(updated)
  }

  const agreedByBoth = (bargain?.vendorAccepted && bargain?.supplierAccepted && typeof bargain?.finalPrice === 'number') || bargain?.status === 'accepted'
  
  // Check if current user has accepted
  const currentUserAccepted = mode === 'vendor' ? bargain?.vendorAccepted : bargain?.supplierAccepted
  
  // Check if deal is completely done (both clicked Deal Done)
  const isDealDone = bargain?.status === 'agreed' || (bargain?.vendorDealDone && bargain?.supplierDealDone)
  
  // Disable input if current user has accepted or if deal is final or if deal is done
  const isInputDisabled = isFinal || currentUserAccepted || readOnly || isDealDone || bargain?.status === 'accepted'

  return (
    <div>
      <h4 className="font-bold">Bargain Chat</h4>
      
      {/* Show original price and quantity info */}
      {(product?.price || bargain?.originalPrice) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">Original Price Per Unit:</span>
            <span className="text-lg font-bold text-blue-900">₹{product?.price || bargain?.originalPrice}/{bargain?.unit || 'kg'}</span>
          </div>
          {bargain?.quantity && (
            <div className="text-xs text-blue-600 mt-1">
              Quantity: {bargain.quantity} {bargain.unit || 'kg'}
            </div>
          )}
          <div className="text-xs text-blue-600 mt-1">
            💡 Negotiate on the price per {bargain?.unit || 'kg'}!
          </div>
        </div>
      )}
      
      <div className="h-48 overflow-y-auto bg-gray-50 p-2 rounded">
        {!bargain?.messages?.length ? (
          <div className="text-gray-400 text-center">No messages yet.</div>
        ) : (
          bargain.messages.map((msg, i) => (
            <div key={i} className={`mb-2 ${msg.sender === 'vendor' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block px-3 py-1 rounded ${msg.sender === 'vendor' ? 'bg-primary-100' : 'bg-gray-200'}`}>
                <b>{msg.sender === 'vendor' ? 'Vendor' : 'Supplier'}:</b> {msg.message}
                {typeof msg.offer === 'number' && <div className="font-bold text-green-600">Offer: ₹{msg.offer}</div>}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Helper message when no offers yet */}
      {!bargain?.messages?.length && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          💡 <b>Tip:</b> Start by sending your offer price per {bargain?.unit || 'kg'} (e.g., type "150" for ₹150/{bargain?.unit || 'kg'})
        </div>
      )}

      {/* Compose */}
      {!readOnly && !isDealDone && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="input-field flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isInputDisabled ? "You have accepted the offer" : "Type your offer (e.g., 250) or message..."}
            disabled={isInputDisabled}
          />
          <button className="btn-primary" type="submit" disabled={isInputDisabled}>Send</button>
        </form>
      )}
      
      {/* Show view-only message when deal is done */}
      {isDealDone && !readOnly && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center mt-3">
          <div className="text-green-700 font-bold text-lg mb-1">✅ Deal Completed!</div>
          <div className="text-green-600 text-sm">
            Final price: ₹{bargain?.finalPrice}/{bargain?.unit || 'kg'}
          </div>
          <div className="text-gray-600 text-xs mt-2">
            📜 Chat is now view-only. You can review the conversation above.
          </div>
        </div>
      )}
      
      {/* Show message when user has accepted */}
      {currentUserAccepted && !agreedByBoth && !readOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800 mt-2">
          ✓ You have accepted the offer at ₹{bargain?.finalPrice}. Waiting for {mode === 'vendor' ? 'supplier' : 'vendor'} to accept.
        </div>
      )}
      
      {readOnly && (
        <div className="bg-gray-100 border border-gray-300 rounded p-3 text-center text-gray-600">
          🔒 This bargain is completed (read-only)
        </div>
      )}

      {/* Action buttons for the other side's last offer */}
      {lastOffer && canRespondToLastOffer && !isFinal && !agreedByBoth && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-gray-600">
            {mode === 'vendor' ? 'Supplier' : 'Vendor'} offered <b className="text-green-600">₹{lastOffer.offer}</b>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAccept} className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Accept ₹{lastOffer.offer}</button>
            <button onClick={handleReject} className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Reject</button>
          </div>
        </div>
      )}

      {/* Show when waiting for other side to respond */}
      {lastOffer && !canRespondToLastOffer && !agreedByBoth && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
          ⏳ Waiting for {mode === 'vendor' ? 'supplier' : 'vendor'} to respond to your offer of ₹{lastOffer.offer}
        </div>
      )}

      {/* Deal finalization */}
      {agreedByBoth && !isFinal && !isDealDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 font-medium mb-2">✓ Both parties agreed at ₹{bargain.finalPrice}</div>
          
          {/* Show status of Deal Done clicks */}
          <div className="text-sm text-green-700 mb-3">
            {bargain?.vendorDealDone && <div>✓ Vendor confirmed deal</div>}
            {bargain?.supplierDealDone && <div>✓ Supplier confirmed deal</div>}
            {!bargain?.vendorDealDone && mode === 'supplier' && <div>⏳ Waiting for vendor to confirm...</div>}
            {!bargain?.supplierDealDone && mode === 'vendor' && <div>⏳ Waiting for supplier to confirm...</div>}
          </div>
          
          {/* Deal Done button for current user */}
          {(
            // After single acceptance, only the non-accepting side should see Deal Done
            ((bargain?.status === 'accepted' && bargain?.acceptedBy && mode !== bargain.acceptedBy) &&
              ((mode === 'vendor' && !bargain?.vendorDealDone) || (mode === 'supplier' && !bargain?.supplierDealDone))) ||
            // Backward compatibility: if both accepted flow was used
            ((bargain?.vendorAccepted && bargain?.supplierAccepted) &&
              ((mode === 'vendor' && !bargain?.vendorDealDone) || (mode === 'supplier' && !bargain?.supplierDealDone)))
          ) && (
            <button 
              onClick={handleDealDone} 
              disabled={readOnly || dealDoneByMe}
              className={`w-full px-4 py-2 rounded font-medium ${
                readOnly || dealDoneByMe
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {dealDoneByMe ? 'Waiting for other party...' : 'Confirm Deal Done'}
            </button>
          )}
          
          {/* Show when user already clicked */}
          {((mode === 'vendor' && bargain?.vendorDealDone) || (mode === 'supplier' && bargain?.supplierDealDone)) && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-800 text-center">
              ✓ You confirmed the deal. Waiting for {mode === 'vendor' ? 'supplier' : 'vendor'} to confirm.
            </div>
          )}
        </div>
      )}

      {isFinal && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-blue-700 font-semibold">✓ Deal confirmed at ₹{bargain?.finalPrice}</div>
        </div>
      )}
    </div>
  )
}

export default Negotiation