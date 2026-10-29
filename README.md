Heto na ang kumpletong updated README.md.

Inalis ko na ang lahat ng nabanggit tungkol sa "APK" at pinalitan ito ng mga detalye tungkol sa PWA (Progressive Web App), kasama na ang bagong manifest-home.json setup. Naka-set na rin ang license year sa 2026.

I-overwrite mo lang ito sa README.md mo sa GitHub:

```markdown
# 🎤 VIDEoke YT

<div align="center">

**Modern multi-tenant YouTube-powered videoke (karaoke) system**

Guests scan a QR code, search or paste YouTube links, and songs play automatically on the host screen.
No downloads. No local files. 100% YouTube streaming.

[![Made with Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.17-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#-license)
[![Free](https://img.shields.io/badge/100%25-Free%20Forever-success)](#-100-free--no-fees-no-ads-forever)

Created with ❤️ by **Steve**

</div>

---

## 🎁 100% Free — No Fees, No Ads, Forever

**VIDEoke YT is completely free for everyone.** No signup, no subscription, no paywall, **no ads**, no hidden fees, no trackers. Anyone can start a karaoke party in 5 seconds — scan a QR, pick a song, sing. That's it.

- ✅ **No account required**
- ✅ **No credit card**
- ✅ **No ads** — zero ad networks, zero sponsored content, zero popups
- ✅ **No tracking** — no Google Analytics, no Facebook Pixel, no cookies
- ✅ **No limits on parties**
- ✅ **Open source (MIT)** — fork it, self-host it, do whatever you want
- ✅ **Any device** — phone, tablet, laptop, smart TV
- ✅ **Installable (PWA)** — add to home screen on Android and iOS

If this app made your karaoke night better and you'd like to say thank you, you're welcome to send a small tip via **GCash**, **Maya**, or **PalawanPay**. **It's totally optional** — VIDEoke YT will always be free.

<div align="center">

<table>
  <tr>
    <td align="center" width="33%">
      <img src="./frontend/support-qr-gcash.png" alt="GCash QR" width="180" /><br>
      <b>💙 GCash</b>
    </td>
    <td align="center" width="33%">
      <img src="./frontend/support-qr-maya.png" alt="Maya QR" width="180" /><br>
      <b>💚 Maya</b>
    </td>
    <td align="center" width="33%">
      <img src="./frontend/support-qr-palawanpay.png" alt="PalawanPay QR" width="180" /><br>
      <b>💜 PalawanPay</b>
    </td>
  </tr>
</table>

**📱 Scan any QR with your phone camera**

💝 *Every tip keeps the servers running. Thank you!* 🙏

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Security](#security)
- [Changelog](#changelog)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Support the Developer](#support-the-developer)
- [License](#license)
- [Credits](#credits)

---

<a id="overview"></a>
## 🎯 Overview

**VIDEoke YT** turns any TV or laptop into a full karaoke machine powered entirely by YouTube. Guests join with a 6-character party code or QR scan, browse the karaoke catalog, and reserve songs from their phones. The host screen plays them back-to-back, auto-skips broken videos, and announces each singer with an AI voice.

The system is **multi-tenant** — a single backend can host up to **300 simultaneous parties**, each with its own isolated queue, playlist, and admin controls. Perfect for:

- 🏠 House parties
- 🍺 Bar / resto videoke nights
- 🎉 Events and celebrations
- 🎂 Birthdays, weddings, reunions
- 💼 Company events

---

<a id="features"></a>
## ✨ Features

### 💝 Free Forever

- **100% free** — no fees, no ads, no paywall, no subscriptions
- **No signup, no login** — scan a QR, pick a song, sing
- **Anyone can use it** — any phone, any TV, anywhere
- **Optional tips** — GCash, Maya, and PalawanPay QR codes on the landing page
- **Open source** — MIT licensed, self-host or fork freely
- **No data collection** — no analytics trackers, no cookies, no user profiles

### 📲 Installable PWA (No APK needed)

- **Install to Home Screen** — native app experience on Android and iOS
- **Separate manifests** — Home and Remote pages install as distinct apps
- **Always updated** — runs entirely in the browser, no need to download new files
- **Safe & secure** — no APK warnings; passes all PWA validation criteria

### 📖 FAQ Page

- **Dedicated `/faq` page** — clean, styled, mobile-friendly
- **Bilingual** — English and Tagalog toggle for better understanding
- **Accessible from** — landing page footer, remote header (❓ Help button), host idle screen
- **Covers** — getting started, remote controls, privacy, troubleshooting, advanced tips

### 🏢 Multi-Tenant Architecture

- **300 concurrent parties** per backend instance
- **Auto-generated credentials** — every party gets a unique Host Code, Party Code, and Admin Password
- **24-hour party TTL** — sessions auto-expire; perfect for a whole night
- **Session recovery** — queue and history persist to disk; survives server restarts (with persistent storage)
- **Isolated state** — one party's queue can never leak into another's

### 📊 Live Stats

- **Landing-page stats bar** — shows 🟢 online · 🎉 active parties · 👥 unique visitors
- **Auto-refreshes every 15 seconds**
- **`/api/stats` endpoint** — public JSON with `onlineVisitors`, `totalVisitors`, `activeParties`, `peakOnlineAllTime`, etc.

### 🎵 Host Screen (TV / PC / Laptop)

- **Auto-play** — as soon as a song is added, it starts
- **Auto-skip (Watchdog)** — deleted, blocked, or restricted videos are skipped automatically within 10 seconds
- **Floating Mini-Player** — tap the minimize button to keep the video playing in the corner while showing the QR code and queue behind it
- **AI Voice Announcer** — TTS announces "Next up, Juan, singing Tadhana by Moira"
- **Smart HUD fade** — "Now Singing" and "Reserved" boxes fade to 55% after 5 seconds so lyrics stay visible
- **Always-visible mini QR** — small QR + party code at the bottom-left
- **Duet support** — announces "singing the boy part" / "girl part"
- **Keyboard shortcuts** — `P` pause/play, `S` skip, `F` fullscreen, `M` minimize

### 📱 Remote Controller (Mobile)

- **Prominent Help Button** — Blue ❓ Help button on Remote header + inline link under the name.
- **Change Party Code** — Easily switch to a different party via the header or the red button in the share section.
- **Search or paste** — paste a YouTube link, or use our ultra-fast parallel search.
- **Lightning-fast Search** — `Promise.any` fetches from multiple Piped instances simultaneously and returns the first successful result.
- **Dynamic Recommendations** — refreshes every 15 minutes with fresh, trending karaoke searches.
- **Karaoke-only search** — strict filtering: rejects official music videos, concerts, live performances.
- **Voice search** — speak a song title to search hands-free.
- **Duet detection** — automatically detects duets and asks "Boy Part or Girl Part?"
- **Guest auto-naming** — no name? Automatically "Guest 123" (stable per device).

### 🔒 Security

- **Admin-locked controls** — pause, skip, stop, and volume are locked by default
- **Admin password** — 8-character password per party, required to unlock controls
- **Auto-lock** — controls re-lock after 10 minutes of inactivity
- **Per-party tokens** — an admin token from party A cannot control party B
- **Encrypted at rest** — admin passwords stored with AES-256-GCM
- **Rate limits** — session creation, search, yt-info, admin login, host-verify, party-verify all rate-limited
- **XSS-safe rendering** — all user content rendered with `textContent`-safe patterns and `data-*` attributes

---

<a id="architecture"></a>
## 🏗️ Architecture

```

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│   📱 Guest       │         │   📺 Host        │         │   🖥️  Backend    │
│   (Mobile)       │◄───────►│   (TV/Laptop)    │◄───────►│   (Node.js)      │
│                  │  Socket │                  │  Socket │                  │
│   remote.html    │   .IO   │   host.html      │   .IO   │   Express +      │
│   Vercel CDN     │         │   Vercel CDN     │         │   Socket.IO      │
│                  │         │                  │         │   Render         │
└──────────────────┘         └──────────────────┘         └──────────────────┘
│                            │                            │
│                            │                            │
└────────────── REST ────────┴─────── Socket.IO ──────────┘
(state sync, search, admin, stats, FAQ)

