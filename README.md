# Sree MK Food Court — Fully Offline QR Menu Website

> **Restaurant Tagline:** *Good Food. Good Mood.*  
> **Contact Numbers:** `+91 9391046296`, `+91 8341189085`  
> **Architecture:** 100% Local-Network Offline Architecture (No Internet, No Cloud, No External CDNs)

---

## 1. Executive Summary & Core Objective

**Sree MK Food Court** is a production-ready, mobile-first digital QR menu web application designed to operate **without an active internet connection**. 

Customers seated at tables can connect their smartphones to the restaurant's local Wi-Fi router (even with zero internet bandwidth or disconnected telephone line) and scan a printed QR code. The menu loads instantly on their mobile browsers, featuring full-text search, category browsing, dietary filters (Veg / Non-Veg / Egg), live item availability, and high-resolution offline inspections of the original printed menu cards.

---

## 2. Complete Menu Extraction & Data Integrity

All items, categories, and prices have been transcribed from the **five physical menu-card images**:

| Category | Subcategory Highlights | Item Count | Example Items |
| :--- | :--- | :---: | :--- |
| **Biryani** | Veg & Non-Veg Biryanis | 18 | Veg Biryani (₹149), Chicken Biryani (₹129), Plate Chicken Biryani (₹249), Family Pack (₹479), Prawns Biryani (₹199) |
| **Fried Rice** | Veg, Egg & Chicken | 20 | Veg Fried Rice (₹79), Chilli Garlic (₹89), Sezwan Egg (₹109), Chicken Fried Rice (₹99), MK Spl Chicken (₹149) |
| **Noodles** | Veg & Non-Veg Noodles | 14 | Veg Soft Noodles (₹69), Chilli Garlic (₹79), Egg Noodles (₹79), Ginger Chicken (₹119), Hot Garlic Chicken (₹139) |
| **Starters** | Veg, Egg & Non-Veg | 41 | Veg Manchurian (₹99), Baby Corn 65 (₹159), Chicken 65 (₹169), Chicken Lollipop (₹179), MK Spl Wings (₹209) |
| **Seafood Snacks** | Fish & Prawns | 9 | Apollo Fish (₹179), Chilli Fish (₹169), Loose Prawns (₹179), Butter Garlic Prawns (₹179) |
| **Rolls & Wraps** | Veg, Egg & Non-Veg | 11 | Veg Wrap (₹59), Paneer Wrap (₹79), Cheese Omelette Roll (₹79), Chicken Cheese Roll (₹89) |
| **Main Course** | Indian & Continental | 8 | Egg Bhurji (₹89), Chicken Cheese Balls (₹169), Grilled Chicken (₹169), Lemon Butter Grilled Fish (₹229) |
| **Pasta** | Veg & Non-Veg (Penne & Macaroni) | 12 | Penne White Sauce (₹119), Arrabiata Red Sauce (₹119), Pink Sauce (₹139), Chicken White Sauce (₹149) |
| **Pizza** | Veg & Non-Veg Pizzas | 13 | Margherita (₹129), Peri Peri Paneer (₹159), Chicken BBQ (₹159), Chicken Tikka Double (₹159), MK Spl Pizza (₹169) |
| **Burgers & Sandwiches** | Burgers & Grilled Sandwiches | 10 | Classic Veg Burger (₹79), Cheesy Paneer (₹89), Veg Cheese Sandwich (₹69), Chicken Cheese Sandwich (₹89) |
| **Bits & Nuggets** | Veg & Non-Veg Bits | 5 | Veg Nuggets (₹100), Paneer Fingers (₹100), Chicken Nuggets (₹120), Chicken Popcorn (₹120) |
| **Soups** | Veg & Non-Veg Soups | 10 | Tomato Cream (₹79), Veg Manchow (₹89), Hot & Sour Chicken (₹89), MK Spl Chicken Soup (₹99) |
| **Shakes & Beverages** | Thickshakes, Milkshakes, Lassi | 35 | Oreo Thickshake (₹149), Vanilla Milkshake (₹59), Badam Milk (₹69), Sweet Lassi (₹49), Rose Milk (₹59) |
| **Mocktails** | Mojitos & Lemonades | 17 | Mint Mojito (₹59), Virgin Mojito (₹59), Blue Curacao (₹69), Pina Colada (₹99), Sweet Lemonade (₹59) |
| **Juices & Salads** | Fresh Juices & Fruit Salads | 10 | Apple Juice (₹69), Watermelon Juice (₹69), Custard Fruit Salad (₹79), MK Spl Fruit Salad (₹99) |
| **Desserts & Falooda** | Faloodas | 4 | Classic Falooda (₹69), Mango Dreams (₹79), Kesar Pista Falooda (₹99), MK Spl Falooda (₹109) |
| **French Fries** | Crispy Fries | 3 | French Fries Salted (₹89), Masala Fries (₹99), Peri Peri Fries (₹109) |
| **TOTAL** | **17 Categories** | **240 Items** | **130 Veg • 92 Non-Veg • 18 Egg** |

