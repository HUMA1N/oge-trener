'use strict';
/* Ядро: генератор случайных чисел, точные дроби, форматирование, выражения. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadOGE, textOf } = require('./helpers/load');

const OGE = loadOGE();
const { Frac, E, expr } = OGE;

test('RNG: одинаковое зерно — одинаковая последовательность, int в границах', () => {
  const a = OGE.createRng(42);
  const b = OGE.createRng(42);
  for (let i = 0; i < 1000; i++) assert.equal(a.next(), b.next());
  const r = OGE.createRng(7);
  const seen = new Set();
  for (let i = 0; i < 5000; i++) {
    const x = r.int(-3, 3);
    assert.ok(Number.isInteger(x) && x >= -3 && x <= 3);
    seen.add(x);
    assert.notEqual(r.intNZ(-2, 2), 0);
  }
  assert.equal(seen.size, 7, 'все значения отрезка встречаются');
  const sh = r.shuffle([1, 2, 3, 4, 5]);
  assert.deepEqual(sh.slice().sort(), [1, 2, 3, 4, 5]);
  assert.notEqual(OGE.deriveSeed(1, 'a'), OGE.deriveSeed(1, 'b'));
});

test('RNG.retry сообщает об ошибке, если подходящих параметров нет', () => {
  assert.throws(() => OGE.retry(OGE.createRng(1), () => null, 10), /Не удалось/);
});

test('Frac: арифметика и сокращение', () => {
  assert.equal(new Frac(6, 8).toString(), '3/4');
  assert.equal(new Frac(3, -6).toString(), '-1/2');
  assert.equal(new Frac(1, 3).add(new Frac(1, 6)).toString(), '1/2');
  assert.equal(new Frac(7, 12).sub(new Frac(5, 18)).toString(), '11/36');
  assert.equal(new Frac(2, 3).mul(new Frac(9, 4)).toString(), '3/2');
  assert.equal(new Frac(2, 3).div(new Frac(4, 9)).toString(), '3/2');
  assert.equal(new Frac(2).pow(-3).toString(), '1/8');
  assert.equal(Frac.of('6,7').toString(), '67/10');
  assert.equal(Frac.of(0.1).add(Frac.of(0.2)).toString(), '3/10');
  assert.equal(Frac.of(-0.025).toDecimalString(), '-0.025');
  assert.equal(new Frac(1, 3).toDecimalString(), null);
  assert.equal(new Frac(3, 40).decimalPlaces(), 3);
  assert.ok(new Frac(7, 20).isFiniteDecimal());
  assert.ok(!new Frac(1, 6).isFiniteDecimal());
  assert.throws(() => new Frac(1, 0));
});

test('Форматирование: запятая, минус, разряды, округление', () => {
  assert.equal(OGE.fmt(2.5), '2,5');
  assert.equal(OGE.fmt(-3), '−3');
  assert.equal(OGE.fmt(0.1 + 0.2), '0,3');
  assert.equal(OGE.fmt(new Frac(-7, 4)), '−1,75');
  assert.equal(OGE.fmt(new Frac(1, 3)), '1/3');
  assert.equal(OGE.fmtG(1234567.25), '1\u00a0234\u00a0567,25');
  assert.equal(OGE.fmtG(4500), '4500');
  assert.equal(OGE.roundFrac(Frac.of('2.45'), 1).toString(), '5/2');
  assert.equal(OGE.roundFrac(Frac.of('2.449'), 1).toString(), '12/5');
  assert.equal(OGE.roundFrac(Frac.of('-2.45'), 1).toString(), '-5/2');
  assert.equal(OGE.roundFrac(new Frac(1, 6), 2).toString(), '17/100');
  assert.equal(OGE.plural(1, 'место', 'места', 'мест'), 'место');
  assert.equal(OGE.plural(3, 'место', 'места', 'мест'), 'места');
  assert.equal(OGE.plural(11, 'место', 'места', 'мест'), 'мест');
  assert.equal(OGE.plural(22, 'место', 'места', 'мест'), 'места');
});

// Случайное дерево выражения из чисел, дробей, степеней и скобок.
function randomTree(rng, depth) {
  if (depth <= 0 || rng.chance(0.25)) {
    const kind = rng.int(0, 2);
    if (kind === 0) return E.n(rng.int(-9, 9));
    if (kind === 1) return E.dec(rng.intNZ(-99, 99) / 10);
    return E.fr(rng.intNZ(-9, 9), rng.int(2, 9));
  }
  const op = rng.pick(['add', 'sub', 'mul', 'div', 'over', 'pow', 'neg', 'group']);
  if (op === 'pow') return E.pow(randomTree(rng, depth - 1), rng.int(2, 3));
  if (op === 'neg') return E.neg(randomTree(rng, depth - 1));
  if (op === 'group') return E.group(randomTree(rng, depth - 1));
  return E[op](randomTree(rng, depth - 1), randomTree(rng, depth - 1));
}

test('Выражения: запись на экране и вычисление совпадают (скобки расставлены верно)', () => {
  const rng = OGE.createRng(2024);
  let checked = 0;
  for (let i = 0; i < 3000; i++) {
    const tree = randomTree(rng, 4);
    let exact;
    try {
      exact = expr.value(tree).toNumber();
    } catch {
      continue; // деление на ноль или слишком большие числа — пропускаем
    }
    if (!isFinite(exact) || Math.abs(exact) > 1e8) continue;
    const viaJs = new Function('return ' + expr.js(tree))();
    assert.ok(Math.abs(viaJs - exact) <= 1e-6 * Math.max(1, Math.abs(exact)), expr.js(tree) + ' = ' + viaJs + ', а точно ' + exact);
    assert.ok(!/undefined|NaN/.test(expr.html(tree)));
    // пошаговое вычисление приходит к тому же числу
    const steps = expr.stepsOf(tree);
    const last = steps[steps.length - 1];
    assert.ok(expr.value(last).eq(expr.value(tree)));
    checked++;
  }
  assert.ok(checked > 1500);
});

test('Выражения: типичные записи', () => {
  const t1 = E.mul(E.dec(6.7), E.dec(-0.8));
  assert.equal(textOf(expr.html(t1)), '6,7 · (−0,8)');
  const t2 = E.pow(E.n(-10), 3);
  assert.equal(textOf(expr.html(t2)).replace(/\s/g, ''), '(−10)3');
  const t3 = E.sub(E.n(5), E.add(E.n(2), E.n(1)));
  assert.equal(textOf(expr.html(t3)), '5 − (2 + 1)');
  assert.equal(new Function('return ' + expr.js(t3))(), 2);
  const t4 = E.div(E.n(12), E.mul(E.n(2), E.n(3)));
  assert.equal(new Function('return ' + expr.js(t4))(), 2);
  // приведение к общему знаменателю в разборе
  const chain = expr.stepsOf(E.sub(E.fr(7, 12), E.fr(5, 18))).map((s) => textOf(expr.html(s)).replace(/\s+/g, ' ').trim());
  assert.deepEqual(chain, ['7 12 − 5 18', '21 36 − 10 36', '11 36']);
});
