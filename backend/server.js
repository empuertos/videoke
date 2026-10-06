const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// ===== CORS + SOCKET.IO =====
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL === '*' ? true : FRONTEND_URL.split(',').map(s => s.trim()),
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  maxHttpBufferSize: 1e6
});

// ===== DATA DIR (Render persistent disk kung available) =====
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); }
  catch (e) { console.warn('Data dir not writable:', e.message); }
}
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');
const RECENT_FILE = path.join(DATA_DIR, 'recent-searches.json');
const TRENDING_FILE = path.join(DATA_DIR, 'trending.json');

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'videoke-backend',
    timestamp: Date.now(),
    frontend: FRONTEND_URL,
    clients: io.engine.clientsCount
  });
});

app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ===== HELPERS =====
function loadJSON(f, def = []) {
  try { return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : def; }
  catch { return def; }
}
function saveJSON(f, data) {
  try { fs.writeFileSync(f, JSON.stringify(data, null, 2)); }
  catch (e) { console.error('Save error:', e.message); }
}

function parseYouTubeUrl(input) {
  if (!input) return null;
  input = String(input).trim();
  if (/^[\w-]{11}$/.test(input)) return input;
  const m = input.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|.*[?&]v=))([\w-]{11})/
  );
  return m ? m[1] : null;
}

// ===== KARAOKE KEYWORDS =====
const KARAOKE_POSITIVE = [
  /\bkaraoke\b/i, /\bvideoke\b/i,
  /\bminus[\s-]?one\b/i, /\binstrumental\b/i,
  /\bbacking\s*track\b/i, /\bsing[\s-]?along\b/i,
  /\bplayback\b/i, /\bkaraoke\s*version\b/i
];

const KARAOKE_NEGATIVE = [
  /\bofficial\s*(music\s*)?video\b/i, /\bofficial\s*mv\b/i,
  /\bmusic\s*video\b/i, /\blyric\s*video\b/i,
  /\baudio\s*only\b/i, /\bfull\s*album\b/i,
  /\blive\s*(at|performance|concert)\b/i, /\bconcert\b/i,
  /\binterview\b/i, /\breaction\b/i,
  /\bcover\s*by\b/i, /\bremix\b/i,
  /\bslowed\b/i, /\breverb\b/i,
  /\bnightcore\b/i, /\b8d\s*audio\b/i, /\bsped\s*up\b/i
];

function isKaraokeTitle(title) {
  if (!title) return false;
  const t = String(title);
  const hasPos = KARAOKE_POSITIVE.some(re => re.test(t));
  if (!hasPos) return false;
  return !KARAOKE_NEGATIVE.some(re => re.test(t));
}

function karaokeScore(title) {
  if (!title) return 0;
  const t = String(title);
  let s = 0;
  if (/\bkaraoke\s*version\b/i.test(t)) s += 10;
  if (/\bkaraoke\b/i.test(t)) s += 8;
  if (/\bvideoke\b/i.test(t)) s += 8;
  if (/\bminus[\s-]?one\b/i.test(t)) s += 9;
  if (/\binstrumental\b/i.test(t)) s += 6;
  if (/\bsing[\s-]?along\b/i.test(t)) s += 4;
  if (/\bplayback\b/i.test(t)) s += 3;
  if (/\bhd\b/i.test(t)) s += 2;
  if (/\b4k\b/i.test(t)) s += 2;
  return s;
}

// ===== HD =====
const HD_KEYWORDS = [
  /\bhd\b/i, /\b4k\b/i, /\b1080p?\b/i, /\b720p?\b/i,
  /\bfull\s*hd\b/i, /\buhd\b/i, /\bhigh\s*definition\b/i
];

function hasHDKeyword(title) {
  if (!title) return false;
  return HD_KEYWORDS.some(re => re.test(title));
}

