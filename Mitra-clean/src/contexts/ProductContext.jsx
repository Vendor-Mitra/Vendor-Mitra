import React, { createContext, useContext, useState, useEffect } from 'react'
import productApi from '../services/productApi'

const ProductContext = createContext()

export const useProducts = () => {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load all products
  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await productApi.getAllProducts()
      if (response.success) {
        // Remove duplicates by ID before setting
        const uniqueProducts = response.data.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        )
        console.log('Loading products with duplicate removal:', uniqueProducts.length, 'unique products')
        setProducts(uniqueProducts)
        
        // Also save to localStorage for persistence
        localStorage.setItem('vendorMitraProducts', JSON.stringify(uniqueProducts))
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('Failed to load products')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Add new product
  const addProduct = async (productData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await productApi.createProduct(productData)
      if (response.success) {
        setProducts(prev => [...prev, response.data])
        return response.data
      } else {
        setError(response.message)
        return null
      }
    } catch (err) {
      setError('Failed to add product')
      console.error('Error adding product:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Update product
  const updateProduct = async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const response = await productApi.updateProduct(id, updates)
      if (response.success) {
        setProducts(prev => prev.map(p => p.id === id ? response.data : p))
        return response.data
      } else {
        setError(response.message)
        return null
      }
    } catch (err) {
      setError('Failed to update product')
      console.error('Error updating product:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Delete product
  const deleteProduct = async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await productApi.deleteProduct(id)
      if (response.success) {
        setProducts(prev => prev.filter(p => p.id !== id))
        return true
      } else {
        setError(response.message)
        return false
      }
    } catch (err) {
      setError('Failed to delete product')
      console.error('Error deleting product:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Get products by supplier
  const getProductsBySupplier = (supplierId) => {
    return products.filter(p => p.supplierId === supplierId)
  }

  // Get products by category
  const getProductsByCategory = (category) => {
    return products.filter(p => p.category?.toLowerCase() === category?.toLowerCase())
  }

  // Search products
  const searchProducts = (query) => {
    const searchTerm = query.toLowerCase()
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.description?.toLowerCase().includes(searchTerm) ||
      p.category?.toLowerCase().includes(searchTerm) ||
      p.supplierName?.toLowerCase().includes(searchTerm)
    )
  }

  // Inventory management methods
  const decreaseStock = async (productId, quantity, options = {}) => {
    try {
      const response = await productApi.decreaseStock(productId, quantity)
      if (response.success) {
        // Update local state with new stock level
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, stock: response.data.stock, quantity: response.data.quantity }
            : p
        ))
        
        // Features 1 & 2: Handle delivery and order updates if vendor info provided
        if (options.vendorId && options.deliveryAddress) {
          const { updateProductStockAfterPurchase } = await import('../utils/purchaseHandler')
          await updateProductStockAfterPurchase(productId, quantity, options)
        }
        
        return response
      } else {
        setError(response.message)
        return response
      }
    } catch (err) {
      setError('Failed to update stock')
      console.error('Error updating stock:', err)
      return { success: false, data: null, message: 'Failed to update stock', error: err.message }
    }
  }

  const increaseStock = async (productId, quantity) => {
    try {
      const response = await productApi.increaseStock(productId, quantity)
      if (response.success) {
        // Update local state with new stock level
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, stock: response.data.stock, quantity: response.data.quantity }
            : p
        ))
        return response
      } else {
        setError(response.message)
        return response
      }
    } catch (err) {
      setError('Failed to update stock')
      console.error('Error updating stock:', err)
      return { success: false, data: null, message: 'Failed to update stock', error: err.message }
    }
  }

  const getAvailableStock = (productId) => {
    const product = products.find(p => p.id === productId)
    return product ? (product.stock || product.quantity || 0) : 0
  }

  // Initialize products  // Load all products on mount
  useEffect(() => {
    // First try to load from localStorage for immediate display
    const savedProducts = localStorage.getItem('vendorMitraProducts')
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts)
        console.log('Loading products from localStorage:', parsedProducts.length, 'products')
        setProducts(parsedProducts)
      } catch (error) {
        console.error('Error parsing saved products:', error)
      }
    }
    
    // Then load fresh data from API
    loadProducts()
  }, [])

  // Subscribe to real-time product updates
  useEffect(() => {
    const unsubscribe = productApi.subscribeToUpdates((data) => {
      console.log('Real-time product update received:', data)
      
      switch (data.action) {
        case 'create':
          setProducts(prev => {
            const exists = prev.find(p => p.id === data.product.id)
            if (exists) {
              console.log('Product already exists in context, skipping duplicate:', data.product.id)
              return prev
            }
            console.log('Adding new product to context:', data.product.id)
            return [...prev, data.product]
          })
          break
        case 'update':
          setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p))
          break
        case 'delete':
          console.log('Deleting product from context:', data.product.id)
          setProducts(prev => {
            const filtered = prev.filter(p => p.id !== data.product.id)
            console.log('Products after deletion:', filtered.length)
            return filtered
          })
          break
        default:
          // Reload all products for unknown actions
          loadProducts()
      }
    })

    return unsubscribe
  }, [])

  const value = {
    products,
    loading,
    error,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsBySupplier,
    getProductsByCategory,
    searchProducts,
    decreaseStock,
    increaseStock,
    getAvailableStock
  }

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  )
}

export default ProductContext
