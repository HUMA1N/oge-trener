'use strict';
/*
 * Установка как приложение и работа без интернета: манифест, иконки и список
 * файлов, которые сервис-воркер сохраняет при установке. Если добавить новый
 * скрипт в index.html и забыть внести его в sw.js, офлайн-режим сломается —
 * этот тест не даст такое пропустить.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT } = require('./helpers/load');

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const html = read('index.html');
const sw = read('sw.js');

function assets() {
  const m = /const ASSETS = (\[[\s\S]*?\]);/.exec(sw);
  assert.ok(m, 'в sw.js нет списка ASSETS');
  return vm.runInNewContext(m[1]);
}

test('сервис-воркер: синтаксис и список файлов для офлайн-режима', () => {
  new vm.Script(sw, { filename: 'sw.js' });
  const list = assets();
  assert.equal(new Set(list).size, list.length, 'повторы в ASSETS');
  list.filter((f) => f !== './').forEach((f) => assert.ok(fs.existsSync(path.join(ROOT, f)), 'нет файла ' + f));
  const used = [];
  const re = /<(?:script|link)\b[^>]*(?:src|href)="([^"#:]+)"/g;
  let m;
  while ((m = re.exec(html))) used.push(m[1]);
  assert.ok(used.length > 20);
  used.forEach((f) => assert.ok(list.includes(f), 'файл ' + f + ' из index.html не сохраняется для офлайн-режима (добавьте в ASSETS в sw.js)'));
  assert.ok(list.includes('index.html') && list.includes('./'));
});

test('манифест: всё, что нужно для установки на телефон', () => {
  const man = JSON.parse(read('manifest.webmanifest'));
  assert.ok(man.name && man.short_name && man.short_name.length <= 12);
  assert.equal(man.display, 'standalone');
  assert.equal(man.lang, 'ru');
  assert.ok(man.start_url && man.scope);
  const sizes = man.icons.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'), 'нужны PNG-иконки 192 и 512');
  assert.ok(
    man.icons.some((i) => i.purpose === 'maskable'),
    'нужна маскируемая иконка для Android',
  );
  const list = assets();
  man.icons.forEach((i) => {
    assert.ok(fs.existsSync(path.join(ROOT, i.src)), 'нет иконки ' + i.src);
    assert.ok(list.includes(i.src), 'иконка ' + i.src + ' не сохраняется офлайн');
    if (i.type === 'image/png') {
      const buf = fs.readFileSync(path.join(ROOT, i.src));
      const [w, h] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
      assert.equal(w + 'x' + h, i.sizes, 'размер ' + i.src);
    }
  });
  (man.shortcuts || []).forEach((s) => assert.ok(s.name && s.url));
});

test('страница подключает манифест, иконку для iPhone и регистрирует сервис-воркер', () => {
  assert.match(html, /<link rel="manifest" href="manifest.webmanifest"/);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon.png"/);
  assert.match(html, /name="viewport"/);
  assert.match(read('js/app.js'), /serviceWorker\.register\('sw\.js'\)/);
});
