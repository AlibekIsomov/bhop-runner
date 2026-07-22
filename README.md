# 🏃 Bhop Runner (`bhop_endless`)

**Bhop Runner** is a fast-paced 3D Counter-Strike style Bunny Hop browser parkour game powered by HTML5 and Three.js. It features real Source-Engine physics, a procedurally generated infinite neon platform course, and an interactive 3D Karambit Fade viewmodel with sport gloves.

Players jump across platforms, maintain air-velocity via air-strafing, and compete for top ranks on the global leaderboard!

---

## 🖼️ Game Screenshots

| Gameplay | Global Leaderboard | Admin Control Panel |
| :---: | :---: | :---: |
| ![Gameplay](docs/screenshots/gameplay.png) | ![Leaderboard](docs/screenshots/leaderboard.png) | ![Admin Panel](docs/screenshots/admin.png) |

> 💡 *Note: You can place game screenshots in `docs/screenshots/`.*

---

## 🎮 Controls

| Key | Action |
| :--- | :--- |
| **`W` `A` `S` `D`** | Movement (Ground only — release `W` in air) |
| **`SPACE` (Hold)** | Auto Bunny-Hop on every platform landing |
| **`Mouse`** | Air-Strafe: hold `A` + turn left, or `D` + turn right to gain speed |
| **`TAB` / `L`** | Toggle Global Leaderboard overlay |
| **`ESC`** | Open Pause Menu / Release mouse pointer |

---

## ✨ Features

- 🎯 **Counter-Strike Movement Physics**: Source-engine physics (800 u/s² gravity, 301.993 jump velocity, Quake air-acceleration up to 1000+ u/s speed).
- 🔪 **Three.js 3D Viewmodel**: Real-time WebGL rendering of Karambit Fade knife & sport gloves FBX model with dynamic sway, bob, and drop animations.
- 🔐 **Authentication Options**: One-click **Google OAuth2** sign-in or instant **Guest Mode**.
- 🛡️ **Airtight Anti-Cheat Security**:
  - **Single-Use Challenge Nonces** (`POST /api/scores/challenge`) to eliminate replay attacks.
  - **HMAC SHA-256 Signature Validation** to prevent browser DevTools console tampering & HTTP client cheats.
  - **Speed Sanity Verification** (Maximum physical limit of 4.0 platforms/sec).
- 📍 **IP Geolocation & City Tracking**: Automatically tracks IP addresses and resolves cities & regions (e.g., Tashkent, Samarkand, Fergana, etc.) for both Guest and Google authenticated users.
- ⚙️ **Dedicated Admin Dashboard (`/admin.html`)**: Protected control panel for managing users, IP geolocation logs, banning cheaters, and resetting leaderboard scores.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5 Canvas2D + Three.js (WebGL 3D Viewmodel) + CSS3
- **Backend API**: Node.js + Express.js
- **Authentication**: Google OAuth2 + JWT + HMAC SHA-256 Anti-Cheat
- **Geolocation**: IP-API Service Integration
- **Deployment**: PM2 + Nginx Reverse Proxy

---

## 🚀 Quick Start & Installation

### 1. Install & Launch Server
```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Start Express server (Default: http://localhost:3000)
npm start
```

### 2. Play Game
Open `http://localhost:3000` in any modern web browser.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
