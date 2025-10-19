import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { bargainsDatabase } from '../data/userDatabase'
import realTimeSync from '../utils/realTimeSync'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [bargainNotifications, setBargainNotifications] = useState(0)

  // Calculate unread bargain notifications
  const calculateBargainNotifications = () => {
    if (!user || !user.id) return 0
    
    console.log('Calculating bargain notifications for user:', user.id, 'type:', user.type || user.userType)
    
    let count = 0
    
    if (user.type === 'supplier' || user.userType === 'supplier') {
      // Suppliers: actionable when vendor messaged last, or vendor accepted and supplier needs to finalize
      const supplierBargains = bargainsDatabase.getBargainsBySupplier(user.id)
      const actionable = supplierBargains.filter(b => {
        const lastMsg = b.messages?.[b.messages.length - 1]
        const lastFromVendor = lastMsg?.sender === 'vendor'
        const waitingDealDone = b.status === 'accepted' && b.acceptedBy === 'vendor' && !b.supplierDealDone
        const pendingWithMessage = b.status === 'pending' && lastFromVendor
        return pendingWithMessage || waitingDealDone
      })
      count = actionable.length
    } else {
      // Vendors: actionable when supplier messaged last, or supplier accepted and vendor needs to finalize
      const vendorBargains = bargainsDatabase.getBargainsByVendor(user.id)
      const actionable = vendorBargains.filter(b => {
        const lastMsg = b.messages?.[b.messages.length - 1]
        const lastFromSupplier = lastMsg?.sender === 'supplier'
        const waitingDealDone = b.status === 'accepted' && b.acceptedBy === 'supplier' && !b.vendorDealDone
        const pendingWithMessage = b.status === 'pending' && lastFromSupplier
        return pendingWithMessage || waitingDealDone
      })
      count = actionable.length
    }
    
    return count
  }

  // Update notifications when user changes or bargains update
  useEffect(() => {
    if (user && user.id) {
      const updateNotifications = () => {
        const count = calculateBargainNotifications()
        setBargainNotifications(count)
      }
      
      // Initial calculation
      updateNotifications()
      
      // Subscribe to bargain updates
      const unsubscribe = realTimeSync.subscribe('bargain_update', (data) => {
        // Update if the bargain involves this user
        if (data && data.bargain) {
          const isRelevant = 
            (user.type === 'supplier' || user.userType === 'supplier') 
              ? data.bargain.supplierId === user.id
              : data.bargain.vendorId === user.id
          
          if (isRelevant) {
            updateNotifications()
          }
        }
      })
      
      return () => unsubscribe()
    } else {
      setBargainNotifications(0)
    }
  }, [user])

  const value = {
    bargainNotifications,
    refreshNotifications: () => {
      const count = calculateBargainNotifications()
      setBargainNotifications(count)
    }
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationContext
