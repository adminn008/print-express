const CACHE_NAME = 'welgrafx-pwa-v2';

// Usa caminhos relativos para funcionar em qualquer subpasta do GitHub Pages
const STATIC_ASSETS = [
  './',
  './index.html',
  './impressao.html',
  './documentos.html',
  './digitalizacao.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Não intercepta envios POST, FormSubmit ou WhatsApp
  if (
    request.method !== 'GET' ||
    request.url.includes('formsubmit.co') ||
    request.url.includes('api.whatsapp.com') ||
    request.url.includes('wa.me')
  ) {
    return;
  }

  // Network First para HTMLs
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request) || caches.match('./index.html'))
    );
    return;
  }

  // Cache First para estáticos
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request);
    })
  );
});
