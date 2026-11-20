/* App-Dateien sind versionsabhängig, Nutzerdaten werden ausdrücklich NICHT gecacht oder gelöscht. */
const CACHE_NAME = 'kraftlog-offline-v2';
const ASSETS = ['./', './index.html', './app.css?v=2', './app.js?v=2', './cloud.js?v=2', './cloud-config.js?v=2', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kraftlog-offline-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Netzwerk zuerst: nach GitHub-Update neue Version laden. Offline: Cache-Fallback.
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html'))));
});
