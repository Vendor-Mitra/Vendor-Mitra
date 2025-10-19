import React, { createContext, useContext, useState, useEffect } from 'react'
import { authenticateUser, authenticateUserOrSupplier, registerUser } from '../data/userDatabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState(null) // 'vendor' or 'supplier'

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('vendorMitraUser')
    const storedUserType = localStorage.getItem('vendorMitraUserType')
    
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setUserType(storedUserType)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      // Use the enhanced authentication that checks both users and suppliers
      const authenticatedUser = authenticateUserOrSupplier(email, password)
      if (authenticatedUser) {
        setUser(authenticatedUser)
        setUserType(authenticatedUser.userType)
        localStorage.setItem('vendorMitraUser', JSON.stringify(authenticatedUser))
        localStorage.setItem('vendorMitraUserType', authenticatedUser.userType)
        return { success: true }
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      // Use the database registration
      const newUser = registerUser(userData)
      setUser(newUser)
      setUserType(newUser.userType)
      localStorage.setItem('vendorMitraUser', JSON.stringify(newUser))
      localStorage.setItem('vendorMitraUserType', newUser.userType)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setUser(null)
    setUserType(null)
    localStorage.removeItem('vendorMitraUser')
    localStorage.removeItem('vendorMitraUserType')
    // Force page reload to clear any cached state
    window.location.href = '/'
  }

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('vendorMitraUser', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    userType,
    loading,
    login,
    register,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 