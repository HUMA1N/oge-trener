'use strict';
/*
 * Независимые решатели. Для каждой задачи по её исходным данным (task.data)
 * ответ пересчитывается другим способом, чем в генераторе:
 *  - выражения вычисляются обычной арифметикой JavaScript по тексту формулы;
 *  - уравнения решаются восстановлением многочлена по значениям;
 *  - вероятности — перебором исходов;
 *  - прогрессии — пошаговой симуляцией;
 *  - геометрия — измерением на координатах чертежа;
 *  - неравенства — проверкой точек на числовой прямой.
 * Каждый решатель возвращает ожидаемый ответ (число или строку цифр)
 * и бросает исключение, если данные задачи противоречивы.
 */
const { checkGiven, measure } = require('./geometry');
const { textOf } = require('./load');

function fn(args, body) {
  return new Function(...args, 'return (' + body + ');');
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
function round(x, k) {
  const p = Math.pow(10, k);
  return Math.round(x * p + 1e-9) / p;
}
function near(a, b) {
  return Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
}

// Настоящие размеры листов ISO 216 (мм), A0…A8 — независимо от генератора.
const ISO = {
  0: [841, 1189],
  1: [594, 841],
  2: [420, 594],
  3: [297, 420],
  4: [210, 297],
  5: [148, 210],
  6: [105, 148],
  7: [74, 105],
  8: [52, 74],
};

function tireD(t) {
  return 25.4 * t.d + (2 * t.B * t.p) / 100;
}
function rectDist(a, b) {
  const dx = Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w));
  const dy = Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h));
  return Math.sqrt(dx * dx + dy * dy);
}

