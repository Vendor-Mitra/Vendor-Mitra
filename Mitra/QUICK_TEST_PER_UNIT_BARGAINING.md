# Quick Test - Per-Unit Bargaining

## 🎯 What Changed
Bargaining is now done on **price per item** (per kg/unit), not on total amount.

## 🚀 Quick Test (3 minutes)

### Setup
1. Open app in **TWO browser windows**
   - Window 1: Login as **Vendor**
   - Window 2: Login as **Supplier**
2. Open Console (F12) in Vendor window

### Test Steps

#### Step 1: Add Product (Vendor)
1. Go to "Find Suppliers"
2. Add a product to cart (e.g., Tomatoes)
3. Note the price (e.g., ₹50/kg)
4. Set quantity to 4 kg
5. Go to Cart - should show total: ₹200 (50 × 4)

#### Step 2: Start Bargain (Vendor)
1. Click "Bargain" button
2. **Verify the bargain chat shows:**
   - ✅ "Original Price Per Unit: ₹50/kg"
   - ✅ "Quantity: 4 kg"
   - ✅ "💡 Negotiate on the price per kg!"

#### Step 3: Negotiate (Both Windows)
1. **Vendor** types: "45" (meaning ₹45/kg, not total)
2. **Supplier** sees: "Vendor offered ₹45"
3. **Supplier** clicks "Accept ₹45"
4. Both see: "Both parties agreed at ₹45"

#### Step 4: Deal Done (Both)
1. **Vendor** clicks "Confirm Deal Done"
2. **Supplier** clicks "Confirm Deal Done"
3. **Check console** should show:
   ```
   ✅ Saved bargained per-unit price: 45 /kg for Tomatoes
   ```

#### Step 5: Verify Cart (Vendor)
1. Go to Cart page
2. **Should see:**
   - ~~₹200~~ (original total crossed out)
   - **₹180** (bargained total: 45 × 4)
   - "Bargained! (₹45/kg)" label

#### Step 6: Test Quantity Change (Vendor)
1. In cart, change quantity from 4 to 5
2. **Should see:**
   - Total updates to **₹225** (45 × 5)
   - Still shows "Bargained! (₹45/kg)"
3. Change back to 3
4. **Should see:**
   - Total updates to **₹135** (45 × 3)

## ✅ Success Criteria

- [ ] Bargain chat shows "Price Per Unit" not "Total Amount"
- [ ] Bargain chat shows quantity separately
- [ ] Negotiation is on per-unit price (45, not 180)
- [ ] Console shows "Saved bargained per-unit price: 45 /kg"
- [ ] Cart shows correct total (per-unit × quantity)
- [ ] Cart label shows "(₹45/kg)"
- [ ] Changing quantity updates total correctly
- [ ] Bargained per-unit price persists across quantity changes

## 📊 Expected Values

| Step | Original Price/Unit | Quantity | Original Total | Bargained Price/Unit | Bargained Total |
|------|---------------------|----------|----------------|----------------------|-----------------|
| Initial | ₹50/kg | 4 kg | ₹200 | - | - |
| After Bargain | ₹50/kg | 4 kg | ₹200 | ₹45/kg | ₹180 |
| Change to 5 kg | ₹50/kg | 5 kg | ₹250 | ₹45/kg | ₹225 |
| Change to 3 kg | ₹50/kg | 3 kg | ₹150 | ₹45/kg | ₹135 |

## 🐛 Common Issues

### Issue: Shows total amount (180) instead of per-unit (45)
**Check:** Bargain chat should say "Original Price Per Unit: ₹50/kg"
**Fix:** Clear localStorage and create a new bargain

### Issue: Quantity change doesn't update total
**Check:** Console for calculation logs
**Fix:** Refresh cart page

### Issue: Old bargains not working
**Expected:** Old bargains used total amount format
**Fix:** Delete old bargains and create new ones

## 📝 Console Verification

### When creating bargain:
```
❌ No existing bargain found - CREATING NEW
✅ Created new bargain
```

### When deal done:
```
✅ Saved bargained per-unit price: 45 /kg for Tomatoes
🔑 Bargain Product ID (key used): supplier_1_Tomatoes
📦 All bargained prices: {
  supplier_1_Tomatoes: {
    isBargained: true,
    bargainedPricePerUnit: 45,
    originalPricePerUnit: 50,
    quantity: 4,
    unit: 'kg'
  }
}
```

### When viewing cart:
```
💰 Calculating cart total with bargains...
  Tomatoes (ID: supplier_1_Tomatoes): BARGAINED ₹45/kg × 4 = ₹180
```

## 🎉 Success!
If the bargained price adjusts correctly when you change quantity, the per-unit bargaining is working!

## 📸 Screenshots to Take
1. Bargain chat showing "Price Per Unit"
2. Cart showing "Bargained! (₹45/kg)"
3. Cart with different quantities showing correct totals
4. Console logs showing per-unit price saved
