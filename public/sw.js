// Service worker mínimo: existe solo para que el navegador ofrezca instalar
// la app. A propósito NO cachea nada, para no arriesgar servir una versión
// vieja de la aplicación.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Sin responseWith(): el navegador maneja la petición normalmente.
})
