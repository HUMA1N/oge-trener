/* Задание 12. Расчёты по формулам. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, fmtG, MINUS } = OGE;
  const F = (x) => Frac.of(x);
  const iv = (s) => '<i>' + s + '</i>';
  const sub = (s, i) => iv(s) + '<sub>' + i + '</sub>';
  // число в формуле: отрицательное — в скобках
  const p = (x) => (F(x).sign() < 0 ? '(' + fmtG(x) + ')' : fmtG(x));

  function nice(v, places, max) {
    return v.isFiniteDecimal() && v.decimalPlaces() <= places && Math.abs(v.toNumber()) <= (max || 1e6) && !v.isZero();
  }

  /*
   * Каждая формула описывает:
   *  intro   — текст условия с формулой;
   *  vars    — обозначения, единицы измерения;
   *  gen     — подбор согласованных «красивых» значений всех величин;
   *  check   — выражение на JS, равное нулю, если значения согласованы (для автотестов);
   *  solve   — для каждой неизвестной: выраженная формула и подстановка.
   */
  const FORMULAS = [
    {
      id: 'power',
      intro:
        'Мощность постоянного тока (в ваттах) вычисляется по формуле ' +
        h.m(iv('P') + ' = ' + iv('I') + '<sup>2</sup>' + iv('R')) +
        ', где ' +
        iv('I') +
        ' — сила тока (в амперах), ' +
        iv('R') +
        ' — сопротивление (в омах).',
      vars: { P: { s: iv('P'), unit: 'Вт', ans: 'в ваттах' }, I: { s: iv('I'), unit: 'А', ans: 'в амперах' }, R: { s: iv('R'), unit: 'Ом', ans: 'в омах' } },
      gen(rng) {
        const I = F(rng.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 12]));
        const R = F(rng.int(2, 60));
        const P = I.mul(I).mul(R);
        return nice(P, 2, 9000) ? { P, I, R } : null;
      },
      check: 'P - I**2*R',
      solve: {
        P: { f: iv('I') + '<sup>2</sup>' + iv('R'), sub: (v) => p(v.I) + '<sup>2</sup> · ' + p(v.R) },
        I: { f: h.sqrt(h.frac(iv('P'), iv('R'))), sub: (v) => h.sqrt(h.frac(fmtG(v.P), fmtG(v.R))) + ' = ' + h.sqrt(fmt(v.I.mul(v.I))) },
        R: {
          f: h.frac(iv('P'), iv('I') + '<sup>2</sup>'),
          sub: (v) => h.frac(fmtG(v.P), p(v.I) + '<sup>2</sup>') + ' = ' + h.frac(fmtG(v.P), fmt(v.I.mul(v.I))),
        },
      },
    },
    {
      id: 'centripetal',
      intro:
        'Центростремительное ускорение при движении по окружности (в м/с<sup>2</sup>) вычисляется по формуле ' +
        h.m(iv('a') + ' = ω<sup>2</sup>' + iv('R')) +
        ', где ω — угловая скорость (в с<sup>−1</sup>), ' +
        iv('R') +
        ' — радиус окружности (в метрах).',
      vars: {
        a: { s: iv('a'), unit: 'м/с<sup>2</sup>', ans: 'в м/с<sup>2</sup>' },
        w: { s: 'ω', unit: 'с<sup>−1</sup>', ans: 'в с<sup>−1</sup>' },
        R: { s: iv('R'), unit: 'м', ans: 'в метрах' },
      },
      gen(rng) {
        const w = F(rng.pick([0.5, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9]));
        const R = F(rng.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15]));
        const a = w.mul(w).mul(R);
        return nice(a, 2, 3000) ? { a, w, R } : null;
      },
      check: 'a - w**2*R',
      solve: {
        a: { f: 'ω<sup>2</sup>' + iv('R'), sub: (v) => p(v.w) + '<sup>2</sup> · ' + p(v.R) },
        w: { f: h.sqrt(h.frac(iv('a'), iv('R'))), sub: (v) => h.sqrt(h.frac(fmtG(v.a), fmtG(v.R))) + ' = ' + h.sqrt(fmt(v.w.mul(v.w))) },
        R: { f: h.frac(iv('a'), 'ω<sup>2</sup>'), sub: (v) => h.frac(fmtG(v.a), p(v.w) + '<sup>2</sup>') + ' = ' + h.frac(fmtG(v.a), fmt(v.w.mul(v.w))) },
      },
    },
    {
      id: 'kinetic',
      intro:
        'Кинетическая энергия тела (в джоулях) вычисляется по формуле ' +
        h.m(iv('E') + ' = ' + h.frac(iv('mv') + '<sup>2</sup>', '2')) +
        ', где ' +
        iv('m') +
        ' — масса тела (в килограммах), ' +
        iv('v') +
        ' — его скорость (в м/с).',
      vars: {
        E: { s: iv('E'), unit: 'Дж', ans: 'в джоулях' },
        m: { s: iv('m'), unit: 'кг', ans: 'в килограммах' },
        v: { s: iv('v'), unit: 'м/с', ans: 'в м/с' },
      },
      gen(rng) {
        const m = F(rng.pick([0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20]));
        const v = F(rng.int(2, 20));
        const E = m.mul(v).mul(v).div(2);
        return nice(E, 2, 10000) ? { E, m, v } : null;
      },
      check: 'E - m*v**2/2',
      solve: {
        E: { f: h.frac(iv('mv') + '<sup>2</sup>', '2'), sub: (v) => h.frac(fmt(v.m) + ' · ' + fmt(v.v) + '<sup>2</sup>', '2') },
        m: {
          f: h.frac('2' + iv('E'), iv('v') + '<sup>2</sup>'),
          sub: (v) => h.frac('2 · ' + fmtG(v.E), fmt(v.v) + '<sup>2</sup>') + ' = ' + h.frac(fmtG(v.E.mul(2)), fmt(v.v.mul(v.v))),
        },
        v: { f: h.sqrt(h.frac('2' + iv('E'), iv('m'))), sub: (v) => h.sqrt(h.frac('2 · ' + fmtG(v.E), fmt(v.m))) + ' = ' + h.sqrt(fmt(v.v.mul(v.v))) },
      },
    },
    {
      id: 'fahrenheit',
      intro:
        'Чтобы перевести значение температуры по шкале Цельсия в шкалу Фаренгейта, пользуются формулой ' +
        h.m(sub('t', 'F') + ' = 1,8' + sub('t', 'C') + ' + 32') +
        ', где ' +
        sub('t', 'C') +
        ' — температура в градусах Цельсия, ' +
        sub('t', 'F') +
        ' — температура в градусах Фаренгейта.',
      vars: { tF: { s: sub('t', 'F'), unit: '°F' }, tC: { s: sub('t', 'C'), unit: '°C' } },
      gen(rng) {
        const tC = F(rng.int(-50, 120));
        const tF = tC.mul(F('1.8')).add(32);
        return tF.isZero() ? null : { tF, tC };
      },
      check: 'tF - (1.8*tC + 32)',
      question(target, v) {
        return target === 'tC'
          ? 'Скольким градусам по шкале Цельсия соответствует ' + fmt(v.tF) + ' ' + degF(v.tF) + ' по шкале Фаренгейта?'
          : 'Скольким градусам по шкале Фаренгейта соответствует ' + fmt(v.tC) + ' ' + degC(v.tC) + ' по шкале Цельсия?';
      },
      solve: {
        tF: { f: '1,8' + sub('t', 'C') + ' + 32', sub: (v) => '1,8 · ' + p(v.tC) + ' + 32' },
        tC: {
          f: h.frac(sub('t', 'F') + ' ' + MINUS + ' 32', '1,8'),
          sub: (v) => h.frac(fmt(v.tF) + ' ' + MINUS + ' 32', '1,8') + ' = ' + h.frac(fmt(v.tF.sub(32)), '1,8'),
        },
      },
    },
    {
      id: 'taxi',
      setup(rng) {
        return { a: rng.pick([150, 180, 200, 250, 300]), b: rng.pick([9, 10, 11, 12, 14, 15]) };
      },
      intro: (c) =>
        'Стоимость поездки на такси (в рублях) рассчитывается по формуле ' +
        h.m(iv('C') + ' = ' + c.a + ' + ' + c.b + '(' + iv('t') + ' ' + MINUS + ' 5)') +
        ', где ' +
        iv('t') +
        ' — длительность поездки в минутах (' +
        iv('t') +
        ' &gt; 5).',
      vars: { C: { s: iv('C'), unit: 'руб.' }, t: { s: iv('t'), unit: 'мин' } },
      gen(rng, c) {
        const t = F(rng.int(6, 60));
        return { C: t.sub(5).mul(c.b).add(c.a), t };
      },
      check: (c) => 'C - (' + c.a + ' + ' + c.b + '*(t - 5))',
      question(target, v) {
        return target === 'C'
          ? 'Пользуясь этой формулой, рассчитайте стоимость ' + fmt(v.t) + '-минутной поездки. Ответ дайте в рублях.'
          : 'Поездка обошлась в ' + fmtG(v.C) + ' ' + OGE.plural(v.C.n, 'рубль', 'рубля', 'рублей') + '. Сколько минут она длилась?';
      },
      solve: {
        C: { f: null, sub: (v, c) => c.a + ' + ' + c.b + ' · (' + fmt(v.t) + ' ' + MINUS + ' 5) = ' + c.a + ' + ' + c.b + ' · ' + fmt(v.t.sub(5)) },
        t: {
          f: (c) => h.frac(iv('C') + ' ' + MINUS + ' ' + c.a, c.b) + ' + 5',
          sub: (v, c) => h.frac(fmtG(v.C) + ' ' + MINUS + ' ' + c.a, c.b) + ' + 5 = ' + fmt(v.t.sub(5)) + ' + 5',
        },
      },
    },
    {
      id: 'diagonals',
      intro:
        'Площадь четырёхугольника можно вычислить по формуле ' +
        h.m(iv('S') + ' = ' + h.frac(sub('d', 1) + sub('d', 2) + ' sin α', '2')) +
        ', где ' +
        sub('d', 1) +
        ' и ' +
        sub('d', 2) +
        ' — длины диагоналей четырёхугольника, α — угол между диагоналями.',
      vars: { S: { s: iv('S') }, d1: { s: sub('d', 1) }, d2: { s: sub('d', 2) }, sin: { s: 'sin α', frac: true } },
      gen(rng) {
        const sin = rng.pick([
          new Frac(1, 2),
          new Frac(1, 3),
          new Frac(2, 3),
          new Frac(3, 5),
          new Frac(4, 5),
          new Frac(2, 5),
          new Frac(3, 4),
          new Frac(5, 6),
          new Frac(2, 7),
          new Frac(5, 8),
        ]);
        const d1 = F(rng.int(2, 20));
        const d2 = F(rng.int(2, 20));
        const S = d1.mul(d2).mul(sin).div(2);
        return nice(S, 1, 500) && !d1.eq(d2) ? { S, d1, d2, sin } : null;
      },
      fixed: ['sin'],
      check: 'S - d1*d2*sin/2',
      solve: {
        S: { f: null, sub: (v) => h.frac(fmt(v.d1) + ' · ' + fmt(v.d2) + ' · ' + h.fracNum(v.sin), '2') },
        d1: { f: h.frac('2' + iv('S'), sub('d', 2) + ' sin α'), sub: (v) => h.frac('2 · ' + fmt(v.S), fmt(v.d2) + ' · ' + h.fracNum(v.sin)) },
        d2: { f: h.frac('2' + iv('S'), sub('d', 1) + ' sin α'), sub: (v) => h.frac('2 · ' + fmt(v.S), fmt(v.d1) + ' · ' + h.fracNum(v.sin)) },
      },
    },
    {
      id: 'gas',
      intro:
        'Закон Менделеева — Клапейрона можно записать в виде ' +
        h.m(iv('PV') + ' = ν' + iv('RT')) +
        ', где ' +
        iv('P') +
        ' — давление (в паскалях), ' +
        iv('V') +
        ' — объём (в м<sup>3</sup>), ν — количество вещества (в молях), ' +
        iv('T') +
        ' — температура (в градусах Кельвина), а ' +
        iv('R') +
        ' — универсальная газовая постоянная, равная 8,31 Дж/(К·моль).',
      vars: {
        P: { s: iv('P'), unit: 'Па', ans: 'в паскалях' },
        V: { s: iv('V'), unit: 'м<sup>3</sup>', ans: 'в м<sup>3</sup>' },
        n: { s: 'ν', unit: 'моль', ans: 'в молях' },
        T: { s: iv('T'), unit: 'К', ans: 'в градусах Кельвина' },
      },
      gen(rng) {
        const n = F(rng.pick([rng.int(2, 60), rng.int(10, 600) / 10]));
        const T = F(rng.int(25, 70) * 10);
        const V = F(rng.pick([1, 2, 4, 5, 8, 10, 0.5, 2.5]));
        const P = n.mul(F('8.31')).mul(T).div(V);
        return nice(P, 2) ? { P, V, n, T } : null;
      },
      fixed: [],
      targets: ['T', 'n', 'P'],
      check: 'P*V - n*8.31*T',
      solve: {
        P: { f: h.frac('ν' + iv('RT'), iv('V')), sub: (v) => h.frac(fmt(v.n) + ' · 8,31 · ' + fmt(v.T), fmt(v.V)) },
        T: {
          f: h.frac(iv('PV'), 'ν' + iv('R')),
          sub: (v) => h.frac(fmtG(v.P) + ' · ' + fmt(v.V), fmt(v.n) + ' · 8,31') + ' = ' + h.frac(fmtG(v.P.mul(v.V)), fmtG(v.n.mul(F('8.31')))),
        },
        n: {
          f: h.frac(iv('PV'), iv('RT')),
          sub: (v) => h.frac(fmtG(v.P) + ' · ' + fmt(v.V), '8,31 · ' + fmt(v.T)) + ' = ' + h.frac(fmtG(v.P.mul(v.V)), fmtG(F('8.31').mul(v.T))),
        },
      },
    },
    {
      id: 'polygon',
      intro:
        'Сумму углов выпуклого многоугольника вычисляют по формуле ' +
        h.m('Σ = (' + iv('n') + ' ' + MINUS + ' 2) · 180°') +
        ', где ' +
        iv('n') +
        ' — количество его углов.',
      vars: { S: { s: 'Σ', unit: '°' }, n: { s: iv('n') } },
      gen(rng) {
        const n = F(rng.int(5, 24));
        return { S: n.sub(2).mul(180), n };
      },
      check: 'S - (n - 2)*180',
      question(target, v) {
        return target === 'n'
          ? 'Пользуясь этой формулой, найдите количество углов ' + iv('n') + ', если сумма углов равна ' + fmtG(v.S) + '°.'
          : 'Пользуясь этой формулой, найдите сумму углов выпуклого ' + fmt(v.n) + '-угольника. Ответ дайте в градусах.';
      },
      solve: {
        S: { f: null, sub: (v) => '(' + fmt(v.n) + ' ' + MINUS + ' 2) · 180 = ' + fmt(v.n.sub(2)) + ' · 180' },
        n: { f: h.frac('Σ', '180') + ' + 2', sub: (v) => h.frac(fmtG(v.S), '180') + ' + 2 = ' + fmt(v.n.sub(2)) + ' + 2' },
      },
    },
    {
      id: 'trapezoid',
      intro:
        'Площадь трапеции вычисляется по формуле ' +
        h.m(iv('S') + ' = ' + h.frac(iv('a') + ' + ' + iv('b'), '2') + ' · ' + iv('h')) +
        ', где ' +
        iv('a') +
        ' и ' +
        iv('b') +
        ' — основания трапеции, ' +
        iv('h') +
        ' — её высота.',
      vars: { S: { s: iv('S') }, a: { s: iv('a') }, b: { s: iv('b') }, h: { s: iv('h') } },
      gen(rng) {
        const a = F(rng.int(2, 20));
        const b = F(rng.int(2, 20));
        const hh = F(rng.int(2, 15));
        const S = a.add(b).mul(hh).div(2);
        return !a.eq(b) && nice(S, 1) ? { S, a, b, h: hh } : null;
      },
      targets: ['h', 'a', 'S'],
      check: 'S - (a + b)/2*h',
      solve: {
        S: { f: null, sub: (v) => h.frac(fmt(v.a) + ' + ' + fmt(v.b), '2') + ' · ' + fmt(v.h) },
        h: {
          f: h.frac('2' + iv('S'), iv('a') + ' + ' + iv('b')),
          sub: (v) => h.frac('2 · ' + fmt(v.S), fmt(v.a) + ' + ' + fmt(v.b)) + ' = ' + h.frac(fmt(v.S.mul(2)), fmt(v.a.add(v.b))),
        },
        a: {
          f: h.frac('2' + iv('S'), iv('h')) + ' ' + MINUS + ' ' + iv('b'),
          sub: (v) => h.frac('2 · ' + fmt(v.S), fmt(v.h)) + ' ' + MINUS + ' ' + fmt(v.b) + ' = ' + fmt(v.S.mul(2).div(v.h)) + ' ' + MINUS + ' ' + fmt(v.b),
        },
      },
    },
    {
      id: 'ohm',
      intro:
        'Закон Ома для полной цепи можно записать в виде ' +
        h.m(iv('I') + ' = ' + h.frac('ε', iv('R') + ' + ' + iv('r'))) +
        ', где ε — ЭДС источника (в вольтах), ' +
        iv('r') +
        ' — его внутреннее сопротивление (в омах), ' +
        iv('R') +
        ' — сопротивление цепи (в омах), ' +
        iv('I') +
        ' — сила тока (в амперах).',
      vars: {
        I: { s: iv('I'), unit: 'А', ans: 'в амперах' },
        e: { s: 'ε', unit: 'В', ans: 'в вольтах' },
        R: { s: iv('R'), unit: 'Ом', ans: 'в омах' },
        r: { s: iv('r'), unit: 'Ом', ans: 'в омах' },
      },
      gen(rng) {
        const R = F(rng.int(2, 40));
        const r = F(rng.pick([0.5, 1, 1.5, 2, 3, 4]));
        const I = F(rng.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]));
        const e = I.mul(R.add(r));
        return nice(e, 2, 500) ? { I, e, R, r } : null;
      },
      targets: ['R', 'e', 'I'],
      check: 'I - e/(R + r)',
      solve: {
        I: { f: null, sub: (v) => h.frac(fmt(v.e), fmt(v.R) + ' + ' + fmt(v.r)) + ' = ' + h.frac(fmt(v.e), fmt(v.R.add(v.r))) },
        e: { f: iv('I') + '(' + iv('R') + ' + ' + iv('r') + ')', sub: (v) => fmt(v.I) + ' · (' + fmt(v.R) + ' + ' + fmt(v.r) + ')' },
        R: {
          f: h.frac('ε', iv('I')) + ' ' + MINUS + ' ' + iv('r'),
          sub: (v) => h.frac(fmt(v.e), fmt(v.I)) + ' ' + MINUS + ' ' + fmt(v.r) + ' = ' + fmt(v.e.div(v.I)) + ' ' + MINUS + ' ' + fmt(v.r),
        },
      },
    },
  ];

  function degF(x) {
    return OGE.plural(F(x).isInt() ? Math.abs(F(x).n) : 2, 'градус', 'градуса', 'градусов');
  }
  const degC = degF;

  function listJoin(arr) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' и ' + arr[arr.length - 1];
  }

  OGE.registerTask(
    12,
    function (rng, opts) {
      const spec = opts.subtype ? FORMULAS.find((f) => f.id === opts.subtype) : rng.pick(FORMULAS);
      const c = spec.setup ? spec.setup(rng) : {};
      const vals = OGE.retry(rng, () => spec.gen(rng, c));
      const names = Object.keys(spec.vars);
      const candidates = spec.targets || Object.keys(spec.solve);
      const target = rng.pick(candidates);
      const intro = typeof spec.intro === 'function' ? spec.intro(c) : spec.intro;
      const V = spec.vars;
      const valHtml = (k) => (V[k].frac ? h.fracNum(vals[k]) : fmtG(vals[k])) + (V[k].unit ? (V[k].unit === '°' ? '°' : ' ' + V[k].unit) : '');
      let question;
      if (spec.question) question = spec.question(target, vals);
      else {
        const given = names.filter((k) => k !== target).map((k) => h.m(V[k].s + ' = ' + valHtml(k)));
        question =
          'Пользуясь этой формулой, найдите ' + V[target].s + ', если ' + listJoin(given) + '.' + (V[target].ans ? ' Ответ дайте ' + V[target].ans + '.' : '');
      }
      const sv = spec.solve[target];
      const fText = typeof sv.f === 'function' ? sv.f(c) : sv.f;
      const answer = vals[target];
      const steps = [];
      if (fText) steps.push('<p>Выразим ' + V[target].s + ' из формулы:</p>' + h.block(V[target].s + ' = ' + fText));
      steps.push('<p>Подставим известные значения:</p>' + h.block(V[target].s + ' = ' + sv.sub(vals, c) + ' = ' + fmt(answer)));
      steps.push(OGE.answerLine(answer));
      const values = {};
      names.forEach((k) => (values[k] = vals[k].toNumber()));
      return {
        subtype: spec.id,
        html: '<p>' + intro + ' ' + question + '</p>',
        answer: { type: 'number', value: answer },
        steps,
        data: {
          check: typeof spec.check === 'function' ? spec.check(c) : spec.check,
          values,
          target,
          shown: names.filter((k) => k !== target && !V[k].frac).map((k) => fmt(vals[k])),
        },
      };
    },
    FORMULAS.map((f) => f.id),
  );

  OGE.FORMULAS12 = FORMULAS.map((f) => f.id);
})(globalThis);
