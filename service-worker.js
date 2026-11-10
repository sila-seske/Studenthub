const CACHE = 'studenthub-v6';
const SHELL = ['./', './index.html', './app.js', './head.js', './pages.css', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './apple-touch-icon.png', './favicon-32.png', './og-image.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
  );
});

// ---- Web push: show alerts even when StudentHub is closed ----
self.addEventListener('push', (event) => {
  let data = { title: 'StudentHub', body: 'You have a new update.', url: './index.html#alerts' };
  try { data = { ...data, ...event.data.json() }; } catch (err) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: './icon-192.png', badge: './icon-192.png', tag: data.url, renotify: true, data: { url: data.url }
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || './index.html#alerts', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        return client.navigate(target).catch(() => {}).then(() => client.focus());
      }
    }
    return self.clients.openWindow(target);
  }));
});
