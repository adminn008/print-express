const CACHE_NAME = 'welgrafx-pwa-v1';
const BASE_PATH = '/print-express';

// Apenas recursos estáticos e essenciais para navegação rápida do PWA
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/impressao.html`,
  `${BASE_PATH}/documentos.html`,
  `${BASE_PATH}/digitalizacao.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`,
  `${BASE_PATH}/icons/apple-touch-icon.png`
];

// Instalação do Service Worker e Cache dos arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Limpeza de caches antigos na ativação de novas versões
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

// Estratégia de Fetch Segura: Network First para formulários/dados dinâmicos, Cache First com validação para estáticos
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // REGRA DE SEGURANÇA: Não interceptar nem armazenar POST, FormSubmit, WhatsApp, ou apis de terceiros
  if (
    request.method !== 'GET' ||
    request.url.includes('formsubmit.co') ||
    request.url.includes('api.whatsapp.com') ||
    request.url.includes('wa.me') ||
    !request.url.startsWith(self.location.origin)
  ) {
    return; // Deixa o navegador processar normalmente pela rede
  }

  // Estratégia Network First para HTMLs, garantindo sempre a versão mais atual
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request) || caches.match(`${BASE_PATH}/index.html`))
    );
    return;
  }

  // Cache First para imagens e assets do app
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Atualiza o cache em segundo plano (Stale-While-Revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {/* offline fallback */});
        return cachedResponse;
      }
      return fetch(request);
    })
  );
});
