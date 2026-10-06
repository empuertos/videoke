# 🎤 VIDEoke — YouTube Karaoke System

Professional YouTube-based videoke system with online remote control, real-time queue, scoring, and smart TV support.

![Status](https://img.shields.io/badge/status-live-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)

---

## ✨ Features

### 🎬 Host Player (TV/Laptop)
- **Fullscreen YouTube player** — karaoke videos lang, walang music video
- **QR code auto-join** — i-scan lang ng bisita para maka-reserve
- **5-second countdown** bago mag-play ang bawat kanta
- **Now Singing overlay** — pangalan ng kakanta at title ng kanta
- **Live queue panel** — nakikita ang susunod na 8-10 kanta
- **Stats badge** — bilang ng singers, kanta sa queue, at total wait time
- **Particle effects** — confetti at fireworks para sa high scores
- **Voice announcement** — TTS na nagsasabi kung sino ang susunod
- **Smart TV support** — remote navigation, TV mode, simple mode

### 📱 Phone Remote
- **YouTube search** — karaoke-only results (walang music video)
- **HD filter** — 1080p/4K karaoke lang by default
- **Trusted channels** — auto-filter ang low-quality sources
- **Duration range** — 2:00 - 12:00 default
- **Advanced filters** — toggle sa settings
- **Real-time queue** — nakikita ang buong pila
- **Highlight sariling pangalan** — "IKAW" badge sa sariling entry
- **Estimated wait time** — ilang minuto pa bago ka kumanta
- **Singer stats** — bilang ng singers, kanta, at total wait
- **Playback controls** — Pause, Play, Skip, Stop, Volume
- **Scoring system** — vote 1-10 pagkatapos ng kanta
- **History & Leaderboard** — track ng lahat ng kumanta
- **Favorites** — i-save ang mga paboritong kanta
- **Recent searches** — shared sa lahat ng bisita
- **Trending** — pinaka-madalas i-reserve (session/today/all-time)
- **PWA installable** — i-install sa phone home screen
- **Offline UI** — naka-cache ang interface

### 🌐 Multi-language
- 🇵🇭 **Filipino** (default)
- 🇺🇸 **English**
- Toggle sa header ng remote

### 🔐 Admin Panel
- Force stop playback
- Kick all guests
- Clear history / recent / trending
- Password protected

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  VERCEL          │         │  RENDER          │
│  (Frontend)      │◄───────►│  (Backend)       │
│                  │   WSS   │                  │
│  host.html       │         │  server.js       │
│  remote.html     │         │  Socket.IO       │
│  i18n.js         │         │  Queue state     │
│  qrcode.min.js   │         │  JSON files      │
└─────────────────┘         └──────────────────┘
```

| Component | Platform | Purpose |
|-----------|----------|---------|
| **Frontend** | Vercel | Static files, CDN, fast worldwide |
| **Backend** | Render | Socket.IO, queue, scoring, persistence |

---

## 🚀 Deployment

### Prerequisites
- Node.js >= 18
- GitHub account
- Vercel account (free) — [vercel.com](https://vercel.com)
- Render account (free) — [render.com](https://render.com)

### Step 1: Clone the Repo

```bash
git clone https://github.com/YOUR_USERNAME/videoke.git
cd videoke
```

### Step 2: Deploy Backend sa Render

1. Pumunta sa [render.com](https://render.com) → **New +** → **Web Service**
2. Connect ang GitHub repo `empuertos/videoke`
3. Settings:
   - **Name:** `videoke`
   - **Root Directory:** `backend`
   - **Language:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `ADMIN_PASSWORD` | `sekreto123` (palitan mo) |
   | `FRONTEND_URL` | `https://your-app.vercel.app` (i-update pagkatapos) |
5. Click **Create Web Service**
6. Kopyahin ang URL — gaya ng `https://videoke.onrender.com`

### Step 3: I-update ang Config

I-edit ang `frontend/config.js`:

```js
window.VIDEOKE_CONFIG = {
  BACKEND_URL: 'https://videoke.onrender.com',  // ⬅️ PALITAN
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000
};
```

I-commit at push:

```bash
git add .
git commit -m "Update backend URL"
git push
```

### Step 4: Deploy Frontend sa Vercel

1. Pumunta sa [vercel.com](https://vercel.com) → **Add New...** → **Project**
2. Import ang GitHub repo
3. **⚠️ Importanteng Settings:**
   - **Framework Preset:** Other
   - **Root Directory:** `frontend` (⚠️ IMPORTANTE!)
   - **Build Command:** (iwanan blanko)
   - **Output Directory:** (iwanan blanko)
4. Click **Deploy**
5. Kopyahin ang URL — gaya ng `https://videoke-frontend.vercel.app`

### Step 5: I-update ang Render

Bumalik sa Render dashboard:
1. Tap `videoke` service
2. **Environment** tab
3. I-edit ang `FRONTEND_URL` sa Vercel URL mo
4. **Save Changes** → auto-redeploy

---

## 🎮 Paano Gamitin

### TV / Laptop (Host)

1. Buksan: `https://your-app.vercel.app/host.html`
2. Tap **"I-TAP PARA SIMULAN"** → mag-fullscreen
3. Lalabas ang **QR code** at idle screen
4. Hintayin ang mga bisita na mag-scan

### Phone (Remote)

1. I-scan ang QR code sa TV, o pumunta sa `https://your-app.vercel.app/remote.html`
2. Mag-type ng **pangalan**
3. Mag-search ng kanta:
   - **Search bar** — type ang title/artist (auto "karaoke" filter)
   - **O kaya i-paste ang YouTube link** — auto-detect
4. **Tap ang resulta** → napunta sa queue
5. Kapag tapos na ang kanta → **mag-vote 1-10**
6. Auto-next sa susunod

### Admin (optional)

1. Tap **⚙️** sa remote header
2. Login gamit ang `ADMIN_PASSWORD`
3. Options:
   - Force Stop
   - Kick All Guests
   - Clear History
   - Clear Recent / Trending

---

## 🎯 Filters

Default settings (HD karaoke only):

| Filter | Default | Purpose |
|--------|---------|---------|
| **HD Only** | ✅ ON | 1080p / 4K lang |
| **Trusted Channels** | ✅ ON | Auto-block Vevo, T-Series, etc. |
| **Duration** | 2:00 - 12:00 | Tanggalin ang clips at albums |

I-tap ang **⚙️ Advanced Filters** para i-adjust.

---

## 🌐 Language

| Language | Code |
|----------|------|
| 🇵🇭 Filipino | `fil` (default) |
| 🇺🇸 English | `en` |

**Paano palitan:**
- Tap ang **🌐 flag icon** sa header para mag-toggle
- O i-set sa console: `localStorage.setItem('videoke:lang', 'en')`

---

## 📁 Project Structure

```
videoke/
├── README.md
├── backend/                    ← Deploy sa RENDER
│   ├── package.json
│   ├── server.js
│   └── data/                   ← Auto-created
│       ├── history.json
│       ├── favorites.json
│       ├── recent-searches.json
│       └── trending.json
└── frontend/                   ← Deploy sa VERCEL
    ├── config.js               ← Backend URL
    ├── i18n.js                 ← Languages
    ├── manifest.json           ← PWA
    ├── service-worker.js       ← PWA cache
    ├── index.html              ← Redirect to remote
    ├── host.html               ← TV player
    ├── remote.html             ← Phone controller
    └── lib/
        └── qrcode.min.js
```

---

## ⚙️ Environment Variables

### Backend (Render)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `ADMIN_PASSWORD` | `admin123` | Admin login password |
| `FRONTEND_URL` | `*` | Vercel frontend URL (CORS) |
| `DATA_DIR` | `./data` | Data folder (optional) |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JS, HTML5, CSS3 |
| **Backend** | Node.js, Express, Socket.IO |
| **Search** | Invidious/Piped (community instances) |
| **Player** | YouTube IFrame API |
| **PWA** | Service Worker, Web App Manifest |
| **Deploy** | Vercel (frontend), Render (backend) |

---

## 📋 API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/health` | Uptime |
| `GET` | `/api/info` | Server info + URLs |
| `GET` | `/api/search?q=...` | Karaoke search |
| `GET` | `/api/yt-info/:videoId` | YouTube metadata |
| `GET` | `/api/history` | Play history |
| `GET` | `/api/leaderboard` | Top singers |
| `GET` | `/api/favorites` | User favorites |
| `GET` | `/api/trending` | Trending stats |
| `GET` | `/api/recent-searches` | Recent searches |

### Admin (require token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Get admin token |
| `POST` | `/api/admin/stop` | Force stop playback |
| `POST` | `/api/admin/kick-all` | Disconnect all guests |
| `POST` | `/api/admin/clear-history` | Clear song history |
| `POST` | `/api/admin/clear-recent` | Clear recent searches |
| `POST` | `/api/admin/clear-trending` | Clear trending stats |

---

## ⚠️ Notes

### Render Free Tier
- **Nag-sleep pagkatapos ng 15 min walang activity**
- Unang request pagkatapos ng sleep: **30-60 seconds**
- **Solution:** Gamitin ang [UptimeRobot](https://uptimerobot.com) para i-ping ang `/health` every 5 min

### Data Persistence
- Nasa `data/*.json` ang lahat ng state
- **Ephemeral** ang filesystem ng Render free tier — nawawala sa restart
- Para permanent: mag-upgrade sa paid plan na may **persistent disk**
- O gamitin ang external database (MongoDB, PostgreSQL, etc.)

### YouTube Embed
- **Legal** — ang pag-embed ay allowed ng YouTube ToS
- **Walang download** — metadata lang mula sa oEmbed
- **Vevo/music videos** — hindi pwedeng i-embed, auto-skip

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Hindi maka-connect** (red dot) | Check `config.js` na may tamang `BACKEND_URL` |
| **CORS errors** | I-update ang `FRONTEND_URL` sa Render env vars |
| **Walang search results** | Invidious/Piped instances down — subukan ibang query |
| **Hindi nag-play** | Browser autoplay policy — tap START muna |
| **Vevo error** | Normal — auto-skip sa susunod na kanta |
| **404 sa root URL** | Walang `index.html` — i-add o buksan `/remote.html` |
| **Render cold start** | Hintayin 30-60s o gumamit ng UptimeRobot |

---

## 🎯 Smart TV Support

Gumagana sa:

| TV | Browser | Status |
|----|---------|:---:|
| Samsung Tizen | Built-in | ✅ |
| LG webOS | Built-in | ✅ |
| Android TV | TV Bro | ✅ |
| Google TV | TV Bro | ✅ |
| Fire TV | Silk | ✅ |

**TV remote controls:**
- ⬆️⬇️⬅️➡️ — Navigation
- **OK / Enter** — Start / Confirm
- **Space** — Pause
- **N** — Skip
- **S** — Stop
- **L** — Toggle language

---

## 📜 License

MIT License — libre gamitin, baguhin, at i-distribute.

---

## 👨‍💻 Author

**empuertos**

- GitHub: [@empuertos](https://github.com/empuertos)

---

## 🙏 Credits

- **Invidious** / **Piped** — Free YouTube search API
- **YouTube IFrame API** — Karaoke playback
- **Socket.IO** — Real-time communication
- **Vercel** & **Render** — Free hosting

---

## 🎉 Enjoy!

Kung nagustuhan mo ang project na ito, i-star ⭐ ang repo at i-share sa mga kaibigan!

**Maligayang pagkanta! 🎤🎶✨**