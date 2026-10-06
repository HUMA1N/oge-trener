/* Задание 11. Графики функций: соответствие графиков и формул (знаков коэффициентов). */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, MINUS } = OGE;
  const LET = ['А', 'Б', 'В'];
  const BOX = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };

  function sgn(v) {
    return v > 0 ? '&gt; 0' : '&lt; 0';
  }
  function iv(s) {
    return '<i>' + s + '</i>';
  }

  // Формула вида y = …: html для ученика, js — для автотестов, f — для рисования.
  function linear(k, b) {
    const kf = Frac.of(k);
    const node = OGE.poly([
      [kf, 1],
      [b, 0],
    ]);
    return {
      family: 'linear',
      k: kf.toNumber(),
      b,
      html: iv('y') + ' = ' + OGE.expr.html(node),
      js: OGE.expr.js(node),
      f: (x) => kf.toNumber() * x + b,
    };
  }
  function quadratic(a, b, c) {
    const node = OGE.poly([
      [a, 2],
      [b, 1],
      [c, 0],
    ]);
    return {
      family: 'parabola',
      a,
      b,
      c,
      html: iv('y') + ' = ' + OGE.expr.html(node),
      js: OGE.expr.js(node),
      f: (x) => a * x * x + b * x + c,
    };
  }
  function hyperbola(k) {
    return {
      family: 'hyperbola',
      k,
      html: iv('y') + ' = ' + (k < 0 ? MINUS : '') + h.frac(Math.abs(k), iv('x')),
      js: k + '/x',
      f: (x) => (x === 0 ? NaN : k / x),
    };
  }
  function root2(sign, shift) {
    // y = ±√x + shift
    return {
      family: 'sqrt',
      sign,
      shift,
      html: iv('y') + ' = ' + (sign < 0 ? MINUS : '') + h.sqrt(iv('x')) + (shift ? (shift > 0 ? ' + ' : ' ' + MINUS + ' ') + Math.abs(shift) : ''),
      js: (sign < 0 ? '-' : '') + 'Math.sqrt(x)' + (shift ? (shift > 0 ? '+' : '-') + Math.abs(shift) : ''),
      f: (x) => (x < 0 ? NaN : sign * Math.sqrt(x) + shift),
    };
  }

  function graphOf(fm) {
    const curves = OGE.draw.sampleCurve(fm.f, BOX, 0.05);
    return { curves, points: [].concat.apply([], curves) };
  }
  function plotHtml(curves) {
    return OGE.draw.plot(Object.assign({ curves, unit: 13 }, BOX));
  }

  function layout(graphs, items, itemsTitle) {
    return (
      '<div class="graphs">' +
      graphs.map((g, i) => '<figure class="graph"><figcaption>' + LET[i] + ')</figcaption>' + plotHtml(g.curves) + '</figure>').join('') +
      '</div>' +
      '<p class="items-title">' +
      itemsTitle +
      '</p>' +
      '<ol class="items">' +
      items.map((s) => '<li>' + s + '</li>').join('') +
      '</ol>' +
      '<p class="hint-format">В ответ запишите цифры, соответствующие графикам А, Б, В (например, 312).</p>'
    );
  }

  // ---- знаки k и b у прямых ----
  function linearSigns(rng) {
    const combos = rng.sample(
      [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ],
      3,
    );
    const fms = combos.map(([sk, sb]) => {
      const k = new Frac(rng.pick([1, 1, 2, 3, 1, 1]), rng.pick([1, 1, 2, 3])).mul(sk);
      const b = sb * rng.int(1, 3);
      return linear(k, b);
    });
    // формулировки — в случайном порядке; графики — в порядке combos
    const order = rng.shuffle([0, 1, 2]); // order[j] = индекс графика, описанного утверждением j
    const items = order.map((gi) => iv('k') + ' ' + sgn(combos[gi][0]) + ', ' + iv('b') + ' ' + sgn(combos[gi][1]));
    const answer = [0, 1, 2].map((gi) => order.indexOf(gi) + 1).join('');
    const graphs = fms.map(graphOf);
    return {
      html:
        '<p>На рисунках изображены графики функций вида ' +
        h.m(iv('y') + ' = ' + iv('kx') + ' + ' + iv('b')) +
        '. Установите соответствие между графиками функций и знаками коэффициентов ' +
        iv('k') +
        ' и ' +
        iv('b') +
        '.</p>' +
        layout(graphs, items, 'Коэффициенты:'),
      answer,
      steps: [
        '<p>Знак ' +
          iv('k') +
          ' показывает направление прямой: при ' +
          iv('k') +
          ' &gt; 0 функция возрастает (прямая идёт вверх слева направо), при ' +
          iv('k') +
          ' &lt; 0 — убывает. Число ' +
          iv('b') +
          ' — ордината точки пересечения прямой с осью ' +
          iv('y') +
          '.</p>',
        '<ul>' +
          fms
            .map(
              (fm, i) =>
                '<li>' +
                LET[i] +
                ') прямая ' +
                (fm.k > 0 ? 'возрастает' : 'убывает') +
                ' и пересекает ось ' +
                iv('y') +
                ' в точке (0; ' +
                fmt(fm.b) +
                ') ⇒ ' +
                iv('k') +
                ' ' +
                sgn(fm.k) +
                ', ' +
                iv('b') +
                ' ' +
                sgn(fm.b) +
                ' — это вариант ' +
                answer[i] +
                '.</li>',
            )
            .join('') +
          '</ul>',
      ],
      data: { kind: 'linear-signs', graphs: graphs.map((g) => g.points), items: order.map((gi) => ({ k: combos[gi][0], b: combos[gi][1] })) },
    };
  }

  // ---- знаки a и c у парабол ----
  function parabolaSigns(rng) {
    const combos = rng.sample(
      [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ],
      3,
    );
    const fms = combos.map(([sa, sc]) =>
      OGE.retry(rng, () => {
        const a = sa * rng.pick([1, 1, 0.5, 2]);
        const xv = rng.int(-3, 3);
        // вершина видна, и ветви идут через видимую часть рисунка
        const yv = sa < 0 ? rng.int(-1, 4) : rng.int(-4, 1);
        // y = a(x − xv)² + yv = a x² − 2a xv x + a xv² + yv
        const b = -2 * a * xv;
        const c = a * xv * xv + yv;
        if (Math.sign(c) !== sc || Math.abs(c) > 4 || c === 0 || !Number.isInteger(b) || !Number.isInteger(c)) return null;
        // вершина должна быть видна
        if (Math.abs(yv) > 4) return null;
        return quadratic(a, b, c);
      }),
    );
    const order = rng.shuffle([0, 1, 2]);
    const items = order.map((gi) => iv('a') + ' ' + sgn(combos[gi][0]) + ', ' + iv('c') + ' ' + sgn(combos[gi][1]));
    const answer = [0, 1, 2].map((gi) => order.indexOf(gi) + 1).join('');
    const graphs = fms.map(graphOf);
    return {
      html:
        '<p>На рисунках изображены графики функций вида ' +
        h.m(iv('y') + ' = ' + iv('ax') + '<sup>2</sup> + ' + iv('bx') + ' + ' + iv('c')) +
        '. Установите соответствие между знаками коэффициентов ' +
        iv('a') +
        ' и ' +
        iv('c') +
        ' и графиками функций.</p>' +
        layout(graphs, items, 'Коэффициенты:'),
      answer,
      steps: [
        '<p>Если ' +
          iv('a') +
          ' &gt; 0, ветви параболы направлены вверх, если ' +
          iv('a') +
          ' &lt; 0 — вниз. ' +
          'При ' +
          iv('x') +
          ' = 0 получаем ' +
          iv('y') +
          ' = ' +
          iv('c') +
          ', значит, ' +
          iv('c') +
          ' — ордината точки пересечения параболы с осью ' +
          iv('y') +
          '.</p>',
        '<ul>' +
          fms
            .map(
              (fm, i) =>
                '<li>' +
                LET[i] +
                ') ветви ' +
                (fm.a > 0 ? 'вверх' : 'вниз') +
                ', ось ' +
                iv('y') +
                ' пересекается ' +
                (fm.c > 0 ? 'выше' : 'ниже') +
                ' начала координат ⇒ ' +
                iv('a') +
                ' ' +
                sgn(fm.a) +
                ', ' +
                iv('c') +
                ' ' +
                sgn(fm.c) +
                ' — вариант ' +
                answer[i] +
                '.</li>',
            )
            .join('') +
          '</ul>',
      ],
      data: { kind: 'parabola-signs', graphs: graphs.map((g) => g.points), items: order.map((gi) => ({ a: combos[gi][0], c: combos[gi][1] })) },
    };
  }

  // ---- графики разных функций и формулы ----
  const FAMILY_TEXT = {
    linear: 'прямая — график линейной функции ' + iv('y') + ' = ' + iv('kx') + ' + ' + iv('b'),
    parabola: 'парабола — график квадратичной функции',
    hyperbola: 'гипербола — график функции ' + iv('y') + ' = ' + h.frac(iv('k'), iv('x')),
    sqrt: 'половина параболы, лежащая «на боку», — график функции с корнем ' + h.sqrt(iv('x')),
  };

  function makeFamily(rng, fam) {
    if (fam === 'linear') {
      const k = rng.pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5]);
      return linear(k, rng.int(-3, 3));
    }
    if (fam === 'parabola') {
      return OGE.retry(rng, () => {
        const a = rng.pick([1, -1]);
        const xv = rng.int(-2, 2);
        const yv = rng.int(-3, 3);
        const b = -2 * a * xv;
        const c = a * xv * xv + yv;
        if (Math.abs(c) > 9) return null;
        return quadratic(a, b, c);
      });
    }
    if (fam === 'hyperbola') return hyperbola(rng.pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]));
    return root2(rng.pick([1, -1]), rng.int(-2, 2));
  }

  function formulas(rng) {
    const fams = rng.sample(['linear', 'parabola', 'hyperbola', 'sqrt', 'linear', 'parabola', 'hyperbola'], 3);
    const fms = OGE.retry(rng, () => {
      const list = fams.map((f) => makeFamily(rng, f));
      const keys = list.map((f) => f.html);
      if (new Set(keys).size < 3) return null;
      // графики не должны совпадать на видимой части
      const gs = list.map(graphOf);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j && matches(list[j], gs[i].points)) return null;
      return list;
    });
    const graphs = fms.map(graphOf);
    const order = rng.shuffle([0, 1, 2]);
    const items = order.map((gi) => h.m(fms[gi].html));
    const answer = [0, 1, 2].map((gi) => order.indexOf(gi) + 1).join('');
    return {
      html: '<p>Установите соответствие между графиками функций и формулами, которые их задают.</p>' + layout(graphs, items, 'Формулы:'),
      answer,
      steps: [
        '<p>Определим вид каждого графика и проверим характерные точки.</p>',
        '<ul>' +
          fms
            .map(
              (fm, i) =>
                '<li>' + LET[i] + ') ' + FAMILY_TEXT[fm.family] + '; ' + checkPoint(fm) + ' Подходит формула ' + answer[i] + ': ' + h.m(fm.html) + '.</li>',
            )
            .join('') +
          '</ul>',
      ],
      data: { kind: 'formulas', graphs: graphs.map((g) => g.points), formulas: order.map((gi) => fms[gi].js) },
    };
  }

  function matches(fm, points) {
    return points.every((p) => Math.abs(fm.f(p[0]) - p[1]) < 1e-6);
  }

  // Подсказка: точка, через которую проходит график.
  function checkPoint(fm) {
    const xs = fm.family === 'hyperbola' ? [1, 2, -1] : fm.family === 'sqrt' ? [0, 1, 4] : [0, 1, -1];
    for (const x of xs) {
      const y = fm.f(x);
      if (isFinite(y) && Math.abs(y) <= 5 && Number.isInteger(y)) {
        return 'график проходит через точку (' + fmt(x) + '; ' + fmt(y) + ').';
      }
    }
    return '';
  }

  const builders = { 'linear-signs': linearSigns, 'parabola-signs': parabolaSigns, formulas };

  OGE.registerTask(
    11,
    function (rng, opts) {
      const names = Object.keys(builders);
      const subtype = opts.subtype || rng.pick(names);
      const b = builders[subtype](rng);
      return {
        subtype,
        html: b.html,
        answer: { type: 'seq', value: b.answer },
        steps: b.steps.concat([OGE.answerLine(b.answer)]),
        data: b.data,
      };
    },
    Object.keys(builders),
  );
})(globalThis);
