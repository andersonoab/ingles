const CACHE_NAME = "lousa-fluencia-ponte-v9-5";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data/frases.json",
  "./data/frases_dicionario.txt",
  "./data/frases_dicionario.js",
  "./data/dicionario_exemplo.txt",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Recursos externos (ex.: Google Fonts) passam direto, sem cache do app.
  if (url.origin !== self.location.origin) return;

  // Network-first: busca sempre a versão atual; usa o cache só quando offline.
  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match("./index.html")))
  );
});
