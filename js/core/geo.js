/*
 * Геометрия на координатах. Генераторы заданий 15–18 строят настоящий чертёж
 * в координатах; по этим же координатам рисуется картинка, а автотесты
 * проверяют, что все данные условия на чертеже выполнены и что искомая
 * величина, измеренная на чертеже, совпадает с ответом.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE || (root.OGE = {});
  const RAD = Math.PI / 180;

  const geo = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, k) => [a[0] * k, a[1] * k],
    mid: (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
    dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]),
    // точка на окружности: центр c, радиус r, угол в градусах
    polar: (c, r, deg) => [c[0] + r * Math.cos(deg * RAD), c[1] + r * Math.sin(deg * RAD)],
    rot(p, deg, c) {
      c = c || [0, 0];
      const x = p[0] - c[0];
      const y = p[1] - c[1];
      const cs = Math.cos(deg * RAD);
      const sn = Math.sin(deg * RAD);
      return [c[0] + x * cs - y * sn, c[1] + x * sn + y * cs];
    },
    // угол ABC при вершине B, в градусах (0..180)
    angle(a, b, c) {
      const u = geo.sub(a, b);
      const v = geo.sub(c, b);
      const cos = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]));
      return Math.acos(Math.max(-1, Math.min(1, cos))) / RAD;
    },
    // площадь многоугольника по формуле шнурования (Гаусса)
    area(pts) {
      let s = 0;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % pts.length];
        s += p[0] * q[1] - q[0] * p[1];
      }
      return Math.abs(s) / 2;
    },
    // основание перпендикуляра из p на прямую ab
    foot(p, a, b) {
      const d = geo.sub(b, a);
      const t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]);
      return [a[0] + d[0] * t, a[1] + d[1] * t];
    },
    // поворачивает и сдвигает все точки фигуры (для разнообразия рисунков)
    transform(pts, deg) {
      const out = {};
      Object.keys(pts).forEach((k) => (out[k] = geo.rot(pts[k], deg)));
      return out;
    },
    RAD,
  };

  // Пифагоровы тройки (a, b, c), a² + b² = c².
  geo.TRIPLES = [
    [3, 4, 5],
    [5, 12, 13],
    [8, 15, 17],
    [7, 24, 25],
    [20, 21, 29],
    [9, 40, 41],
    [12, 35, 37],
  ];
  geo.randomTriple = function (rng, maxSide) {
    return OGE.retry(rng, () => {
      const t = rng.pick(geo.TRIPLES);
      const k = rng.int(1, 6);
      const r = t.map((x) => x * k);
      if (r[2] > (maxSide || 60)) return null;
      return rng.chance(0.5) ? r : [r[1], r[0], r[2]];
    });
  };

  OGE.geo = geo;
})(globalThis);

/*
 * Общая сборка геометрической задачи.
 * givens — условия задачи в машинном виде (их проверяют автотесты на координатах),
 * ask    — искомая величина: {t: 'len'|'angle'|'area'|..., p: [...]}.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  OGE.geoTask = function (o) {
    const fig = o.draw === false ? '' : '<div class="fig-wrap">' + OGE.draw.figure(Object.assign({ pts: o.pts }, o.draw || {})) + '</div>';
    return {
      subtype: o.subtype,
      html: '<p>' + o.text + '</p>' + fig,
      answer: { type: 'number', value: o.value },
      steps: o.steps.concat([OGE.answerLine(OGE.Frac.of(o.value))]),
      data: { pts: o.pts, givens: o.givens, ask: o.ask },
    };
  };
  // «∠ABC»
  OGE.ang = (s) => '∠<i>' + s + '</i>';
  OGE.segm = (s) => '<i>' + s + '</i>';
})(globalThis);
