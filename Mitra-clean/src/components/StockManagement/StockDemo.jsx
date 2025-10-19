import React, { useState, useEffect } from 'react'
import { Package, Plus, Minus, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import stockManager from '../../utils/stockManager'
import { productDatabase } from '../../data/userDatabase'
import realTimeSync from '../../utils/realTimeSync'

const StockDemo = () => {
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [operationType, setOperationType] = useState('purchase')
  const [quantity, setQuantity] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [logs, setLogs] = useState([])
  const [stockHistory, setStockHistory] = useState([])

  useEffect(() => {
    loadProducts()
    loadStockHistory()
    
    // Subscribe to real-time stock updates
    const unsubscribe = realTimeSync.subscribe('stock_update', (data) => {
      console.log('Real-time stock update received:', data)
      addLog(`Real-time update: ${data.productName} stock changed from ${data.previousStock} to ${data.newStock}`)
      loadProducts() // Refresh products
      loadStockHistory() // Refresh history
    })

    return () => unsubscribe()
  }, [])

  const loadProducts = () => {
    const allProducts = productDatabase.getAllProducts()
    setProducts(allProducts)
    if (!selectedProduct && allProducts.length > 0) {
      setSelectedProduct(allProducts[0])
    }
  }

  const loadStockHistory = () => {
    const history = stockManager.getStockHistory(null, 10)
    setStockHistory(history)
  }

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
  }

  const handleStockOperation = async () => {
    if (!selectedProduct || quantity <= 0) {
      addLog('Error: Please select a product and enter a valid quantity')
      return
    }

    setIsProcessing(true)
    addLog(`Starting ${operationType} operation for ${selectedProduct.name}...`)

    try {
      let result
      const options = {
        vendorId: 1,
        supplierId: selectedProduct.supplierId,
        orderId: `DEMO-${Date.now()}`
      }

      switch (operationType) {
        case 'purchase':
          result = await stockManager.purchase(selectedProduct.id, quantity, options)
          break
        case 'restock':
          result = await stockManager.restock(selectedProduct.id, quantity, options)
          break
        case 'setStock':
          result = await stockManager.setStock(selectedProduct.id, quantity, options)
          break
        default:
          throw new Error('Invalid operation type')
      }

      if (result.success) {
        addLog(`✅ ${operationType} successful: ${selectedProduct.name} (${quantity} units)`)
        addLog(`Stock updated: ${result.data.previousStock} → ${result.data.newStock}`)
        loadProducts()
        loadStockHistory()
      } else {
        addLog(`❌ ${operationType} failed: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const checkStockAvailability = async () => {
    if (!selectedProduct || quantity <= 0) return

    try {
      const result = await stockManager.checkAvailability(selectedProduct.id, quantity)
      if (result.success) {
        const { isAvailable, currentStock, shortfall } = result.data
        if (isAvailable) {
          addLog(`✅ Stock check: ${quantity} units available (${currentStock} in stock)`)
        } else {
          addLog(`⚠️ Stock check: Insufficient stock. Need ${shortfall} more units`)
        }
      }
    } catch (error) {
      addLog(`❌ Stock check error: ${error.message}`)
    }
  }

  const getStockStatusColor = (stock) => {
    if (stock === 0) return 'text-red-600 bg-red-50'
    if (stock <= 10) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getStockStatusIcon = (stock) => {
    if (stock === 0) return <AlertTriangle className="w-4 h-4" />
    if (stock <= 10) return <Clock className="w-4 h-4" />
    return <CheckCircle className="w-4 h-4" />
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Stock Management Demo
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === parseInt(e.target.value))
                  setSelectedProduct(product)
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.stock || product.quantity || 0})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{selectedProduct.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Stock:</span>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ml-2 ${getStockStatusColor(selectedProduct.stock || selectedProduct.quantity || 0)}`}>
                      {getStockStatusIcon(selectedProduct.stock || selectedProduct.quantity || 0)}
                      {selectedProduct.stock || selectedProduct.quantity || 0} {selectedProduct.unit || 'units'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-2 font-medium">₹{selectedProduct.price}/{selectedProduct.unit || 'unit'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Supplier:</span>
                    <span className="ml-2">{selectedProduct.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 capitalize">{selectedProduct.category}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'purchase', label: 'Purchase', icon: Minus, color: 'red' },
                  { value: 'restock', label: 'Restock', icon: Plus, color: 'green' },
                  { value: 'setStock', label: 'Set Stock', icon: RefreshCw, color: 'blue' }
                ].map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    onClick={() => setOperationType(value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      operationType === value
                        ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-xs font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleStockOperation}
                disabled={isProcessing || !selectedProduct}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : `Execute ${operationType}`}
              </button>
              <button
                onClick={checkStockAvailability}
                disabled={!selectedProduct}
                className="px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Check Stock
              </button>
            </div>
          </div>

          {/* Live Logs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Live Activity Log</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No activity yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stock History */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Stock Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Product</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Previous Stock</th>
                <th className="text-left py-2">New Stock</th>
                <th className="text-left py-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {stockHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                stockHistory.map((transaction, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2">
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 font-medium">{transaction.productName}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'purchase' ? 'bg-red-100 text-red-700' :
                        transaction.type === 'restock' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-2">{transaction.previousStock}</td>
                    <td className="py-2">{transaction.newStock}</td>
                    <td className="py-2">
                      <span className={`font-medium ${
                        transaction.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.quantityChanged > 0 ? '+' : ''}{transaction.quantityChanged}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Stock Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Current Stock Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => {
            const stock = product.stock || product.quantity || 0
            return (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">{product.name}</h4>
                  {getStockStatusIcon(stock)}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {product.supplierName}
                </div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getStockStatusColor(stock)}`}>
                  {stock} {product.unit || 'units'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StockDemo
