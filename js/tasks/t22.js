/*
 * Задание 22 (вторая часть). Построение графика функции и исследование
 * количества общих точек с прямой y = m или y = kx.
 * В ответ вводятся все значения параметра через «;». Разбор показывает
 * упрощение формулы, построенный график и отбор значений параметра.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, MINUS } = OGE;
  const { lin } = OGE.part2;
  const x = '<i>x</i>';
  const P = (t) => OGE.expr.html(OGE.poly(t));
  const F = (n, d) => new Frac(n, d === undefined ? 1 : d);

  // Рамка графика, захватывающая важные точки с запасом.
  function frame(pts, minX, minY) {
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    const xmin = Math.floor(Math.min(-minX, ...xs) - 1.5);
    const xmax = Math.ceil(Math.max(minX, ...xs) + 1.5);
    const span = Math.max(...ys) - Math.min(...ys);
    const pad = Math.max(1.5, span * 0.15);
    const ymin = Math.floor(Math.min(-minY, ...ys) - pad);
    const ymax = Math.ceil(Math.max(minY, ...ys) + pad);
    return { xmin, xmax, ymin, ymax };
  }
  function drawGraph(f, box, extra) {
    const step = (box.xmax - box.xmin) / 400;
    const curves = OGE.draw.sampleCurve(f, box, step);
    return '<figure class="graph graph-22">' + OGE.draw.graph(Object.assign({ curves }, box, extra)) + '</figure>';
  }
  const pt = (q) => '(' + fmt(q[0]) + '; ' + fmt(q[1]) + ')';

  const builders = {
    // y = (x² − a²)(x² − b²)/((x − a)(x + b)) = (x + a)(x − b), выколоты x = a, x = −b; y = m — ровно одна точка
    holes(rng) {
      return OGE.retry(rng, () => {
        const a = rng.intNZ(-4, 4);
        const b = rng.intNZ(-4, 4);
        if (Math.abs(a) === Math.abs(b)) return null;
        // y = x² + (a − b)x − ab
        const B = a - b;
        const C = -a * b;
        const f = (t) => t * t + B * t + C;
        const xv = F(-B, 2);
        const yv = F(C).sub(F(B * B, 4));
        if (xv.eq(a) || xv.eq(-b)) return null; // выколотая точка в вершине — другая картинка
        const ya = f(a);
        const yb = f(-b);
        const vals = [yv, F(ya), F(yb)];
        const sumSq = a * a + b * b;
        const num = P([
          [1, 4],
          [-sumSq, 2],
          [a * a * b * b, 0],
        ]);
        const den = '(' + lin(-a) + ')(' + lin(b) + ')';
        const html =
          '<p>Постройте график функции</p>' +
          h.block('<i>y</i> = ' + h.frac(num, den)) +
          '<p>и определите, при каких значениях <i>m</i> прямая <i>y</i> = <i>m</i> имеет с графиком ровно одну общую точку.</p>';
        const box = frame(
          [
            [xv.toNumber(), yv.toNumber()],
            [a, ya],
            [-b, yb],
          ],
          3,
          2,
        );
        const fx = (t) => (Math.abs(t - a) < 1e-9 || Math.abs(t + b) < 1e-9 ? NaN : f(t));
        const lines = vals.map((m) => [
          [box.xmin, m.toNumber()],
          [box.xmax, m.toNumber()],
        ]);
        const steps = [
          '<p><b>Область определения:</b> знаменатель не равен нулю, значит, ' + x + ' ≠ ' + fmt(a) + ' и ' + x + ' ≠ ' + fmt(-b) + '.</p>',
          '<p>Разложим числитель на множители (это биквадратный трёхчлен, ' + x + '<sup>2</sup> = ' + Math.min(a * a, b * b) + ' и ' + x + '<sup>2</sup> = ' + Math.max(a * a, b * b) + ' — его корни):</p>',
          h.block(
            num +
              ' = (' +
              x +
              '<sup>2</sup> ' +
              MINUS +
              ' ' +
              a * a +
              ')(' +
              x +
              '<sup>2</sup> ' +
              MINUS +
              ' ' +
              b * b +
              ') = (' +
              lin(-a) +
              ')(' +
              lin(a) +
              ')(' +
              lin(-b) +
              ')(' +
              lin(b) +
              ')',
          ),
          '<p>Сократим дробь на (' + lin(-a) + ')(' + lin(b) + '):</p>',
          h.block('<i>y</i> = (' + lin(a) + ')(' + lin(-b) + ') = ' + P([[1, 2], [B, 1], [C, 0]]) + ', &nbsp; ' + x + ' ≠ ' + fmt(a) + ', ' + x + ' ≠ ' + fmt(-b)),
          '<p>График — парабола, ветви вверх, с двумя <b>выколотыми точками</b>. Вершина: ' +
            x +
            '<sub>0</sub> = ' +
            h.frac(fmt(-B), 2) +
            ' = ' +
            fmt(xv) +
            ', <i>y</i><sub>0</sub> = ' +
            fmt(yv) +
            '. Выколотые точки: <i>y</i>(' +
            fmt(a) +
            ') = ' +
            fmt(ya) +
            ' и <i>y</i>(' +
            fmt(-b) +
            ') = ' +
            fmt(yb) +
            ', то есть ' +
            pt([a, ya]) +
            ' и ' +
            pt([-b, yb]) +
            '.</p>',
          drawGraph(fx, box, {
            holes: [
              [a, ya],
              [-b, yb],
            ],
            dots: [[xv.toNumber(), yv.toNumber()]],
            lines,
          }),
          '<p>Горизонтальная прямая <i>y</i> = <i>m</i> пересекает целую параболу в двух точках при <i>m</i> &gt; ' +
            fmt(yv) +
            ' и касается её в вершине при <i>m</i> = ' +
            fmt(yv) +
            '. Ровно одна общая точка получается:</p>',
          '<ul><li>в вершине: <i>m</i> = ' +
            fmt(yv) +
            ';</li><li>когда одна из двух точек пересечения выколота: <i>m</i> = ' +
            fmt(ya) +
            ' и <i>m</i> = ' +
            fmt(yb) +
            ' (пунктир на рисунке).</li></ul>',
        ];
        return { html, values: vals, steps, data: { fjs: '((x**2 - ' + a * a + ')*(x**2 - ' + b * b + '))/((x - (' + a + '))*(x + (' + b + ')))', line: 'h', count: 1 } };
      });
    },

    // y = ±x|x| + A|x| + βx: ровно две общие точки с y = m — в вершинах
    abs(rng) {
      return OGE.retry(rng, () => {
        const A = rng.int(-6, 6);
        const beta = rng.intNZ(-9, 9);
        const s = rng.pick([1, -1]);
        // x ≥ 0: s·x² + (A + β)x;  x < 0: −s·x² + (β − A)x
        const rB = A + beta;
        const lB = beta - A;
        const fR = (t) => s * t * t + rB * t;
        const fL = (t) => -s * t * t + lB * t;
        const f = (t) => (t >= 0 ? fR(t) : fL(t));
        const xr = F(-rB, 2 * s); // вершина правой ветви
        const xl = F(lB, 2 * s); // вершина левой ветви: −lB/(2·(−s))
        if (xr.sign() <= 0 || xl.sign() >= 0) return null;
        const yr = F(s).mul(xr).mul(xr).add(xr.mul(rB));
        const yl = F(-s).mul(xl).mul(xl).add(xl.mul(lB));
        const lead = (s < 0 ? MINUS : '') + x + '|' + x + '|';
        const absPart = A ? (A > 0 ? ' + ' : ' ' + MINUS + ' ') + (Math.abs(A) === 1 ? '' : Math.abs(A)) + '|' + x + '|' : '';
        const formula = lead + absPart + (beta > 0 ? ' + ' : ' ' + MINUS + ' ') + (Math.abs(beta) === 1 ? '' : Math.abs(beta)) + x;
        const html =
          '<p>Постройте график функции</p>' +
          h.block('<i>y</i> = ' + formula) +
          '<p>и определите, при каких значениях <i>m</i> прямая <i>y</i> = <i>m</i> имеет с графиком ровно две общие точки.</p>';
        const box = frame(
          [
            [xr.toNumber(), yr.toNumber()],
            [xl.toNumber(), yl.toNumber()],
            [0, 0],
          ],
          3,
          2,
        );
        const vals = [yr, yl];
        const steps = [
          '<p>Раскроем модуль. При ' + x + ' ≥ 0 имеем |' + x + '| = ' + x + ':</p>',
          h.block('<i>y</i> = ' + P([[s, 2], [A, 1], [beta, 1]]) + ' = ' + P([[s, 2], [rB, 1]])),
          '<p>При ' + x + ' &lt; 0 имеем |' + x + '| = ' + MINUS + x + ':</p>',
          h.block('<i>y</i> = ' + P([[-s, 2], [lB, 1]])),
          '<p>Обе части — куски парабол. Вершина правой параболы: ' +
            x +
            ' = ' +
            fmt(xr) +
            ' &gt; 0 (лежит в своей области), <i>y</i> = ' +
            fmt(yr) +
            '. Вершина левой: ' +
            x +
            ' = ' +
            fmt(xl) +
            ' &lt; 0, <i>y</i> = ' +
            fmt(yl) +
            '. Обе ветви проходят через начало координат.</p>',
          drawGraph(f, box, {
            dots: [
              [xr.toNumber(), yr.toNumber()],
              [xl.toNumber(), yl.toNumber()],
            ],
            lines: vals.map((m) => [
              [box.xmin, m.toNumber()],
              [box.xmax, m.toNumber()],
            ]),
          }),
          '<p>По графику: прямая <i>y</i> = <i>m</i> между значениями ' +
            fmt(OGE.Frac.of(yr).cmp(yl) < 0 ? yr : yl) +
            ' и ' +
            fmt(OGE.Frac.of(yr).cmp(yl) < 0 ? yl : yr) +
            ' пересекает график в трёх точках, выше и ниже — в одной. Ровно две общие точки — когда прямая проходит через вершину: <i>m</i> = ' +
            fmt(yr) +
            ' или <i>m</i> = ' +
            fmt(yl) +
            '.</p>',
        ];
        const js = (s < 0 ? '-' : '') + 'x*Math.abs(x) + (' + A + ')*Math.abs(x) + (' + beta + ')*x';
        return { html, values: vals, steps, data: { fjs: js, line: 'h', count: 2 } };
      });
    },

    // y = (x² + n²)(x − r)/(±(x − r)): прямая y = kx — ровно одна общая точка
    tangent(rng) {
      return OGE.retry(rng, () => {
        const n = rng.int(1, 4);
        const r = rng.pick([-5, -4, -2, -1, 1, 2, 4, 5]);
        if (Math.abs(r) === n) return null;
        const s = rng.pick([1, -1]);
        const kHole = F(s * (r * r + n * n), r);
        if (!kHole.isFiniteDecimal() || kHole.abs().cmp(F(2 * n)) === 0) return null;
        const c = n * n;
        const fx = (t) => (Math.abs(t - r) < 1e-9 ? NaN : s * (t * t + c));
        const num = '(' + x + '<sup>2</sup> + ' + c + ')(' + lin(-r) + ')';
        const den = s > 0 ? lin(-r) : fmt(r) + ' ' + MINUS + ' ' + x;
        const other = F(c, r); // второй корень при k = kHole
        const html =
          '<p>Постройте график функции</p>' +
          h.block('<i>y</i> = ' + h.frac(num, den)) +
          '<p>и определите, при каких значениях <i>k</i> прямая <i>y</i> = <i>kx</i> имеет с графиком ровно одну общую точку.</p>';
        const yr = s * (r * r + c);
        const box = frame(
          [
            [r, yr],
            [n, s * 2 * c],
            [-n, s * 2 * c],
          ],
          3,
          2,
        );
        const lineFor = (k) => {
          const kv = k.toNumber();
          // отрезок прямой y = kx внутри рамки
          const xs = [box.xmin, box.xmax];
          const ys = xs.map((t) => kv * t);
          const clip = (t) => Math.max(box.ymin, Math.min(box.ymax, t));
          const p1 = [Math.abs(kv) > 1e-9 ? clip(ys[0]) / kv : xs[0], clip(ys[0])];
          const p2 = [Math.abs(kv) > 1e-9 ? clip(ys[1]) / kv : xs[1], clip(ys[1])];
          return [p1, p2];
        };
        const vals = [F(-2 * n), F(2 * n), kHole];
        const steps = [
          '<p><b>Область определения:</b> ' + x + ' ≠ ' + fmt(r) + '. Сократим дробь на ' + (s > 0 ? '(' + lin(-r) + ')' : '(' + lin(-r) + '), учитывая, что ' + fmt(r) + ' ' + MINUS + ' ' + x + ' = ' + MINUS + '(' + lin(-r) + ')') + ':</p>',
          h.block('<i>y</i> = ' + (s < 0 ? MINUS + '(' + x + '<sup>2</sup> + ' + c + ') = ' + P([[-1, 2], [-c, 0]]) : x + '<sup>2</sup> + ' + c) + ', &nbsp; ' + x + ' ≠ ' + fmt(r)),
          '<p>Это парабола с вершиной (0; ' + fmt(s * c) + '), ветви ' + (s > 0 ? 'вверх' : 'вниз') + ', и выколотой точкой ' + pt([r, yr]) + '.</p>',
          '<p>Общие точки с прямой <i>y</i> = <i>kx</i> — решения уравнения ' + (s > 0 ? x + '<sup>2</sup> + ' + c : MINUS + x + '<sup>2</sup> ' + MINUS + ' ' + c) + ' = <i>kx</i>, то есть</p>',
          h.block(x + '<sup>2</sup> ' + (s > 0 ? MINUS : '+') + ' <i>kx</i> + ' + c + ' = 0, &nbsp; ' + x + ' ≠ ' + fmt(r)),
          '<p><b>1) Касание.</b> Одна общая точка, если дискриминант равен нулю: <i>D</i> = <i>k</i><sup>2</sup> ' + MINUS + ' ' + 4 * c + ' = 0, <i>k</i> = ±' + 2 * n + '. Точки касания ' + x + ' = ±' + n + ' не совпадают с выколотой ' + x + ' = ' + fmt(r) + '.</p>',
          '<p><b>2) Прямая проходит через выколотую точку</b> ' +
            pt([r, yr]) +
            ': ' +
            fmt(yr) +
            ' = <i>k</i> · ' +
            (r < 0 ? '(' + fmt(r) + ')' : fmt(r)) +
            ', <i>k</i> = ' +
            fmt(kHole) +
            '. Тогда у уравнения два корня: ' +
            x +
            ' = ' +
            fmt(r) +
            ' (не подходит) и, по теореме Виета, ' +
            x +
            ' = ' +
            h.frac(c, fmt(r)) +
            ' = ' +
            fmt(other) +
            ', — остаётся ровно одна общая точка.</p>',
          drawGraph(fx, box, { holes: [[r, yr]], lines: vals.map(lineFor) }),
          '<p>При остальных <i>k</i> прямая либо не имеет общих точек с графиком, либо имеет две.</p>',
        ];
        return { html, values: vals, steps, data: { fjs: '((x*x + ' + c + ')*(x - (' + r + ')))/(' + (s > 0 ? 'x - (' + r + ')' : '(' + r + ') - x') + ')', line: 'k', count: 1 } };
      });
    },
  };

  const WEIGHTS = { holes: 2, abs: 2, tangent: 2 };

  OGE.registerTask(
    22,
    function (rng, opts) {
      const names = Object.keys(WEIGHTS);
      const subtype =
        opts.subtype ||
        rng.weighted(
          names,
          names.map((n) => WEIGHTS[n]),
        );
      const b = builders[subtype](rng);
      const answer = { type: 'list', value: b.values };
      return {
        subtype,
        html: b.html + '<p class="muted small hint-format">Постройте график на черновике. В ответ запишите все подходящие значения через точку с запятой, например: −1; 2,25.</p>',
        answer,
        steps: b.steps.concat([OGE.answerLine(OGE.answer.display(OGE.answer.normalize(answer)))]),
        data: b.data,
      };
    },
    Object.keys(WEIGHTS),
  );
})(globalThis);
