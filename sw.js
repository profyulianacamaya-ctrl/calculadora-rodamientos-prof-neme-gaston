/* Service worker — cachea los archivos propios de la app para que funcione
   offline una vez instalada. Las fuentes de Google y KaTeX (CDN) NO se
   cachean a propósito: la app ya tiene fallback a texto/fuente de sistema
   cuando no hay red (ver js/utils.js), así que no vale la pena la
   complejidad de cachearlas también acá.
   Subí este número cada vez que cambies algo (fuerza a los navegadores
   que ya tenían la app instalada a limpiar la copia vieja). */
const CACHE = "calc-elementos-maquinas-v2";

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

// Stale-while-revalidate para los archivos propios: responde al toque con
// lo que haya en caché (rápido, funciona offline), pero en paralelo pide
// la versión de red y la deja guardada para la PRÓXIMA visita — así una
// actualización se nota sola, sin depender de acordarse de subir el
// número de versión cada vez. Para todo lo demás (CDN de fuentes/KaTeX)
// se deja pasar directo a la red sin interceptar, así el fallback ya
// existente en la app sigue funcionando igual que siempre.
self.addEventListener("fetch", function (evento) {
  const url = new URL(evento.request.url);
  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(evento.request).then(function (enCache) {
        const actualizar = fetch(evento.request).then(function (respuesta) {
          cache.put(evento.request, respuesta.clone());
          return respuesta;
        }).catch(function () {
          if (!enCache && evento.request.mode === "navigate") return cache.match("./index.html");
        });
        return enCache || actualizar;
      });
    })
  );
});
