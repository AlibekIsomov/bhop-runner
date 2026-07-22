# Bhop Runner Backend (Node.js + OAuth2 + Leaderboard)

Godot 4 "Bhop Runner" o'yini uchun tayyorlangan backend server.

## 🚀 Ishga tushirish (Local Run)

1. Server papkasiga o'ting:
   ```bash
   cd server
   ```

2. Kutubxonalarni o'rnating:
   ```bash
   npm install
   ```

3. Serverni ishga tushiring:
   ```bash
   npm start
   # Yoki avto-qayta yuklanish bilan:
   npm run dev
   ```

Server default holda `http://localhost:3000` portida ishlaydi.

---

## 🔑 Google OAuth2 Sozlash (Google bilan kirish uchun)

1. [Google Cloud Console](https://console.cloud.google.com/) ga kiring va yangi loyiha yarating.
2. **APIs & Services** -> **OAuth consent screen** bo'limida foydalanuvchi turini tanlang va saqlang.
3. **Credentials** -> **Create Credentials** -> **OAuth client ID** tugmasini bosing:
   - Application type: `Web application`
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
4. Berilgan **Client ID** va **Client Secret** ni `.env` fayliga yozing:
   ```env
   PORT=3000
   JWT_SECRET=bhop_runner_super_secret_jwt_key
   GOOGLE_CLIENT_ID=512345678901-xxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxx
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   ```

---

## ⚡ Qulaylik: Dev/Test Kirish (Google ID talab qilinmaydi)

Loyihada Google Cloud sozlamalarisiz ham darhol test qilish uchun **Test Kirish (Dev Login)** qo'shilgan.
O'yin ichida ismingizni kiritib "Test Kirish" tugmasini bossangiz, server darhol JWT token beradi va rekordlaringiz bazaga saqlana boshlaydi.

---

## 📡 API Endpoints

- `GET /api/health` - Server holatini tekshirish
- `POST /auth/dev-login` - Test login (`{"username": "Player1"}`)
- `GET /auth/google` - Google OAuth avtorizatsiyani boshlash
- `GET /auth/google/callback` - OAuth callback va JWT qaytarish
- `GET /auth/me` - Hozirgi foydalanuvchi va uning o'rni (Headers: `Authorization: Bearer <JWT>`)
- `GET /api/leaderboard?limit=50` - Top 50 rekordlar ro'yxati
- `POST /api/scores` - Natija yuborish (`{"score": 125.4}`, Headers: `Authorization: Bearer <JWT>`)
