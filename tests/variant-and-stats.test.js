'use strict';
/* Полный вариант, перевод баллов в отметку и статистика в localStorage. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadOGE } = require('./helpers/load');

const OGE = loadOGE();

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

test('вариант: 19 заданий по порядку, 1–5 с общим условием, восстанавливается по зерну', () => {
  for (let i = 0; i < 30; i++) {
    const v = OGE.variant.create(OGE.hashSeed('variant', i));
    assert.deepEqual(
      v.tasks.map((t) => t.num),
      Array.from({ length: 19 }, (_, k) => k + 1),
    );
    const keys = new Set(v.tasks.slice(0, 5).map((t) => t.context.key));
    assert.equal(keys.size, 1, 'у заданий 1–5 один сюжет');
    v.tasks.slice(5).forEach((t) => assert.ok(!t.context));
    const again = OGE.variant.create(v.seed);
    assert.deepEqual(
      again.tasks.map((t) => t.html),
      v.tasks.map((t) => t.html),
    );
  }
});

test('вариант: подсчёт баллов и отметка по шкале', () => {
  const v = OGE.variant.create(777);
  const all = {};
  v.tasks.forEach((t) => (all[t.num] = t.answerText));
  let r = OGE.variant.score(v.tasks, all);
  assert.equal(r.points, 19);
  assert.equal(r.geometryPoints, 5);
  assert.equal(r.grade, 4, 'за первую часть максимум «4» (для «5» нужно 22 балла)');

  r = OGE.variant.score(v.tasks, {});
  assert.equal(r.points, 0);
  assert.ok(r.results.every((x) => x.status === 'empty'));
  assert.equal(r.grade, 2);

  // 10 верных без геометрии — всё равно «2»
  const noGeo = {};
  v.tasks.slice(0, 10).forEach((t) => (noGeo[t.num] = t.answerText));
  r = OGE.variant.score(v.tasks, noGeo);
  assert.equal(r.points, 10);
  assert.equal(r.geometryPoints, 0);
  assert.equal(r.grade, 2);
  // те же 8 баллов, но 2 из них по геометрии — «3»
  const withGeo = {};
  v.tasks.slice(0, 6).forEach((t) => (withGeo[t.num] = t.answerText));
  withGeo[15] = v.tasks[14].answerText;
  withGeo[16] = v.tasks[15].answerText;
  r = OGE.variant.score(v.tasks, withGeo);
  assert.equal(r.points, 8);
  assert.equal(r.grade, 3);
  // неверный ответ
  r = OGE.variant.score(v.tasks, { 6: '123456789' });
  assert.equal(r.results[5].status, 'wrong');

  assert.equal(OGE.variant.grade(14, 2), 3);
  assert.equal(OGE.variant.grade(15, 2), 4);
  assert.equal(OGE.variant.grade(22, 3), 5);
  assert.equal(OGE.variant.grade(7, 5), 2);
});

test('статистика: попытки, доля ошибок по последним попыткам, слабые места', () => {
  const st = memoryStorage();
  // задание 9: 4 ошибки из 5; задание 6: всё верно; задание 15: 2 ошибки из 2 (мало попыток)
  [false, false, true, false, false].forEach((ok) => OGE.stats.record(9, 'linear', ok, st));
  for (let i = 0; i < 5; i++) OGE.stats.record(6, 'dec-ops', true, st);
  OGE.stats.record(15, 'area', false, st);
  OGE.stats.record(15, 'area', false, st);
  const d = OGE.stats.load(st);
  assert.equal(d.tasks[9].attempts, 5);
  assert.equal(d.tasks[9].correct, 1);
  assert.deepEqual(d.tasks[9].subtypes.linear, { a: 5, c: 1 });

  const s = OGE.stats.summary(d);
  assert.equal(s.length, 19);
  const s9 = s.find((x) => x.num === 9);
  assert.equal(s9.errorRate, 0.8);
  assert.equal(s9.weak, true);
  assert.equal(s.find((x) => x.num === 6).errorRate, 0);
  assert.equal(s.find((x) => x.num === 15).weak, false, 'двух попыток мало, чтобы делать выводы');
  assert.equal(s.find((x) => x.num === 1).errorRate, null);

  const weak = OGE.stats.weakest(d, 3);
  assert.deepEqual(
    weak.map((w) => w.num),
    [9],
  );
});

test('статистика: учитываются только последние 20 попыток', () => {
  const st = memoryStorage();
  for (let i = 0; i < 20; i++) OGE.stats.record(10, 'dice', false, st);
  for (let i = 0; i < 20; i++) OGE.stats.record(10, 'dice', true, st);
  const s = OGE.stats.summary(OGE.stats.load(st)).find((x) => x.num === 10);
  assert.equal(s.attempts, 40);
  assert.equal(s.errors, 20);
  assert.equal(s.recentN, 20);
  assert.equal(s.errorRate, 0, 'ученик подтянул тему — старые ошибки не тянут вниз');
});

test('статистика: варианты, сброс, повреждённые данные', () => {
  const st = memoryStorage();
  OGE.stats.recordVariant({ date: 1, points: 12, max: 19, grade: 3 }, st);
  assert.equal(OGE.stats.load(st).variants.length, 1);
  OGE.stats.reset(st);
  assert.deepEqual(OGE.stats.load(st), OGE.stats.empty());
  st.setItem(OGE.stats.KEY, '{не json');
  assert.deepEqual(OGE.stats.load(st), OGE.stats.empty());
  // без хранилища (приватный режим) — ничего не падает
  assert.deepEqual(OGE.stats.load(null), OGE.stats.empty());
  OGE.stats.record(5, 'x', true, null);
});

test('режим «слабые места» чаще выбирает задания с ошибками', () => {
  const st = memoryStorage();
  for (let n = 1; n <= 19; n++) for (let i = 0; i < 5; i++) OGE.stats.record(n, 's', n !== 13, st);
  const d = OGE.stats.load(st);
  const rng = OGE.createRng(5);
  let hits = 0;
  for (let i = 0; i < 2000; i++) if (OGE.stats.pickWeighted(d, rng) === 13) hits++;
  assert.ok(hits > (2000 / 19) * 3, 'задание с ошибками выпадает заметно чаще остальных (' + hits + ')');
});

test('графики статистики строятся без ошибок', () => {
  const st = memoryStorage();
  OGE.stats.record(3, 'tires-3', false, st);
  const s = OGE.stats.summary(OGE.stats.load(st));
  const html = OGE.charts.errorBars(s, 'errors');
  assert.equal((html.match(/class="hbar[ "]/g) || []).length, 19);
  assert.ok(html.indexOf('href="#/train/3"') < html.indexOf('href="#/train/1"'), 'сортировка «сначала слабые»');
  const svg = OGE.charts.scoreChart(
    [
      { date: 0, points: 5, max: 19, grade: 2 },
      { date: 1, points: 11, max: 19, grade: 3 },
    ],
    19,
  );
  assert.ok(svg.startsWith('<svg') && !/NaN/.test(svg));
});
