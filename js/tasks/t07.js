/* Задание 7. Числа на координатной прямой. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { h, fmt, MINUS } = OGE;
  const LETTERS = ['A', 'B', 'C', 'D'];

  function isSquare(n) {
    const r = Math.round(Math.sqrt(n));
    return r * r === n;
  }

  // Случайное «число» вида √N или p/q, не целое, из промежутка (lo; hi).
  function randNumber(rng, kind, lo, hi) {
    return OGE.retry(rng, () => {
      if (kind === 'sqrt') {
        const N = rng.int(Math.max(2, Math.ceil(lo * lo)), Math.floor(hi * hi));
        if (isSquare(N)) return null;
        return { kind, N, value: Math.sqrt(N), html: h.sqrt(N) };
      }
      const q = rng.int(3, 13);
      const p = rng.int(Math.ceil(lo * q), Math.floor(hi * q));
      if (p <= 0 || p % q === 0 || OGE.gcd(p, q) !== 1) return null;
      return { kind, p, q, value: p / q, html: h.frac(p, q) };
    });
  }

  function whyInterval(num) {
    const k = Math.floor(num.value);
    if (num.kind === 'sqrt') {
      return (
        k +
        '<sup>2</sup> = ' +
        k * k +
        ' &lt; ' +
        num.N +
        ' &lt; ' +
        (k + 1) * (k + 1) +
        ' = ' +
        (k + 1) +
        '<sup>2</sup>, значит, ' +
        k +
        ' &lt; ' +
        num.html +
        ' &lt; ' +
        (k + 1) +
        '.'
      );
    }
    const rem = num.p - k * num.q;
    return (
      num.html +
      ' = ' +
      k +
      ' целых ' +
      rem +
      '/' +
      num.q +
      ' (делим ' +
      num.p +
      ' на ' +
      num.q +
      ' с остатком), значит, ' +
      k +
      ' &lt; ' +
      num.html +
      ' &lt; ' +
      (k + 1) +
      '.'
    );
  }

  function ticks(min, max) {
    const t = [];
    for (let x = min; x <= max; x++) t.push({ x, label: fmt(x) });
    return t;
  }

  // ---- Какая точка соответствует числу ----
  function whichPoint(rng) {
    const kind = rng.pick(['sqrt', 'sqrt', 'frac']);
    const num = randNumber(rng, kind, 1.05, 9.95);
    const k = Math.floor(num.value);
    const min = k - 2;
    const max = k + 3;
    const xs = OGE.retry(rng, () => {
      const others = [];
      for (let i = 0; i < 3; i++) {
        let x;
        do x = rng.int(min * 10 + 2, (max - 1) * 10 + 8) / 10;
        while ((x > k - 0.05 && x < k + 1.05) || Number.isInteger(x));
        others.push(x);
      }
      const all = others.concat([num.value]).sort((a, b) => a - b);
      for (let i = 1; i < all.length; i++) if (all[i] - all[i - 1] < 0.45) return null;
      return all;
    });
    const points = xs.map((x, i) => ({ x, label: LETTERS[i] }));
    const idx = xs.indexOf(num.value);
    const html =
      '<p>На координатной прямой отмечены точки ' +
      LETTERS.join(', ') +
      '. Одна из них соответствует числу ' +
      h.m(num.html) +
      '. Какая это точка?</p>' +
      OGE.draw.numberLine({ min, max, ticks: ticks(min, max), points }) +
      OGE.optionsHtml(
        LETTERS.map((L) => 'точка <i>' + L + '</i>'),
        'opts-row',
      );
    return {
      subtype: 'which-point',
      html,
      answer: { type: 'number', value: idx + 1 },
      steps: [
        '<p>Оценим число: ' + whyInterval(num) + '</p>',
        '<p>Между ' + k + ' и ' + (k + 1) + ' на прямой лежит только точка <i>' + LETTERS[idx] + '</i> — это вариант ' + (idx + 1) + '.</p>',
        OGE.answerLine(idx + 1),
      ],
      data: { number: num, points },
    };
  }

  // ---- Какое из чисел отмечено точкой ----
  function whichNumber(rng) {
    const kind = rng.pick(['sqrt', 'frac']);
    const right = randNumber(rng, kind, 1.1, 8.9);
    const k = Math.floor(right.value);
    const opts = OGE.retry(rng, () => {
      // неверные числа берём левее k или правее k + 1 — но не из промежутка (k; k + 1)
      const ranges = [
        [Math.max(1.05, k - 3), k - 0.05],
        [k + 1.05, k + 3.95],
      ].filter((r) => r[1] - r[0] > 0.3);
      const wrong = [];
      for (let i = 0; i < 3; i++) {
        const [lo, hi] = rng.pick(ranges);
        wrong.push(randNumber(rng, kind, lo, hi));
      }
      const all = wrong.concat([right]);
      const vals = all.map((o) => o.value.toFixed(6));
      if (new Set(vals).size !== 4) return null;
      return rng.shuffle(all);
    });
    const idx = opts.indexOf(right);
    const min = k - 1;
    const max = k + 2;
    const html =
      '<p>Одно из чисел отмечено на координатной прямой точкой <i>A</i>. Какое это число?</p>' +
      OGE.draw.numberLine({ min, max, ticks: ticks(min, max), points: [{ x: right.value, label: 'A' }] }) +
      OGE.optionsHtml(
        opts.map((o) => h.m(o.html)),
        'opts-row',
      );
    const steps = [
      '<p>Точка <i>A</i> лежит между ' + k + ' и ' + (k + 1) + '. Оценим каждое число:</p>',
      '<ul>' +
        opts
          .map((o, i) => {
            const ok = o === right;
            return '<li>' + (i + 1) + ') ' + whyInterval(o) + (ok ? ' <b>Подходит.</b>' : ' Не подходит.') + '</li>';
          })
          .join('') +
        '</ul>',
      OGE.answerLine(idx + 1),
    ];
    return {
      subtype: 'which-number',
      html,
      answer: { type: 'number', value: idx + 1 },
      steps,
      data: { pointX: right.value, options: opts },
    };
  }

  // ---- Утверждения о числе a ----
  const A_TEMPLATES = [
    { html: (m) => 'a ' + MINUS + ' ' + m + ' &gt; 0', js: (m) => 'a - ' + m + ' > 0', test: (a, m) => a - m > 0 },
    { html: (m) => 'a ' + MINUS + ' ' + m + ' &lt; 0', js: (m) => 'a - ' + m + ' < 0', test: (a, m) => a - m < 0 },
    { html: (m) => m + ' ' + MINUS + ' a &gt; 0', js: (m) => m + ' - a > 0', test: (a, m) => m - a > 0 },
    { html: (m) => m + ' ' + MINUS + ' a &lt; 0', js: (m) => m + ' - a < 0', test: (a, m) => m - a < 0 },
    { html: (m) => 'a + ' + m + ' &gt; 0', js: (m) => 'a + ' + m + ' > 0', test: (a, m) => a + m > 0 },
    { html: (m) => 'a + ' + m + ' &lt; 0', js: (m) => 'a + ' + m + ' < 0', test: (a, m) => a + m < 0 },
  ];

  function statementsA(rng) {
    const k = rng.int(-6, 6);
    const x = k + rng.int(25, 75) / 100;
    const chosen = OGE.retry(rng, () => {
      const list = [];
      const seen = new Set();
      while (list.length < 4) {
        const ti = rng.int(0, A_TEMPLATES.length - 1);
        const m = rng.int(1, 9);
        const key = ti + ':' + m;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ ti, m, truth: A_TEMPLATES[ti].test(x, m) });
      }
      return list.filter((s) => s.truth).length === 1 ? list : null;
    });
    const idx = chosen.findIndex((s) => s.truth);
    const min = Math.min(k - 2, 0);
    const max = Math.max(k + 3, 1);
    const tickList = ticks(min, max);
    const html =
      '<p>На координатной прямой отмечено число <i>a</i>. Какое из утверждений относительно этого числа является верным?</p>' +
      OGE.draw.numberLine({ min, max, ticks: tickList, points: [{ x, label: 'a' }] }) +
      OGE.optionsHtml(chosen.map((s) => h.m(fmtVar(A_TEMPLATES[s.ti].html(s.m)))));
    const lines = chosen.map((s, i) => {
      const t = A_TEMPLATES[s.ti];
      return '<li>' + (i + 1) + ') ' + h.m(fmtVar(t.html(s.m))) + ' — ' + explainA(s.ti, s.m, k) + (s.truth ? ' <b>Верно.</b>' : ' Неверно.') + '</li>';
    });
    return {
      subtype: 'statements-a',
      html,
      answer: { type: 'number', value: idx + 1 },
      steps: [
        '<p>По рисунку ' + fmt(k) + ' &lt; <i>a</i> &lt; ' + fmt(k + 1) + '. Проверим каждое утверждение:</p>',
        '<ul>' + lines.join('') + '</ul>',
        OGE.answerLine(idx + 1),
      ],
      data: { pointX: x, interval: [k, k + 1], options: chosen.map((s) => A_TEMPLATES[s.ti].js(s.m)) },
    };
  }

  function fmtVar(s) {
    return s
      .replace(/\bab\b/g, '<i>ab</i>')
      .replace(/\ba\b/g, '<i>a</i>')
      .replace(/\bb\b/g, '<i>b</i>');
  }

  function explainA(ti, m, k) {
    // Перепишем утверждение как сравнение a с числом.
    const rel = [
      ['&gt;', m],
      ['&lt;', m],
      ['&lt;', m],
      ['&gt;', m],
      ['&gt;', -m],
      ['&lt;', -m],
    ][ti];
    const c = rel[1];
    const actual = k >= c ? '&gt;' : '&lt;'; // a ∈ (k; k+1), c — целое
    return 'это то же, что <i>a</i> ' + rel[0] + ' ' + fmt(c) + ', а на самом деле <i>a</i> ' + actual + ' ' + fmt(c) + '.';
  }

  // ---- Утверждения о числах a и b ----
  const AB_TEMPLATES = [
    { html: 'a + b &gt; 0', js: 'a + b > 0' },
    { html: 'a + b &lt; 0', js: 'a + b < 0' },
    { html: 'a ' + MINUS + ' b &gt; 0', js: 'a - b > 0' },
    { html: 'a ' + MINUS + ' b &lt; 0', js: 'a - b < 0' },
    { html: 'ab &gt; 0', js: 'a * b > 0' },
    { html: 'ab &lt; 0', js: 'a * b < 0' },
    { html: 'b ' + MINUS + ' a &lt; 0', js: 'b - a < 0' },
    { html: 'b ' + MINUS + ' a &gt; 0', js: 'b - a > 0' },
  ];

  function evalAB(js, a, b) {
    switch (js) {
      case 'a + b > 0':
        return a + b > 0;
      case 'a + b < 0':
        return a + b < 0;
      case 'a - b > 0':
        return a - b > 0;
      case 'a - b < 0':
        return a - b < 0;
      case 'a * b > 0':
        return a * b > 0;
      case 'a * b < 0':
        return a * b < 0;
      case 'b - a < 0':
        return b - a < 0;
      case 'b - a > 0':
        return b - a > 0;
    }
    throw new Error(js);
  }

  // Истинность одинакова во всём прямоугольнике (ka; ka+1) × (kb; kb+1)?
  function constantTruth(js, ka, kb) {
    let first = null;
    for (let i = 0; i <= 4; i++) {
      for (let j = 0; j <= 4; j++) {
        const a = ka + 0.001 + i * 0.2495;
        const b = kb + 0.001 + j * 0.2495;
        const v = evalAB(js, a, b);
        if (first === null) first = v;
        else if (v !== first) return null;
      }
    }
    return first;
  }

  function statementsAB(rng) {
    const pick = OGE.retry(rng, () => {
      const ka = rng.int(-5, 4);
      const kb = rng.int(-5, 4);
      if (Math.abs(ka - kb) < 2) return null;
      const valid = [];
      AB_TEMPLATES.forEach((t, i) => {
        const v = constantTruth(t.js, ka, kb);
        if (v !== null) valid.push({ i, truth: v });
      });
      const trues = valid.filter((v) => v.truth);
      const falses = valid.filter((v) => !v.truth);
      if (!trues.length || falses.length < 3) return null;
      const list = rng.shuffle([rng.pick(trues)].concat(rng.sample(falses, 3)));
      return { ka, kb, list };
    });
    const { ka, kb, list } = pick;
    const a = ka + rng.int(25, 75) / 100;
    const b = kb + rng.int(25, 75) / 100;
    const idx = list.findIndex((s) => s.truth);
    const min = Math.min(ka, kb, 0) - 1;
    const max = Math.max(ka, kb, 0) + 2;
    const html =
      '<p>На координатной прямой отмечены числа <i>a</i> и <i>b</i>. Какое из следующих утверждений верно?</p>' +
      OGE.draw.numberLine({
        min,
        max,
        ticks: ticks(min, max),
        points: [
          { x: a, label: 'a' },
          { x: b, label: 'b' },
        ],
      }) +
      OGE.optionsHtml(list.map((s) => h.m(fmtVar(AB_TEMPLATES[s.i].html))));
    const facts =
      '<p>По рисунку ' +
      fmt(ka) +
      ' &lt; <i>a</i> &lt; ' +
      fmt(ka + 1) +
      ' и ' +
      fmt(kb) +
      ' &lt; <i>b</i> &lt; ' +
      fmt(kb + 1) +
      '. Тогда</p>' +
      '<ul>' +
      '<li>' +
      fmt(ka + kb) +
      ' &lt; <i>a</i> + <i>b</i> &lt; ' +
      fmt(ka + kb + 2) +
      ';</li>' +
      '<li>' +
      fmt(ka - kb - 1) +
      ' &lt; <i>a</i> ' +
      MINUS +
      ' <i>b</i> &lt; ' +
      fmt(ka - kb + 1) +
      ';</li>' +
      '<li>числа <i>a</i> и <i>b</i> ' +
      (ka >= 0 === kb >= 0 ? 'одного знака, поэтому <i>ab</i> &gt; 0' : 'разных знаков, поэтому <i>ab</i> &lt; 0') +
      '.</li>' +
      '</ul>';
    const lines = list.map((s, i) => '<li>' + (i + 1) + ') ' + h.m(fmtVar(AB_TEMPLATES[s.i].html)) + ' — ' + (s.truth ? '<b>верно</b>' : 'неверно') + '</li>');
    return {
      subtype: 'statements-ab',
      html,
      answer: { type: 'number', value: idx + 1 },
      steps: [facts, '<ul>' + lines.join('') + '</ul>', OGE.answerLine(idx + 1)],
      data: { a, b, intervals: { a: [ka, ka + 1], b: [kb, kb + 1] }, options: list.map((s) => AB_TEMPLATES[s.i].js) },
    };
  }

  const builders = {
    'which-point': whichPoint,
    'which-number': whichNumber,
    'statements-a': statementsA,
    'statements-ab': statementsAB,
  };

  OGE.registerTask(
    7,
    function (rng, opts) {
      const names = Object.keys(builders);
      const subtype = opts.subtype || rng.pick(names);
      return builders[subtype](rng);
    },
    Object.keys(builders),
  );
})(globalThis);