function hdScore(title) {
  if (!title) return 0;
  const t = String(title);
  if (/\b4k\b/i.test(t)) return 4;
  if (/\b1080p?\b/i.test(t)) return 3;
  if (/\bfull\s*hd\b/i.test(t)) return 3;
  if (/\bhd\b/i.test(t)) return 2;
  if (/\b720p?\b/i.test(t)) return 1;
  return 0;
}

// ===== CHANNELS =====
const TRUSTED_CHANNELS = [
  'karaoke version', 'sunfly karaoke', 'the karaoke channel',
  'sing king', 'karaoke sing', 'zx karaoke', 'popkorn karaoke',
  'musisi karaoke', 'ksa karaoke', 'nice karaoke', 'wow karaoke',
  'karaoke studio', 'z video', 'roadtoquezon karaoke', 'otg videoke',
  'tjtv karaoke', 'bj videoke', 'jucel karaoke', 'do video karaoke',
  'philippine karaoke', 'teleserye karaoke', 'opm karaoke',
  'karaoke hub', 'karaoke master', 'karaoke time', 'starmusic karaoke',
  'ao karaoke', 'vk karaoke', 'sky karaoke', 'karaoke ph'
];

const BLOCKED_CHANNELS = [
  't-series', 'tseries', 'sony music', 'universal music',
  'warner music', 'vevo', 'umg', 'wmg',
  'sm entertainment', 'yg entertainment', 'jyp entertainment',
  'hybe', 'bighit', 'abs-cbn music', 'star music',
  'polyeast records', 'vicor music', 'ivory music',
  'react', 'reaction'
];

function channelScore(author) {
  if (!author) return 0;
  const a = String(author).toLowerCase().trim();
  if (BLOCKED_CHANNELS.some(c => a.includes(c))) return -100;
  if (TRUSTED_CHANNELS.some(c => a.includes(c))) return 10;
  if (/karaoke|videoke/i.test(a)) return 5;
  return 0;
}

function isBlockedChannel(author) { return channelScore(author) === -100; }

// ===== DURATION =====
function parseDuration(seconds) {
  const n = Number(seconds);
  return isNaN(n) ? 0 : n;
}
function durationInRange(seconds, minSec, maxSec) {
  const s = parseDuration(seconds);
  if (s === 0) return true;
  if (minSec > 0 && s < minSec) return false;
  if (maxSec > 0 && s > maxSec) return false;
  return true;
}
function durationScore(seconds) {
  const s = parseDuration(seconds);
  if (s === 0) return 0;
  if (s >= 150 && s <= 360) return 5;
  if (s >= 120 && s <= 480) return 3;
  if (s >= 90 && s <= 600) return 1;
  return 0;
}
function formatRange(minSec, maxSec) {
  const fmt = s => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${String(ss).padStart(2, '0')}`;
  };
  return `${fmt(minSec)} - ${fmt(maxSec)}`;
}

// ===== INVIDIOUS / PIPED =====
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yewtu.be',
  'https://invidious.f5.si',
  'https://iv.melmac.space'
];

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.reallyaweso.me'
];

const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const hdCache = new Map();
const HD_CACHE_TTL = 30 * 60 * 1000;

// ===== STATE =====
let queue = [];
let nowPlaying = null;
let countdownTimer = null;
let history = loadJSON(HISTORY_FILE);
let favorites = loadJSON(FAVORITES_FILE, []);
let recentSearches = loadJSON(RECENT_FILE, []);
let trending = loadJSON(TRENDING_FILE, {});
let scoring = null;
let stats = { totalPlayed: history.length, startedAt: Date.now() };
const adminTokens = new Map();

const AVG_SONG_DURATION = 4 * 60 * 1000;
const DEFAULTS = { minDuration: 120, maxDuration: 720 };

// ===== TRENDING =====
function saveTrending() { saveJSON(TRENDING_FILE, trending); }

function trackReservation(videoId, title) {
  if (!videoId) return;
  if (!trending[videoId]) {
    trending[videoId] = {
      videoId,
      title: String(title || 'YouTube Video').substring(0, 120),
      count: 0,
      firstPlayed: Date.now(),
      lastPlayed: Date.now()
    };
  }
  trending[videoId].count++;
  trending[videoId].lastPlayed = Date.now();
  if (title) trending[videoId].title = String(title).substring(0, 120);
  saveTrending();
  io.emit('trending', getTrendingStats());
}

function getTrendingStats() {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const all = Object.values(trending);
  const mapEntry = t => ({
    videoId: t.videoId,
    title: t.title,
    count: t.count,
    lastPlayed: t.lastPlayed,
    thumbnail: `https://i.ytimg.com/vi/${t.videoId}/mqdefault.jpg`
  });
  return {
    session: [...all].filter(t => t.lastPlayed > stats.startedAt)
      .sort((a, b) => b.count - a.count).slice(0, 10).map(mapEntry),
    today: [...all].filter(t => t.lastPlayed > dayAgo)
      .sort((a, b) => b.count - a.count).slice(0, 10).map(mapEntry),
    allTime: [...all].sort((a, b) => b.count - a.count).slice(0, 10).map(mapEntry)
  };
}

