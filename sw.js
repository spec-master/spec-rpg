// 오프라인 캐시 (GitHub Pages 등 https에서 동작). 파일 수정 시 VERSION을 올리세요.
const VERSION = 'specrpg-v1';
const FILES = ['./', './index.html', './style.css', './manifest.webmanifest', './js/data.js', './js/engine.js', './js/story.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