```

**Data flow:**

1. Host opens `host.html` → verifies host code → registers as `host` role
2. Guests join `remote.html` with party code → register as `guest` role
3. Guest reserves a song → Socket.IO event → backend adds to queue → broadcasts state
4. Host receives `command: play` → loads video in YouTube iframe
5. Video ends or fails → host emits `songEnded` / `videoFailed` → backend pops next from queue
6. Admin unlocks controls with password → receives token → can now skip/stop/manage
7. Landing page polls `/api/stats` every 15s → shows live online/party/visitor counts
8. Any page → click ❓ or FAQ link → opens `/faq` page

---

<a id="tech-stack"></a>
## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Runtime** | Node.js ≥ 18.17 | ES modules, native `fetch`, `AbortSignal.timeout` |
| **Web Framework** | Express 4 | REST API |
| **Realtime** | Socket.IO 4 | Bidirectional events |
| **Video Embed** | YouTube IFrame API | Video playback |
| **Search** | Piped API (Parallel) + YouTube Data API | Karaoke catalog |
| **Frontend** | Vanilla HTML/CSS/JS | Zero build step |
| **PWA** | Service Worker + Manifest | Installable app |
| **Auth** | Custom token + SHA-256 + AES-256-GCM | Admin security |
| **FAQ** | Static HTML + native `<details>` | Zero-JS accordion |
| **Deploy: Backend** | Render | Free tier compatible |
| **Deploy: Frontend** | Vercel | Edge CDN |

---

<a id="prerequisites"></a>
## 📋 Prerequisites

- **Node.js ≥ 18.17.0** (uses native `fetch` and `AbortSignal.timeout`)
- **npm** (or `yarn` / `pnpm`)
- **Git**
- A **Render** account (free) for backend hosting
- A **Vercel** account (free) for frontend hosting
- (Optional) **YouTube Data API key** — for fallback search when Piped is down

---

<a id="local-development"></a>
## 💻 Local Development

### 1. Clone and install

```bash
git clone https://github.com/your-username/videoke.git
cd videoke/backend
npm install
```

2. Start the backend

```bash
npm start
```

You should see:

```
🎤 Videoke backend listening on :3000
```

3. Serve the frontend

The frontend files must be served over HTTP (not file://). The simplest option:

```bash
cd ../frontend
npx serve . -p 5173
```

4. Update config.js

Edit frontend/config.js to point at your local backend:

```js
window.VIDEOKE_CONFIG = {
  BACKEND_URL: 'http://localhost:3000',
  RECONNECT_ATTEMPTS: 10,
  RECONNECT_DELAY: 1500,
  DEBUG: true,
};
```

5. Open the app

URL Purpose
http://localhost:5173/ Start / join party + live stats + FAQ button
http://localhost:5173/faq FAQ & About page (English / Tagalog)
http://localhost:5173/host Host display
http://localhost:5173/remote?party=XXXXXX Guest remote

---

<a id="deployment"></a>

🚀 Deployment

Backend → Render

1. Push your project to GitHub.
2. Go to Render Dashboard → New → Web Service.
3. Connect your repository.
4. Configure:
   Field Value
   Name videoke-backend
   Region Singapore (closest to PH)
   Branch main
   Root Directory backend
   Runtime Node
   Build Command npm install
   Start Command npm start
   Plan Free
5. Environment variables:
   Key Value
   FRONTEND_URL https://your-vercel-app.vercel.app
   YOUTUBE_API_KEY (optional, recommended for search fallback)
   ADMIN_SECRET (optional, recommended)
6. Click Create Web Service. Wait ~2 minutes for the first deploy.
7. Copy the deployed URL — e.g. https://videoke-backend.onrender.com.

Frontend → Vercel

1. Go to Vercel Dashboard → Add New → Project.
2. Import the same GitHub repository.
3. Configure:
   Field Value
   Framework Preset Other
   Root Directory frontend
   Build Command (leave blank)
   Output Directory (leave blank)
4. Click Deploy. Wait ~30 seconds.
5. Copy your Vercel URL — e.g. https://videoke.vercel.app.

Connect the two

1. Update frontend/config.js with your Render URL:
   ```js
   window.VIDEOKE_CONFIG = {
     BACKEND_URL: 'https://videoke-backend.onrender.com',
   };
   ```
2. Commit and push — Vercel auto-redeploys.
3. Update Render — change FRONTEND_URL to your Vercel URL → Save.
4. Test the full flow:
   ```
   https://your-vercel-app.vercel.app/        → check stats + FAQ button
   https://your-vercel-app.vercel.app/faq     → FAQ page
   https://your-vercel-app.vercel.app/host    → host screen
   https://your-vercel-app.vercel.app/remote?party=XXXXXX  → guest remote
   ```

Support QR images (optional)

To display tip QR codes on the landing page and FAQ:

1. Save your GCash receive QR screenshot as frontend/support-qr-gcash.png
2. Save your Maya receive QR screenshot as frontend/support-qr-maya.png
3. Save your PalawanPay QR screenshot as frontend/support-qr-palawanpay.png
4. Any missing file hides gracefully — you can include just 1, 2, or all 3.

---

<a id="environment-variables"></a>

🔧 Environment Variables

Variable Required Default Description
PORT No 3000 HTTP port
DATA_DIR No ./data Directory for sessions.json and .secret
FRONTEND_URL Yes (prod) * Frontend origin(s) for CORS
YOUTUBE_API_KEY No — YouTube Data API fallback
ADMIN_SECRET No — Key for encrypting stored admin passwords

---

<a id="project-structure"></a>

📂 Project Structure

```
videoke/
├── backend/                  # Backend folder
│   ├── server.js             # Node.js backend (Express + Socket.IO)
│   └── package.json          # Backend dependencies
├── frontend/                 # Frontend folder
│   ├── index.html            # Landing page — start / join + stats + FAQ button
│   ├── faq.html              # FAQ & About page (English / Tagalog)
│   ├── host.html             # TV/laptop display
│   ├── remote.html           # Mobile guest controller
│   ├── config.js             # Backend URL (edit after deploy)
│   ├── i18n.js               # English-only translations
│   ├── manifest.json         # PWA manifest (Remote)
│   ├── manifest-home.json    # PWA manifest (Home)
│   ├── service-worker.js     # Cache-busting SW
│   ├── vercel.json           # Frontend routing rules
│   ├── preview.jpg           # Facebook Messenger link preview
│   ├── icon-192.png          # PWA Icon
│   ├── icon-512.png          # PWA Icon
│   ├── support-qr-gcash.png      # GCash tip QR
│   ├── support-qr-maya.png       # Maya tip QR
│   └── support-qr-palawanpay.png # PalawanPay tip QR
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

