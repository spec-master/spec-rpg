// 오프라인 캐시 (GitHub Pages 등 https에서 동작). 파일 수정 시 VERSION을 올리세요.
// 전략: 같은 출처 파일은 network-first(온라인이면 항상 최신) → 실패 시 캐시(오프라인).
//       랭킹 JSON·외부 요청은 캐시하지 않음.
const VERSION = 'specrpg-v2';
const FILES = ['./', './index.html', './style.css', './manifest.webmanifest', './js/data.js', './js/savecode.js', './js/engine.js', './js/online.js', './js/story.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))); self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('leaderboard.json')) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
