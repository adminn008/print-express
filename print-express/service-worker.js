const CACHE_NAME = 'welgrafx-v1';
const ASSETS_TO_CACHE = [
  '/print-express/app.html',
  '/print-express/impressao.html',
  '/print-express/documentos.html',
  '/print-express/curriculo.html',
  '/print-express/digitalizacao.html',
  '/print-express/manifest.json',
  '/print-express/images/icon-192.png',
  '/print-express/images/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
