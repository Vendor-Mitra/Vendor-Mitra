# LocalStorage Debug Guide

## Quick Test Commands

Open browser console and run these commands to debug:

### 1. Check Flash Sales in localStorage
```javascript
// View current flash sales data
const flashSales = JSON.parse(localStorage.getItem('vendorMitraFlashSales'))
console.table(flashSales.map(s => ({
  id: s.id,
  product: s.product,
  sold: s.sold,
  total: s.total,
  remainingStock: s.remainingStock
})))
```

### 2. Check All localStorage Keys
```javascript
// See all stored data
Object.keys(localStorage).filter(k => k.startsWith('vendorMitra')).forEach(key => {
  console.log(key + ':', localStorage.getItem(key))
})
```

### 3. Manually Set Test Data
```javascript
// Create a test flash sale with sold items
const testData = [{
  id: 1,
  product: "Test Product",
  sold: 15,
  total: 30,
  remainingStock: 15,
  price: 20,
  oldPrice: 40,
  discount: 50,
  status: 'active',
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}]
localStorage.setItem('vendorMitraFlashSales', JSON.stringify(testData))
console.log('Test data saved. Refresh the page.')
```

### 4. Clear Flash Sales Data
```javascript
// Clear and reset
localStorage.removeItem('vendorMitraFlashSales')
console.log('Flash sales cleared. Refresh the page.')
```

## Test Procedure

### Step 1: Before Purchase
```javascript
// Run this before buying
console.log('BEFORE PURCHASE:')
const before = JSON.parse(localStorage.getItem('vendorMitraFlashSales'))
console.log('Flash Sales:', before)
```

### Step 2: After Purchase
```javascript
// Run this immediately after buying
console.log('AFTER PURCHASE:')
const after = JSON.parse(localStorage.getItem('vendorMitraFlashSales'))
console.log('Flash Sales:', after)
```

### Step 3: After Logout
```javascript
// Run this after logging out (before login)
console.log('AFTER LOGOUT:')
const afterLogout = JSON.parse(localStorage.getItem('vendorMitraFlashSales'))
console.log('Flash Sales:', afterLogout)
```

### Step 4: After Login
```javascript
// Run this after logging back in
console.log('AFTER LOGIN:')
const afterLogin = JSON.parse(localStorage.getItem('vendorMitraFlashSales'))
console.log('Flash Sales:', afterLogin)
```

## What to Look For

### ✅ If Working:
- After purchase: `sold` count increases
- After logout: Data still exists in localStorage
- After login: Data is still there with correct `sold` count

### ❌ If Broken:
- After logout: Data is null or empty
- After login: Data resets to original values
- After purchase: Data not saved to localStorage

## Common Issues

### Issue 1: Data Not Persisting
**Symptom:** localStorage is empty after logout
**Cause:** Logout function is clearing the data
**Solution:** Check AuthContext.jsx logout function

### Issue 2: Data Resets on Login
**Symptom:** Data exists but resets to initial values
**Cause:** Initialization is overwriting saved data
**Solution:** Check userDatabase.js initialize function

### Issue 3: Data Not Saving
**Symptom:** After purchase, localStorage doesn't update
**Cause:** decreaseFlashSaleStock not saving properly
**Solution:** Check the save verification logs

## Report Format

Please run the tests and report:

```
BEFORE PURCHASE:
[paste output]

AFTER PURCHASE:
[paste output]

AFTER LOGOUT:
[paste output]

AFTER LOGIN:
[paste output]
```

This will show exactly where the data is being lost!
