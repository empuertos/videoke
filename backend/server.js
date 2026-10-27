// =====================================================
// VIDEOKE YT — Multi-tenant backend (hardened v3.2)
// Changes from v3.1:
//   • FIX #3 — keep adminPasswordEnc across restarts
//   • FIX #4 — rate limits on /api/host/verify,
//              /api/verify-party, /api/party
//   • FIX #5 — proactive tokenIndex eviction
//   • FIX #6 — persistSoon() in startNext()
// =====================================================
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const crypto     = require('crypto');
const fs         = require('fs');
const path       = require('path');
const helmet     = require('helmet');
const compression= require('compression');

// ---------- CONFIG ----------
const PORT           = process.env.PORT || 3000;
const DATA_DIR       = process.env.DATA_DIR || path.join(__dirname, 'data');
const FRONTEND_URL   = process.env.FRONTEND_URL || '*';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_TTL_MS   = 24 * 60 * 60 * 1000;
const MAX_SESSIONS   = 300;
const MAX_QUEUE      = 50;
const MAX_HISTORY    = 200;
const PARTY_CHARS    = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- UTILS ----------
const now     = () => Date.now();
const genCode = (len, abc = PARTY_CHARS) => {
  const b = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += abc[b[i] % abc.length];
  return s;
};
const hashPw   = (pw) => crypto.createHash('sha256').update(String(pw)).digest('hex');
const safeEq   = (a, b) => {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};
const clamp    = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const cleanStr = (s, max) => String(s ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);

// ---------- ADMIN PASSWORD ENCRYPTION (at rest) ----------
const SECRET_FILE = path.join(DATA_DIR, '.secret');
let ENC_KEY;
try {
  if (process.env.ADMIN_SECRET) {
    ENC_KEY = crypto.createHash('sha256').update(process.env.ADMIN_SECRET).digest();
  } else if (fs.existsSync(SECRET_FILE)) {
    ENC_KEY = fs.readFileSync(SECRET_FILE);
  } else {
    ENC_KEY = crypto.randomBytes(32);
    fs.writeFileSync(SECRET_FILE, ENC_KEY, { mode: 0o600 });
  }
} catch {
  ENC_KEY = crypto.createHash('sha256').update('fallback-key').digest();
}

function encryptPw(plain) {
  const iv = crypto.randomBytes(12);
  const c  = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const e  = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), e]).toString('base64');
}
function decryptPw(b64) {
  try {
    const b = Buffer.from(b64, 'base64');
    const d = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return d.update(b.subarray(28)) + d.final('utf8');
  } catch { return null; }
}

// ---------- EXPRESS + SOCKET.IO ----------
const app    = express();
const server = http.createServer(app);

const allowedOrigins = FRONTEND_URL === '*'
  ? true
  : FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins === true) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '64kb' }));

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  transports: ['polling', 'websocket'],
});

// ---------- SESSION STORE ----------
const sessions   = new Map();
const partyIndex = new Map();
const hostIndex  = new Map();
const tokenIndex = new Map();

// GLOBAL ANALYTICS
const analytics = {
  startedAt: now(),
  totalPartiesAllTime: 0,
  totalPartiesToday: 0,
  todayDate: new Date().toISOString().slice(0, 10),
  peakOnlineToday: 0,
  peakOnlineAllTime: 0,
  uniqueVisitors: new Set(),
};

function rolloverDay() {
  const t = new Date().toISOString().slice(0, 10);
  if (analytics.todayDate !== t) {
    analytics.todayDate = t;
    analytics.totalPartiesToday = 0;
    analytics.peakOnlineToday = 0;
  }
}

function countOnlineInParties() {
  let n = 0;
  for (const [, sock] of io.of('/').sockets) {
    if (sock.data.sessionId) n++;
  }
  return n;
}

function getGlobalStats() {
  rolloverDay();
  const onlineNow = countOnlineInParties();
  if (onlineNow > analytics.peakOnlineToday) analytics.peakOnlineToday = onlineNow;
  if (onlineNow > analytics.peakOnlineAllTime) analytics.peakOnlineAllTime = onlineNow;
  return {
    onlineNow,
    activeParties: sessions.size,
    partiesToday: analytics.totalPartiesToday,
    partiesAllTime: analytics.totalPartiesAllTime,
    uniqueVisitors: analytics.uniqueVisitors.size,
    peakOnlineToday: analytics.peakOnlineToday,
    peakOnlineAllTime: analytics.peakOnlineAllTime,
    uptimeSeconds: Math.floor((now() - analytics.startedAt) / 1000),
  };
}

function broadcastStats() {
  try { io.emit('globalStats', getGlobalStats()); } catch (e) {}
}

const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
let saveTimer = null;
function persistSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; persistNow(); }, 1500);
}
function persistNow() {
  try {
    const out = {};
    for (const [id, s] of sessions) {
      out[id] = {
        id: s.id, hostCode: s.hostCode, partyCode: s.partyCode,
        adminPasswordHash: s.adminPasswordHash,
        adminPasswordEnc:  s.adminPasswordEnc,
        createdAt: s.createdAt, lastActivity: s.lastActivity,
        queue: s.queue, nowPlaying: s.nowPlaying, nextId: s.nextId,
        history: s.history, failedVideos: s.failedVideos, favorites: s.favorites,
      };
    }
    const tmp = SESSIONS_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(out));
    fs.renameSync(tmp, SESSIONS_FILE);
  } catch (e) { console.warn('[persist]', e.message); }
}
function loadSessions() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    for (const [id, r] of Object.entries(raw)) {
      const plain = r.adminPasswordEnc ? decryptPw(r.adminPasswordEnc) : null;
      const s = {
        ...r,
        // FIX #3: keep adminPasswordEnc so the next persistNow() doesn't
        // write `undefined`. If missing (older data), re-encrypt.
        adminPasswordEnc: r.adminPasswordEnc || (plain ? encryptPw(plain) : null),
        adminPasswordPlain: plain,
        connectedHosts: 0,
        connectedGuests: 0,
      };
      sessions.set(id, s);
      partyIndex.set(s.partyCode, id);
      hostIndex.set(s.hostCode, id);
    }
    console.log(`✓ Loaded ${sessions.size} session(s)`);
  } catch (e) { console.warn('[load]', e.message); }
}

function newSession() {
  if (sessions.size >= MAX_SESSIONS) throw new Error('Server is full. Try again later.');
  let partyCode, guard = 0;
  do { partyCode = genCode(6); } while (partyIndex.has(partyCode) && ++guard < 1000);
  const hostCode      = genCode(20, 'abcdefghijklmnopqrstuvwxyz0123456789');
  const adminPassword = genCode(8);
  const id            = crypto.randomUUID();
  const s = {
    id, hostCode, partyCode,
    adminPasswordHash:  hashPw(adminPassword),
    adminPasswordPlain: adminPassword,
    adminPasswordEnc:   encryptPw(adminPassword),
    createdAt: now(), lastActivity: now(),
    queue: [], nowPlaying: null, nextId: 1,
    history: [], failedVideos: [], favorites: [],
    connectedHosts: 0, connectedGuests: 0,
  };
  sessions.set(id, s);
  partyIndex.set(partyCode, id);
  hostIndex.set(hostCode, id);

  rolloverDay();
  analytics.totalPartiesAllTime++;
  analytics.totalPartiesToday++;

  persistSoon();
  broadcastStats();
  return s;
}

function endSession(s, reason = 'ended') {
  const room = 'sess:' + s.id;
  io.to(room).emit('partyChanged', { active: false });
  io.to(room).emit('sessionEnded', { reason });
  for (const [, sock] of io.of('/').sockets) {
    if (sock.data.sessionId === s.id) {
      sock.data.sessionId = null;
      sock.leave(room);
      sock.leave('host:' + s.id);
    }
  }
  for (const [tok, meta] of tokenIndex) if (meta.sessionId === s.id) tokenIndex.delete(tok);
  sessions.delete(s.id);
  partyIndex.delete(s.partyCode);
  hostIndex.delete(s.hostCode);
  persistSoon();
  broadcastStats();
}

function resolveSession({ host, party }) {
  if (host)  { const id = hostIndex.get(String(host).trim());   return id ? sessions.get(id) : null; }
  if (party) { const id = partyIndex.get(String(party).toUpperCase().trim()); return id ? sessions.get(id) : null; }
  return null;
}

function issueToken(s) {
  const t = crypto.randomBytes(24).toString('hex');
  tokenIndex.set(t, { sessionId: s.id, expiry: now() + TOKEN_TTL_MS });
  return t;
}
function verifyToken(t) {
  if (!t) return null;
  const m = tokenIndex.get(t);
  if (!m) return null;
  if (m.expiry < now()) { tokenIndex.delete(t); return null; }
  return sessions.get(m.sessionId) || null;
}

const touch = (s) => { if (s) s.lastActivity = now(); };

setInterval(() => {
  const cutoff = now() - SESSION_TTL_MS;
  for (const s of Array.from(sessions.values()))
    if (s.lastActivity < cutoff) endSession(s, 'expired');
}, 5 * 60 * 1000);

// FIX #5: proactively evict expired admin tokens (was only on lookup)
setInterval(() => {
  const t = now();
  for (const [tok, meta] of tokenIndex) {
    if (meta.expiry < t) tokenIndex.delete(tok);
  }
}, 60 * 60 * 1000);

loadSessions();

setInterval(broadcastStats, 10_000);

// ---------- RATE LIMIT ----------
const rl = new Map();
function limit(key, max, win) {
  const t = now();
  let b = rl.get(key);
  if (!b || t - b.start > win) { b = { start: t, count: 0 }; rl.set(key, b); }
  b.count++;
  return b.count <= max;
}
setInterval(() => {
  const cutoff = now() - 10 * 60 * 1000;
  for (const [k, b] of rl) if (b.start < cutoff) rl.delete(k);
}, 60 * 1000);

// ---------- YOUTUBE ----------
async function ytInfo(id) {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://youtu.be/${id}&format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return { title: d.title, author: d.author_name, thumbnail: d.thumbnail_url };
  } catch { return null; }
}
const fmtDur   = (s) => !s ? '' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const fmtViews = (v) => !v ? '' : v >= 1e9 ? (v/1e9).toFixed(1)+'B'
                    : v >= 1e6 ? (v/1e6).toFixed(1)+'M'
                    : v >= 1e3 ? Math.round(v/1e3)+'K' : String(v);

const KARAOKE_RE         = /karaoke|ktv|minus[\s-]?one|instrumental|backing[\s-]?track|sing[\s-]?along|videoke|sing[\s-]?king/i;
const KARAOKE_CHANNEL_RE = /karaoke|videoke|ktv|sing[\s-]?king|sing[\s-]?along/i;
const DUET_RE            = /\b(duet|duetto|in a duet|karaoke duet|male and female|female and male|boy and girl|girl and boy|male\+female|female\+male|feat\.|ft\.|with male|with female|with a male|with a female)\b/i;
const BLOCK_RE           = /\b(official music video|official video|music video|official audio|mtv|vma|concert|live at|live performance|live session)\b/i;

function isKaraokeVideo(title, author) {
  const text = `${title || ''} ${author || ''}`.toLowerCase();
  if (BLOCK_RE.test(text) && !/karaoke/i.test(text)) return false;
  if (KARAOKE_RE.test(text)) return true;
  if (KARAOKE_CHANNEL_RE.test(author || '')) return true;
  return false;
}
function isDuetVideo(title, author) {
  return DUET_RE.test(`${title || ''} ${author || ''}`.toLowerCase());
}

const RECOMMEND_CHIPS = [
  { emoji: '🇵🇭', label: 'OPM Hits',      query: 'OPM karaoke hits',           filter: 'karaoke' },
  { emoji: '💕', label: 'Love Songs',    query: 'love songs karaoke',         filter: 'karaoke' },
  { emoji: '👥', label: 'Duet',          query: 'duet karaoke',               filter: 'duet' },
  { emoji: '🎸', label: 'Rock Ballads',  query: 'rock ballad karaoke',        filter: 'karaoke' },
  { emoji: '🌟', label: 'Pop Hits',      query: 'pop hits karaoke',           filter: 'karaoke' },
  { emoji: '🎹', label: 'Classic Love',  query: 'classic love songs karaoke', filter: 'karaoke' },
  { emoji: '🎤', label: 'Power Ballads', query: 'power ballad karaoke',       filter: 'karaoke' },
  { emoji: '🎵', label: 'R&B Hits',      query: 'rnb karaoke',                filter: 'karaoke' },
  { emoji: '🎬', label: 'Movie Themes',  query: 'movie theme karaoke',        filter: 'karaoke' },
  { emoji: '🎄', label: 'Christmas',     query: 'christmas karaoke',          filter: 'karaoke' },
  { emoji: '🎉', label: 'Party Hits',    query: 'party karaoke hits',         filter: 'karaoke' },
  { emoji: '💔', label: 'Heartbreak',    query: 'heartbreak karaoke',         filter: 'karaoke' },
];

