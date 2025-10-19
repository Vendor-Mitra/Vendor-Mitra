import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { bargainsDatabase } from '../data/userDatabase'

const Bargains = () => {
  const { user } = useAuth()
  const [bargains, setBargains] = useState([])
  const [selectedBargain, setSelectedBargain] = useState(null)
  const [bargainMessage, setBargainMessage] = useState('')
  const [bargainOffer, setBargainOffer] = useState('')

  useEffect(() => {
    if (user && user.id) {
      setBargains(bargainsDatabase.getBargainsByVendor(user.id))
    }
  }, [user])

  const openBargainChat = (bargain) => {
    setSelectedBargain(bargain)
    setBargainMessage('')
    setBargainOffer('')
  }

  const sendBargainMessage = () => {
    if (!bargainOffer) return
    bargainsDatabase.addMessage(selectedBargain.id, {
      sender: 'vendor',
      offer: bargainOffer ? parseFloat(bargainOffer) : undefined,
      message: `Offer: ₹${bargainOffer}`
    })
    // Refresh bargain from DB
    const updated = bargainsDatabase.getBargainById(selectedBargain.id)
    setSelectedBargain(updated)
    setBargainOffer('')
  }

  const confirmBargain = (amount) => {
    if (!amount) {
      alert('Please enter an amount first')
      return
    }
    
    // Update bargain status to accepted
    bargainsDatabase.updateBargain(selectedBargain.id, { 
      status: 'accepted',
      finalPrice: parseFloat(amount)
    })
    
    // Add confirmation message
    bargainsDatabase.addMessage(selectedBargain.id, {
      sender: 'vendor',
      offer: parseFloat(amount),
      message: `Agreement confirmed at ₹${amount}`
    })
    
    // Refresh and close
    const updated = bargainsDatabase.getBargainById(selectedBargain.id)
    setSelectedBargain(updated)
    alert(`Bargain confirmed at ₹${amount}`)
    setSelectedBargain(null)
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Bargains</h1>
      {bargains.length === 0 ? (
        <div className="text-gray-400 text-center">No bargains yet.</div>
      ) : (
        <div className="space-y-4">
          {bargains.map((bargain) => (
            <div key={bargain.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-medium">{bargain.supplierName}</h3>
                  <p className="text-sm text-gray-600">{bargain.productName}</p>
                </div>
                <button onClick={() => openBargainChat(bargain)} className="btn-primary">Open Chat</button>
              </div>
              <div className="text-xs text-gray-500">Status: {bargain.status}</div>
            </div>
          ))}
        </div>
      )}
      {selectedBargain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bargain Chat for {selectedBargain.productName}</h3>
              <button onClick={() => setSelectedBargain(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="mb-4 h-64 overflow-y-auto border rounded p-2 bg-gray-50">
              {selectedBargain.messages.length === 0 ? (
                <div className="text-gray-400 text-center">No messages yet.</div>
              ) : (
                selectedBargain.messages.map((msg, idx) => (
                  <div key={idx} className={`mb-2 ${msg.sender === 'vendor' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block px-3 py-2 rounded-lg ${msg.sender === 'vendor' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      <div className="text-xs text-gray-500 mb-1">{msg.sender === 'vendor' ? 'You' : selectedBargain.supplierName}</div>
                      {msg.offer !== undefined && <div className="font-bold">Offer: ₹{msg.offer}</div>}
                      {msg.message && <div>{msg.message}</div>}
                      <div className="text-xs text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <input type="number" placeholder="Offer (₹)" value={bargainOffer} onChange={e => setBargainOffer(e.target.value)} className="flex-1 border rounded p-2" />
              <button onClick={sendBargainMessage} className="btn-primary">Send Offer</button>
              <button onClick={() => confirmBargain(bargainOffer)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bargains 