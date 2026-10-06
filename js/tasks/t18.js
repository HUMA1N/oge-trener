/* Задание 18. Фигуры на клетчатой бумаге (клетки 1 × 1). */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, segm } = OGE;
  const W = 10;
  const H = 8;
  const INTRO = 'На клетчатой бумаге с размером клетки 1 × 1 изображён';

  function task(o) {
    const pts = o.pts;
    const grid = OGE.draw.grid({
      w: W,
      h: H,
      polys: (o.polys || []).map((names) => ({ pts: names.map((k) => pts[k]), open: names.open })),
      segs: (o.segs || []).map((s) => [pts[s[0]], pts[s[1]], s[2]]),
      points: (o.labels || []).map((k) => ({ p: pts[k], label: k, dir: (o.dirs || {})[k] || dirFor(pts, k) })),
    });
    return {
      subtype: o.subtype,
      html: '<p>' + o.text + '</p><div class="fig-wrap">' + grid + '</div>',
      answer: { type: 'number', value: o.value },
      steps: o.steps.concat([OGE.answerLine(Frac.of(o.value))]),
      data: { pts, givens: [{ t: 'integer', p: o.nodes || Object.keys(pts) }].concat(o.givens || []), ask: o.ask },
    };
  }
  // подпись — в сторону от центра фигуры
  function dirFor(pts, k) {
    const keys = Object.keys(pts);
    const cx = keys.reduce((s, q) => s + pts[q][0], 0) / keys.length;
    const cy = keys.reduce((s, q) => s + pts[q][1], 0) / keys.length;
    const d = [pts[k][0] - cx, pts[k][1] - cy];
    return Math.hypot(d[0], d[1]) < 1e-9 ? [-1, 1] : d;
  }
  const areaText = (a) => fmt(a);

  const builders = {
    'triangle-area'(rng) {
      const b = rng.int(2, 8);
      const hh = rng.int(2, H - 2);
      const x0 = rng.int(1, W - 1 - b);
      const y0 = rng.int(1, H - 1 - hh);
      const xb = rng.int(1, W - 1);
      const up = rng.chance(0.5);
      const pts = up ? { A: [x0, y0], C: [x0 + b, y0], B: [xb, y0 + hh] } : { A: [x0, y0 + hh], C: [x0 + b, y0 + hh], B: [xb, y0] };
      const S = new Frac(b * hh, 2);
      return task({
        text: INTRO + ' треугольник. Найдите его площадь.',
        pts,
        polys: [['A', 'B', 'C']],
        ask: { t: 'area', p: ['A', 'B', 'C'] },
        value: S,
        steps: [
          '<p>Возьмём за основание горизонтальную сторону: её длина ' +
            b +
            ' (считаем клетки). Высота, проведённая к ней, — расстояние по вертикали до противоположной вершины: ' +
            hh +
            '.</p>',
          h.block('<i>S</i> = ' + h.frac(1, 2) + ' · ' + b + ' · ' + hh + ' = ' + areaText(S)),
        ],
      });
    },
    'triangle-general'(rng) {
      return OGE.retry(rng, () => {
        const P = [];
        for (let i = 0; i < 3; i++) P.push([rng.int(1, W - 1), rng.int(1, H - 1)]);
        // никаких горизонтальных/вертикальных сторон и вырожденности
        for (let i = 0; i < 3; i++) {
          const p = P[i];
          const q = P[(i + 1) % 3];
          if (p[0] === q[0] || p[1] === q[1]) return null;
        }
        const xs = P.map((p) => p[0]);
        const ys = P.map((p) => p[1]);
        const bw = Math.max(...xs) - Math.min(...xs);
        const bh = Math.max(...ys) - Math.min(...ys);
        const parts = [];
        for (let i = 0; i < 3; i++) {
          const p = P[i];
          const q = P[(i + 1) % 3];
          parts.push(new Frac(Math.abs(p[0] - q[0]) * Math.abs(p[1] - q[1]), 2));
        }
        const S = new Frac(bw * bh).sub(parts[0]).sub(parts[1]).sub(parts[2]);
        if (S.sign() <= 0 || bw < 3 || bh < 3) return null;
        // метод работает, когда каждая вершина лежит на границе описанного прямоугольника
        // и отрезанные треугольники не перекрываются: проверяем по формуле площади
        const shoelace = Math.abs((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1])) / 2;
        if (Math.abs(shoelace - S.toNumber()) > 1e-9) return null;
        const pts = { A: P[0], B: P[1], C: P[2] };
        return task({
          text: INTRO + ' треугольник. Найдите его площадь.',
          pts,
          polys: [['A', 'B', 'C']],
          ask: { t: 'area', p: ['A', 'B', 'C'] },
          value: S,
          steps: [
            '<p>Опишем около треугольника прямоугольник по линиям сетки: его размеры ' + bw + ' × ' + bh + ', площадь ' + bw * bh + '.</p>',
            '<p>Вне треугольника остаются три прямоугольных треугольника с катетами по линиям сетки; их площади: ' + parts.map(areaText).join(', ') + '.</p>',
            h.block('<i>S</i> = ' + bw * bh + ' − ' + parts.map(areaText).join(' − ') + ' = ' + areaText(S)),
          ],
        });
      });
    },
    'trapezoid-area'(rng) {
      return OGE.retry(rng, () => {
        const a = rng.int(3, 8);
        const b = rng.int(1, a - 1);
        const hh = rng.int(2, H - 2);
        const x0 = rng.int(1, W - 1 - a);
        const y0 = rng.int(1, H - 1 - hh);
        const p = rng.int(-1, a - b + 1);
        if (x0 + p < 1 || x0 + p + b > W - 1) return null;
        const pts = { A: [x0, y0], D: [x0 + a, y0], C: [x0 + p + b, y0 + hh], B: [x0 + p, y0 + hh] };
        const S = new Frac((a + b) * hh, 2);
        return task({
          text: INTRO + 'а трапеция. Найдите её площадь.',
          pts,
          polys: [['A', 'B', 'C', 'D']],
          ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
          value: S,
          steps: [
            '<p>Основания трапеции горизонтальны: ' + a + ' и ' + b + ' клеток, высота — ' + hh + ' клеток.</p>',
            h.block('<i>S</i> = ' + h.frac(a + ' + ' + b, 2) + ' · ' + hh + ' = ' + areaText(S)),
          ],
        });
      });
    },
    'parallelogram-area'(rng) {
      return OGE.retry(rng, () => {
        const a = rng.int(2, 6);
        const hh = rng.int(2, H - 2);
        const p = rng.intNZ(-3, 3);
        const x0 = rng.int(1, W - 1);
        const y0 = rng.int(1, H - 1 - hh);
        const xs = [x0, x0 + a, x0 + p, x0 + p + a];
        if (Math.min(...xs) < 1 || Math.max(...xs) > W - 1) return null;
        const pts = { A: [x0, y0], D: [x0 + a, y0], C: [x0 + p + a, y0 + hh], B: [x0 + p, y0 + hh] };
        return task({
          text: INTRO + ' параллелограмм. Найдите его площадь.',
          pts,
          polys: [['A', 'B', 'C', 'D']],
          ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
          value: a * hh,
          steps: [
            '<p>Основание (горизонтальная сторона) равно ' + a + ', высота — ' + hh + '. Площадь параллелограмма — произведение основания на высоту:</p>',
            h.block('<i>S</i> = ' + a + ' · ' + hh + ' = ' + a * hh),
          ],
        });
      });
    },
    'rhombus-area'(rng) {
      return OGE.retry(rng, () => {
        const d1 = 2 * rng.int(1, 4);
        const d2 = 2 * rng.int(1, 3);
        if (d1 === d2) return null;
        const cx = rng.int(1 + d1 / 2, W - 1 - d1 / 2);
        const cy = rng.int(1 + d2 / 2, H - 1 - d2 / 2);
        const pts = { A: [cx - d1 / 2, cy], B: [cx, cy + d2 / 2], C: [cx + d1 / 2, cy], D: [cx, cy - d2 / 2] };
        return task({
          text: INTRO + ' ромб. Найдите его площадь.',
          pts,
          polys: [['A', 'B', 'C', 'D']],
          ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
          value: (d1 * d2) / 2,
          steps: [
            '<p>Диагонали ромба идут по линиям сетки: ' + d1 + ' и ' + d2 + '. Площадь ромба — половина произведения диагоналей:</p>',
            h.block('<i>S</i> = ' + h.frac(d1 + ' · ' + d2, 2) + ' = ' + (d1 * d2) / 2),
          ],
        });
      });
    },
    midline(rng) {
      return OGE.retry(rng, () => {
        if (rng.chance(0.5)) {
          // средняя линия трапеции
          const a = rng.int(3, 8);
          const b = rng.int(1, a - 1);
          const hh = 2 * rng.int(1, 3);
          const x0 = rng.int(1, W - 1 - a);
          const y0 = rng.int(1, H - 1 - hh);
          const p = rng.int(0, a - b);
          const pts = { A: [x0, y0], D: [x0 + a, y0], C: [x0 + p + b, y0 + hh], B: [x0 + p, y0 + hh] };
          pts.M = [(pts.A[0] + pts.B[0]) / 2, (pts.A[1] + pts.B[1]) / 2];
          pts.N = [(pts.C[0] + pts.D[0]) / 2, (pts.C[1] + pts.D[1]) / 2];
          return task({
            text: INTRO + 'а трапеция. Найдите длину её средней линии.',
            pts,
            polys: [['A', 'B', 'C', 'D']],
            nodes: ['A', 'B', 'C', 'D'],
            givens: [
              { t: 'mid', p: 'M', of: ['A', 'B'] },
              { t: 'mid', p: 'N', of: ['C', 'D'] },
              { t: 'parallel', a: ['A', 'D'], b: ['B', 'C'] },
            ],
            ask: { t: 'len', p: ['M', 'N'] },
            value: new Frac(a + b, 2),
            steps: [
              '<p>Основания трапеции: ' + a + ' и ' + b + '. Средняя линия равна их полусумме:</p>',
              h.block(h.frac(a + ' + ' + b, 2) + ' = ' + fmt(new Frac(a + b, 2))),
            ],
          });
        }
        // средняя линия треугольника, параллельная горизонтальной стороне
        const b = 2 * rng.int(1, 4);
        const hh = rng.int(2, H - 2);
        const x0 = rng.int(1, W - 1 - b);
        const y0 = rng.int(1, H - 1 - hh);
        const pts = { A: [x0, y0], C: [x0 + b, y0], B: [rng.int(1, W - 1), y0 + hh] };
        pts.M = [(pts.A[0] + pts.B[0]) / 2, (pts.A[1] + pts.B[1]) / 2];
        pts.N = [(pts.C[0] + pts.B[0]) / 2, (pts.C[1] + pts.B[1]) / 2];
        return task({
          text: INTRO + ' треугольник ' + segm('ABC') + '. Найдите длину его средней линии ' + segm('MN') + ', параллельной стороне ' + segm('AC') + '.',
          pts,
          polys: [['A', 'B', 'C']],
          segs: [['M', 'N']],
          labels: ['A', 'B', 'C', 'M', 'N'],
          nodes: ['A', 'B', 'C'],
          givens: [
            { t: 'mid', p: 'M', of: ['A', 'B'] },
            { t: 'mid', p: 'N', of: ['B', 'C'] },
          ],
          ask: { t: 'len', p: ['M', 'N'] },
          value: b / 2,
          steps: [
            '<p>Сторона ' + segm('AC') + ' горизонтальна, её длина ' + b + '. Средняя линия равна половине параллельной ей стороны:</p>',
            h.block(segm('MN') + ' = ' + h.frac(b, 2) + ' = ' + b / 2),
          ],
        });
      });
    },
    distance(rng) {
      return OGE.retry(rng, () => {
        const vertical = rng.chance(0.4);
        if (!vertical) {
          const y = rng.int(1, H - 1);
          const x1 = rng.int(1, 4);
          const x2 = rng.int(x1 + 3, W - 1);
          const ax = rng.int(1, W - 1);
          const ay = rng.int(1, H - 1);
          if (Math.abs(ay - y) < 2) return null;
          const pts = { B: [x1, y], C: [x2, y], A: [ax, ay], H: [ax, y] };
          const d = Math.abs(ay - y);
          return task({
            text:
              'На клетчатой бумаге с размером клетки 1 × 1 отмечены точки ' +
              segm('A') +
              ', ' +
              segm('B') +
              ' и ' +
              segm('C') +
              '. Найдите расстояние от точки ' +
              segm('A') +
              ' до прямой ' +
              segm('BC') +
              '.',
            pts,
            segs: [['B', 'C']],
            labels: ['A', 'B', 'C'],
            nodes: ['A', 'B', 'C'],
            givens: [
              { t: 'onLine', p: 'H', of: ['B', 'C'] },
              { t: 'perp', a: ['A', 'H'], b: ['B', 'C'] },
            ],
            ask: { t: 'len', p: ['A', 'H'] },
            value: d,
            steps: [
              '<p>Прямая ' +
                segm('BC') +
                ' идёт по горизонтальной линии сетки, поэтому перпендикуляр из ' +
                segm('A') +
                ' к ней вертикален. Считаем клетки по вертикали:</p>',
              h.block('<i>d</i> = ' + d),
            ],
          });
        }
        const x = rng.int(1, W - 1);
        const y1 = rng.int(1, 3);
        const y2 = rng.int(y1 + 3, H - 1);
        const ax = rng.int(1, W - 1);
        const ay = rng.int(1, H - 1);
        if (Math.abs(ax - x) < 2) return null;
        const pts = { B: [x, y1], C: [x, y2], A: [ax, ay], H: [x, ay] };
        const d = Math.abs(ax - x);
        return task({
          text:
            'На клетчатой бумаге с размером клетки 1 × 1 отмечены точки ' +
            segm('A') +
            ', ' +
            segm('B') +
            ' и ' +
            segm('C') +
            '. Найдите расстояние от точки ' +
            segm('A') +
            ' до прямой ' +
            segm('BC') +
            '.',
          pts,
          segs: [['B', 'C']],
          labels: ['A', 'B', 'C'],
          nodes: ['A', 'B', 'C'],
          givens: [
            { t: 'onLine', p: 'H', of: ['B', 'C'] },
            { t: 'perp', a: ['A', 'H'], b: ['B', 'C'] },
          ],
          ask: { t: 'len', p: ['A', 'H'] },
          value: d,
          steps: [
            '<p>Прямая ' + segm('BC') + ' вертикальна, перпендикуляр из ' + segm('A') + ' к ней горизонтален. Считаем клетки по горизонтали:</p>',
            h.block('<i>d</i> = ' + d),
          ],
        });
      });
    },
    tangent(rng) {
      return OGE.retry(rng, () => {
        const dx = rng.pick([1, 2, 4, 5]);
        const dy = rng.int(1, H - 2);
        const t = new Frac(dy, dx);
        if (t.eq(1) || t.decimalPlaces() > 2) return null;
        const ox = rng.int(1, W - 1 - Math.max(dx, 3));
        const oy = rng.int(1, H - 1 - dy);
        const flip = rng.chance(0.3);
        const pts = flip
          ? { O: [ox + Math.max(dx, 3), oy], A: [ox, oy], B: [ox + Math.max(dx, 3) - dx, oy + dy] }
          : { O: [ox, oy], A: [ox + Math.max(dx, 3), oy], B: [ox + dx, oy + dy] };
        return task({
          text: 'Найдите тангенс угла ' + segm('AOB') + ', изображённого на клетчатой бумаге.',
          pts,
          segs: [
            ['O', 'A'],
            ['O', 'B'],
          ],
          labels: ['A', 'O', 'B'],
          dirs: { O: [0, -1] },
          ask: { t: 'tan', p: ['A', 'O', 'B'] },
          value: t,
          steps: [
            '<p>Опустим из точки ' +
              segm('B') +
              ' перпендикуляр на прямую ' +
              segm('OA') +
              ' — получим прямоугольный треугольник с катетами по линиям сетки. ' +
              'Противолежащий углу катет равен ' +
              dy +
              ' (по вертикали), прилежащий — ' +
              dx +
              ' (по горизонтали).</p>',
            h.block('tg ∠' + segm('AOB') + ' = ' + h.frac(dy, dx) + ' = ' + fmt(t)),
          ],
        });
      });
    },
  };

  const WEIGHTS = {
    'triangle-area': 2,
    'triangle-general': 1,
    'trapezoid-area': 2,
    'parallelogram-area': 1,
    'rhombus-area': 1,
    midline: 2,
    distance: 1,
    tangent: 2,
  };

  OGE.registerTask(
    18,
    function (rng, opts) {
      const names = Object.keys(WEIGHTS);
      const subtype =
        opts.subtype ||
        rng.weighted(
          names,
          names.map((n) => WEIGHTS[n]),
        );
      const t = builders[subtype](rng);
      t.subtype = subtype;
      return t;
    },
    Object.keys(WEIGHTS),
  );
})(globalThis);
