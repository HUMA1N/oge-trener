/*
 * Задание 20 (вторая часть). Уравнения, неравенства, системы.
 * На экзамене решение записывается полностью; в тренажёре вводится итоговый
 * ответ (корни через «;», пары чисел или номер промежутка), а разбор
 * показывает решение так, как его оформляют в бланке.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, MINUS, expr } = OGE;
  const poly = (t) => OGE.poly(t);
  const P = (t) => expr.html(poly(t));
  const PJ = (t) => expr.js(poly(t));
  const x = '<i>x</i>';
  const y = '<i>y</i>';
  const INF = Infinity;

  // «x − 3», «x + 5», «x»
  function lin(v, name) {
    const n = name || x;
    if (!v) return n;
    return n + (v > 0 ? ' + ' : ' ' + MINUS + ' ') + Math.abs(v);
  }
  // «+ 5» / «− 5» для записи после другого слагаемого
  function tail(v) {
    return (v >= 0 ? ' + ' : ' ' + MINUS + ' ') + fmt(Math.abs(v));
  }
  // число в скобках, если отрицательное
  function p(v) {
    return v < 0 ? '(' + fmt(v) + ')' : fmt(v);
  }
  function sub(name, i) {
    return '<i>' + name + '</i><sub>' + i + '</sub>';
  }
  function list(vals) {
    return vals
      .slice()
      .sort((a, b) => a - b)
      .map((v) => fmt(v))
      .join('; ');
  }

  // Решение приведённого квадратного уравнения t² + B·t + C = 0 с целыми корнями r1 < r2
  // через дискриминант — строки разбора.
  function quadSteps(name, B, C, r1, r2) {
    const D = B * B - 4 * C;
    const d = Math.round(Math.sqrt(D));
    const v = '<i>' + name + '</i>';
    return [
      h.block('<i>D</i> = ' + p(B) + '<sup>2</sup> ' + MINUS + ' 4 · 1 · ' + p(C) + ' = ' + fmt(B * B) + tail(-4 * C) + ' = ' + fmt(D) + ' = ' + d + '<sup>2</sup>'),
      h.block(
        sub(name, 1) +
          ' = ' +
          h.frac(fmt(-B) + ' ' + MINUS + ' ' + d, '2') +
          ' = ' +
          fmt(r1) +
          ', &nbsp; ' +
          sub(name, 2) +
          ' = ' +
          h.frac(fmt(-B) + ' + ' + d, '2') +
          ' = ' +
          fmt(r2),
      ),
      '<p class="muted small">Проверка по теореме Виета: ' +
        sub(name, 1) +
        ' + ' +
        sub(name, 2) +
        ' = ' +
        fmt(r1 + r2) +
        ' = ' +
        fmt(-B) +
        ', &nbsp;' +
        sub(name, 1) +
        ' · ' +
        sub(name, 2) +
        ' = ' +
        fmt(r1 * r2) +
        ' = ' +
        fmt(C) +
        '. Переменная ' +
        v +
        ' найдена верно.</p>',
    ];
  }
  // Два различных целых корня r1 < r2 из [lo; hi]
  function twoRoots(rng, lo, hi) {
    const a = rng.int(lo, hi);
    let b;
    do b = rng.int(lo, hi);
    while (b === a);
    return [Math.min(a, b), Math.max(a, b)];
  }

  // ---------------- уравнения ----------------
  const builders = {
    // x⁴ + B x² + C = 0
    biquad(rng) {
      return OGE.retry(rng, () => {
        const a = rng.int(1, 6);
        let t1;
        let t2;
        if (rng.chance(0.6)) {
          const b = rng.int(1, 6);
          if (b === a) return null;
          t1 = Math.min(a * a, b * b);
          t2 = Math.max(a * a, b * b);
        } else {
          t1 = -rng.int(1, 9);
          t2 = a * a;
        }
        const B = -(t1 + t2);
        const C = t1 * t2;
        if (!B) return null;
        const roots = [];
        const back = [];
        [t1, t2].forEach((t, i) => {
          if (t < 0) {
            back.push('<p>' + x + '<sup>2</sup> = ' + fmt(t) + ' — корней нет: квадрат числа не может быть отрицательным (и вообще ' + sub('t', i + 1) + ' &lt; 0 не подходит под условие <i>t</i> ≥ 0).</p>');
          } else {
            const r = Math.round(Math.sqrt(t));
            roots.push(-r, r);
            back.push('<p>' + x + '<sup>2</sup> = ' + fmt(t) + ', откуда ' + x + ' = ' + MINUS + r + ' или ' + x + ' = ' + r + '.</p>');
          }
        });
        const lhs = [
          [1, 4],
          [B, 2],
          [C, 0],
        ];
        return {
          html: '<p>Решите уравнение</p>' + h.block(P(lhs) + ' = 0'),
          roots,
          steps: [
            '<p>Это <b>биквадратное</b> уравнение. Сделаем замену <i>t</i> = ' + x + '<sup>2</sup>, где <i>t</i> ≥ 0:</p>',
            h.block('<i>t</i><sup>2</sup>' + (B ? tail(B) + '<i>t</i>' : '') + tail(C) + ' = 0'),
          ]
            .concat(quadSteps('t', B, C, t1, t2))
            .concat(['<p>Вернёмся к переменной ' + x + ':</p>'])
            .concat(back),
          data: { kind: 'roots', f: PJ(lhs) },
        };
      });
    },

    // x³ + a x² − b² x − a b² = 0 (разложение группировкой)
    group(rng) {
      return OGE.retry(rng, () => {
        const a = rng.intNZ(-9, 9);
        const b = rng.int(1, 7);
        if (Math.abs(a) === b) return null;
        const terms = [
          [1, 3],
          [a, 2],
          [-b * b, 1],
          [-a * b * b, 0],
        ];
        const moved = rng.chance(0.4);
        const eqHtml = moved
          ? P([
              [1, 3],
              [a, 2],
            ]) +
            ' = ' +
            P([
              [b * b, 1],
              [a * b * b, 0],
            ])
          : P(terms) + ' = 0';
        const steps = [];
        if (moved) {
          steps.push('<p>Перенесём все слагаемые в левую часть:</p>', h.block(P(terms) + ' = 0'));
        }
        steps.push(
          '<p>Сгруппируем первые два и последние два слагаемых и вынесем общие множители:</p>',
          h.block(x + '<sup>2</sup>(' + lin(a) + ') ' + MINUS + ' ' + b * b + '(' + lin(a) + ') = 0'),
          h.block('(' + lin(a) + ')(' + x + '<sup>2</sup> ' + MINUS + ' ' + b * b + ') = 0'),
          '<p>По формуле разности квадратов ' + x + '<sup>2</sup> ' + MINUS + ' ' + b * b + ' = (' + lin(-b) + ')(' + lin(b) + '):</p>',
          h.block('(' + lin(a) + ')(' + lin(-b) + ')(' + lin(b) + ') = 0'),
          '<p>Произведение равно нулю, когда хотя бы один из множителей равен нулю:</p>',
          h.block(x + ' = ' + fmt(-a) + ', &nbsp; ' + x + ' = ' + b + ', &nbsp; ' + x + ' = ' + MINUS + b + '.'),
        );
        return {
          html: '<p>Решите уравнение</p>' + h.block(eqHtml),
          roots: [-a, b, -b],
          steps,
          data: { kind: 'roots', f: PJ(terms) },
        };
      });
    },

    // x² + Bx + √(c − x) = √(c − x) + Q — посторонний корень отсекается ОДЗ
    sqrt(rng) {
      return OGE.retry(rng, () => {
        const [r1, r2] = twoRoots(rng, -9, 9);
        const B = -(r1 + r2);
        const Q = -r1 * r2;
        if (!Q) return null;
        const left = rng.chance(0.5); // √(c − x): x ≤ c, иначе √(x − c): x ≥ c
        const both = rng.chance(0.2);
        let c;
        if (left) c = both ? rng.int(r2, r2 + 4) : rng.int(r1, r2 - 1);
        else c = both ? rng.int(r1 - 4, r1) : rng.int(r1 + 1, r2);
        const rad = left ? (c ? fmt(c) + ' ' + MINUS + ' ' + x : MINUS + x) : lin(-c);
        const radJs = left ? '(' + c + ' - x)' : '(x - ' + p(c).replace(MINUS, '-') + ')';
        const S = h.sqrt(rad);
        const quad = [
          [1, 2],
          [B, 1],
        ];
        const ok = (r) => (left ? r <= c : r >= c);
        const roots = [r1, r2].filter(ok);
        const odz = left ? x + ' ≤ ' + fmt(c) : x + ' ≥ ' + fmt(c);
        const steps = [
          '<p><b>Область допустимых значений.</b> Выражение под корнем должно быть неотрицательным:</p>',
          h.block(rad + ' ≥ 0, &nbsp; откуда &nbsp; ' + odz + '.'),
          '<p>Вычтем ' + S + ' из обеих частей уравнения (при ' + odz + ' это равносильное преобразование) и перенесём ' + fmt(Q) + ' влево:</p>',
          h.block(P(quad.concat([[-Q, 0]])) + ' = 0'),
        ]
          .concat(quadSteps('x', B, -Q, r1, r2))
          .concat([
            '<p><b>Проверим условие ' + odz + ':</b></p>',
            '<ul>' +
              [r1, r2]
                .map((r) => '<li>' + x + ' = ' + fmt(r) + (ok(r) ? ' — подходит;' : ' — <b>не подходит</b>: ' + (left ? fmt(r) + ' &gt; ' + fmt(c) : fmt(r) + ' &lt; ' + fmt(c)) + ', корень под знаком корня отрицателен;') + '</li>')
                .join('') +
              '</ul>',
          ]);
        return {
          html: '<p>Решите уравнение</p>' + h.block(P(quad) + ' + ' + S + ' = ' + S + tail(Q)),
          roots,
          steps,
          data: { kind: 'roots', f: '(' + PJ(quad) + ') + Math.sqrt' + radJs + ' - Math.sqrt' + radJs + ' - (' + Q + ')' },
        };
      });
    },

    // 1/x² + B/x + C = 0 — замена t = 1/x
    recip(rng) {
      return OGE.retry(rng, () => {
        const pool = [-10, -5, -4, -2, -1, 1, 2, 4, 5, 10];
        const [t1, t2] = rng.sample(pool, 2).sort((a, b) => a - b);
        const B = -(t1 + t2);
        const C = t1 * t2;
        if (!B || Math.abs(C) > 50) return null;
        const roots = [Frac.of(1).div(t1), Frac.of(1).div(t2)];
        const eq = h.frac('1', x + '<sup>2</sup>') + (B > 0 ? ' + ' : ' ' + MINUS + ' ') + h.frac(String(Math.abs(B)), x) + tail(C) + ' = 0';
        return {
          html: '<p>Решите уравнение</p>' + h.block(eq),
          roots,
          steps: [
            '<p>Область допустимых значений: ' + x + ' ≠ 0. Заметим, что ' + h.frac('1', x + '<sup>2</sup>') + ' = ' + '(' + h.frac('1', x) + ')<sup>2</sup>. Сделаем замену <i>t</i> = ' + h.frac('1', x) + ':</p>',
            h.block('<i>t</i><sup>2</sup>' + tail(B) + '<i>t</i>' + tail(C) + ' = 0'),
          ]
            .concat(quadSteps('t', B, C, t1, t2))
            .concat([
              '<p>Вернёмся к ' + x + ' = ' + h.frac('1', '<i>t</i>') + ':</p>',
              h.block(sub('x', 1) + ' = ' + h.frac('1', fmt(t1)) + ' = ' + fmt(roots[0]) + ', &nbsp; ' + sub('x', 2) + ' = ' + h.frac('1', fmt(t2)) + ' = ' + fmt(roots[1])),
              '<p>Оба значения не равны нулю, то есть входят в область допустимых значений.</p>',
            ]),
          data: { kind: 'roots', f: '1/(x*x) + (' + B + ')/x + (' + C + ')' },
        };
      });
    },

    // x²/(x − d) = (Sx − P)/(x − d)
    frac(rng) {
      return OGE.retry(rng, () => {
        const [r1, r2] = twoRoots(rng, -9, 9);
        const S = r1 + r2;
        const Pr = r1 * r2;
        const d = rng.chance(0.8) ? rng.pick([r1, r2]) : rng.int(-9, 9);
        if (!d) return null;
        const num = [
          [S, 1],
          [-Pr, 0],
        ];
        if (!S && !Pr) return null;
        const den = lin(-d);
        const roots = [r1, r2].filter((r) => r !== d);
        const steps = [
          '<p><b>Область допустимых значений:</b> знаменатель не равен нулю, ' + den + ' ≠ 0, то есть ' + x + ' ≠ ' + fmt(d) + '.</p>',
          '<p>Знаменатели дробей одинаковы, значит, при ' + x + ' ≠ ' + fmt(d) + ' равны и числители:</p>',
          h.block(x + '<sup>2</sup> = ' + P(num)),
          h.block(
            P([
              [1, 2],
              [-S, 1],
              [Pr, 0],
            ]) + ' = 0',
          ),
        ]
          .concat(quadSteps('x', -S, Pr, r1, r2))
          .concat([
            roots.length === 2
              ? '<p>Оба корня отличны от ' + fmt(d) + ', оба подходят.</p>'
              : '<p>Корень ' + x + ' = ' + fmt(d) + ' <b>не входит</b> в область допустимых значений (знаменатель обращается в ноль), поэтому это посторонний корень.</p>',
          ]);
        return {
          html: '<p>Решите уравнение</p>' + h.block(h.frac(x + '<sup>2</sup>', den) + ' = ' + h.frac(P(num), den)),
          roots,
          steps,
          data: { kind: 'roots', f: '(x*x)/(x - (' + d + ')) - (' + PJ(num) + ')/(x - (' + d + '))' },
        };
      });
    },

    // { y = a x² + b x + c;  y = k x + m }
    system(rng) {
      return OGE.retry(rng, () => {
        const [x1, x2] = twoRoots(rng, -5, 5);
        const a = rng.pick([1, 1, 2, 3, -1, -2]);
        const k = rng.int(-6, 6);
        const m = rng.int(-9, 9);
        const b = k - a * (x1 + x2);
        const c = m + a * x1 * x2;
        if (Math.abs(b) > 25 || Math.abs(c) > 40) return null;
        const par = [
          [a, 2],
          [b, 1],
          [c, 0],
        ];
        const line = [
          [k, 1],
          [m, 0],
        ];
        if (!k && !m) return null;
        const diff = [
          [a, 2],
          [b - k, 1],
          [c - m, 0],
        ];
        const pairs = [x1, x2].map((v) => [v, k * v + m]);
        const B = (b - k) / a;
        const C = (c - m) / a;
        const lineHtml = rng.chance(0.5) ? y + ' = ' + P(line) : y + (k ? (k > 0 ? ' ' + MINUS + ' ' : ' + ') + (Math.abs(k) === 1 ? '' : Math.abs(k)) + x : '') + ' = ' + fmt(m);
        const steps = [
          '<p>Выразим ' + y + ' из второго уравнения: ' + y + ' = ' + P(line) + ' — и подставим в первое (способ подстановки):</p>',
          h.block(P(line) + ' = ' + P(par)),
          '<p>Перенесём всё в одну часть:</p>',
          h.block(P(diff) + ' = 0'),
        ];
        if (a !== 1) {
          steps.push(
            '<p>Разделим обе части на ' + fmt(a) + ':</p>',
            h.block(
              P([
                [1, 2],
                [B, 1],
                [C, 0],
              ]) + ' = 0',
            ),
          );
        }
        steps.push.apply(steps, quadSteps('x', B, C, x1, x2));
        steps.push(
          '<p>Найдём ' + y + ' = ' + P(line) + ' для каждого ' + x + ':</p>',
          '<ul>' + pairs.map(([u, v]) => '<li>' + x + ' = ' + fmt(u) + ': &nbsp;' + y + ' = ' + (k ? fmt(k) + ' · ' + p(u) + tail(m) : fmt(m)) + ' = ' + fmt(v) + ';</li>').join('') + '</ul>',
        );
        return {
          html:
            '<p>Решите систему уравнений</p>' +
            h.block('<span class="system"><span>' + y + ' = ' + P(par) + ',</span><span>' + lineHtml + '.</span></span>'),
          pairs,
          steps,
          data: { kind: 'system', curve: PJ(par), line: PJ(line), lineEq: lineHtml },
        };
      });
    },

    // (x − a)² < k(x − a) и подобные — выбор промежутка
    'ineq-square'(rng) {
      return OGE.retry(rng, () => {
        const a = rng.intNZ(-9, 9);
        const k = rng.intNZ(-8, 8);
        const sign = rng.pick(['<', '>', '<=', '>=']);
        const L = Math.min(a, a + k);
        const R = Math.max(a, a + k);
        const lhs = '(' + lin(-a) + ')<sup>2</sup>';
        const rhs = (k === 1 ? '' : k === -1 ? MINUS : fmt(k)) + '(' + lin(-a) + ')';
        const S = SIGNS[sign];
        const inside = sign === '<' || sign === '<=';
        const steps = [
          '<p>Перенесём всё в левую часть и вынесем общий множитель (' + lin(-a) + ') за скобки — <b>не делим</b> на него, ведь он может быть равен нулю или отрицателен:</p>',
          h.block(lhs + ' ' + MINUS + ' ' + (k < 0 ? '(' + rhs + ')' : rhs) + ' ' + S.html + ' 0'),
          h.block('(' + lin(-a) + ')(' + lin(-a) + tail(-k) + ') ' + S.html + ' 0'),
          h.block('(' + lin(-a) + ')(' + lin(-(a + k)) + ') ' + S.html + ' 0'),
          '<p>Это квадратное неравенство. Нули левой части: ' + x + ' = ' + fmt(a) + ' и ' + x + ' = ' + fmt(a + k) + '. Ветви параболы направлены вверх: между нулями выражение отрицательно, вне их — положительно. Нам нужны значения ' + (inside ? '<b>между</b> нулями' : '<b>вне</b> промежутка между нулями') + '.</p>',
          S.strict ? '<p>Неравенство строгое — концы ' + fmt(L) + ' и ' + fmt(R) + ' не входят в ответ.</p>' : '<p>Неравенство нестрогое — концы ' + fmt(L) + ' и ' + fmt(R) + ' входят в ответ.</p>',
        ];
        return finishIneq(rng, {
          html: h.block(lhs + ' ' + S.html + ' ' + rhs),
          js: '(x - (' + a + '))**2 ' + S.js + ' (' + k + ')*(x - (' + a + '))',
          L,
          R,
          inside,
          strict: S.strict,
          steps,
        });
      });
    },

    // x²(−x² − n) ≤ n(−x² − n)
    'ineq-fourth'(rng) {
      return OGE.retry(rng, () => {
        const c = rng.int(2, 12);
        const n = c * c;
        const sign = rng.pick(['<', '>', '<=', '>=']);
        const S = SIGNS[sign];
        const flip = SIGNS[S.flip];
        const inside = sign === '>' || sign === '>='; // после деления на отрицательное: x² − n ≤ 0
        const neg = '(' + MINUS + x + '<sup>2</sup> ' + MINUS + ' ' + n + ')';
        const steps = [
          '<p>Перенесём всё в левую часть и вынесем общий множитель ' + neg + ':</p>',
          h.block(x + '<sup>2</sup>' + neg + ' ' + MINUS + ' ' + n + neg + ' ' + S.html + ' 0'),
          h.block('(' + x + '<sup>2</sup> ' + MINUS + ' ' + n + ')' + neg + ' ' + S.html + ' 0'),
          '<p>Множитель ' + neg + ' отрицателен при любом ' + x + ' (это минус сумма квадрата и положительного числа). Разделим на него обе части — <b>знак неравенства меняется</b>:</p>',
          h.block(x + '<sup>2</sup> ' + MINUS + ' ' + n + ' ' + flip.html + ' 0'),
          h.block('(' + lin(-c) + ')(' + lin(c) + ') ' + flip.html + ' 0'),
          '<p>Нули: ' + x + ' = ' + MINUS + c + ' и ' + x + ' = ' + c + '. ' + (inside ? 'Неравенство выполняется между нулями' : 'Неравенство выполняется левее меньшего и правее большего нуля') + '; ' + (S.strict ? 'неравенство строгое — концы не входят.' : 'неравенство нестрогое — концы входят.') + '</p>',
        ];
        return finishIneq(rng, {
          html: h.block(x + '<sup>2</sup>' + neg + ' ' + S.html + ' ' + n + neg),
          js: 'x*x*(-x*x - ' + n + ') ' + S.js + ' ' + n + '*(-x*x - ' + n + ')',
          L: -c,
          R: c,
          inside,
          strict: S.strict,
          steps,
        });
      });
    },
  };

  const SIGNS = {
    '<': { html: '&lt;', js: '<', strict: true, flip: '>' },
    '>': { html: '&gt;', js: '>', strict: true, flip: '<' },
    '<=': { html: '≤', js: '<=', strict: false, flip: '>=' },
    '>=': { html: '≥', js: '>=', strict: false, flip: '<=' },
  };

  function setText(set) {
    return set
      .map((s) => {
        const lo = s.lo === -INF ? '(' + MINUS + '∞' : (s.loIn ? '[' : '(') + fmt(s.lo);
        const hi = s.hi === INF ? '+∞)' : fmt(s.hi) + (s.hiIn ? ']' : ')');
        return lo + '; ' + hi;
      })
      .join(' ∪ ');
  }
  function serialize(set) {
    return set.map((s) => ({ lo: s.lo === -INF ? '-inf' : s.lo, hi: s.hi === INF ? 'inf' : s.hi, loIn: s.loIn, hiIn: s.hiIn }));
  }
  // Четыре варианта ответа: внутри/снаружи × строгое/нестрогое — верный ровно один.
  function finishIneq(rng, o) {
    const make = (inside, strict) =>
      inside
        ? [{ lo: o.L, hi: o.R, loIn: !strict, hiIn: !strict }]
        : [
            { lo: -INF, hi: o.L, loIn: false, hiIn: !strict },
            { lo: o.R, hi: INF, loIn: !strict, hiIn: false },
          ];
    const correct = make(o.inside, o.strict);
    const all = rng.shuffle([correct, make(o.inside, !o.strict), make(!o.inside, o.strict), make(!o.inside, !o.strict)]);
    const idx = all.indexOf(correct) + 1;
    return {
      html: '<p>Решите неравенство</p>' + o.html + '<p class="muted small hint-format">Решите на черновике и выберите номер верного ответа.</p>' + OGE.optionsHtml(all.map((s) => '<span class="math">' + setText(s) + '</span>')),
      option: idx,
      steps: o.steps.concat(['<p>Ответ: ' + setText(correct) + ' — это вариант ' + idx + '.</p>']),
      data: { kind: 'sets', ineq: o.js, options: all.map(serialize) },
    };
  }

  const WEIGHTS = { biquad: 3, group: 2, sqrt: 2, recip: 1, frac: 2, system: 2, 'ineq-square': 2, 'ineq-fourth': 1 };

  OGE.registerTask(
    20,
    function (rng, opts) {
      const names = Object.keys(WEIGHTS);
      const subtype =
        opts.subtype ||
        rng.weighted(
          names,
          names.map((n) => WEIGHTS[n]),
        );
      const b = builders[subtype](rng);
      let answer;
      let hint;
      if (b.option) {
        answer = { type: 'number', value: b.option };
      } else if (b.pairs) {
        answer = { type: 'pairs', value: b.pairs };
        hint = 'В ответ запишите все решения парами в скобках, например: (1; 2), (−3; 4).';
      } else {
        answer = { type: 'list', value: b.roots };
        hint = 'В ответ запишите все корни через точку с запятой, например: −2; 3. Порядок не важен.';
      }
      const text = OGE.answer.display(OGE.answer.normalize(answer));
      return {
        subtype,
        html: b.html + (hint ? '<p class="muted small hint-format">' + hint + '</p>' : ''),
        answer,
        steps: b.steps.concat([b.option ? OGE.answerLine(String(b.option)) : OGE.answerLine(text)]),
        data: b.data,
      };
    },
    Object.keys(WEIGHTS),
  );

  OGE.part2 = { lin, tail, p, sub, list, quadSteps, twoRoots, SIGNS, setText };
})(globalThis);
