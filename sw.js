/* Service worker — cachea los archivos propios de la app para que funcione
   offline una vez instalada. Las fuentes de Google y KaTeX (CDN) NO se
   cachean a propósito: la app ya tiene fallback a texto/fuente de sistema
   cuando no hay red (ver js/utils.js), así que no vale la pena la
   complejidad de cachearlas también acá.
   Subí este número cada vez que cambies algo (fuerza a los navegadores
   que ya tenían la app instalada a limpiar la copia vieja). */
const CACHE = "calc-elementos-maquinas-v3";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./js/utils.js",
  "./js/ajustes.js",
  "./js/correas.js",
  "./js/rodamientos.js",
  "./js/data/tolerancias.js",
  "./js/data/correas-tabla.js",
  "./js/data/rodamientos-tabla.js",
  "./img/grafico-seccion-correa.png",
  "./img/grafico-seccion-dunlop.png",
  "./img/icons/icon-192.png",
  "./img/icons/icon-512.png"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.addAll(ARCHIVOS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(
        nombres.filter(function (n) { return n !== CACHE; })
          .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Red primero para los archivos propios: si hay internet, siempre se ve
// la versión más nueva al toque (nada de esperar a la "próxima visita"
// como con stale-while-revalidate, que generó confusión). Si falla la
// red (sin conexión), recién ahí se usa lo que haya en caché — así la
// app sigue funcionando offline, que es para lo que existe el caché.
// Para todo lo demás (CDN de fuentes/KaTeX) se deja pasar directo a la
// red sin interceptar, así el fallback ya existente en la app sigue
// funcionando igual que siempre.
self.addEventListener("fetch", function (evento) {
  const url = new URL(evento.request.url);
  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    fetch(evento.request).then(function (respuesta) {
      const copia = respuesta.clone();
      caches.open(CACHE).then(function (cache) { cache.put(evento.request, copia); });
      return respuesta;
    }).catch(function () {
      return caches.open(CACHE).then(function (cache) {
        return cache.match(evento.request).then(function (enCache) {
          if (enCache) return enCache;
          if (evento.request.mode === "navigate") return cache.match("./index.html");
        });
      });
    })
  );
});
