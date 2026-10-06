/*
 * Форматирование чисел и формул по-русски: десятичная запятая,
 * настоящий знак минус, дроби «столбиком», корни, степени.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE || (root.OGE = {});
  const Frac = OGE.Frac;

  const MINUS = '\u2212';
  const NBSP = '\u00a0';
  OGE.MINUS = MINUS;
  OGE.NBSP = NBSP;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Убирает «шум» двоичной арифметики: 0.30000000000000004 → 0.3.
  function clean(x) {
    return Math.round(x * 1e9) / 1e9;
  }

  // Число в виде текста: 2.5 → «2,5», −3 → «−3». Frac с бесконечной
  // десятичной записью выводится как «a/b».
  function fmt(x) {
    if (x instanceof Frac) {
      const s = x.toDecimalString();
      if (s === null) return (x.n < 0 ? MINUS : '') + Math.abs(x.n) + '/' + x.d;
      return s.replace('-', MINUS).replace('.', ',');
    }
    if (typeof x !== 'number' || !isFinite(x)) throw new Error('fmt: не число ' + x);
    let s = String(clean(x));
    if (/e/i.test(s)) s = clean(x).toFixed(9).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', MINUS).replace('.', ',');
  }

  // То же с разбиением на разряды: 25000 → «25 000» (для цен, площадей и т. п.).
  function fmtG(x) {
    const s = fmt(x);
    const neg = s[0] === MINUS;
    const body = neg ? s.slice(1) : s;
    const parts = body.split(',');
    if (parts[0].length > 4) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    return (neg ? MINUS : '') + parts.join(',');
  }

  // Округление Frac до k знаков после запятой (половина — вверх по модулю).
  function roundFrac(f, k) {
    f = Frac.of(f);
    const p = Math.pow(10, k);
    const scaled = f.abs().mul(p);
    // floor(scaled + 1/2)
    const twice = scaled.mul(2).add(1);
    const q = Math.floor(twice.n / (twice.d * 2));
    return new Frac(f.sign() < 0 ? -q : q, p);
  }

  // Русские формы множественного числа: plural(5, 'место', 'места', 'мест').
  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b >= 2 && b <= 4) return few;
    return many;
  }

  // ---- HTML-разметка формул ----
  const h = {
    // Дробь столбиком.
    frac(num, den) {
      return '<span class="frac"><span class="fn">' + num + '</span><span class="fd">' + den + '</span></span>';
    },
    // Число: целое/десятичное как текст, прочие Frac — столбиком.
    num(x) {
      if (x instanceof Frac && !x.isFiniteDecimal()) {
        return (x.n < 0 ? MINUS : '') + h.frac(Math.abs(x.n), x.d);
      }
      return fmt(x);
    },
    // Обыкновенная дробь всегда столбиком (если не целое).
    fracNum(x) {
      x = Frac.of(x);
      if (x.isInt()) return fmt(x);
      return (x.n < 0 ? MINUS : '') + h.frac(Math.abs(x.n), x.d);
    },
    sqrt(inner) {
      return '<span class="sqrt"><span class="sqrt-sign">√</span><span class="sqrt-body">' + inner + '</span></span>';
    },
    // k√r, например 3√5; при k = 1 — просто √r.
    root(k, r) {
      return (k === 1 ? '' : k === -1 ? MINUS : fmt(k)) + h.sqrt(fmt(r));
    },
    pow(base, exp) {
      return base + '<sup>' + exp + '</sup>';
    },
    v(name) {
      return '<i>' + name + '</i>';
    },
    deg(x) {
      return fmt(x) + '°';
    },
    // Обозначение отрезка/точек, напр. AB.
    seg(s) {
      return '<i>' + s + '</i>';
    },
    angle(s) {
      return '∠<i>' + s + '</i>';
    },
    // Строка формулы, не переносимая посередине.
    m(s) {
      return '<span class="math">' + s + '</span>';
    },
    // Выделенная формула отдельной строкой.
    block(s) {
      return '<div class="math-block">' + s + '</div>';
    },
  };

  OGE.esc = esc;
  OGE.clean = clean;
  OGE.fmt = fmt;
  OGE.fmtG = fmtG;
  OGE.roundFrac = roundFrac;
  OGE.plural = plural;
  OGE.h = h;
})(globalThis);
