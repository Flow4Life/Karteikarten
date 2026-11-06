// Service Worker: macht die App offline nutzbar
const CACHE = 'kk-v1';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Firebase-Datenverkehr nicht anfassen (Firestore kümmert sich selbst um Offline)
  if (url.hostname.includes('googleapis.com') && !url.hostname.startsWith('fonts')) return;
  const sameOrigin = url.origin === location.origin;
  const cacheable = sameOrigin || url.hostname === 'www.gstatic.com' || url.hostname.startsWith('fonts.');
  if (!cacheable) return;
  // Netzwerk zuerst (für Updates), bei Offline aus dem Cache
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