// ===== RECENT =====
function pushRecentSearch(query, singer) {
  const clean = String(query || '').trim().toLowerCase().substring(0, 80);
  if (!clean) return;
  recentSearches = recentSearches.filter(r => r.query !== clean);
  recentSearches.unshift({
    query: clean,
    singer: String(singer || 'Guest').substring(0, 30),
    at: Date.now()
  });
  recentSearches = recentSearches.slice(0, 30);
  saveJSON(RECENT_FILE, recentSearches);
  io.emit('recentSearches', recentSearches);
}

// ===== SINGERS / WAIT =====
function countUniqueSingers() {
  const singers = new Set();
  if (nowPlaying) singers.add(nowPlaying.singer.toLowerCase());
  queue.forEach(q => singers.add(q.singer.toLowerCase()));
  return singers.size;
}

function estimateWaitTime(position) { return position * AVG_SONG_DURATION; }

function formatWait(ms) {
  if (ms <= 0) return 'Susunod na';
  const mins = Math.round(ms / 60000);
  if (mins < 1) return '< 1 min';
  if (mins === 1) return '~1 min';
  if (mins < 60) return '~' + mins + ' min';
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return '~' + hrs + 'h ' + rem + 'm';
}

// ===== HD CHECK =====
async function checkMaxRes(videoId) {
  const cached = hdCache.get(videoId);
  if (cached && Date.now() - cached.at < HD_CACHE_TTL) return cached.hd;
  try {
    const r = await fetch(
      `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      { method: 'HEAD', signal: AbortSignal.timeout(2500) }
    );
    const hd = r.ok;
    hdCache.set(videoId, { hd, at: Date.now() });
    return hd;
  } catch { return null; }
}

async function batchCheckHD(videos, maxConcurrent = 6) {
  const results = [];
  for (let i = 0; i < videos.length; i += maxConcurrent) {
    const chunk = videos.slice(i, i + maxConcurrent);
    const chunkResults = await Promise.all(
      chunk.map(async v => ({ ...v, isHD: await checkMaxRes(v.videoId) }))
    );
    results.push(...chunkResults);
  }
  return results;
}

// ===== SEARCH INVIDIOUS =====
async function searchInvidiousKaraoke(query) {
  const kq = `${query} karaoke`;
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(kq)}&type=video`;
      const r = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'Accept': 'application/json' }
      });
      if (!r.ok) continue;
      const data = await r.json();
      const raw = data
        .filter(v => v.type === 'video' && v.videoId)
        .map(v => ({
          videoId: v.videoId,
          title: v.title || '',
          author: v.author || '',
          duration: v.lengthSeconds || 0,
          thumbnail: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
          views: v.viewCount || 0
        }));
      const karaokeOnly = raw
        .filter(v => isKaraokeTitle(v.title))
        .map(v => ({ ...v, karaokeScore: karaokeScore(v.title) }))
        .sort((a, b) => b.karaokeScore - a.karaokeScore)
        .slice(0, 25);
      if (karaokeOnly.length > 0) {
        console.log(`✓ Karaoke via Invidious (${instance}): ${karaokeOnly.length}`);
        return karaokeOnly;
      }
    } catch { continue; }
  }
  return null;
}