---

## 3. Technology Stack & Offline-First Design

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS, Lucide React (embedded local vector icons).
- **Backend:** Node.js v24, Express, built-in native `node:sqlite` database engine (pure C++ speed without native compilation toolchain hurdles on Windows).
- **Database:** Local SQLite database file stored at `server/data/sree_mk_menu.db`.
- **PWA & Caching:** Web App Manifest and Service Worker with Cache-First static asset strategy + Network-First API sync.
- **Dynamic QR Code:** Auto-detects the restaurant laptop's Wi-Fi IPv4 address on startup and encodes `http://<laptop-ip>:3001/`.
- **Admin Security:** Local administrative login protected with `bcryptjs` password hashing and signed JWT session tokens with rate-limiting protection.
- **Zero External Dependencies:** Zero external font requests (Google Fonts removed in favor of system font stack), zero external CDN stylesheets, scripts, or analytics.

---

## 4. Setup & Deployment Guide for Windows

### Step 1: Install Node.js
Ensure Node.js (v20+ or v24+) is installed. Verify in Windows PowerShell:
```powershell
node -v
npm -v
```

### Step 2: Open Project Directory
```powershell
cd "c:\Users\npava\OneDrive\Desktop\SREE MK FOOD COURT"
```

### Step 3: Install Dependencies
```powershell
npm run install:all
```

### Step 4: Seed Menu Database
This imports all 240 items and 17 categories into the local SQLite database:
```powershell
npm run seed
```

### Step 5: Build Production Client
Builds the bundled static frontend with PWA service worker and pre-cached assets into `client/dist`:
```powershell
npm run build
```

### Step 6: Configure Windows Firewall (Run Once)
To allow smartphones on the local Wi-Fi router to reach the menu server on port 3001, open PowerShell as **Administrator** and run:
```powershell
New-NetFirewallRule -DisplayName "Sree MK Food Court Offline Menu" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Profile Private
```
*(Or double-click `scripts\setup-windows-firewall.ps1`)*

### Step 7: Launch the Server
```powershell
npm start
```
*(Or double-click `scripts\start-restaurant-server.bat`)*

Upon startup, the console displays:
```
=============================================================
🍽️   SREE MK FOOD COURT — OFFLINE RESTAURANT MENU SERVER
=============================================================
⚡  Local URL (this laptop):       http://localhost:3001/
📱  Mobile URL (local Wi-Fi QR):    http://192.168.29.252:3001/
🔐  Admin Dashboard:                http://192.168.29.252:3001/admin
-------------------------------------------------------------
Available Local IPv4 Network Interfaces:
   - [Wi-Fi] http://192.168.29.252:3001/
=============================================================
```

---

## 5. Local Wi-Fi Hardware Setup (Completely Offline)

