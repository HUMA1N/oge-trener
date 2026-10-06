/*
 * Сервис-воркер: работа без интернета и установка как приложение.
 * При установке все файлы сайта сохраняются в кэш (список ASSETS), поэтому
 * после первого открытия тренажёр целиком работает офлайн.
 * Стратегия «сначала сеть»: при наличии связи загружается свежая версия
 * (и кэш обновляется), без связи или при очень медленной сети — из кэша.
 * Список ASSETS проверяется автотестом (tests/pwa.test.js): в нём должны быть
 * все скрипты и стили из index.html.
 */
const VERSION = 'v2';
const CACHE = 'oge-trener-' + VERSION;
const NETWORK_TIMEOUT = 4000; // мс; дольше ждать сеть нет смысла — отдаём из кэша

const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'css/style.css',
  'js/core/rng.js',
  'js/core/frac.js',
  'js/core/format.js',
  'js/core/expr.js',
  'js/core/draw.js',
  'js/core/geo.js',
  'js/core/answer.js',
  'js/tasks/registry.js',
  'js/tasks/practice.js',
  'js/tasks/t06.js',
  'js/tasks/t07.js',
  'js/tasks/t08.js',
  'js/tasks/t09.js',
  'js/tasks/t10.js',
  'js/tasks/t11.js',
  'js/tasks/t12.js',
  'js/tasks/t13.js',
  'js/tasks/t14.js',
  'js/tasks/t15.js',
  'js/tasks/t16.js',
  'js/tasks/t17.js',
  'js/tasks/t18.js',
  'js/tasks/t19.js',
  'js/tasks/t20.js',
  'js/tasks/t21.js',
  'js/tasks/t22.js',
  'js/variant.js',
  'js/stats.js',
  'js/chart.js',
  'js/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // cache: 'reload' — мимо HTTP-кэша браузера, чтобы не сохранить устаревший файл
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf('oge-trener-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function fromCache(req) {
  return caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    new Promise((resolve) => {
      let done = false;
      const finish = (r) => {
        if (!done && r) {
          done = true;
          resolve(r);
        }
      };
      // медленная сеть: через NETWORK_TIMEOUT отдаём кэш, если он есть
      const timer = setTimeout(() => fromCache(req).then(finish), NETWORK_TIMEOUT);
      fetch(req)
        .then((res) => {
          clearTimeout(timer);
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          finish(res);
        })
        .catch(() => {
          clearTimeout(timer);
          fromCache(req).then((r) => finish(r || Response.error()));
        });
    }),
  );
});
