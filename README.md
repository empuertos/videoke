# 🎤 VIDEoke YT

**A YouTube-powered videoke (karaoke) system** built for parties, gatherings, and events. Guests scan a QR code from their phone, paste a YouTube link, and songs play automatically on the host screen — **no downloads, no local files, everything streams directly from YouTube.**

---

## ✨ Features

### 🎵 Core Playback
- **YouTube-based playback** — All songs come from YouTube. No downloads needed.
- **Auto-fullscreen on play** — Video automatically enters fullscreen when a song starts.
- **Custom fullscreen button** — Always visible, even in fullscreen mode.
- **Real-time sync** — Socket.IO keeps host and remotes in sync instantly.
- **Auto-blacklist** — Videos with embedding disabled are automatically removed.

### 📱 Party System
- **QR code party system** — Each party gets a unique 6-character code (e.g. `K7X9M2`).
- **Party gate** — Guests without a valid code cannot reserve songs. Old links auto-invalidate after the party ends.
- **Share Party section** — Guests can share the QR/link from their own phone to invite others.
- **Cross-sync** — Host and remotes stay in sync every 5 seconds.
- **Party recovery** — Queue and party code are saved, so brownouts/restarts don't lose reservations.

### 🔐 Admin-Only Controls
- **Admin-locked playback** — Pause / Play / Skip / Stop are locked by default. Guests need admin password to control.
- **Admin-locked volume** — Volume slider is locked for guests.
- **Admin-locked queue** — Guests cannot move or remove songs from the queue.
- **Auto-lock on logout** — Logging out automatically locks all controls.
- **Auto-lock after 10 min inactivity** — Admin controls auto-lock after 10 minutes of no activity.
- **Session token verification** — Tokens verified on page load; expired tokens auto-lock.
- **4-hour token expiry** — Admin tokens valid for 4 hours.

### 🎨 UI / UX
- **Modern dark theme** — Gold/red accents, fully responsive.
- **Bilingual** — English (default) and Filipino toggle.
- **PWA-ready** — Installable on mobile home screens.
- **Keyboard shortcuts** — Play/Pause (`P`), Skip (`S`), Fullscreen (`F`) on host.
- **Vertical reserved panel** — Host shows Now Playing (left) + Reserved queue (right) in a compact top bar.

### 📊 Data & Analytics
- **History** — Track every song played with singer name and timestamp.
- **Favorites** — Save frequently sung songs for quick access.
- **Trending** — Session / Today / All-time trending songs.

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
| Storage | JSON files (ephemeral on free tier) | Render filesystem |
| Media | YouTube (embedded iframe) | YouTube |
| QR Code | api.qrserver.com | Free API |

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
│       ├── failed-videos.json
│       ├── party.json         # Active party code
│       └── queue-state.json   # Queue persistence
├── frontend/
│   ├── index.html             # Landing page
│   ├── host.html              # TV / display screen
│   ├── remote.html            # Guest mobile controller
│   ├── config.js              # API base URL configuration
│   ├── i18n.js                # Translations (EN / FIL)
│   ├── manifest.json          # PWA manifest
│   ├── service-worker.js
│   └── icons/                 # PWA icons
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

3. Set environment variables

```bash
export PORT=3000
export ADMIN_PASSWORD=your-secret-password
export FRONTEND_URL=http://localhost:5500
```

⚠️ Important: If ADMIN_PASSWORD is not set, the server will refuse to start for security reasons.

4. Start the backend

```bash
npm start
# or
node server.js
```

5. Serve the frontend

```bash
cd ../frontend
npx http-server -p 5500
```

· Open http://localhost:5500/host.html on your TV/display.
· Open http://localhost:5500/remote.html on your phone.
· Tap ⚙️ → Login → Start New Party → scan QR code.

---

🔑 Environment Variables

Set these on Render → Your Backend Service → Environment:

Variable Required Description Example
ADMIN_PASSWORD ✅ Yes Admin panel password. Server won't start without it. MySecretPass2024
FRONTEND_URL ⚠️ Recommended Comma-separated list of allowed origins (CORS). Use * for testing only. https://videoke-frontend.vercel.app
PORT Optional Server port. Render sets this automatically. 3000
DATA_DIR Optional Where JSON files are stored. Defaults to ./data. /tmp/videoke-data

⚠️ Notes

· ADMIN_PASSWORD is required. Server will crash if missing.
· FRONTEND_URL must match your Vercel URL exactly (no trailing slash) or guests will get CORS errors.
· On Render's free tier, filesystem is ephemeral — data resets on redeploy. Set DATA_DIR=/tmp/videoke-data for session persistence.

---

☁️ Deployment

