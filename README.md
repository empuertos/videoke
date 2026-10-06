# 🎤 VIDEoke YT

A YouTube-powered videoke (karaoke) system built for parties, gatherings, and events. Guests scan a QR code, paste a YouTube link from their phone, and the song plays automatically on the host screen — no downloads, no local files, everything streams directly from YouTube.

---

## ✨ Features

- 🎵 **YouTube-based playback** — Lahat ng kanta galing YouTube. Walang download.
- 📱 **Mobile remote** — Guests reserve songs from their phone via QR code.
- 📋 **Smart queue system** — Automatic waiting time estimates, reorder, and skip.
- ⭐ **Favorites** — Save frequently sung songs for quick access.
- 📜 **History & Trending** — Track what's been played and what's hot.
- ⛔ **Auto-blacklist** — Failed/blocked videos are automatically removed.
- 🔐 **Admin panel** — Password-protected controls (force stop, kick all, clear data).
- 🎨 **Modern UI** — Dark theme, gold/red accents, fully responsive.
- 🌐 **Bilingual** — Filipino and English interface toggle.
- ⚡ **Real-time sync** — Socket.IO keeps host and remotes in sync instantly.

---

## 🏗️ Architecture

```

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Guest      │         │   Host       │         │   Backend    │
│  (Mobile)    │◄───────►│  (TV/Laptop) │◄───────►│  (Node.js)   │
│  remote.html │ Socket  │  host.html   │ Socket  │  Express +   │
│  Vercel      │   .IO   │  Vercel      │   .IO   │  Socket.IO   │
└──────────────┘         └──────────────┘         │  Render      │
└──────────────┘

```

| Layer | Technology | Hosted On |
|-------|-----------|-----------|
| Frontend | HTML, CSS, Vanilla JS, Socket.IO Client | Vercel |
| Backend | Node.js, Express, Socket.IO | Render |
| Storage | JSON files (ephemeral) | Render filesystem |
| Media | YouTube (embedded iframe) | YouTube |

---

## 📁 Project Structure

```

videoke/
├── backend/
│   ├── server.js              # Main Express + Socket.IO server
│   ├── package.json
│   └── data/                  # Auto-generated JSON storage
│       ├── history.json
│       ├── favorites.json
│       ├── trending.json
│       └── failed-videos.json
├── frontend/
│   ├── index.html             # Landing page
│   ├── host.html              # TV/display screen (video player)
│   ├── remote.html            # Guest mobile controller
│   ├── config.js              # API base URL configuration
│   ├── i18n.js                # Translations
│   ├── manifest.json          # PWA manifest
│   └── service-worker.js
└── README.md

```

---

## 🚀 Local Development

### Prerequisites