function practice(t) {
  const d = t.data;
  switch (d.kind) {
    case 'tires-q1': {
      const j = d.rims.indexOf(d.col);
      const ws = d.widths.filter((w, i) => d.grid[i][j] !== null);
      assert(ws.length, 'пустой столбец');
      return d.ask === 'min' ? Math.min(...ws) : Math.max(...ws);
    }
    case 'tires-h':
      return (d.tire.B * d.tire.p) / 100;
    case 'tires-d':
      return tireD(d.tire);
    case 'tires-diff':
      return Math.abs(tireD(d.to) - tireD(d.from));
    case 'tires-pct': {
      const x = (Math.abs(tireD(d.to) - tireD(d.from)) / tireD(d.from)) * 100;
      return round(x, 1);
    }
    case 'paper-match': {
      // читаем таблицу листов из условия и сопоставляем с настоящими размерами форматов
      const rows = [];
      const re = /<tr><td>(\d)<\/td><td>(\d+)<\/td><td>(\d+)<\/td><\/tr>/g;
      let m;
      while ((m = re.exec(t.context.html))) rows.push({ n: +m[1], L: +m[2], W: +m[3] });
      assert(rows.length === 4, 'в таблице должно быть 4 листа');
      return d.formats
        .map((f) => {
          const r = rows.find((x) => x.L === ISO[f][1] && x.W === ISO[f][0]);
          assert(r, 'нет листа формата A' + f);
          return r.n;
        })
        .join('');
    }
    case 'paper-count': {
      let sheets = 1;
      for (let f = d.m; f < d.n; f++) sheets *= 2;
      return sheets;
    }
    case 'paper-mass':
      return (d.N * d.dens) / Math.pow(2, d.x);
    case 'paper-side':
      return d.side === 'short' ? ISO[d.format][0] : ISO[d.format][1];
    case 'paper-area':
      return (ISO[d.format][0] * ISO[d.format][1]) / 100;
    case 'paper-ratio':
      return round(ISO[d.format][1] / ISO[d.format][0], 1);
    case 'paper-font':
      return Math.round((d.size * ISO[d.to][1]) / ISO[d.from][1]);
    case 'plot-match': {
      // описание в тексте согласовано с планом
      const txt = textOf(t.context.html);
      const R = d.rects;
      const gateX = d.gate.x + d.gate.w / 2;
      const cx = (r) => r.x + r.w / 2;
      const leftObj = cx(R.garage) < gateX ? 'гараж' : 'сарай';
      assert(txt.indexOf('слева от ворот находится ' + leftObj) >= 0, 'левая сторона описана неверно');
      assert((cx(R.garage) - gateX) * (cx(R.shed) - gateX) < 0, 'гараж и сарай по одну сторону ворот');
      assert(txt.indexOf('Площадь сарая равна ' + R.shed.w * R.shed.h + ' ') >= 0, 'площадь сарая не совпадает');
      assert(txt.indexOf('отмечен на плане цифрой ' + d.num.garden) >= 0, 'номер огорода не совпадает');
      assert(R.house.y >= R.shed.y + R.shed.h, 'дом должен быть за сараем');
      const ys = (r) => [r.y, r.y + r.h];
      const [ha, hb] = ys(R.house);
      const [aa, ab] = ys(R.apples);
      assert(Math.max(ha, aa) < Math.min(hb, ab), 'яблони должны быть напротив дома');
      const nums = Object.values(d.num).sort().join('');
      assert(nums === '123456', 'номера объектов должны быть 1–6');
      return d.ask.map((k) => d.num[k]).join('');
    }
    case 'plot-tiles': {
      const set = new Set(d.cells.map((c) => c.join(',')));
      assert(set.size === d.cells.length, 'повторяющиеся плитки');
      return Math.ceil(set.size / d.pack);
    }
    case 'plot-area':
      return d.rect.w * d.rect.h;
    case 'plot-dist':
      return rectDist(d.a, d.b);
    case 'plot-heat': {
      const extra = d.gas.equip + d.gas.mount - (d.el.equip + d.el.mount);
      const save = d.el.power * d.el.price - d.gas.rate * d.gas.price;
      assert(extra > 0 && save > 0, 'газ должен быть дороже в установке и дешевле в работе');
      // часы, за которые экономия в точности покрывает разницу
      const hours = extra / save;
      assert(Math.abs(hours - Math.round(hours)) < 1e-6, 'экономия не покрывает разницу за целое число часов');
      return Math.round(hours);
    }
    default:
      throw new Error('нет решателя для ' + d.kind);
  }
}

// Внешние скобки охватывают всё выражение?
function wrapped(s) {
  if (s[0] !== '(' || s[s.length - 1] !== ')') return false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    if (depth === 0 && i < s.length - 1) return false;
  }
  return true;
}
// Неравенство (или система через &&) как функция x. На границе, где обе части
// совпадают с точностью до погрешности вычислений, решает нестрогость знака.
function tolerantPredicate(ineq) {
  const parts = ineq.split('&&').map((raw) => {
    let p = raw.trim();
    while (wrapped(p)) p = p.slice(1, -1).trim();
    const m = /^(.*?)(<=|>=|<|>)(.*)$/.exec(p);
    assert(m, 'не разобрано неравенство ' + p);
    const L = fn(['x'], m[1]);
    const R = fn(['x'], m[3]);
    const op = m[2];
    return (x) => {
      const l = L(x);
      const r = R(x);
      const diff = l - r;
      if (Math.abs(diff) <= 1e-9 * (1 + Math.abs(l) + Math.abs(r))) return op === '<=' || op === '>=';
      return op[0] === '<' ? diff < 0 : diff > 0;
    };
  });
  return (x) => parts.every((q) => q(x));
}

