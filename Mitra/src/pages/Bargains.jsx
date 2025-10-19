import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useSearchParams } from 'react-router-dom'
import { bargainsDatabase } from '../data/userDatabase'
import Negotiation from '../components/Bargain/Negotiation'
import realTimeSync from '../utils/realTimeSync'
import { MessageSquare } from 'lucide-react'

const Bargains = () => {
  const { user } = useAuth()
  const { cart, updateQuantity } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [bargains, setBargains] = useState([])
  const [selectedBargain, setSelectedBargain] = useState(null)
  const [bargainedPrices, setBargainedPrices] = useState(() => {
    // Load bargained prices from localStorage
    try {
      const saved = localStorage.getItem('vendorMitraBargainedPrices')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Load bargains on mount and when user changes
  useEffect(() => {
    if (user && user.id) {
      const loadBargains = () => {
        let userBargains = bargainsDatabase.getBargainsByVendor(user.id)
        
        // Auto-remove oldest bargains if more than 10
        if (userBargains.length > 10) {
          // Sort by ID (oldest first)
          const sorted = [...userBargains].sort((a, b) => a.id - b.id)
          const toRemove = sorted.slice(0, userBargains.length - 10)
          
          console.log(`🧹 Auto-removing ${toRemove.length} old bargains (keeping latest 10)`)
          
          // Remove from database
          const allBargains = bargainsDatabase.getAllBargains()
          const filtered = allBargains.filter(b => !toRemove.find(r => r.id === b.id))
          bargainsDatabase.bargains = filtered
          localStorage.setItem('vendorMitraBargains', JSON.stringify(filtered))
          
          // Update local list
          userBargains = userBargains.filter(b => !toRemove.find(r => r.id === b.id))
        }
        
        // Sort: newest first
        const sorted = userBargains.sort((a, b) => b.id - a.id)
        setBargains(sorted)
      }
      
      loadBargains()
    }
  }, [user])

  // Handle auto-opening bargain from URL parameter (separate effect)
  useEffect(() => {
    const bargainId = searchParams.get('bargainId')
    if (bargainId && bargains.length > 0) {
      const bargainToOpen = bargains.find(b => b.id === parseInt(bargainId))
      if (bargainToOpen && !selectedBargain) {
        console.log('🔗 Auto-opening bargain from URL:', {
          productName: bargainToOpen.productName,
          id: bargainToOpen.id,
          vendorId: bargainToOpen.vendorId,
          supplierId: bargainToOpen.supplierId,
          messages: bargainToOpen.messages?.length || 0,
          status: bargainToOpen.status
        })
        setSelectedBargain(bargainToOpen)
        // Remove the parameter from URL after opening
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, bargains, selectedBargain, setSearchParams])

  // Subscribe to real-time bargain updates
  useEffect(() => {
    if (user && user.id) {
      const unsub = realTimeSync.subscribe('bargain_update', (data) => {
        if (data && data.vendorId === user.id) {
          const userBargains = bargainsDatabase.getBargainsByVendor(user.id)
          setBargains(userBargains)
          
          // Update selectedBargain if it's currently open
          if (selectedBargain && data.bargain && selectedBargain.id === data.bargain.id) {
            setSelectedBargain(data.bargain)
          }
        }
      })
      
      return () => unsub()
    }
  }, [user, selectedBargain])

  // Persist bargained prices to localStorage
  useEffect(() => {
    localStorage.setItem('vendorMitraBargainedPrices', JSON.stringify(bargainedPrices))
  }, [bargainedPrices])

  const openBargainChat = (bargain) => {
    setSelectedBargain(bargain)
  }

  const closeBargainChat = () => {
    setSelectedBargain(null)
    // Refresh bargains list to show updated status
    if (user && user.id) {
      const updated = bargainsDatabase.getBargainsByVendor(user.id)
      // Sort: newest first
      const sorted = updated.sort((a, b) => b.id - a.id)
      setBargains(sorted)
    }
  }

  const deleteBargain = (bargainId, e) => {
    e.stopPropagation() // Prevent opening chat when clicking delete
    if (confirm('Delete this bargain chat?')) {
      const allBargains = bargainsDatabase.getAllBargains()
      const filtered = allBargains.filter(b => b.id !== bargainId)
      bargainsDatabase.bargains = filtered
      localStorage.setItem('vendorMitraBargains', JSON.stringify(filtered))
      
      // Update local state
      setBargains(prev => prev.filter(b => b.id !== bargainId))
      console.log('🗑️ Deleted bargain:', bargainId)
    }
  }

  const handleBargainConfirmed = ({ product, agreedPrice }) => {
    // Note: Price is now saved directly in Negotiation component
    // This callback is kept for backward compatibility
    closeBargainChat()
    alert(`Bargain confirmed! Price updated to ₹${agreedPrice}/unit for ${product.name}. Check your cart to see the updated price.`)
  }

  const handleBargainRejected = ({ product, rejectedPrice }) => {
    closeBargainChat()
    alert(`Bargain rejected for ${product.name}. The supplier cannot accept ₹${rejectedPrice}. Please try a different price.`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Bargains</h1>
              <p className="text-sm text-gray-600 mt-1">Negotiate prices with suppliers</p>
            </div>
          </div>
        </div>
      {bargains.length === 0 ? (
        <div className="text-gray-400 text-center">No bargains yet.</div>
      ) : (
        <div className="space-y-4">
          {bargains.map((bargain) => {
            const isCompleted = bargain.status === 'agreed' || bargain.status === 'rejected'
            return (
              <div 
                key={bargain.id} 
                className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                  isCompleted ? 'bg-gray-50 opacity-75' : 'bg-white hover:shadow-xl'
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-1 ${
                        isCompleted ? 'text-gray-500' : 'text-gray-900'
                      }`}>{bargain.supplierName}</h3>
                      <p className="text-sm text-gray-600 font-medium">{bargain.productName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openBargainChat(bargain)} 
                        className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                          isCompleted 
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30'
                        }`}
                      >
                        💬 {isCompleted ? 'View Chat' : 'Open Chat'}
                      </button>
                      <button
                        onClick={(e) => deleteBargain(bargain.id, e)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete bargain"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      bargain.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      bargain.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      bargain.status === 'agreed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bargain.status === 'accepted' ? '✓ Both Accepted' :
                       bargain.status === 'rejected' ? '✗ Rejected' :
                       bargain.status === 'agreed' ? '🤝 Deal Done' :
                       bargain.vendorAccepted ? '⏳ Waiting for Supplier' :
                       bargain.supplierAccepted ? '👀 Your Turn' :
                       '⏱️ Pending'}
                    </span>
                    {bargain.finalPrice && (
                      <div className="px-4 py-2 bg-green-50 rounded-full">
                        <span className="text-green-700 font-bold text-lg">₹{bargain.finalPrice}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {selectedBargain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bargain Chat for {selectedBargain.productName}</h3>
              <button onClick={closeBargainChat} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <Negotiation 
              mode="vendor"
              bargainId={selectedBargain.id}
              product={{ 
                id: selectedBargain.productId, 
                name: selectedBargain.productName, 
                supplierId: selectedBargain.supplierId, 
                supplier: selectedBargain.supplierName,
                price: selectedBargain.originalPrice // Pass original price
              }}
              onBargainConfirmed={handleBargainConfirmed}
              onBargainRejected={handleBargainRejected}
              onClose={closeBargainChat}
              readOnly={selectedBargain.status === 'agreed' || selectedBargain.status === 'rejected'}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Bargains 