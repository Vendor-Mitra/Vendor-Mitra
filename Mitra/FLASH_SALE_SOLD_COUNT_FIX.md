# Flash Sale Sold Count Fix

## Issue
When buying items directly from the "Buy Now" button in flash sales, the sold quantity was not updating in the UI (showing 0/30 instead of the actual sold count).

## Root Cause
The issue was caused by a race condition where:
1. The `BuyNowDialog` was calling `onClose()` immediately after confirming the order
2. This was happening before the state updates could complete
3. The dialog closing was potentially interfering with the state update flow

## Solution

### 1. Modified `FindSales.jsx` - `handleConfirmOrder` function
- Added immediate state update using `setFlashSales` to reflect changes instantly
- Moved dialog closing logic (`setShowBuyNowDialog(false)` and `setBuyNowItem(null)`) into the parent component
- Added a delayed reload (`setTimeout`) to ensure database sync
- Added console logging for debugging the purchase flow

**Key Changes:**
```javascript
// Update local state immediately with the updated sale
setFlashSales(prev => {
  const updated = prev.map(sale => 
    sale.id === item.id ? updatedSale : sale
  )
  return updated
})

// Close dialog and show success message
setShowBuyNowDialog(false)
setBuyNowItem(null)

alert(`Order placed successfully! Total: ₹${totalPrice}`)

// Force reload from database to ensure sync
setTimeout(() => {
  loadFlashSales()
}, 100)
```

### 2. Modified `BuyNowDialog.jsx` - `handleConfirmOrder` function
- Removed the `onClose()` call from the dialog
- Let the parent component handle closing after state updates complete
- Added error logging for debugging

**Key Change:**
```javascript
// Don't call onClose() here - let parent handle it after state updates
```

## Testing
To verify the fix:
1. Open browser console to see debug logs
2. Navigate to Flash Sales page
3. Click "Buy Now" on any flash sale item
4. Complete the purchase
5. Check console logs for:
   - "Before purchase" log showing initial sold count
   - "After purchase" log showing updated sold count
   - "Updated flash sales state" log showing state update
   - "Reloading flash sales from database..." log
6. Verify the sold count updates in the UI (e.g., "Sold: 5/30 per kg")

## Files Modified
1. `src/pages/FindSales.jsx` - Updated `handleConfirmOrder` function
2. `src/components/BuyNow/BuyNowDialog.jsx` - Removed premature `onClose()` call

## Expected Behavior After Fix
- ✅ Sold count updates immediately after purchase
- ✅ "Sold: X/Y per unit" displays correct values
- ✅ When all items are sold, "SOLD OUT" overlay appears
- ✅ Sold out items become greyed out
- ✅ No duplicate quantity selectors