---

<a id="api-reference"></a>

📡 API Reference

Base URL: https://videoke-backend.onrender.com

Health & Stats

Method Path Description
GET / Status + session count
GET /health Uptime check
GET /api/stats Live stats

Sessions

Method Path Description
POST /api/session/create Create a new party
GET /api/host/verify?host=CODE Verify host code, get token
GET /api/verify-party?code=CODE Check party code validity
GET /api/party?party=CODE Party status

Search & Content

Method Path Description
GET /api/search?q=QUERY&filter=karaoke Ultra-fast parallel search
GET /api/recommend Dynamic trending karaoke
GET /api/yt-info/:videoId Fetch YouTube title/author
GET /api/history?party=CODE Party's play history
GET /api/favorites?party=CODE Party's favorites

Admin

All admin endpoints require header X-Admin-Token: <token>.

Method Path Description
POST /api/admin/login Login with password
POST /api/admin/ping Verify token still valid
POST /api/admin/logout Invalidate token
POST /api/admin/stop Stop current song
POST /api/admin/end-party End the party
POST /api/admin/kick-all Disconnect all guests

---

<a id="security"></a>

🔒 Security

Threat Model

VIDEoke is designed for friendly parties, not high-security environments. However, we defend against:

· Accidental abuse — rate limits prevent accidental DoS
· Casual snooping — admin password protects controls
· Cross-party leaks — tokens scoped to a single party
· XSS — all user content escaped
· Session hijacking — 24-byte random hex tokens
· Code enumeration — verify endpoints are rate-limited
· Memory leaks — expired tokens evicted hourly