const SOLVERS = {
  1: practice,
  2: practice,
  3: practice,
  4: practice,
  5: practice,

  6(t) {
    return fn([], t.data.js)();
  },

  7(t) {
    const d = t.data;
    if (t.subtype === 'which-point') {
      const v = d.number.kind === 'sqrt' ? Math.sqrt(d.number.N) : d.number.p / d.number.q;
      const k = Math.floor(v);
      const inside = d.points.filter((p) => p.x > k && p.x < k + 1);
      assert(inside.length === 1, 'в промежутке должна быть одна точка');
      let best = 0;
      d.points.forEach((p, i) => {
        if (Math.abs(p.x - v) < Math.abs(d.points[best].x - v)) best = i;
      });
      return best + 1;
    }
    if (t.subtype === 'which-number') {
      const k = Math.floor(d.pointX);
      const vals = d.options.map((o) => (o.kind === 'sqrt' ? Math.sqrt(o.N) : o.p / o.q));
      const fits = vals.map((v, i) => (v > k && v < k + 1 ? i + 1 : 0)).filter(Boolean);
      assert(fits.length === 1, 'ровно одно число должно лежать в промежутке');
      assert(near(vals[fits[0] - 1], d.pointX), 'точка должна стоять на месте числа');
      return fits[0];
    }
    if (t.subtype === 'statements-a') {
      const fs = d.options.map((js) => fn(['a'], js));
      const samples = [];
      for (let i = 1; i < 100; i++) samples.push(d.interval[0] + i / 100);
      const truth = fs.map((f) => samples.map((a) => f(a)));
      truth.forEach((row) =>
        assert(
          row.every((x) => x === row[0]),
          'истинность должна быть постоянной',
        ),
      );
      const good = truth.map((row, i) => (row[0] ? i + 1 : 0)).filter(Boolean);
      assert(good.length === 1, 'верным должно быть ровно одно утверждение');
      assert(d.pointX > d.interval[0] && d.pointX < d.interval[1], 'точка вне промежутка');
      return good[0];
    }
    // statements-ab
    const fs = d.options.map((js) => fn(['a', 'b'], js));
    const pts = [];
    for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) pts.push([d.intervals.a[0] + i / 20, d.intervals.b[0] + j / 20]);
    const truth = fs.map((f) => pts.map(([a, b]) => f(a, b)));
    truth.forEach((row) =>
      assert(
        row.every((x) => x === row[0]),
        'истинность должна быть постоянной',
      ),
    );
    const good = truth.map((row, i) => (row[0] ? i + 1 : 0)).filter(Boolean);
    assert(good.length === 1, 'верным должно быть ровно одно утверждение');
    return good[0];
  },

  8(t) {
    return fn([], t.data.js)();
  },

  9(t) {
    const d = t.data;
    const L = fn(['x'], d.lhs);
    const R = fn(['x'], d.rhs);
    const g = (x) => L(x) - R(x);
    // g — многочлен не выше второй степени: восстановим коэффициенты по трём точкам
    const c = g(0);
    const a = (g(1) + g(-1)) / 2 - c;
    const b = (g(1) - g(-1)) / 2;
    assert(near(g(2), 4 * a + 2 * b + c) && near(g(-3), 9 * a - 3 * b + c), 'уравнение должно сводиться к квадратному');
    let roots;
    if (Math.abs(a) < 1e-9) {
      assert(Math.abs(b) > 1e-9, 'вырожденное линейное уравнение');
      roots = [-c / b];
    } else {
      const D = b * b - 4 * a * c;
      assert(D > 0, 'у квадратного уравнения должно быть два корня');
      roots = [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, q) => p - q);
    }
    if (d.pick === 'only') {
      assert(roots.length === 1, 'ожидался один корень');
      return roots[0];
    }
    assert(roots.length === 2, 'ожидалось два корня');
    return d.pick === 'max' ? roots[1] : roots[0];
  },

  10(t) {
    const d = t.data;
    const txt = textOf(t.html);
    if (d.kind === 'parts') {
      const total = d.parts.reduce((s, x) => s + x, 0);
      assert(total === d.total, 'сумма частей не равна общему числу');
      d.given.forEach((n) => assert(new RegExp('(^|[^\\d])' + n + '([^\\d]|$)').test(txt), 'в условии нет числа ' + n));
      const fav = d.fav.reduce((s, i) => s + d.parts[i], 0);
      return fav / total;
    }
    if (d.kind === 'complement') return 1 - d.p;
    if (d.kind === 'coins') {
      let fav = 0;
      for (let m = 0; m < 1 << d.n; m++) {
        let heads = 0;
        for (let i = 0; i < d.n; i++) if (m & (1 << i)) heads++;
        if (d.event === 'exactly' ? heads === d.k : d.event === 'atleast' ? heads >= 1 : heads === 0) fav++;
      }
      return fav / (1 << d.n);
    }
    if (d.kind === 'dice') {
      let fav = 0;
      let all = 0;
      const ok = (x) =>
        d.event === 'gt' ? x > d.t : d.event === 'lt' ? x < d.t : d.event === 'odd' ? x % 2 === 1 : d.event === 'even' ? x % 2 === 0 : x === d.t;
      if (d.n === 1) {
        for (let x = 1; x <= 6; x++) {
          all++;
          if (ok(x)) fav++;
        }
      } else {
        for (let x = 1; x <= 6; x++)
          for (let y = 1; y <= 6; y++) {
            all++;
            if (x + y === d.t) fav++;
          }
      }
      return round(fav / all, d.round);
    }
    throw new Error('нет решателя для ' + d.kind);
  },

  11(t) {
    const d = t.data;
    const letters = d.graphs.map((pts, gi) => {
      if (d.kind === 'formulas') {
        const fs = d.formulas.map((js) => fn(['x'], js));
        const match = fs.map((f, i) => (pts.every(([x, y]) => near(f(x), y)) ? i + 1 : 0)).filter(Boolean);
        assert(match.length === 1, 'графику ' + gi + ' должна соответствовать ровно одна формула');
        return match[0];
      }
      // знаки коэффициентов определяем по точкам графика
      const at = (x) => {
        const p = pts.reduce((best, q) => (Math.abs(q[0] - x) < Math.abs(best[0] - x) ? q : best));
        assert(Math.abs(p[0] - x) < 1e-6, 'нет точки графика при x = ' + x);
        return p[1];
      };
      const xs = pts.map((p) => p[0]);
      const x0 = Math.min(...xs);
      const x1 = Math.max(...xs);
      const mid = Math.round(((x0 + x1) / 2) * 20) / 20;
      let signs;
      if (d.kind === 'linear-signs') {
        const k = (pts[pts.length - 1][1] - pts[0][1]) / (pts[pts.length - 1][0] - pts[0][0]);
        signs = { k: Math.sign(k), b: Math.sign(at(0)) };
      } else {
        // вторая разность ≈ 2a·h²
        const h = 0.5;
        const a2 = at(mid - h) - 2 * at(mid) + at(mid + h);
        signs = { a: Math.sign(a2), c: Math.sign(at(0)) };
      }
      const match = d.items.map((it, i) => (Object.keys(it).every((key) => it[key] === signs[key]) ? i + 1 : 0)).filter(Boolean);
      assert(match.length === 1, 'графику должно соответствовать ровно одно утверждение');
      return match[0];
    });
    return letters.join('');
  },

  12(t) {
    const d = t.data;
    const names = Object.keys(d.values);
    const txt = textOf(t.html).replace(/\s/g, '');
    d.shown.forEach((s) => assert(txt.indexOf(s.replace(/\s/g, '')) >= 0, 'в условии нет значения ' + s));
    // ответ — значение, при котором соотношение выполняется; найдём его подстановкой
    const f = fn(names, d.check);
    const at = (v) => f(...names.map((k) => (k === d.target ? v : d.values[k])));
    const v = t.answer.value.toNumber();
    const scale = Math.max(1, ...names.map((k) => Math.abs(d.values[k])));
    assert(Math.abs(at(v)) <= 1e-6 * scale * scale, 'подстановка ответа не обращает соотношение в верное');
    // и при другом значении соотношение не выполняется
    assert(Math.abs(at(v + 1)) > 1e-9, 'ответ определён неоднозначно');
    return v;
  },

  13(t) {
    const d = t.data;
    if (d.kind === 'empty-all') {
      const fs = d.options.map((js) => fn(['x'], js));
      const xs = [];
      for (let x = -200; x <= 200; x += 0.05) xs.push(Math.round(x * 100) / 100);
      const kinds = fs.map((f) => {
        const n = xs.filter((x) => f(x)).length;
        return n === 0 ? 'none' : n === xs.length ? 'all' : 'some';
      });
      const good = kinds.map((k, i) => (k === d.ask ? i + 1 : 0)).filter(Boolean);
      assert(good.length === 1, 'ровно один вариант должен подходить');
      return good[0];
    }
    const f = tolerantPredicate(d.ineq);
    const sets = d.options.map((set) =>
      set.map((s) => ({
        lo: s.lo === '-inf' ? -Infinity : s.lo,
        hi: s.hi === 'inf' ? Infinity : s.hi,
        loIn: s.loIn,
        hiIn: s.hiIn,
      })),
    );
    const inSet = (set, x) => set.some((s) => (x > s.lo || (s.loIn && x === s.lo)) && (x < s.hi || (s.hiIn && x === s.hi)));
    // контрольные точки: концы всех промежутков, точки рядом с ними, середины и далёкие значения
    const ends = new Set([-1000, 1000, 0]);
    sets.forEach((set) =>
      set.forEach((s) => {
        [s.lo, s.hi].forEach((e) => {
          if (isFinite(e)) [e, e - 0.01, e + 0.01, e - 1, e + 1].forEach((x) => ends.add(Math.round(x * 1000) / 1000));
        });
      }),
    );
    const xs = Array.from(ends);
    const good = sets.map((set, i) => (xs.every((x) => inSet(set, x) === f(x)) ? i + 1 : 0)).filter(Boolean);
    assert(good.length === 1, 'ровно один рисунок должен изображать решение');
    return good[0];
  },

  14(t) {
    const d = t.data;
    if (d.kind === 'arith') {
      let term = d.a1;
      let sum = 0;
      for (let n = 1; n <= 1000; n++) {
        sum += term;
        if (d.ask === 'nth' && n === d.n) return term;
        if (d.ask === 'sum' && n === d.n) return sum;
        if (d.ask === 'reach' && term >= d.target) return n;
        term += d.d;
      }
      throw new Error('не дошли до ответа');
    }
    if (d.kind === 'geom') {
      let v = d.b1;
      for (let i = 0; i < d.periods; i++) v *= d.q;
      return v;
    }
    if (d.kind === 'snail') {
      // n дней: сумма прогрессии = (первый + последний) · n / 2
      for (let n = 1; n < 1000; n++) if (near((d.s * n) / 2, d.S)) return n;
      throw new Error('нет подходящего числа дней');
    }
    if (d.kind === 'drops') {
      const days = [];
      let dose = d.a;
      while (dose < d.X) {
        days.push(dose);
        dose += d.d;
      }
      assert(dose === d.X, 'доза должна ровно достигать максимума');
      days.push(d.X);
      for (let i = 0; i < d.extra; i++) days.push(d.X);
      dose = d.X - d.d;
      while (dose >= d.a) {
        days.push(dose);
        dose -= d.d;
      }
      const total = days.reduce((s, x) => s + x, 0);
      let bottles = 0;
      while (bottles * d.Y < total) bottles++;
      return bottles;
    }
    throw new Error('нет решателя для ' + d.kind);
  },
};

function geometry(t) {
  const d = t.data;
  d.givens.forEach((g) => assert(checkGiven(d.pts, g), 'не выполнено условие ' + JSON.stringify(g)));
  return measure(d.pts, d.ask);
}
[15, 16, 17, 18].forEach((n) => (SOLVERS[n] = geometry));

SOLVERS[19] = function (t) {
  const d = t.data;
  d.statements.forEach((s) => {
    if (!s.check) return;
    const c = s.check;
    let truth;
    if (c.kind === 'triangle-exists') {
      const [a, b, cc] = c.sides;
      truth = a + b > cc && a + cc > b && b + cc > a;
    } else if (c.kind === 'adjacent') truth = c.a + c.b === 180;
    else if (c.kind === 'third-angle') truth = c.a + c.b + c.c === 180;
    else if (c.kind === 'right-sides') {
      const s2 = c.sides.map((x) => x * x).sort((p, q) => p - q);
      truth = s2[0] + s2[1] === s2[2];
    } else if (c.kind === 'polygon-sum') truth = c.s === 180 * (c.n - 2);
    else if (c.kind === 'square-area') truth = c.s === c.a * c.a;
    else throw new Error('неизвестное утверждение ' + c.kind);
    assert(truth === s.truth, 'неверно определена истинность: ' + s.text);
  });
  return d.statements.map((s, i) => (s.truth === d.want ? i + 1 : '')).join('');
};

