/* Tazkiyah service worker: offline app shell.
   Bump VERSION whenever you change files so phones pick up the update. */
const VERSION = 'tazkiyah-v1';
const SHELL = [
  './', './index.html', './share.html', './manifest.json', './favicon.svg', './favicon.ico',
  './css/app.css',
  './js/config.js', './js/reminders.js', './js/lessons.js', './js/praytimes.js', './js/hijri.js',
  './js/core.js', './js/ui.js', './js/store.js', './js/card.js', './js/app.js', './js/share.js',
  './assets/icon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/apple-touch-icon.png', './assets/icons/icon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Never cache the Google Script API: always live
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  // Fonts: cache first
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const res = await fetch(e.request); if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // App files: network first (so updates show), fall back to cache offline
  e.respondWith(
    fetch(e.request).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
