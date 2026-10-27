// ============================================================
// i18n — English only (v3.4)
// The app is English-only. This file is kept so existing
// `data-i18n` attributes still work if loaded elsewhere.
// No Filipino translations — both keys mirror English.
// ============================================================
window.I18N = {
  en: {
    tagline: 'Professional Karaoke',
    tapStart: 'TAP TO START',
    scanToJoin: 'SCAN TO JOIN',
    scanHint: 'Scan with your phone camera',
    readyToSing: 'Ready to Sing',
    noQueue: 'Nothing playing',
    nowSinging: 'NOW SINGING',
    upNext: 'UP NEXT',
    yourName: 'Your Name',
    namePlaceholder: 'e.g. Juan Dela Cruz',
    reserved: 'Reserved',
    history: 'History',
    top: 'Top',
    favorites: 'Favs',
    pause: 'Pause',
    play: 'Play',
    skip: 'Skip',
    stop: 'Stop',
    rateNow: 'RATE THE PERFORMANCE',
    tapToVote: 'Tap a score from 1 to 10',
    votesReceived: 'votes',
    score: 'SCORE',
    connected: 'Connected',
    disconnected: 'Disconnected',
    voted: 'You voted'
  },
  // Alias — same English, prevents anything breaking if `fil` key is requested
  get fil() { return this.en; }
};

// Default language: English
window.t = function(k) {
  return window.I18N.en[k] || k;
};

window.setLang = function() {};   // no-op
window.getLang = function() { return 'en'; };

// Ensure localStorage is clean
localStorage.setItem('videoke:lang', 'en');