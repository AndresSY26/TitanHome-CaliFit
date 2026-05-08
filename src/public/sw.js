const CACHE_NAME = 'titanhome-califit-v1';
const STATIC_ASSETS = [
    '/',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Evento Install: Precarga del App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching App Shell');
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Evento Activate: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// Evento Fetch: Estrategias de Caché
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Estrategia: Network First para la API (asegurar datos frescos si hay red)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Estrategia: Cache First para imágenes externas y estáticos
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                // Solo guardamos en caché respuestas válidas o imágenes externas
                if (networkResponse.ok || event.request.url.includes('raw.githubusercontent.com')) {
                    const clonedResponse = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                }
                return networkResponse;
            });
        })
    );
});

// Evento Push: Manejo de notificaciones remotas
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'Tu misión te espera.',
        icon: data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [300, 100, 300, 100, 300]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || '🤖 Coach Titán', options)
    );
});
