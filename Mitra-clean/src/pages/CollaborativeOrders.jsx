import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collabOrdersDatabase } from '../data/userDatabase'

const CollaborativeOrders = () => {
  const { user } = useAuth()
  const [collabOrders, setCollabOrders] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSupplierId, setNewSupplierId] = useState('')
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newItems, setNewItems] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [myLocation, setMyLocation] = useState('')

  useEffect(() => {
    if (user && user.id) {
      setCollabOrders(collabOrdersDatabase.getCollabOrdersByVendor(user.id))
    }
  }, [user])

  const handleCreateOrder = () => {
    if (!newSupplierId || !newSupplierName || !newItems) return
    const order = {
      supplierId: newSupplierId,
      supplierName: newSupplierName,
      vendors: [
        {
          vendorId: user.id,
          vendorName: user.name,
          location: myLocation,
          items: newItems.split(',').map(i => i.trim())
        }
      ],
      status: 'open',
    }
    collabOrdersDatabase.addCollabOrder(order)
    setCollabOrders(collabOrdersDatabase.getCollabOrdersByVendor(user.id))
    setShowCreateModal(false)
    setNewSupplierId('')
    setNewSupplierName('')
    setNewItems('')
    setMyLocation('')
  }

  const handleJoinOrder = (order) => {
    setSelectedOrder(order)
    setMyLocation('')
    setNewItems('')
  }

  const handleAddToOrder = () => {
    if (!selectedOrder || !newItems) return
    const updatedVendors = [
      ...selectedOrder.vendors,
      {
        vendorId: user.id,
        vendorName: user.name,
        location: myLocation,
        items: newItems.split(',').map(i => i.trim())
      }
    ]
    collabOrdersDatabase.updateCollabOrder(selectedOrder.id, { vendors: updatedVendors })
    setCollabOrders(collabOrdersDatabase.getCollabOrdersByVendor(user.id))
    setSelectedOrder(null)
    setMyLocation('')
    setNewItems('')
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Collaborative Orders</h1>
      <button className="btn-primary mb-4" onClick={() => setShowCreateModal(true)}>Create Collaborative Order</button>
      {collabOrders.length === 0 ? (
        <div className="text-gray-400 text-center">No collaborative orders yet.</div>
      ) : (
        <div className="space-y-4">
          {collabOrders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-medium">Supplier: {order.supplierName}</h3>
                  <p className="text-sm text-gray-600">Order Status: {order.status}</p>
                </div>
                <button onClick={() => handleJoinOrder(order)} className="btn-secondary">Join/Add Items</button>
              </div>
              <div className="text-xs text-gray-500 mb-2">Vendors in this order:</div>
              <ul className="ml-4 list-disc text-sm">
                {order.vendors.map((v, idx) => (
                  <li key={idx}><b>{v.vendorName}</b> ({v.location}): {v.items.join(', ')}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Create Collaborative Order</h2>
            <input type="text" placeholder="Supplier ID" value={newSupplierId} onChange={e => setNewSupplierId(e.target.value)} className="input-field mb-2" />
            <input type="text" placeholder="Supplier Name" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} className="input-field mb-2" />
            <input type="text" placeholder="Your Location" value={myLocation} onChange={e => setMyLocation(e.target.value)} className="input-field mb-2" />
            <input type="text" placeholder="Items (comma separated)" value={newItems} onChange={e => setNewItems(e.target.value)} className="input-field mb-2" />
            <div className="flex gap-2 mt-4">
              <button className="btn-primary flex-1" onClick={handleCreateOrder}>Create</button>
              <button className="btn-secondary flex-1" onClick={() => setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Join Collaborative Order for {selectedOrder.supplierName}</h2>
            <input type="text" placeholder="Your Location" value={myLocation} onChange={e => setMyLocation(e.target.value)} className="input-field mb-2" />
            <input type="text" placeholder="Items (comma separated)" value={newItems} onChange={e => setNewItems(e.target.value)} className="input-field mb-2" />
            <div className="flex gap-2 mt-4">
              <button className="btn-primary flex-1" onClick={handleAddToOrder}>Add to Order</button>
              <button className="btn-secondary flex-1" onClick={() => setSelectedOrder(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CollaborativeOrders 