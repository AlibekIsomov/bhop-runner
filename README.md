# 🏃 Bhop Runner

**Bhop Runner** — Godot 4 dvigatelida yaratilgan 3D Bunny Hop harakat mexanikasiga ega tezkor parkur o'yini. O'yinda platformalardan yiqilmasdan iloji boricha uzoqroqqa sakrab o'tish va global reytingda birinchi o'rinni egallash asosiy maqsad hisoblanadi!

---

## 🖼️ O'yin lavhalari (Screenshots)

| Gameplay (O'yin jarayoni) | Global Leaderboard (Rekordlar) |
| :---: | :---: |
| ![Gameplay Screenshot](docs/screenshots/gameplay.png) | ![Leaderboard Screenshot](docs/screenshots/leaderboard.png) |

> 💡 *Eslatma: O'yin rasmlarini `docs/screenshots/gameplay.png` va `docs/screenshots/leaderboard.png` manzillariga joylashtirishingiz mumkin.*

---

## 🎮 Boshqaruv tugmalari (Controls)

| Tugma | Harakat / Vazifasi |
| :--- | :--- |
| **`W` `A` `S` `D`** | Yo'nalish bo'ylab harakatlanish / Air Strafe |
| **`SPACE` (Probel)** | Sakrash (Bunny Hop uchun ketma-ket bosing) |
| **`L`** yoki **`TAB`** | Global Leaderboard (Rekordlar) oynasini ochish / yopish |
| **`ESC`** | Sichqoncha kursorini ozod qilish / Pause |

---

## ✨ Asosiy xususiyatlari

- 🎯 **Bunny Hop Mexanikasi**: Tezlikni saqlab qolish va havodan harakatlanish (Air Strafe) tizimi.
- 🛣️ **Procedural Yo'lakcha**: Har safar o'yinga kirganda cheksiz va tasodifiy generatsiya bo'luvchi yo'laklar.
- 🔐 **OAuth2 Avtorizatsiya**: Google akkaunt orqali bir bosishda kirish yoki Test Kirish (Dev Login).
- 🏆 **Global Leaderboard**: Barcha o'yinchilarning natijalari onlayn serverda saqlanadi va real vaqtda yangilanadi.
- 💾 **Offline & Online Saqlash**: Internet bo'lmaganda ham lokal natijangiz saqlanib qoladi.

---

## 🛠️ Texnologik Stek (Tech Stack)

- **Game Engine**: Godot 4.x (GDScript)
- **Backend API**: Node.js + Express.js
- **Auth**: Google OAuth2 + JWT (JSON Web Token)
- **Database**: File-backed JSON DB / SQLite

---

## 🚀 Ishga Tushirish Ko'rsatmasi

### 1. Backend Serverni Ishga Tushirish
O'yinning rekordlar serverini ishga tushirish uchun:

```bash
# Server papkasiga o'ting
cd server

# Kutubxonalarni o'rnating
npm install

# Serverni yurgizish (Default: http://localhost:3000)
npm start
```

### 2. O'yinni Yurgizish (Godot 4)
1. [Godot 4 Engine](https://godotengine.org/) dasturini oching.
2. `Import` tugmasini bosib, `d:/my-own/bhop-runner/project.godot` faylini tanlang.
3. **F5** tugmasini bosing va o'yindan rohatlaning!

---

## 📝 Litsenziya

Ushbu loyiha ochiq kodli hisoblanadi va shaxsiy yoki ta'lim maqsadlarida foydalanish uchun ochiq.