- Node.js **v18+** (needs native `fetch` and `AbortSignal.timeout`)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/empuertos/videoke.git
cd videoke
```

2. Install backend dependencies

```bash
cd backend
npm install
```

3. Set environment variables (optional for local)

Create a .env file or export directly:

```bash
export PORT=3000
export ADMIN_PASSWORD=your-secret-password
export FRONTEND_URL=http://localhost:5500
```

Note: If ADMIN_PASSWORD is not set, the server will refuse to start for security reasons.

4. Start the backend server

```bash
npm start
# or
node server.js
```

The backend will be available at http://localhost:3000.

5. Serve the frontend

Use any static server (e.g., live-server, http-server, or Python):

```bash
cd ../frontend
npx http-server -p 5500
```

Open http://localhost:5500/host.html on your display and http://localhost:5500/remote.html on your phone.

---

🔑 Environment Variables

Set these on Render → Your Backend Service → Environment:

Variable Required Description Example
ADMIN_PASSWORD ✅ Yes Password for admin panel login. Server won't start without it. MySecretPass2024
FRONTEND_URL ⚠️ Recommended Comma-separated list of allowed origins (CORS). Use * for testing only. https://videoke-frontend.vercel.app
PORT Optional Server port. Render sets this automatically. 3000
DATA_DIR Optional Where JSON files are stored. Defaults to ./data. /tmp/videoke-data

⚠️ Important Notes

· ADMIN_PASSWORD is required. The server will crash on startup if it's missing.
· FRONTEND_URL must match your Vercel URL exactly (no trailing slash) or guests will get CORS errors.
· On Render's free tier, the filesystem is ephemeral — data resets on redeploy. Set DATA_DIR=/tmp/videoke-data or upgrade to a paid disk for persistence.

---

☁️ Deployment

Backend → Render

1. Push your code to GitHub.
2. Go to Render Dashboard → New → Web Service.
3. Connect your repo, set:
   · Root Directory: backend
   · Build Command: npm install
   · Start Command: npm start
4. Add environment variables (ADMIN_PASSWORD, FRONTEND_URL).
5. Click Create Web Service.
6. Copy the deployed URL (e.g., https://videoke-backend.onrender.com).

Frontend → Vercel

1. Go to Vercel Dashboard → New Project.
2. Import your repo, set:
   · Root Directory: frontend
   · Framework Preset: Other
3. Deploy.
4. Update frontend/config.js to point to your Render backend:

```javascript
window.VIDEOKE_CONFIG = {
  BACKEND_URL: 'https://videoke-backend.onrender.com'
};
```

5. Push the change — Vercel auto-deploys.

Post-Deploy Checklist

☐ ADMIN_PASSWORD set on Render.
☐ FRONTEND_URL matches your Vercel URL.
☐ config.js points to the live Render backend.
☐ Admin panel login works.
☐ Guests can reserve and play songs.

---

🔌 API Endpoints

All endpoints are prefixed with /api.

Public

Method Endpoint Description
GET / Health check / service info
GET /health Uptime check
GET /api/info Frontend and backend URLs
GET /api/yt-info/:videoId Fetch YouTube metadata (title, author, HD flag)
GET /api/history?limit=50 Get play history
GET /api/favorites Get saved favorites
GET /api/trending Get trending stats (session/today/all-time)
GET /api/failed-videos Get blacklisted videos

Admin (require ?token= or x-admin-token header)

Method Endpoint Description
GET /api/admin/login?password=... Authenticate and receive token
GET /api/admin/stop Force stop current song
GET /api/admin/kick-all Disconnect all guests
GET /api/admin/clear-history Clear play history
GET /api/admin/clear-failed Clear blacklist
GET /api/admin/clear-trending Clear trending data

Note: Admin endpoints use GET (not POST) so that the frontend can call them without triggering CORS preflight. The token is valid for 4 hours.

---

📡 Socket.IO Events

Client → Server

Event Payload Description
addSong { videoId, singer, title } Add a song to the queue
removeSong id Remove a song by ID
moveSong { id, direction } Reorder queue (up / down)
toggleFavorite { videoId, title } Add/remove favorite
skip — Skip to next song
stop — Stop playback
pause / resume — Pause/resume video
volume 0–100 Set host volume
startPlaying — Manually start the queue
songEnded — Notify server that song finished
videoFailed { videoId, title } Auto-blacklist a broken video

Server → Client

Event Payload Description
state { queue, nowPlaying, stats, favorites } Full application state
command { type, ... } Host playback commands
trending Trending object Updated trending stats
videoBlacklisted { videoId, title } Notify of blacklisted video
historyCleared — History was cleared by admin
kicked message Force logout guests

---

🔐 Admin Panel

Open the admin panel from the gear icon (⚙️) in the top-right corner of remote.html.

Available actions:

· ⏹ Force Stop — Halt the current song immediately.
· 👢 Kick All — Disconnect all guest remotes.
· 🗑️ Clear History — Wipe the play history.
· ⛔ Clear Failed Videos — Remove videos from the blacklist.

Login flow:

1. Enter the ADMIN_PASSWORD (the one you set in Render).
2. Server returns a 24-byte hex token (valid for 4 hours).
3. Token is stored in localStorage and sent with every admin action.

---

🛠️ Troubleshooting

❌ "Failed to fetch" on login

· Cause: Backend is asleep (Render free tier) or CORS is blocking the request.
· Fix: Visit your Render backend URL directly to wake it up. Check that FRONTEND_URL includes your Vercel domain exactly.

❌ "Server error 404" on login

· Cause: HTTP method mismatch — frontend sends GET, backend expects POST (or vice versa).
· Fix: Ensure all admin routes use app.get() and read req.query for parameters.

❌ "Unauthorized" on admin actions

· Cause: Token expired (4-hour limit) or not being sent.
· Fix: Log out and log in again. Check localStorage.getItem('videoke:adminToken').

❌ Videos won't play on host

· Cause: The YouTube video has embedding disabled by its uploader.
· Fix: The system auto-blacklists failed videos. Try a different upload of the same song.

❌ Data disappears after redeploy

· Cause: Render's free tier uses ephemeral storage.
· Fix: Set DATA_DIR=/tmp/videoke-data (still ephemeral but survives within a session) or upgrade to a paid Render disk.

❌ Admin login says "Maling password" even with correct password

· Cause: Typo or trailing whitespace in Render's ADMIN_PASSWORD env var.
· Fix: Re-enter the password in Render, save, and Manual Deploy → Clear build cache & deploy.

---

🧪 Testing the Backend Directly

Use curl to test without the frontend:

```bash
# Health check
curl https://your-backend.onrender.com/health

# Admin login
curl "https://your-backend.onrender.com/api/admin/login?password=YOUR_PASSWORD"

# Get trending
curl https://your-backend.onrender.com/api/trending
```

---

📜 License

MIT License — free to use, modify, and distribute.

---

🙏 Credits

· YouTube for the oEmbed API and embedded player.
· Socket.IO for real-time bidirectional communication.
· Render and Vercel for generous free tiers.

---

📞 Support

If you encounter bugs or want to suggest features, please open an issue or submit a pull request.

Enjoy your videoke session! 🎤🎶

```

### 📌 Mga dapat mong gawin pagkatapos i-paste:

1. I-save ang `README.md`.
2. Palitan ang `empuertos/videoke` ng tamang GitHub URL mo kung iba.
3. I-update ang `YOUR_PASSWORD`, `your-backend.onrender.com`, at `videoke-frontend.vercel.app` ng actual values mo sa examples.
4. I-commit at i-push sa GitHub.

Kung gusto mong magdagdag ng screenshots o GIF demo sa README, sabihin mo lang — tutulungan kita kung paano i-embed sa Markdown. 🎤