// ---------- вторая часть ----------

// Все корни g(x) = 0 на [lo; hi]: точки сетки с нулевым значением (касание)
// и смены знака, уточнённые делением пополам. В найденной точке значение
// должно быть близко к нулю (так отбрасываются полюса), а в округлённой —
// определено (так отбрасываются выколотые точки).
function numericRoots(g, lo, hi, n) {
  const N = n || 200; // шагов на единицу
  const out = [];
  const add = (r) => {
    if (out.every((q) => Math.abs(q - r) > 1e-6)) out.push(r);
  };
  const accept = (r) => {
    const rr = Math.round(r * 1e6) / 1e6;
    if (isFinite(g(rr)) && Math.abs(g(r)) < 1e-6) add(rr);
  };
  let px = null;
  let pv = null;
  for (let i = lo * N; i <= hi * N; i++) {
    const xx = i / N;
    const v = g(xx);
    if (!isFinite(v)) {
      px = null;
      continue;
    }
    if (Math.abs(v) < 1e-9) add(xx);
    else if (px !== null && Math.abs(pv) >= 1e-9 && Math.sign(v) !== Math.sign(pv)) {
      let a = px;
      let b = xx;
      for (let k = 0; k < 60; k++) {
        const m = (a + b) / 2;
        const mv = g(m);
        if (!isFinite(mv)) break;
        if (Math.sign(mv) === Math.sign(g(a))) a = m;
        else b = m;
      }
      accept((a + b) / 2);
    }
    px = xx;
    pv = v;
  }
  return out.sort((a, b) => a - b);
}