// ===== SEARCH PIPED =====
async function searchPipedKaraoke(query) {
  const kq = `${query} karaoke`;
  for (const instance of PIPED_INSTANCES) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(kq)}&filter=videos`;
      const r = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'Accept': 'application/json' }
      });
      if (!r.ok) continue;
      const data = await r.json();
      if (!data.items || !Array.isArray(data.items)) continue;
      const raw = data.items
        .filter(v => v.url && v.url.includes('watch?v='))
        .map(v => {
          const videoId = v.url.split('v=')[1]?.split('&')[0];
          return {
            videoId,
            title: v.title || '',
            author: v.uploaderName || '',
            duration: v.duration || 0,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            views: v.views || 0
          };
        })
        .filter(v => v.videoId);
      const karaokeOnly = raw
        .filter(v => isKaraokeTitle(v.title))
        .map(v => ({ ...v, karaokeScore: karaokeScore(v.title) }))
        .sort((a, b) => b.karaokeScore - a.karaokeScore)
        .slice(0, 25);
      if (karaokeOnly.length > 0) {
        console.log(`✓ Karaoke via Piped (${instance}): ${karaokeOnly.length}`);
        return karaokeOnly;
      }
    } catch { continue; }
  }
  return null;
}

// ===== API: INFO =====
app.get('/api/info', (req, res) => {
  const frontendBase = process.env.FRONTEND_URL?.split(',')[0]?.trim()
    || req.headers.origin
    || `http://localhost:${PORT}`;

  res.json({
    frontendBase,
    hostUrl: `${frontendBase}/host.html`,
    remoteUrl: `${frontendBase}/remote.html`,
    backendUrl: req.protocol + '://' + req.get('host')
  });
});

// ===== API: YT INFO =====
app.get('/api/yt-info/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  if (!/^[\w-]{11}$/.test(videoId))
    return res.status(400).json({ error: 'Invalid ID' });

  let title = 'YouTube Video';
  let author = '';
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) {
      const data = await r.json();
      title = data.title || title;
      author = data.author_name || '';
    }
  } catch {}

  const isHD = await checkMaxRes(videoId);
  res.json({
    videoId, title, author,
    isHD: isHD === true,
    titleHD: hasHDKeyword(title),
    thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
  });
});