```
       +------------------------------------+
       |   Offline Restaurant Wi-Fi Router  |
       |  (NO INTERNET / DSL CABLE NEEDED)   |
       +-----------------+------------------+
                         |
           +-------------+-------------+
           |                           |
+----------v----------+     +----------v----------+
|  Restaurant Laptop  |     | Customer Smartphone |
|  Node.js + SQLite   |     | Scans QR Stand      |
|  IP: 192.168.X.X    |     | Loads Menu in PWA   |
+---------------------+     +---------------------+
```

1. Power on any standard Wi-Fi router or access point.
2. Connect the restaurant laptop to the Wi-Fi router.
3. Start the server using `npm start` (or double-click `scripts\start-restaurant-server.bat`).
4. Note the laptop IPv4 address printed on the screen (e.g. `http://192.168.1.150:3001/`).
5. In the Admin Dashboard (`http://localhost:3001/admin`), open the **QR & Local Wi-Fi** tab and click **Print Table Stand Card**.
6. Print and place the QR code stands on dining tables.

---

## 6. Admin Panel User Guide

- **Access URL:** `http://localhost:3001/admin` (or click the shield icon in top navigation)
- **Initial Username:** `admin`
- **Initial Password:** `sreemk@2026`

### Admin Capabilities:
1. **Menu Item Management:**
   - Search across all items.
   - Filter by category and dietary type.
   - 1-click **Availability Toggle** (turns items to *Available* or *Unavailable* in real-time).
   - Edit item names, prices, categories, and descriptions.
   - Add new items with instant persistence in SQLite.
   - Delete items with confirmation protection.
2. **Category Management:**
   - Add new categories.
   - Customize category order and icons.
3. **Table QR Code Generator:**
   - View high-resolution QR code pointing to active local Wi-Fi IP address.
   - Print table stand card formatted with restaurant branding.
4. **Backup & Disaster Recovery:**
   - **Export Menu JSON:** Downloads a single portable JSON file containing all categories and items.
   - **Import Menu JSON:** Upload and restore the menu from any validated backup JSON.
   - **Download SQLite Database:** Direct download of `sree_mk_menu.db`.
5. **Security Settings:**
   - Change admin password securely (bcrypt encrypted).

---

## 7. Automated Test Suite Verification

Run the test suite at any time:
```powershell
npm test
```

### Verified Test Matrix (33 of 33 Passed):
- [x] **Test 1:** All 240 extracted items possess valid non-empty names, valid categories, positive prices, and standard dietary types.
- [x] **Test 2:** Search query and dietary filtering logic tested (130 Veg, 92 Non-Veg, 18 Egg items).
- [x] **Test 3 & 4:** SQLite CRUD operations tested. Data modifications survive process exit and server restart.
- [x] **Test 5:** Dynamic QR code generation outputs valid Base64 PNG and SVG formats.
- [x] **Test 6:** Progressive Web App (PWA) manifest, service worker shell pre-caching, and offline fallback page verified.
- [x] **Test 7:** Zero external CDN, Google Fonts, or online URL dependencies verified.
- [x] **Test 8:** Offline fallback data in client verified if network connection drops.
- [x] **Test 9:** JSON export and backup serialization verified.
- [x] **Test 10:** Admin authentication, bcrypt password matching, and JWT security verified.

---

## 8. Final Checklist for Offline Verification

To prove to yourself that the system operates without internet:
1. Disconnect the laptop from the internet (turn off mobile hotspot / unplug WAN ethernet).
2. Connect your laptop and phone to the same local Wi-Fi router (which has no internet).
3. Start the server: `npm start`.
4. On your phone, scan the table QR code or browse to `http://<laptop-ip>:3001/`.
5. Verify the menu loads completely with dark green branding, gold headings, and all 240 items.
6. Verify search, category filters, and card views work instantaneously.
7. Open the Admin Panel, mark an item *Unavailable*, and watch the customer menu update immediately.
8. Install as PWA by choosing **Add to Home Screen** on your smartphone.
