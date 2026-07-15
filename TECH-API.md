# ShopPOS — Technical Details & API

## Stack

| Layer | Tech |
|-------|------|
| Backend | PHP 8.3, Laravel 13 |
| Auth | Sanctum Bearer tokens |
| Roles | Spatie Permission |
| DB | MySQL 8 |
| Frontend | Next.js 15, React 19, TypeScript |
| Containers | Docker Compose |

Base path: `/api/v1`  
Headers: `Authorization: Bearer {token}`, `Accept: application/json`, `Content-Type: application/json`

**Response**

```json
{ "success": true, "message": "Success", "data": {} }
```

---

## Roles & shops

| Role | Access |
|------|--------|
| `super_admin` | Platform shops only |
| `admin` | Full shop |
| `cashier` | POS, products (read), sales, returns |

Shop data is scoped by `shop_id` via `shop.context` middleware.

---

## Sale / return rules

| Status | Meaning |
|--------|---------|
| `completed` | Normal sale |
| `partially_returned` | Some items returned |
| `fully_returned` | All items returned (hidden from sales list, dashboard, reports) |

- Sale decreases stock; return increases stock  
- `net_total = total - refunded_amount`  
- Profit: `(price - cost) * remaining_qty`  

---

## APIs

All paths below are under `/api/v1` unless noted.

### Auth

| Method | Path | Role |
|--------|------|------|
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Auth |
| GET | `/auth/me` | Auth |

```json
{ "email": "...", "password": "..." }
```

### Platform (`super_admin`)

| Method | Path |
|--------|------|
| GET/POST | `/platform/shops` |
| GET/PUT | `/platform/shops/{shop}` |
| POST | `/platform/shops/{shop}/cashiers` |

Create shop body: `name`, `owner_name`, `owner_email`, `owner_password` (+ optional `slug`, `address`, `phone`).

### Products

| Method | Path | Role |
|--------|------|------|
| GET | `/products`, `/products/{id}` | admin, cashier |
| POST/PUT/DELETE | `/products`… | admin |
| GET | `/categories` | admin, cashier |
| POST/PUT/DELETE | `/categories`… | admin |

Product body: `name`, `price`, optional `category_id`, `sku`, `barcode`, `cost`, `stock`, `is_active`.

### Sales

| Method | Path | Role |
|--------|------|------|
| POST | `/sales` | admin, cashier |
| GET | `/sales`, `/sales/{id}`, `/sales/{id}/invoice` | admin, cashier |

Query: `from_date`, `to_date`.

```json
{
  "items": [{ "product_id": 1, "quantity": 2 }],
  "discount": 0,
  "amount_paid": 200,
  "note": "optional"
}
```

### Returns

| Method | Path | Role |
|--------|------|------|
| GET | `/returns/sale-by-invoice/{invoiceNo}` | admin, cashier |
| POST | `/sales/{sale}/returns` | admin, cashier |
| GET | `/returns` | admin, cashier |

```json
{
  "items": [{ "sale_item_id": 10, "quantity": 1 }],
  "note": "optional"
}
```

### Dashboard & reports (`admin`)

| Method | Path | Query |
|--------|------|-------|
| GET | `/dashboard/stats` | `period`, `from_date`, `to_date` |
| GET | `/reports/sales` | `type`, `from_date`, `to_date` |
| GET | `/reports/expenses` | `from_date`, `to_date` |

### Expenses

| Method | Path | Role |
|--------|------|------|
| GET/POST | `/expenses` | admin, cashier |
| GET/PUT/DELETE | `/expenses/{id}` | admin, cashier |

Body: `title`, `amount`, `expense_date`, optional `category`, `note`.

### Users (`admin`)

| Method | Path |
|--------|------|
| GET/POST | `/users` |
| GET/PUT | `/users/{id}` |

Body: `name`, `email`, `password`, `role` (`admin`\|`cashier`), optional `is_active`.

### Settings

| Method | Path | Role |
|--------|------|------|
| GET | `/settings` | Auth |
| PUT | `/settings` | admin |

Body: `store_name`, `address`, `phone`, `tax_percent`, `currency_symbol`, `receipt_footer`.

### Health

`GET /api/health` → `{ "status": "ok" }`

---

## Middleware

```
auth:sanctum → shop.context → role:...
```

---

## Main tables

`shops`, `users`, `categories`, `products`, `sales`, `sale_items`, `sale_returns`, `sale_return_items`, `expenses`, `store_settings`
