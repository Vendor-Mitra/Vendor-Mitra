import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { 
  Menu, 
  X, 
  MapPin, 
  ShoppingCart, 
  Zap,
  Store,
  Home,
  BarChart3,
  Package,
  MessageSquare,
  ChevronDown,
  Settings,
  Users,
  
} from 'lucide-react'
import logoImage from '../../assets/logo.png.jpeg'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const { user } = useAuth()
  const { getCartCount } = useCart()
  const { bargainNotifications } = useNotifications()
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Find Items', href: '/find-items', icon: Package },
    { name: 'Flash Sales', href: '/find-sales', icon: Zap },
    { name: 'Suppliers', href: '/suppliers', icon: MapPin },
    { name: 'Organic', href: '/organic', icon: Store },
    { name: 'Bargains', href: '/bargains', icon: MessageSquare },
  ]

  // Filter navigation based on user type
  const getFilteredNavigation = () => {
    if (user && (user.type === 'supplier' || user.userType === 'supplier')) {
      // Suppliers see only their dashboard and profile
      return []
    }
    // Vendors see all navigation items
    return navigation
  }

  return (
    <nav className="bg-white shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center -ml-32">
            <Link to="/" className="flex items-center mr-8">
              {/* Vendor Mitra Logo */}
              <img 
                src={logoImage} 
                alt="Vendor Mitra - Connecting Street Vendors & Suppliers" 
                className="h-32 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {getFilteredNavigation().map((item) => {
              const Icon = item.icon
              const showBadge = item.name === 'Bargains' && bargainNotifications > 0
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors relative whitespace-nowrap ${
                    location.pathname === item.href
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {item.name}
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {bargainNotifications}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center space-x-8 ml-8">
            {/* Cart Icon - Only for vendors */}
            {(!user || (user.type !== 'supplier' && user.userType !== 'supplier')) && (
              <div className="relative">
                <Link to="/cart" className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">({getCartCount()})</span>
                </Link>
              </div>
            )}


            {/* Auth Buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{user.name?.charAt(0) || 'U'}</span>
                  </div>
                  <span className="font-medium">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {(user.type === 'supplier' || user.userType === 'supplier') && (
                      <Link
                        to="/supplier-dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <BarChart3 className="w-4 h-4 mr-3" />
                        My Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {getFilteredNavigation().map((item) => {
              const Icon = item.icon
              const showBadge = item.name === 'Bargains' && bargainNotifications > 0
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium relative ${
                    location.pathname === item.href
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                  {showBadge && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {bargainNotifications}
                    </span>
                  )}
                </Link>
              )
            })}
            
            {/* Mobile Cart Link - Only for vendors */}
            {(!user || (user.type !== 'supplier' && user.userType !== 'supplier')) && (
              <Link
                to="/cart"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({getCartCount()})
              </Link>
            )}

            {user ? (
              <div className="pt-4 border-t border-gray-200">
                {/* Dashboard link - Only for suppliers */}
                {(user.type === 'supplier' || user.userType === 'supplier') && (
                  <Link
                    to="/supplier-dashboard"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600"
                    onClick={() => setIsOpen(false)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:text-primary-600"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar 