/* Задание 8. Степени и корни. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { E, expr, Frac, h, fmt, MINUS } = OGE;

  const SQUAREFREE = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];

  function sup(e) {
    return '<sup>' + fmt(e) + '</sup>';
  }
  // Степень без показателя 1: pw(3, 1) → «3».
  function pw(base, e) {
    return e === 1 ? String(base) : base + sup(e);
  }

  const builders = {
    // √a · √b  или  √a / √b
    'sqrt-mul'(rng) {
      return OGE.retry(rng, () => {
        const t = rng.pick(SQUAREFREE);
        const p = rng.int(1, 6);
        const q = rng.int(1, 6);
        if (p === q) return null;
        const a = t * p * p;
        const b = t * q * q;
        if (a > 400 || b > 400) return null;
        if (rng.chance(0.65)) {
          const node = E.mul(E.sqrt(a), E.sqrt(b));
          const res = t * p * q;
          return {
            node,
            steps: [
              '<p>Произведение корней равно корню из произведения: ' +
                h.m(h.sqrt('<i>a</i>') + ' · ' + h.sqrt('<i>b</i>') + ' = ' + h.sqrt('<i>ab</i>')) +
                '.</p>',
              h.block(expr.html(node) + ' = ' + h.sqrt(a + ' · ' + b) + ' = ' + h.sqrt(a * b) + ' = ' + res),
            ],
            value: new Frac(res),
          };
        }
        const v = new Frac(p, q);
        if (!v.isFiniteDecimal()) return null;
        const node = E.over(E.sqrt(a), E.sqrt(b));
        return {
          node,
          steps: [
            '<p>Частное корней равно корню из частного: ' +
              h.m(h.frac(h.sqrt('<i>a</i>'), h.sqrt('<i>b</i>')) + ' = ' + h.sqrt(h.frac('<i>a</i>', '<i>b</i>'))) +
              '.</p>',
            h.block(expr.html(node) + ' = ' + h.sqrt(h.frac(a, b)) + ' = ' + h.sqrt(h.frac(p * p, q * q)) + ' = ' + h.frac(p, q) + ' = ' + fmt(v)),
          ],
          value: v,
        };
      });
    },
    // (k√t)² / m
    'sqrt-squared'(rng) {
      return OGE.retry(rng, () => {
        const k = rng.int(2, 9);
        const t = rng.pick(SQUAREFREE);
        const m = rng.int(2, 60);
        const sq = k * k * t;
        const v = new Frac(sq, m);
        if (!v.isFiniteDecimal() || v.decimalPlaces() > 2 || sq === m) return null;
        const node = E.over(E.pow(E.imul(E.n(k), E.sqrt(t)), 2), E.n(m));
        return {
          node,
          steps: [
            '<p>Квадрат произведения равен произведению квадратов, а ' + h.m('(' + h.sqrt('<i>a</i>') + ')<sup>2</sup> = <i>a</i>') + ':</p>',
            h.block('(' + k + h.sqrt(t) + ')<sup>2</sup> = ' + k + '<sup>2</sup> · (' + h.sqrt(t) + ')<sup>2</sup> = ' + k * k + ' · ' + t + ' = ' + sq),
            h.block(h.frac(sq, m) + ' = ' + fmt(v)),
          ],
          value: v,
        };
      });
    },
    // (√a − b)(√a + b)
    'diff-squares'(rng) {
      return OGE.retry(rng, () => {
        const a = rng.int(2, 99);
        const r = Math.round(Math.sqrt(a));
        if (r * r === a) return null;
        const b = rng.int(1, 9);
        const v = a - b * b;
        if (v === 0) return null;
        const first = E.sub(E.sqrt(a), E.n(b));
        const second = E.add(E.sqrt(a), E.n(b));
        const node = rng.chance(0.5) ? E.imul(E.group(first), E.group(second)) : E.imul(E.group(second), E.group(first));
        return {
          node,
          steps: [
            '<p>Применим формулу разности квадратов: ' +
              h.m('(<i>x</i> ' + MINUS + ' <i>y</i>)(<i>x</i> + <i>y</i>) = <i>x</i><sup>2</sup> ' + MINUS + ' <i>y</i><sup>2</sup>') +
              '.</p>',
            h.block('(' + h.sqrt(a) + ')<sup>2</sup> ' + MINUS + ' ' + b + '<sup>2</sup> = ' + a + ' ' + MINUS + ' ' + b * b + ' = ' + fmt(v)),
          ],
          value: new Frac(v),
        };
      });
    },
    // √(p^2i · q^2j)
    'sqrt-powers'(rng) {
      return OGE.retry(rng, () => {
        const [p, q] = rng.sample([2, 3, 5, 7], 2).sort((x, y) => x - y);
        const i = rng.int(1, 3);
        const j = rng.int(1, 3);
        if (i === 1 && j === 1) return null;
        const res = Math.pow(p, i) * Math.pow(q, j);
        if (res > 2000) return null;
        const node = E.sqrt(E.mul(E.pow(E.n(p), 2 * i), E.pow(E.n(q), 2 * j)));
        return {
          node,
          steps: [
            '<p>Корень из произведения равен произведению корней, и ' +
              h.m(h.sqrt('<i>a</i><sup>2<i>n</i></sup>') + ' = <i>a</i><sup><i>n</i></sup>') +
              ' (показатель делится пополам):</p>',
            h.block(expr.html(node) + ' = ' + pw(p, i) + ' · ' + pw(q, j) + ' = ' + Math.pow(p, i) + ' · ' + Math.pow(q, j) + ' = ' + res),
          ],
          value: new Frac(res),
        };
      });
    },
    // выражение со степенями переменной при заданном значении
    'powers-var'(rng) {
      return OGE.retry(rng, () => {
        const form = rng.int(0, 2);
        const a = rng.pick([2, 3, 4, 5, 10, -2]);
        let node;
        let e;
        let explain;
        const A = E.v('a');
        if (form === 0) {
          const m = rng.intNZ(-6, 9);
          const n = rng.intNZ(-6, 9);
          const p = rng.intNZ(-6, 9);
          e = m + n - p;
          node = E.over(E.mul(E.pow(A, m), E.pow(A, n)), E.pow(A, p));
          explain =
            'a' +
            sup(m) +
            ' · a' +
            sup(n) +
            ' : a' +
            sup(p) +
            ' = a' +
            sup(m + n) +
            ' : a' +
            sup(p) +
            ' = a<sup>' +
            fmt(m + n) +
            ' ' +
            MINUS +
            ' ' +
            (p < 0 ? '(' + fmt(p) + ')' : p) +
            '</sup>';
        } else if (form === 1) {
          const m = rng.intNZ(-4, 5);
          const n = rng.int(2, 4);
          const p = rng.intNZ(-9, 9);
          e = m * n + p;
          node = E.mul(E.pow(E.pow(A, m), n), E.pow(A, p));
          explain =
            '(a' +
            sup(m) +
            ')' +
            sup(n) +
            ' · a' +
            sup(p) +
            ' = a' +
            sup(m * n) +
            ' · a' +
            sup(p) +
            ' = a<sup>' +
            fmt(m * n) +
            ' + ' +
            (p < 0 ? '(' + fmt(p) + ')' : p) +
            '</sup>';
        } else {
          const m = rng.intNZ(-6, 12);
          const n = rng.intNZ(-4, 4);
          const p = rng.int(2, 3);
          e = m - n * p;
          node = E.over(E.pow(A, m), E.pow(E.pow(A, n), p));
          explain =
            'a' +
            sup(m) +
            ' : (a' +
            sup(n) +
            ')' +
            sup(p) +
            ' = a' +
            sup(m) +
            ' : a' +
            sup(n * p) +
            ' = a<sup>' +
            fmt(m) +
            ' ' +
            MINUS +
            ' ' +
            (n * p < 0 ? '(' + fmt(n * p) + ')' : n * p) +
            '</sup>';
        }
        if (e === 0 || Math.abs(e) > 3) return null;
        const v = new Frac(a).pow(e);
        if (!v.isFiniteDecimal() || Math.abs(v.toNumber()) > 1000 || v.decimalPlaces() > 3) return null;
        explain = explain.replace(/\ba\b/g, '<i>a</i>');
        return {
          node,
          after: ' при ' + h.m('<i>a</i> = ' + fmt(a)),
          vars: { a },
          steps: [
            '<p>Упростим выражение по свойствам степеней: при умножении показатели складываются, при делении вычитаются, при возведении степени в степень перемножаются.</p>',
            h.block(explain + ' = ' + pw('<i>a</i>', e)),
            '<p>Подставим ' + h.m('<i>a</i> = ' + fmt(a)) + ':</p>',
            h.block(
              (e === 1 ? '' : pw(a < 0 ? '(' + fmt(a) + ')' : fmt(a), e) + ' = ') +
                (e < 0 ? h.frac(1, pw(a < 0 ? '(' + fmt(a) + ')' : fmt(a), -e)) + ' = ' : '') +
                fmt(v),
            ),
          ],
          value: v,
        };
      });
    },
    // числовые степени: (a·10^m)·(b·10^n)
    tens(rng) {
      return OGE.retry(rng, () => {
        const a = rng.int(2, 9);
        const b = rng.int(2, 9);
        const m = rng.sign() * rng.int(2, 5);
        const n = rng.sign() * rng.int(2, 5);
        const e = m + n;
        if (Math.abs(e) > 4 || m === -n) return null;
        const v = new Frac(a * b).mul(new Frac(10).pow(e));
        if (!v.isFiniteDecimal() || v.decimalPlaces() > 4 || v.toNumber() > 100000) return null;
        const node = E.mul(E.group(E.mul(E.n(a), E.pow(E.n(10), m))), E.group(E.mul(E.n(b), E.pow(E.n(10), n))));
        return {
          node,
          steps: [
            '<p>Перемножим отдельно числа и степени десяти: ' + h.m('10' + sup(m) + ' · 10' + sup(n) + ' = 10' + sup(e)) + '.</p>',
            h.block(a + ' · ' + b + ' · 10' + sup(e) + ' = ' + a * b + ' · 10' + sup(e) + ' = ' + fmt(v)),
          ],
          value: v,
        };
      });
    },
  };

  OGE.registerTask(
    8,
    function (rng, opts) {
      const names = Object.keys(builders);
      const subtype = opts.subtype || rng.pick(names);
      const b = builders[subtype](rng);
      return {
        subtype,
        html: '<p>Найдите значение выражения</p>' + h.block(expr.html(b.node) + (b.after || '')),
        answer: { type: 'number', value: b.value },
        steps: b.steps.concat([OGE.answerLine(b.value)]),
        data: { js: expr.js(b.node, b.vars) },
      };
    },
    Object.keys(builders),
  );
})(globalThis);
