import React, { createContext, useContext, useState, useEffect } from 'react'

const StatsContext = createContext()

export const useStats = () => {
  const context = useContext(StatsContext)
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider')
  }
  return context
}

export const StatsProvider = ({ children }) => {
  const [stats, setStats] = useState({
    verifiedSuppliers: 0,
    activeVendors: 0,
    citiesCovered: 0,
    averageRating: 0
  })

  // Load stats from localStorage on component mount
  useEffect(() => {
    const savedStats = localStorage.getItem('vendorMitraStats')
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
  }, [])

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vendorMitraStats', JSON.stringify(stats))
  }, [stats])

  const updateStats = (newStats) => {
    setStats(prevStats => ({
      ...prevStats,
      ...newStats
    }))
  }

  const addSupplier = () => {
    setStats(prevStats => ({
      ...prevStats,
      verifiedSuppliers: prevStats.verifiedSuppliers + 1
    }))
  }

  const addVendor = () => {
    setStats(prevStats => ({
      ...prevStats,
      activeVendors: prevStats.activeVendors + 1
    }))
  }

  const addCity = () => {
    setStats(prevStats => ({
      ...prevStats,
      citiesCovered: prevStats.citiesCovered + 1
    }))
  }

  const addRating = (rating) => {
    setStats(prevStats => {
      // Calculate new average rating
      const totalRatings = prevStats.averageRating * (prevStats.verifiedSuppliers || 1) + rating
      const newAverageRating = totalRatings / (prevStats.verifiedSuppliers + 1)
      
      return {
        ...prevStats,
        averageRating: parseFloat(newAverageRating.toFixed(1))
      }
    })
  }

  const resetStats = () => {
    setStats({
      verifiedSuppliers: 0,
      activeVendors: 0,
      citiesCovered: 0,
      averageRating: 0
    })
  }

  const value = {
    stats,
    updateStats,
    addSupplier,
    addVendor,
    addCity,
    addRating,
    resetStats
  }

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  )
} 