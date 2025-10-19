// Firebase-based product API service
// Replaces localStorage with Firestore for cross-device data persistence

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../config/firebase'

class FirebaseProductAPI {
  constructor() {
    this.collectionName = 'products'
    this.productsRef = collection(db, this.collectionName)
    this.subscribers = []
  }

  // Simulate API delay for consistency with mock API
  async delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // GET /api/products - Fetch all products
  async getAllProducts() {
    try {
      await this.delay()
      const querySnapshot = await getDocs(this.productsRef)
      const products = []
      
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        })
      })

      // Remove duplicates by ID
      const uniqueProducts = products.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      )

      console.log(`Firebase: Fetched ${uniqueProducts.length} products`)
      
      return {
        success: true,
        data: uniqueProducts,
        message: 'Products fetched successfully'
      }
    } catch (error) {
      console.error('Firebase: Error fetching products:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to fetch products',
        error: error.message
      }
    }
  }

  // GET /api/products/:id - Fetch product by ID
  async getProductById(id) {
    try {
      await this.delay()
      const docRef = doc(db, this.collectionName, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data()
          },
          message: 'Product fetched successfully'
        }
      } else {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }
    } catch (error) {
      console.error('Firebase: Error fetching product:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to fetch product',
        error: error.message
      }
    }
  }

  // GET /api/products/supplier/:supplierId - Fetch products by supplier
  async getProductsBySupplier(supplierId) {
    try {
      await this.delay()
      const q = query(this.productsRef, where('supplierId', '==', supplierId))
      const querySnapshot = await getDocs(q)
      const products = []

      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        data: products,
        message: 'Supplier products fetched successfully'
      }
    } catch (error) {
      console.error('Firebase: Error fetching supplier products:', error)
      return {
        success: false,
        data: [],
        message: 'Failed to fetch supplier products',
        error: error.message
      }
    }
  }

  // POST /api/products - Create new product
  async createProduct(productData) {
    try {
      await this.delay()
      
      const newProduct = {
        ...productData,
        image: productData.image || 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(this.productsRef, newProduct)
      
      // Get the created document to return with ID
      const createdDoc = await getDoc(docRef)
      const createdProduct = {
        id: createdDoc.id,
        ...createdDoc.data()
      }

      console.log('Firebase: Product created:', createdProduct.id)

      // Emit real-time sync event
      this.emitProductUpdate('create', createdProduct)

      return {
        success: true,
        data: createdProduct,
        message: 'Product created successfully'
      }
    } catch (error) {
      console.error('Firebase: Error creating product:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to create product',
        error: error.message
      }
    }
  }

  // PUT /api/products/:id - Update product
  async updateProduct(id, updates) {
    try {
      await this.delay()
      const docRef = doc(db, this.collectionName, id)
      
      // Check if document exists
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      // Update the document
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })

      // Get updated document
      const updatedDoc = await getDoc(docRef)
      const updatedProduct = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }

      console.log('Firebase: Product updated:', id)

      // Emit real-time sync event
      this.emitProductUpdate('update', updatedProduct)

      return {
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
      }
    } catch (error) {
      console.error('Firebase: Error updating product:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to update product',
        error: error.message
      }
    }
  }

  // DELETE /api/products/:id - Delete product
  async deleteProduct(id) {
    try {
      await this.delay()
      const docRef = doc(db, this.collectionName, id)
      
      // Get document before deleting
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      const deletedProduct = {
        id: docSnap.id,
        ...docSnap.data()
      }

      // Delete the document
      await deleteDoc(docRef)

      console.log('Firebase: Product deleted:', id)

      // Emit real-time sync event
      this.emitProductUpdate('delete', deletedProduct)

      return {
        success: true,
        data: deletedProduct,
        message: 'Product deleted successfully'
      }
    } catch (error) {
      console.error('Firebase: Error deleting product:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to delete product',
        error: error.message
      }
    }
  }

  // Inventory management methods
  async decreaseStock(productId, quantity) {
    try {
      await this.delay()
      const docRef = doc(db, this.collectionName, productId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      const product = docSnap.data()
      const currentStock = product.stock || product.quantity || 0

      if (currentStock < quantity) {
        return {
          success: false,
          data: null,
          message: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`
        }
      }

      const newStock = currentStock - quantity

      await updateDoc(docRef, {
        stock: newStock,
        quantity: newStock,
        updatedAt: serverTimestamp()
      })

      const updatedDoc = await getDoc(docRef)
      const updatedProduct = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }

      // Emit real-time sync event
      this.emitProductUpdate('stock_update', { ...updatedProduct, newStock })

      return {
        success: true,
        data: updatedProduct,
        message: `Stock decreased by ${quantity}. New stock: ${newStock}`
      }
    } catch (error) {
      console.error('Firebase: Error decreasing stock:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to decrease stock',
        error: error.message
      }
    }
  }

  async increaseStock(productId, quantity) {
    try {
      await this.delay()
      const docRef = doc(db, this.collectionName, productId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          data: null,
          message: 'Product not found'
        }
      }

      const product = docSnap.data()
      const currentStock = product.stock || product.quantity || 0
      const newStock = currentStock + quantity

      await updateDoc(docRef, {
        stock: newStock,
        quantity: newStock,
        updatedAt: serverTimestamp()
      })

      const updatedDoc = await getDoc(docRef)
      const updatedProduct = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }

      // Emit real-time sync event
      this.emitProductUpdate('stock_update', { ...updatedProduct, newStock })

      return {
        success: true,
        data: updatedProduct,
        message: `Stock increased by ${quantity}. New stock: ${newStock}`
      }
    } catch (error) {
      console.error('Firebase: Error increasing stock:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to increase stock',
        error: error.message
      }
    }
  }

  async getAvailableStock(productId) {
    try {
      await this.delay()
      const docRef = doc(db, this.collectionName, productId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const product = docSnap.data()
        const stock = product.stock || product.quantity || 0
        return {
          success: true,
          data: { stock },
          message: 'Stock fetched successfully'
        }
      } else {
        return {
          success: false,
          data: { stock: 0 },
          message: 'Product not found'
        }
      }
    } catch (error) {
      console.error('Firebase: Error fetching stock:', error)
      return {
        success: false,
        data: { stock: 0 },
        message: 'Failed to fetch stock',
        error: error.message
      }
    }
  }

  // Real-time sync event emission
  emitProductUpdate(action, product) {
    const event = new CustomEvent('productUpdate', {
      detail: {
        action,
        product,
        timestamp: Date.now()
      }
    })
    window.dispatchEvent(event)
  }

  // Subscribe to real-time product updates using Firestore onSnapshot
  subscribeToUpdates(callback) {
    console.log('Firebase: Setting up real-time listener')
    
    // Use Firestore's real-time listener
    const unsubscribeFirestore = onSnapshot(this.productsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const product = {
          id: change.doc.id,
          ...change.doc.data()
        }

        let action = 'update'
        if (change.type === 'added') action = 'create'
        if (change.type === 'removed') action = 'delete'
        if (change.type === 'modified') action = 'update'

        console.log(`Firebase: Real-time ${action} detected for product:`, product.id)
        callback({ action, product, timestamp: Date.now() })
      })
    }, (error) => {
      console.error('Firebase: Error in real-time listener:', error)
    })

    // Also listen to custom events for same-tab updates
    const handleUpdate = (event) => {
      console.log('Firebase: Custom event received:', event.detail)
      callback(event.detail)
    }

    window.addEventListener('productUpdate', handleUpdate)

    // Return cleanup function
    return () => {
      unsubscribeFirestore()
      window.removeEventListener('productUpdate', handleUpdate)
    }
  }
}

// Create singleton instance
const firebaseProductApi = new FirebaseProductAPI()

export default firebaseProductApi
