const CACHE_NAME = 'kw8-palestra-v3';
const urlsToCache = [
  // Non precache '/' per evitare HTML obsoleto
  '/manifest.json',
  '/images/logo.png',
  '/images/logopagina.PNG'
];

// Install event
self.addEventListener('install', (event) => {
  // Aggiorna subito all'ultima versione
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Non cache-are chiamate API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  // Network-first per la root per evitare vecchi index.html
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first per asset statici
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  // Prendi controllo immediato dei client
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
