import React, { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Store, Phone, MapPin, Star, Calendar, Truck } from 'lucide-react'
import Negotiation from '../components/Bargain/Negotiation'
import { productDatabase } from '../data/userDatabase'
import realTimeSync from '../utils/realTimeSync'

const Marketplace = () => {
  const { t } = useLanguage()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showNegotiation, setShowNegotiation] = useState(false)
  const [products, setProducts] = useState([])

  // Load products from database with real-time updates
  useEffect(() => {
    const loadProducts = () => {
      const allProducts = productDatabase.getAllProducts()
      console.log('Loading products in Marketplace:', allProducts)
      setProducts(allProducts)
    }
    
    // Initial load
    loadProducts()
    
    // Subscribe to real-time product updates
    const unsubscribe = realTimeSync.subscribe('product_update', (data) => {
      console.log('Product update received in Marketplace:', data)
      loadProducts() // Reload all products when any product is updated
    })
    
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Store className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold">{t('marketplace.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product List */}
        <div className="lg:col-span-2">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold">{product.name}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">₹{product.price}/kg</div>
                        <div className="text-sm text-gray-600">{product.quantity} available</div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{product.description}</p>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">4.8</span>
                        <span className="text-sm text-gray-500">(25)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Added: {new Date(product.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.isOrganic && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Organic
                        </span>
                      )}
                      {product.isVerified && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          FSSAI Verified
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        className="flex-1 btn-primary"
                        onClick={() => {
                          setSelectedProduct(product)
                          setShowNegotiation(true)
                        }}
                      >
                        Start Negotiation
                      </button>
                      <a 
                        href={`tel:${product.supplier === 'Sakshi' ? '0987654321' : '1234567890'}`}
                        className="btn-secondary flex items-center gap-1"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Direct from Suppliers</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Suppliers</span>
                <span className="font-semibold">{products.length > 0 ? '2+' : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Organic Products</span>
                <span className="font-semibold">
                  {products.length > 0 ? Math.round((products.filter(p => p.isOrganic).length / products.length) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Rating</span>
                <span className="font-semibold">4.8⭐</span>
              </div>
            </div>
          </div>

          {/* Negotiation Panel */}
          {showNegotiation && selectedProduct && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Negotiate with {selectedProduct.supplier}
              </h3>
              <Negotiation initialOffer={selectedProduct.price} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Marketplace 