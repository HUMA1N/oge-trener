/* Задание 17. Четырёхугольники: параллелограмм, ромб, прямоугольник, квадрат, трапеция. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { geo, Frac, h, fmt, ang, segm } = OGE;
  const deg = (x) => fmt(x) + '°';
  const T = (o) => OGE.geoTask(o);

  function parallelogram(a, b, alpha) {
    const A = [0, 0];
    const D = [a, 0];
    const B = geo.polar(A, b, alpha);
    return { A, B, C: geo.add(B, D), D };
  }
  const PARA = [
    { t: 'parallel', a: ['A', 'B'], b: ['D', 'C'] },
    { t: 'parallel', a: ['A', 'D'], b: ['B', 'C'] },
    { t: 'convex', p: ['A', 'B', 'C', 'D'] },
  ];
  const quad = { polys: [['A', 'B', 'C', 'D']] };

  const builders = {
    'parallelogram-angle'(rng) {
      const alpha = rng.int(25, 155);
      if (alpha === 90) return builders['parallelogram-angle'](rng);
      const pts = parallelogram(10, rng.int(5, 8), alpha);
      const mode = rng.pick(['adjacent', 'opposite', 'sum']);
      if (mode === 'sum') {
        return T({
          text: 'Сумма двух углов параллелограмма равна ' + deg(2 * alpha) + '. Найдите один из оставшихся углов. Ответ дайте в градусах.',
          pts,
          draw: false,
          givens: PARA.concat([
            { t: 'angle', p: ['B', 'A', 'D'], v: alpha },
            { t: 'angle', p: ['B', 'C', 'D'], v: alpha },
          ]),
          ask: { t: 'angle', p: ['A', 'B', 'C'] },
          value: 180 - alpha,
          steps: [
            '<p>Соседние углы параллелограмма в сумме дают 180°, поэтому ' +
              deg(2 * alpha) +
              ' — это сумма двух <b>противолежащих</b> углов. Они равны, каждый из них ' +
              h.m(h.frac(deg(2 * alpha), 2) + ' = ' + deg(alpha)) +
              '.</p>',
            '<p>Оставшиеся углы — соседние с ними:</p>',
            h.block('180° − ' + deg(alpha) + ' = ' + deg(180 - alpha)),
          ],
        });
      }
      const opp = mode === 'opposite';
      return T({
        text:
          'В параллелограмме ' +
          segm('ABCD') +
          ' угол ' +
          segm('A') +
          ' равен ' +
          deg(alpha) +
          '. Найдите угол ' +
          segm(opp ? 'C' : 'B') +
          '. Ответ дайте в градусах.',
        pts,
        draw: quad,
        givens: PARA.concat([{ t: 'angle', p: ['B', 'A', 'D'], v: alpha }]),
        ask: { t: 'angle', p: opp ? ['B', 'C', 'D'] : ['A', 'B', 'C'] },
        value: opp ? alpha : 180 - alpha,
        steps: opp
          ? ['<p>Противолежащие углы параллелограмма равны:</p>', h.block(ang('C') + ' = ' + ang('A') + ' = ' + deg(alpha))]
          : [
              '<p>Сумма углов, прилежащих к одной стороне параллелограмма, равна 180°:</p>',
              h.block(ang('B') + ' = 180° − ' + deg(alpha) + ' = ' + deg(180 - alpha)),
            ],
      });
    },
    'parallelogram-area'(rng) {
      const a = rng.int(4, 25);
      const b = rng.int(3, 20);
      if (rng.chance(0.5)) {
        const alpha = rng.pick([30, 150]);
        const pts = parallelogram(a, b, alpha);
        return T({
          text: 'Стороны параллелограмма равны ' + a + ' и ' + b + ', а один из его углов равен ' + deg(alpha) + '. Найдите площадь параллелограмма.',
          pts,
          draw: Object.assign({ arcs: [['B', 'A', 'D']], hide: ['A', 'B', 'C', 'D'] }, quad),
          givens: PARA.concat([
            { t: 'len', p: ['A', 'D'], v: a },
            { t: 'len', p: ['A', 'B'], v: b },
            { t: 'angle', p: ['B', 'A', 'D'], v: alpha },
          ]),
          ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
          value: new Frac(a * b, 2),
          steps: [
            '<p>Площадь параллелограмма равна произведению соседних сторон на синус угла между ними; ' +
              h.m('sin ' + deg(alpha) + ' = ' + h.frac(1, 2)) +
              ':</p>',
            h.block('<i>S</i> = ' + a + ' · ' + b + ' · ' + h.frac(1, 2) + ' = ' + fmt(new Frac(a * b, 2))),
          ],
        });
      }
      const hh = rng.int(2, 15);
      const pts = { A: [0, 0], D: [a, 0], B: [rng.int(1, 5), hh] };
      pts.C = geo.add(pts.B, pts.D);
      pts.H = [pts.B[0], 0];
      return T({
        text:
          'Сторона ' +
          segm('AD') +
          ' параллелограмма ' +
          segm('ABCD') +
          ' равна ' +
          a +
          ', а высота ' +
          segm('BH') +
          ', опущенная на неё, равна ' +
          hh +
          '. Найдите площадь параллелограмма.',
        pts,
        draw: Object.assign({ segs: [['B', 'H', 'dash']], right: [['B', 'H', 'D']] }, quad),
        givens: PARA.concat([
          { t: 'len', p: ['A', 'D'], v: a },
          { t: 'onLine', p: 'H', of: ['A', 'D'] },
          { t: 'perp', a: ['B', 'H'], b: ['A', 'D'] },
          { t: 'len', p: ['B', 'H'], v: hh },
        ]),
        ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
        value: a * hh,
        steps: [
          '<p>Площадь параллелограмма равна произведению стороны на высоту, проведённую к этой стороне:</p>',
          h.block('<i>S</i> = ' + a + ' · ' + hh + ' = ' + a * hh),
        ],
      });
    },
    rhombus(rng) {
      const mode = rng.pick(['diagonals', 'angle', 'perimeter']);
      if (mode === 'diagonals') {
        const d1 = rng.int(4, 30);
        const d2 = rng.int(4, 30);
        const pts = { A: [-d1 / 2, 0], C: [d1 / 2, 0], B: [0, d2 / 2], D: [0, -d2 / 2], O: [0, 0] };
        return T({
          text: 'Диагонали ромба ' + segm('ABCD') + ' равны ' + d1 + ' и ' + d2 + '. Найдите площадь ромба.',
          pts,
          draw: Object.assign(
            {
              segs: [
                ['A', 'C'],
                ['B', 'D'],
              ],
              hide: ['O'],
            },
            quad,
          ),
          givens: [
            { t: 'eq', a: ['A', 'B'], b: ['B', 'C'] },
            { t: 'eq', a: ['B', 'C'], b: ['C', 'D'] },
            { t: 'eq', a: ['C', 'D'], b: ['D', 'A'] },
            { t: 'len', p: ['A', 'C'], v: d1 },
            { t: 'len', p: ['B', 'D'], v: d2 },
          ],
          ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
          value: new Frac(d1 * d2, 2),
          steps: [
            '<p>Площадь ромба равна половине произведения его диагоналей:</p>',
            h.block('<i>S</i> = ' + h.frac(d1 + ' · ' + d2, 2) + ' = ' + fmt(new Frac(d1 * d2, 2))),
          ],
        });
      }
      if (mode === 'angle') {
        const beta = rng.int(30, 150);
        if (beta === 90) return builders.rhombus(rng);
        const a = 6;
        // ромб ABCD с углом ABC = beta: B в начале координат
        const B = [0, 0];
        const A = geo.polar(B, a, 90 + beta / 2);
        const C = geo.polar(B, a, 90 - beta / 2);
        const D = geo.add(A, geo.sub(C, B));
        const pts = { A, B, C, D };
        return T({
          text: 'В ромбе ' + segm('ABCD') + ' угол ' + segm('ABC') + ' равен ' + deg(beta) + '. Найдите угол ' + segm('ACD') + '. Ответ дайте в градусах.',
          pts,
          draw: Object.assign({ segs: [['A', 'C']] }, quad),
          givens: [
            { t: 'eq', a: ['A', 'B'], b: ['B', 'C'] },
            { t: 'eq', a: ['B', 'C'], b: ['C', 'D'] },
            { t: 'eq', a: ['C', 'D'], b: ['D', 'A'] },
            { t: 'angle', p: ['A', 'B', 'C'], v: beta },
          ],
          ask: { t: 'angle', p: ['A', 'C', 'D'] },
          value: new Frac(180 - beta, 2),
          steps: [
            '<p>Сумма соседних углов ромба равна 180°: ' + h.m(ang('BCD') + ' = 180° − ' + deg(beta) + ' = ' + deg(180 - beta)) + '.</p>',
            '<p>Диагональ ромба является биссектрисой его углов:</p>',
            h.block(ang('ACD') + ' = ' + h.frac(deg(180 - beta), 2) + ' = ' + deg((180 - beta) / 2)),
          ],
        });
      }
      const side = rng.int(2, 25);
      const alpha = rng.pick([30, 150]);
      const pts = parallelogram(side, side, alpha);
      return T({
        text: 'Периметр ромба равен ' + 4 * side + ', а один из углов равен ' + deg(alpha) + '. Найдите площадь ромба.',
        pts,
        draw: false,
        givens: [
          { t: 'eq', a: ['A', 'B'], b: ['B', 'C'] },
          { t: 'eq', a: ['B', 'C'], b: ['C', 'D'] },
          { t: 'eq', a: ['C', 'D'], b: ['D', 'A'] },
          { t: 'len', p: ['A', 'B'], v: side },
          { t: 'angle', p: ['B', 'A', 'D'], v: alpha },
        ],
        ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
        value: new Frac(side * side, 2),
        steps: [
          '<p>Все стороны ромба равны: ' + h.m('<i>a</i> = ' + h.frac(4 * side, 4) + ' = ' + side) + '.</p>',
          '<p>Площадь ромба: ' + h.m('<i>S</i> = <i>a</i><sup>2</sup> sin α') + ', ' + h.m('sin ' + deg(alpha) + ' = ' + h.frac(1, 2)) + ':</p>',
          h.block('<i>S</i> = ' + side + '<sup>2</sup> · ' + h.frac(1, 2) + ' = ' + fmt(new Frac(side * side, 2))),
        ],
      });
    },
    rectangle(rng) {
      const [a, b, c] = geo.randomTriple(rng, 60);
      const pts = { A: [0, 0], B: [0, b], C: [a, b], D: [a, 0] };
      const rect = [
        { t: 'angle', p: ['D', 'A', 'B'], v: 90 },
        { t: 'angle', p: ['A', 'B', 'C'], v: 90 },
        { t: 'angle', p: ['B', 'C', 'D'], v: 90 },
      ];
      const draw = Object.assign({ segs: [['A', 'C']] }, quad);
      if (rng.chance(0.5)) {
        return T({
          text: 'Стороны прямоугольника ' + segm('ABCD') + ' равны ' + a + ' и ' + b + '. Найдите его диагональ.',
          pts,
          draw,
          givens: rect.concat([
            { t: 'len', p: ['A', 'D'], v: a },
            { t: 'len', p: ['A', 'B'], v: b },
          ]),
          ask: { t: 'len', p: ['A', 'C'] },
          value: c,
          steps: [
            '<p>Диагональ делит прямоугольник на два прямоугольных треугольника. По теореме Пифагора:</p>',
            h.block(segm('AC') + ' = ' + h.sqrt(a + '<sup>2</sup> + ' + b + '<sup>2</sup>') + ' = ' + h.sqrt(c * c) + ' = ' + c),
          ],
        });
      }
      return T({
        text: 'Диагональ прямоугольника ' + segm('ABCD') + ' равна ' + c + ', а одна из его сторон равна ' + a + '. Найдите площадь прямоугольника.',
        pts,
        draw,
        givens: rect.concat([
          { t: 'len', p: ['A', 'C'], v: c },
          { t: 'len', p: ['A', 'D'], v: a },
        ]),
        ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
        value: a * b,
        steps: [
          '<p>Найдём вторую сторону по теореме Пифагора:</p>',
          h.block(h.sqrt(c + '<sup>2</sup> − ' + a + '<sup>2</sup>') + ' = ' + h.sqrt(b * b) + ' = ' + b),
          '<p>Площадь прямоугольника — произведение сторон:</p>',
          h.block('<i>S</i> = ' + a + ' · ' + b + ' = ' + a * b),
        ],
      });
    },
    square(rng) {
      if (rng.chance(0.5)) {
        const d = rng.int(2, 30);
        const s = d / Math.SQRT2;
        const pts = { A: [0, 0], B: [0, s], C: [s, s], D: [s, 0] };
        return T({
          text: 'Найдите площадь квадрата, если его диагональ равна ' + d + '.',
          pts,
          draw: Object.assign({ segs: [['A', 'C']], hide: ['A', 'B', 'C', 'D'] }, quad),
          givens: [
            { t: 'eq', a: ['A', 'B'], b: ['B', 'C'] },
            { t: 'eq', a: ['B', 'C'], b: ['C', 'D'] },
            { t: 'angle', p: ['A', 'B', 'C'], v: 90 },
            { t: 'angle', p: ['B', 'C', 'D'], v: 90 },
            { t: 'len', p: ['A', 'C'], v: d },
          ],
          ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
          value: new Frac(d * d, 2),
          steps: [
            '<p>Квадрат — это ромб, поэтому его площадь равна половине произведения диагоналей (они равны):</p>',
            h.block('<i>S</i> = ' + h.frac(d + '<sup>2</sup>', 2) + ' = ' + fmt(new Frac(d * d, 2))),
          ],
        });
      }
      const k = rng.int(2, 25);
      const s = k * Math.SQRT2;
      const pts = { A: [0, 0], B: [0, s], C: [s, s], D: [s, 0] };
      return T({
        text: 'Сторона квадрата равна ' + h.m(h.root(k, 2)) + '. Найдите диагональ этого квадрата.',
        pts,
        draw: Object.assign({ segs: [['A', 'C']], hide: ['A', 'B', 'C', 'D'] }, quad),
        givens: [
          { t: 'eq', a: ['A', 'B'], b: ['B', 'C'] },
          { t: 'eq', a: ['B', 'C'], b: ['C', 'D'] },
          { t: 'angle', p: ['A', 'B', 'C'], v: 90 },
          { t: 'angle', p: ['B', 'C', 'D'], v: 90 },
          { t: 'len', p: ['A', 'B'], v: s },
        ],
        ask: { t: 'len', p: ['A', 'C'] },
        value: 2 * k,
        steps: [
          '<p>Диагональ квадрата со стороной <i>a</i> равна ' + h.m('<i>a</i>' + h.sqrt(2)) + ':</p>',
          h.block(h.root(k, 2) + ' · ' + h.sqrt(2) + ' = ' + k + ' · 2 = ' + 2 * k),
        ],
      });
    },
    'trapezoid-midline'(rng) {
      const a = rng.int(6, 40);
      const b = rng.int(2, a - 2);
      const hh = rng.int(3, 8);
      const off = rng.int(0, a - b);
      const pts = { A: [0, 0], D: [a, 0], B: [off, hh], C: [off + b, hh] };
      pts.M = geo.mid(pts.A, pts.B);
      pts.N = geo.mid(pts.C, pts.D);
      const base = [
        { t: 'parallel', a: ['A', 'D'], b: ['B', 'C'] },
        { t: 'convex', p: ['A', 'B', 'C', 'D'] },
        { t: 'mid', p: 'M', of: ['A', 'B'] },
        { t: 'mid', p: 'N', of: ['C', 'D'] },
      ];
      const draw = Object.assign({ segs: [['M', 'N']] }, quad);
      const m = new Frac(a + b, 2);
      if (rng.chance(0.6)) {
        return T({
          text: 'Основания трапеции равны ' + a + ' и ' + b + '. Найдите её среднюю линию.',
          pts,
          draw,
          givens: base.concat([
            { t: 'len', p: ['A', 'D'], v: a },
            { t: 'len', p: ['B', 'C'], v: b },
          ]),
          ask: { t: 'len', p: ['M', 'N'] },
          value: m,
          steps: ['<p>Средняя линия трапеции равна полусумме оснований:</p>', h.block(segm('MN') + ' = ' + h.frac(a + ' + ' + b, 2) + ' = ' + fmt(m))],
        });
      }
      return T({
        text: 'Средняя линия трапеции равна ' + fmt(m) + ', а большее основание равно ' + a + '. Найдите меньшее основание трапеции.',
        pts,
        draw,
        givens: base.concat([
          { t: 'len', p: ['A', 'D'], v: a },
          { t: 'len', p: ['M', 'N'], v: m.toNumber() },
        ]),
        ask: { t: 'len', p: ['B', 'C'] },
        value: b,
        steps: [
          '<p>Средняя линия равна полусумме оснований, поэтому сумма оснований равна ' + h.m('2 · ' + fmt(m) + ' = ' + (a + b)) + '.</p>',
          h.block(a + b + ' − ' + a + ' = ' + b),
        ],
      });
    },
    'trapezoid-area'(rng) {
      if (rng.chance(0.5)) {
        const a = rng.int(5, 30);
        const b = rng.int(2, a - 1);
        const hh = rng.int(2, 15);
        const off = rng.int(0, a - b);
        const pts = { A: [0, 0], D: [a, 0], B: [off, hh], C: [off + b, hh], H: [off, 0] };
        return T({
          text: 'Основания трапеции равны ' + a + ' и ' + b + ', а высота равна ' + hh + '. Найдите площадь трапеции.',
          pts,
          draw: Object.assign({ segs: [['B', 'H', 'dash']], hide: ['A', 'B', 'C', 'D', 'H'] }, quad),
          givens: [
            { t: 'parallel', a: ['A', 'D'], b: ['B', 'C'] },
            { t: 'len', p: ['A', 'D'], v: a },
            { t: 'len', p: ['B', 'C'], v: b },
            { t: 'onLine', p: 'H', of: ['A', 'D'] },
            { t: 'perp', a: ['B', 'H'], b: ['A', 'D'] },
            { t: 'len', p: ['B', 'H'], v: hh },
          ],
          ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
          value: new Frac((a + b) * hh, 2),
          steps: [
            '<p>Площадь трапеции равна произведению полусуммы оснований на высоту:</p>',
            h.block('<i>S</i> = ' + h.frac(a + ' + ' + b, 2) + ' · ' + hh + ' = ' + fmt(new Frac((a + b) * hh, 2))),
          ],
        });
      }
      // равнобедренная трапеция: основания и боковая сторона
      const [x, hh, l] = geo.randomTriple(rng, 40);
      const b = rng.int(2, 25);
      const a = b + 2 * x;
      const pts = { A: [0, 0], D: [a, 0], B: [x, hh], C: [x + b, hh], H: [x, 0] };
      const S = ((a + b) * hh) / 2;
      return T({
        text:
          'В равнобедренной трапеции ' + segm('ABCD') + ' основания равны ' + a + ' и ' + b + ', а боковая сторона равна ' + l + '. Найдите площадь трапеции.',
        pts,
        draw: Object.assign({ segs: [['B', 'H', 'dash']], right: [['B', 'H', 'D']] }, quad),
        givens: [
          { t: 'parallel', a: ['A', 'D'], b: ['B', 'C'] },
          { t: 'convex', p: ['A', 'B', 'C', 'D'] },
          { t: 'len', p: ['A', 'D'], v: a },
          { t: 'len', p: ['B', 'C'], v: b },
          { t: 'len', p: ['A', 'B'], v: l },
          { t: 'len', p: ['C', 'D'], v: l },
        ],
        ask: { t: 'area', p: ['A', 'B', 'C', 'D'] },
        value: S,
        steps: [
          '<p>Опустим высоту ' + segm('BH') + '. В равнобедренной трапеции ' + h.m(segm('AH') + ' = ' + h.frac(a + ' − ' + b, 2) + ' = ' + x) + '.</p>',
          '<p>По теореме Пифагора из треугольника ' +
            segm('ABH') +
            ': ' +
            h.m(segm('BH') + ' = ' + h.sqrt(l + '<sup>2</sup> − ' + x + '<sup>2</sup>') + ' = ' + hh) +
            '.</p>',
          h.block('<i>S</i> = ' + h.frac(a + ' + ' + b, 2) + ' · ' + hh + ' = ' + fmt(S)),
        ],
      });
    },
    'trapezoid-angle'(rng) {
      const alpha = rng.int(25, 85);
      const hh = 5;
      const x = hh / Math.tan(alpha * geo.RAD);
      const b = rng.int(3, 8);
      const iso = rng.chance(0.6);
      if (iso) {
        const pts = { A: [0, 0], D: [b + 2 * x, 0], B: [x, hh], C: [x + b, hh] };
        return T({
          text:
            'В равнобедренной трапеции ' +
            segm('ABCD') +
            ' с основаниями ' +
            segm('AD') +
            ' и ' +
            segm('BC') +
            ' угол ' +
            segm('A') +
            ' равен ' +
            deg(alpha) +
            '. Найдите больший угол трапеции. Ответ дайте в градусах.',
          pts,
          draw: quad,
          givens: [
            { t: 'parallel', a: ['A', 'D'], b: ['B', 'C'] },
            { t: 'eq', a: ['A', 'B'], b: ['C', 'D'] },
            { t: 'convex', p: ['A', 'B', 'C', 'D'] },
            { t: 'angle', p: ['B', 'A', 'D'], v: alpha },
          ],
          ask: { t: 'angle', p: ['A', 'B', 'C'] },
          value: 180 - alpha,
          steps: [
            '<p>Углы при основании равнобедренной трапеции равны, а сумма углов, прилежащих к боковой стороне, — 180° (это внутренние односторонние углы при параллельных прямых).</p>',
            h.block(ang('B') + ' = 180° − ' + deg(alpha) + ' = ' + deg(180 - alpha)),
          ],
        });
      }
      const beta = rng.int(25, 85);
      const pts = { A: [0, 0], B: [x, hh], C: [x + b, hh], D: [x + b + hh / Math.tan(beta * geo.RAD), 0] };
      return T({
        text:
          'В трапеции ' +
          segm('ABCD') +
          ' с основаниями ' +
          segm('AD') +
          ' и ' +
          segm('BC') +
          ' угол ' +
          segm('BAD') +
          ' равен ' +
          deg(alpha) +
          '. Найдите угол ' +
          segm('ABC') +
          '. Ответ дайте в градусах.',
        pts,
        draw: quad,
        givens: [
          { t: 'parallel', a: ['A', 'D'], b: ['B', 'C'] },
          { t: 'convex', p: ['A', 'B', 'C', 'D'] },
          { t: 'angle', p: ['B', 'A', 'D'], v: alpha },
        ],
        ask: { t: 'angle', p: ['A', 'B', 'C'] },
        value: 180 - alpha,
        steps: [
          '<p>Углы ' +
            segm('BAD') +
            ' и ' +
            segm('ABC') +
            ' — внутренние односторонние при параллельных ' +
            segm('AD') +
            ' и ' +
            segm('BC') +
            ', их сумма 180°:</p>',
          h.block(ang('ABC') + ' = 180° − ' + deg(alpha) + ' = ' + deg(180 - alpha)),
        ],
      });
    },
  };

  const WEIGHTS = {
    'parallelogram-angle': 2,
    'parallelogram-area': 2,
    rhombus: 2,
    rectangle: 1,
    square: 1,
    'trapezoid-midline': 2,
    'trapezoid-area': 2,
    'trapezoid-angle': 1,
  };

  OGE.registerTask(
    17,
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
