# Route Migration Guide: PUT/DELETE to POST

This document outlines the required changes to migrate non-admin routes from `PUT`/`DELETE` HTTP methods to `POST` for better compatibility with shared hosting environments.

## ⚠️ Important Notes

- **Admin routes are excluded** - Admin routes (`/api/admin/*`) already use POST with `/update` and `/delete` suffixes and should remain unchanged.
- **Only public/user routes need migration** - This guide covers routes accessible to regular users (cart, orders, etc.).
- **Backend changes required** - The backend API must be updated to accept POST requests at these endpoints.

---

## Routes to Migrate

### 1. Cart Routes

#### Update Cart Item

**Current:**
```
PUT /api/cart/:productId
```

**Change to:**
```
POST /api/cart/:productId/update
```

**Request Body:** (unchanged)
```json
{
  "quantity": 3
}
```

**Implementation Notes:**
- Change HTTP method from `PUT` to `POST`
- Append `/update` to the endpoint URL
- Request body format remains the same

---

#### Remove from Cart

**Current:**
```
DELETE /api/cart/:productId
```

**Change to:**
```
POST /api/cart/:productId/delete
```

**Request Body:** (none required)

**Implementation Notes:**
- Change HTTP method from `DELETE` to `POST`
- Append `/delete` to the endpoint URL
- No request body needed

---

#### Clear Cart

**Current:**
```
DELETE /api/cart
```

**Change to:**
```
POST /api/cart/clear
```

**Request Body:** (none required)

**Implementation Notes:**
- Change HTTP method from `DELETE` to `POST`
- Change endpoint from `/api/cart` to `/api/cart/clear`
- No request body needed

---

## Frontend Code Changes Required

### Files to Update

1. **Cart Query/API Client Files** (if they exist)
   - Update HTTP method from `PUT`/`DELETE` to `POST`
   - Update endpoint URLs to include `/update` or `/delete` suffix

2. **Any Direct Fetch Calls**
   - Search for `method: 'PUT'` and `method: 'DELETE'` in cart-related code
   - Update to `method: 'POST'` with new endpoint paths

### Example Migration

**Before:**
```typescript
// Update cart item
await fetch(`${API_BASE_URL}/cart/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ quantity: 3 })
});

// Remove from cart
await fetch(`${API_BASE_URL}/cart/${productId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**After:**
```typescript
// Update cart item
await fetch(`${API_BASE_URL}/cart/${productId}/update`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ quantity: 3 })
});

// Remove from cart
await fetch(`${API_BASE_URL}/cart/${productId}/delete`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Backend Changes Required

### Route Handlers

Update your backend route handlers to:

1. Accept POST requests instead of PUT/DELETE
2. Use the new endpoint paths:
   - `POST /api/cart/:productId/update` (replaces `PUT /api/cart/:productId`)
   - `POST /api/cart/:productId/delete` (replaces `DELETE /api/cart/:productId`)
   - `POST /api/cart/clear` (replaces `DELETE /api/cart`)

3. Keep the same business logic - only the HTTP method and route path change

### Example Backend Changes

**Express.js Example:**

```javascript
// Before
router.put('/cart/:productId', updateCartItem);
router.delete('/cart/:productId', removeFromCart);
router.delete('/cart', clearCart);

// After
router.post('/cart/:productId/update', updateCartItem);
router.post('/cart/:productId/delete', removeFromCart);
router.post('/cart/clear', clearCart);
```

---

## Routes That Do NOT Need Changes

The following routes are **admin routes** and already use POST or should remain as-is:

- ✅ `/api/admin/categories/:id/update` (already POST)
- ✅ `/api/admin/categories/:id/delete` (already POST)
- ✅ `/api/admin/products/:id/update` (already POST)
- ✅ `/api/admin/products/:id/delete` (already POST)
- ✅ All other `/api/admin/*` routes

---

## Testing Checklist

After migration, test the following:

- [ ] Update cart item quantity
- [ ] Remove item from cart
- [ ] Clear entire cart
- [ ] Verify error handling for invalid requests
- [ ] Verify authentication/authorization still works
- [ ] Test with multiple users (cart isolation)

---

## Summary of Changes

| Route | Old Method | Old Endpoint | New Method | New Endpoint |
|-------|-----------|--------------|------------|--------------|
| Update Cart Item | PUT | `/api/cart/:productId` | POST | `/api/cart/:productId/update` |
| Remove Cart Item | DELETE | `/api/cart/:productId` | POST | `/api/cart/:productId/delete` |
| Clear Cart | DELETE | `/api/cart` | POST | `/api/cart/clear` |

---

## Additional Notes

- This migration pattern follows the same approach already used for admin routes
- POST is more widely supported across shared hosting configurations
- The `/update` and `/delete` suffixes make the intent clear while using POST
- All request/response formats remain unchanged - only the HTTP method and endpoint path change
