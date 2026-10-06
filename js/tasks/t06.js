/* Задание 6. Вычисления с обыкновенными и десятичными дробями. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { E, expr, Frac, fmt } = OGE;

  const DENS = [2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25];

  function randFrac(rng, dens) {
    const b = rng.pick(dens || DENS);
    let a;
    do a = rng.int(1, b - 1);
    while (OGE.gcd(a, b) !== 1);
    return [a, b];
  }
  // Десятичная дробь с одним знаком после запятой, не целая.
  function randDec(rng, maxInt, allowNeg) {
    let v;
    do v = rng.int(-maxInt * 10 + 1, maxInt * 10 - 1);
    while (v % 10 === 0 || (!allowNeg && v < 0));
    return new Frac(v, 10);
  }
  function nice(v, places, maxAbs) {
    return !v.isZero() && v.isFiniteDecimal() && v.decimalPlaces() <= places && Math.abs(v.toNumber()) <= maxAbs;
  }
  function wrapOp(op, a, b) {
    return op === '+' ? E.add(a, b) : E.sub(a, b);
  }

  // Цепочка вычислений; если в конце обыкновенная дробь — переводим в десятичную.
  function chain(node) {
    const seq = expr.stepsOf(node);
    let html = expr.chainHtml(node);
    const last = seq[seq.length - 1];
    const v = expr.value(last);
    if (!v.isInt() && last.style === 'frac') html += '<div class="chain-line">= ' + fmt(v) + '</div>';
    return html;
  }

  const builders = {
    // (a/b ± c/d)·k
    'frac-mul'(rng) {
      return OGE.retry(rng, () => {
        const [a, b] = randFrac(rng);
        const [c, d] = randFrac(rng);
        if (b === d) return null;
        const op = rng.pick(['+', '-']);
        const k = rng.int(2, 60);
        const s = op === '+' ? new Frac(a, b).add(new Frac(c, d)) : new Frac(a, b).sub(new Frac(c, d));
        const r = s.mul(k);
        if (!nice(r, 2, 120) || s.isZero()) return null;
        const inner = wrapOp(op, E.fr(a, b), E.fr(c, d));
        const node = rng.chance(0.5) ? E.mul(inner, E.n(k)) : E.mul(E.n(k), inner);
        return {
          node,
          hint: 'Сначала действие в скобках: приводим дроби к общему знаменателю НОК(' + b + ', ' + d + ') = ' + OGE.lcm(b, d) + '.',
        };
      });
    },
    // (a/b ± c/d) : e/f
    'frac-div'(rng) {
      return OGE.retry(rng, () => {
        const [a, b] = randFrac(rng);
        const [c, d] = randFrac(rng);
        const [e, f] = randFrac(rng, [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25]);
        if (b === d) return null;
        const op = rng.pick(['+', '-']);
        const s = op === '+' ? new Frac(a, b).add(new Frac(c, d)) : new Frac(a, b).sub(new Frac(c, d));
        const r = s.div(new Frac(e, f));
        if (!nice(r, 2, 50)) return null;
        return {
          node: E.div(wrapOp(op, E.fr(a, b), E.fr(c, d)), E.fr(e, f)),
          hint: 'Сначала действие в скобках, затем деление: делить на дробь — значит умножать на обратную дробь.',
        };
      });
    },
    // a/b · c/d ± e/f  или  a/b : c/d ± e/f
    'frac-chain'(rng) {
      return OGE.retry(rng, () => {
        const [a, b] = randFrac(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
        const [c, d] = randFrac(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
        const [e, f] = randFrac(rng, [2, 4, 5, 8, 10, 20]);
        if ((a === c && b === d) || (c === e && d === f)) return null;
        const mulOp = rng.pick(['·', ':']);
        const op = rng.pick(['+', '-']);
        const p = mulOp === '·' ? new Frac(a, b).mul(new Frac(c, d)) : new Frac(a, b).div(new Frac(c, d));
        const r = op === '+' ? p.add(new Frac(e, f)) : p.sub(new Frac(e, f));
        if (!nice(r, 2, 20)) return null;
        const first = mulOp === '·' ? E.mul(E.fr(a, b), E.fr(c, d)) : E.div(E.fr(a, b), E.fr(c, d));
        return {
          node: wrapOp(op, first, E.fr(e, f)),
          hint: 'Порядок действий: сначала ' + (mulOp === '·' ? 'умножение' : 'деление') + ', затем ' + (op === '+' ? 'сложение' : 'вычитание') + '.',
        };
      });
    },
    // 1 / (1/p ± 1/q)
    'frac-over'(rng) {
      return OGE.retry(rng, () => {
        const p = rng.int(2, 60);
        const q = rng.int(2, 60);
        if (p === q) return null;
        const op = rng.pick(['+', '-']);
        const s = op === '+' ? new Frac(1, p).add(new Frac(1, q)) : new Frac(1, p).sub(new Frac(1, q));
        if (s.isZero()) return null;
        const r = new Frac(1).div(s);
        if (!nice(r, 1, 200) || r.sign() < 0) return null;
        return {
          node: E.over(E.n(1), wrapOp(op, E.fr(1, p), E.fr(1, q))),
          hint: 'Сначала вычисляем знаменатель большой дроби, затем делим 1 на результат.',
        };
      });
    },
    // десятичные дроби: x·y ± z,  (x ± y) : z,  x : y ± z
    'dec-ops'(rng) {
      return OGE.retry(rng, () => {
        const x = randDec(rng, 9, true);
        const y = randDec(rng, 9, true);
        const z = randDec(rng, 9, false);
        const form = rng.int(0, 2);
        let node;
        let hint;
        if (form === 0) {
          node = wrapOp(rng.pick(['+', '-']), E.mul(E.dec(x), E.dec(y)), E.dec(z));
          hint = 'Сначала умножение, затем сложение или вычитание. Следите за знаками.';
        } else if (form === 1) {
          node = E.div(wrapOp(rng.pick(['+', '-']), E.dec(x), E.dec(y)), E.dec(z));
          hint = 'Сначала действие в скобках, затем деление.';
        } else {
          node = wrapOp(rng.pick(['+', '-']), E.div(E.dec(x), E.dec(z)), E.dec(y));
          hint = 'Сначала деление, затем сложение или вычитание.';
        }
        const r = expr.value(node);
        if (!nice(r, 2, 200)) return null;
        // деление должно быть «удобным»: частное не длиннее двух знаков после запятой
        const steps = expr.stepsOf(node).map((s) => expr.value(s));
        if (steps.some((v) => !nice(v, 3, 1000) && !v.isZero())) return null;
        return { node, hint };
      });
    },
    // дробная черта с десятичными дробями
    'dec-over'(rng) {
      return OGE.retry(rng, () => {
        const x = randDec(rng, 9, false);
        const y = randDec(rng, 9, false);
        const z = randDec(rng, 9, false);
        if (x.eq(z) || y.eq(z) || x.eq(y)) return null;
        const form = rng.int(0, 2);
        let node;
        if (form === 0) node = E.over(wrapOp(rng.pick(['+', '-']), E.dec(x), E.dec(y)), E.dec(z));
        else if (form === 1) node = E.over(E.dec(x), wrapOp(rng.pick(['+', '-']), E.dec(y), E.dec(z)));
        else node = E.over(E.mul(E.dec(x), E.dec(y)), E.dec(z));
        let r;
        try {
          r = expr.value(node);
        } catch {
          return null;
        }
        if (!nice(r, 1, 100)) return null;
        return { node, hint: 'Вычисляем отдельно числитель и знаменатель, затем делим.' };
      });
    },
    // a·(−10)^k ± b
    pow10(rng) {
      return OGE.retry(rng, () => {
        const a = randDec(rng, 9, true);
        const k = rng.int(2, 3);
        const b = rng.int(5, 99);
        const node = wrapOp(rng.pick(['+', '-']), E.mul(E.dec(a), E.pow(E.n(-10), k)), E.n(b));
        const r = expr.value(node);
        if (r.isZero()) return null;
        return {
          node,
          hint:
            'Сначала возводим в степень: (−10)<sup>' +
            k +
            '</sup> = ' +
            fmt(Math.pow(-10, k)) +
            ' (чётная степень отрицательного числа положительна, нечётная — отрицательна).',
        };
      });
    },
  };

  const WEIGHTS = {
    'frac-mul': 3,
    'frac-div': 2,
    'frac-chain': 2,
    'frac-over': 2,
    'dec-ops': 3,
    'dec-over': 2,
    pow10: 2,
  };

  OGE.registerTask(
    6,
    function (rng, opts) {
      const names = Object.keys(WEIGHTS);
      const subtype =
        opts.subtype ||
        rng.weighted(
          names,
          names.map((n) => WEIGHTS[n]),
        );
      const b = builders[subtype](rng);
      const value = expr.value(b.node);
      return {
        subtype,
        html: '<p>Найдите значение выражения</p>' + OGE.h.block(expr.html(b.node)),
        answer: { type: 'number', value },
        steps: ['<p>' + b.hint + '</p>', '<div class="chain">' + chain(b.node) + '</div>', OGE.answerLine(value)],
        data: { js: expr.js(b.node) },
      };
    },
    Object.keys(WEIGHTS),
  );
})(globalThis);
