const CACHE_NAME = 'welgrafx-pwa-v3';

const STATIC_ASSETS = [
  '/print-express/',
  '/print-express/index.html',
  '/print-express/impressao.html',
  '/print-express/documentos.html',
  '/print-express/digitalizacao.html',
  '/print-express/manifest.json',
  '/print-express/icons/icon-192.png',
  '/print-express/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (
    request.method !== 'GET' ||
    request.url.includes('formsubmit.co') ||
    request.url.includes('api.whatsapp.com') ||
    request.url.includes('wa.me')
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
