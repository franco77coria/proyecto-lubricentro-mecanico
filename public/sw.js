/**
 * Service worker mínimo.
 *
 * Su único trabajo es hacer la app instalable y que los assets estáticos
 * carguen al instante en visitas siguientes.
 *
 * NO cachea páginas ni respuestas de datos, a propósito. Esta versión requiere
 * internet, y un service worker que guarde pantallas es la forma más rápida de
 * que alguien vea el stock de ayer creyendo que es el de hoy, o de que una
 * orden "guardada" no exista en la base. Cuando llegue el modo sin conexión
 * de verdad, va con una cola de sincronización, no con un caché de páginas.
 */

const CACHE = "taller-estaticos-v1";

/** Solo lo inmutable: los bundles de Next llevan hash en el nombre, así que
 *  una versión nueva genera una URL nueva y nunca se sirve algo viejo. */
const CACHEABLE = [/^\/_next\/static\//, /^\/icon\//, /^\/manifest\.webmanifest$/];

self.addEventListener("install", (event) => {
  // Toma el control sin esperar a que se cierren las pestañas viejas.
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Limpia versiones anteriores del caché.
      const claves = await caches.keys();
      await Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Cualquier cosa que no sea un GET simple pasa derecho a la red.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!CACHEABLE.some((re) => re.test(url.pathname))) return;

  event.respondWith(
    (async () => {
      const cacheado = await caches.match(request);
      if (cacheado) return cacheado;

      const respuesta = await fetch(request);
      // Solo se guardan respuestas completas y exitosas: guardar un 206 o un
      // error deja el asset roto hasta que alguien limpie el caché a mano.
      if (respuesta.ok && respuesta.status === 200) {
        const cache = await caches.open(CACHE);
        cache.put(request, respuesta.clone());
      }
      return respuesta;
    })(),
  );
});
