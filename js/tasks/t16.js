/* Задание 16. Окружность: вписанные и центральные углы, касательные, хорды, радиусы. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { geo, Frac, h, fmt, ang, segm } = OGE;
  const deg = (x) => fmt(x) + '°';
  const T = (o) => OGE.geoTask(o);
  const O = [0, 0];

  const builders = {
    inscribed(rng) {
      const phi = rng.int(10, 85);
      const r = 5;
      const th = rng.int(0, 359);
      const t = rng.int(25, 360 - 2 * phi - 25);
      const pts = { O, A: geo.polar(O, r, th), C: geo.polar(O, r, th + 2 * phi), B: geo.polar(O, r, th + 2 * phi + t) };
      const draw = {
        circles: [{ c: 'O', r }],
        segs: [
          ['A', 'B'],
          ['B', 'C'],
          ['O', 'A'],
          ['O', 'C'],
        ],
        dots: ['O'],
      };
      const on = { t: 'onCircle', c: 'O', p: ['A', 'B', 'C'] };
      if (rng.chance(0.5)) {
        return T({
          text:
            'Точки ' +
            segm('A') +
            ', ' +
            segm('B') +
            ' и ' +
            segm('C') +
            ' лежат на окружности с центром ' +
            segm('O') +
            '. Центральный угол ' +
            segm('AOC') +
            ' равен ' +
            deg(2 * phi) +
            ', точка ' +
            segm('B') +
            ' лежит на большей дуге ' +
            segm('AC') +
            '. Найдите угол ' +
            segm('ABC') +
            '. Ответ дайте в градусах.',
          pts,
          draw,
          givens: [on, { t: 'angle', p: ['A', 'O', 'C'], v: 2 * phi }],
          ask: { t: 'angle', p: ['A', 'B', 'C'] },
          value: phi,
          steps: [
            '<p>Вписанный угол равен половине центрального угла, опирающегося на ту же дугу:</p>',
            h.block(ang('ABC') + ' = ' + h.frac(ang('AOC'), 2) + ' = ' + h.frac(deg(2 * phi), 2) + ' = ' + deg(phi)),
          ],
        });
      }
      return T({
        text:
          'Точки ' +
          segm('A') +
          ', ' +
          segm('B') +
          ' и ' +
          segm('C') +
          ' лежат на окружности с центром ' +
          segm('O') +
          ', угол ' +
          segm('ABC') +
          ' равен ' +
          deg(phi) +
          ', точка ' +
          segm('B') +
          ' лежит на большей дуге ' +
          segm('AC') +
          '. Найдите центральный угол ' +
          segm('AOC') +
          '. Ответ дайте в градусах.',
        pts,
        draw,
        givens: [on, { t: 'angle', p: ['A', 'B', 'C'], v: phi }],
        ask: { t: 'angle', p: ['A', 'O', 'C'] },
        value: 2 * phi,
        steps: [
          '<p>Центральный угол вдвое больше вписанного угла, опирающегося на ту же дугу:</p>',
          h.block(ang('AOC') + ' = 2 · ' + deg(phi) + ' = ' + deg(2 * phi)),
        ],
      });
    },
    arc(rng) {
      const k = rng.pick([3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20]);
      const central = 360 / k;
      const r = 5;
      const th = rng.int(0, 359);
      const t = rng.int(20, 340 - central);
      const pts = { O, A: geo.polar(O, r, th), B: geo.polar(O, r, th + central), C: geo.polar(O, r, th + central + t) };
      return T({
        text:
          'Точки ' +
          segm('A') +
          ', ' +
          segm('B') +
          ' и ' +
          segm('C') +
          ' лежат на окружности. Дуга ' +
          segm('AB') +
          ', не содержащая точку ' +
          segm('C') +
          ', составляет ' +
          h.m(h.frac(1, k)) +
          ' окружности. Найдите вписанный угол ' +
          segm('ACB') +
          '. Ответ дайте в градусах.',
        pts,
        draw: {
          circles: [{ c: 'O', r }],
          segs: [
            ['A', 'C'],
            ['B', 'C'],
          ],
          hide: ['O'],
        },
        givens: [
          { t: 'onCircle', c: 'O', p: ['A', 'B', 'C'] },
          { t: 'angle', p: ['A', 'O', 'B'], v: central },
        ],
        ask: { t: 'angle', p: ['A', 'C', 'B'] },
        value: new Frac(180, k),
        steps: [
          '<p>Вся окружность — 360°, поэтому дуга ' + segm('AB') + ' равна ' + h.m(h.frac('360°', k) + ' = ' + deg(central)) + '.</p>',
          '<p>Вписанный угол равен половине дуги, на которую он опирается:</p>',
          h.block(ang('ACB') + ' = ' + h.frac(deg(central), 2) + ' = ' + deg(central / 2)),
        ],
      });
    },
    diameter(rng) {
      const beta = rng.int(12, 78);
      const r = 5;
      const pts = { O, A: [-r, 0], B: [r, 0], C: geo.polar(O, r, 180 - 2 * beta) };
      return T({
        text:
          'Отрезок ' +
          segm('AB') +
          ' — диаметр окружности с центром ' +
          segm('O') +
          ', точка ' +
          segm('C') +
          ' лежит на окружности, ' +
          h.m(ang('ABC') + ' = ' + deg(beta)) +
          '. Найдите угол ' +
          segm('BAC') +
          '. Ответ дайте в градусах.',
        pts,
        draw: { circles: [{ c: 'O', r }], polys: [['A', 'B', 'C']], dots: ['O'], right: [['A', 'C', 'B']] },
        givens: [
          { t: 'mid', p: 'O', of: ['A', 'B'] },
          { t: 'onCircle', c: 'O', p: ['A', 'B', 'C'] },
          { t: 'angle', p: ['A', 'B', 'C'], v: beta },
        ],
        ask: { t: 'angle', p: ['B', 'A', 'C'] },
        value: 90 - beta,
        steps: [
          '<p>Вписанный угол ' + segm('ACB') + ' опирается на диаметр, поэтому он прямой: ' + h.m(ang('ACB') + ' = 90°') + '.</p>',
          '<p>Сумма острых углов прямоугольного треугольника равна 90°:</p>',
          h.block(ang('BAC') + ' = 90° − ' + deg(beta) + ' = ' + deg(90 - beta)),
        ],
      });
    },
    tangents(rng) {
      const phi = 2 * rng.int(15, 70);
      const r = 4;
      const OP = r / Math.sin((phi / 2) * geo.RAD);
      const pts = { O, P: [OP, 0], A: geo.polar(O, r, 90 - phi / 2), B: geo.polar(O, r, -(90 - phi / 2)) };
      const givens = [
        { t: 'onCircle', c: 'O', p: ['A', 'B'] },
        { t: 'tangent', c: 'O', at: 'A', line: ['A', 'P'] },
        { t: 'tangent', c: 'O', at: 'B', line: ['B', 'P'] },
        { t: 'angle', p: ['A', 'P', 'B'], v: phi },
      ];
      const draw = {
        circles: [{ c: 'O', r }],
        segs: [
          ['P', 'A'],
          ['P', 'B'],
          ['O', 'A'],
          ['O', 'B'],
          ['A', 'B'],
        ],
        dots: ['O'],
        right: [
          ['O', 'A', 'P'],
          ['O', 'B', 'P'],
        ],
      };
      if (rng.chance(0.5)) {
        return T({
          text:
            'Касательные в точках ' +
            segm('A') +
            ' и ' +
            segm('B') +
            ' к окружности с центром ' +
            segm('O') +
            ' пересекаются в точке ' +
            segm('P') +
            ' под углом ' +
            deg(phi) +
            '. Найдите угол ' +
            segm('ABO') +
            '. Ответ дайте в градусах.',
          pts,
          draw,
          givens,
          ask: { t: 'angle', p: ['A', 'B', 'O'] },
          value: phi / 2,
          steps: [
            '<p>Радиус, проведённый в точку касания, перпендикулярен касательной: ' + h.m(ang('OAP') + ' = ' + ang('OBP') + ' = 90°') + '.</p>',
            '<p>В четырёхугольнике ' +
              segm('OAPB') +
              ' сумма углов 360°, поэтому ' +
              h.m(ang('AOB') + ' = 360° − 90° − 90° − ' + deg(phi) + ' = ' + deg(180 - phi)) +
              '.</p>',
            '<p>Треугольник ' + segm('AOB') + ' равнобедренный (' + segm('OA') + ' = ' + segm('OB') + ' — радиусы), его углы при основании равны:</p>',
            h.block(ang('ABO') + ' = ' + h.frac('180° − ' + deg(180 - phi), 2) + ' = ' + deg(phi / 2)),
          ],
        });
      }
      return T({
        text:
          'Касательные в точках ' +
          segm('A') +
          ' и ' +
          segm('B') +
          ' к окружности с центром ' +
          segm('O') +
          ' пересекаются в точке ' +
          segm('P') +
          ' под углом ' +
          deg(phi) +
          '. Найдите угол ' +
          segm('AOB') +
          '. Ответ дайте в градусах.',
        pts,
        draw,
        givens,
        ask: { t: 'angle', p: ['A', 'O', 'B'] },
        value: 180 - phi,
        steps: [
          '<p>Радиус, проведённый в точку касания, перпендикулярен касательной: ' + h.m(ang('OAP') + ' = ' + ang('OBP') + ' = 90°') + '.</p>',
          '<p>Сумма углов четырёхугольника ' + segm('OAPB') + ' равна 360°:</p>',
          h.block(ang('AOB') + ' = 360° − 90° − 90° − ' + deg(phi) + ' = ' + deg(180 - phi)),
        ],
      });
    },
    'tangent-length'(rng) {
      const [a, r, c] = geo.randomTriple(rng, 60);
      const th = rng.int(0, 359);
      const B = geo.polar(O, r, th);
      const A = geo.add(B, geo.mul([-Math.sin(th * geo.RAD), Math.cos(th * geo.RAD)], a));
      const pts = { O, A, B };
      const givens = [
        { t: 'onCircle', c: 'O', r, p: ['B'] },
        { t: 'tangent', c: 'O', at: 'B', line: ['B', 'A'] },
      ];
      const draw = {
        circles: [{ c: 'O', r }],
        segs: [
          ['A', 'B'],
          ['O', 'B'],
          ['O', 'A'],
        ],
        dots: ['O'],
        right: [['O', 'B', 'A']],
      };
      if (rng.chance(0.5)) {
        return T({
          text:
            'Отрезок ' +
            segm('AB') +
            ' = ' +
            a +
            ' касается окружности радиуса ' +
            r +
            ' с центром ' +
            segm('O') +
            ' в точке ' +
            segm('B') +
            '. Найдите ' +
            segm('AO') +
            '.',
          pts,
          draw,
          givens: givens.concat([{ t: 'len', p: ['A', 'B'], v: a }]),
          ask: { t: 'len', p: ['A', 'O'] },
          value: c,
          steps: [
            '<p>Радиус ' +
              segm('OB') +
              ' перпендикулярен касательной, значит, треугольник ' +
              segm('ABO') +
              ' прямоугольный с гипотенузой ' +
              segm('AO') +
              '.</p>',
            h.block(segm('AO') + ' = ' + h.sqrt(a + '<sup>2</sup> + ' + r + '<sup>2</sup>') + ' = ' + h.sqrt(a * a + r * r) + ' = ' + c),
          ],
        });
      }
      return T({
        text:
          'Прямая касается окружности радиуса ' +
          r +
          ' с центром ' +
          segm('O') +
          ' в точке ' +
          segm('B') +
          '. На касательной взята точка ' +
          segm('A') +
          ', причём ' +
          segm('AO') +
          ' = ' +
          c +
          '. Найдите ' +
          segm('AB') +
          '.',
        pts,
        draw,
        givens: givens.concat([{ t: 'len', p: ['A', 'O'], v: c }]),
        ask: { t: 'len', p: ['A', 'B'] },
        value: a,
        steps: [
          '<p>Радиус ' + segm('OB') + ' перпендикулярен касательной, треугольник ' + segm('ABO') + ' прямоугольный, ' + segm('AB') + ' — катет.</p>',
          h.block(segm('AB') + ' = ' + h.sqrt(c + '<sup>2</sup> − ' + r + '<sup>2</sup>') + ' = ' + h.sqrt(c * c - r * r) + ' = ' + a),
        ],
      });
    },
    chord(rng) {
      const [x, d, R] = geo.randomTriple(rng, 50);
      const pts = { O, A: [-x, -d], B: [x, -d], H: [0, -d] };
      const base = [
        { t: 'onCircle', c: 'O', p: ['A', 'B'] },
        { t: 'mid', p: 'H', of: ['A', 'B'] },
        { t: 'perp', a: ['O', 'H'], b: ['A', 'B'] },
        { t: 'len', p: ['O', 'H'], v: d },
      ];
      const draw = {
        circles: [{ c: 'O', r: R }],
        segs: [
          ['A', 'B'],
          ['O', 'H', 'dash'],
          ['O', 'A'],
          ['O', 'B'],
        ],
        dots: ['O'],
        right: [['O', 'H', 'B']],
      };
      if (rng.chance(0.5)) {
        return T({
          text:
            'В окружности с центром ' +
            segm('O') +
            ' проведена хорда ' +
            segm('AB') +
            ' длиной ' +
            2 * x +
            '. Расстояние от центра окружности до этой хорды равно ' +
            d +
            '. Найдите радиус окружности.',
          pts,
          draw,
          givens: base.concat([{ t: 'len', p: ['A', 'B'], v: 2 * x }]),
          ask: { t: 'len', p: ['O', 'A'] },
          value: R,
          steps: [
            '<p>Перпендикуляр ' + segm('OH') + ' из центра к хорде делит её пополам: ' + h.m(segm('AH') + ' = ' + h.frac(2 * x, 2) + ' = ' + x) + '.</p>',
            '<p>Из прямоугольного треугольника ' + segm('OHA') + ' по теореме Пифагора:</p>',
            h.block(segm('OA') + ' = ' + h.sqrt(x + '<sup>2</sup> + ' + d + '<sup>2</sup>') + ' = ' + h.sqrt(x * x + d * d) + ' = ' + R),
          ],
        });
      }
      return T({
        text:
          'Радиус окружности с центром ' +
          segm('O') +
          ' равен ' +
          R +
          ', расстояние от центра до хорды ' +
          segm('AB') +
          ' равно ' +
          d +
          '. Найдите длину хорды ' +
          segm('AB') +
          '.',
        pts,
        draw,
        givens: base.concat([{ t: 'onCircle', c: 'O', r: R, p: ['A'] }]),
        ask: { t: 'len', p: ['A', 'B'] },
        value: 2 * x,
        steps: [
          '<p>Из прямоугольного треугольника ' +
            segm('OHA') +
            ': ' +
            h.m(segm('AH') + ' = ' + h.sqrt(R + '<sup>2</sup> − ' + d + '<sup>2</sup>') + ' = ' + h.sqrt(R * R - d * d) + ' = ' + x) +
            '.</p>',
          '<p>Перпендикуляр из центра делит хорду пополам:</p>',
          h.block(segm('AB') + ' = 2 · ' + x + ' = ' + 2 * x),
        ],
      });
    },
    circumradius(rng) {
      const [a, b, c] = geo.randomTriple(rng, 80);
      const C = [(b * b) / c, (a * b) / c];
      const pts = { A: [0, 0], B: [c, 0], C, O: [c / 2, 0] };
      return T({
        text: 'Катеты прямоугольного треугольника равны ' + a + ' и ' + b + '. Найдите радиус окружности, описанной около этого треугольника.',
        pts,
        draw: { circles: [{ c: 'O', r: c / 2 }], polys: [['A', 'B', 'C']], dots: ['O'], right: [['A', 'C', 'B']], hide: ['A', 'B', 'C', 'O'] },
        givens: [
          { t: 'angle', p: ['A', 'C', 'B'], v: 90 },
          { t: 'len', p: ['B', 'C'], v: a },
          { t: 'len', p: ['A', 'C'], v: b },
        ],
        ask: { t: 'circumR', p: ['A', 'B', 'C'] },
        value: new Frac(c, 2),
        steps: [
          '<p>Центр окружности, описанной около прямоугольного треугольника, — середина гипотенузы, поэтому радиус равен половине гипотенузы.</p>',
          h.block(
            '<i>c</i> = ' +
              h.sqrt(a + '<sup>2</sup> + ' + b + '<sup>2</sup>') +
              ' = ' +
              h.sqrt(c * c) +
              ' = ' +
              c +
              ', &nbsp; <i>R</i> = ' +
              h.frac(c, 2) +
              ' = ' +
              fmt(c / 2),
          ),
        ],
      });
    },
    square(rng) {
      const kind = rng.pick(['inner', 'outer-side', 'outer-r']);
      const k = rng.int(2, 30);
      // для outer-* сторона = k√2, радиус описанной = k; для inner сторона = k
      const a = kind === 'inner' ? k : k * Math.SQRT2;
      const pts = { A: [0, 0], B: [0, a], C: [a, a], D: [a, 0], O: [a / 2, a / 2], K: [0, a / 2] };
      const sq = [
        { t: 'eq', a: ['A', 'B'], b: ['B', 'C'] },
        { t: 'eq', a: ['B', 'C'], b: ['C', 'D'] },
        { t: 'angle', p: ['A', 'B', 'C'], v: 90 },
        { t: 'angle', p: ['B', 'C', 'D'], v: 90 },
        { t: 'angle', p: ['C', 'D', 'A'], v: 90 },
        { t: 'mid', p: 'O', of: ['A', 'C'] },
      ];
      if (kind === 'inner') {
        return T({
          text: 'Сторона квадрата равна ' + k + '. Найдите радиус окружности, вписанной в этот квадрат.',
          pts,
          draw: {
            polys: [['A', 'B', 'C', 'D']],
            circles: [{ c: 'O', r: a / 2 }],
            segs: [['O', 'K', 'dash']],
            dots: ['O'],
            hide: ['A', 'B', 'C', 'D', 'O', 'K'],
          },
          givens: sq.concat([
            { t: 'len', p: ['A', 'B'], v: k },
            { t: 'mid', p: 'K', of: ['A', 'B'] },
          ]),
          ask: { t: 'len', p: ['O', 'K'] },
          value: new Frac(k, 2),
          steps: [
            '<p>Диаметр вписанной окружности равен стороне квадрата, значит, радиус — половина стороны:</p>',
            h.block('<i>r</i> = ' + h.frac(k, 2) + ' = ' + fmt(k / 2)),
          ],
        });
      }
      if (kind === 'outer-side') {
        return T({
          text: 'Радиус окружности, описанной около квадрата, равен ' + h.m(h.root(k, 2)) + '. Найдите длину стороны этого квадрата.',
          pts: { A: [0, 0], B: [0, 2 * k], C: [2 * k, 2 * k], D: [2 * k, 0], O: [k, k] },
          draw: {
            polys: [['A', 'B', 'C', 'D']],
            circles: [{ c: 'O', r: k * Math.SQRT2 }],
            segs: [['O', 'A', 'dash']],
            dots: ['O'],
            hide: ['A', 'B', 'C', 'D', 'O'],
          },
          givens: sq.concat([{ t: 'len', p: ['O', 'A'], v: k * Math.SQRT2 }]),
          ask: { t: 'len', p: ['A', 'B'] },
          value: 2 * k,
          steps: [
            '<p>Диагональ квадрата — диаметр описанной окружности: ' + h.m('<i>d</i> = 2 · ' + h.root(k, 2) + ' = ' + h.root(2 * k, 2)) + '.</p>',
            '<p>Сторона квадрата в ' + h.sqrt(2) + ' раз меньше диагонали:</p>',
            h.block('<i>a</i> = ' + h.frac(h.root(2 * k, 2), h.sqrt(2)) + ' = ' + 2 * k),
          ],
        });
      }
      return T({
        text: 'Сторона квадрата равна ' + h.m(h.root(k, 2)) + '. Найдите радиус окружности, описанной около этого квадрата.',
        pts,
        draw: { polys: [['A', 'B', 'C', 'D']], circles: [{ c: 'O', r: k }], segs: [['O', 'A', 'dash']], dots: ['O'], hide: ['A', 'B', 'C', 'D', 'O', 'K'] },
        givens: sq.concat([{ t: 'len', p: ['A', 'B'], v: a }]),
        ask: { t: 'len', p: ['O', 'A'] },
        value: k,
        steps: [
          '<p>Диагональ квадрата со стороной <i>a</i> равна ' +
            h.m('<i>a</i>' + h.sqrt(2)) +
            ': ' +
            h.m(h.root(k, 2) + ' · ' + h.sqrt(2) + ' = ' + 2 * k) +
            '.</p>',
          '<p>Радиус описанной окружности — половина диагонали:</p>',
          h.block('<i>R</i> = ' + h.frac(2 * k, 2) + ' = ' + k),
        ],
      });
    },
  };

  const WEIGHTS = { inscribed: 3, arc: 1, diameter: 2, tangents: 2, 'tangent-length': 2, chord: 2, circumradius: 1, square: 2 };

  OGE.registerTask(
    16,
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
