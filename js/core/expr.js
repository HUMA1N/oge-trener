/*
 * Арифметические выражения в виде дерева.
 *
 * Одно и то же дерево выводится двумя способами:
 *  - в HTML для ученика (дроби столбиком, «·», «:», знак минус);
 *  - в строку JavaScript — её вычисляют автотесты обычной арифметикой
 *    с плавающей точкой и сверяют с ответом генератора.
 * Решение о скобках принимается в одном месте для обоих выводов, поэтому
 * если на экране скобки потеряются, тест это заметит.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE || (root.OGE = {});
  const Frac = OGE.Frac;
  const h = OGE.h;
  const MINUS = OGE.MINUS;

  // ---- Конструкторы узлов ----
  const E = {
    // style: 'dec' — десятичная запись, 'frac' — обыкновенная дробь.
    n(x, style) {
      const v = Frac.of(x);
      return { t: 'num', v, style: style || (v.isInt() ? 'dec' : 'frac') };
    },
    dec(x) {
      return E.n(x, 'dec');
    },
    fr(a, b) {
      return E.n(new Frac(a, b), 'frac');
    },
    // Несокращённая дробь a/b (для показа приведения к общему знаменателю).
    raw(a, b, simplify) {
      return { t: 'rawfrac', n: a, d: b, simplify: !!simplify };
    },
    v(name) {
      return { t: 'var', name };
    },
    add: (a, b) => ({ t: 'add', a, b }),
    sub: (a, b) => ({ t: 'sub', a, b }),
    mul: (a, b) => ({ t: 'mul', a, b }),
    // Умножение без знака: 3√5, 2x.
    imul: (a, b) => ({ t: 'mul', a, b, implicit: true }),
    div: (a, b) => ({ t: 'div', a, b }),
    over: (a, b) => ({ t: 'over', a, b }),
    pow: (a, e) => ({ t: 'pow', a, e: typeof e === 'number' ? E.n(e) : e }),
    sqrt: (a) => ({ t: 'sqrt', a: typeof a === 'number' ? E.n(a) : a }),
    neg: (a) => ({ t: 'neg', a }),
    // Явные скобки, которые не следуют из порядка действий: (4·10³)·(2·10⁻⁵).
    group: (a) => ({ t: 'group', a }),
  };

  function isLeaf(n) {
    return n.t === 'num' || n.t === 'rawfrac';
  }
  function isNegLike(n) {
    return (n.t === 'num' && n.v.sign() < 0) || (n.t === 'rawfrac' && n.n < 0) || n.t === 'neg';
  }
  function prec(n) {
    switch (n.t) {
      case 'add':
      case 'sub':
        return 1;
      case 'mul':
      case 'div':
        return 2;
      case 'neg':
        return 3;
      case 'num':
      case 'rawfrac':
        return isNegLike(n) ? 3 : 9;
      case 'pow':
        return 8;
      default:
        return 9; // var, sqrt, over
    }
  }
  // Нужны ли скобки вокруг основания степени.
  function powBaseNeedsParens(b) {
    if (prec(b) < 9 || isNegLike(b) || b.t === 'over' || b.t === 'rawfrac') return true;
    if (b.t === 'num' && !b.v.isInt() && (b.style === 'frac' || !b.v.isFiniteDecimal())) return true;
    return false;
  }

  // Решения о скобках для бинарных операций: [скобки слева, скобки справа].
  function binParens(n) {
    const a = n.a;
    const b = n.b;
    switch (n.t) {
      case 'add':
        return [false, isNegLike(b)];
      case 'sub':
        return [false, prec(b) <= 1 || isNegLike(b)];
      case 'mul':
        return [prec(a) < 2, prec(b) < 2 || isNegLike(b)];
      case 'div':
        return [prec(a) < 2, prec(b) <= 2 || isNegLike(b)];
      default:
        return [false, false];
    }
  }

  function startsWithMinus(str) {
    return str[0] === '-' || str[0] === MINUS;
  }

  function jsNum(v) {
    const s = v.isInt() ? String(v.n) : v.n + '/' + v.d;
    return v.isInt() && v.n >= 0 ? s : '(' + s + ')';
  }

  function htmlNum(n) {
    const v = n.v;
    if (v.isInt()) return OGE.fmt(v);
    if (n.style === 'dec' && v.isFiniteDecimal()) return OGE.fmt(v);
    return (v.n < 0 ? MINUS : '') + h.frac(Math.abs(v.n), v.d);
  }

  const OPS_HTML = { add: ' + ', sub: ' ' + MINUS + ' ', mul: ' · ', div: ' : ' };
  const OPS_JS = { add: '+', sub: '-', mul: '*', div: '/' };

  function render(n, js, vars) {
    const R = (x) => render(x, js, vars);
    const wrap = (s) => '(' + s + ')';
    switch (n.t) {
      case 'num':
        return js ? jsNum(n.v) : htmlNum(n);
      case 'rawfrac':
        if (js) return '(' + n.n + '/' + n.d + ')';
        return (n.n < 0 ? MINUS : '') + h.frac(Math.abs(n.n), n.d);
      case 'var':
        if (js) {
          if (vars && vars[n.name] !== undefined) return '(' + Frac.of(vars[n.name]).toNumber() + ')';
          return n.name;
        }
        return h.v(n.name);
      case 'add':
      case 'sub':
      case 'mul':
      case 'div': {
        const p = binParens(n);
        let a = R(n.a);
        let b = R(n.b);
        if (p[0]) a = wrap(a);
        // правый операнд, начинающийся с минуса, всегда в скобках: «5 − (−2 · 3)»
        if (p[1] || startsWithMinus(b)) b = wrap(b);
        if (n.implicit) return js ? a + '*' + b : a + b;
        return a + (js ? OPS_JS[n.t] : OPS_HTML[n.t]) + b;
      }
      case 'over':
        if (js) return '((' + R(n.a) + ')/(' + R(n.b) + '))';
        return h.frac(R(n.a), R(n.b));
      case 'pow': {
        let base = R(n.a);
        if (powBaseNeedsParens(n.a)) base = wrap(base);
        if (js) return base + '**(' + R(n.e) + ')';
        return base + '<sup>' + R(n.e) + '</sup>';
      }
      case 'sqrt':
        return js ? 'Math.sqrt(' + R(n.a) + ')' : h.sqrt(R(n.a));
      case 'neg': {
        let a = R(n.a);
        // «−x²» на экране; в JS унарный минус перед ** запрещён, поэтому там
        // операнд минуса всегда в скобках (на значение это не влияет: −a = −(a))
        if (js || prec(n.a) <= 1 || isNegLike(n.a) || startsWithMinus(a)) a = wrap(a);
        return (js ? '-' : MINUS) + a;
      }
      case 'group':
        return wrap(R(n.a));
      default:
        throw new Error('render: неизвестный узел ' + n.t);
    }
  }

  function exactSqrt(f) {
    const rn = Math.round(Math.sqrt(f.n));
    const rd = Math.round(Math.sqrt(f.d));
    if (f.n < 0 || rn * rn !== f.n || rd * rd !== f.d) throw new Error('Корень не извлекается нацело');
    return new Frac(rn, rd);
  }

  // Точное значение выражения (Frac).
  function value(n, vars) {
    const V = (x) => value(x, vars);
    switch (n.t) {
      case 'num':
        return n.v;
      case 'rawfrac':
        return new Frac(n.n, n.d);
      case 'var':
        return Frac.of(vars[n.name]);
      case 'add':
        return V(n.a).add(V(n.b));
      case 'sub':
        return V(n.a).sub(V(n.b));
      case 'mul':
        return V(n.a).mul(V(n.b));
      case 'div':
      case 'over':
        return V(n.a).div(V(n.b));
      case 'pow': {
        const e = V(n.e);
        if (!e.isInt()) throw new Error('Нецелый показатель');
        return V(n.a).pow(e.n);
      }
      case 'sqrt':
        return exactSqrt(V(n.a));
      case 'neg':
        return V(n.a).neg();
      case 'group':
        return V(n.a);
      default:
        throw new Error('value: неизвестный узел ' + n.t);
    }
  }

  // ---- Пошаговое вычисление ----
  function isFracStyled(n) {
    return n.t === 'rawfrac' || (n.t === 'num' && n.style === 'frac' && !n.v.isInt());
  }
  function leafVal(n) {
    return n.t === 'rawfrac' ? new Frac(n.n, n.d) : n.v;
  }

  // Один шаг: вычисляет самую первую (в порядке действий) операцию,
  // у которой оба операнда — уже числа. Возвращает новое дерево или null.
  function reduceOnce(n) {
    if (n.t === 'rawfrac' && n.simplify) {
      const v = new Frac(n.n, n.d);
      return E.n(v, 'frac');
    }
    if (isLeaf(n) || n.t === 'var') return null;
    if (n.t === 'group' && isLeaf(n.a)) return n.a;
    const kids = n.t === 'pow' ? ['a', 'e'] : n.t === 'sqrt' || n.t === 'neg' || n.t === 'group' ? ['a'] : ['a', 'b'];
    for (const k of kids) {
      const r = reduceOnce(n[k]);
      if (r) return Object.assign({}, n, { [k]: r });
    }
    if (!kids.every((k) => isLeaf(n[k]))) return null;

    const fracStyle = kids.some((k) => isFracStyled(n[k]));
    if (n.t === 'add' || n.t === 'sub') {
      const a = leafVal(n.a);
      const b = leafVal(n.b);
      // Обыкновенные дроби: сначала приводим к общему знаменателю.
      if (fracStyle && !(a.isInt() && b.isInt())) {
        const da = leafDen(n.a);
        const db = leafDen(n.b);
        if (da !== db) {
          const l = OGE.lcm(a.d, b.d);
          return Object.assign({}, n, {
            a: E.raw(a.n * (l / a.d), l),
            b: E.raw(b.n * (l / b.d), l),
          });
        }
        const num = n.t === 'add' ? leafNum(n.a) + leafNum(n.b) : leafNum(n.a) - leafNum(n.b);
        if (num !== 0 && OGE.gcd(num, da) > 1) return E.raw(num, da, true);
        return E.n(new Frac(num, da), 'frac');
      }
    }
    const v = value(n);
    return E.n(v, fracStyle ? 'frac' : 'dec');
  }
  // Числитель и знаменатель листа в том виде, как он показан (возможно, несокращённом).
  function leafNum(n) {
    return n.t === 'rawfrac' ? n.n : n.v.n;
  }
  function leafDen(n) {
    return n.t === 'rawfrac' ? n.d : n.v.d;
  }

  // Последовательность деревьев от исходного до числа.
  function stepsOf(n) {
    const out = [n];
    let cur = n;
    for (let i = 0; i < 50; i++) {
      const next = reduceOnce(cur);
      if (!next) break;
      out.push(next);
      cur = next;
    }
    return out;
  }

  // HTML цепочки «выражение = … = ответ», по шагу в строке.
  function chainHtml(n) {
    const seq = stepsOf(n);
    return seq.map((s, i) => '<div class="chain-line">' + (i ? '= ' : '') + render(s, false) + '</div>').join('');
  }

  OGE.E = E;
  OGE.expr = {
    html: (n) => render(n, false),
    js: (n, vars) => render(n, true, vars),
    value,
    stepsOf,
    chainHtml,
    reduceOnce,
    isNegLike,
  };
})(globalThis);
