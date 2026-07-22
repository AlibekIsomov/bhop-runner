# Bhop Runner API Server

Backend server for **Bhop Runner** featuring Express.js, Google OAuth2 authentication, JWT tokens, IP Geolocation tracking, Admin Control Panel, and Challenge Nonce Anti-Cheat protection.

---

## 🚀 Getting Started (Local Run)

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   # Or with hot-reload development mode:
   npm run dev
   ```

By default, the server runs at `http://localhost:3000`.

---

## 🔑 Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. In **APIs & Services** -> **OAuth consent screen**, configure your application details.
3. In **Credentials** -> **Create Credentials** -> **OAuth client ID**:
   - Application type: `Web application`
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback` (or your domain e.g. `https://bh.yasuke.uz/auth/google/callback`)
4. Copy your **Client ID** and **Client Secret** into your `.env` file:
   ```env
   PORT=3000
   JWT_SECRET=super_secret_jwt_key
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_REDIRECT_URI=https://bh.yasuke.uz/auth/google/callback
   ```

---

## ⚡ Guest & Dev Testing Mode

If Google Cloud Client ID is not configured, players can log in as **Guest**. Entering a username issues a valid JWT token instantly so scores can be recorded and tracked on the global leaderboard.

---

## 🛡️ Anti-Cheat Security System

- **Single-Use Challenge Nonces**: `POST /api/scores/challenge` returns a one-time 15-second crypto nonce to eliminate replay attacks.
- **HMAC SHA-256 Signature Verification**: `POST /api/scores` verifies client signature using `HMAC_SHA256(token + nonce, score + duration + timestamp + nonce)`.
- **Speed Sanity Enforcement**: Validates platform rate limit (< 4.0 platforms/sec) and timestamp freshness.

---

## 📡 API Endpoints

### Public Endpoints
- `GET /api/health` — Health check endpoint.
- `GET /status` — HTML status page.
- `POST /auth/dev-login` — Guest login (`{"username": "Player1"}`).
- `GET /auth/google` — Initiate Google OAuth2 flow.
- `GET /auth/google/callback` — Google OAuth2 callback redirect.
- `GET /api/leaderboard?limit=50` — Get top leaderboard rankings with IP & City locations.

### Authenticated Player Endpoints
- `GET /auth/me` — Fetch current user profile & rank (Headers: `Authorization: Bearer <JWT>`).
- `POST /api/scores/challenge` — Request a single-use Anti-Cheat challenge nonce.
- `POST /api/scores` — Submit run score (`{"score": 37, "duration": 15.2, "timestamp": 17000000, "nonce": "...", "signature": "..."}`).

### Admin Endpoints (`aisomov.dev@gmail.com` strictly)
- `GET /api/admin/users` — Fetch all registered players, IP addresses, & City locations.
- `POST /api/admin/ban-user` — Ban/unban a user by `userId`.
- `DELETE /api/admin/my-score` — Delete current user's score.
- `DELETE /api/admin/reset-leaderboard` — Reset entire leaderboard database.
- `DELETE /api/admin/delete-user/:username` — Delete a specific user's score by username.

---

## 📄 License

Distributed under the [MIT License](../LICENSE).
