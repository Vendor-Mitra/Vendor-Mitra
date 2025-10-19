import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect suppliers to the SupplierDashboard
    if (user && (user.type === 'supplier' || user.userType === 'supplier')) {
      navigate('/supplier-dashboard')
      return
    }
    
    // Redirect vendors to home page (remove welcome page)
    if (user && (user.type === 'vendor' || user.userType === 'vendor')) {
      navigate('/')
      return
    }
    
    // If no user, redirect to login
    if (!user) {
      navigate('/login')
      return
    }
  }, [user, navigate])

  // Show loading while redirecting
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Vendor Dashboard</h1>
      <div className="flex gap-4 mb-8">
        <Link to="/bargains" className="btn-secondary">Bargains</Link>
        <Link to="/collaborative-orders" className="btn-secondary">Collaborative Orders</Link>
      </div>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
