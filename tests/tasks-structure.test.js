'use strict';
/*
 * Общие свойства всех задач: детерминированность по зерну, новые числа при
 * новом зерне, корректный формат ответа, разбор решения, аккуратная разметка.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadOGE, textOf } = require('./helpers/load');

const OGE = loadOGE();
const N = Number(process.env.OGE_SAMPLES) || 200;

// Простейшая проверка парности тегов, которые используют генераторы.
function balanced(html) {
  for (const tag of ['span', 'div', 'p', 'sup', 'sub', 'svg', 'li', 'ol', 'ul', 'table', 'tr', 'td', 'th', 'b', 'i', 'button', 'figure', 'details']) {
    const open = (html.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
    const close = (html.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    if (open !== close) return tag + ': ' + open + ' открывающих, ' + close + ' закрывающих';
  }
  return null;
}

const BAD = /undefined|NaN|Infinity|\[object|\bnull\b|function\s*\(/;

for (const num of OGE.TASK_NUMBERS) {
  test('задание ' + num + ': структура задачи и разбора', () => {
    for (let i = 0; i < N; i++) {
      const seed = OGE.hashSeed('structure', num, i);
      const t = OGE.generateTask(num, seed);
      const where = 'задание ' + num + ' (' + t.subtype + '), зерно ' + seed;

      assert.equal(t.num, num);
      assert.equal(t.seed, seed);
      assert.ok(typeof t.html === 'string' && textOf(t.html).trim().length > 15, where + ': пустое условие');
      assert.ok(Array.isArray(t.steps) && t.steps.length >= 2, where + ': нет разбора');
      const all = t.html + t.steps.join('') + (t.context ? t.context.html : '');
      assert.ok(!BAD.test(textOf(all)), where + ': в тексте есть «' + (textOf(all).match(BAD) || [])[0] + '»');
      assert.ok(!/<svg[^>]*NaN/.test(all) && !/"NaN|NaN"/.test(all), where + ': NaN в рисунке');
      const unb = balanced(all);
      assert.equal(unb, null, where + ': несбалансированные теги — ' + unb);

      // ответ
      assert.ok(['number', 'seq', 'set'].includes(t.answer.type), where);
      const ok = OGE.answer.check(t.answer, t.answerText);
      assert.equal(ok.status, 'correct', where + ': собственный ответ «' + t.answerText + '» не проходит проверку');
      if (t.answer.type === 'number') {
        const v = t.answer.value;
        assert.ok(v.isFiniteDecimal(), where + ': ответ должен быть конечной десятичной дробью, а не ' + v);
        assert.ok(v.decimalPlaces() <= 4, where + ': слишком много знаков после запятой: ' + t.answerText);
        assert.ok(Math.abs(v.toNumber()) < 1e6, where + ': слишком большое число ' + t.answerText);
      } else {
        assert.match(t.answer.value, /^[1-9]+$/, where);
      }
      // последний шаг разбора называет ответ
      assert.ok(t.steps[t.steps.length - 1].indexOf(t.answerText) >= 0, where + ': в конце разбора нет ответа');

      // варианты ответа (задания 7, 13): номер верного варианта среди кнопок
      const opts = (t.html.match(/class="opt"/g) || []).length;
      if (opts) {
        assert.equal(t.answer.type, 'number');
        const k = t.answer.value.toNumber();
        assert.ok(Number.isInteger(k) && k >= 1 && k <= opts, where + ': номер варианта вне диапазона');
      }
      // задания 1–5 имеют общее условие
      if (num <= 5) assert.ok(t.context && t.context.html && t.context.key, where + ': нет общего условия');
    }
  });

  test('задание ' + num + ': одинаковое зерно — та же задача, разные зёрна — разные числа', () => {
    const a = OGE.generateTask(num, 12345);
    const b = OGE.generateTask(num, 12345);
    assert.equal(a.html, b.html);
    assert.equal(a.answerText, b.answerText);
    assert.deepEqual(a.steps, b.steps);
    const texts = new Set();
    const M = 60;
    for (let i = 0; i < M; i++) {
      const t = OGE.generateTask(num, OGE.hashSeed('variety', num, i));
      // условие вместе с рисунком и общим текстом заданий 1–5
      texts.add(t.html + (t.context ? t.context.html : ''));
    }
    assert.ok(texts.size >= M * 0.6, 'задание ' + num + ': слишком мало различных условий (' + texts.size + ' из ' + M + ')');
  });
}

test('у разных разновидностей задания разные ответы по зёрнам (ответ не «залип»)', () => {
  for (const num of OGE.TASK_NUMBERS) {
    const answers = new Set();
    for (let i = 0; i < 60; i++) answers.add(OGE.generateTask(num, OGE.hashSeed('answers-variety', num, i)).answerText);
    assert.ok(answers.size >= 3, 'задание ' + num + ': почти всегда один и тот же ответ');
  }
});

test('ответы на задания с вариантами распределены по всем номерам', () => {
  for (const num of [7, 13]) {
    const counts = {};
    for (let i = 0; i < 400; i++) {
      const v = OGE.generateTask(num, OGE.hashSeed('choice', num, i)).answerText;
      counts[v] = (counts[v] || 0) + 1;
    }
    for (const k of ['1', '2', '3', '4']) assert.ok(counts[k] > 30, 'задание ' + num + ': вариант ' + k + ' почти не бывает верным');
  }
});

test('банк утверждений задания 19: без повторов, есть верные и неверные, у каждого есть пояснение', () => {
  const bank = OGE.STATEMENTS19;
  assert.ok(bank.length >= 60);
  assert.equal(new Set(bank.map((s) => s.text)).size, bank.length, 'повторяющиеся утверждения');
  assert.ok(bank.filter((s) => s.truth).length >= 20);
  assert.ok(bank.filter((s) => !s.truth).length >= 20);
  bank.forEach((s) => assert.ok(s.why && s.why.length > 5, 'нет пояснения: ' + s.text));
});