Backend → Render

1. Push your code to GitHub.
2. Go to Render Dashboard → New → Web Service.
3. Connect repo, set:
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
4. Update frontend/config.js:

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
☐ Admin login works from phone.
☐ Host screen shows QR code after starting a party.
☐ PWA install prompt appears on mobile.

---

🎬 How to Use

Starting a Party

Option A: From the TV (host)

1. Open host.html on the TV.
2. Tap 🎉 Start Party.
3. Enter admin password.
4. QR code + 6-character code appear at the bottom.

Option B: From the phone (admin)

1. Open remote.html on your phone.
2. Tap ⚙️ → Login → 🎉 Start New Party.
3. QR code appears; it syncs to the host screen automatically.

Guest Flow

1. Guests scan the QR code (or type the 6-character code).
2. Enter their name.
3. Paste a YouTube link (via the Open YouTube App button).
4. Tap Reserve → the song joins the queue.

Sharing the Party (Guest-side)

Each guest who joins has a 📤 SHARE THIS PARTY section at the bottom of their remote:

· QR code — Let friends scan directly from your phone.
· 📋 Copy Link — Copy the join link to clipboard.
· 📤 Share — Open native share sheet (Messenger, Viber, WhatsApp).

Ending a Party

1. Admin panel (phone) or host screen (TV) → 🚫 End Party.
2. All guests are immediately locked out; old links become invalid.
3. Next party generates a new code and new QR.

Admin Controls Lock

The Pause/Play/Skip/Stop buttons and volume are locked by default for guests:

· Guests tapping them see a password prompt.
· Only admin (after login) can control them.
· Auto-locks after logout OR after 10 minutes of inactivity.

Brownout / Disconnect Recovery

· Queue and party code are saved on the server.
· When connection comes back, host and remotes reconnect automatically.
· Queue is restored from queue-state.json.
· Sync polling runs every 5 seconds, so recovery is fast.

---

🔌 API Endpoints

All endpoints prefixed with /api.

Public

Method Endpoint Description
GET / Health check
GET /health Uptime check
GET /api/info Frontend / backend URLs
GET /api/party Current party status and code
GET /api/verify-party?code=XXX Validate a party code
GET /api/yt-info/:videoId Fetch YouTube metadata
GET /api/history?limit=50 Get play history
GET /api/favorites Get saved favorites
GET /api/trending Trending stats
GET /api/failed-videos Blacklisted videos

Admin (require ?token= or x-admin-token header)

Method Endpoint Description
GET /api/admin/login?password=... Authenticate, receive token
GET /api/admin/start-party Generate new party code
GET /api/admin/end-party Invalidate current party
GET /api/admin/stop Force stop playback
GET /api/admin/kick-all Disconnect all guests
GET /api/admin/clear-history Wipe play history
GET /api/admin/clear-failed Clear blacklist
GET /api/admin/clear-trending Clear trending data

Note: Admin endpoints use GET (not POST) to avoid CORS preflight. Tokens are valid for 4 hours.

---

📡 Socket.IO Events

Client → Server

Event Payload Description
registerHost — Host identifies itself
joinParty { code } Guest verifies party code
addSong { videoId, singer, title } Add song to queue
removeSong id Remove a queue item
moveSong { id, direction } Reorder queue (up / down)
toggleFavorite { videoId, title } Add/remove favorite
skip — Skip current song
stop — Stop playback
pause / resume — Pause / resume video
volume 0–100 Set host volume
startPlaying — Manually start the queue
songEnded — Notify server that song ended
videoFailed { videoId, title } Auto-blacklist broken video

Server → Client

Event Payload Description
state { queue, nowPlaying, stats, favorites, partyActive } Full state
command { type, ... } Host playback commands
trending Trending object Updated trending stats
partyStatus { active, code } Current party state
partyChanged { active } Party started/ended
partyJoined { ok, reason } Result of joinParty
videoBlacklisted { videoId, title } Notify of blacklisted video
historyCleared — History was cleared by admin
kicked message Force logout guests

---

🔐 Admin Panel

Access from:

· Phone: Tap ⚙️ in the top-right of remote.html, or ⚙️ Admin Access in the party gate.
· TV: Tap 🎉 Start Party or 🚫 End Party on the idle screen.

Available Actions

· 🎉 Start New Party — Generate a new 6-character code + QR.
· 🚫 End Party — Invalidate the current code.
· ⏹ Force Stop — Halt current playback.
· 👢 Kick All — Disconnect all guests.
· 🗑️ Clear History — Wipe play history.
· ⛔ Clear Failed Videos — Empty the blacklist.
· 🔒 Lock Controls — Manually lock controls (disable guest access).
· 🚪 Logout — Clear admin token + auto-lock controls.

