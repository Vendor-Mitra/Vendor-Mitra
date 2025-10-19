# Stock Management System Documentation

## Overview

This comprehensive stock management system automatically handles product inventory with real-time updates across all vendor sessions. When vendors purchase products, the system automatically decreases stock quantities and synchronizes changes across all open tabs/windows.

## Key Features

### ✅ Automatic Stock Updates
- **Purchase Operations**: Automatically decreases stock when vendors buy products
- **Restock Operations**: Suppliers can increase stock levels
- **Set Stock**: Direct stock level management
- **Real-time Sync**: Changes reflect instantly across all browser tabs

### ✅ Stock Validation
- **Availability Checks**: Prevents purchases when insufficient stock
- **Quantity Validation**: Ensures stock never goes below zero
- **Batch Operations**: Handle multiple product updates simultaneously

### ✅ Real-time Communication
- **Cross-tab Updates**: Uses localStorage events for real-time sync
- **Event Broadcasting**: Stock changes broadcast to all components
- **Live UI Updates**: Product lists update automatically

## System Architecture

### Core Components

1. **StockManager** (`/src/utils/stockManager.js`)
   - Main stock management class
   - Handles all CRUD operations
   - Provides transaction logging
   - Manages batch operations

2. **RealTimeSync** (`/src/utils/realTimeSync.js`)
   - Real-time synchronization utility
   - Cross-tab communication
   - Event broadcasting system
   - Stock update notifications

3. **ProductDatabase** (`/src/data/userDatabase.js`)
   - Enhanced with stock management methods
   - Persistent localStorage storage
   - Stock validation functions
   - Batch update capabilities

## Usage Examples

### Basic Stock Operations

```javascript
import stockManager from '../utils/stockManager'

// Purchase operation (decreases stock)
const result = await stockManager.purchase(productId, quantity, {
  vendorId: user.id,
  orderId: 'ORD-123'
})

// Restock operation (increases stock)
const result = await stockManager.restock(productId, quantity, {
  supplierId: supplier.id
})

// Set specific stock level
const result = await stockManager.setStock(productId, newStockValue)

// Check stock availability
const availability = await stockManager.checkAvailability(productId, requestedQuantity)
```

### Real-time Updates

```javascript
import realTimeSync from '../utils/realTimeSync'

// Subscribe to stock updates
const unsubscribe = realTimeSync.subscribe('stock_update', (data) => {
  console.log('Stock updated:', data.productName, data.newStock)
  // Update UI accordingly
})

// Cleanup subscription
unsubscribe()
```

## Integration Points

### 1. Cart Component (`/src/pages/Cart.jsx`)
- **Stock Validation**: Checks availability before purchase
- **Automatic Updates**: Decreases stock on successful orders
- **Real-time Sync**: Updates cart when stock changes
- **Error Handling**: Prevents overselling

### 2. FindItems Component (`/src/pages/FindItems.jsx`)
- **Live Stock Display**: Shows current stock levels
- **Real-time Updates**: Updates product list when stock changes
- **Purchase Validation**: Prevents adding unavailable items to cart

### 3. Stock Demo Component (`/src/components/StockManagement/StockDemo.jsx`)
- **Interactive Testing**: Test all stock operations
- **Live Monitoring**: Real-time activity logs
- **Transaction History**: View recent stock changes
- **Stock Overview**: Current inventory status

## Data Flow

```
1. Vendor initiates purchase
   ↓
2. StockManager validates availability
   ↓
3. Stock decreased in ProductDatabase
   ↓
4. RealTimeSync broadcasts update
   ↓
5. All components receive update
   ↓
6. UI updates automatically
```

## Stock Status Indicators

- **🟢 In Stock**: Stock > 10 units
- **🟡 Low Stock**: Stock ≤ 10 units
- **🔴 Out of Stock**: Stock = 0 units

## Error Handling

### Common Error Scenarios
- **Product Not Found**: Invalid product ID
- **Insufficient Stock**: Purchase quantity > available stock
- **Invalid Quantity**: Negative or zero quantities
- **Database Errors**: Storage/retrieval failures

### Error Response Format
```javascript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE",
  data: { /* additional error context */ }
}
```

## Testing the System

### Manual Testing Steps

1. **Open Multiple Tabs**: Navigate to FindItems page in multiple browser tabs
2. **Add Products**: Use the supplier dashboard to add products with stock
3. **Make Purchases**: Purchase items from one tab
4. **Verify Updates**: Check that stock updates appear in all tabs instantly
5. **Test Edge Cases**: Try purchasing more than available stock

### Using the Stock Demo

1. Navigate to the Stock Demo component
2. Select a product from the dropdown
3. Choose operation type (Purchase/Restock/Set Stock)
4. Enter quantity and execute
5. Monitor live logs and transaction history
6. Verify real-time updates across tabs

## Performance Considerations

- **Batch Operations**: Use for multiple simultaneous updates
- **Event Throttling**: Prevents excessive real-time updates
- **Storage Cleanup**: Automatic cleanup of old sync events
- **Transaction Logging**: Limited to 1000 recent transactions

## Future Enhancements

- **Stock Alerts**: Notifications for low stock levels
- **Automatic Reordering**: Trigger restock when below threshold
- **Analytics Dashboard**: Stock movement analytics
- **Supplier Integration**: Direct supplier stock updates
- **Mobile Optimization**: Enhanced mobile stock management

## Troubleshooting

### Common Issues

1. **Stock Not Updating**
   - Check browser localStorage permissions
   - Verify real-time sync subscriptions
   - Clear localStorage and refresh

2. **Inconsistent Stock Levels**
   - Refresh all browser tabs
   - Check for JavaScript errors in console
   - Verify product database integrity

3. **Purchase Failures**
   - Check stock availability
   - Verify product exists in database
   - Review error logs in console

### Debug Commands

```javascript
// Check current stock
await stockManager.getStock(productId)

// View transaction history
stockManager.getStockHistory(productId)

// Clear all stock logs
localStorage.removeItem('vendorMitraStockLogs')

// Reset product database
localStorage.removeItem('vendorMitraProducts')
```

## API Reference

### StockManager Methods

- `purchase(productId, quantity, options)` - Decrease stock
- `restock(productId, quantity, options)` - Increase stock
- `setStock(productId, newValue, options)` - Set specific stock level
- `getStock(productId)` - Get current stock level
- `checkAvailability(productId, quantity)` - Check if stock available
- `batchPurchase(purchases)` - Handle multiple purchases
- `getStockHistory(productId, limit)` - Get transaction history

### RealTimeSync Events

- `stock_update` - Stock level changed
- `product_update` - Product added/modified/deleted
- `bargain_update` - Bargain status changed

## Security Considerations

- **Client-side Only**: Current implementation is client-side
- **Data Validation**: All inputs validated before processing
- **Error Boundaries**: Graceful error handling
- **Transaction Logging**: Audit trail for all operations

---

*This stock management system provides a robust foundation for inventory management in the VendorMitra platform, ensuring accurate stock tracking and real-time synchronization across all user sessions.*
