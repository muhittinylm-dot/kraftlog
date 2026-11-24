/* App-Dateien sind versionsabhängig, Nutzerdaten werden ausdrücklich NICHT gecacht oder gelöscht. */
const CACHE_NAME = 'kraftlog-offline-v70';
const ASSETS = ['./', './index.html', './app.css?v=70', './app.js?v=70', './cloud.js?v=70', './cloud-config.js?v=70', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kraftlog-offline-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const name=url.pathname.split('/').pop() || 'index.html';
  const allowed=new Set(['index.html','app.css','app.js','cloud.js','cloud-config.js','manifest.webmanifest','icon-192.png','icon-512.png','sw.js']);
  if (!allowed.has(name)) return; // Keine unbekannten URLs oder privaten Dateien cachen.
  if(url.search && !/^\?v=70$/.test(url.search)) return;
  // Netzwerk zuerst: nach GitHub-Update neue Version laden. Offline: Cache-Fallback.
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
