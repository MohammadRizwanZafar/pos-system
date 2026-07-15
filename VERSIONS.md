# ShopPOS — Project Versions

Technology versions used in the **ShopPOS** project.

---

## Backend (Laravel API)

| Technology | Version |
|------------|---------|
| **PHP** | **8.3+** |
| **Laravel** | **13.x** |
| **Laravel Sanctum** (auth) | **4.3+** |
| **Spatie Permission** (roles) | **8.0+** |
| **Composer** | **2.x** |

---

## Frontend (Next.js)

| Technology | Version |
|------------|---------|
| **Node.js** | **22+** |
| **Next.js** | **15.1.3** |
| **React** | **19.x** |
| **TypeScript** | **5.7.x** |
| **Tailwind CSS** | **3.4.x** |
| **Axios** | **1.7.x** |

---

## Database & Server

| Technology | Version |
|------------|---------|
| **MySQL** | **8.0** |
| **Nginx** (Docker) | **1.27** |
| **PHP-FPM** (Docker) | **8.3** |

---

## Minimum for Laragon install

| Software | Version |
|----------|---------|
| **Laragon Full** | Latest |
| **PHP** | **8.3** |
| **MySQL** | **8.0+** |
| **Node.js** | **22+** |
| **Composer** | **2.x** |

---

## Ports (URLs)

| Service | Port |
|---------|------|
| Frontend (POS) | **9050** |
| API (Backend) | **9051** |
| phpMyAdmin (Docker) | **9052** |

---

## Docker images (when using Docker)

| Image | Version |
|-------|---------|
| `php:8.3-fpm-alpine` | 8.3 |
| `node:22-alpine` | 22 |
| `mysql:8.0` | 8.0 |
| `nginx:1.27-alpine` | 1.27 |

---

## Short summary

```
PHP 8.3  +  Laravel 13  +  MySQL 8
Node 22  +  Next.js 15  +  React 19
Ports: 9050 (POS) | 9051 (API)
```

## App version

**1.0**
