// ============================================================
// i18n — English only (v3.4)
// English-only build. Kept so existing data-i18n attributes work.
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
  get fil() { return this.en; }
};

window.t = function(k) {
  return window.I18N.en[k] || k;
};
window.setLang = function() {};
window.getLang = function() { return 'en'; };

localStorage.setItem('videoke:lang', 'en');