Rate Limits (per IP)

Endpoint Limit
/api/session/create 5 / min
/api/host/verify 30 / min
/api/verify-party 60 / min
/api/party 60 / min
/api/yt-info 30 / min
/api/search 40 / min
/api/admin/login 10 / min

What's NOT in the code (privacy)

· ❌ No ad networks — zero ad scripts
· ❌ No analytics — no Google Analytics, no Facebook Pixel
· ❌ No tracking pixels
· ❌ No cookies — only localStorage for singer name and admin token
· ❌ No user accounts — no email, no password, no PII collected

---

<a id="changelog"></a>

📝 Changelog

v3.8 — PWA First & Search Speed

· 🚀 Ultra-fast Search — Parallel API fetching (Promise.any), drops search time from 30s to ~2s.
· 🆕 Floating Mini-Player — Host screen can minimize video to a corner overlay while keeping audio playing.
· 🆕 3 tip QR codes — GCash · Maya · PalawanPay side by side.
· 🆕 Prominent Help Button — Blue ❓ Help button on Remote header + inline link.
· 🆕 Change Party Code — Easily switch to a different party via the header or share section.
· 🆕 PWA Installable — Dedicated manifest for Home and Remote pages, plus a visible "Install App" button.
· 🗑️ Removed APK Download — Fully transitioned to PWA for safety, auto-updates, and cross-platform compatibility (iOS/Android).
· 🐛 FIX — Auto-skip watchdog timer ensures broken/restricted videos never stall the queue.
· 🐛 FIX — service-worker.js reload loop fixed.
· 🐛 FIX — Admin passwords survive server restarts.
· 📄 License year updated to 2026.

