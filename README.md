# 🎤 VIDEoke YT

**A modern, multi-tenant YouTube-powered videoke (karaoke) system.** 
Built for parties, gatherings, and public events. Guests scan a QR code, search or paste a YouTube link, and songs play automatically on the host screen. No downloads, no local files, 100% streaming from YouTube.

Created with ❤️ by **Steve**.

---

## ✨ Features

### 🏢 Multi-Tenant Architecture
- **Multiple Simultaneous Parties** — Up to 300 separate karaoke sessions running at the same time without overlapping.
- **Auto-Generated Security** — Every new party generates a unique **Host Code** (for the TV), **Party Code** (for guests), and **Admin Password** (for co-hosts) automatically. No server setup needed.
- **Session Recovery** — Queues and parties are saved in JSON. If the server restarts, the party continues.

### 🎵 Core Playback
- **YouTube-Based** — Streams directly from YouTube. No media storage needed.
- **Auto-Play on Host** — As soon as a song is reserved, it plays on the Host screen.
- **Auto-Quality** — YouTube automatically adapts the video quality based on the host's internet speed.
- **Auto-Blacklist** — Videos with disabled embedding are automatically skipped and blacklisted.

### 🔍 Smart Search & Reservations
- **Karaoke-Only Search** — The search engine automatically filters out non-karaoke videos (e.g., official music videos).
- **Voice Search** — Tap the 🎤 icon on the remote and speak the song title for hands-free searching.
- **Paste Link Mode** — Guests can paste any YouTube link directly.
- **Load More** — Infinite scrolling-like pagination for search results.
- **Recommendations** — "Popular Karaoke" and category chips (OPM, Love Songs, Duets, etc.) appear instantly so guests don't even need to type.
- **Duet Support** — Automatically detects duet songs and asks the singer if they want to sing the 👦 Boy Part or 👧 Girl Part.

### 🔊 AI & Audio
- **AI Voice Announcer** — The Host screen uses Text-to-Speech (TTS) to announce the next singer and song ("Next up, Juan, singing Tadhana by Moira").
- **Voice Cleanup** — Automatically strips out "(Karaoke)", "[Official Video]", etc., so the voice sounds natural.

### 🔒 Admin & Security
- **Admin-Locked Controls** — Pause/Play/Skip/Volume are locked by default. Only the admin can control them.
- **Auto-Lock** — Controls automatically lock after 10 minutes of inactivity.
- **Smart Name System** — Guests can type their name once (auto-saves), or leave it blank to be assigned as "Guest 1", "Guest 2", etc.

### 📱 UI / UX
- **PWA-Ready** — Can be installed on mobile phones as an app.
- **Responsive** — Works on Smart TVs, Tablets, and Mobile Phones.
- **Bilingual** — Toggle between English and Filipino.

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