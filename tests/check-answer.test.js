'use strict';
/* Проверка ответа ученика: разные способы записи числа, последовательности, наборы. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadOGE } = require('./helpers/load');

const OGE = loadOGE();
const { check } = OGE.answer;
const num = (v) => ({ type: 'number', value: OGE.Frac.of(v) });

test('число: запятая, точка, знак минус, пробелы, лишние нули', () => {
  const a = num(-2.5);
  for (const s of ['-2,5', '−2,5', '-2.5', ' -2,50 ', '–2,5', '-2,500']) assert.equal(check(a, s).status, 'correct', s);
  for (const s of ['2,5', '-2,4', '-25']) assert.equal(check(a, s).status, 'wrong', s);
  assert.equal(check(num(0.5), ',5').status, 'correct');
  assert.equal(check(num(0.5), '0,5').status, 'correct');
  assert.equal(check(num(12), '12,').status, 'correct');
  assert.equal(check(num(12), '+12').status, 'correct');
  assert.equal(check(num(1250), '1 250').status, 'correct');
});

test('число: недопустимые записи не засчитываются ни как верные, ни как ошибки', () => {
  const a = num(0.25);
  for (const s of ['', '   ', '1/4', 'abc', '0,2,5', '--1', '2e3']) {
    const r = check(a, s);
    assert.equal(r.status, 'invalid', s);
    assert.ok(r.message);
  }
});

test('последовательность цифр: порядок важен', () => {
  const a = { type: 'seq', value: '312' };
  assert.equal(check(a, '312').status, 'correct');
  assert.equal(check(a, '3 1 2').status, 'correct');
  assert.equal(check(a, '3,1,2').status, 'correct');
  assert.equal(check(a, '213').status, 'wrong');
  assert.equal(check(a, 'абв').status, 'invalid');
});

test('набор номеров: порядок не важен, повторы — ошибка', () => {
  const a = { type: 'set', value: '13' };
  assert.equal(check(a, '13').status, 'correct');
  const r = check(a, '31');
  assert.equal(r.status, 'correct');
  assert.ok(r.note, 'подсказка про порядок возрастания');
  assert.equal(check(a, '133').status, 'wrong');
  assert.equal(check(a, '1').status, 'wrong');
  assert.equal(check(a, '123').status, 'wrong');
});
