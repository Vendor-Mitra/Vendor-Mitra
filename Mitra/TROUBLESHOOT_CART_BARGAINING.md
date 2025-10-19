# Quick Troubleshooting - Cart & Bargaining Issues

## Issue: "Item disappeared from cart when I clicked Bargain"

### Most Likely Cause
You navigated to a different page (/bargains). The item is still in your cart!

### Solution
1. Click the "Cart" button in navigation
2. Or navigate to `/cart` in the URL
3. Your item will be there

### Verify
Open browser console (F12) and run:
```javascript
JSON.parse(localStorage.getItem('vendorMitraCart'))
```
You should see your items in the array.

---

## Issue: "Item was in cart, now it's completely gone"

### Possible Causes & Solutions

#### 1. You clicked "Remove" or "Clear All"
**Check console for:**
```
⚠️ CartContext: Removing item from cart
⚠️ CartContext: Clearing entire cart
```
**Solution:** Add the item back to cart

#### 2. You completed a purchase
**Check console for:**
```
Thank you for your purchase!
⚠️ CartContext: Clearing entire cart
```
**Solution:** This is expected behavior. Add items again for new purchase.

#### 3. You're logged in as a different user
**Check:** Are you logged in as the same user who added the items?
**Solution:** Log in as the correct user

#### 4. localStorage was cleared
**Check:** Run in console:
```javascript
localStorage.getItem('vendorMitraCart')
```
**If null:** localStorage was cleared (browser cache cleared, incognito mode, etc.)
**Solution:** Add items back to cart

---

## Issue: "Bargained price not showing in cart"

### Debug Steps

#### Step 1: Check if bargain is completed
```javascript
// In console
const bargains = JSON.parse(localStorage.getItem('vendorMitraBargains'))
const myBargain = bargains.find(b => b.productName === 'YOUR_PRODUCT_NAME')
console.log('Bargain status:', myBargain?.status)
```
**Expected:** `status: 'agreed'`
**If not:** Complete the bargain (both parties must click "Deal Done")

#### Step 2: Check if bargained price is saved
```javascript
// In console
JSON.parse(localStorage.getItem('vendorMitraBargainedPrices'))
```
**Expected:** Object with your product ID as key
**If empty:** Bargain wasn't completed properly. Try again.

#### Step 3: Check ID matching
Open cart page and check console:
```
📦 Cart items: [{ id: 'supplier_1_Tomatoes', ... }]
🤝 Bargained items: [{ key: 'supplier_1_Tomatoes', ... }]
```
**The IDs must match!**
**If different:** This is a bug. Report the exact IDs.

#### Step 4: Refresh the page
Press F5 to refresh the cart page.
The bargained price should load.

---

## Issue: "Changed quantity, bargained price disappeared"

### Expected Behavior
- Bargained **per-unit** price should persist
- Total should recalculate: `bargainedPricePerUnit × new quantity`

### If Not Working

#### Check 1: Verify per-unit price exists
```javascript
// In console
const prices = JSON.parse(localStorage.getItem('vendorMitraBargainedPrices'))
console.log('Bargained prices:', prices)
```
**Look for:** `bargainedPricePerUnit: 45`
**If missing:** Old bargain format. Delete and create new bargain.

#### Check 2: Check console calculations
When viewing cart, look for:
```
Tomatoes (ID: supplier_1_Tomatoes): BARGAINED ₹45/kg × 5 = ₹225
```
**If not showing:** Refresh page or clear cache.

---

## Issue: "Both parties clicked Deal Done, but price not saved"

### Debug Steps

#### Step 1: Check who clicked last
Look in console for:
```
✅ Saved bargained per-unit price: 45 /kg for Tomatoes
👤 Saved by: vendor (or supplier)
```
**If not showing:** The second person didn't click "Deal Done" yet.

#### Step 2: Check bargain status
```javascript
// In console
const bargains = JSON.parse(localStorage.getItem('vendorMitraBargains'))
const myBargain = bargains.find(b => b.id === YOUR_BARGAIN_ID)
console.log('Vendor clicked:', myBargain?.vendorDealDone)
console.log('Supplier clicked:', myBargain?.supplierDealDone)
console.log('Status:', myBargain?.status)
```
**Expected:**
- `vendorDealDone: true`
- `supplierDealDone: true`
- `status: 'agreed'`

#### Step 3: Manually trigger save (if needed)
If both clicked but price not saved, refresh the bargain page and check again.

---

## Quick Fixes

### Fix 1: Clear All Data and Start Fresh
```javascript
// In browser console
localStorage.removeItem('vendorMitraCart')
localStorage.removeItem('vendorMitraBargainedPrices')
localStorage.removeItem('vendorMitraBargains')
// Then refresh page
location.reload()
```

### Fix 2: Verify Cart Persistence
```javascript
// Add item to cart, then run:
const cart = JSON.parse(localStorage.getItem('vendorMitraCart'))
console.log('Cart has', cart.length, 'items:', cart)
```

### Fix 3: Force Reload Bargained Prices
```javascript
// On cart page, run:
window.dispatchEvent(new Event('bargainPriceUpdated'))
window.dispatchEvent(new Event('storage'))
```

---

## Console Commands Reference

### View Cart
```javascript
JSON.parse(localStorage.getItem('vendorMitraCart'))
```

### View Bargained Prices
```javascript
JSON.parse(localStorage.getItem('vendorMitraBargainedPrices'))
```

### View All Bargains
```javascript
JSON.parse(localStorage.getItem('vendorMitraBargains'))
```

### Clear Everything
```javascript
localStorage.clear()
location.reload()
```

### Check Specific Item
```javascript
const cart = JSON.parse(localStorage.getItem('vendorMitraCart'))
const item = cart.find(i => i.name === 'Tomatoes')
console.log('Item:', item)

const prices = JSON.parse(localStorage.getItem('vendorMitraBargainedPrices'))
const bargainedPrice = prices[item.id]
console.log('Bargained price:', bargainedPrice)
```

---

## When to Report a Bug

Report a bug if:
1. ✅ Cart items exist in localStorage
2. ✅ Bargained prices exist in localStorage
3. ✅ IDs match between cart and bargained prices
4. ❌ But bargained price still not showing in cart

Include in your report:
- Screenshot of cart page
- Console logs
- Output of localStorage commands above
- Steps to reproduce

---

## Prevention Tips

1. **Don't clear browser cache** during active bargaining
2. **Complete bargains** before logging out
3. **Use same browser/tab** for vendor and supplier (or different browsers)
4. **Check console** for any error messages
5. **Refresh cart page** after completing bargain

---

## Expected Console Output (Normal Flow)

### When Starting Bargain:
```
💬 Opening bargain for: Tomatoes Product ID: supplier_1_Tomatoes
📦 Cart BEFORE bargain: [{ id: 'supplier_1_Tomatoes', name: 'Tomatoes', quantity: 4 }]
⚠️ IMPORTANT: Item will REMAIN in cart during bargaining!
```

### When Deal Done:
```
✅ Saved bargained per-unit price: 45 /kg for Tomatoes
🔑 Bargain Product ID (key used): supplier_1_Tomatoes
👤 Saved by: supplier
```

### When Viewing Cart:
```
✅ Cart verified on page load: 1 items
💰 Reloading bargained prices on mount: { supplier_1_Tomatoes: {...} }
  Tomatoes (ID: supplier_1_Tomatoes): BARGAINED ₹45/kg × 4 = ₹180
```

If you see these messages, everything is working correctly!
