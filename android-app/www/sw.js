/* Service worker: caches ONLY the app's own shell.
 *
 * Deliberately conservative. Video streams must never be cached (they are
 * live and enormous), and must not even be intercepted: hls.js relies on
 * byte-range requests and progressive responses that a naive cache handler
 * would quietly break. So anything not in SHELL is left entirely alone —
 * we do not call respondWith at all, and the browser behaves as if no
 * service worker existed.
 */
const CACHE = 'iptv-shell-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './example.m3u',
  './vendor/hls.min.js', './vendor/mpegts.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-64.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // add() individually: addAll() rejects the whole install if one 404s
    await Promise.all(SHELL.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const inShell = url =>
  url.origin === location.origin &&
  SHELL.some(p => url.pathname === new URL(p, self.registration.scope).pathname);

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).catch(() => caches.match(new URL('./index.html', self.registration.scope).pathname))
    );
    return;
  }
  if (!inShell(url)) return;              // streams and playlists: hands off
  e.respondWith((async () => {
    const hit = await caches.match(e.request);
    if (hit) return hit;                  // cache first: instant launch
    const res = await fetch(e.request);
    if (res.ok) (await caches.open(CACHE)).put(e.request, res.clone());
    return res;
  })());
});
