# Debug Flash Sale Purchase Issue

## How to Test and Debug

### Step 1: Open Browser Console
1. Open your app in the browser
2. Press F12 to open Developer Tools
3. Go to the "Console" tab
4. Clear any existing logs

### Step 2: Navigate to Flash Sales
1. Go to the Flash Sales page
2. You should see initial logs about loading flash sales

### Step 3: Make a Purchase
1. Click "Buy Now" on any flash sale item
2. Fill in the delivery address
3. Click "Place Order"

### Step 4: Check Console Logs

You should see a detailed log sequence like this:

```
=== PURCHASE STARTED ===
Before purchase - Item: 1 Sold: 0 Total: 30 Quantity to buy: 5

decreaseFlashSaleStock called with: {id: 1, quantity: 5}
Current flashSales array: [{id: 1, sold: 0, total: 30, ...}]
Found index: 0
Current sale before update: {id: 1, sold: 0, total: 30, ...}
Current remaining stock: 30
Updating to: {newSold: 5, newRemaining: 25}
Updated sale: {id: 1, sold: 5, total: 30, remainingStock: 25, ...}
Saved to localStorage

After decreaseFlashSaleStock - Updated Sale: 1 Sold: 5 Total: 30
State updated - Item in state: Sold: 5/30
Remaining stock after purchase: 25
Delivery record created
Emitting real-time sync event...
=== PURCHASE COMPLETED ===

Real-time sync event received: {action: 'purchase', flashSale: {...}}
Reloading flash sales due to real-time sync...
```

## What to Look For

### ✅ If Working Correctly:
- `decreaseFlashSaleStock called` appears
- `Found index: 0` (or another valid index)
- `Updated sale` shows increased sold count
- `Saved to localStorage` appears
- `State updated` shows correct sold count
- UI displays updated "Sold: X/Y"

### ❌ If NOT Working:
Look for these error patterns:

1. **Flash sale not found**
   ```
   Flash sale not found with id: X
   ```
   → The ID doesn't match what's in the database

2. **Index not found**
   ```
   Found index: -1
   ```
   → The flash sale doesn't exist in the array

3. **Insufficient stock**
   ```
   Insufficient flash sale stock. Available: 0, Requested: 5
   ```
   → Already sold out or stock calculation error

4. **No logs at all**
   ```
   (nothing appears)
   ```
   → Function not being called, check if handleConfirmOrder is triggered

## Common Issues and Solutions

### Issue 1: ID Mismatch
**Symptom:** "Flash sale not found with id: X"
**Solution:** Check if the item.id being passed is correct. Log the item object.

### Issue 2: Database Not Initialized
**Symptom:** "Current flashSales array: []"
**Solution:** Check localStorage in DevTools → Application → Local Storage → vendorMitraFlashSales

### Issue 3: State Not Updating in UI
**Symptom:** Database updates but UI doesn't change
**Solution:** Check if real-time sync is triggering and loadFlashSales is being called

### Issue 4: Real-time Sync Overwriting Changes
**Symptom:** Updates appear then disappear
**Solution:** Check if multiple real-time sync events are firing

## Manual localStorage Check

In the console, run:
```javascript
// Check current flash sales in localStorage
JSON.parse(localStorage.getItem('vendorMitraFlashSales'))

// Check if a specific item exists
JSON.parse(localStorage.getItem('vendorMitraFlashSales')).find(f => f.id === 1)
```

## Next Steps

After testing, report:
1. Which logs appear in the console
2. Which logs are missing
3. Any error messages
4. What the UI shows vs what the console shows
