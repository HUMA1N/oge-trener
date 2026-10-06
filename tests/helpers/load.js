'use strict';
/*
 * Загружает скрипты сайта в Node в том же порядке, что и index.html.
 * Скрипты, помеченные data-browser-only (интерфейс), пропускаются.
 * Так тесты проверяют ровно тот код, который работает в браузере.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

function scriptList() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const re = /<script\s+src="([^"]+)"([^>]*)><\/script>/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    if (!/data-browser-only/.test(m[2])) out.push(m[1]);
  }
  return out;
}

let cached = null;
function loadOGE() {
  if (cached) return cached;
  for (const file of scriptList()) {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), { filename: file });
  }
  cached = globalThis.OGE;
  return cached;
}

// Текст HTML без тегов (для поиска чисел в условии).
function textOf(html) {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\s+/g, ' ');
}

module.exports = { loadOGE, scriptList, textOf, ROOT };
