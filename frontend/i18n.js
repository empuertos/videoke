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
  fil: {
    tagline: 'Propesyonal na Karaoke',
    tapStart: 'I-TAP PARA SIMULAN',
    scanToJoin: 'I-SCAN PARA MAKA-JOIN',
    scanHint: 'I-scan ang QR code sa kanan',
    readyToSing: 'Handa Nang Kumanta',
    noQueue: 'Walang tumutugtog',
    nowSinging: 'KUMAKANTA NGAYON',
    upNext: 'SUSUNOD',
    yourName: 'Pangalan Mo',
    namePlaceholder: 'Hal. Juan Dela Cruz',
    reserved: 'Naka-reserve',
    history: 'History',
    top: 'Top',
    favorites: 'Paborito',
    pause: 'Pause',
    play: 'Play',
    skip: 'Laktawan',
    stop: 'Itigil',
    rateNow: 'I-RATE ANG PAGKANTA',
    tapToVote: 'I-tap ang score 1-10',
    votesReceived: 'votes',
    score: 'ISKOR',
    connected: 'Konektado',
    disconnected: 'Hindi konektado',
    voted: 'Nag-vote ka ng'
  }
};

// ⭐ Default language: English
window.t = function(k) {
  const lang = localStorage.getItem('videoke:lang') || 'en';
  return (window.I18N[lang] && window.I18N[lang][k]) || k;
};

window.setLang = function(l) {
  localStorage.setItem('videoke:lang', l);
  window.dispatchEvent(new CustomEvent('langchange', { detail: l }));
};

window.getLang = function() {
  return localStorage.getItem('videoke:lang') || 'en';
};

// ⭐ Force default to English kung wala pang naka-set
if (!localStorage.getItem('videoke:lang')) {
  localStorage.setItem('videoke:lang', 'en');
}