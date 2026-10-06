/*
 * Рисунки к задачам в виде SVG-строк: координатная прямая, графики функций,
 * геометрические чертежи, клетчатая бумага. Цвета задаются в CSS через классы,
 * поэтому рисунки корректно выглядят и в тёмной теме.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE || (root.OGE = {});
  const fmt = (x) => OGE.fmt(x);

  function r1(x) {
    return Math.round(x * 10) / 10;
  }
  function attrs(o) {
    return Object.keys(o)
      .filter((k) => o[k] !== undefined && o[k] !== null)
      .map((k) => k + '="' + (typeof o[k] === 'number' ? r1(o[k]) : o[k]) + '"')
      .join(' ');
  }
  function el(tag, a, inner) {
    return '<' + tag + ' ' + attrs(a) + (inner === undefined ? '/>' : '>' + inner + '</' + tag + '>');
  }
  function svg(w, h, body, cls, label) {
    return (
      '<svg class="fig ' +
      (cls || '') +
      '" viewBox="0 0 ' +
      r1(w) +
      ' ' +
      r1(h) +
      '" width="' +
      r1(w) +
      '" role="img"' +
      (label ? ' aria-label="' + OGE.esc(label) + '"' : '') +
      '>' +
      body +
      '</svg>'
    );
  }
  function text(x, y, s, cls, anchor) {
    return el('text', { x, y, class: cls || 'tx', 'text-anchor': anchor || 'middle', 'dominant-baseline': 'central' }, s);
  }
  function arrowRight(x, y) {
    return el('path', { d: 'M' + r1(x) + ' ' + r1(y) + ' l-8 -4 v8 z', class: 'arrow' });
  }
  function arrowUp(x, y) {
    return el('path', { d: 'M' + r1(x) + ' ' + r1(y) + ' l-4 8 h8 z', class: 'arrow' });
  }

  // ---------- Координатная прямая ----------
  // opts: {min, max, ticks:[{x,label}], points:[{x,label}], width}
  function numberLine(opts) {
    const W = opts.width || 340;
    const H = 64;
    const pad = 20;
    const X = (x) => pad + ((x - opts.min) / (opts.max - opts.min)) * (W - 2 * pad - 10);
    const y = 34;
    let b = el('line', { x1: 4, y1: y, x2: W - 4, y2: y, class: 'ln' }) + arrowRight(W - 2, y);
    (opts.ticks || []).forEach((t) => {
      b += el('line', { x1: X(t.x), y1: y - 6, x2: X(t.x), y2: y + 6, class: 'ln' });
      if (t.label !== undefined) b += text(X(t.x), y + 18, t.label);
    });
    (opts.points || []).forEach((p) => {
      b += el('circle', { cx: X(p.x), cy: y, r: 4, class: 'dot' });
      if (p.label) b += text(X(p.x), y - 17, p.label, 'tx lbl');
    });
    return svg(W, H, b, 'fig-line', 'Координатная прямая');
  }

  // ---------- Решение неравенства на прямой (для задания 13) ----------
  // set: [{lo, hi, loIn, hiIn}] (lo/hi могут быть ±Infinity).
  // Концы располагаются равномерно, как на рисунках в КИМ ОГЭ.
  function intervalLine(set, opts) {
    opts = opts || {};
    const W = opts.width || 300;
    const H = 58;
    const y = 36;
    const ends = [];
    set.forEach((s) => {
      if (isFinite(s.lo)) ends.push(s.lo);
      if (isFinite(s.hi)) ends.push(s.hi);
    });
    const uniq = opts.ends || Array.from(new Set(ends)).sort((a, b) => a - b);
    const posOf = (v) => {
      if (v === -Infinity) return 6;
      if (v === Infinity) return W - 10;
      const i = uniq.indexOf(v);
      return 30 + ((i + 1) * (W - 70)) / (uniq.length + 1);
    };
    let b = '';
    // штриховка
    set.forEach((s) => {
      const x1 = posOf(s.lo);
      const x2 = posOf(s.hi);
      b += el('rect', { x: x1, y: y - 14, width: Math.max(0, x2 - x1), height: 14, class: 'shade' });
      for (let x = x1 - 14; x < x2; x += 7) {
        const xa = Math.max(x, x1);
        const ya = y - (xa - x);
        const xb = Math.min(x + 14, x2);
        const yb = y - (xb - x);
        if (xb > xa) b += el('line', { x1: xa, y1: ya, x2: xb, y2: yb, class: 'hatch' });
      }
    });
    b += el('line', { x1: 2, y1: y, x2: W - 4, y2: y, class: 'ln' }) + arrowRight(W - 2, y);
    b += text(W - 10, y + 14, 'x', 'tx var');
    const drawn = {};
    set.forEach((s) => {
      [
        [s.lo, s.loIn],
        [s.hi, s.hiIn],
      ].forEach(([v, inc]) => {
        if (!isFinite(v) || drawn[v]) return;
        drawn[v] = true;
        b += el('circle', { cx: posOf(v), cy: y, r: 4, class: inc ? 'dot' : 'hole' });
        b += text(posOf(v), y + 15, fmt(v));
      });
    });
    return svg(W, H, b, 'fig-interval', 'Числовой промежуток');
  }

  // ---------- График функции на клетчатой сетке (задание 11) ----------
  // opts: {xmin,xmax,ymin,ymax, curves:[[ [x,y], ... ], ...], size}
  function plot(opts) {
    const xmin = opts.xmin;
    const xmax = opts.xmax;
    const ymin = opts.ymin;
    const ymax = opts.ymax;
    const u = opts.unit || 16;
    const W = (xmax - xmin) * u;
    const H = (ymax - ymin) * u;
    const X = (x) => (x - xmin) * u;
    const Y = (y) => (ymax - y) * u;
    let b = '';
    for (let x = Math.ceil(xmin); x <= xmax; x++) b += el('line', { x1: X(x), y1: 0, x2: X(x), y2: H, class: 'grid' });
    for (let y = Math.ceil(ymin); y <= ymax; y++) b += el('line', { x1: 0, y1: Y(y), x2: W, y2: Y(y), class: 'grid' });
    b += el('line', { x1: 0, y1: Y(0), x2: W, y2: Y(0), class: 'ln' }) + arrowRight(W, Y(0));
    b += el('line', { x1: X(0), y1: H, x2: X(0), y2: 0, class: 'ln' }) + arrowUp(X(0), 0);
    b += text(W - 6, Y(0) + 10, 'x', 'tx var sm');
    b += text(X(0) + 10, 7, 'y', 'tx var sm');
    b += text(X(0) - 6, Y(0) + 9, '0', 'tx sm');
    b += text(X(1), Y(0) + 9, '1', 'tx sm');
    b += text(X(0) - 7, Y(1), '1', 'tx sm');
    (opts.curves || []).forEach((pts) => {
      if (pts.length < 2) return;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + r1(X(p[0])) + ' ' + r1(Y(p[1]))).join(' ');
      b += el('path', { d, class: 'curve' });
    });
    return svg(W, H, b, 'fig-plot', 'График функции');
  }

  // Точки графика y = f(x) с отсечением по прямоугольнику и разрывом на асимптотах.
  function sampleCurve(f, box, step) {
    const curves = [];
    let cur = [];
    const h = step || 0.05;
    for (let x = box.xmin; x <= box.xmax + 1e-9; x += h) {
      const xx = Math.round(x * 1000) / 1000;
      const y = f(xx);
      const ok = isFinite(y) && y >= box.ymin - 0.5 && y <= box.ymax + 0.5;
      if (ok) cur.push([xx, Math.max(box.ymin - 0.5, Math.min(box.ymax + 0.5, y))]);
      else if (cur.length) {
        curves.push(cur);
        cur = [];
      }
    }
    if (cur.length) curves.push(cur);
    return curves.filter((c) => c.length > 1);
  }

  // ---------- Геометрический чертёж ----------
  // opts: {
  //   pts: {A:[x,y], ...},           — координаты (ось y вверх)
  //   segs: [['A','B'], ...],         — отрезки
  //   polys: [['A','B','C'], ...],    — многоугольники (контур)
  //   circles: [{c:'O', r}],          — окружности
  //   right: [['A','C','B']],         — знак прямого угла при вершине C
  //   arcs: [['A','B','C']],          — дуга угла при вершине B
  //   dots: ['O'],                    — точки, отмеченные кружком
  //   hide: ['P'],                    — точки без подписи
  //   labelDir: {A:[dx,dy]},          — ручное направление подписи
  //   width
  // }
  function figure(opts) {
    const P = opts.pts;
    const W = opts.width || 280;
    const pad = 26;
    let xs = [];
    let ys = [];
    Object.keys(P).forEach((k) => {
      xs.push(P[k][0]);
      ys.push(P[k][1]);
    });
    (opts.circles || []).forEach((c) => {
      const C = typeof c.c === 'string' ? P[c.c] : c.c;
      xs.push(C[0] - c.r, C[0] + c.r);
      ys.push(C[1] - c.r, C[1] + c.r);
    });
    const minX = Math.min.apply(null, xs);
    const maxX = Math.max.apply(null, xs);
    const minY = Math.min.apply(null, ys);
    const maxY = Math.max.apply(null, ys);
    const spanX = Math.max(maxX - minX, 1e-6);
    const spanY = Math.max(maxY - minY, 1e-6);
    const maxH = opts.maxHeight || 240;
    let s = (W - 2 * pad) / spanX;
    if (spanY * s > maxH - 2 * pad) s = (maxH - 2 * pad) / spanY;
    const realW = spanX * s + 2 * pad;
    const H = spanY * s + 2 * pad;
    const X = (p) => pad + (p[0] - minX) * s;
    const Y = (p) => H - pad - (p[1] - minY) * s;
    const pt = (k) => (typeof k === 'string' ? P[k] : k);

    let b = '';
    (opts.circles || []).forEach((c) => {
      const C = pt(c.c);
      b += el('circle', { cx: X(C), cy: Y(C), r: c.r * s, class: 'ln fill-none' });
    });
    (opts.polys || []).forEach((poly) => {
      const d = poly.map((k, i) => (i ? 'L' : 'M') + r1(X(pt(k))) + ' ' + r1(Y(pt(k)))).join(' ') + ' Z';
      b += el('path', { d, class: 'ln fill-soft' });
    });
    (opts.segs || []).forEach((sg) => {
      const a = pt(sg[0]);
      const c = pt(sg[1]);
      b += el('line', { x1: X(a), y1: Y(a), x2: X(c), y2: Y(c), class: sg[2] === 'dash' ? 'ln dash' : 'ln' });
    });
    (opts.right || []).forEach((t) => {
      const A = pt(t[0]);
      const C = pt(t[1]);
      const B = pt(t[2]);
      const k = 9 / s;
      const u = norm([A[0] - C[0], A[1] - C[1]]);
      const v = norm([B[0] - C[0], B[1] - C[1]]);
      const p1 = [C[0] + u[0] * k, C[1] + u[1] * k];
      const p2 = [C[0] + (u[0] + v[0]) * k, C[1] + (u[1] + v[1]) * k];
      const p3 = [C[0] + v[0] * k, C[1] + v[1] * k];
      b += el('path', {
        d: 'M' + r1(X(p1)) + ' ' + r1(Y(p1)) + ' L' + r1(X(p2)) + ' ' + r1(Y(p2)) + ' L' + r1(X(p3)) + ' ' + r1(Y(p3)),
        class: 'ln thin fill-none',
      });
    });
    (opts.arcs || []).forEach((t) => {
      const A = pt(t[0]);
      const B = pt(t[1]);
      const C = pt(t[2]);
      const rr = 14;
      const a1 = Math.atan2(-(A[1] - B[1]), A[0] - B[0]);
      const a2 = Math.atan2(-(C[1] - B[1]), C[0] - B[0]);
      let d = a2 - a1;
      while (d <= -Math.PI) d += 2 * Math.PI;
      while (d > Math.PI) d -= 2 * Math.PI;
      const sx = X(B) + rr * Math.cos(a1);
      const sy = Y(B) + rr * Math.sin(a1);
      const ex = X(B) + rr * Math.cos(a1 + d);
      const ey = Y(B) + rr * Math.sin(a1 + d);
      b += el('path', {
        d: 'M' + r1(sx) + ' ' + r1(sy) + ' A' + rr + ' ' + rr + ' 0 0 ' + (d > 0 ? 1 : 0) + ' ' + r1(ex) + ' ' + r1(ey),
        class: 'ln thin fill-none',
      });
    });
    // подписи точек: отодвигаем от «центра масс» чертежа
    const keys = Object.keys(P);
    const cx = keys.reduce((acc, k) => acc + P[k][0], 0) / keys.length;
    const cy = keys.reduce((acc, k) => acc + P[k][1], 0) / keys.length;
    (opts.dots || []).forEach((k) => {
      b += el('circle', { cx: X(pt(k)), cy: Y(pt(k)), r: 2.6, class: 'dot' });
    });
    keys.forEach((k) => {
      if ((opts.hide || []).indexOf(k) >= 0) return;
      let dir = (opts.labelDir || {})[k];
      if (!dir) {
        dir = [P[k][0] - cx, P[k][1] - cy];
        if (Math.hypot(dir[0], dir[1]) < 1e-6) dir = [-1, 1];
      }
      const u = norm(dir);
      b += text(X(P[k]) + u[0] * 13, Y(P[k]) - u[1] * 13, k, 'tx lbl');
    });
    return svg(realW, H, b, 'fig-geo', 'Чертёж');
  }

  function norm(v) {
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / l, v[1] / l];
  }

  // ---------- Клетчатая бумага ----------
  // opts: {w, h (в клетках), cell, polys:[{pts:[[x,y]...], cls}], segs:[[[x,y],[x,y]]], points:[{p:[x,y], label, dir}],
  //        rects:[{x,y,w,h,label,cls}], texts:[{x,y,s}]}
  // Начало координат — левый нижний угол сетки.
  function grid(opts) {
    const c = opts.cell || 22;
    const W = opts.w * c;
    const H = opts.h * c;
    const X = (x) => x * c;
    const Y = (y) => H - y * c;
    let b = '';
    for (let i = 0; i <= opts.w; i++) b += el('line', { x1: X(i), y1: 0, x2: X(i), y2: H, class: 'grid' });
    for (let j = 0; j <= opts.h; j++) b += el('line', { x1: 0, y1: Y(j), x2: W, y2: Y(j), class: 'grid' });
    (opts.rects || []).forEach((r) => {
      b += el('rect', { x: X(r.x), y: Y(r.y + r.h), width: r.w * c, height: r.h * c, class: r.cls || 'ln fill-soft' });
    });
    (opts.polys || []).forEach((poly) => {
      const d = poly.pts.map((p, i) => (i ? 'L' : 'M') + r1(X(p[0])) + ' ' + r1(Y(p[1]))).join(' ') + (poly.open ? '' : ' Z');
      b += el('path', { d, class: poly.cls || 'ln fill-soft' });
    });
    (opts.segs || []).forEach((sg) => {
      b += el('line', { x1: X(sg[0][0]), y1: Y(sg[0][1]), x2: X(sg[1][0]), y2: Y(sg[1][1]), class: sg[2] || 'ln' });
    });
    (opts.points || []).forEach((p) => {
      if (p.dot !== false) b += el('circle', { cx: X(p.p[0]), cy: Y(p.p[1]), r: 2.6, class: 'dot' });
      if (p.label) {
        const u = norm(p.dir || [-1, 1]);
        b += text(X(p.p[0]) + u[0] * 12, Y(p.p[1]) - u[1] * 12, p.label, 'tx lbl');
      }
    });
    (opts.circles || []).forEach((ci) => {
      b += el('circle', { cx: X(ci.x), cy: Y(ci.y), r: ci.r * c, class: ci.cls || 'ln fill-soft' });
    });
    (opts.texts || []).forEach((t) => {
      b += text(X(t.x), Y(t.y), t.s, t.cls || 'tx');
    });
    (opts.rects || []).forEach((r) => {
      if (r.label) {
        const lx = r.lx !== undefined ? r.lx : r.x + r.w / 2;
        const ly = r.ly !== undefined ? r.ly : r.y + r.h / 2;
        b += el('circle', { cx: X(lx), cy: Y(ly), r: 8, class: 'plan-badge' }) + text(X(lx), Y(ly), r.label, 'tx plan-num');
      }
    });
    // поле для подписей, выходящих за сетку
    const m = opts.margin === undefined ? 14 : opts.margin;
    return (
      '<svg class="fig fig-grid" viewBox="' +
      -m +
      ' ' +
      -m +
      ' ' +
      (W + 2 * m) +
      ' ' +
      (H + 2 * m) +
      '" width="' +
      (W + 2 * m) +
      '" role="img" aria-label="' +
      OGE.esc(opts.label || 'Рисунок на клетчатой бумаге') +
      '">' +
      b +
      '</svg>'
    );
  }

  OGE.draw = { numberLine, intervalLine, plot, sampleCurve, figure, grid, svg, el, text };
})(globalThis);
