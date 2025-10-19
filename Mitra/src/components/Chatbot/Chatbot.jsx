import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: `Hello! 👋 I'm your Vendor Mitra assistant. I can help you navigate the platform, answer questions about features, and assist with any queries. How can I help you today?`
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastSuggestedPage, setLastSuggestedPage] = useState(null) // Track suggested navigation
  const messagesEndRef = useRef(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Detect if user is on supplier or vendor side
  const isOnSupplierSide = location.pathname.startsWith('/supplier')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Navigation keywords and routes - context-aware
  const getNavigationMap = () => {
    // If on supplier side, return supplier-specific routes
    if (isOnSupplierSide) {
      return {
        'dashboard': '/supplier-dashboard',
        'home': '/supplier-dashboard',
        'main page': '/supplier-dashboard',
        'my products': '/supplier-dashboard?tab=products',
        'products': '/supplier-dashboard?tab=products',
        'product catalog': '/supplier-dashboard?tab=products',
        'manage products': '/supplier-dashboard?tab=products',
        'items': '/supplier-dashboard?tab=products',
        'bargain requests': '/supplier-dashboard?tab=bargains',
        'bargains': '/supplier-dashboard?tab=bargains',
        'bargain': '/supplier-dashboard?tab=bargains',
        'requests': '/supplier-dashboard?tab=bargains',
        'negotiations': '/supplier-dashboard?tab=bargains',
        'negotiate': '/supplier-dashboard?tab=bargains',
        'reviews': '/supplier-dashboard?tab=reviews',
        'my reviews': '/supplier-dashboard?tab=reviews',
        'ratings': '/supplier-dashboard?tab=reviews',
        'deliveries': '/supplier-dashboard?tab=deliveries',
        'my deliveries': '/supplier-dashboard?tab=deliveries',
        'orders': '/supplier-dashboard?tab=deliveries',
        'recent orders': '/supplier-dashboard?tab=deliveries',
        'my orders': '/supplier-dashboard?tab=deliveries',
        'flash sales': '/supplier-dashboard?tab=flashsales',
        'flash sale': '/supplier-dashboard?tab=flashsales',
        'sales': '/supplier-dashboard?tab=flashsales',
        'create flash sale': '/supplier-dashboard?tab=flashsales',
        'profile': '/profile',
        'my profile': '/profile',
        'account': '/profile',
        'settings': '/profile',
      }
    }
    
    // If on vendor side, return vendor-specific routes
    return {
      'dashboard': '/dashboard',
      'home': '/dashboard',
      'main page': '/dashboard',
      'recent orders': '/profile',
      'my orders': '/profile',
      'orders': '/profile',
      'find items': '/find-items',
      'find products': '/find-items',
      'search products': '/find-items',
      'browse products': '/find-items',
      'products': '/find-items',
      'items': '/find-items',
      'suppliers': '/suppliers',
      'find suppliers': '/suppliers',
      'search suppliers': '/suppliers',
      'supplier': '/suppliers',
      'flash sales': '/flash-sales',
      'flash sale': '/flash-sales',
      'sales': '/flash-sales',
      'deals': '/flash-sales',
      'organic': '/organic',
      'organic products': '/organic',
      'organic items': '/organic',
      'bargains': '/bargains',
      'bargain': '/bargains',
      'negotiate': '/bargains',
      'negotiation': '/bargains',
      'price negotiation': '/bargains',
      'cart': '/cart',
      'my cart': '/cart',
      'shopping cart': '/cart',
      'basket': '/cart',
      'profile': '/profile',
      'my profile': '/profile',
      'account': '/profile',
      'settings': '/profile',
    }
  }

  // Quick responses for common questions
  const quickResponses = {
    // Ordering & Shopping
    'how to order': 'To order products: 1) Go to "Find Items" 2) Browse products 3) Add items to cart 4) Go to Cart and checkout. Would you like me to take you to Find Items?',
    'place order': 'To place an order: Browse products → Add to cart → Go to cart → Click "Buy Now" → Enter delivery address → Choose payment method → Confirm order!',
    'track order': 'You can track your orders in the Dashboard under "My Orders" section. Each order shows its current status and delivery date.',
    'cancel order': 'To cancel an order, go to your Dashboard, find the order in "My Orders", and contact the supplier directly through the platform.',
    
    // Products & Suppliers
    'how to add product': 'To add a product as a supplier: 1) Go to Supplier Dashboard 2) Click "Add Product" 3) Fill in product details 4) Submit. Would you like me to navigate you there?',
    'find supplier': 'Go to "Suppliers" page to find nearby suppliers. Use the map view or list view, filter by organic/verified, and adjust search radius!',
    'nearby suppliers': 'Click "Get My Location" on the Suppliers page to find suppliers near you. You can see them on a map and filter by distance!',
    'supplier products': 'Click on any supplier card to view their available products, prices, and stock levels. You can add products directly to your cart!',
    
    // Flash Sales & Bargains
    'what is flash sale': 'Flash Sales are limited-time offers with special discounts (up to 50% off!). They have countdown timers and limited stock. Check the Flash Sales page!',
    'create flash sale': 'As a supplier: Go to Supplier Dashboard → Flash Sales tab → Click "Create Flash Sale" → Set product, discount, duration, and stock!',
    'what is bargain': 'Bargains allow you to negotiate prices directly with suppliers. Make an offer, chat with the supplier, and agree on a price that works for both!',
    'how to bargain': 'From your cart, click "Bargain" on any item → Enter your proposed price → Wait for supplier response → Chat to negotiate → Finalize the deal!',
    'bargain with flash': 'No, you cannot bargain on Flash Sale items. Flash Sales already have discounted prices (up to 50% off) and are limited-time offers with fixed prices. However, you can bargain on regular products!',
    'bargain for flash': 'No, you cannot bargain on Flash Sale items. Flash Sales already have discounted prices (up to 50% off) and are limited-time offers with fixed prices. However, you can bargain on regular products!',
    'bargain flash': 'Flash Sale prices are already discounted and fixed - no bargaining allowed on flash sale items. But you can bargain on regular products from the cart or suppliers page!',
    'negotiate flash': 'Flash Sales have fixed discounted prices and cannot be negotiated. They\'re already offering the best deals! For negotiation, use the Bargain feature on regular products.',
    'bargain on flash': 'No bargaining on Flash Sales! They already have the best discounted prices. You can bargain on regular products though!',
    'can bargain flash': 'No, Flash Sale items cannot be bargained. They have fixed discounted prices (up to 50% off). Use the Bargain feature for regular products!',
    
    // Organic & Quality
    'organic products': 'Organic products are 100% certified organic items from verified suppliers. Check the Organic section to browse pesticide-free, natural products!',
    'fssai': 'FSSAI (Food Safety and Standards Authority of India) verification ensures suppliers meet food safety standards. Look for the FSSAI badge!',
    'verified suppliers': 'Verified suppliers have completed FSSAI verification and background checks. They display a green verification badge on their profiles.',
    
    // Payment & Delivery
    'payment methods': 'We support: Cash on Delivery (COD), UPI, Credit/Debit Cards, and Net Banking. Choose your preferred method at checkout!',
    'delivery time': 'Delivery times vary by supplier and location. Most deliveries are completed within 2-3 business days. Check supplier details for specific times!',
    'delivery charges': 'Delivery charges depend on distance and order value. Many suppliers offer free delivery above a minimum order amount!',
    'how to contact supplier': 'You can contact suppliers through the Bargain feature or by viewing their contact details on their product listings.',
    
    // Platform Info
    'what is vendor mitra': 'Vendor Mitra is a food supply chain platform that connects street vendors with trusted suppliers. We help vendors find quality products at fair prices and suppliers reach more customers!',
    'how does it work': 'Vendors can browse products, negotiate prices, and place orders. Suppliers can list products, manage inventory, and handle orders. Everything is managed through our easy-to-use platform!',
    'who can use': 'Anyone! Street vendors can buy products, suppliers can sell products, and farmers can list their produce. Create an account to get started!',
    'is it free': 'Yes! Registration and browsing are completely free. We only facilitate connections between vendors and suppliers - no hidden charges!',
    
    // Account & Profile
    'how to register': 'Click "Register" → Choose Vendor or Supplier → Fill in your details → Create account → Start using the platform!',
    'forgot password': 'Currently, please contact support at vendormitra@gmail.com or call +91 9155564974 for password reset assistance.',
    'update profile': 'Go to your Profile page → Click "Edit Profile" → Update your information → Save changes!',
    
    // Features by User Type
    'features': user?.userType === 'vendor' 
      ? 'As a vendor, you can: 🔍 Browse products, 🏪 Find suppliers, 💬 Create bargains, ⚡ Access flash sales, 🌱 View organic products, 🛒 Manage your cart, and 📦 Track orders!'
      : user?.userType === 'supplier'
      ? 'As a supplier, you can: 📦 Manage products, 💬 Handle bargain requests, ⚡ Create flash sales, ⭐ View reviews, 🚚 Track deliveries, and 📊 Monitor sales!'
      : 'Register as a Vendor to buy products or as a Supplier to sell products. Both get access to powerful features!',
    
    // Troubleshooting & Issues
    'not working': 'What specific feature isn\'t working? Let me help! Common issues: 1) Clear browser cache 2) Refresh page 3) Check internet connection 4) Try logging out and back in.',
    'error': 'If you\'re seeing an error: 1) Note the error message 2) Refresh the page 3) Clear cache 4) Contact support at vendormitra@gmail.com with details.',
    'cant login': 'Login issues? 1) Check email/password spelling 2) Make sure you\'re registered 3) Try "Forgot Password" 4) Contact support: +91 9155564974',
    'slow': 'If the site is slow: 1) Check your internet speed 2) Clear browser cache 3) Close other tabs 4) Try a different browser. Usually loads in 2-3 seconds!',
    'bug': 'Found a bug? Please report it! Contact: vendormitra@gmail.com or call +91 9155564974. Include: What you were doing, error message, and browser type.',
    
    // Stock & Inventory
    'out of stock': 'If a product is out of stock, you can: 1) Check other suppliers 2) Contact the supplier directly 3) Set up a notification (coming soon!) 4) Try similar products.',
    'stock update': 'Stock updates in real-time! When suppliers add/remove products, you\'ll see it immediately. Refresh the page to ensure latest stock.',
    'low stock': 'Products with low stock show a warning badge. Order quickly before they run out! Flash sales often have limited stock.',
    
    // Pricing & Discounts
    'discount': 'Get discounts through: 1) Flash Sales (up to 50% off) 2) Bargaining with suppliers 3) Bulk orders 4) First-time buyer offers!',
    'price too high': 'If price is high: 1) Use Bargain feature to negotiate 2) Check Flash Sales 3) Compare multiple suppliers 4) Buy in bulk for better rates!',
    'bulk order': 'For bulk orders: 1) Contact supplier directly 2) Use Bargain feature 3) Many suppliers offer discounts for 10kg+ orders!',
    'minimum order': 'Each supplier sets their minimum order value. Check supplier details for minimum order requirements (usually ₹100-₹500).',
    
    // Quality & Safety
    'quality': 'We ensure quality through: 1) FSSAI verification 2) Supplier background checks 3) Customer reviews 4) Rating system. Always check supplier ratings!',
    'fresh': 'All products are fresh from farms/suppliers. Check product descriptions for harvest dates. Suppliers update stock daily!',
    'safe': 'Safety measures: 1) FSSAI verified suppliers 2) Secure payment gateway 3) No data sharing 4) Verified contact details. Your safety is our priority!',
    'complaint': 'To file a complaint: 1) Go to your order in Dashboard 2) Contact supplier 3) If unresolved, email vendormitra@gmail.com with order details.',
    
    // Location & Delivery
    'location': 'Set your location on Suppliers page by clicking "Get My Location". This shows nearby suppliers and accurate delivery times!',
    'delivery area': 'Delivery available across major cities! Each supplier has their delivery radius. Check supplier details for coverage area.',
    'same day delivery': 'Some suppliers offer same-day delivery! Look for "Same day delivery" badge on supplier cards. Usually for orders before 2 PM.',
    'delivery tracking': 'Track deliveries in Dashboard → My Orders. You\'ll see: Order placed → Processing → Out for delivery → Delivered!',
    'track their location': 'Yes! After ordering from nearby suppliers, you can track delivery in Dashboard → My Orders. You\'ll see real-time status updates and estimated delivery time!',
    'track location for delivery': 'Absolutely! Go to Dashboard → My Orders to track your delivery. You\'ll see the order status and can contact the supplier for exact location updates!',
    'track delivery location': 'Yes! Track your delivery in Dashboard → My Orders. Each order shows current status, estimated delivery time, and you can contact the supplier for live location!',
    'where to find them': 'After ordering, find your orders in Dashboard → My Orders. You\'ll see all order details, delivery status, and supplier contact information! Would you like me to take you to the Dashboard?',
    'where are they': 'To see your orders and deliveries, go to Dashboard → My Orders. You\'ll find all order details, tracking info, and supplier contact details there! Want me to navigate you there?',
    'find their location': 'Check Dashboard → My Orders to see all your orders. Each order has supplier details, delivery status, and you can contact them for exact location! Should I take you to Dashboard?',
    
    // Account & Security
    'change password': 'To change password: Go to Profile → Settings → Change Password. Or contact support for password reset.',
    'delete account': 'To delete account, contact support at vendormitra@gmail.com. We\'ll process your request within 24 hours.',
    'privacy': 'Your data is safe! We don\'t share personal information. Read our privacy policy in footer. GDPR compliant!',
    'secure': 'Security features: 1) Encrypted passwords 2) Secure payment gateway 3) No credit card storage 4) Verified suppliers only.',
    
    // Special Features
    'collaborative order': 'Collaborative Orders (coming soon!) let multiple vendors pool orders for better prices and free delivery!',
    'notifications': 'Get notifications for: Order updates, Bargain responses, Flash sale alerts, New suppliers nearby!',
    'favorites': 'Save favorite suppliers and products (coming soon!) for quick reordering!',
    'compare': 'Compare suppliers by: Price, Rating, Delivery time, Minimum order. Use filters on Suppliers page!',
    
    // Business Info
    'about': 'Vendor Mitra connects street vendors with trusted food suppliers. Founded to help small vendors access quality products at fair prices!',
    'contact': 'Contact us: 📧 vendormitra@gmail.com | 📞 +91 9155564974 | Available: Mon-Sat, 9 AM - 6 PM',
    'location office': 'We\'re based in India, serving vendors and suppliers nationwide. Digital platform - no physical store needed!',
    'team': 'Built by a dedicated team passionate about empowering street vendors and connecting them with quality suppliers!',
    
    // Navigation & Help
    'help': 'I can help you with: Navigation, Feature explanations, How-to guides, Troubleshooting, Orders, Payments, Suppliers, and more! Just ask!',
    'support': 'For support, contact us at: 📧 vendormitra@gmail.com or 📞 +91 9155564974. We\'re here to help!',
    'hi': 'Hello! 👋 How can I assist you today? I can help you navigate the platform, explain features, troubleshoot issues, or answer any questions!',
    'hello': 'Hi there! Welcome to Vendor Mitra. What would you like to know?',
    'thanks': 'You\'re welcome! Feel free to ask if you need anything else. Happy to help! 😊',
    'thank you': 'My pleasure! Let me know if you have any other questions. I\'m here to help!',
  }

  const getContextualInfo = () => {
    const userType = user?.userType || 'guest'
    const currentContext = isOnSupplierSide ? 'supplier' : 'vendor'
    const navigationMap = getNavigationMap()
    
    const context = `
      User Type: ${userType}
      Current Context: ${currentContext} side
      Platform: Vendor Mitra - Food Supply Chain Platform
      
      ${isOnSupplierSide ? `
      Features for Suppliers:
      - Product Catalog: Manage your products
      - Bargain Requests: Handle price negotiations
      - Flash Sales: Create limited-time offers
      - Reviews: View customer feedback
      - Deliveries: Track delivery orders
      ` : `
      Features for Vendors:
      - Find Items: Browse and search products from suppliers
      - Flash Sales: Limited-time deals with discounts
      - Suppliers: Find and connect with suppliers
      - Organic: Browse certified organic products
      - Bargains: Negotiate prices with suppliers
      - Cart: Manage your orders
      `}
      
      Navigation available: ${Object.keys(navigationMap).join(', ')}
    `
    return context
  }

  const handleNavigationRequest = (message) => {
    const lowerMessage = message.toLowerCase()
    const navigationMap = getNavigationMap()
    
    // Sort keywords by length (longest first) to match more specific phrases first
    const sortedKeywords = Object.entries(navigationMap).sort((a, b) => b[0].length - a[0].length)
    
    for (const [keyword, route] of sortedKeywords) {
      if (lowerMessage.includes(keyword)) {
        navigate(route)
        return `Navigating you to ${keyword}...`
      }
    }
    return null
  }

  const getQuickResponse = (message) => {
    const lowerMessage = message.toLowerCase()
    
    // Check for exact or close matches first (more specific)
    const exactMatches = [
      'track their location', 'track location for delivery', 'track delivery location',
      'where to find them', 'where are they', 'find their location',
      'bargain for flash', 'bargain with flash', 'bargain on flash',
      'can bargain flash', 'negotiate flash'
    ]
    
    for (const exactKeyword of exactMatches) {
      if (lowerMessage.includes(exactKeyword)) {
        if (quickResponses[exactKeyword]) {
          return quickResponses[exactKeyword]
        }
      }
    }
    
    // Then check general keywords
    for (const [keyword, response] of Object.entries(quickResponses)) {
      if (lowerMessage.includes(keyword)) {
        return response
      }
    }
    return null
  }

  const callChatGPT = async (userMessage) => {
    // Offline stub: no external API calls. Provide local, context-aware fallback only.
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
      return `I can help answer that! Here's what I know about Vendor Mitra:\n\n` +
             `• For Vendors: Browse products, find suppliers, negotiate prices, and place orders\n` +
             `• For Suppliers: Manage products, handle orders, create flash sales, and track deliveries\n\n` +
             `Would you like me to navigate you to a specific section?`
    }

    return 'I can help you with:\n' +
           '• Navigating to different pages (e.g., "go to dashboard")\n' +
           '• Information about features\n' +
           '• How to use the platform\n\n' +
           'What would you like to know?'
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = inputMessage.trim()
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setInputMessage('')
    setIsLoading(true)

    const lowerMessage = userMessage.toLowerCase()
    
    // Check for follow-up navigation requests (e.g., "take me there", "yes", "go")
    if ((lowerMessage.includes('take me') || 
         lowerMessage.includes('yes') || 
         lowerMessage === 'go' || 
         lowerMessage === 'sure' ||
         lowerMessage === 'ok' ||
         lowerMessage === 'okay' ||
         lowerMessage.includes('navigate') ||
         lowerMessage.includes('show me')) && lastSuggestedPage) {
      navigate(lastSuggestedPage)
      setMessages(prev => [...prev, { type: 'bot', text: `Taking you there now! 🚀` }])
      setLastSuggestedPage(null)
      setIsLoading(false)
      return
    }

    // Check if it's a question first (prioritize answering over navigation)
    const isQuestion = lowerMessage.includes('can i') || 
                      lowerMessage.includes('can we') ||
                      lowerMessage.includes('is it') ||
                      lowerMessage.includes('how do') ||
                      lowerMessage.includes('what is') ||
                      lowerMessage.includes('why') ||
                      lowerMessage.includes('when') ||
                      lowerMessage.includes('where') ||
                      lowerMessage.includes('will i') ||
                      lowerMessage.includes('will we') ||
                      lowerMessage.includes('am i') ||
                      lowerMessage.includes('are we') ||
                      lowerMessage.includes('should i') ||
                      lowerMessage.includes('could i') ||
                      lowerMessage.includes('would i') ||
                      lowerMessage.includes('after') ||
                      lowerMessage.includes('before') ||
                      lowerMessage.includes('?')

    // If it's a question, check quick responses first
    if (isQuestion) {
      const quickResponse = getQuickResponse(userMessage)
      if (quickResponse) {
        // Check if response suggests navigation
        if (quickResponse.includes('Dashboard')) {
          setLastSuggestedPage('/dashboard')
        }
        setMessages(prev => [...prev, { type: 'bot', text: quickResponse }])
        setIsLoading(false)
        return
      }
    }

    // Check for navigation request (only if not a question)
    if (!isQuestion) {
      const navResponse = handleNavigationRequest(userMessage)
      if (navResponse) {
        setMessages(prev => [...prev, { type: 'bot', text: navResponse }])
        setIsLoading(false)
        return
      }
    }

    // Check for quick responses again (for non-questions)
    const quickResponse = getQuickResponse(userMessage)
    if (quickResponse) {
      setMessages(prev => [...prev, { type: 'bot', text: quickResponse }])
      setIsLoading(false)
      return
    }

    // Call ChatGPT for complex queries
    const botResponse = await callChatGPT(userMessage)
    setMessages(prev => [...prev, { type: 'bot', text: botResponse }])
    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 animate-pulse"
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 ${
          isMinimized ? 'h-16' : 'h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Vendor Mitra Assistant</h3>
                <p className="text-xs text-emerald-100">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                          : 'bg-white text-gray-800 shadow-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-2xl shadow-md">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white rounded-b-2xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default Chatbot
