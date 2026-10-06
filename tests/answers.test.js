'use strict';
/*
 * Главная проверка: ответ каждого генератора совпадает с ответом,
 * найденным независимым решателем (tests/helpers/solvers.js).
 * Каждая разновидность каждого задания проверяется на множестве зёрен.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadOGE } = require('./helpers/load');
const { SOLVERS } = require('./helpers/solvers');

const OGE = loadOGE();
const PER_SUBTYPE = Number(process.env.OGE_SAMPLES) || 120;

function close(a, b) {
  return Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
}

function verify(num, seed, opts) {
  const t = OGE.generateTask(num, seed, opts);
  let expected;
  try {
    expected = SOLVERS[num](t);
  } catch (e) {
    assert.fail('задание ' + num + ' (' + t.subtype + '), зерно ' + seed + ': ' + e.message);
  }
  const where = 'задание ' + num + ' (' + t.subtype + '), зерно ' + seed;
  if (t.answer.type === 'number') {
    assert.equal(typeof expected, 'number', where + ': решатель должен вернуть число');
    assert.ok(close(expected, t.answer.value.toNumber()), where + ': решатель получил ' + expected + ', генератор — ' + t.answerText);
  } else if (t.answer.type === 'list') {
    assert.ok(Array.isArray(expected), where + ': решатель должен вернуть список');
    const got = t.answer.value.map((v) => v.toNumber());
    const exp = expected.slice().sort((a, b) => a - b);
    assert.equal(got.length, exp.length, where + ': решатель получил ' + exp.join('; ') + ', генератор — ' + t.answerText);
    got.forEach((v, i) => assert.ok(close(v, exp[i]), where + ': решатель получил ' + exp.join('; ') + ', генератор — ' + t.answerText));
  } else if (t.answer.type === 'pairs') {
    const got = t.answer.value.map((p) => p.map((v) => v.toNumber()));
    const exp = expected.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    assert.equal(got.length, exp.length, where);
    got.forEach((p, i) => assert.ok(close(p[0], exp[i][0]) && close(p[1], exp[i][1]), where + ': решатель получил ' + JSON.stringify(exp) + ', генератор — ' + t.answerText));
  } else {
    assert.equal(String(expected), t.answer.value, where);
  }
  return t;
}

for (const num of OGE.TASK_NUMBERS) {
  test('задание ' + num + ': ответы генератора совпадают с независимым решением', () => {
    const subtypes = OGE.SUBTYPES[num];
    assert.ok(subtypes.length > 0, 'у задания должны быть разновидности');
    for (const sub of subtypes) {
      const seen = new Set();
      for (let i = 0; i < PER_SUBTYPE; i++) {
        const t = verify(num, OGE.hashSeed('answers', num, sub, i), { subtype: sub, scenario: sub });
        seen.add(t.subtype);
      }
      assert.ok(seen.size >= 1);
    }
  });

  test('задание ' + num + ': случайный выбор разновидности тоже даёт верные ответы', () => {
    const seen = new Set();
    for (let i = 0; i < PER_SUBTYPE; i++) seen.add(verify(num, OGE.hashSeed('mixed', num, i)).subtype);
    // при случайном выборе встречаются разные разновидности
    if (OGE.SUBTYPES[num].length > 1) assert.ok(seen.size > 1, 'разновидности не перемешиваются');
  });
}