// Корень монотонной функции на (lo; hi) делением пополам.
function bisect(g, lo, hi) {
  let a = lo;
  let b = hi;
  const sa = Math.sign(g(a));
  assert(sa !== Math.sign(g(b)), 'нет смены знака');
  for (let k = 0; k < 200; k++) {
    const m = (a + b) / 2;
    if (Math.sign(g(m)) === sa) a = m;
    else b = m;
  }
  return (a + b) / 2;
}
function inText(t, nums) {
  const txt = textOf(t.html);
  nums.forEach((n) => assert(new RegExp('(^|[^\\d,])' + String(n).replace('.', ',') + '([^\\d,]|$)').test(txt), 'в условии нет числа ' + n));
}

SOLVERS[20] = function (t) {
  const d = t.data;
  if (d.kind === 'sets') return SOLVERS[13](t);
  if (d.kind === 'roots') {
    const roots = numericRoots(fn(['x'], d.f), -60, 60);
    assert(roots.length >= 1, 'у уравнения должны быть корни');
    return roots;
  }
  // система: пересечение параболы и прямой
  const P = fn(['x'], d.curve);
  const L = fn(['x'], d.line);
  const xs = numericRoots((x) => P(x) - L(x), -60, 60);
  assert(xs.length === 2, 'у системы должно быть два решения');
  return xs.map((x) => [x, L(x)]);
};

