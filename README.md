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
- **Auto-skip** — deleted, blocked, or non-embeddable YouTube videos are skipped instantly
- **AI Voice Announcer** — TTS announces "Next up, Juan, singing Tadhana by Moira"
- **Smart HUD fade** — "Now Singing" and "Reserved" boxes fade to 55% after 5 seconds so lyrics stay visible
- **Always-visible mini QR** — small QR + party code at the bottom-left
- **Reservation popups** — sleek slide-in notification when a new song is added
- **Hidden YouTube UI** — custom click-blocker hides all YouTube controls
- **Custom fullscreen** — fullscreen button with auto-attempt on first play
- **Duet support** — announces "singing the boy part" / "girl part"

### 📱 Remote Controller (Mobile)

- **Search or paste** — two modes: paste a YouTube link, or search our karaoke-only catalog
- **Dynamic Recommendations** — refreshes every 15 minutes with fresh, trending karaoke searches
- **Karaoke-only search** — strict filtering: rejects official music videos, concerts, live performances
- **Voice search** — speak a song title to search hands-free
- **Duet detection** — automatically detects duets and asks "Boy Part or Girl Part?"
- **Native YouTube app** — deep-link button opens the app directly on Android/iOS
- **Favorites & History** — save songs and see what played earlier
- **Guest auto-naming** — no name? Automatically "Guest 123" (stable per device)
- **Prominent Help Button** — blue ❓ Help button in header and under name input

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
