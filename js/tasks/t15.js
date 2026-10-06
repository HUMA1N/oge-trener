/* Задание 15. Треугольники. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { geo, Frac, h, fmt, ang, segm } = OGE;
  const deg = (x) => fmt(x) + '°';
  const T = (o) => OGE.geoTask(o);

  // Прямоугольный треугольник с прямым углом C и гипотенузой AB на горизонтали.
  function rightTriangle(a, b) {
    // BC = a, AC = b
    const c = Math.hypot(a, b);
    return { A: [0, 0], B: [c, 0], C: [(b * b) / c, (a * b) / c] };
  }
  // Треугольник по стороне AB = c и прилежащим углам A, B (в градусах).
  function byAngles(c, A, B) {
    const C = 180 - A - B;
    const AC = (c * Math.sin(B * geo.RAD)) / Math.sin(C * geo.RAD);
    return { A: [0, 0], B: [c, 0], C: geo.polar([0, 0], AC, A) };
  }
  function trigText(v) {
    return v.isFiniteDecimal() ? fmt(v) : h.fracNum(v);
  }

  const builders = {
    pythagoras(rng) {
      const [a, b, c] = geo.randomTriple(rng, 60);
      const pts = rightTriangle(a, b);
      const askHyp = rng.chance(0.5);
      const right = { t: 'angle', p: ['A', 'C', 'B'], v: 90 };
      if (askHyp) {
        return T({
          text:
            'В треугольнике ' +
            segm('ABC') +
            ' угол ' +
            segm('C') +
            ' равен 90°, ' +
            segm('AC') +
            ' = ' +
            b +
            ', ' +
            segm('BC') +
            ' = ' +
            a +
            '. Найдите ' +
            segm('AB') +
            '.',
          pts,
          draw: { polys: [['A', 'B', 'C']], right: [['A', 'C', 'B']] },
          givens: [right, { t: 'len', p: ['A', 'C'], v: b }, { t: 'len', p: ['B', 'C'], v: a }],
          ask: { t: 'len', p: ['A', 'B'] },
          value: c,
          steps: [
            '<p>По теореме Пифагора квадрат гипотенузы равен сумме квадратов катетов:</p>',
            h.block(
              segm('AB') +
                '<sup>2</sup> = ' +
                segm('AC') +
                '<sup>2</sup> + ' +
                segm('BC') +
                '<sup>2</sup> = ' +
                b +
                '<sup>2</sup> + ' +
                a +
                '<sup>2</sup> = ' +
                b * b +
                ' + ' +
                a * a +
                ' = ' +
                c * c,
            ),
            h.block(segm('AB') + ' = ' + h.sqrt(c * c) + ' = ' + c),
          ],
        });
      }
      return T({
        text:
          'В треугольнике ' +
          segm('ABC') +
          ' угол ' +
          segm('C') +
          ' равен 90°, ' +
          segm('AB') +
          ' = ' +
          c +
          ', ' +
          segm('AC') +
          ' = ' +
          b +
          '. Найдите ' +
          segm('BC') +
          '.',
        pts,
        draw: { polys: [['A', 'B', 'C']], right: [['A', 'C', 'B']] },
        givens: [right, { t: 'len', p: ['A', 'B'], v: c }, { t: 'len', p: ['A', 'C'], v: b }],
        ask: { t: 'len', p: ['B', 'C'] },
        value: a,
        steps: [
          '<p>По теореме Пифагора катет равен корню из разности квадратов гипотенузы и другого катета:</p>',
          h.block(
            segm('BC') +
              '<sup>2</sup> = ' +
              segm('AB') +
              '<sup>2</sup> − ' +
              segm('AC') +
              '<sup>2</sup> = ' +
              c +
              '<sup>2</sup> − ' +
              b +
              '<sup>2</sup> = ' +
              c * c +
              ' − ' +
              b * b +
              ' = ' +
              a * a,
          ),
          h.block(segm('BC') + ' = ' + h.sqrt(a * a) + ' = ' + a),
        ],
      });
    },
    'angles-sum'(rng) {
      const A = rng.int(20, 100);
      const B = rng.int(20, 160 - A - 15);
      const C = 180 - A - B;
      const pts = byAngles(10, A, B);
      return T({
        text:
          'В треугольнике ' +
          segm('ABC') +
          ' угол ' +
          segm('A') +
          ' равен ' +
          deg(A) +
          ', угол ' +
          segm('B') +
          ' равен ' +
          deg(B) +
          '. Найдите угол ' +
          segm('C') +
          '. Ответ дайте в градусах.',
        pts,
        draw: { polys: [['A', 'B', 'C']] },
        givens: [
          { t: 'angle', p: ['B', 'A', 'C'], v: A },
          { t: 'angle', p: ['A', 'B', 'C'], v: B },
        ],
        ask: { t: 'angle', p: ['A', 'C', 'B'] },
        value: C,
        steps: ['<p>Сумма углов треугольника равна 180°:</p>', h.block(ang('C') + ' = 180° − ' + deg(A) + ' − ' + deg(B) + ' = ' + deg(C))],
      });
    },
    isosceles(rng) {
      // основание AC, вершина B
      const mode = rng.pick(['apex', 'base', 'obtuse']);
      let apex;
      if (mode === 'obtuse') apex = 2 * rng.int(46, 80);
      else apex = 2 * rng.int(10, 70);
      const base = (180 - apex) / 2;
      const s = 6;
      const pts = { A: [-s, 0], C: [s, 0], B: [0, s * Math.tan(base * geo.RAD)] };
      const iso = { t: 'eq', a: ['A', 'B'], b: ['B', 'C'] };
      const draw = { polys: [['A', 'B', 'C']] };
      if (mode === 'base') {
        return T({
          text:
            'В равнобедренном треугольнике ' +
            segm('ABC') +
            ' с основанием ' +
            segm('AC') +
            ' угол при основании равен ' +
            deg(base) +
            '. Найдите угол ' +
            segm('B') +
            '. Ответ дайте в градусах.',
          pts,
          draw,
          givens: [iso, { t: 'angle', p: ['B', 'A', 'C'], v: base }],
          ask: { t: 'angle', p: ['A', 'B', 'C'] },
          value: apex,
          steps: [
            '<p>Углы при основании равнобедренного треугольника равны: ' + h.m(ang('A') + ' = ' + ang('C') + ' = ' + deg(base)) + '.</p>',
            h.block(ang('B') + ' = 180° − 2 · ' + deg(base) + ' = ' + deg(apex)),
          ],
        });
      }
      const text =
        mode === 'obtuse'
          ? 'Один из углов равнобедренного треугольника равен ' + deg(apex) + '. Найдите один из других его углов. Ответ дайте в градусах.'
          : 'В равнобедренном треугольнике ' +
            segm('ABC') +
            ' с основанием ' +
            segm('AC') +
            ' угол ' +
            segm('B') +
            ' равен ' +
            deg(apex) +
            '. Найдите угол ' +
            segm('A') +
            '. Ответ дайте в градусах.';
      return T({
        text,
        pts,
        draw: mode === 'obtuse' ? false : draw,
        givens: [iso, { t: 'angle', p: ['A', 'B', 'C'], v: apex }],
        ask: { t: 'angle', p: ['B', 'A', 'C'] },
        value: base,
        steps: (mode === 'obtuse'
          ? [
              '<p>Тупой угол может быть только при вершине: два тупых угла при основании дали бы в сумме больше 180°. Значит, ' +
                deg(apex) +
                ' — угол при вершине.</p>',
            ]
          : []
        ).concat([
          '<p>Углы при основании равнобедренного треугольника равны, а сумма всех углов — 180°:</p>',
          h.block(h.frac('180° − ' + deg(apex), '2') + ' = ' + deg(base)),
        ]),
      });
    },
    exterior(rng) {
      const A = rng.int(20, 90);
      const B = rng.int(20, 150 - A);
      const pts = byAngles(10, A, B);
      pts.D = geo.add(pts.C, geo.mul(geo.sub(pts.C, pts.A), 0.45));
      return T({
        text:
          'В треугольнике ' +
          segm('ABC') +
          ' угол ' +
          segm('A') +
          ' равен ' +
          deg(A) +
          ', угол ' +
          segm('B') +
          ' равен ' +
          deg(B) +
          '. Найдите внешний угол при вершине ' +
          segm('C') +
          ' (угол ' +
          segm('BCD') +
          ' на рисунке). Ответ дайте в градусах.',
        pts,
        draw: { polys: [['A', 'B', 'C']], segs: [['C', 'D']], arcs: [['B', 'C', 'D']] },
        givens: [
          { t: 'angle', p: ['B', 'A', 'C'], v: A },
          { t: 'angle', p: ['A', 'B', 'C'], v: B },
          { t: 'beyond', p: 'D', of: ['A', 'C'] },
        ],
        ask: { t: 'angle', p: ['B', 'C', 'D'] },
        value: A + B,
        steps: [
          '<p>Внешний угол треугольника равен сумме двух внутренних углов, не смежных с ним:</p>',
          h.block(ang('BCD') + ' = ' + ang('A') + ' + ' + ang('B') + ' = ' + deg(A) + ' + ' + deg(B) + ' = ' + deg(A + B)),
        ],
      });
    },
    bisector(rng) {
      const A = 2 * rng.int(15, 55);
      const B = rng.int(30, 150 - A);
      const pts = byAngles(10, A, B);
      const ab = geo.dist(pts.A, pts.B);
      const ac = geo.dist(pts.A, pts.C);
      // по свойству биссектрисы BD : DC = AB : AC
      pts.D = geo.add(pts.B, geo.mul(geo.sub(pts.C, pts.B), ab / (ab + ac)));
      const askHalf = rng.chance(0.6);
      const givens = [
        { t: 'eqAngle', a: ['B', 'A', 'D'], b: ['D', 'A', 'C'] },
        { t: 'onSeg', p: 'D', of: ['B', 'C'] },
      ];
      const draw = { polys: [['A', 'B', 'C']], segs: [['A', 'D']] };
      if (askHalf) {
        return T({
          text:
            'В треугольнике ' +
            segm('ABC') +
            ' известно, что ' +
            h.m(ang('BAC') + ' = ' + deg(A)) +
            ', ' +
            segm('AD') +
            ' — биссектриса. Найдите угол ' +
            segm('BAD') +
            '. Ответ дайте в градусах.',
          pts,
          draw,
          givens: givens.concat([{ t: 'angle', p: ['B', 'A', 'C'], v: A }]),
          ask: { t: 'angle', p: ['B', 'A', 'D'] },
          value: A / 2,
          steps: ['<p>Биссектриса делит угол пополам:</p>', h.block(ang('BAD') + ' = ' + h.frac(deg(A), 2) + ' = ' + deg(A / 2))],
        });
      }
      return T({
        text:
          'В треугольнике ' +
          segm('ABC') +
          ' проведена биссектриса ' +
          segm('AD') +
          ', ' +
          h.m(ang('BAD') + ' = ' + deg(A / 2)) +
          '. Найдите угол ' +
          segm('BAC') +
          '. Ответ дайте в градусах.',
        pts,
        draw,
        givens: givens.concat([{ t: 'angle', p: ['B', 'A', 'D'], v: A / 2 }]),
        ask: { t: 'angle', p: ['B', 'A', 'C'] },
        value: A,
        steps: ['<p>Биссектриса делит угол пополам, значит, весь угол вдвое больше:</p>', h.block(ang('BAC') + ' = 2 · ' + deg(A / 2) + ' = ' + deg(A))],
      });
    },
    'median-hyp'(rng) {
      const c = rng.int(4, 90);
      const phi = rng.int(35, 145);
      const M = [c / 2, 0];
      const pts = { A: [0, 0], B: [c, 0], C: geo.polar(M, c / 2, phi), M };
      const right = { t: 'angle', p: ['A', 'C', 'B'], v: 90 };
      const draw = { polys: [['A', 'B', 'C']], segs: [['C', 'M']], right: [['A', 'C', 'B']] };
      if (rng.chance(0.5)) {
        return T({
          text:
            'В прямоугольном треугольнике ' +
            segm('ABC') +
            ' с прямым углом ' +
            segm('C') +
            ' гипотенуза ' +
            segm('AB') +
            ' равна ' +
            c +
            '. Найдите медиану ' +
            segm('CM') +
            ', проведённую к гипотенузе.',
          pts,
          draw,
          givens: [right, { t: 'len', p: ['A', 'B'], v: c }, { t: 'mid', p: 'M', of: ['A', 'B'] }],
          ask: { t: 'len', p: ['C', 'M'] },
          value: new Frac(c, 2),
          steps: [
            '<p>Медиана прямоугольного треугольника, проведённая к гипотенузе, равна половине гипотенузы (середина гипотенузы — центр описанной окружности).</p>',
            h.block(segm('CM') + ' = ' + h.frac(c, 2) + ' = ' + fmt(c / 2)),
          ],
        });
      }
      return T({
        text:
          'В прямоугольном треугольнике ' +
          segm('ABC') +
          ' с прямым углом ' +
          segm('C') +
          ' медиана ' +
          segm('CM') +
          ', проведённая к гипотенузе, равна ' +
          fmt(c / 2) +
          '. Найдите гипотенузу ' +
          segm('AB') +
          '.',
        pts,
        draw,
        givens: [right, { t: 'len', p: ['C', 'M'], v: c / 2 }, { t: 'mid', p: 'M', of: ['A', 'B'] }],
        ask: { t: 'len', p: ['A', 'B'] },
        value: c,
        steps: [
          '<p>Медиана, проведённая к гипотенузе, равна её половине, значит, гипотенуза вдвое больше медианы:</p>',
          h.block(segm('AB') + ' = 2 · ' + fmt(c / 2) + ' = ' + c),
        ],
      });
    },
    trig(rng) {
      const [a, b, c] = geo.randomTriple(rng, 60);
      // BC = a (против угла A), AC = b, AB = c
      const pts = rightTriangle(a, b);
      const kind = rng.pick(['sin-hyp', 'sin-leg', 'cos-hyp', 'cos-leg', 'tg-adj', 'tg-opp']);
      const right = { t: 'angle', p: ['A', 'C', 'B'], v: 90 };
      const draw = { polys: [['A', 'B', 'C']], right: [['A', 'C', 'B']] };
      const sin = new Frac(a, c);
      const cos = new Frac(b, c);
      const tg = new Frac(a, b);
      const base = 'В треугольнике ' + segm('ABC') + ' угол ' + segm('C') + ' равен 90°, ';
      const cfg = {
        'sin-hyp': {
          fn: 'sin',
          v: sin,
          given: ['A', 'B', c],
          ask: ['B', 'C'],
          ans: a,
          rule: segm('BC') + ' = ' + segm('AB') + ' · sin ' + segm('A') + ' = ' + c + ' · ' + trigText(sin),
        },
        'sin-leg': {
          fn: 'sin',
          v: sin,
          given: ['B', 'C', a],
          ask: ['A', 'B'],
          ans: c,
          rule: segm('AB') + ' = ' + h.frac(segm('BC'), 'sin ' + segm('A')) + ' = ' + a + ' : ' + trigText(sin),
        },
        'cos-hyp': {
          fn: 'cos',
          v: cos,
          given: ['A', 'B', c],
          ask: ['A', 'C'],
          ans: b,
          rule: segm('AC') + ' = ' + segm('AB') + ' · cos ' + segm('A') + ' = ' + c + ' · ' + trigText(cos),
        },
        'cos-leg': {
          fn: 'cos',
          v: cos,
          given: ['A', 'C', b],
          ask: ['A', 'B'],
          ans: c,
          rule: segm('AB') + ' = ' + h.frac(segm('AC'), 'cos ' + segm('A')) + ' = ' + b + ' : ' + trigText(cos),
        },
        'tg-adj': {
          fn: 'tg',
          v: tg,
          given: ['A', 'C', b],
          ask: ['B', 'C'],
          ans: a,
          rule: segm('BC') + ' = ' + segm('AC') + ' · tg ' + segm('A') + ' = ' + b + ' · ' + trigText(tg),
        },
        'tg-opp': {
          fn: 'tg',
          v: tg,
          given: ['B', 'C', a],
          ask: ['A', 'C'],
          ans: b,
          rule: segm('AC') + ' = ' + h.frac(segm('BC'), 'tg ' + segm('A')) + ' = ' + a + ' : ' + trigText(tg),
        },
      }[kind];
      const def = {
        sin: 'синус острого угла — отношение противолежащего катета к гипотенузе: ' + h.m('sin ' + segm('A') + ' = ' + h.frac(segm('BC'), segm('AB'))),
        cos: 'косинус острого угла — отношение прилежащего катета к гипотенузе: ' + h.m('cos ' + segm('A') + ' = ' + h.frac(segm('AC'), segm('AB'))),
        tg: 'тангенс острого угла — отношение противолежащего катета к прилежащему: ' + h.m('tg ' + segm('A') + ' = ' + h.frac(segm('BC'), segm('AC'))),
      }[cfg.fn];
      return T({
        text:
          base +
          segm(cfg.given[0] + cfg.given[1]) +
          ' = ' +
          cfg.given[2] +
          ', ' +
          cfg.fn +
          ' ' +
          segm('A') +
          ' = ' +
          trigText(cfg.v) +
          '. Найдите ' +
          segm(cfg.ask.join('')) +
          '.',
        pts,
        draw,
        givens: [
          right,
          { t: 'len', p: cfg.given.slice(0, 2), v: cfg.given[2] },
          { t: cfg.fn === 'tg' ? 'tan' : cfg.fn, p: ['B', 'A', 'C'], v: cfg.v.toNumber() },
        ],
        ask: { t: 'len', p: cfg.ask },
        value: cfg.ans,
        steps: ['<p>В прямоугольном треугольнике ' + def + '.</p>', h.block(cfg.rule + ' = ' + cfg.ans)],
      });
    },
    area(rng) {
      const mode = rng.pick(['legs', 'height', 'sin30', 'sin']);
      if (mode === 'legs') {
        const a = rng.int(2, 25);
        const b = rng.int(2, 25);
        const pts = rightTriangle(a, b);
        return T({
          text: 'Два катета прямоугольного треугольника равны ' + a + ' и ' + b + '. Найдите площадь этого треугольника.',
          pts,
          draw: { polys: [['A', 'B', 'C']], right: [['A', 'C', 'B']], hide: ['A', 'B', 'C'] },
          givens: [
            { t: 'angle', p: ['A', 'C', 'B'], v: 90 },
            { t: 'len', p: ['B', 'C'], v: a },
            { t: 'len', p: ['A', 'C'], v: b },
          ],
          ask: { t: 'area', p: ['A', 'B', 'C'] },
          value: new Frac(a * b, 2),
          steps: [
            '<p>Площадь прямоугольного треугольника равна половине произведения катетов:</p>',
            h.block('<i>S</i> = ' + h.frac(a + ' · ' + b, 2) + ' = ' + fmt(new Frac(a * b, 2))),
          ],
        });
      }
      if (mode === 'height') {
        const a = rng.int(4, 30);
        const hh = rng.int(2, 20);
        const t = (a * rng.int(20, 80)) / 100;
        const pts = { A: [0, 0], C: [a, 0], B: [t, hh], H: [t, 0] };
        return T({
          text: 'Сторона треугольника равна ' + a + ', а высота, проведённая к этой стороне, равна ' + hh + '. Найдите площадь этого треугольника.',
          pts,
          draw: { polys: [['A', 'B', 'C']], segs: [['B', 'H', 'dash']], right: [['B', 'H', 'C']], hide: ['A', 'B', 'C', 'H'] },
          givens: [
            { t: 'len', p: ['A', 'C'], v: a },
            { t: 'onLine', p: 'H', of: ['A', 'C'] },
            { t: 'perp', a: ['B', 'H'], b: ['A', 'C'] },
            { t: 'len', p: ['B', 'H'], v: hh },
          ],
          ask: { t: 'area', p: ['A', 'B', 'C'] },
          value: new Frac(a * hh, 2),
          steps: [
            '<p>Площадь треугольника равна половине произведения стороны на высоту, проведённую к ней:</p>',
            h.block('<i>S</i> = ' + h.frac(a + ' · ' + hh, 2) + ' = ' + fmt(new Frac(a * hh, 2))),
          ],
        });
      }
      if (mode === 'sin30') {
        const a = rng.int(2, 24);
        const b = rng.int(2, 24);
        const A = rng.pick([30, 150]);
        const pts = { A: [0, 0], B: [a, 0], C: geo.polar([0, 0], b, A) };
        const S = new Frac(a * b, 4);
        return T({
          text:
            'В треугольнике ' +
            segm('ABC') +
            ' ' +
            segm('AB') +
            ' = ' +
            a +
            ', ' +
            segm('AC') +
            ' = ' +
            b +
            ', угол ' +
            segm('A') +
            ' равен ' +
            deg(A) +
            '. Найдите площадь треугольника.',
          pts,
          draw: { polys: [['A', 'B', 'C']], arcs: [['B', 'A', 'C']] },
          givens: [
            { t: 'len', p: ['A', 'B'], v: a },
            { t: 'len', p: ['A', 'C'], v: b },
            { t: 'angle', p: ['B', 'A', 'C'], v: A },
          ],
          ask: { t: 'area', p: ['A', 'B', 'C'] },
          value: S,
          steps: [
            '<p>Площадь треугольника равна половине произведения двух сторон на синус угла между ними; ' +
              h.m('sin ' + deg(A) + ' = ' + h.frac(1, 2)) +
              (A === 150 ? ' (так как sin(180° − α) = sin α)' : '') +
              ':</p>',
            h.block('<i>S</i> = ' + h.frac(1, 2) + ' · ' + a + ' · ' + b + ' · ' + h.frac(1, 2) + ' = ' + fmt(S)),
          ],
        });
      }
      return OGE.retry(rng, () => {
        const [p, , r] = rng.pick(geo.TRIPLES);
        const sin = new Frac(p, r);
        const a = rng.int(2, 25);
        const b = rng.int(2, 25);
        const S = sin.mul(a * b).div(2);
        if (!S.isFiniteDecimal() || S.decimalPlaces() > 1) return null;
        const A = Math.asin(p / r) / geo.RAD;
        const pts = { A: [0, 0], B: [a, 0], C: geo.polar([0, 0], b, A) };
        return T({
          text:
            'В треугольнике ' +
            segm('ABC') +
            ' ' +
            segm('AB') +
            ' = ' +
            a +
            ', ' +
            segm('AC') +
            ' = ' +
            b +
            ', ' +
            h.m('sin ' + ang('A') + ' = ' + trigText(sin)) +
            '. Найдите площадь треугольника.',
          pts,
          draw: { polys: [['A', 'B', 'C']], arcs: [['B', 'A', 'C']] },
          givens: [
            { t: 'len', p: ['A', 'B'], v: a },
            { t: 'len', p: ['A', 'C'], v: b },
            { t: 'sin', p: ['B', 'A', 'C'], v: sin.toNumber() },
          ],
          ask: { t: 'area', p: ['A', 'B', 'C'] },
          value: S,
          steps: [
            '<p>Площадь треугольника равна половине произведения двух сторон на синус угла между ними:</p>',
            h.block('<i>S</i> = ' + h.frac(1, 2) + ' · ' + a + ' · ' + b + ' · ' + trigText(sin) + ' = ' + fmt(S)),
          ],
        });
      });
    },
    midline(rng) {
      const A = rng.int(35, 85);
      const B = rng.int(35, 85);
      const ac = rng.int(4, 80);
      // строим треугольник со стороной AC
      const C0 = 180 - A - B;
      const pts0 = byAngles(ac, A, C0); // A, B(=C на самом деле), третья вершина
      const pts = { A: pts0.A, C: pts0.B, B: pts0.C };
      pts.M = geo.mid(pts.A, pts.B);
      pts.N = geo.mid(pts.B, pts.C);
      const draw = { polys: [['A', 'B', 'C']], segs: [['M', 'N']] };
      const mids = [
        { t: 'mid', p: 'M', of: ['A', 'B'] },
        { t: 'mid', p: 'N', of: ['B', 'C'] },
      ];
      if (rng.chance(0.6)) {
        return T({
          text:
            'Точки ' +
            segm('M') +
            ' и ' +
            segm('N') +
            ' являются серединами сторон ' +
            segm('AB') +
            ' и ' +
            segm('BC') +
            ' треугольника ' +
            segm('ABC') +
            ', сторона ' +
            segm('AC') +
            ' равна ' +
            ac +
            '. Найдите ' +
            segm('MN') +
            '.',
          pts,
          draw,
          givens: mids.concat([{ t: 'len', p: ['A', 'C'], v: ac }]),
          ask: { t: 'len', p: ['M', 'N'] },
          value: new Frac(ac, 2),
          steps: [
            '<p>' + segm('MN') + ' — средняя линия треугольника. Она параллельна третьей стороне и равна её половине:</p>',
            h.block(segm('MN') + ' = ' + h.frac(ac, 2) + ' = ' + fmt(ac / 2)),
          ],
        });
      }
      return T({
        text:
          'Точки ' +
          segm('M') +
          ' и ' +
          segm('N') +
          ' являются серединами сторон ' +
          segm('AB') +
          ' и ' +
          segm('BC') +
          ' треугольника ' +
          segm('ABC') +
          ', отрезок ' +
          segm('MN') +
          ' равен ' +
          fmt(ac / 2) +
          '. Найдите ' +
          segm('AC') +
          '.',
        pts,
        draw,
        givens: mids.concat([{ t: 'len', p: ['M', 'N'], v: ac / 2 }]),
        ask: { t: 'len', p: ['A', 'C'] },
        value: ac,
        steps: [
          '<p>' + segm('MN') + ' — средняя линия треугольника, она равна половине стороны ' + segm('AC') + ':</p>',
          h.block(segm('AC') + ' = 2 · ' + fmt(ac / 2) + ' = ' + ac),
        ],
      });
    },
    equilateral(rng) {
      const k = rng.int(1, 20);
      const toHeight = rng.chance(0.5);
      const side = toHeight ? 2 * k * Math.sqrt(3) : 2 * k;
      const pts = { A: [0, 0], C: [side, 0], B: [side / 2, (side * Math.sqrt(3)) / 2], H: [side / 2, 0] };
      const draw = { polys: [['A', 'B', 'C']], segs: [['B', 'H', 'dash']], right: [['B', 'H', 'C']] };
      const eqs = [
        { t: 'eq', a: ['A', 'B'], b: ['B', 'C'] },
        { t: 'eq', a: ['B', 'C'], b: ['A', 'C'] },
        { t: 'onLine', p: 'H', of: ['A', 'C'] },
        { t: 'perp', a: ['B', 'H'], b: ['A', 'C'] },
      ];
      if (toHeight) {
        return T({
          text: 'Сторона равностороннего треугольника ' + segm('ABC') + ' равна ' + h.m(h.root(2 * k, 3)) + '. Найдите его высоту ' + segm('BH') + '.',
          pts,
          draw,
          givens: eqs.concat([{ t: 'len', p: ['A', 'C'], v: side }]),
          ask: { t: 'len', p: ['B', 'H'] },
          value: 3 * k,
          steps: [
            '<p>Высота равностороннего треугольника со стороной <i>a</i> равна ' +
              h.m(h.frac('<i>a</i>' + h.sqrt(3), 2)) +
              ' (по теореме Пифагора из половины треугольника).</p>',
            h.block(segm('BH') + ' = ' + h.frac(h.root(2 * k, 3) + ' · ' + h.sqrt(3), 2) + ' = ' + h.frac(2 * k + ' · 3', 2) + ' = ' + 3 * k),
          ],
        });
      }
      return T({
        text: 'Высота ' + segm('BH') + ' равностороннего треугольника ' + segm('ABC') + ' равна ' + h.m(h.root(k, 3)) + '. Найдите сторону этого треугольника.',
        pts,
        draw,
        givens: eqs.concat([{ t: 'len', p: ['B', 'H'], v: k * Math.sqrt(3) }]),
        ask: { t: 'len', p: ['A', 'C'] },
        value: 2 * k,
        steps: [
          '<p>Высота равностороннего треугольника со стороной <i>a</i> равна ' + h.m(h.frac('<i>a</i>' + h.sqrt(3), 2)) + '. Отсюда:</p>',
          h.block(h.frac('<i>a</i>' + h.sqrt(3), 2) + ' = ' + h.root(k, 3) + ' &nbsp;⇒&nbsp; <i>a</i> = ' + 2 * k),
        ],
      });
    },
  };

  const WEIGHTS = { pythagoras: 2, 'angles-sum': 1, isosceles: 2, exterior: 1, bisector: 1, 'median-hyp': 1, trig: 2, area: 3, midline: 1, equilateral: 1 };

  OGE.registerTask(
    15,
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
