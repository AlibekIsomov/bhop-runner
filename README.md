# 🏃 Bhop Runner (`bhop_endless`)

**Bhop Runner** — CS2 (Source Engine) uslubidagi 3D Bunny Hop harakat mexanikasiga ega tezkor brauzer parkur o'yini. O'yinda Three.js yordamida 3D Karambit Fade pichoq va sport qo'lqoplari render qilinadi. Cheksiz va tasodifiy generatsiya bo'ladigan neon platformalardan yiqilmasdan iloji boricha uzoqroqqa sakrab o'tish va global reytingda birinchi o'rinni egallash asosiy maqsad hisoblanadi!

---

## 🖼️ Screenshots

| Gameplay | Global Leaderboard | Admin Dashboard |
| :---: | :---: | :---: |
| ![Gameplay](docs/screenshots/gameplay.png) | ![Leaderboard](docs/screenshots/leaderboard.png) | ![Admin Panel](docs/screenshots/admin.png) |

> 💡 *Note: Add screenshots into `docs/screenshots/` directory.*

---

## 🎮 Controls

| Key | Action |
| :--- | :--- |
| **`W` `A` `S` `D`** | Move (Ground only — let go of `W` in the air) |
| **`SPACE` (Hold)** | Auto Bunny-Hop on every landing |
| **`Mouse`** | Air-Strafe: hold `A` + turn left, or `D` + turn right to gain velocity |
| **`TAB` / `L`** | Open / Close Global Leaderboard |
| **`ESC`** | Open Pause Menu / Release mouse pointer |

---

## ✨ Key Features

- 🎯 **Authentic CS Movement**: Real Source-engine physics (gravity 800 u/s², jump 301.993, quake air-accelerate up to 1000+ u/s velocity).
- 🔪 **Three.js 3D Viewmodel**: Real 3D Karambit Fade knife & sport gloves FBX model rendered dynamically on WebGL overlay with sway, bob, and drop animations.
- 🔐 **Authentication Options**: Single-click **Google OAuth2** login or fast **Guest Login**.
- 🛡️ **Airtight Anti-Cheat System**:
  - **Single-Use Challenge Nonces** (`POST /api/scores/challenge`) to block replay attacks.
  - **HMAC SHA-256 Signature Verification** to block browser DevTools console tampering & Postman cheating.
  - **Speed-Rate Sanity Checks** (Max physical limit of 4.0 platforms/sec).
- 📍 **IP & Geolocation Tracking**: Automatically captures IP addresses and locates city & region (e.g. Tashkent, Samarkand, Fergana, etc.) for both Guest and Google players.
- ⚙️ **Admin Control Panel (`/admin.html`)**: Dedicated dashboard restricted strictly to Admin for managing players, IP locations, banning cheaters, and resetting scores.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5 Canvas2D + Three.js (WebGL 3D Viewmodel) + Vanilla CSS
- **Backend API**: Node.js + Express.js
- **Auth & Security**: Google OAuth2 + JWT + HMAC SHA-256 Challenge Nonce Anti-Cheat
- **Geolocation**: IP-API / Geolocation Service
- **Process Manager**: PM2 + Nginx Reverse Proxy

---

## 🚀 Local Setup & Run

### 1. Install & Start Backend Server
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start development server (Default: http://localhost:3000)
npm start
```

### 2. Open Game in Browser
Simply navigate to `http://localhost:3000` in your web browser!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
