'use strict';
/*
 * Независимая проверка геометрических задач по координатам чертежа.
 * Здесь намеренно не используется js/core/geo.js — всё посчитано заново.
 */

function close(a, b, tol = 1e-6) {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}

function makeApi(pts) {
  const P = (k) => {
    const p = typeof k === 'string' ? pts[k] : k;
    if (!p) throw new Error('Нет точки ' + k);
    return p;
  };
  const vec = (a, b) => [P(b)[0] - P(a)[0], P(b)[1] - P(a)[1]];
  const len = (a, b) => Math.hypot(...vec(a, b));
  const cross = (u, v) => u[0] * v[1] - u[1] * v[0];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
  // угол при вершине b через atan2 (в градусах, 0..180)
  const angle = (a, b, c) => {
    const u = vec(b, a);
    const v = vec(b, c);
    let d = Math.abs(Math.atan2(cross(u, v), dot(u, v)));
    return (d * 180) / Math.PI;
  };
  const area = (ks) => {
    let s = 0;
    for (let i = 0; i < ks.length; i++) {
      const p = P(ks[i]);
      const q = P(ks[(i + 1) % ks.length]);
      s += p[0] * q[1] - p[1] * q[0];
    }
    return Math.abs(s) / 2;
  };
  const collinear = (a, b, c) => Math.abs(cross(vec(a, b), vec(a, c))) <= 1e-6 * Math.max(1, len(a, b) * len(a, c));
  const unitScale = (u, v) => Math.hypot(...u) * Math.hypot(...v) || 1;
  return { P, vec, len, angle, area, collinear, cross, dot, unitScale };
}

function checkGiven(pts, g) {
  const G = makeApi(pts);
  switch (g.t) {
    case 'len':
      return close(G.len(g.p[0], g.p[1]), g.v);
    case 'angle':
      return close(G.angle(g.p[0], g.p[1], g.p[2]), g.v);
    case 'sin':
      return close(Math.sin((G.angle(...g.p) * Math.PI) / 180), g.v);
    case 'cos':
      return close(Math.cos((G.angle(...g.p) * Math.PI) / 180), g.v);
    case 'tan':
      return close(Math.tan((G.angle(...g.p) * Math.PI) / 180), g.v);
    case 'mid': {
      const a = G.P(g.of[0]);
      const b = G.P(g.of[1]);
      const m = G.P(g.p);
      return close(m[0], (a[0] + b[0]) / 2) && close(m[1], (a[1] + b[1]) / 2);
    }
    case 'onLine':
      return G.collinear(g.of[0], g.of[1], g.p);
    case 'onSeg': {
      if (!G.collinear(g.of[0], g.of[1], g.p)) return false;
      return close(G.len(g.of[0], g.p) + G.len(g.p, g.of[1]), G.len(g.of[0], g.of[1]));
    }
    case 'beyond': {
      // точка p лежит на продолжении отрезка of[0]of[1] за точку of[1]
      if (!G.collinear(g.of[0], g.of[1], g.p)) return false;
      return close(G.len(g.of[0], g.p), G.len(g.of[0], g.of[1]) + G.len(g.of[1], g.p)) && G.len(g.of[1], g.p) > 1e-9;
    }
    case 'perp': {
      const u = G.vec(g.a[0], g.a[1]);
      const v = G.vec(g.b[0], g.b[1]);
      return Math.abs(G.dot(u, v)) <= 1e-6 * G.unitScale(u, v);
    }
    case 'parallel': {
      const u = G.vec(g.a[0], g.a[1]);
      const v = G.vec(g.b[0], g.b[1]);
      return Math.abs(G.cross(u, v)) <= 1e-6 * G.unitScale(u, v);
    }
    case 'eq':
      return close(G.len(g.a[0], g.a[1]), G.len(g.b[0], g.b[1]));
    case 'eqAngle':
      return close(G.angle(...g.a), G.angle(...g.b));
    case 'onCircle': {
      const r = g.r !== undefined ? g.r : G.len(g.c, g.p[0]);
      return g.p.every((k) => close(G.len(g.c, k), r));
    }
    case 'tangent': {
      // прямая line касается окружности с центром c в точке at: радиус перпендикулярен прямой
      const u = G.vec(g.c, g.at);
      const v = G.vec(g.line[0], g.line[1]);
      return Math.abs(G.dot(u, v)) <= 1e-6 * G.unitScale(u, v);
    }
    case 'area':
      return close(G.area(g.p), g.v);
    case 'integer':
      // вершины лежат в узлах клетчатой сетки
      return g.p.every((k) => Number.isInteger(G.P(k)[0]) && Number.isInteger(G.P(k)[1]));
    case 'convex': {
      // вершины многоугольника идут по порядку без самопересечений (выпуклый)
      const n = g.p.length;
      let sign = 0;
      for (let i = 0; i < n; i++) {
        const c = G.cross(G.vec(g.p[i], g.p[(i + 1) % n]), G.vec(g.p[(i + 1) % n], g.p[(i + 2) % n]));
        if (Math.abs(c) < 1e-9) return false;
        if (!sign) sign = Math.sign(c);
        else if (Math.sign(c) !== sign) return false;
      }
      return true;
    }
    default:
      throw new Error('Неизвестное условие ' + g.t);
  }
}

function measure(pts, ask) {
  const G = makeApi(pts);
  switch (ask.t) {
    case 'len':
      return G.len(ask.p[0], ask.p[1]);
    case 'angle':
      return G.angle(...ask.p);
    case 'area':
      return G.area(ask.p);
    case 'tan':
      return Math.tan((G.angle(...ask.p) * Math.PI) / 180);
    case 'circumR': {
      const [a, b, c] = ask.p;
      return (G.len(a, b) * G.len(b, c) * G.len(c, a)) / (4 * G.area([a, b, c]));
    }
    case 'half-len':
      return G.len(ask.p[0], ask.p[1]) / 2;
    default:
      throw new Error('Неизвестная искомая величина ' + ask.t);
  }
}

module.exports = { checkGiven, measure, close };
