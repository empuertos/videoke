# 🎤 VIDEoke YT

**A modern, multi-tenant YouTube-powered videoke (karaoke) system.** 
Built for parties, gatherings, and public events. Guests scan a QR code, search or paste a YouTube link, and songs play automatically on the host screen. No downloads, no local files, 100% streaming from YouTube.

Created with ❤️ by **Steve**.

---

## ✨ Features

### 🏢 Multi-Tenant Architecture
- **Multiple Simultaneous Parties** — Up to 300 separate karaoke sessions running at the same time without overlapping.
- **Auto-Generated Security** — Every new party generates a unique **Host Code** (for the TV), **Party Code** (for guests), and **Admin Password** (for co-hosts) automatically.
- **24-Hour Validity** — Parties, queues, and QR codes stay valid for 24 hours. Perfect for long events.
- **Session Recovery** — Queues and current playing song are saved in JSON. If the server restarts or brownouts occur, the party resumes automatically.

### 🎵 Host Screen (TV/PC)
- **Auto-Play & Auto-Skip** — Songs play automatically. If a video has embedding disabled or is deleted, it skips instantly.
- **AI Voice Announcer** — Uses Text-to-Speech (TTS) to announce the next singer and song ("Next up, Juan, singing Tadhana").
- **Smart UI Fade** — "Now Singing" and "Reserved" boxes auto-fade to 55% opacity after 5 seconds, so they don't block the lyrics, but remain visible.
- **Always-Visible Mini QR** — A small QR code with "Scan to Request" text is permanently displayed at the bottom-left.
- **Reserved Notification** — A sleek pop-up slides in from the top-right when someone reserves a song, showing the singer's name and song title.
- **Hidden YouTube Controls** — An invisible click-blocker prevents the YouTube UI from appearing, keeping the screen clean. Custom Fullscreen button provided.

### 📱 Remote Controller (Mobile)
- **Karaoke-Only Search** — Uses Piped API and YouTube Data API to strictly filter out non-karaoke videos.
- **Voice Search** — Tap the 🎤 icon and speak the song title for hands-free searching.
- **Duet Support** — Automatically detects duets and asks the singer if they want to sing the 👦 Boy Part or 👧 Girl Part.
- **Recommendations** — "Popular Karaoke" and category chips (OPM, Love Songs, Duets) appear instantly so guests don't even need to type.
- **Paste Link Mode** — Includes an "Open YouTube App" shortcut for copying links manually.
- **Load More** — Pagination for endless karaoke browsing.

### 🔒 Admin & Security
- **Admin-Locked Controls** — Pause/Play/Skip/Volume are locked by default. Guests need the Admin Password to control them.
- **Auto-Lock** — Controls automatically lock after 10 minutes of inactivity.
- **Smart Name System** — Guests type their name once (auto-saves via `localStorage`), or leave it blank to be assigned as "Guest 1", "Guest 2", etc.

---

## 🏗️ Architecture

```text
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Guest      │         │   Host       │         │   Backend    │
│  (Mobile)    │◄───────►│  (TV/Laptop) │◄───────►│  (Node.js)   │
│  remote.html │ Socket  │  host.html   │ Socket  │  Express +   │
│  Vercel      │   .IO   │  Vercel      │   .IO   │  Socket.IO   │
└──────────────┘         └──────────────┘         │  Render      │
                                                  └──────────────┘