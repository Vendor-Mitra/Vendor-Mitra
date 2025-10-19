import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProductProvider } from './contexts/ProductContext'
import { CartProvider } from './contexts/CartContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { StatsProvider } from './contexts/StatsContext'
import Chatbot from './components/Chatbot/Chatbot'
import { ThemeProvider } from './contexts/ThemeContext'
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'
import SupplierLayout from './components/Layout/SupplierLayout'
import Dashboard from './pages/Dashboard'
import SupplierDashboard from './pages/SupplierDashboard'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import SupplierFinder from './pages/SupplierFinder'
import FlashSales from './pages/FlashSales'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'
import Organic from './pages/Organic'
import FindItems from './pages/FindItems'
import FindSales from './pages/FindSales'
import Cart from './pages/Cart'
import Bargains from './pages/Bargains'
import CollaborativeOrders from './pages/CollaborativeOrders'
import StockDemo from './components/StockManagement/StockDemo'
import { useAuth } from './contexts/AuthContext'
import Home from './pages/Home'

// Profile wrapper component that uses correct layout based on user type
const ProfileWrapper = () => {
  const { user } = useAuth()
  
  if (user?.type === 'supplier') {
    return (
      <SupplierLayout>
        <Profile />
      </SupplierLayout>
    )
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Profile />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ProductProvider>
            <StatsProvider>
              <CartProvider>
                <NotificationProvider>
                  <Routes>
                  {/* Supplier Routes - Use SupplierLayout */}
                  <Route path="/supplier-dashboard" element={
                    <SupplierLayout>
                      <SupplierDashboard />
                    </SupplierLayout>
                  } />
                  
                  {/* Vendor Routes - Use Regular Layout */}
                  <Route path="/" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <Home />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/dashboard" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <Dashboard />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/login" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <Login />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/register" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <Register />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/suppliers" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <SupplierFinder />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/find-items" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <FindItems />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/find-sales" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <FindSales />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/flash-sales" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <FlashSales />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/organic" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <Organic />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/profile" element={<ProfileWrapper />} />
                  <Route path="/cart" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <Cart />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/bargains" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <Bargains />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/collaborative-orders" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <CollaborativeOrders />
                      </main>
                      <Footer />
                    </div>
                  } />
                  <Route path="/stock-demo" element={
                    <div className="min-h-screen flex flex-col">
                      <Navbar />
                      <main className="flex-1">
                        <StockDemo />
                      </main>
                      <Footer />
                    </div>
                  } />
                  </Routes>
                  <Chatbot />
                </NotificationProvider>
              </CartProvider>
            </StatsProvider>
          </ProductProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App