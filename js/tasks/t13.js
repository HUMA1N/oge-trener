/* Задание 13. Неравенства и системы неравенств. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, MINUS, expr } = OGE;
  const poly = (t) => OGE.poly(t);
  const INF = Infinity;

  const SIGN = {
    '>': { html: '&gt;', js: '>', strict: true, flip: '<' },
    '<': { html: '&lt;', js: '<', strict: true, flip: '>' },
    '>=': { html: '≥', js: '>=', strict: false, flip: '<=' },
    '<=': { html: '≤', js: '<=', strict: false, flip: '>=' },
  };

  // Промежуток в записи «[−3; 5)».
  function setText(set) {
    if (!set.length) return '∅';
    return set
      .map((s) => {
        const lo = s.lo === -INF ? '(' + MINUS + '∞' : (s.loIn ? '[' : '(') + fmt(s.lo);
        const hi = s.hi === INF ? '+∞)' : fmt(s.hi) + (s.hiIn ? ']' : ')');
        return lo + '; ' + hi;
      })
      .join(' ∪ ');
  }
  // Луч из решения x (sign) v.
  function ray(sign, v) {
    v = Frac.of(v).toNumber();
    if (sign === '>' || sign === '>=') return [{ lo: v, hi: INF, loIn: sign === '>=', hiIn: false }];
    return [{ lo: -INF, hi: v, loIn: false, hiIn: sign === '<=' }];
  }
  // Во всех вариантах одни и те же отметки стоят на одних и тех же местах.
  function pictures(sets) {
    const ends = [];
    sets.forEach((set) => set.forEach((s) => [s.lo, s.hi].forEach((v) => isFinite(v) && ends.indexOf(v) < 0 && ends.push(v))));
    ends.sort((a, b) => a - b);
    return OGE.optionsHtml(
      sets.map((s) => OGE.draw.intervalLine(s, { ends })),
      'opts-pics',
    );
  }
  function shuffleOptions(rng, correct, wrong) {
    const all = rng.shuffle([correct].concat(wrong));
    return { sets: all, idx: all.indexOf(correct) + 1 };
  }

  // ---- линейное неравенство ----
  function linear(rng) {
    return OGE.retry(rng, () => {
      const a = rng.intNZ(-9, 9);
      const c = rng.intNZ(-9, 9);
      if (a === c) return null;
      const b = rng.int(-20, 20);
      const sign = rng.pick(Object.keys(SIGN));
      const x0 = new Frac(rng.int(-40, 40), rng.pick([1, 1, 2, 5]));
      const d = x0.mul(a - c).add(b); // a x0 + b = c x0 + d  ⇒  d = (a − c)x0 + b
      if (!d.isInt() || Math.abs(d.n) > 60) return null;
      const k = a - c;
      const rhs = d.sub(b);
      const resSign = k > 0 ? sign : SIGN[sign].flip;
      const correct = ray(resSign, x0);
      // типичная ошибка — неверный знак при переносе: x1 = (d + b) / k
      const x1 = d.add(b).div(k);
      if (x1.eq(x0) || !x1.isFiniteDecimal() || x1.decimalPlaces() > 1) return null;
      const wrong = [ray(SIGN[resSign].flip, x0), ray(resSign, x1), ray(SIGN[resSign].flip, x1)];
      const { sets, idx } = shuffleOptions(rng, correct, wrong);
      const L = poly([
        [a, 1],
        [b, 0],
      ]);
      const R = poly([
        [c, 1],
        [d, 0],
      ]);
      const steps = [
        '<p>Перенесём слагаемые с <i>x</i> влево, числа — вправо (с противоположным знаком):</p>',
        h.block(expr.html(poly([[k, 1]])) + ' ' + SIGN[sign].html + ' ' + fmt(rhs)),
        k > 0
          ? '<p>Делим на положительное число ' + fmt(k) + ', знак неравенства сохраняется:</p>'
          : '<p>Делим на отрицательное число ' + fmt(k) + ' — знак неравенства <b>меняется на противоположный</b>:</p>',
        h.block('<i>x</i> ' + SIGN[resSign].html + ' ' + fmt(x0)),
        '<p>Решение: ' +
          setText(correct) +
          '. ' +
          (SIGN[resSign].strict
            ? 'Неравенство строгое — точка ' + fmt(x0) + ' «выколота».'
            : 'Неравенство нестрогое — точка ' + fmt(x0) + ' входит в решение (закрашена).') +
          ' Это рисунок ' +
          idx +
          '.</p>',
      ];
      return {
        html: '<p>Укажите решение неравенства</p>' + h.block(expr.html(L) + ' ' + SIGN[sign].html + ' ' + expr.html(R)) + pictures(sets),
        idx,
        steps,
        data: { kind: 'sets', ineq: expr.js(L) + ' ' + SIGN[sign].js + ' ' + expr.js(R), options: sets.map(serialize) },
      };
    });
  }

  // ---- квадратное неравенство ----
  function quadratic(rng) {
    return OGE.retry(rng, () => {
      const form = rng.pick(['expanded', 'factored', 'square', 'zero-root']);
      let r1;
      let r2;
      if (form === 'square') {
        const m = rng.int(1, 12);
        r1 = -m;
        r2 = m;
      } else if (form === 'zero-root') {
        r1 = 0;
        r2 = rng.intNZ(-12, 12);
      } else {
        r1 = rng.int(-9, 9);
        r2 = rng.int(-9, 9);
      }
      if (r1 === r2) return null;
      if (r1 > r2) [r1, r2] = [r2, r1];
      // ложные корни (ошибка в знаках): −r2, −r1
      if (r1 === -r2) {
        if (form !== 'square') return null;
      }
      const sign = rng.pick(Object.keys(SIGN));
      const inc = !SIGN[sign].strict;
      const inside = [{ lo: r1, hi: r2, loIn: inc, hiIn: inc }];
      const outside = [
        { lo: -INF, hi: r1, loIn: false, hiIn: inc },
        { lo: r2, hi: INF, loIn: inc, hiIn: false },
      ];
      const wantInside = sign === '<' || sign === '<=';
      const correct = wantInside ? inside : outside;
      let wrong;
      if (form === 'square') {
        // для x² ∨ m² типичные ошибки: луч x ∨ m
        wrong = [wantInside ? outside : inside, ray(sign, r2), ray(SIGN[sign].flip, r1)];
      } else {
        const w1 = -r2;
        const w2 = -r1;
        const wInside = [{ lo: w1, hi: w2, loIn: inc, hiIn: inc }];
        const wOutside = [
          { lo: -INF, hi: w1, loIn: false, hiIn: inc },
          { lo: w2, hi: INF, loIn: inc, hiIn: false },
        ];
        wrong = [wantInside ? outside : inside, wInside, wOutside];
      }
      const { sets, idx } = shuffleOptions(rng, correct, wrong);
      if (new Set(sets.map((s) => JSON.stringify(s))).size < 4) return null;
      // (x − r1)(x − r2) = x² − (r1 + r2)x + r1·r2
      let L;
      let R = E0();
      if (form === 'factored')
        L = OGE.E.imul(
          OGE.E.group(
            poly([
              [1, 1],
              [-r1, 0],
            ]),
          ),
          OGE.E.group(
            poly([
              [1, 1],
              [-r2, 0],
            ]),
          ),
        );
      else if (form === 'square') {
        if (rng.chance(0.5)) {
          L = poly([[1, 2]]);
          R = OGE.E.n(r2 * r2);
        } else
          L = poly([
            [1, 2],
            [-r2 * r2, 0],
          ]);
      } else
        L = poly([
          [1, 2],
          [-(r1 + r2), 1],
          [r1 * r2, 0],
        ]);
      if (form === 'factored' && (r1 === 0 || r2 === 0)) return null;
      const steps = [
        '<p>Найдём нули левой части (корни уравнения ' +
          h.m(expr.html(L) + ' = ' + expr.html(R)) +
          '): ' +
          h.m('<i>x</i> = ' + fmt(r1)) +
          ' и ' +
          h.m('<i>x</i> = ' + fmt(r2)) +
          '.</p>',
        (R.t === 'num' && R.v.isZero()
          ? '<p>Левая часть раскладывается на множители: '
          : '<p>Перенесём всё в левую часть: ' +
            h.m(
              expr.html(
                poly([
                  [1, 2],
                  [-r2 * r2, 0],
                ]),
              ) +
                ' ' +
                SIGN[sign].html +
                ' 0',
            ) +
            ', и разложим на множители: ') +
          h.m(factor(r1) + factor(r2)) +
          '. График ' +
          h.m('<i>y</i> = ' + factor(r1) + factor(r2)) +
          ' — ' +
          'парабола с ветвями вверх: она ниже оси <i>x</i> между корнями и выше — вне отрезка между ними.</p>',
        '<p>Нужно, чтобы выражение было ' +
          (wantInside ? 'меньше' : 'больше') +
          ' нуля' +
          (inc ? ' или равно нулю' : '') +
          ', поэтому ' +
          (wantInside ? 'берём промежуток между корнями' : 'берём промежутки вне корней') +
          ': ' +
          setText(correct) +
          '. Это рисунок ' +
          idx +
          '.</p>',
      ];
      return {
        html: '<p>Укажите решение неравенства</p>' + h.block(expr.html(L) + ' ' + SIGN[sign].html + ' ' + expr.html(R)) + pictures(sets),
        idx,
        steps,
        data: { kind: 'sets', ineq: '(' + expr.js(L) + ') ' + SIGN[sign].js + ' (' + expr.js(R) + ')', options: sets.map(serialize) },
      };
    });
  }
  function E0() {
    return OGE.E.n(0);
  }
  // Множитель (x − r): «x», «(x − 3)», «(x + 2)».
  function factor(r) {
    return r === 0
      ? '<i>x</i>'
      : '(' +
          expr.html(
            poly([
              [1, 1],
              [-r, 0],
            ]),
          ) +
          ')';
  }

  // ---- система линейных неравенств ----
  function system(rng) {
    return OGE.retry(rng, () => {
      // x ≥ lo (или >) и x ≤ hi (или <), lo < hi
      const lo = new Frac(rng.int(-30, 20), rng.pick([1, 1, 5, 2]));
      const hi = new Frac(rng.int(-20, 30), rng.pick([1, 1, 5, 2]));
      if (hi.cmp(lo) <= 0 || hi.sub(lo).toNumber() > 15) return null;
      if (lo.decimalPlaces() > 1 || hi.decimalPlaces() > 1) return null;
      const s1 = rng.pick(['>', '>=']);
      const s2 = rng.pick(['<', '<=']);
      // Первое неравенство: x + a s1 b  ⇔ x s1 b − a. Второе: c − x s2' e  или  k·x s2 m.
      const a = new Frac(rng.int(-9, 9));
      const b = lo.add(a);
      const k = rng.pick([2, 3, 4, 5, -2, -3]);
      // k·x ? m: при k < 0 знак второго неравенства в записи противоположен
      const m = hi.mul(k);
      if (!m.isFiniteDecimal() || m.decimalPlaces() > 1 || !b.isFiniteDecimal() || b.decimalPlaces() > 1) return null;
      const s2shown = k > 0 ? s2 : SIGN[s2].flip;
      const ineq1L = a.isZero()
        ? poly([[1, 1]])
        : poly([
            [1, 1],
            [a, 0],
          ]);
      const ineq2L = poly([[k, 1]]);
      const correct = [{ lo: lo.toNumber(), hi: hi.toNumber(), loIn: s1 === '>=', hiIn: s2 === '<=' }];
      const wrong = [
        ray(s1, lo),
        ray(s2, hi),
        [
          { lo: -INF, hi: lo.toNumber(), loIn: false, hiIn: s1 === '>' },
          { lo: hi.toNumber(), hi: INF, loIn: s2 === '<', hiIn: false },
        ],
      ];
      const { sets, idx } = shuffleOptions(rng, correct, wrong);
      const line1 = expr.html(ineq1L) + ' ' + SIGN[s1].html + ' ' + fmt(b);
      const line2 = expr.html(ineq2L) + ' ' + SIGN[s2shown].html + ' ' + fmt(m);
      const steps = [
        '<p>Решим каждое неравенство системы.</p>',
        h.block(line1 + ' &nbsp;⇔&nbsp; <i>x</i> ' + SIGN[s1].html + ' ' + fmt(lo)),
        h.block(line2 + ' &nbsp;⇔&nbsp; <i>x</i> ' + SIGN[s2].html + ' ' + fmt(hi)),
        k < 0 ? '<p>Во втором неравенстве делим на отрицательное число ' + fmt(k) + ', поэтому знак неравенства меняется.</p>' : '',
        '<p>Решение системы — общая часть (пересечение) решений: ' + setText(correct) + '. Это рисунок ' + idx + '.</p>',
      ];
      return {
        html:
          '<p>Укажите решение системы неравенств</p>' +
          h.block('<span class="system"><span>' + line1 + ',</span><span>' + line2 + '.</span></span>') +
          pictures(sets),
        idx,
        steps,
        data: {
          kind: 'sets',
          ineq: '(' + expr.js(ineq1L) + ' ' + SIGN[s1].js + ' ' + b.toNumber() + ') && (' + expr.js(ineq2L) + ' ' + SIGN[s2shown].js + ' ' + m.toNumber() + ')',
          options: sets.map(serialize),
        },
      };
    });
  }

  // ---- неравенство без решений / с решением «любое число» ----
  function noSolution(rng) {
    return OGE.retry(rng, () => {
      const m = rng.int(-6, 6);
      const kk = rng.int(1, 30);
      // f = (x − m)² + kk > 0 всегда;  g = (x − m)² − kk меняет знак
      const f = poly([
        [1, 2],
        [-2 * m, 1],
        [m * m + kk, 0],
      ]);
      const g = poly([
        [1, 2],
        [-2 * m, 1],
        [m * m - kk, 0],
      ]);
      if (m * m - kk === 0 || m * m + kk > 99 || Math.abs(m * m - kk) > 99) return null;
      const ask = rng.pick(['none', 'all']);
      const opts = [
        { node: f, sign: '<', kind: 'none' },
        { node: f, sign: '>', kind: 'all' },
        { node: g, sign: '<', kind: 'some' },
        { node: g, sign: '>', kind: 'some' },
      ];
      const order = rng.shuffle(opts);
      const idx = order.findIndex((o) => o.kind === ask) + 1;
      const txt = (o) => h.m(expr.html(o.node) + ' ' + SIGN[o.sign].html + ' 0');
      const D = (c) => 4 * m * m - 4 * c;
      const steps = [
        '<p>Выделим полный квадрат:</p>',
        h.block(expr.html(f) + ' = (<i>x</i> ' + (m < 0 ? '+ ' + -m : MINUS + ' ' + m) + ')<sup>2</sup> + ' + kk),
        '<p>Квадрат неотрицателен, поэтому это выражение всегда положительно (дискриминант ' +
          h.m('<i>D</i> = ' + fmt(D(m * m + kk))) +
          ' &lt; 0, ветви вверх).</p>',
        '<p>Значит, ' +
          txt({ node: f, sign: '<' }) +
          ' не имеет решений, а ' +
          txt({ node: f, sign: '>' }) +
          ' верно при любом <i>x</i>. ' +
          'У ' +
          h.m(expr.html(g)) +
          ' дискриминант ' +
          h.m('<i>D</i> = ' + fmt(D(m * m - kk))) +
          ' &gt; 0 — оно принимает значения разных знаков.</p>',
        '<p>' + (ask === 'none' ? 'Не имеет решений неравенство № ' : 'Любое число является решением неравенства № ') + idx + '.</p>',
      ];
      return {
        html:
          '<p>Укажите неравенство, ' +
          (ask === 'none' ? 'которое не имеет решений.' : 'решением которого является любое число.') +
          '</p>' +
          OGE.optionsHtml(order.map(txt)),
        idx,
        steps,
        data: { kind: 'empty-all', ask, options: order.map((o) => expr.js(o.node) + ' ' + SIGN[o.sign].js + ' 0') },
      };
    });
  }

  function serialize(set) {
    return set.map((s) => ({
      lo: isFinite(s.lo) ? s.lo : s.lo > 0 ? 'inf' : '-inf',
      hi: isFinite(s.hi) ? s.hi : s.hi > 0 ? 'inf' : '-inf',
      loIn: s.loIn,
      hiIn: s.hiIn,
    }));
  }

  const builders = { linear, quadratic, system, 'no-solution': noSolution };
  const WEIGHTS = { linear: 3, quadratic: 3, system: 2, 'no-solution': 1 };

  OGE.registerTask(
    13,
    function (rng, opts) {
      const names = Object.keys(WEIGHTS);
      const subtype =
        opts.subtype ||
        rng.weighted(
          names,
          names.map((n) => WEIGHTS[n]),
        );
      const b = builders[subtype](rng);
      return {
        subtype,
        html: b.html,
        answer: { type: 'number', value: b.idx },
        steps: b.steps.concat([OGE.answerLine(b.idx)]),
        data: b.data,
      };
    },
    Object.keys(WEIGHTS),
  );
  OGE.setText = setText;
})(globalThis);
