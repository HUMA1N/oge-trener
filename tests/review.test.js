'use strict';
/* Режим «Работа над ошибками»: тип задания уходит из списка после 3 верных ответов подряд. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadOGE } = require('./helpers/load');

const OGE = loadOGE();
const S = OGE.stats;

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test('ошибка добавляет тип задания, верный ответ без ошибки — нет', () => {
  const st = memoryStorage();
  S.record(9, 'quadratic', true, st);
  assert.equal(S.reviewList(S.load(st)).length, 0);
  S.record(9, 'quadratic', false, st);
  S.record(20, 'biquad', false, st);
  const list = S.reviewList(S.load(st));
  assert.deepEqual(
    list.map((e) => e.key),
    ['9|quadratic', '20|biquad'],
  );
  assert.equal(list[0].streak, 0);
  assert.equal(list[0].misses, 1);
});

test('тип уходит только после трёх верных ответов ПОДРЯД', () => {
  const st = memoryStorage();
  S.record(13, 'system', false, st);
  S.record(13, 'system', true, st);
  S.record(13, 'system', true, st);
  assert.equal(S.reviewState(S.load(st), 13, 'system').streak, 2);
  // ошибка сбрасывает серию
  S.record(13, 'system', false, st);
  let e = S.reviewState(S.load(st), 13, 'system');
  assert.equal(e.streak, 0);
  assert.equal(e.misses, 2);
  S.record(13, 'system', true, st);
  S.record(13, 'system', true, st);
  assert.ok(S.reviewState(S.load(st), 13, 'system'));
  S.record(13, 'system', true, st);
  const d = S.load(st);
  assert.equal(S.reviewState(d, 13, 'system'), null, 'после 3 верных подряд тип отработан');
  assert.equal(d.reviewFixed, 1);
  // другие разновидности того же номера не затрагиваются
  S.record(13, 'linear', false, st);
  S.record(13, 'system', true, st);
  assert.equal(S.reviewState(S.load(st), 13, 'linear').streak, 0);
});

test('выбор следующего типа: только типы с ошибками, без повтора подряд', () => {
  const st = memoryStorage();
  assert.equal(S.pickReview(S.load(st), OGE.createRng(1)), null);
  S.record(6, 'dec-ops', false, st);
  S.record(21, 'river', false, st);
  S.record(22, 'abs', false, st);
  const d = S.load(st);
  const rng = OGE.createRng(42);
  const seen = new Set();
  let last = null;
  for (let i = 0; i < 300; i++) {
    const e = S.pickReview(d, rng, last);
    assert.ok(['6|dec-ops', '21|river', '22|abs'].includes(e.key));
    assert.notEqual(e.key, last, 'тот же тип два раза подряд');
    seen.add(e.key);
    last = e.key;
  }
  assert.equal(seen.size, 3);
  // единственный тип повторяется, пока не отработан
  const one = memoryStorage();
  S.record(7, 'which-point', false, one);
  assert.equal(S.pickReview(S.load(one), rng, '7|which-point').key, '7|which-point');
});

test('старые данные без списка ошибок: список собирается из прошлых ошибок', () => {
  const st = memoryStorage();
  st.setItem(
    S.KEY,
    JSON.stringify({
      v: 1,
      tasks: {
        9: { attempts: 3, correct: 2, recent: [1, 0, 1], subtypes: { linear: { a: 2, c: 2 }, quadratic: { a: 1, c: 0 } }, lastAt: 5 },
      },
      variants: [],
    }),
  );
  const list = S.reviewList(S.load(st));
  assert.deepEqual(
    list.map((e) => e.key),
    ['9|quadratic'],
  );
});

test('описание и удаление типа, сброс статистики очищает список', () => {
  const st = memoryStorage();
  S.record(10, 'dice', false, st);
  S.describeReview(10, 'dice', 'Игральный кубик бросают дважды…', st);
  assert.equal(S.reviewState(S.load(st), 10, 'dice').example, 'Игральный кубик бросают дважды…');
  S.dropReview(S.load(st), '10|dice', st);
  assert.equal(S.reviewList(S.load(st)).length, 0);
  S.record(10, 'dice', false, st);
  S.reset(st);
  assert.equal(S.reviewList(S.load(st)).length, 0);
});

test('по разновидности из статистики генерируется задача той же разновидности', () => {
  for (const num of OGE.TASK_NUMBERS) {
    for (let i = 0; i < 25; i++) {
      const t = OGE.generateTask(num, OGE.hashSeed('review-kind', num, i));
      const again = OGE.generateTask(num, OGE.hashSeed('review-again', num, i), OGE.optsForSubtype(num, t.subtype));
      assert.equal(again.subtype, t.subtype, 'задание ' + num + ': разновидность ' + t.subtype + ' не воспроизводится');
    }
  }
});
