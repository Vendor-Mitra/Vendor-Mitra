# Cart Behavior During Bargaining - Complete Guide

## How It Works

### ✅ Correct Behavior
1. **Add item to cart** → Item appears in cart
2. **Click "Bargain"** → Redirects to Bargains page
3. **Item REMAINS in cart** (stored in localStorage)
4. **Negotiate and complete bargain** → Bargained price is saved
5. **Return to cart** → Item still there with bargained price shown

### ❌ What Should NOT Happen
- Item should NOT be removed from cart when bargaining starts
- Cart should NOT be cleared during bargaining
- Item should NOT disappear when navigating to Bargains page

## Technical Implementation

### Cart Persistence
- Cart is stored in `localStorage` under key: `vendorMitraCart`
- Cart persists across page navigation
- Cart is automatically loaded when CartContext initializes

### Bargaining Flow

#### Step 1: Start Bargain (from Cart)
```javascript
// In Cart.jsx - openBargainModal()
1. Creates/finds bargain in database
2. Navigates to /bargains page
3. Item STAYS in cart (no removal)
```

#### Step 2: Negotiate (on Bargains page)
```javascript
// In Negotiation.jsx
1. Both parties negotiate on per-unit price
2. Both accept the price
3. Both click "Confirm Deal Done"
```

#### Step 3: Save Bargained Price
```javascript
// In Negotiation.jsx - handleDealDone()
1. Saves to localStorage: vendorMitraBargainedPrices
2. Key: productId
3. Value: {
     isBargained: true,
     bargainedPricePerUnit: 45,
     originalPricePerUnit: 50,
     quantity: 4,
     unit: 'kg'
   }
4. Dispatches events to update cart
```

#### Step 4: Return to Cart
```javascript
// Cart.jsx automatically:
1. Loads cart from localStorage (items intact)
2. Loads bargained prices from localStorage
3. Matches bargained prices to cart items by ID
4. Displays bargained price if match found
```

## Safeguards Added

### 1. Cart Verification on Load
```javascript
// Cart.jsx - useEffect on mount
- Verifies cart exists in localStorage
- Logs cart item count
- Warns if cart is empty
```

### 2. Bargain Warning on Remove
```javascript
// CartContext.jsx - removeFromCart()
- Checks if item has active bargain
- Warns user before removal
- Logs bargain details
```

### 3. Console Logging
```javascript
// Throughout the flow:
- Logs when bargain starts
- Logs that item remains in cart
- Logs when bargained price is saved
- Logs when cart is loaded
```

## Debugging Guide

### If Item Disappears from Cart

#### Check 1: localStorage
```javascript
// In browser console
JSON.parse(localStorage.getItem('vendorMitraCart'))
```
**Expected:** Array with your cart items
**If empty:** Cart was cleared somewhere

#### Check 2: Console Logs
Look for these messages:
```
⚠️ CartContext: Removing item from cart: [itemId]
⚠️ CartContext: Clearing entire cart
```
**If found:** Check the stack trace to see where it was called from

#### Check 3: Bargained Prices
```javascript
// In browser console
JSON.parse(localStorage.getItem('vendorMitraBargainedPrices'))
```
**Expected:** Object with productId as keys
**Check:** Does the key match your cart item ID?

#### Check 4: Page Navigation
- When you click "Bargain", you navigate to /bargains
- This is NORMAL - the cart is on a different page
- Navigate back to /cart to see your items

### If Bargained Price Not Showing

#### Check 1: ID Matching
```javascript
// In console when viewing cart
💰 Calculating cart total with bargains...
📦 Cart items: [{ id: 'supplier_1_Tomatoes', ... }]
🤝 Bargained items: [{ key: 'supplier_1_Tomatoes', ... }]
```
**The IDs must match exactly!**

#### Check 2: Bargain Status
```javascript
// In browser console
JSON.parse(localStorage.getItem('vendorMitraBargains'))
```
**Check:** Is the bargain status 'agreed'?
**If not:** Complete the bargain (both parties click "Deal Done")

#### Check 3: Refresh Cart
- Navigate away from cart and back
- Or refresh the page (F5)
- Cart should reload with bargained prices

## Common Scenarios

### Scenario 1: "Item disappeared when I clicked Bargain"
**What happened:** You navigated to /bargains page
**Solution:** Navigate back to /cart - item will be there

### Scenario 2: "Item was there, but now it's gone"
**Possible causes:**
1. You clicked "Remove" button
2. You clicked "Clear All" button
3. You completed a purchase
4. You logged out (cart is user-specific)

**Check console for:**
```
⚠️ CartContext: Removing item from cart
⚠️ CartContext: Clearing entire cart
```

### Scenario 3: "Bargain completed but price not updated"
**Possible causes:**
1. Product IDs don't match
2. Bargain status is not 'agreed'
3. Page needs refresh

**Solution:**
1. Check console logs for ID matching
2. Verify both parties clicked "Deal Done"
3. Refresh cart page

### Scenario 4: "Changed quantity, bargained price disappeared"
**Expected behavior:** Bargained per-unit price should persist
**New total:** bargainedPricePerUnit × new quantity

**If not working:**
1. Check console for calculation logs
2. Verify bargainedPricePerUnit exists in localStorage
3. Refresh page

## Console Messages Reference

### Normal Flow:
```
💬 Opening bargain for: Tomatoes Product ID: supplier_1_Tomatoes
📦 Cart BEFORE bargain: [{ id: 'supplier_1_Tomatoes', name: 'Tomatoes', quantity: 4 }]
⚠️ IMPORTANT: Item will REMAIN in cart during bargaining!
⚠️ After deal is done, bargained price will be applied to this item in cart
🚀 Redirecting to /bargains?bargainId=1

[On Bargains page]
✅ Saved bargained per-unit price: 45 /kg for Tomatoes
🔑 Bargain Product ID (key used): supplier_1_Tomatoes

[Return to Cart]
✅ Cart verified on page load: 1 items
💰 Reloading bargained prices on mount: { supplier_1_Tomatoes: {...} }
💰 Calculating cart total with bargains...
  Tomatoes (ID: supplier_1_Tomatoes): BARGAINED ₹45/kg × 4 = ₹180
```

### Warning Messages:
```
⚠️ WARNING: Item has an active bargain! Consider completing the bargain first.
⚠️ Cart is empty! This might indicate an issue.
⚠️ CartContext: Removing item from cart: [itemId]
```

## Testing Checklist

- [ ] Add item to cart
- [ ] Verify item appears in cart
- [ ] Click "Bargain" button
- [ ] Verify redirected to /bargains page
- [ ] Complete bargain (both parties)
- [ ] Navigate back to /cart
- [ ] Verify item still in cart
- [ ] Verify bargained price shows
- [ ] Change quantity
- [ ] Verify total updates correctly
- [ ] Refresh page
- [ ] Verify item and price persist

## Files Modified

1. **src/pages/Cart.jsx**
   - Added cart verification on page load
   - Added console warnings about cart persistence
   - Enhanced logging in openBargainModal

2. **src/contexts/CartContext.jsx**
   - Added bargain check before removing items
   - Added warning if removing item with active bargain
   - Enhanced logging

## Summary

**Items are NOT removed from cart during bargaining.**

The cart is stored in localStorage and persists across:
- Page navigation
- Bargaining process
- Browser refresh

After bargain is complete, the bargained per-unit price is applied to the cart item automatically.