// ===== API: SEARCH =====
app.get('/api/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  const hdOnly = req.query.hd === '1' || req.query.hd === 'true';
  const minDuration = Math.max(0, parseInt(req.query.min) || DEFAULTS.minDuration);
  const maxDuration = Math.max(0, parseInt(req.query.max) || DEFAULTS.maxDuration);
  const filterChannels = req.query.channels !== '0';

  if (!query || query.length < 2)
    return res.json({ results: [], cached: false });

  const cacheKey = `k:${hdOnly ? 'hd:' : ''}${filterChannels ? 'ch:' : ''}${minDuration}-${maxDuration}:${query.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return res.json({ results: cached.results, cached: true, hdOnly, minDuration, maxDuration, filterChannels });
  }

  let results = await searchInvidiousKaraoke(query);
  if (!results) results = await searchPipedKaraoke(query);

  if (!results || results.length === 0) {
    return res.json({
      results: [],
      error: 'Walang karaoke version na nakita. Subukan ibang spelling.',
      hdOnly, minDuration, maxDuration, filterChannels
    });
  }

  if (filterChannels) {
    results = results.filter(v => !isBlockedChannel(v.author));
    results = results.map(v => ({ ...v, channelScore: channelScore(v.author) }));
  } else {
    results = results.map(v => ({ ...v, channelScore: 0 }));
  }

  const beforeDur = results.length;
  results = results.filter(v => durationInRange(v.duration, minDuration, maxDuration));

  if (results.length === 0 && beforeDur > 0) {
    return res.json({
      results: [],
      error: `Walang karaoke sa ${formatRange(minDuration, maxDuration)}. Subukan ibang range.`,
      hdOnly, minDuration, maxDuration, filterChannels
    });
  }

  results = results.map(v => ({ ...v, durationScore: durationScore(v.duration) }));
  results = results.map(v => ({
    ...v,
    titleHD: hasHDKeyword(v.title),
    hdScore: hdScore(v.title)
  }));

  if (hdOnly) {
    results = await batchCheckHD(results);
    results = results.map(v => ({ ...v, isHD: v.isHD === true || v.titleHD === true }));
    results = results.filter(v => v.isHD === true);

    if (results.length === 0) {
      return res.json({
        results: [],
        error: 'Walang HD karaoke sa range na ito. Subukan i-off ang HD.',
        hdOnly, minDuration, maxDuration, filterChannels
      });
    }
  } else {
    results = results.map(v => ({ ...v, isHD: v.titleHD }));
  }

  results = results.map(v => ({
    ...v,
    trendingCount: trending[v.videoId]?.count || 0
  }));

  results.sort((a, b) => {
    const trend = (b.trendingCount || 0) - (a.trendingCount || 0);
    if (trend !== 0) return trend;
    const ch = (b.channelScore || 0) - (a.channelScore || 0);
    if (ch !== 0) return ch;
    const hd = (b.hdScore || 0) - (a.hdScore || 0);
    if (hd !== 0) return hd;
    const dur = (b.durationScore || 0) - (a.durationScore || 0);
    if (dur !== 0) return dur;
    return (b.karaokeScore || 0) - (a.karaokeScore || 0);
  });

  searchCache.set(cacheKey, { results, at: Date.now() });
  if (searchCache.size > 50) {
    const entries = [...searchCache.entries()].sort((a, b) => a[1].at - b[1].at);
    entries.slice(0, 20).forEach(([k]) => searchCache.delete(k));
  }

  res.json({ results, cached: false, hdOnly, minDuration, maxDuration, filterChannels });
});

// ===== API: HISTORY =====
app.get('/api/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);
  res.json(history.slice(-limit).reverse());
});

// ===== API: LEADERBOARD =====
app.get('/api/leaderboard', (req, res) => {
  const bySinger = {};
  history.forEach(h => {
    if (!h.score) return;
    if (!bySinger[h.singer]) bySinger[h.singer] = { singer: h.singer, scores: [], count: 0 };
    bySinger[h.singer].scores.push(h.score);
    bySinger[h.singer].count++;
  });
  const board = Object.values(bySinger).map(s => ({
    singer: s.singer, count: s.count,
    avgScore: s.scores.reduce((a, b) => a + b, 0) / s.scores.length,
    bestScore: Math.max(...s.scores)
  })).sort((a, b) => b.avgScore - a.avgScore).slice(0, 20);
  res.json(board);
});

// ===== API: FAVORITES =====
app.get('/api/favorites', (req, res) => res.json(favorites));

// ===== API: TRENDING =====
app.get('/api/trending', (req, res) => res.json(getTrendingStats()));

// ===== API: RECENT =====
app.get('/api/recent-searches', (req, res) => res.json(recentSearches));

// ===== ADMIN =====
function authAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  const exp = adminTokens.get(token);
  if (!exp || exp < Date.now()) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Maling password' });
  const token = crypto.randomBytes(24).toString('hex');
  adminTokens.set(token, Date.now() + 4 * 60 * 60 * 1000);
  res.json({ token });
});

app.post('/api/admin/clear-history', authAdmin, (req, res) => {
  history = []; saveJSON(HISTORY_FILE, history);
  stats.totalPlayed = 0;
  io.emit('historyCleared');
  broadcastState();
  res.json({ ok: true });
});

app.post('/api/admin/kick-all', authAdmin, (req, res) => {
  io.emit('kicked', 'Admin action');
  res.json({ ok: true });
});

app.post('/api/admin/stop', authAdmin, (req, res) => {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
  if (scoring) { clearTimeout(scoring.timer); scoring = null; }
  nowPlaying = null;
  io.emit('command', { type: 'stop' });
  broadcastState();
  res.json({ ok: true });
});

app.post('/api/admin/clear-recent', authAdmin, (req, res) => {
  recentSearches = [];
  saveJSON(RECENT_FILE, recentSearches);
  io.emit('recentSearches', []);
  res.json({ ok: true });
});

app.post('/api/admin/clear-trending', authAdmin, (req, res) => {
  trending = {};
  saveTrending();
  io.emit('trending', getTrendingStats());
  res.json({ ok: true });
});

// ===== BROADCAST =====
function broadcastState() {
  const queueWithWait = queue.map((q, i) => ({
    ...q,
    waitMs: estimateWaitTime(i),
    waitText: formatWait(estimateWaitTime(i)),
    position: i + 1
  }));

  io.emit('state', {
    queue: queueWithWait,
    nowPlaying,
    scoring: scoring ? {
      song: scoring.song,
      votesCount: scoring.scores.length,
      endsAt: scoring.endsAt
    } : null,
    stats: {
      totalPlayed: stats.totalPlayed,
      queueLength: queue.length,
      singerCount: countUniqueSingers(),
      totalWaitMs: estimateWaitTime(queue.length),
      totalWaitText: formatWait(estimateWaitTime(queue.length))
    },
    favorites: favorites.map(f => f.videoId)
  });
}

// ===== PLAY NEXT =====
function playNext() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  if (scoring) { clearTimeout(scoring.timer); scoring = null; }
  nowPlaying = queue.shift() || null;
  if (!nowPlaying) {
    broadcastState();
    io.emit('command', { type: 'idle' });
    return;
  }
  broadcastState();
  io.emit('command', { type: 'countdown', song: nowPlaying, seconds: 5 });
  let r = 5;
  countdownTimer = setInterval(() => {
    r--;
    io.emit('command', { type: 'countdownTick', seconds: r });
    if (r <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      io.emit('command', { type: 'play', song: nowPlaying });
    }
  }, 1000);
}

// ===== SCORING =====
function startScoring(song) {
  if (scoring) clearTimeout(scoring.timer);
  scoring = { song, scores: [], endsAt: Date.now() + 15000, timer: null };
  io.emit('command', { type: 'scoring', song, duration: 15 });
  broadcastState();
  scoring.timer = setTimeout(revealScore, 15000);
}

function revealScore() {
  if (!scoring) return;
  clearTimeout(scoring.timer);
  const { scores, song } = scoring;
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const histogram = Array(11).fill(0);
  scores.forEach(s => histogram[s.score]++);

  const entry = {
    singer: song.singer,
    title: song.title,
    videoId: song.videoId,
    score: Math.round(avg * 10) / 10,
    votes: scores.length,
    playedAt: Date.now()
  };
  history.push(entry);
  saveJSON(HISTORY_FILE, history);
  stats.totalPlayed = history.length;

  io.emit('command', {
    type: 'scoreReveal',
    singer: song.singer,
    title: song.title,
    score: entry.score,
    votes: scores.length,
    histogram
  });
  broadcastState();
  scoring = null;
  setTimeout(() => playNext(), 5000);
}

// ===== SOCKET =====
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, 'Total:', io.engine.clientsCount);

  socket.emit('state', {
    queue: [],
    nowPlaying,
    stats: {
      totalPlayed: stats.totalPlayed,
      queueLength: queue.length,
      singerCount: countUniqueSingers()
    },
    favorites: favorites.map(f => f.videoId)
  });
  socket.emit('recentSearches', recentSearches);
  socket.emit('trending', getTrendingStats());
  broadcastState();

  socket.on('addSong', ({ videoId, singer, title, searchQuery }) => {
    const vid = parseYouTubeUrl(videoId) || videoId;
    if (!vid || !/^[\w-]{11}$/.test(vid))
      return socket.emit('error', 'Hindi valid na YouTube link');

    const s = String(singer || 'Guest').substring(0, 30).trim() || 'Guest';

    if (queue.some(q => q.videoId === vid && q.singer === s))
      return socket.emit('error', 'Naka-reserve na ang kantang ito');

    trackReservation(vid, title);
    if (searchQuery) pushRecentSearch(searchQuery, s);

    queue.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      videoId: vid,
      title: String(title || 'YouTube Video').substring(0, 120),
      singer: s,
      reservedAt: Date.now()
    });

    if (!nowPlaying && !countdownTimer && !scoring) playNext();
    else broadcastState();
  });

  socket.on('removeSong', (id) => {
    queue = queue.filter(s => s.id !== id);
    broadcastState();
  });

  socket.on('moveSong', ({ id, direction }) => {
    const i = queue.findIndex(s => s.id === id);
    if (i < 0) return;
    const j = direction === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= queue.length) return;
    [queue[i], queue[j]] = [queue[j], queue[i]];
    broadcastState();
  });

  socket.on('toggleFavorite', ({ videoId, title }) => {
    const idx = favorites.findIndex(f => f.videoId === videoId);
    if (idx >= 0) favorites.splice(idx, 1);
    else favorites.push({
      videoId,
      title: String(title || 'YouTube Video').substring(0, 120),
      addedAt: Date.now()
    });
    saveJSON(FAVORITES_FILE, favorites);
    broadcastState();
  });

  socket.on('submitScore', ({ score, voterId }) => {
    if (!scoring) return;
    const n = Number(score);
    if (!n || n < 1 || n > 10) return;
    const vid = String(voterId || 'anon').substring(0, 40);
    if (scoring.scores.some(s => s.voterId === vid))
      return socket.emit('error', 'Naka-vote ka na');
    scoring.scores.push({ voterId: vid, score: n, at: Date.now() });
    broadcastState();
  });

  socket.on('skip', playNext);
  socket.on('stop', () => {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = null;
    if (scoring) { clearTimeout(scoring.timer); scoring = null; }
    nowPlaying = null;
    io.emit('command', { type: 'stop' });
    broadcastState();
  });
  socket.on('pause', () => io.emit('command', { type: 'pause' }));
  socket.on('resume', () => io.emit('command', { type: 'resume' }));
  socket.on('seek', s => io.emit('command', { type: 'seek', seconds: Number(s) || 0 }));
  socket.on('volume', v => io.emit('command', {
    type: 'volume',
    value: Math.max(0, Math.min(100, Number(v) || 0))
  }));

  socket.on('songEnded', () => {
    if (!nowPlaying) return playNext();
    const finished = nowPlaying;
    nowPlaying = null;
    broadcastState();
    startScoring(finished);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id, 'Total:', io.engine.clientsCount);
  });
});

// ===== START =====
server.listen(PORT, () => {
  console.log('');
  console.log('  🎤  VIDEoke BACKEND — Socket.IO Server');
  console.log('  ═══════════════════════════════════════════════');
  console.log('  🚀  Port:         ' + PORT);
  console.log('  🌐  Frontend URL: ' + FRONTEND_URL);
  console.log('  🔐  Admin pass:   ' + ADMIN_PASSWORD);
  console.log('  🎵  History:      ' + history.length);
  console.log('');
});