Session Token

· Validity: 4 hours
· Storage: localStorage (videoke:adminToken)
· Auto-verify: On page load, token is verified against backend.
· Auto-lock: On logout OR after 10 min of inactivity.

---

⌨️ Keyboard Shortcuts (Host)

Key Action
P Play / Pause
S Skip current song
F Toggle fullscreen
Enter Submit password (when prompt open)
Esc Cancel password prompt

---

🛠️ Troubleshooting

❌ "Failed to fetch" on login

· Cause: Backend is asleep (Render free tier) or CORS blocking the request.
· Fix: Visit your Render backend URL to wake it up. Verify FRONTEND_URL includes your Vercel domain exactly.

❌ "Server error 404" on login or admin action

· Cause: HTTP method mismatch (frontend sends GET, backend expects POST) or endpoint not deployed.
· Fix: Ensure all admin routes use app.get() and read req.query. Redeploy latest server.js on Render.

❌ Admin controls still unlocked after logout

· Cause: Old code was not clearing controlsUnlocked state.
· Fix: Update to the latest remote.html. Logout now sets controlsUnlocked = false and clears localStorage.

❌ Auto-lock not triggering

· Cause: Timer not resetting on user activity.
· Fix: Verify the resetAutoLockTimer() function is called on click, touchstart, keydown, scroll. Check that AUTO_LOCK_MS is set to 10 * 60 * 1000.

❌ Host doesn't show QR code

· Cause: No active party or out of sync.
· Fix: Start a new party from admin panel or host screen. Host polls /api/party every 5 seconds.

❌ Guests can still reserve after party ended

· Cause: They have a saved code in localStorage.
· Fix: Every socket connection is verified against the current party code. Invalid codes are rejected.

❌ Videos won't play on host

· Cause: YouTube video has embedding disabled by uploader.
· Fix: System auto-blacklists failed videos. Try a different upload.

❌ Data disappears after redeploy

· Cause: Render free tier uses ephemeral storage.
· Fix: Set DATA_DIR=/tmp/videoke-data or upgrade to paid Render disk.

❌ PWA install not working

· Cause: Service worker unregistered or manifest incomplete.
· Fix: Register the SW in remote.html. Ensure manifest.json has 192×192 and 512×512 icons, display: standalone, and start_url.

---

🧪 Testing the Backend Directly

```bash
# Health check
curl https://your-backend.onrender.com/health

# Current party status
curl https://your-backend.onrender.com/api/party

# Admin login
curl "https://your-backend.onrender.com/api/admin/login?password=YOUR_PASSWORD"

# Start a party (replace TOKEN)
curl "https://your-backend.onrender.com/api/admin/start-party?token=TOKEN"

# Trending
curl https://your-backend.onrender.com/api/trending
```

---

🎨 Customization

Change colors

Edit the :root variables in remote.html or host.html:

```css
:root {
  --gold: #ffd700;
  --red:  #ff2e55;
  --bg:   #0a0512;
  /* ... */
}
```

Change party code length

In server.js:

```javascript
function generatePartyCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {  // ← Change 6 to desired length
    code += PARTY_CHARS[Math.floor(Math.random() * PARTY_CHARS.length)];
  }
  return code;
}
```

Change auto-lock timeout

In remote.html:

```javascript
const AUTO_LOCK_MS = 10 * 60 * 1000; // 10 minutes
// Change to: 5 * 60 * 1000  → 5 minutes
//            30 * 60 * 1000 → 30 minutes
```

Change party code characters

```javascript
const PARTY_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
// Excludes 0/O and 1/I/L to avoid confusion
```

---

📜 License

MIT License — free to use, modify, and distribute.

---

🙏 Credits

· YouTube for the oEmbed API and embedded player.
· Socket.IO for real-time bidirectional communication.
· Render and Vercel for generous free tiers.
· api.qrserver.com for free QR code generation.

---

📞 Support

Found a bug or want to suggest a feature? Open an issue or submit a pull request.

Enjoy your videoke session! 🎤🎶

```

---

### 📌 Reminders pagkatapos i-paste:

1. I-save ang `README.md` sa root ng repo.
2. Palitan ang `empuertos/videoke` ng tamang GitHub URL mo kung iba.
3. Palitan ang `your-backend.onrender.com` at `videoke-frontend.vercel.app` ng actual URLs mo sa mga examples.
4. I-commit at i-push sa GitHub.

Kung gusto mong magdagdag ng **screenshots o GIF demo**, sabihin mo lang — tutulungan kita kung paano i-embed sa Markdown. 🎤