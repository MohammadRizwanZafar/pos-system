# ShopPOS — How to Use

## Install

**Docker**

```bash
git clone https://github.com/MohammadRizwanZafar/pos-system.git
cd pos-system
cp .env.example .env
docker compose up --build -d
```

**Windows (Laragon)**

1. Start Laragon (MySQL on)
2. Clone the project
3. Run `scripts\setup-native.bat`
4. Daily: `start-pos.bat` / `stop-pos.bat`

Open the POS app in the browser when ready.

---

## Login

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@pos.com` | `password` |
| Owner | `admin@pos.com` | `password` |
| Cashier | `cashier@pos.com` | `password` |

---

## Menus by role

| Menu | Super Admin | Owner | Cashier |
|------|-------------|-------|---------|
| Platform Shops | Yes | No | No |
| Dashboard | No | Yes | No |
| POS | No | Yes | Yes |
| Products | No | Full | View only |
| Categories | No | Full | View only |
| Sales | No | Yes | Yes |
| Sold Products | No | Yes | No |
| Returns | No | Yes | Yes |
| Opening Cash | No | Yes | No |
| Expenses | No | Yes | No |
| Reports | No | Yes | No |
| Users | No | Yes | No |
| Settings | No | Yes | No |

---

## Super Admin

1. Log in as Super Admin  
2. **Platform → Shops → Create Shop**  
3. Set shop details + owner email/password  
4. Optionally add cashiers  

Owner then logs in with that account.

---

## Owner

**Products** — Add name, price, cost, stock, category. Inactive products cannot be sold.

**POS** — Tap products → cart → discount (optional) → cash received → **Complete Sale**. Use Quick Expense for small costs.

**Sales** — View invoices by period. Fully returned sales are hidden. Partial returns show net total.

**Returns** — Enter invoice → set return qty → **Process Return**. Stock is restored. Full return removes the sale from Sales and Dashboard.

**Opening Cash** — Set drawer cash when the shop opens. Dashboard shows opening cash and cash in hand.

**Sold Products** — See which products sold, quantity, times sold, cost, and amount. Search by name or SKU. Filter by day, week, or month.

**Expenses / Reports / Users / Settings** — Record costs, view reports, manage staff, update store name/tax/currency.

---

## Cashier

1. Log in → opens on **POS**  
2. Make sales  
3. View all shop sales under **Sales**  
4. Process returns under **Returns**  
5. Products are view-only  

---

## Notes

- Stock goes down on sale, up on return  
- You cannot return more than remaining quantity  
- Owner has full shop access; Super Admin manages shops only  
