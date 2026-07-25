# ShopPOS — How to Use

## Install / How to run

### Before you start (Windows)

1. Install **Laragon Full**
2. Laragon → **Start All** (MySQL ON)
3. Laragon → Menu → Tools → Path → **Add Laragon to Path**
4. Close and reopen CMD / PowerShell

### 1) Clone

```bat
git clone https://github.com/MohammadRizwanZafar/pos-system.git
cd pos-system
```

### 2) First-time setup (once)

```bat
pos setup
```

PowerShell: `.\pos setup` · or double-click `SETUP.bat`  
(Creates env, composer, migrate + seed, npm install/build)

### 3) Start every day

Laragon → Start All, then:

```bat
pos start
```

PowerShell: `.\pos start` · or double-click `START.bat`

### 4) Open in browser

| Service | URL |
|---------|-----|
| Frontend (POS) | http://localhost:9050 |
| Backend API | http://localhost:9051 |
| API base | http://localhost:9051/api/v1 |

### 5) Stop

```bat
pos stop
```

Or double-click `STOP.bat`.

---

### Docker

```bash
git clone https://github.com/MohammadRizwanZafar/pos-system.git
cd pos-system
cp .env.example .env
docker compose up --build -d
```

Then open http://localhost:9050

---

## Login

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@pos.com` | `admin0101` |
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
