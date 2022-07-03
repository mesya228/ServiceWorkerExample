const RUNTIME = 'runtime';

// Different examples, but one file, will not work in real app
const NETWORK_REQUESTS = ['only-online.js'];
const FALLBACK_REQUESTS = [
  { online: 'only-online.js', offline: 'only-offline.js' },
];

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event) => {
  const currentCaches = [RUNTIME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        cacheNames.filter((cacheName) => !currentCaches.includes(cacheName))
      )
      .then((cachesToDelete) =>
        Promise.all(
          cachesToDelete.map((cacheToDelete) => caches.delete(cacheToDelete))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        const requestUrl = event.request.url.split(event.request.referrer)[1];

        if (requestUrl && NETWORK_REQUESTS.includes(requestUrl)) {
          return;
        }

        if (
          requestUrl &&
          FALLBACK_REQUESTS.find((req) => req.online.match(requestUrl))
        ) {
          return fetchRequest(event);
        }

        return fetchRequest(event);
      })
    );
  }
});

async function fetchRequest(event) {
  return caches
    .open(RUNTIME)
    .then(async (cache) =>
      fetch(event.request).then((response) =>
        cache.put(event.request, response.clone()).then(() => response)
      )
    );
}
