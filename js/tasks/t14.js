/* Задание 14. Арифметическая и геометрическая прогрессии в текстовых задачах. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, plural, MINUS } = OGE;
  const an = (n) => '<i>a</i><sub>' + n + '</sub>';
  const Sn = (n) => '<i>S</i><sub>' + n + '</sub>';

  function nthSteps(a1, d, n) {
    const v = a1 + d * (n - 1);
    return [
      '<p>Это арифметическая прогрессия: ' + h.m(an(1) + ' = ' + fmt(a1)) + ', разность ' + h.m('<i>d</i> = ' + fmt(d)) + '.</p>',
      h.block(an('<i>n</i>') + ' = ' + an(1) + ' + <i>d</i>(<i>n</i> ' + MINUS + ' 1)'),
      h.block(an(n) + ' = ' + fmt(a1) + ' + ' + fmt(d) + ' · ' + (n - 1) + ' = ' + fmt(v)),
    ];
  }
  function sumSteps(a1, d, n) {
    const last = a1 + d * (n - 1);
    const s = ((a1 + last) * n) / 2;
    return [
      '<p>Это арифметическая прогрессия: ' + h.m(an(1) + ' = ' + fmt(a1)) + ', ' + h.m('<i>d</i> = ' + fmt(d)) + '. Найдём ' + n + '-й член и сумму:</p>',
      h.block(an(n) + ' = ' + fmt(a1) + ' + ' + fmt(d) + ' · ' + (n - 1) + ' = ' + fmt(last)),
      h.block(Sn(n) + ' = ' + h.frac(an(1) + ' + ' + an(n), '2') + ' · <i>n</i> = ' + h.frac(fmt(a1) + ' + ' + fmt(last), '2') + ' · ' + n + ' = ' + fmt(s)),
    ];
  }

  const builders = {
    // места в рядах кинозала
    cinema(rng) {
      const a1 = rng.int(12, 30);
      const d = rng.int(1, 3);
      const n = rng.int(6, 25);
      const askSum = rng.chance(0.4);
      if (askSum) {
        const s = ((2 * a1 + d * (n - 1)) * n) / 2;
        return {
          html:
            '<p>В первом ряду кинозала ' +
            a1 +
            ' ' +
            plural(a1, 'место', 'места', 'мест') +
            ', а в каждом следующем ряду на ' +
            d +
            ' ' +
            plural(d, 'место', 'места', 'мест') +
            ' больше, чем в предыдущем. Сколько всего мест в первых ' +
            n +
            ' рядах кинозала?</p>',
          value: s,
          steps: sumSteps(a1, d, n),
          data: { kind: 'arith', a1, d, n, ask: 'sum' },
        };
      }
      return {
        html:
          '<p>В первом ряду кинозала ' +
          a1 +
          ' ' +
          plural(a1, 'место', 'места', 'мест') +
          ', а в каждом следующем ряду на ' +
          d +
          ' ' +
          plural(d, 'место', 'места', 'мест') +
          ' больше, чем в предыдущем. Сколько мест в ряду с номером ' +
          n +
          '?</p>',
        value: a1 + d * (n - 1),
        steps: nthSteps(a1, d, n),
        data: { kind: 'arith', a1, d, n, ask: 'nth' },
      };
    },
    // тренировки/чтение: n-й день, сумма, день достижения цели
    training(rng) {
      const person = rng.pick([
        { name: 'Ваня', he: 'он', f: 0 },
        { name: 'Оля', he: 'она', f: 1 },
        { name: 'Дима', he: 'он', f: 0 },
        { name: 'Маша', he: 'она', f: 1 },
      ]);
      const unit = rng.pick([
        { forms: ['отжимание', 'отжимания', 'отжиманий'], past: ['сделал', 'сделала'], fut: 'сделает', a: [5, 20], d: [1, 4] },
        { forms: ['приседание', 'приседания', 'приседаний'], past: ['сделал', 'сделала'], fut: 'сделает', a: [10, 30], d: [2, 5] },
        { forms: ['страницу', 'страницы', 'страниц'], past: ['прочитал', 'прочитала'], fut: 'прочитает', a: [8, 25], d: [2, 5] },
      ]);
      const pl = (n) => plural(n, unit.forms[0], unit.forms[1], unit.forms[2]);
      const a1 = rng.int(unit.a[0], unit.a[1]);
      const d = rng.int(unit.d[0], unit.d[1]);
      const kind = rng.pick(['nth', 'sum', 'reach']);
      const intro =
        '<p>' +
        person.name +
        ' в первый день ' +
        unit.past[person.f] +
        ' ' +
        a1 +
        ' ' +
        pl(a1) +
        ', а в каждый следующий день — на ' +
        d +
        ' больше, чем в предыдущий.';
      if (kind === 'nth') {
        const n = rng.int(8, 30);
        return {
          html: intro + ' Сколько ' + unit.forms[2] + ' ' + person.he + ' ' + unit.fut + ' в ' + n + '-й день?</p>',
          value: a1 + d * (n - 1),
          steps: nthSteps(a1, d, n),
          data: { kind: 'arith', a1, d, n, ask: 'nth' },
        };
      }
      if (kind === 'sum') {
        const n = rng.int(5, 15);
        return {
          html:
            intro + ' Сколько всего ' + unit.forms[2] + ' ' + person.he + ' ' + unit.fut + ' за первые ' + n + ' ' + plural(n, 'день', 'дня', 'дней') + '?</p>',
          value: ((2 * a1 + d * (n - 1)) * n) / 2,
          steps: sumSteps(a1, d, n),
          data: { kind: 'arith', a1, d, n, ask: 'sum' },
        };
      }
      // в какой день впервые будет не меньше target
      const n = rng.int(6, 25);
      const target = a1 + d * (n - 1) - rng.int(0, d - 1);
      const steps = [
        '<p>Количество в <i>n</i>-й день: ' +
          h.m(an('<i>n</i>') + ' = ' + a1 + ' + ' + d + '(<i>n</i> ' + MINUS + ' 1)') +
          '. Нужно ' +
          h.m(an('<i>n</i>') + ' ≥ ' + target) +
          ':</p>',
        h.block(
          a1 +
            ' + ' +
            d +
            '(<i>n</i> ' +
            MINUS +
            ' 1) ≥ ' +
            target +
            ' &nbsp;⇔&nbsp; <i>n</i> ' +
            MINUS +
            ' 1 ≥ ' +
            h.frac(target - a1, d) +
            ' &nbsp;⇔&nbsp; <i>n</i> ≥ ' +
            fmtMaybe(new Frac(target - a1, d).add(1)),
        ),
        '<p>Наименьшее целое такое <i>n</i> — это ' +
          n +
          '. Проверка: ' +
          h.m(an(n - 1) + ' = ' + (a1 + d * (n - 2))) +
          ' &lt; ' +
          target +
          ', ' +
          h.m(an(n) + ' = ' + (a1 + d * (n - 1))) +
          ' ≥ ' +
          target +
          '.</p>',
      ];
      return {
        html: intro + ' В какой по счёту день ' + person.he + ' впервые ' + unit.fut + ' не меньше ' + target + ' ' + pl(target) + '?</p>',
        value: n,
        steps,
        data: { kind: 'arith', a1, d, target, ask: 'reach' },
      };
    },
    // камень в ущелье — сумма
    stone(rng) {
      const a1 = rng.int(3, 12);
      const d = rng.int(5, 10);
      const n = rng.int(4, 9);
      return {
        html:
          '<p>Камень бросают в глубокое ущелье. При этом в первую секунду он пролетает ' +
          a1 +
          ' ' +
          plural(a1, 'метр', 'метра', 'метров') +
          ', а в каждую следующую секунду на ' +
          d +
          ' ' +
          plural(d, 'метр', 'метра', 'метров') +
          ' больше, чем в предыдущую, до тех пор, пока не достигнет дна ущелья. ' +
          'Сколько метров пролетит камень за первые ' +
          n +
          ' ' +
          plural(n, 'секунду', 'секунды', 'секунд') +
          '?</p>',
        value: ((2 * a1 + d * (n - 1)) * n) / 2,
        steps: sumSteps(a1, d, n),
        data: { kind: 'arith', a1, d, n, ask: 'sum' },
      };
    },
    // улитка: n = 2S / (a1 + an)
    snail(rng) {
      return OGE.retry(rng, () => {
        const s = rng.int(5, 20);
        const n = rng.int(5, 30);
        if ((s * n) % 2) return null;
        const S = (s * n) / 2;
        return {
          html:
            '<p>Улитка ползёт от одного дерева до другого. Каждый день она проползает на одно и то же расстояние больше, чем в предыдущий день. ' +
            'Известно, что за первый и последний дни улитка проползла в общей сложности ' +
            s +
            ' ' +
            plural(s, 'метр', 'метра', 'метров') +
            '. Определите, сколько дней улитка потратила на весь путь, если расстояние между деревьями равно ' +
            S +
            ' ' +
            plural(S, 'метру', 'метрам', 'метрам') +
            '.</p>',
          value: n,
          steps: [
            '<p>Расстояния за каждый день образуют арифметическую прогрессию, а весь путь — её сумма:</p>',
            h.block(Sn('<i>n</i>') + ' = ' + h.frac(an(1) + ' + ' + an('<i>n</i>'), '2') + ' · <i>n</i>'),
            '<p>По условию ' + h.m(an(1) + ' + ' + an('<i>n</i>') + ' = ' + s) + ', ' + h.m(Sn('<i>n</i>') + ' = ' + S) + ':</p>',
            h.block(S + ' = ' + h.frac(s, 2) + ' · <i>n</i> &nbsp;⇒&nbsp; <i>n</i> = ' + h.frac(2 + ' · ' + S, s) + ' = ' + n),
          ],
          data: { kind: 'snail', s, S },
        };
      });
    },
    // распад изотопа: масса уменьшается вдвое
    isotope(rng) {
      const T = rng.pick([2, 3, 4, 5, 6, 8, 10, 15]);
      const k = rng.int(2, 6);
      const [m0, m] = OGE.retry(rng, () => {
        const start = rng.int(1, 30) * Math.pow(2, rng.int(0, k));
        const end = new Frac(start, Math.pow(2, k));
        return end.decimalPlaces() <= 2 ? [start, end] : null;
      });
      return {
        html:
          '<p>В ходе распада радиоактивного изотопа его масса уменьшается вдвое каждые ' +
          T +
          ' ' +
          plural(T, 'минуту', 'минуты', 'минут') +
          '. В начальный момент масса изотопа составляла ' +
          m0 +
          ' мг. Найдите массу изотопа через ' +
          T * k +
          ' ' +
          plural(T * k, 'минуту', 'минуты', 'минут') +
          '. Ответ дайте в миллиграммах.</p>',
        value: m,
        steps: [
          '<p>За ' +
            T * k +
            ' мин масса уменьшится вдвое ' +
            T * k +
            ' : ' +
            T +
            ' = ' +
            k +
            ' ' +
            plural(k, 'раз', 'раза', 'раз') +
            '. Массы образуют геометрическую прогрессию со знаменателем ' +
            h.m('<i>q</i> = ' + h.frac(1, 2)) +
            ':</p>',
          h.block(m0 + ' · ' + '(' + h.frac(1, 2) + ')<sup>' + k + '</sup> = ' + h.frac(m0, Math.pow(2, k)) + ' = ' + fmt(m)),
        ],
        data: { kind: 'geom', b1: m0, q: 0.5, periods: k },
      };
    },
    // размножение бактерий
    bacteria(rng) {
      const q = rng.pick([2, 2, 3]);
      const T = rng.pick([10, 15, 20, 30]);
      const k = rng.int(2, q === 2 ? 7 : 5);
      const b1 = rng.int(2, 50) * 10;
      const v = b1 * Math.pow(q, k);
      return {
        html:
          '<p>Колония бактерий увеличивается в ' +
          (q === 2 ? 'два' : 'три') +
          ' раза каждые ' +
          T +
          ' минут. В начальный момент в колонии было ' +
          b1 +
          ' бактерий. Сколько бактерий будет в колонии через ' +
          T * k +
          ' минут, если ни одна бактерия не погибнет?</p>',
        value: v,
        steps: [
          '<p>Число увеличений: ' + T * k + ' : ' + T + ' = ' + k + '. Получаем геометрическую прогрессию со знаменателем ' + q + ':</p>',
          h.block(b1 + ' · ' + q + '<sup>' + k + '</sup> = ' + b1 + ' · ' + Math.pow(q, k) + ' = ' + v),
        ],
        data: { kind: 'geom', b1, q, periods: k },
      };
    },
    // курс лекарства по схеме
    drops(rng) {
      return OGE.retry(rng, () => {
        const a = rng.pick([5, 10, 15, 20]);
        const d = rng.pick([2, 3, 5]);
        const k = rng.int(3, 8); // число увеличений
        const X = a + d * k;
        const Y = rng.pick([100, 150, 200, 250]);
        const inc = ((a + X) * (k + 1)) / 2;
        const total = inc + 3 * X + (inc - X);
        const bottles = Math.ceil(total / Y);
        if (total % Y === 0) return null;
        return {
          html:
            '<p>Врач прописал пациенту принимать лекарство по такой схеме: в первый день ' +
            a +
            ' ' +
            plural(a, 'капля', 'капли', 'капель') +
            ', а в каждый следующий день — на ' +
            d +
            ' ' +
            plural(d, 'каплю', 'капли', 'капель') +
            ' больше, чем в предыдущий, пока дневная доза не достигнет ' +
            X +
            ' капель. Такую дозу пациент принимает ещё 3 дня, а затем ежедневно уменьшает приём на ' +
            d +
            ' ' +
            plural(d, 'каплю', 'капли', 'капель') +
            ', пока доза снова не станет равной ' +
            a +
            ' ' +
            plural(a, 'капле', 'каплям', 'каплям') +
            ' (в этот день курс заканчивается). ' +
            'Сколько пузырьков лекарства нужно купить на весь курс, если в каждом пузырьке ' +
            Y +
            ' капель?</p>',
          value: bottles,
          steps: [
            '<p>Пока доза растёт, это арифметическая прогрессия ' +
              a +
              ', ' +
              (a + d) +
              ', …, ' +
              X +
              ' из ' +
              (k + 1) +
              ' ' +
              plural(k + 1, 'члена', 'членов', 'членов') +
              ':</p>',
            h.block(h.frac(a + ' + ' + X, 2) + ' · ' + (k + 1) + ' = ' + inc + ' капель.'),
            '<p>Ещё 3 дня по ' +
              X +
              ' капель: ' +
              3 * X +
              '. Затем доза убывает: ' +
              (X - d) +
              ', …, ' +
              a +
              ' — это та же прогрессия без члена ' +
              X +
              ': ' +
              inc +
              ' − ' +
              X +
              ' = ' +
              (inc - X) +
              '.</p>',
            h.block('Всего: ' + inc + ' + ' + 3 * X + ' + ' + (inc - X) + ' = ' + total + ' капель.'),
            '<p>' +
              total +
              ' : ' +
              Y +
              ' = ' +
              fmt(new Frac(total, Y)) +
              ' — значит, нужно ' +
              bottles +
              ' ' +
              plural(bottles, 'пузырёк', 'пузырька', 'пузырьков') +
              ' (округляем вверх: неполного пузырька не хватит).</p>',
          ],
          data: { kind: 'drops', a, d, X, extra: 3, Y },
        };
      });
    },
  };

  function fmtMaybe(f) {
    return f.isFiniteDecimal() ? fmt(f) : h.fracNum(f);
  }

  const WEIGHTS = { cinema: 2, training: 3, stone: 1, snail: 1, isotope: 1, bacteria: 1, drops: 1 };

  OGE.registerTask(
    14,
    function (rng, opts) {
      const names = Object.keys(WEIGHTS);
      const subtype =
        opts.subtype ||
        rng.weighted(
          names,
          names.map((n) => WEIGHTS[n]),
        );
      const b = builders[subtype](rng);
      return {
        subtype,
        html: b.html,
        answer: { type: 'number', value: b.value },
        steps: b.steps.concat([OGE.answerLine(b.value)]),
        data: b.data,
      };
    },
    Object.keys(WEIGHTS),
  );
})(globalThis);
