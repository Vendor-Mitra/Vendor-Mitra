# Testing Bargains Across Vendor and Supplier

## Important: localStorage is Browser-Specific!

**Key Concept**: Each browser/profile has its own localStorage. Bargains are saved in localStorage, so:
- ❌ **Won't work**: Vendor in Chrome, Supplier in Firefox (different browsers)
- ❌ **Won't work**: Vendor in normal Chrome, Supplier in Chrome Incognito (different storage)
- ✅ **Will work**: Both in the same browser, different tabs (shared localStorage)
- ✅ **Will work**: After page refresh (data persists in localStorage)

## Testing Method 1: Same Browser, Different Tabs (Real-Time Sync Works!)

### Step 1: Open Two Tabs in the Same Browser
1. **Tab 1**: Open http://localhost:5173
2. **Tab 2**: Open http://localhost:5173 (in a new tab, same browser)

### Step 2: Login as Vendor (Tab 1)
1. Login: manya@gmail.com / manya123
2. Go to Supplier Finder or Find Items
3. Add a product to cart
4. Go to Cart
5. Click "Bargain" button
6. **Check Console (F12)**: You should see:
   ```
   ✅ Created new bargain: {
     id: 1234567890,
     productName: "Organic Tomatoes",
     supplierId: 2,
     supplierName: "Sakshi",
     vendorId: 1,
     vendorName: "Manya"
   }
   ```
7. Type an offer: `150`
8. Click Send

### Step 3: Login as Supplier (Tab 2)
1. **Logout** from Tab 2 if logged in
2. Login: sakshi07@gmail.com / sakshi123
3. Go to **Supplier Dashboard**
4. Click **"Bargains"** tab
5. **Check Console (F12)**: You should see:
   ```
   📦 Supplier loading bargains for supplier ID: 2
   📦 Found bargains: 1 [Array with your bargain]
   ```
6. ✅ **You should see the bargain** from the vendor!
7. Click "Open Chat"
8. You should see the vendor's offer of ₹150
9. **Accept/Reject buttons should appear!**

---

## Testing Method 2: Different Browsers (Manual Refresh Required)

If you're using different browsers (Chrome for vendor, Firefox for supplier), the real-time sync won't work, but the data is still saved. You need to **manually share the localStorage data**.

### Option A: Export/Import localStorage (Recommended)

**In Vendor Browser (after creating bargain):**
1. Open Console (F12)
2. Run:
```javascript
const bargains = localStorage.getItem('vendorMitraBargains')
console.log('Copy this:', bargains)
```
3. Copy the output

**In Supplier Browser:**
1. Open Console (F12)
2. Run:
```javascript
localStorage.setItem('vendorMitraBargains', 'PASTE_THE_COPIED_DATA_HERE')
console.log('Bargains imported!')
```
3. Refresh the page (F5)
4. Go to Supplier Dashboard > Bargains tab
5. ✅ You should now see the bargain!

### Option B: Use Same Browser with Two User Profiles

Instead of different browsers, use the same browser with different profiles:
1. Chrome: Click your profile icon → "Add" → Create new profile
2. Open your app in both profiles
3. Each profile has separate localStorage but can be tested in parallel

---

## Testing Method 3: Backend API (Future Enhancement)

Currently, bargains are stored in **localStorage** (frontend only). For true cross-browser/cross-device sync, you would need:
1. Backend API to store bargains in a database
2. WebSocket or polling for real-time updates
3. API calls instead of localStorage

---

## Debugging Checklist

### Vendor Side (After Creating Bargain)
Open Console (F12) and check:

```javascript
// Check if bargain was created
const bargains = JSON.parse(localStorage.getItem('vendorMitraBargains') || '[]')
console.log('All bargains:', bargains)

// Find your bargain
const myBargain = bargains.find(b => b.vendorId === 1) // Replace 1 with your vendor ID
console.log('My bargain:', myBargain)

// Check supplier ID
console.log('Supplier ID in bargain:', myBargain?.supplierId)
```

Expected output:
```javascript
{
  id: 1234567890,
  productId: 123,
  productName: "Organic Tomatoes",
  supplierId: 2,  // ← Should match the supplier's user ID
  supplierName: "Sakshi",
  vendorId: 1,
  vendorName: "Manya",
  status: "pending",
  messages: [
    { sender: "vendor", offer: 150, message: "150", timestamp: "..." }
  ]
}
```

### Supplier Side (When Loading Bargains)
Open Console (F12) and check:

```javascript
// Check localStorage
const bargains = JSON.parse(localStorage.getItem('vendorMitraBargains') || '[]')
console.log('All bargains in localStorage:', bargains)

// Check which supplier ID you're logged in as
const user = JSON.parse(localStorage.getItem('vendorMitraUser') || '{}')
console.log('Logged in as supplier ID:', user.id)

// Filter bargains for this supplier
const myBargains = bargains.filter(b => b.supplierId === user.id)
console.log('My bargains:', myBargains)
```

---

## Common Issues & Solutions

### Issue 1: "Supplier sees 0 bargains"
**Cause**: Different localStorage (different browser/incognito)
**Solution**: 
- Use same browser, different tabs
- OR manually copy localStorage data (see Method 2)
- OR check console logs to verify supplier ID matches

### Issue 2: "Bargain shows but no messages"
**Cause**: Bargain created but vendor hasn't sent first offer yet
**Solution**: 
- Vendor should type a number (e.g., "150") and click Send
- Then supplier will see the offer

### Issue 3: "Real-time sync not working"
**Cause**: localStorage events only work within same browser
**Solution**:
- Use same browser, different tabs
- OR refresh the supplier page manually after vendor sends message

### Issue 4: "Supplier ID mismatch"
**Cause**: Product doesn't have correct supplierId
**Solution**:
- Check console log when creating bargain
- Verify `supplierId` matches the supplier's user ID (usually 2 for Sakshi)
- Check the product in cart has `item.supplierId` set

---

## Quick Test Script

Run this in vendor browser after creating bargain:

```javascript
// Get the bargain you just created
const bargains = JSON.parse(localStorage.getItem('vendorMitraBargains') || '[]')
const latest = bargains[bargains.length - 1]

console.log('Latest Bargain Details:')
console.log('- Product:', latest.productName)
console.log('- Vendor ID:', latest.vendorId)
console.log('- Vendor Name:', latest.vendorName)
console.log('- Supplier ID:', latest.supplierId, '← Should be 2 for Sakshi')
console.log('- Supplier Name:', latest.supplierName)
console.log('- Status:', latest.status)
console.log('- Messages:', latest.messages.length)

if (latest.supplierId === 2) {
  console.log('✅ Supplier ID is correct! Sakshi should see this bargain.')
} else {
  console.log('❌ Supplier ID is wrong! Expected 2, got:', latest.supplierId)
}
```

---

## Recommended Testing Setup

**Best Practice**: Use **Chrome with two profiles** or **same browser, two tabs**

1. **Tab/Profile 1**: Vendor (manya@gmail.com)
2. **Tab/Profile 2**: Supplier (sakshi07@gmail.com)
3. Both share the same localStorage
4. Real-time sync works automatically
5. No manual data copying needed

This is the easiest and most reliable way to test the bargaining feature!