SOLVERS[21] = function (t) {
  const d = t.data;
  switch (d.kind) {
    case 'river':
      inText(t, [d.S, d.v, d.dt]);
      return bisect((u) => d.S / (d.v - u) - d.S / (d.v + u) - d.dt, 1e-9, d.v - 1e-9);
    case 'river-stop':
      inText(t, [d.S, d.v, d.stop, d.T]);
      return bisect((u) => d.S / (d.v + u) + d.S / (d.v - u) + d.stop - d.T, 1e-9, d.v - 1e-9);
    case 'pipes': {
      inText(t, [d.V, d.d, d.t]);
      const slow = bisect((x) => d.V / x - d.V / (x + d.d) - d.t, 1e-6, 1e5);
      return d.askSecond ? slow + d.d : slow;
    }
    case 'work': {
      inText(t, [d.T, d.p, d.q]);
      // производительности: r1·p = r2·q, r1 + r2 = 1/T
      const r1 = 1 / (d.T * (1 + d.p / d.q));
      const r2 = 1 / d.T - r1;
      assert(near(r1 * d.p, r2 * d.q), 'части работы не равны');
      return d.askSecond ? 1 / r2 : 1 / r1;
    }
    case 'mixture': {
      inText(t, [d.A, d.B, d.pr, d.q]);
      // A·x + B·y = pr·(A + B), x + y = 2q — по формулам Крамера
      const det = d.A - d.B;
      const x = (d.pr * (d.A + d.B) - 2 * d.q * d.B) / det;
      const y = (d.A * 2 * d.q - d.pr * (d.A + d.B)) / det;
      assert(x > 0 && x < 100 && y > 0 && y < 100, 'концентрации вне диапазона');
      return round(d.askSecond ? (d.B * y) / 100 : (d.A * x) / 100, 6);
    }
    case 'avg-half':
      inText(t, [d.v1, d.v2]);
      return 2 / (1 / d.v1 + 1 / d.v2);
    case 'avg-parts': {
      let dist = 0;
      let time = 0;
      d.parts.forEach((q) => {
        dist += q.v * q.t;
        time += q.t;
      });
      inText(
        t,
        d.parts.map((q) => q.v),
      );
      return dist / time;
    }
    case 'train':
      inText(t, [d.v, d.w, d.s]);
      return round((((d.same ? d.v - d.w : d.v + d.w) * 1000) / 3600) * d.s, 6);
  }
  throw new Error('неизвестный вид задачи ' + d.kind);
};

// Число общих точек графика с прямой y = m (line 'h') или y = kx (line 'k').
function commonPoints(f, line, p) {
  const g = line === 'h' ? (x) => f(x) - p : (x) => f(x) - p * x;
  return numericRoots(g, -40, 40).length;
}
SOLVERS[22] = function (t) {
  const d = t.data;
  const f = fn(['x'], d.fjs);
  const answer = t.answer.value.map((v) => v.toNumber());
  // каждое значение из ответа даёт нужное число общих точек…
  answer.forEach((p) => assert(commonPoints(f, d.line, p) === d.count, 'при параметре ' + p + ' число общих точек не ' + d.count));
  // …а соседние и другие значения — нет
  const others = [];
  answer.forEach((p) => others.push(p - 0.13, p + 0.11));
  for (let p = -30; p <= 30; p += 1.7) others.push(Math.round(p * 100) / 100);
  others
    .filter((p) => answer.every((a) => Math.abs(a - p) > 1e-6))
    .forEach((p) => assert(commonPoints(f, d.line, p) !== d.count, 'при параметре ' + p + ' тоже ' + d.count + ' общих точек'));
  return answer;
};

module.exports = { SOLVERS, numericRoots };
