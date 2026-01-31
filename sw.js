/* eslint-disable no-undef */
// A linha abaixo é obrigatória para o Vite PWA injetar os arquivos do build
self.__WB_MANIFEST;

const CACHE_NAME = 'crie-school-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Ignora erros se algum arquivo falhar para não travar a instalação
      return cache.addAll(ASSETS).catch(err => console.error('Cache erro:', err));
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
  // Estratégia: Network first, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
