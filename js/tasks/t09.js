/* Задание 9. Уравнения. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { E, expr, Frac, h, fmt, MINUS } = OGE;
  const X = () => E.v('x');

  // Одночлен c·x^deg при c > 0.
  function term(c, deg) {
    c = Frac.of(c);
    if (deg === 0) return E.n(c);
    const x = deg === 1 ? X() : E.pow(X(), deg);
    return c.eq(1) ? x : E.imul(E.n(c), x);
  }
  // Многочлен из пар [коэффициент, степень] с правильными знаками.
  function poly(terms) {
    let node = null;
    terms.forEach(([c, deg]) => {
      c = Frac.of(c);
      if (c.isZero()) return;
      if (!node) {
        if (c.sign() > 0) node = term(c, deg);
        else if (deg === 0) node = E.n(c);
        else node = c.eq(-1) ? E.neg(deg === 1 ? X() : E.pow(X(), deg)) : E.imul(E.n(c), deg === 1 ? X() : E.pow(X(), deg));
      } else {
        node = c.sign() > 0 ? E.add(node, term(c, deg)) : E.sub(node, term(c.neg(), deg));
      }
    });
    return node || E.n(0);
  }
  const ph = (terms) => expr.html(poly(terms));

  function eqHtml(l, r) {
    return h.block(expr.html(l) + ' = ' + expr.html(r));
  }
  function randRoot(rng) {
    return new Frac(rng.int(-30, 30), rng.pick([1, 1, 1, 2, 4, 5]));
  }
  // «(−3)» для отрицательных чисел внутри выражения.
  function p(x) {
    return Frac.of(x).sign() < 0 ? '(' + fmt(x) + ')' : fmt(x);
  }
  // Последний шаг линейного уравнения k·x = m. При k = 1 шаг не нужен.
  function solveLine(m, k, x0) {
    return Frac.of(k).eq(1) ? '' : h.block('<i>x</i> = ' + fmt(m) + ' : ' + p(k) + ' = ' + fmt(x0));
  }

  const builders = {
    // p·x + q = r·x + s
    linear(rng) {
      return OGE.retry(rng, () => {
        const x0 = randRoot(rng);
        const pp = rng.intNZ(-9, 9);
        const r = rng.intNZ(-9, 9);
        if (pp === r) return null;
        const q = rng.int(-20, 20);
        const s = x0.mul(pp).add(q).sub(x0.mul(r));
        if (!s.isInt() || Math.abs(s.n) > 99) return null;
        const lhs = rng.chance(0.7)
          ? poly([
              [pp, 1],
              [q, 0],
            ])
          : poly([
              [q, 0],
              [pp, 1],
            ]);
        const rhs = rng.chance(0.7)
          ? poly([
              [r, 1],
              [s, 0],
            ])
          : poly([
              [s, 0],
              [r, 1],
            ]);
        const steps = [
          '<p>Перенесём слагаемые с <i>x</i> в левую часть, а числа — в правую, меняя знаки:</p>',
          h.block(
            ph([
              [pp, 1],
              [-r, 1],
            ]) +
              ' = ' +
              ph([
                [s, 0],
                [-q, 0],
              ]),
          ),
          h.block(ph([[pp - r, 1]]) + ' = ' + fmt(s.sub(q))),
          solveLine(s.sub(q), pp - r, x0),
        ];
        return { lhs, rhs, root: x0, steps, pick: 'only' };
      });
    },
    // a(x + b) = c·x + d
    brackets(rng) {
      return OGE.retry(rng, () => {
        const x0 = randRoot(rng);
        const a = rng.intNZ(-9, 9);
        if (a === 1) return null;
        const b = rng.intNZ(-9, 9);
        const c = rng.intNZ(-9, 9);
        if (a === c) return null;
        const d = x0.add(b).mul(a).sub(x0.mul(c));
        if (!d.isInt() || Math.abs(d.n) > 99) return null;
        const lhs = E.imul(
          E.n(a),
          E.group(
            poly([
              [1, 1],
              [b, 0],
            ]),
          ),
        );
        const rhs = poly([
          [c, 1],
          [d, 0],
        ]);
        const steps = [
          '<p>Раскроем скобки:</p>',
          h.block(
            ph([
              [a, 1],
              [a * b, 0],
            ]) +
              ' = ' +
              ph([
                [c, 1],
                [d, 0],
              ]),
          ),
          '<p>Перенесём слагаемые с <i>x</i> влево, числа — вправо:</p>',
          h.block(ph([[a - c, 1]]) + ' = ' + fmt(d.sub(a * b))),
          solveLine(d.sub(a * b), a - c, x0),
        ];
        return { lhs, rhs, root: x0, steps, pick: 'only' };
      });
    },
    // (x + p)/a = (x + q)/b
    proportion(rng) {
      return OGE.retry(rng, () => {
        const a = rng.int(2, 9);
        const b = rng.int(2, 9);
        if (a === b) return null;
        const pp = rng.intNZ(-9, 9);
        const q = rng.intNZ(-9, 9);
        // b(x + p) = a(x + q) → (b − a)x = aq − bp
        const x0 = new Frac(a * q - b * pp, b - a);
        if (!x0.isFiniteDecimal() || x0.decimalPlaces() > 2) return null;
        const lhs = E.over(
          poly([
            [1, 1],
            [pp, 0],
          ]),
          E.n(a),
        );
        const rhs = E.over(
          poly([
            [1, 1],
            [q, 0],
          ]),
          E.n(b),
        );
        const steps = [
          '<p>Воспользуемся основным свойством пропорции (перекрёстное умножение):</p>',
          h.block(
            b +
              '(' +
              ph([
                [1, 1],
                [pp, 0],
              ]) +
              ') = ' +
              a +
              '(' +
              ph([
                [1, 1],
                [q, 0],
              ]) +
              ')',
          ),
          h.block(
            ph([
              [b, 1],
              [b * pp, 0],
            ]) +
              ' = ' +
              ph([
                [a, 1],
                [a * q, 0],
              ]),
          ),
          h.block(ph([[b - a, 1]]) + ' = ' + fmt(a * q - b * pp)),
          solveLine(a * q - b * pp, b - a, x0),
        ];
        return { lhs, rhs, root: x0, steps, pick: 'only' };
      });
    },
    // a·x² + b·x + c = 0 с рациональными корнями
    quadratic(rng) {
      return OGE.retry(rng, () => {
        const a = rng.pick([1, 1, 1, 2, 4, 5, -1]);
        const r1 = new Frac(rng.int(-9, 9));
        const r2 = new Frac(rng.int(-20, 20), Math.abs(a));
        if (r1.eq(r2)) return null;
        // a(x − r1)(x − r2) = a·x² − a(r1 + r2)x + a·r1·r2
        const b = r1.add(r2).mul(-a);
        const c = r1.mul(r2).mul(a);
        if (!b.isInt() || !c.isInt() || b.isZero() || c.isZero() || Math.abs(c.n) > 120) return null;
        const pick = rng.pick(['max', 'min']);
        const moveC = rng.chance(0.25);
        const lhs = moveC
          ? poly([
              [a, 2],
              [b, 1],
            ])
          : poly([
              [a, 2],
              [b, 1],
              [c, 0],
            ]);
        const rhs = moveC ? E.n(c.neg()) : E.n(0);
        const D = b.mul(b).sub(c.mul(4 * a));
        const sD = Math.round(Math.sqrt(D.n));
        const x1 = b
          .neg()
          .add(sD)
          .div(2 * a);
        const x2 = b
          .neg()
          .sub(sD)
          .div(2 * a);
        const lo = x1.cmp(x2) < 0 ? x1 : x2;
        const hi = x1.cmp(x2) < 0 ? x2 : x1;
        const steps = [];
        if (moveC) {
          steps.push(
            '<p>Перенесём все слагаемые в левую часть:</p>',
            h.block(
              ph([
                [a, 2],
                [b, 1],
                [c, 0],
              ]) + ' = 0',
            ),
          );
        }
        steps.push(
          '<p>Коэффициенты: <i>a</i> = ' + fmt(a) + ', <i>b</i> = ' + fmt(b) + ', <i>c</i> = ' + fmt(c) + '. Дискриминант:</p>',
          h.block(
            '<i>D</i> = <i>b</i><sup>2</sup> ' +
              MINUS +
              ' 4<i>ac</i> = ' +
              p(b) +
              '<sup>2</sup> ' +
              MINUS +
              ' 4 · ' +
              p(a) +
              ' · ' +
              p(c) +
              ' = ' +
              fmt(D) +
              ' = ' +
              sD +
              '<sup>2</sup>',
          ),
          h.block(
            '<i>x</i><sub>1,2</sub> = ' +
              h.frac(MINUS + '<i>b</i> ± ' + h.sqrt('<i>D</i>'), '2<i>a</i>') +
              ' = ' +
              h.frac(fmt(b.neg()) + ' ± ' + sD, fmt(2 * a)),
          ),
          h.block('<i>x</i><sub>1</sub> = ' + fmt(x1) + ', &nbsp; <i>x</i><sub>2</sub> = ' + fmt(x2)),
          '<p>' + (pick === 'max' ? 'Больший' : 'Меньший') + ' корень: ' + fmt(pick === 'max' ? hi : lo) + '.</p>',
        );
        return { lhs, rhs, root: pick === 'max' ? hi : lo, steps, pick };
      });
    },
    // неполные квадратные уравнения
    incomplete(rng) {
      return OGE.retry(rng, () => {
        const kind = rng.pick(['bx', 'c']);
        const pick = rng.pick(['max', 'min']);
        if (kind === 'bx') {
          // a·x² + b·x = 0 → x(ax + b) = 0
          const a = rng.intNZ(-5, 5);
          const b = rng.intNZ(-30, 30);
          const r = new Frac(-b, a);
          if (!r.isFiniteDecimal() || r.decimalPlaces() > 1) return null;
          const lhs = poly([
            [a, 2],
            [b, 1],
          ]);
          const roots = [new Frac(0), r].sort((u, v) => u.cmp(v));
          const ans = pick === 'max' ? roots[1] : roots[0];
          const steps = [
            '<p>Вынесем <i>x</i> за скобки:</p>',
            h.block(
              '<i>x</i>(' +
                ph([
                  [a, 1],
                  [b, 0],
                ]) +
                ') = 0',
            ),
            '<p>Произведение равно нулю, когда один из множителей равен нулю: <i>x</i> = 0 или ' +
              h.m(
                ph([
                  [a, 1],
                  [b, 0],
                ]) + ' = 0',
              ) +
              ', откуда <i>x</i> = ' +
              fmt(r) +
              '.</p>',
            '<p>' + (pick === 'max' ? 'Больший' : 'Меньший') + ' корень: ' + fmt(ans) + '.</p>',
          ];
          return { lhs, rhs: E.n(0), root: ans, steps, pick };
        }
        // a·x² − c = 0, c/a = k²
        const a = rng.int(1, 5);
        const k = new Frac(rng.int(1, 12), rng.pick([1, 1, 2, 5]));
        const c = k.mul(k).mul(a);
        if (!c.isInt() || c.n > 400) return null;
        const form = rng.chance(0.5);
        const lhs = form
          ? poly([
              [a, 2],
              [c.neg(), 0],
            ])
          : poly([[a, 2]]);
        const rhs = form ? E.n(0) : E.n(c);
        const ans = pick === 'max' ? k : k.neg();
        const steps = [
          h.block((a === 1 ? '' : fmt(a)) + '<i>x</i><sup>2</sup> = ' + fmt(c) + (a === 1 ? '' : ', &nbsp; <i>x</i><sup>2</sup> = ' + fmt(c.div(a)))),
          '<p>Отсюда <i>x</i> = ' + fmt(k) + ' или <i>x</i> = ' + fmt(k.neg()) + ' (не забываем про отрицательный корень).</p>',
          '<p>' + (pick === 'max' ? 'Больший' : 'Меньший') + ' корень: ' + fmt(ans) + '.</p>',
        ];
        return { lhs, rhs, root: ans, steps, pick };
      });
    },
    // (x + p)² = (x + q)²
    squares(rng) {
      return OGE.retry(rng, () => {
        const pp = rng.intNZ(-9, 9);
        const q = rng.intNZ(-9, 9);
        if (pp === q || pp === -q) return null;
        const x0 = new Frac(-(pp + q), 2);
        const lhs = E.pow(
          E.group(
            poly([
              [1, 1],
              [pp, 0],
            ]),
          ),
          2,
        );
        const rhs = E.pow(
          E.group(
            poly([
              [1, 1],
              [q, 0],
            ]),
          ),
          2,
        );
        const steps = [
          '<p>Раскроем скобки по формуле квадрата суммы (разности):</p>',
          h.block(
            ph([
              [1, 2],
              [2 * pp, 1],
              [pp * pp, 0],
            ]) +
              ' = ' +
              ph([
                [1, 2],
                [2 * q, 1],
                [q * q, 0],
              ]),
          ),
          '<p><i>x</i><sup>2</sup> сокращается, уравнение становится линейным:</p>',
          h.block(ph([[2 * pp - 2 * q, 1]]) + ' = ' + fmt(q * q - pp * pp)),
          solveLine(q * q - pp * pp, 2 * pp - 2 * q, x0),
        ];
        return { lhs, rhs, root: x0, steps, pick: 'only' };
      });
    },
  };

  const WEIGHTS = { linear: 3, brackets: 2, proportion: 1, quadratic: 3, incomplete: 2, squares: 1 };

  OGE.registerTask(
    9,
    function (rng, opts) {
      const names = Object.keys(WEIGHTS);
      const subtype =
        opts.subtype ||
        rng.weighted(
          names,
          names.map((n) => WEIGHTS[n]),
        );
      const b = builders[subtype](rng);
      let q;
      if (b.pick === 'only') q = '<p>Найдите корень уравнения</p>';
      else q = '<p>Решите уравнение</p>';
      const tail =
        b.pick === 'only'
          ? ''
          : '<p>Если уравнение имеет более одного корня, в ответ запишите ' + (b.pick === 'max' ? 'больший' : 'меньший') + ' из корней.</p>';
      return {
        subtype,
        html: q + eqHtml(b.lhs, b.rhs) + tail,
        answer: { type: 'number', value: b.root },
        steps: b.steps.concat([OGE.answerLine(b.root)]),
        data: { lhs: expr.js(b.lhs), rhs: expr.js(b.rhs), pick: b.pick },
      };
    },
    Object.keys(WEIGHTS),
  );

  OGE.poly = poly;
})(globalThis);
