# 🎤 VIDEoke YT

<div align="center">

**Modern multi-tenant YouTube-powered videoke (karaoke) system**

Guests scan a QR code, search or paste YouTube links, and songs play automatically on the host screen.
No downloads. No local files. 100% YouTube streaming.

[![Made with Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#-license)

Created with ❤️ by **Steve**

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [License](#-license)
- [Credits](#-credits)

---

## 🎯 Overview

**VIDEoke YT** turns any TV or laptop into a full karaoke machine powered entirely by YouTube. Guests join with a 6-character party code or QR scan, browse the karaoke catalog, and reserve songs from their phones. The host screen plays them back-to-back, auto-skips broken videos, and announces each singer with an AI voice.

The system is **multi-tenant** — a single backend can host up to **300 simultaneous parties**, each with its own isolated queue, playlist, and admin controls. Perfect for:

- 🏠 House parties
- 🍺 Bar / resto videoke nights
- 🎉 Events and celebrations
- 🎂 Birthdays, weddings, reunions
- 💼 Company events

---

## ✨ Features

### 🏢 Multi-Tenant Architecture

- **300 concurrent parties** per backend instance
- **Auto-generated credentials** — every party gets a unique Host Code, Party Code, and Admin Password
- **24-hour party TTL** — sessions auto-expire; perfect for a whole night
- **Session recovery** — queue and history persist to disk; survives server restarts (with persistent storage)
- **Isolated state** — one party's queue can never leak into another's

### 🎵 Host Screen (TV / PC / Laptop)

- **Auto-play** — as soon as a song is added, it starts
- **Auto-skip** — deleted, blocked, or non-embeddable YouTube videos are skipped instantly
- **AI Voice Announcer** — TTS announces "Next up, Juan, singing Tadhana by Moira"
- **Smart HUD fade** — "Now Singing" and "Reserved" boxes fade to 55% after 5 seconds so lyrics stay visible
- **Always-visible mini QR** — small QR + party code at the bottom-left, guests scan anytime
- **Reservation popups** — sleek slide-in notification when a new song is added
- **Hidden YouTube UI** — custom click-blocker hides all YouTube controls; only your host screen remains
- **Custom fullscreen** — fullscreen button with auto-attempt on first play
- **Duet support** — announces "singing the boy part" / "girl part"
- **Reserved queue** — horizontal scroll strip showing next 5 singers at the top

### 📱 Remote Controller (Mobile)

- **Search or paste** — two modes: paste a YouTube link, or search our karaoke-only catalog
- **Karaoke-only search** — strict filtering: rejects official music videos, concerts, live performances
- **Voice search** — speak a song title to search hands-free
- **Duet detection** — automatically detects duets and asks "Boy Part or Girl Part?"
- **Category chips** — OPM, Love Songs, Duets, Rock Ballads, Power Ballads, and more
- **Recommendations** — trending karaoke plays instantly, no typing needed
- **Native YouTube app** — deep-link button opens the app directly on Android/iOS
- **Load more** — paginated results; endless karaoke scrolling
- **Favorites** — one-tap save of favorite songs for later
- **History** — see what played earlier
- **Share party** — QR + link + native share sheet

### 🔒 Security

- **Admin-locked controls** — pause, skip, stop, and volume are locked by default
- **Admin password** — 8-character password per party, required to unlock controls
- **Auto-lock** — controls re-lock after 10 minutes of inactivity
- **Per-party tokens** — an admin token from party A cannot control party B
- **Encrypted at rest** — admin passwords stored with AES-256-GCM
- **Rate limits** — session creation, search, yt-info, and admin login all rate-limited
- **Per-user add limit** — max 5 songs/minute, max 5 songs in queue at once per singer
- **XSS-safe rendering** — all user content rendered with `textContent`-safe patterns and `data-*` attributes

### 🎨 UX Polish

- **Guest auto-naming** — no name? Automatically "Guest 123" (stable per device)
- **Progress-aware queue** — each entry shows estimated wait time
- **Connection status** — connected/disconnected dot in the header
- **Offline resilience** — socket auto-reconnects; state resyncs automatically
- **PWA-ready** — installable to home screen on Android and iOS
- **Bilingual** — English and Filipino UI (via the language toggle)

---

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
(state sync, search, admin)

```

**Data flow:**

1. Host opens `host.html` → verifies host code → registers as `host` role
2. Guests join `remote.html` with party code → register as `guest` role
3. Guest reserves a song → Socket.IO event → backend adds to queue → broadcasts state
4. Host receives `command: play` → loads video in YouTube iframe
5. Video ends → host emits `songEnded` → backend pops next from queue → broadcasts
6. Admin unlocks controls with password → receives token → can now skip/stop/manage

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Runtime** | Node.js ≥ 18 | ES modules, native `fetch` |
| **Web Framework** | Express 4 | REST API |
| **Realtime** | Socket.IO 4 | Bidirectional events |
| **Video Embed** | YouTube IFrame API | Video playback |
| **Search** | Piped API + YouTube Data API | Karaoke catalog |
| **Frontend** | Vanilla HTML/CSS/JS | Zero build step |
| **PWA** | Service Worker + Manifest | Installable app |
| **Auth** | Custom token + SHA-256 + AES-256-GCM | Admin security |
| **Deploy: Backend** | Render | Free tier compatible |
| **Deploy: Frontend** | Vercel | Edge CDN |

---

## 📋 Prerequisites

- **Node.js ≥ 18** (uses native `fetch` and `AbortSignal.timeout`)
- **npm** (or `yarn` / `pnpm`)
- **Git**
- A **Render** account (free) for backend hosting
- A **Vercel** account (free) for frontend hosting
- (Optional) **YouTube Data API key** — for fallback search when Piped is down

---

## 💻 Local Development

### 1. Clone and install

```bash
git clone https://github.com/your-username/videoke.git
cd videoke
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

The frontend files must be served over HTTP (not file://). The simplest option is a static server:

```bash
npx serve . -p 5173
```

Or if you want to test the PWA service worker, use a proper local server:

```bash
npx http-server . -p 5173 --cors -c-1
```

4. Update config.js

Edit config.js to point at your local backend:

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
http://localhost:5173/ Start / join party
http://localhost:5173/host Host display
http://localhost:5173/remote?party=XXXXXX Guest remote

6. Test locally

1. Open http://localhost:5173/
2. Click Start New Karaoke → note the party code and admin password
3. Click Open Host Screen → tap anywhere to enable autoplay
4. On a second browser tab (or phone): http://localhost:5173/remote?party=XXXXXX
5. Search "adele karaoke" → reserve a song → it should play on the host tab

---

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
   Root Directory (leave blank)
   Runtime Node
   Build Command npm install
   Start Command npm start
   Plan Free
5. Environment variables (scroll down → Add Environment Variable):
   Key Value
   FRONTEND_URL https://your-vercel-app.vercel.app
   YOUTUBE_API_KEY (optional)
   ADMIN_SECRET (optional, recommended — see Security)
6. Click Create Web Service. Wait ~2 minutes for the first deploy.
7. Copy the deployed URL — e.g. https://videoke-backend.onrender.com.

Free tier note: Render free services sleep after 15 min of inactivity. First request after sleep takes ~30s. Consider upgrading to a paid plan or pinging /health every 10 min.

Frontend → Vercel

1. Go to Vercel Dashboard → Add New → Project.
2. Import the same GitHub repository.
3. Configure:
   Field Value
   Framework Preset Other
   Root Directory (leave blank)
   Build Command (leave blank)
   Output Directory (leave blank)
4. Click Deploy. Wait ~30 seconds.
5. Copy your Vercel URL — e.g. https://videoke.vercel.app.

Connect the two

1. Update config.js with your Render URL:
   ```js
   window.VIDEOKE_CONFIG = {
     BACKEND_URL: 'https://videoke-backend.onrender.com',
     // ...
   };
   ```
2. Commit and push — Vercel auto-redeploys.
3. Update Render — go to your service → Environment → change FRONTEND_URL to your Vercel URL → Save (auto-redeploys).
4. Test the full flow:
   ```
   https://your-vercel-app.vercel.app/        → click Start New Karaoke
   https://your-vercel-app.vercel.app/host    → open host screen
   https://your-vercel-app.vercel.app/remote?party=XXXXXX  → join from phone
   ```

Persistence setup (optional)

Render's free tier has ephemeral disk — data resets every deploy/restart.

To persist parties across restarts:

1. Upgrade to Render Starter ($7/mo)
2. Add a Persistent Disk → mount at /var/data
3. Set environment variable DATA_DIR=/var/data
4. Redeploy

Your sessions, queues, and favorites will now survive restarts.

---

🔧 Environment Variables

Variable Required Default Description
PORT No 3000 HTTP port (Render sets this automatically)
DATA_DIR No ./data Directory for sessions.json and .secret
FRONTEND_URL Yes (prod) * Frontend origin(s) for CORS. Comma-separated for multiple.
YOUTUBE_API_KEY No — Enables YouTube Data API fallback search (Piped down = rescue)
ADMIN_SECRET No — If set, encrypts stored admin passwords with this key instead of a random .secret file. Recommended on free tier where disk is ephemeral.

Example .env (local only)

```env
PORT=3000
DATA_DIR=./data
FRONTEND_URL=http://localhost:5173
YOUTUBE_API_KEY=
ADMIN_SECRET=
```

⚠️ Never commit .env to git. It's already in .gitignore.

---

📂 Project Structure

```
videoke/
├── index.html              # Landing page — start / join party
├── host.html               # TV/laptop display
├── remote.html             # Mobile guest controller
├── config.js               # Backend URL (edit after deploy)
├── i18n.js                 # English + Filipino translations
├── manifest.json           # PWA manifest
├── service-worker.js       # Self-destruct SW (kills old caches)
├── vercel.json             # Frontend routing rules
├── server.js               # Node.js backend (Express + Socket.IO)
├── package.json            # Backend dependencies
├── .env.example            # Env var template
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── data/                   # Session storage (auto-created, git-ignored)
    ├── sessions.json       # All active parties
    └── .secret             # Auto-generated encryption key
```

.gitignore (recommended)

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Session data
data/
*.tmp

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo
```

---

📡 API Reference

Base URL: https://videoke-backend.onrender.com

REST Endpoints

Health

Method Path Description
GET / Status + session count
GET /health Uptime check

```bash
curl https://videoke-backend.onrender.com/health
# → {"ok":true,"uptime":1234.56}
```

Sessions

Method Path Description
POST /api/session/create Create a new party
GET /api/host/verify?host=CODE Verify host code, get token
GET /api/verify-party?code=CODE Check party code validity
GET /api/party?party=CODE Party status

Create session:

```bash
curl -X POST https://videoke-backend.onrender.com/api/session/create
```

```json
{
  "sessionId": "uuid",
  "hostCode": "abc123...",
  "partyCode": "ABC123",
  "adminPassword": "Xy7Km9Pq",
  "hostUrl": "https://your-frontend/host?session=abc123...",
  "guestUrl": "https://your-frontend/remote?party=ABC123"
}
```

Search & Content

Method Path Description
GET /api/search?q=QUERY&filter=karaoke Search karaoke catalog
GET /api/recommend Trending karaoke
GET /api/yt-info/:videoId Fetch YouTube title/author
GET /api/history?party=CODE Party's play history
GET /api/favorites?party=CODE Party's favorites
GET /api/failed-videos?party=CODE Videos that failed to play

Search:

```bash
curl "https://videoke-backend.onrender.com/api/search?q=adele&filter=karaoke"
```

```json
{
  "items": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Adele - Someone Like You (Karaoke)",
      "author": "Sing King",
      "thumbnail": "https://i.ytimg.com/vi/.../mqdefault.jpg",
      "durationText": "4:45",
      "viewsText": "12.3M views",
      "isDuet": false
    }
  ],
  "offset": 0,
  "hasMore": true,
  "total": 87
}
```

Admin

All admin endpoints require header X-Admin-Token: <token>.

Method Path Description
POST /api/admin/login Login with password
POST /api/admin/ping Verify token still valid
POST /api/admin/logout Invalidate token
POST /api/admin/stop Stop current song
POST /api/admin/end-party End the party
POST /api/admin/kick-all Disconnect all guests
POST /api/admin/clear-history Wipe history
POST /api/admin/clear-failed Clear failed videos list

Login:

```bash
curl -X POST https://videoke-backend.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"party":"ABC123","password":"Xy7Km9Pq"}'
```

```json
{
  "token": "a1b2c3d4e5f6...",
  "partyCode": "ABC123",
  "sessionId": "uuid"
}
```

Socket.IO Events

Connection:

```js
const socket = io('https://videoke-backend.onrender.com', {
  transports: ['websocket', 'polling'],
});
```

Client → Server

Event Payload Auth Purpose
registerHost { hostCode } — Register as full host
registerHost { partyCode } — Register as read-only display
joinParty { code } — Register as guest
addSong { videoId, title, singer } none Reserve a song
removeSong { id, adminToken } admin Remove queue item
moveSong { id, direction, adminToken } admin Reorder queue
pause { adminToken } admin Pause playback
resume { adminToken } admin Resume playback
skip { adminToken } admin Skip current song
stop { adminToken } admin Stop + clear queue
volume { value, adminToken } admin Set volume (0-100)
startPlaying { adminToken } admin Start next song
songEnded — host/display Report video ended
videoFailed { videoId, title } host/display Report broken video
toggleFavorite { videoId, title } none Add/remove favorite

Server → Client

Event Payload Purpose
state { sessionId, partyActive, partyCode, queue, nowPlaying, stats } Full state sync
partyJoined { ok, reason? } Guest joined confirmation
partyChanged { active } Party ended
sessionEnded { reason } Session expired / ended
hostRejected { reason } Invalid host code
command { type, song?, value? } Playback command to host
error string User-facing error message
kicked string Admin kicked you
historyCleared — History was wiped

---

🔒 Security

Threat Model

VIDEoke is designed for friendly parties, not high-security environments. Guests with the party code are assumed non-malicious. However, we defend against:

· Accidental abuse — rate limits prevent accidental DoS
· Casual snooping — admin password protects controls
· Cross-party leaks — tokens are scoped to a single party
· XSS — all user content is escaped
· Session hijacking — tokens are random 24-byte hex strings

Recommendations

Concern Recommendation
CORS Always set FRONTEND_URL to your exact frontend origin in production
Secret storage Set ADMIN_SECRET env var — this encrypts stored passwords with a key you control
HTTPS Always use HTTPS (Render + Vercel give this free)
Rate limits Defaults are tuned for parties; adjust in server.js if needed
Admin password Only share with people you trust

What's Encrypted

· ✅ adminPasswordPlain — encrypted with AES-256-GCM at rest
· ✅ adminPasswordHash — SHA-256, used for login verification
· ❌ Party code — not a secret; it's on the QR code
· ❌ Host code — not a secret; it's for the TV to auto-reconnect
· ❌ Queue data — not sensitive; visible to all party guests

Known Limitations

· No user accounts — each party is anonymous
· No persistent favorite library — favorites reset when party ends
· No moderation log — no audit trail of admin actions
· Search depends on Piped — public Piped instances may go down; set YOUTUBE_API_KEY as fallback

---

🐛 Troubleshooting

Backend won't start

Error: Cannot find module 'express'
→ Run npm install in the project root.

EADDRINUSE: address already in use :::3000
→ Another process is on port 3000. Kill it (lsof -ti:3000 | xargs kill -9) or change PORT.

Failed to load sessions.json
→ Check DATA_DIR permissions. On Render, ensure disk is mounted correctly.

Frontend can't reach backend

"❌ Failed to create session"
→ Check:

1. config.js has the correct BACKEND_URL (no trailing slash!)
2. Backend is running (curl https://your-backend/health)
3. FRONTEND_URL on backend includes your frontend's origin
4. Browser DevTools → Network tab → look for CORS errors

"Disconnected" in the header
→ Socket.IO can't establish a connection.

1. Try transports: ['polling', 'websocket'] (order matters behind some proxies)
2. Check Cloudflare/firewall isn't blocking WebSocket upgrade

Videos won't play

"This video is unavailable"
→ YouTube blocks some videos from embedding. The system auto-skips these.

Autoplay blocked
→ Browsers require one user interaction before playing sound. Tap the host screen once (the yellow overlay does this for you).

Nothing plays after the first tap
→ Check:

1. Host screen is showing "Connected" (green dot)
2. Party code on host matches the one guests are using
3. YouTube IFrame API has loaded (check DevTools console)

Search returns nothing

"No karaoke version found"
→ Piped instances may be down. Check:

1. Try a different search term ("tadhana" instead of "Tadhana by Moira")
2. Set YOUTUBE_API_KEY env var for fallback
3. Wait a minute and retry (search results are cached for 5 min)

Admin login fails

"Invalid or expired token"
→ The token has a 24h TTL. Log out and log back in.

"Wrong password"
→ Password is case-sensitive. Copy-paste from the host screen or the start page.

Party disappeared after restart

On free tier
→ Render's ephemeral disk resets DATA_DIR on restart. Upgrade to a paid plan with persistent disk, or expect to re-create parties.

On paid tier
→ Check DATA_DIR=/var/data is set and the disk is mounted.

PWA not installing

"Add to Home Screen" missing
→ PWA install requires:

1. HTTPS (not HTTP)
2. manifest.json served with application/manifest+json
3. Service worker registering successfully (/service-worker.js)
4. Icons at /icon-192.png and /icon-512.png

---

❓ FAQ

Q: Can I use this without a YouTube API key?

A: Yes. Search uses free public Piped instances first. The API key is only a fallback for when Piped is down.

Q: Does it work on smart TVs?

A: Yes, any TV with a modern web browser. Open host.html in the TV's browser. For best results, use a laptop + HDMI cable.

Q: Can guests see each other's songs?

A: Yes — the entire queue is visible to all guests. This is intentional (social aspect of karaoke).

Q: Can I have more than one host?

A: Yes. Multiple devices can open host.html with the same host code — they'll all receive commands and mirror the state.

Q: Can I prevent specific guests from adding songs?

A: Currently only by using the "Kick All" admin action. Per-user banning is a future feature.

Q: Is there a limit on party size?

A: The backend supports up to 300 concurrent parties and 50 songs per queue. Guests per party are limited only by your server resources (typically hundreds).

Q: Does it work offline?

A: No — it's a streaming system. The PWA can install, but playback requires internet.

Q: How do I reset everything?

A: Delete data/sessions.json on the backend and restart. All parties will be gone.

Q: Can I host this myself?

A: Yes. Any VPS with Node.js ≥ 18 works. Set FRONTEND_URL to your domain, and serve the static files with nginx/Caddy.

---

🤝 Contributing

Contributions are welcome!

Development workflow

1. Fork the repo
2. Create a branch: git checkout -b feature/my-feature
3. Make your changes
4. Test locally (see Local Development)
5. Commit: git commit -m "Add my feature"
6. Push: git push origin feature/my-feature
7. Open a Pull Request

Code style

· Backend: 2-space indent, semicolons, const/let (no var)
· Frontend: 2-space indent, semicolons, ES2020+
· Comments: Explain why, not what
· Security: No innerHTML with user content; always escapeHtml or textContent

Before submitting

☐ No new console errors in browser
☐ No new warnings in server logs
☐ Tested on mobile viewport (< 500px width)
☐ Tested both admin and guest flows
☐ npm start still works

Bug reports

Include:

· Steps to reproduce
· Expected vs. actual behavior
· Browser + version
· Backend logs (Render → Logs tab)
· Screenshots if applicable

---

📄 License

```
MIT License

Copyright (c) 2024 Steve

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

🙏 Credits

· Created by: Steve
· Karaoke catalog: Powered by Piped and the YouTube Data API
· Video playback: YouTube IFrame Player API
· QR codes: QR Server
· Voice announcements: Web Speech API
· Hosting: Render (backend) + Vercel (frontend)

Special thanks

· Every videoke night in the Philippines — for the inspiration
· The Piped team — for open-source YouTube search APIs
· Everyone who's ever belted "Tadhana" at 2am 🎤

---

<div align="center">

🎤 Happy singing! 🎶

Made with ❤️ by Steve

⭐ Star this repo if it helped your party

</div>
```

---

📋 Notes on This README

What's included:

Section Content
Overview High-level pitch + use cases
Features Every feature, grouped by user type (host, remote, admin)
Architecture ASCII diagram + data flow explanation
Tech Stack Table of every layer
Prerequisites What you need before starting
Local Dev Full 6-step setup with test flow
Deployment Step-by-step for Render + Vercel
Env Vars Complete table + example .env
Project Structure Full tree + .gitignore
API Reference Every REST endpoint + every Socket.IO event
Security Threat model + what's encrypted + limitations
Troubleshooting 12 real-world scenarios with fixes
FAQ 10 common questions
Contributing Full dev workflow + code style + bug reports
License MIT
Credits Every dependency + cultural thanks

Extra additions vs. your original:

· Deployment step-by-step (the original assumed you'd figure it out)
· Complete API reference (didn't exist before)
· Environment variables table
· .gitignore content included
· Troubleshooting section (12 scenarios)
· FAQ section
· Security threat model + known limitations
· Contributing guidelines
· Badges at the top
· Table of contents for long-file navigation
. 🚀