---

<a id="troubleshooting"></a>

🐛 Troubleshooting

Backend won't start

Error: Cannot find module 'express'
→ Run npm install inside the backend folder.

Frontend can't reach backend

"❌ Failed to create session"
→ Check config.js backend URL, ensure Render is awake, and check CORS.

Stats bar shows "—"

→ /api/stats failed. Backend might be sleeping (Render free tier).

FAQ page shows blank / 404

→ Confirm faq.html is deployed. Confirm vercel.json includes the /faq rewrite.

Support QR not showing

→ Check the filenames in your frontend folder. They must be exactly:

· support-qr-gcash.png
· support-qr-maya.png
· support-qr-palawanpay.png

Videos won't play or stuck on "Video Unavailable"

→ The watchdog timer will auto-skip restricted videos within 10 seconds. Ensure your backend is updated to v3.7+.

Admin login fails

"Wrong password" — Case-sensitive; copy-paste directly.

"Install App" button not showing

→ Confirm manifest-home.json exists in the frontend folder. Ensure your site is loaded over HTTPS (Vercel does this automatically). If testing locally, use localhost.

---

<a id="faq"></a>

❓ FAQ

Q: Is VIDEoke YT really free?
A: Yes — 100% free, forever. No fees, no ads, no signup, no paywall.

Q: Are there ads?
A: No. Zero ad networks, zero sponsored content. The only ads are if a specific YouTube video's uploader enabled them.

Q: Do you collect my data?
A: No. Only localStorage for singer name and admin token on your device.

Q: Do I need an Admin Password to request a song?
A: No. Anyone can reserve a song. The Admin Password is only needed to Pause, Skip, Stop, or move/delete songs.

Q: Can I use the app in the background (e.g., while on Messenger)?
A: Browsers automatically pause video playback when you switch apps to save battery. You can use Android's Split Screen feature to keep the video playing while chatting. True background play requires a native app wrapper (not included).

---

<a id="contributing"></a>

🤝 Contributing

1. Fork the repo
2. Create a branch: git checkout -b feature/my-feature
3. Make your changes
4. Test locally
5. Commit: git commit -m "Add my feature"
6. Push: git push origin feature/my-feature
7. Open a Pull Request

---

<a id="support-the-developer"></a>

💝 Support the Developer

VIDEoke YT is built and maintained by Steve as a free gift to the karaoke-loving community.

No fees. No ads. No paywall. No signup. Forever.

<div align="center">

<table>
  <tr>
    <td align="center">
      <img src="./frontend/support-qr-gcash.png" alt="GCash QR" width="160" /><br>
      <b>💙 GCash</b>
    </td>
    <td align="center">
      <img src="./frontend/support-qr-maya.png" alt="Maya QR" width="160" /><br>
      <b>💚 Maya</b>
    </td>
    <td align="center">
      <img src="./frontend/support-qr-palawanpay.png" alt="PalawanPay QR" width="160" /><br>
      <b>💜 PalawanPay</b>
    </td>
  </tr>
</table>

📱 Scan any QR with your phone camera

💝 Every tip — no matter how small — keeps the servers running and the songs playing.

</div>

Thank you! 🙏🎶

---

<a id="license"></a>

📄 License

```
MIT License

Copyright (c) 2026 Steve

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<a id="credits"></a>

🙏 Credits

· Created by: Steve
· Karaoke catalog: Powered by Piped and the YouTube Data API
· Video playback: YouTube IFrame Player API
· QR codes: QR Server
· Voice announcements: Web Speech API
· Hosting: Render (backend) + Vercel (frontend)

---

<div align="center">

🎤 Happy singing! 🎶

Made with ❤️ by Steve

⭐ Star this repo if it helped your party

🎉 100% free · No ads · No trackers · Forever

</div>
```