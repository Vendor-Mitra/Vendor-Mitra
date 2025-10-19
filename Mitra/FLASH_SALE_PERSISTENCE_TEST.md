# Flash Sale Persistence Test Guide

## Issue
Flash sale sold count updates while logged in, but resets when you log out and log back in.

## Enhanced Logging Added

I've added comprehensive logging to track the entire data flow:

### 1. Database Initialization (userDatabase.js)
- Logs when flash sales database initializes
- Shows data loaded from localStorage
- Shows cleanup process

### 2. Load Flash Sales (FindSales.jsx)
- Logs when loading flash sales
- Shows data from database
- Shows valid sales after filtering

### 3. Purchase Flow
- Already has extensive logging from previous changes

## Test Steps

### Test 1: Check Initial Load
1. Open browser and press F12 → Console tab
2. Refresh the page
3. Look for: `=== INITIALIZING FLASH SALES DATABASE ===`
4. Check what data is loaded from localStorage

### Test 2: Make a Purchase
1. Go to Flash Sales page
2. Click "Buy Now" on an item
3. Complete the purchase
4. Check console for the full purchase flow
5. **Verify the sold count updates in the UI**

### Test 3: Check localStorage Persistence
1. After purchase, in the console run:
   ```javascript
   JSON.parse(localStorage.getItem('vendorMitraFlashSales'))
   ```
2. **Verify the sold count is saved in localStorage**

### Test 4: Logout and Login
1. Click logout
2. Log back in
3. Go to Flash Sales page
4. Check console for initialization logs
5. **Check if the sold count is still correct**

## Expected Console Output

### On Page Load:
```
=== INITIALIZING FLASH SALES DATABASE ===
Saved data from localStorage: [{"id":1,"sold":5,"total":30,...}]
Parsed flash sales: [{id: 1, sold: 5, total: 30}]
Cleaned up: 1 -> 1 flash sales
Flash sales after initialization: [{id: 1, sold: 5, total: 30}]
```

### On Flash Sales Page:
```
=== LOADING FLASH SALES ===
Flash sales from database: [{id: 1, product: "dghj", sold: 5, total: 30}]
Valid flash sales after filtering: [{id: 1, product: "dghj", sold: 5, total: 30}]
Flash sales state updated
```

### After Purchase:
```
=== PURCHASE STARTED ===
decreaseFlashSaleStock called with: {id: 1, quantity: 5}
Updated sale: {id: 1, sold: 10, total: 30}
Saved to localStorage
State updated - Item in state: Sold: 10/30
=== PURCHASE COMPLETED ===
```

## What to Report

Please test and report:

1. **Does the sold count update while logged in?** (Yes/No)
2. **What does localStorage show after purchase?** (paste the output)
3. **After logout/login, what does the initialization log show?** (paste the output)
4. **After logout/login, what sold count is displayed?** (the number)

This will help identify exactly where the data is being lost!
