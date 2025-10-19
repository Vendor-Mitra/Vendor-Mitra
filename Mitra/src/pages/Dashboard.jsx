import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Vendor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your orders and activities</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mb-8">
          <Link to="/bargains" className="px-6 py-3 bg-white text-gray-700 font-medium rounded-xl hover:shadow-lg transition-all border border-gray-200">Bargains</Link>
          <Link to="/collaborative-orders" className="px-6 py-3 bg-white text-gray-700 font-medium rounded-xl hover:shadow-lg transition-all border border-gray-200">Collaborative Orders</Link>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center bg-white rounded-2xl shadow-xl p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Redirecting...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