let recommendCache = null;
const RECOMMEND_TTL = 60 * 60 * 1000;
const searchCache   = new Map();
const SEARCH_TTL    = 5 * 60 * 1000;

async function searchYT(query, maxResults = 25) {
  const hosts = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://api.piped.private.coffee',
    'https://pipedapi.reallyaweso.me',
  ];
  for (const h of hosts) {
    try {
      const r = await fetch(`${h}/search?q=${encodeURIComponent(query)}&filter=videos`,
        { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const d = await r.json();
      if (!Array.isArray(d.items)) continue;
      const items = d.items
        .filter(it => it.type === 'stream' && it.url)
        .map(it => {
          const vid = (it.url.match(/v=([\w-]{11})/) || [])[1];
          if (!vid) return null;
          return {
            videoId: vid,
            title: it.title || '',
            author: it.uploaderName || '',
            thumbnail: it.thumbnail || `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
            durationText: fmtDur(it.duration),
            viewsText: it.views ? fmtViews(it.views) + ' views' : '',
          };
        })
        .filter(Boolean).slice(0, maxResults);
      if (items.length) return items;
    } catch (e) {}
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    try {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${key}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (r.ok) {
        const d = await r.json();
        return (d.items || []).map(it => ({
          videoId: it.id.videoId,
          title: it.snippet.title,
          author: it.snippet.channelTitle,
          thumbnail: it.snippet.thumbnails?.medium?.url || '',
          durationText: '', viewsText: '',
        }));
      }
    } catch (e) {}
  }
  return [];
}

// =====================================================
// REST — PUBLIC
// =====================================================
app.get('/', (req, res) => res.json({ ok: true, sessions: sessions.size }));
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.get('/api/stats', (req, res) => res.json(getGlobalStats()));

app.post('/api/session/create', (req, res) => {
  const ip = req.ip || 'anon';

  if (req.ip && analytics.uniqueVisitors.size < 100_000) {
    analytics.uniqueVisitors.add(req.ip);
  }

  if (!limit('create:' + ip, 5, 60_000))
    return res.status(429).json({ error: 'Too many sessions from your IP. Wait a minute.' });
  try {
    const s = newSession();
    const reqOrigin = req.get('origin');
    const base = reqOrigin && reqOrigin !== 'null'
      ? reqOrigin
      : (allowedOrigins === true ? `${req.protocol}://${req.get('host')}` : allowedOrigins[0]);
    res.json({
      sessionId: s.id,
      hostCode: s.hostCode,
      partyCode: s.partyCode,
      adminPassword: s.adminPasswordPlain,
      hostUrl:  `${base}/host?session=${encodeURIComponent(s.hostCode)}`,
      guestUrl: `${base}/remote?party=${encodeURIComponent(s.partyCode)}`,
    });
  } catch (e) { res.status(503).json({ error: e.message }); }
});

// FIX #4a: rate-limit /api/host/verify (was unlimited → code enumeration)
app.get('/api/host/verify', (req, res) => {
  if (!limit('hostverify:' + (req.ip || 'anon'), 30, 60_000))
    return res.status(429).json({ valid: false, error: 'Too many requests' });

  const s = resolveSession({ host: String(req.query.host || '').trim() });
  if (!s) return res.json({ valid: false });
  res.json({
    valid: true,
    sessionId: s.id,
    partyCode: s.partyCode,
    adminPassword: s.adminPasswordPlain,
    token: issueToken(s),
    createdAt: s.createdAt,
  });
});

// FIX #4b: rate-limit /api/verify-party (was unlimited → code brute force)
app.get('/api/verify-party', (req, res) => {
  if (!limit('verifyparty:' + (req.ip || 'anon'), 60, 60_000))
    return res.status(429).json({ valid: false, error: 'Too many requests' });

  const code = String(req.query.code || '').toUpperCase().trim();
  const s = resolveSession({ party: code });
  res.json({ valid: !!s, partyCode: s?.partyCode });
});

// FIX #4c: rate-limit /api/party
app.get('/api/party', (req, res) => {
  if (!limit('partystatus:' + (req.ip || 'anon'), 60, 60_000))
    return res.status(429).json({ active: false });

  const s = resolveSession({
    host:  String(req.query.host  || '').trim(),
    party: String(req.query.party || '').toUpperCase().trim(),
  });
  if (!s) return res.json({ active: false });
  res.json({ active: true, code: s.partyCode, queueLength: s.queue.length });
});

app.get('/api/yt-info/:videoId', async (req, res) => {
  if (!limit('ytinfo:' + (req.ip || 'anon'), 30, 60_000))
    return res.status(429).json({ error: 'Slow down.' });
  const vid = String(req.params.videoId || '');
  if (!/^[\w-]{11}$/.test(vid)) return res.status(400).json({ error: 'bad id' });
  const info = await ytInfo(vid);
  info ? res.json(info) : res.status(404).json({ error: 'not found' });
});

app.get('/api/search', async (req, res) => {
  const q      = String(req.query.q || '').trim();
  const filter = String(req.query.filter || 'karaoke').toLowerCase();
  const offset = Math.max(0, parseInt(req.query.offset) || 0);
  const limitPer = 20;

  if (q.length < 2) return res.json({ items: [], hasMore: false, offset: 0, total: 0 });
  if (!limit('search:' + (req.ip || 'anon'), 40, 60_000))
    return res.status(429).json({ error: 'Slow down. Try again in a minute.' });

  const cacheKey = `${filter}|${q.toLowerCase()}`;
  let cache = searchCache.get(cacheKey);

  if (!cache || now() - cache.ts > SEARCH_TTL) {
    const hasKaraoke = /karaoke|ktv|minus[\s-]?one|instrumental|videoke/i.test(q);
    let query = q;
    if (filter === 'duet') query = hasKaraoke ? `${q} duet` : `${q} karaoke duet`;
    else                   query = hasKaraoke ? q           : `${q} karaoke`;
    const raw = await searchYT(query, 100);
    let all = raw
      .filter(it => isKaraokeVideo(it.title, it.author))
      .map(it => ({ ...it, isDuet: isDuetVideo(it.title, it.author) }));
    if (filter === 'duet') all = all.filter(it => it.isDuet);
    cache = { all, ts: now() };
    searchCache.set(cacheKey, cache);
  }

  res.json({
    items:   cache.all.slice(offset, offset + limitPer),
    offset,
    hasMore: cache.all.length > offset + limitPer,
    total:   cache.all.length,
  });
});

app.get('/api/recommend', async (req, res) => {
  if (recommendCache && now() - recommendCache.ts < RECOMMEND_TTL)
    return res.json(recommendCache.data);

  const searches = ['OPM karaoke hits 2024', 'popular karaoke songs 2024', 'karaoke love songs', 'karaoke duet'];
  const allRaw = [];
  for (const s of searches) {
    try { const r = await searchYT(s, 20); if (Array.isArray(r)) allRaw.push(...r); } catch {}
  }
  const seen = new Set();
  const items = allRaw
    .filter(it => {
      if (!it?.videoId || seen.has(it.videoId)) return false;
      if (!isKaraokeVideo(it.title, it.author)) return false;
      seen.add(it.videoId); return true;
    })
    .map(it => ({ ...it, isDuet: isDuetVideo(it.title, it.author) }))
    .slice(0, 12);
  const data = { chips: RECOMMEND_CHIPS, items };
  recommendCache = { data, ts: now() };
  res.json(data);
});

app.get('/api/history', (req, res) => {
  const s = resolveSession({
    host:  String(req.query.host  || '').trim(),
    party: String(req.query.party || '').toUpperCase().trim(),
  });
  if (!s) return res.json([]);
  res.json(s.history.slice(0, Math.min(parseInt(req.query.limit) || 50, 100)));
});
app.get('/api/favorites', (req, res) => {
  const s = resolveSession({
    host:  String(req.query.host  || '').trim(),
    party: String(req.query.party || '').toUpperCase().trim(),
  });
  res.json(s ? s.favorites : []);
});
app.get('/api/failed-videos', (req, res) => {
  const s = resolveSession({
    host:  String(req.query.host  || '').trim(),
    party: String(req.query.party || '').toUpperCase().trim(),
  });
  res.json(s ? s.failedVideos : []);
});

// =====================================================
// ADMIN AUTH
// =====================================================
app.post('/api/admin/login', (req, res) => {
  if (!limit('adminlogin:' + (req.ip || 'anon'), 10, 60_000))
    return res.status(429).json({ error: 'Too many attempts' });

  const { host, party, password } = req.body || {};
  let s = null;
  if (host) {
    s = resolveSession({ host: String(host).trim() });
    if (!s) return res.status(401).json({ error: 'Invalid host code' });
  } else if (party && password) {
    s = resolveSession({ party: String(party).toUpperCase().trim() });
    if (!s) return res.status(401).json({ error: 'Invalid party code' });
    if (!safeEq(hashPw(password), s.adminPasswordHash))
      return res.status(401).json({ error: 'Wrong password' });
  } else {
    return res.status(400).json({ error: 'host or party+password required' });
  }
  res.json({ token: issueToken(s), partyCode: s.partyCode, sessionId: s.id });
});

function adminAuth(req, res, next) {
  const t = req.get('X-Admin-Token') || req.body?.token || req.query?.token;
  const s = verifyToken(t);
  if (!s) return res.status(401).json({ error: 'Invalid or expired token' });
  req.session = s;
  req.token = t;
  touch(s);
  next();
}

app.post('/api/admin/ping', adminAuth, (req, res) =>
  res.json({ ok: true, sessionId: req.session.id, partyCode: req.session.partyCode }));

app.post('/api/admin/logout', adminAuth, (req, res) => {
  tokenIndex.delete(req.token);
  res.json({ ok: true });
});

app.post('/api/admin/end-party', adminAuth, (req, res) => {
  endSession(req.session, 'ended-by-admin');
  res.json({ ok: true });
});

app.post('/api/admin/stop', adminAuth, (req, res) => {
  const s = req.session;
  if (s.nowPlaying) { addHistory(s, s.nowPlaying); s.nowPlaying = null; }
  s.queue = [];
  io.to('host:' + s.id).emit('command', { type: 'stop' });
  broadcast(s);
  persistSoon();
  res.json({ ok: true });
});

app.post('/api/admin/kick-all', adminAuth, (req, res) => {
  const s = req.session;
  io.to('sess:' + s.id).emit('kicked', 'Admin removed all guests.');
  for (const [, sock] of io.of('/').sockets)
    if (sock.data.sessionId === s.id && sock.data.role === 'guest') sock.disconnect(true);
  res.json({ ok: true });
});

app.post('/api/admin/clear-history', adminAuth, (req, res) => {
  req.session.history = [];
  persistSoon();
  io.to('sess:' + req.session.id).emit('historyCleared');
  res.json({ ok: true });
});

app.post('/api/admin/clear-failed', adminAuth, (req, res) => {
  req.session.failedVideos = [];
  persistSoon();
  res.json({ ok: true });
});

// =====================================================
// STATE HELPERS
// =====================================================
function buildState(s) {
  return {
    sessionId: s.id,
    partyActive: true,
    partyCode: s.partyCode,
    queue: s.queue,
    nowPlaying: s.nowPlaying,
    favorites: s.favorites,
    onlineNow: {
      hosts: s.connectedHosts,
      guests: s.connectedGuests,
      total: s.connectedHosts + s.connectedGuests,
    },
    stats: {
      queueLength: s.queue.length,
      singerCount: new Set(s.queue.map(q => q.singer)).size,
      totalWaitText: `${Math.ceil((s.queue.length + (s.nowPlaying ? 1 : 0)) * 3)} min`,
    },
  };
}
const broadcast = (s) => io.to('sess:' + s.id).emit('state', buildState(s));

function addHistory(s, item) {
  s.history.unshift({
    singer: item.singer, title: item.title, videoId: item.videoId, playedAt: now(),
  });
  s.history = s.history.slice(0, MAX_HISTORY);
  persistSoon();
}

// FIX #6: persist queue state after shift so crash between shift
// and periodic save can't replay a song
function startNext(s) {
  if (s.nowPlaying) return;
  if (!s.queue.length) {
    io.to('host:' + s.id).emit('command', { type: 'stop' });
    broadcast(s);
    persistSoon();          // FIX #6a
    return;
  }
  const next = s.queue.shift();
  s.nowPlaying = next;
  io.to('host:' + s.id).emit('command', { type: 'play', song: next });
  broadcast(s);
  persistSoon();            // FIX #6b
}

// =====================================================
// SOCKET.IO — SESSION-SCOPED
// =====================================================
io.on('connection', (socket) => {
  socket.data.sessionId = null;
  socket.data.role      = null;

  socket.on('registerHost', ({ hostCode, partyCode } = {}) => {
    let s = null, role = null;
    if (hostCode) {
      s = resolveSession({ host: String(hostCode || '').trim() });
      role = 'host';
    } else if (partyCode) {
      s = resolveSession({ party: String(partyCode || '').toUpperCase().trim() });
      role = 'display';
    }
    if (!s) return socket.emit('hostRejected', { reason: 'invalid_host' });

    socket.data.sessionId = s.id;
    socket.data.role = role;
    socket.join('sess:' + s.id);
    socket.join('host:' + s.id);
    s.connectedHosts++;
    touch(s);

    broadcast(s);
    broadcastStats();

    socket.emit('partyStatus', { active: true, code: s.partyCode });
    console.log(`[${role}] joined ${s.partyCode}`);
  });

  socket.on('joinParty', ({ code } = {}) => {
    const s = resolveSession({ party: String(code || '').toUpperCase().trim() });
    if (!s) return socket.emit('partyJoined', { ok: false, reason: 'no_party' });
    socket.data.sessionId = s.id;
    socket.data.role = 'guest';
    socket.join('sess:' + s.id);
    s.connectedGuests++;
    touch(s);

    socket.emit('partyJoined', { ok: true });
    broadcast(s);
    broadcastStats();
  });

  const withSession = (fn) => (payload) => {
    const sid = socket.data.sessionId;
    if (!sid) return;
    const s = sessions.get(sid);
    if (!s) return;
    touch(s);
    try { fn(s, payload || {}); }
    catch (e) { console.warn('[sock]', e.message); socket.emit('error', 'Action failed'); }
  };

  const requireAdmin = (s, payload) => {
    const meta = tokenIndex.get(payload?.adminToken);
    return !!meta && meta.sessionId === s.id && meta.expiry > now();
  };
  const isPlaybackController = () => socket.data.role === 'host' || socket.data.role === 'display';

  socket._addSong = { start: now(), count: 0 };
  const canAddSong = () => {
    const t = now();
    if (t - socket._addSong.start > 60_000) socket._addSong = { start: t, count: 0 };
    socket._addSong.count++;
    return socket._addSong.count <= 5;
  };

  socket.on('addSong', withSession((s, d) => {
    if (!/^[\w-]{11}$/.test(String(d.videoId || '')))
      return socket.emit('error', 'Invalid video ID');
    if (s.queue.length >= MAX_QUEUE)
      return socket.emit('error', 'Queue is full');
    if (!canAddSong())
      return socket.emit('error', 'Slow down — max 5 songs per minute');

    const singer = cleanStr(d.singer || '', 40) || 'Guest';
    const title  = cleanStr(d.title  || '', 200) || 'Unknown';
    if (s.queue.filter(q => q.singer.toLowerCase() === singer.toLowerCase()).length >= 5)
      return socket.emit('error', `"${singer}" already has 5 songs in queue`);

    s.queue.push({ id: s.nextId++, videoId: d.videoId, title, singer, addedAt: now() });
    persistSoon();
    broadcast(s);
    if (!s.nowPlaying) startNext(s);
  }));

  socket.on('removeSong', withSession((s, d) => {
    if (!requireAdmin(s, d)) return socket.emit('error', 'Admin only');
    const id = typeof d === 'object' ? d.id : d;
    const i = s.queue.findIndex(q => q.id === id);
    if (i >= 0) { s.queue.splice(i, 1); persistSoon(); broadcast(s); }
  }));

  socket.on('moveSong', withSession((s, d) => {
    if (!requireAdmin(s, d)) return socket.emit('error', 'Admin only');
    const i = s.queue.findIndex(q => q.id === d.id);
    if (i < 0) return;
    if (d.direction === 'up'   && i > 0)                [s.queue[i-1], s.queue[i]] = [s.queue[i], s.queue[i-1]];
    if (d.direction === 'down' && i < s.queue.length-1) [s.queue[i+1], s.queue[i]] = [s.queue[i], s.queue[i+1]];
    persistSoon(); broadcast(s);
  }));

  const cmd = (type) => withSession((s, d) => {
    if (!requireAdmin(s, d)) return socket.emit('error', 'Admin only');
    io.to('host:' + s.id).emit('command', { type });
  });
  socket.on('pause',  cmd('pause'));
  socket.on('resume', cmd('resume'));

  socket.on('skip', withSession((s, d) => {
    if (!requireAdmin(s, d)) return socket.emit('error', 'Admin only');
    if (s.nowPlaying) { addHistory(s, s.nowPlaying); s.nowPlaying = null; }
    startNext(s);
  }));

  socket.on('stop', withSession((s, d) => {
    if (!requireAdmin(s, d)) return socket.emit('error', 'Admin only');
    if (s.nowPlaying) { addHistory(s, s.nowPlaying); s.nowPlaying = null; }
    s.queue = [];
    io.to('host:' + s.id).emit('command', { type: 'stop' });
    broadcast(s);
    persistSoon();
  }));

  socket.on('volume', withSession((s, d) => {
    if (!requireAdmin(s, d)) return socket.emit('error', 'Admin only');
    const v = clamp(parseInt(d.value) || 0, 0, 100);
    io.to('host:' + s.id).emit('command', { type: 'volume', value: v });
  }));

  socket.on('startPlaying', withSession((s, d) => {
    if (!requireAdmin(s, d)) return socket.emit('error', 'Admin only');
    startNext(s);
  }));

  socket.on('songEnded', withSession((s) => {
    if (!isPlaybackController()) return;
    if (s.nowPlaying) { addHistory(s, s.nowPlaying); s.nowPlaying = null; }
    startNext(s);
  }));

  socket.on('videoFailed', withSession((s, d) => {
    if (!isPlaybackController()) return;
    if (!/^[\w-]{11}$/.test(String(d.videoId || ''))) return;
    s.failedVideos.push({ videoId: d.videoId, title: cleanStr(d.title || '', 200), at: now() });
    s.failedVideos = s.failedVideos.slice(-100);
    if (s.nowPlaying?.videoId === d.videoId) s.nowPlaying = null;
    persistSoon();
    startNext(s);
  }));

  socket.on('toggleFavorite', withSession((s, d) => {
    if (!/^[\w-]{11}$/.test(String(d.videoId || ''))) return;
    const i = s.favorites.findIndex(f => f.videoId === d.videoId);
    if (i >= 0) s.favorites.splice(i, 1);
    else s.favorites.push({ videoId: d.videoId, title: cleanStr(d.title || '', 200) });
    persistSoon();
    broadcast(s);
  }));

  socket.on('disconnect', () => {
    const sid = socket.data.sessionId;
    if (!sid) return;
    const s = sessions.get(sid);
    if (!s) return;
    if (socket.data.role === 'host' || socket.data.role === 'display')
      s.connectedHosts = Math.max(0, s.connectedHosts - 1);
    else
      s.connectedGuests = Math.max(0, s.connectedGuests - 1);

    broadcast(s);
    broadcastStats();
  });
});

// ---------- GRACEFUL SHUTDOWN ----------
function shutdown(sig) {
  console.log(`${sig} received — flushing and exiting`);
  try { persistNow(); } catch {}
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));

server.listen(PORT, () => console.log(`🎤 Videoke backend listening on :${PORT}`));
