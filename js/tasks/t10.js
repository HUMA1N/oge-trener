/* Задание 10. Теория вероятностей. */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, plural } = OGE;

  // Знаменатели, при которых вероятность — конечная десятичная дробь.
  const GOOD_TOTALS = [10, 16, 20, 25, 40, 50, 80, 100];

  function classic(fav, total, favText) {
    const p = new Frac(fav, total);
    return [
      '<p>Вероятность события равна отношению числа благоприятных исходов к числу всех равновозможных исходов: ' +
        h.m('<i>P</i> = ' + h.frac('<i>m</i>', '<i>n</i>')) +
        '.</p>',
      '<p>Всего исходов <i>n</i> = ' + total + ', благоприятных (' + favText + ') <i>m</i> = ' + fav + '.</p>',
      h.block('<i>P</i> = ' + h.frac(fav, total) + ' = ' + fmt(p)),
    ];
  }

  // Разбиение total на k положительных слагаемых.
  function split(rng, total, k) {
    const min = 2;
    return OGE.retry(rng, () => {
      const cuts = [];
      for (let i = 0; i < k - 1; i++) cuts.push(rng.int(1, total - 1));
      cuts.sort((a, b) => a - b);
      const parts = [];
      let prev = 0;
      cuts.concat([total]).forEach((c) => {
        parts.push(c - prev);
        prev = c;
      });
      return parts.every((p) => p >= min) ? parts : null;
    });
  }

  const SETS = [
    {
      intro: (n) => 'На тарелке ' + n + ' ' + plural(n, 'пирожок', 'пирожка', 'пирожков') + ': ',
      items: ['с мясом', 'с капустой', 'с вишней', 'с картошкой'],
      who: 'Петя наугад выбирает один пирожок. Найдите вероятность того, что пирожок окажется ',
    },
    {
      intro: (n) => 'В коробке ' + n + ' ' + plural(n, 'шарик', 'шарика', 'шариков') + ': ',
      items: ['красных', 'синих', 'зелёных', 'жёлтых'],
      itemsOne: ['красным', 'синим', 'зелёным', 'жёлтым'],
      who: 'Маша наугад достаёт один шарик. Найдите вероятность того, что он окажется ',
    },
    {
      intro: (n) => 'В пакете ' + n + ' ' + plural(n, 'конфета', 'конфеты', 'конфет') + ': ',
      items: ['с орехами', 'с джемом', 'с карамелью', 'с нугой'],
      who: 'Дима наугад берёт одну конфету. Найдите вероятность того, что она окажется ',
    },
  ];

  const builders = {
    taxi(rng) {
      const N = rng.pick([20, 25, 40, 50]);
      const k = rng.int(2, N - 2);
      const askYellow = rng.chance(0.5);
      const fav = askYellow ? N - k : k;
      return {
        html:
          '<p>В фирме такси в данный момент свободно ' +
          N +
          ' ' +
          plural(N, 'машина', 'машины', 'машин') +
          ': ' +
          k +
          ' ' +
          plural(k, 'чёрная', 'чёрные', 'чёрных') +
          ' с жёлтыми надписями на бортах, остальные — жёлтые с чёрными надписями. ' +
          'По вызову выехала одна из машин, случайно оказавшаяся ближе всего к заказчику. Найдите вероятность того, что к нему приедет ' +
          (askYellow ? 'жёлтое такси с чёрными надписями.' : 'чёрное такси с жёлтыми надписями.') +
          '</p>',
        fav,
        total: N,
        steps: (askYellow ? ['<p>Жёлтых машин: ' + N + ' − ' + k + ' = ' + (N - k) + '.</p>'] : []).concat(
          classic(fav, N, askYellow ? 'жёлтые машины' : 'чёрные машины'),
        ),
        data: { kind: 'parts', parts: [k, N - k], fav: [askYellow ? 1 : 0], total: N, given: [N, k] },
      };
    },
    items(rng) {
      const set = rng.pick(SETS);
      const total = rng.pick(GOOD_TOTALS.filter((t) => t <= 40));
      const k = rng.int(3, 4);
      const parts = split(rng, total, k);
      const ask = rng.int(0, k - 1);
      const names = set.items.slice(0, k);
      const list = parts
        .map((c, i) => c + ' ' + names[i])
        .join(', ')
        .replace(/, ([^,]*)$/, ' и $1');
      const askText = set.itemsOne ? set.itemsOne[ask] : names[ask];
      return {
        html: '<p>' + set.intro(total) + list + '. ' + set.who + askText + '.</p>',
        fav: parts[ask],
        total,
        steps: classic(parts[ask], total, names[ask]),
        data: { kind: 'parts', parts, fav: [ask], total, given: parts.concat([total]) },
      };
    },
    defective(rng) {
      const N = rng.pick([50, 100, 200, 250, 400, 500, 1000, 2000]);
      const k = rng.int(1, Math.max(2, Math.floor(N / 20)));
      const obj = rng.pick([
        ['садовых насосов', 'подтекают', 'насос не подтекает', 'насос подтекает'],
        ['карманных фонариков', 'неисправны', 'фонарик окажется исправен', 'фонарик окажется неисправен'],
        ['электрических чайников', 'имеют брак', 'чайник окажется без брака', 'чайник окажется с браком'],
      ]);
      const askGood = rng.chance(0.75);
      const fav = askGood ? N - k : k;
      return {
        html:
          '<p>В среднем из ' +
          N +
          ' ' +
          obj[0] +
          ', поступивших в продажу, ' +
          k +
          ' ' +
          obj[1] +
          '. Найдите вероятность того, что случайно выбранный для контроля ' +
          (askGood ? obj[2] : obj[3]) +
          '.</p>',
        fav,
        total: N,
        steps: (askGood ? ['<p>Исправных: ' + N + ' − ' + k + ' = ' + (N - k) + '.</p>'] : []).concat(classic(fav, N, askGood ? 'исправные' : 'с дефектом')),
        data: { kind: 'parts', parts: [k, N - k], fav: [askGood ? 1 : 0], total: N, given: [N, k] },
      };
    },
    complement(rng) {
      const p = new Frac(rng.int(1, 99), 100);
      const thing = rng.pick([
        ['новая шариковая ручка пишет плохо (или не пишет)', 'эта ручка пишет хорошо', 'шариковую ручку'],
        ['новый электрический чайник прослужит больше года', 'чайник прослужит меньше года или год', 'чайник'],
        ['в случайно выбранном пакете молока есть брак', 'в выбранном пакете брака нет', 'пакет молока'],
      ]);
      return {
        html:
          '<p>Вероятность того, что ' +
          thing[0] +
          ', равна ' +
          fmt(p) +
          '. Покупатель в магазине выбирает ' +
          thing[2] +
          '. Найдите вероятность того, что ' +
          thing[1] +
          '.</p>',
        fav: null,
        value: new Frac(1).sub(p),
        steps: ['<p>Это противоположные события, сумма их вероятностей равна 1.</p>', h.block('<i>P</i> = 1 − ' + fmt(p) + ' = ' + fmt(new Frac(1).sub(p)))],
        data: { kind: 'complement', p: p.toNumber() },
      };
    },
    order(rng) {
      const countries = rng.sample(['России', 'Норвегии', 'Швеции', 'Финляндии', 'Дании', 'Китая', 'Канады'], rng.int(3, 4));
      const total = rng.pick([20, 25, 40, 50]);
      const parts = split(rng, total, countries.length);
      const ask = rng.int(0, countries.length - 1);
      const sport = rng.pick(['толканию ядра', 'прыжкам в длину', 'фигурному катанию', 'гимнастике']);
      const pos = rng.pick(['первым', 'последним', 'пятым', 'седьмым']);
      const list = parts
        .map((c, i) => c + ' из ' + countries[i])
        .join(', ')
        .replace(/, ([^,]*)$/, ' и $1');
      return {
        html:
          '<p>В соревнованиях по ' +
          sport +
          ' участвуют спортсмены: ' +
          list +
          '. Порядок выступлений определяется жеребьёвкой. ' +
          'Найдите вероятность того, что спортсмен, выступающий ' +
          pos +
          ', окажется из ' +
          countries[ask] +
          '.</p>',
        fav: parts[ask],
        total,
        steps: ['<p>Всего спортсменов: ' + parts.join(' + ') + ' = ' + total + '. На любое место с равными шансами может попасть любой из них.</p>'].concat(
          classic(parts[ask], total, 'спортсмены из ' + countries[ask]),
        ),
        data: { kind: 'parts', parts, fav: [ask], total, given: parts },
      };
    },
    tickets(rng) {
      const N = rng.pick([20, 25, 40, 50]);
      const k = rng.int(2, N - 2);
      const subj = rng.pick([
        ['биологии', '«Грибы»'],
        ['географии', '«Климат»'],
        ['истории', '«Петровские реформы»'],
        ['физике', '«Электричество»'],
      ]);
      const askHas = rng.chance(0.5);
      const fav = askHas ? k : N - k;
      return {
        html:
          '<p>В сборнике билетов по ' +
          subj[0] +
          ' всего ' +
          N +
          ' ' +
          plural(N, 'билет', 'билета', 'билетов') +
          ', в ' +
          k +
          ' из них встречается вопрос по теме ' +
          subj[1] +
          '. Найдите вероятность того, что в случайно выбранном на экзамене билете школьнику ' +
          (askHas ? '' : 'не ') +
          'достанется вопрос по этой теме.</p>',
        fav,
        total: N,
        steps: (askHas ? [] : ['<p>Билетов без этого вопроса: ' + N + ' − ' + k + ' = ' + (N - k) + '.</p>']).concat(
          classic(fav, N, askHas ? 'билеты с вопросом' : 'билеты без вопроса'),
        ),
        data: { kind: 'parts', parts: [k, N - k], fav: [askHas ? 0 : 1], total: N, given: [N, k] },
      };
    },
    coins(rng) {
      const n = rng.int(2, 3);
      const ev = rng.pick(['exactly', 'atleast', 'none']);
      const k = ev === 'exactly' ? rng.int(1, n - 1) : ev === 'atleast' ? 1 : 0;
      const outcomes = [];
      for (let m = 0; m < 1 << n; m++) {
        let s = '';
        for (let i = 0; i < n; i++) s += m & (1 << (n - 1 - i)) ? 'О' : 'Р';
        outcomes.push(s);
      }
      const isFav = (s) => {
        const c = s.split('').filter((ch) => ch === 'О').length;
        return ev === 'exactly' ? c === k : ev === 'atleast' ? c >= 1 : c === 0;
      };
      const favs = outcomes.filter(isFav);
      const evText =
        ev === 'exactly'
          ? 'орёл выпадет ровно ' + (k === 1 ? 'один раз' : 'два раза')
          : ev === 'atleast'
            ? 'орёл выпадет хотя бы один раз'
            : 'орёл не выпадет ни разу';
      return {
        html:
          '<p>В случайном эксперименте симметричную монету бросают ' + (n === 2 ? 'дважды' : 'трижды') + '. Найдите вероятность того, что ' + evText + '.</p>',
        fav: favs.length,
        total: outcomes.length,
        steps: [
          '<p>Выпишем все равновозможные исходы (О — орёл, Р — решка): ' + outcomes.join(', ') + ' — всего ' + outcomes.length + '.</p>',
          '<p>Благоприятные: ' + favs.join(', ') + ' — их ' + favs.length + '.</p>',
          h.block('<i>P</i> = ' + h.frac(favs.length, outcomes.length) + ' = ' + fmt(new Frac(favs.length, outcomes.length))),
        ],
        data: { kind: 'coins', n, event: ev, k },
      };
    },
    dice(rng) {
      const two = rng.chance(0.6);
      if (!two) {
        const ev = rng.pick(['gt', 'lt', 'odd', 'even', 'eq']);
        const t = ev === 'gt' ? rng.int(1, 4) : ev === 'lt' ? rng.int(3, 6) : ev === 'eq' ? rng.int(1, 6) : 0;
        const test = (x) => (ev === 'gt' ? x > t : ev === 'lt' ? x < t : ev === 'odd' ? x % 2 === 1 : ev === 'even' ? x % 2 === 0 : x === t);
        const favs = [1, 2, 3, 4, 5, 6].filter(test);
        const evText =
          ev === 'gt'
            ? 'выпадет больше ' + t + ' ' + plural(t, 'очка', 'очков', 'очков')
            : ev === 'lt'
              ? 'выпадет меньше ' + t + ' ' + plural(t, 'очка', 'очков', 'очков')
              : ev === 'odd'
                ? 'выпадет нечётное число очков'
                : ev === 'even'
                  ? 'выпадет чётное число очков'
                  : 'выпадет ровно ' + t + ' ' + plural(t, 'очко', 'очка', 'очков');
        const p = new Frac(favs.length, 6);
        const ans = OGE.roundFrac(p, 2);
        return {
          html: '<p>Игральный кубик бросают один раз. Найдите вероятность того, что ' + evText + '. Результат округлите до сотых.</p>',
          value: ans,
          steps: [
            '<p>Всего исходов 6, благоприятные: ' + favs.join(', ') + ' — их ' + favs.length + '.</p>',
            h.block('<i>P</i> = ' + h.frac(favs.length, 6) + (p.isFiniteDecimal() ? ' = ' : ' ≈ ') + fmt(ans)),
          ],
          data: { kind: 'dice', n: 1, event: ev, t, round: 2 },
        };
      }
      const s = rng.int(3, 11);
      const favs = [];
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === s) favs.push('(' + a + '; ' + b + ')');
      const p = new Frac(favs.length, 36);
      const ans = OGE.roundFrac(p, 2);
      return {
        html:
          '<p>В случайном эксперименте бросают две игральные кости. Найдите вероятность того, что в сумме выпадет ' +
          s +
          ' ' +
          plural(s, 'очко', 'очка', 'очков') +
          '. Результат округлите до сотых.</p>',
        value: ans,
        steps: [
          '<p>Всего исходов 6 · 6 = 36 (пары очков на первой и второй кости).</p>',
          '<p>Сумма ' + s + ' получается в исходах ' + favs.join(', ') + ' — их ' + favs.length + '.</p>',
          h.block('<i>P</i> = ' + h.frac(favs.length, 36) + (p.isFiniteDecimal() ? ' = ' : ' ≈ ') + fmt(ans)),
        ],
        data: { kind: 'dice', n: 2, event: 'sum', t: s, round: 2 },
      };
    },
  };

  const WEIGHTS = { taxi: 1, items: 2, defective: 2, complement: 1, order: 2, tickets: 1, coins: 1, dice: 2 };

  OGE.registerTask(
    10,
    function (rng, opts) {
      const names = Object.keys(WEIGHTS);
      const subtype =
        opts.subtype ||
        rng.weighted(
          names,
          names.map((n) => WEIGHTS[n]),
        );
      const b = builders[subtype](rng);
      const value = b.value !== undefined ? b.value : new Frac(b.fav, b.total);
      return {
        subtype,
        html: b.html,
        answer: { type: 'number', value },
        steps: b.steps.concat([OGE.answerLine(value)]),
        data: b.data,
      };
    },
    Object.keys(WEIGHTS),
  );
})(globalThis);
