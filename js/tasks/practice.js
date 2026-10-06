/*
 * Задания 1–5: практико-ориентированные задачи с общим условием.
 * Сюжеты: «Шины», «Листы бумаги», «План участка».
 * Все пять вопросов строятся из одного зерна, поэтому в варианте
 * они относятся к одному и тому же тексту.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, fmtG, plural } = OGE;
  const D = OGE.draw;

  function table(head, rows, cls, caption) {
    return (
      '<div class="table-wrap"><table class="data ' +
      (cls || '') +
      '">' +
      (caption ? '<caption>' + caption + '</caption>' : '') +
      '<thead><tr>' +
      head.map((c) => '<th>' + c + '</th>').join('') +
      '</tr></thead><tbody>' +
      rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>'
    );
  }
  function q(num, html, value, steps, data, type) {
    return {
      html,
      answer: { type: type || 'number', value },
      steps: steps.concat([OGE.answerLine(type === 'seq' ? value : Frac.of(value))]),
      data,
    };
  }
  // Значение далеко от границы округления до k знаков?
  function safeRound(f, k) {
    const x = Frac.of(f).toNumber() * Math.pow(10, k);
    return Math.abs(x - Math.floor(x) - 0.5) > 0.02;
  }

  // ============================== ШИНЫ ==============================
  function tireSvg() {
    const W = 230;
    const Hh = 150;
    const cx = 80;
    const cy = 75;
    const R = 62;
    const r = 34;
    let b = '';
    b += D.el('circle', { cx, cy, r: R, class: 'tire' });
    b += D.el('circle', { cx, cy, r, class: 'rim' });
    b += D.el('line', { x1: cx - R, y1: cy, x2: cx + R, y2: cy, class: 'ln thin dash' });
    b += D.el('line', { x1: cx + r, y1: cy - 40, x2: cx + R, y2: cy - 40, class: 'ln thin' });
    b += D.text(cx, cy + 10, 'D', 'tx var');
    b += D.text(cx - 2, cy - 12, 'd', 'tx var');
    b += D.el('line', { x1: cx - r, y1: cy - 4, x2: cx + r, y2: cy - 4, class: 'ln thin' });
    b += D.text(cx + (R + r) / 2, cy - 50, 'H', 'tx var');
    // профиль шины справа
    const px = 175;
    b += D.el('rect', { x: px, y: 30, width: 34, height: 26, rx: 8, class: 'tire' });
    b += D.el('rect', { x: px, y: 94, width: 34, height: 26, rx: 8, class: 'tire' });
    b += D.el('rect', { x: px + 4, y: 56, width: 26, height: 38, class: 'rim' });
    b += D.el('line', { x1: px, y1: 132, x2: px + 34, y2: 132, class: 'ln thin' });
    b += D.text(px + 17, 142, 'B', 'tx var');
    b += D.el('line', { x1: px - 8, y1: 30, x2: px - 8, y2: 56, class: 'ln thin' });
    b += D.text(px - 16, 43, 'H', 'tx var');
    return D.svg(W, Hh, b, 'fig-tire', 'Схема колеса');
  }

  function tires(rng) {
    const w0 = rng.pick([165, 175, 185]);
    const d0 = rng.pick([14, 15]);
    const widths = [0, 1, 2, 3, 4].map((i) => w0 + 10 * i);
    const rims = [d0, d0 + 1, d0 + 2];
    const grid = OGE.retry(rng, () => {
      const base = rng.pick([70, 75, 80]);
      const g = widths.map((w, i) =>
        rims.map((d, j) => {
          if (rng.chance(0.28)) return null;
          const p = base - 5 * j - 5 * Math.floor(i / 2) - rng.pick([0, 0, 5]);
          return p >= 40 && p <= 80 ? p : null;
        }),
      );
      for (let j = 0; j < 3; j++) if (g.filter((row) => row[j] !== null).length < 2) return null;
      if (g.some((row) => row.every((c) => c === null))) return null;
      return g;
    });
    const cells = [];
    grid.forEach((row, i) => row.forEach((p, j) => p !== null && cells.push({ B: widths[i], p, d: rims[j] })));
    const Hof = (t) => new Frac(t.B * t.p, 100);
    const Dof = (t) => Frac.of('25.4').mul(t.d).add(Hof(t).mul(2));
    const mark = (t) => t.B + '/' + t.p + ' R' + t.d;
    const pair = OGE.retry(rng, () => {
      const f = rng.pick(cells.filter((c) => c.d === rims[1]));
      const o = rng.pick(cells);
      if (!f || o === f || Dof(o).eq(Dof(f))) return null;
      const pct = Dof(o).sub(Dof(f)).abs().div(Dof(f)).mul(100);
      if (!safeRound(pct, 1)) return null;
      return { f, o, pct };
    });
    const { f, o, pct } = pair;
    const up = Dof(o).cmp(Dof(f)) > 0;

    const context =
      '<p>Автомобильное колесо, как правило, представляет из себя металлический диск с установленной на него резиновой шиной. ' +
      'Диаметр диска совпадает с диаметром внутреннего отверстия в шине.</p>' +
      '<p>Для маркировки автомобильных шин применяется единая система обозначений. Например, 195/65 R15. ' +
      'Первое число (195 в приведённом примере) обозначает ширину шины <i>B</i> в миллиметрах. ' +
      'Второе число (65) — высота боковины <i>H</i> в процентах к ширине шины, то есть ' +
      h.m(h.frac('<i>H</i>', '<i>B</i>') + ' · 100') +
      '.</p>' +
      '<p>Буква R означает, что шина радиальная. За ней идёт число, указывающее диаметр диска колеса <i>d</i> в дюймах (в одном дюйме 25,4 мм). ' +
      'Общий диаметр колеса <i>D</i> легко найти, зная диаметр диска и высоту боковины.</p>' +
      '<div class="fig-wrap">' +
      tireSvg() +
      '</div>' +
      '<p>Завод производит легковые автомобили определённой модели и устанавливает на них колёса с шинами маркировки <b>' +
      mark(f) +
      '</b>. Завод допускает установку шин с другими маркировками. В таблице показаны разрешённые размеры шин.</p>' +
      table(
        ['Ширина шины, мм'].concat(rims.map((d) => 'R' + d)),
        grid.map((row, i) => [widths[i]].concat(row.map((p) => (p === null ? '—' : widths[i] + '/' + p)))),
        '',
        'Разрешённые размеры шин (столбцы — диаметр диска в дюймах)',
      );

    // 1. чтение таблицы
    const col = rng.pick(rims);
    const inCol = cells.filter((c) => c.d === col).map((c) => c.B);
    const askMin = rng.chance(0.5);
    const v1 = askMin ? Math.min(...inCol) : Math.max(...inCol);
    const t1 = q(
      1,
      '<p>Какой ' +
        (askMin ? 'наименьшей' : 'наибольшей') +
        ' ширины шины можно устанавливать на автомобиль, если диаметр диска равен ' +
        col +
        ' дюймам? Ответ дайте в миллиметрах.</p>',
      v1,
      [
        '<p>Смотрим столбец «Диаметр диска ' +
          col +
          '″»: разрешены шины шириной ' +
          inCol.join(', ') +
          ' мм. ' +
          (askMin ? 'Наименьшая' : 'Наибольшая') +
          ' — ' +
          v1 +
          ' мм.</p>',
      ],
      { kind: 'tires-q1', grid, widths, rims, col, ask: askMin ? 'min' : 'max' },
    );
    // 2. высота боковины
    const t2tire = rng.chance(0.5) ? f : o;
    const t2 = q(
      2,
      '<p>Найдите высоту боковины шины <i>H</i> с маркировкой ' + mark(t2tire) + '. Ответ дайте в миллиметрах.</p>',
      Hof(t2tire),
      [
        '<p>Высота боковины составляет ' + t2tire.p + '% от ширины ' + t2tire.B + ' мм:</p>',
        h.block('<i>H</i> = ' + t2tire.B + ' · ' + h.frac(t2tire.p, 100) + ' = ' + fmt(Hof(t2tire)) + ' мм'),
      ],
      { kind: 'tires-h', tire: t2tire },
    );
    // 3. диаметр колеса заводской маркировки
    const t3 = q(
      3,
      '<p>Найдите диаметр колеса <i>D</i> автомобиля, выходящего с завода (шины ' + mark(f) + '). Ответ дайте в миллиметрах.</p>',
      Dof(f),
      [
        '<p>Диаметр диска: ' +
          h.m(f.d + ' · 25,4 = ' + fmt(Frac.of('25.4').mul(f.d)) + ' мм') +
          '. Высота боковины: ' +
          h.m(f.B + ' · ' + fmt(new Frac(f.p, 100)) + ' = ' + fmt(Hof(f)) + ' мм') +
          '.</p>',
        '<p>Колесо состоит из диска и двух боковин (сверху и снизу):</p>',
        h.block('<i>D</i> = ' + fmt(Frac.of('25.4').mul(f.d)) + ' + 2 · ' + fmt(Hof(f)) + ' = ' + fmt(Dof(f)) + ' мм'),
      ],
      { kind: 'tires-d', tire: f },
    );
    // 4. изменение диаметра
    const diff = Dof(o).sub(Dof(f)).abs();
    const t4 = q(
      4,
      '<p>На сколько миллиметров ' +
        (up ? 'увеличится' : 'уменьшится') +
        ' диаметр колеса, если заменить шины, установленные на заводе, шинами с маркировкой ' +
        mark(o) +
        '?</p>',
      diff,
      [
        '<p>Заводское колесо: ' + h.m('<i>D</i><sub>1</sub> = ' + fmt(Dof(f)) + ' мм') + ' (25,4 · ' + f.d + ' + 2 · ' + fmt(Hof(f)) + ').</p>',
        '<p>Новое колесо: ' + h.m('<i>D</i><sub>2</sub> = 25,4 · ' + o.d + ' + 2 · ' + fmt(Hof(o)) + ' = ' + fmt(Dof(o)) + ' мм') + '.</p>',
        h.block('|' + fmt(Dof(o)) + ' − ' + fmt(Dof(f)) + '| = ' + fmt(diff) + ' мм'),
      ],
      { kind: 'tires-diff', from: f, to: o },
    );
    // 5. проценты
    const p5 = OGE.roundFrac(pct, 1);
    const t5 = q(
      5,
      '<p>На сколько процентов ' +
        (up ? 'увеличится' : 'уменьшится') +
        ' пробег автомобиля при одном обороте колеса, если заменить шины, установленные на заводе, шинами с маркировкой ' +
        mark(o) +
        '? Результат округлите до десятых.</p>',
      p5,
      [
        '<p>За один оборот автомобиль проезжает длину окружности колеса ' +
          h.m('π<i>D</i>') +
          ', поэтому пробег меняется во столько же раз, во сколько меняется диаметр.</p>',
        '<p>' + h.m('<i>D</i><sub>1</sub> = ' + fmt(Dof(f))) + ' мм, ' + h.m('<i>D</i><sub>2</sub> = ' + fmt(Dof(o))) + ' мм.</p>',
        h.block(h.frac(fmt(diff), fmt(Dof(f))) + ' · 100% ≈ ' + fmt(p5) + '%'),
      ],
      { kind: 'tires-pct', from: f, to: o },
    );
    return { title: 'Шины', context, tasks: [t1, t2, t3, t4, t5] };
  }

  // ============================== БУМАГА ==============================
  const ISO = [
    [841, 1189],
    [594, 841],
    [420, 594],
    [297, 420],
    [210, 297],
    [148, 210],
    [105, 148],
    [74, 105],
    [52, 74],
  ];

  function paper(rng) {
    const k = rng.int(2, 4); // в таблице форматы A{k}…A{k+3}
    const formats = [k, k + 1, k + 2, k + 3];
    const order = rng.shuffle(formats); // order[i] — формат листа с номером i + 1
    const context =
      '<p>Общепринятые форматы листов бумаги обозначают буквой A и цифрой: A0, A1, A2 и так далее. Лист формата A0 имеет форму прямоугольника, площадь которого равна 1 м<sup>2</sup>. ' +
      'Если лист формата A0 разрезать пополам параллельно меньшей стороне, получается два равных листа формата A1. Если так же лист A1 разрезать пополам, получается два листа формата A2. И так далее.</p>' +
      '<p>Отношение длины большей стороны листа к длине меньшей стороны у всех форматов одно и то же, поэтому листы всех форматов подобны друг другу. ' +
      'Это сделано специально для того, чтобы пропорции текста и его расположение на листе сохранялись при уменьшении или увеличении шрифта при изменении формата листа.</p>' +
      '<p>В таблице даны размеры (с точностью до мм) четырёх листов, имеющих форматы ' +
      formats
        .map((f) => 'A' + f)
        .join(', ')
        .replace(/, (A\d)$/, ' и $1') +
      '.</p>' +
      table(
        ['Номер листа', 'Длина (мм)', 'Ширина (мм)'],
        order.map((f, i) => [i + 1, ISO[f][1], ISO[f][0]]),
      );

    // 1. соответствие форматов и номеров
    const seq = formats.map((f) => order.indexOf(f) + 1).join('');
    const t1 = q(
      1,
      '<p>Для листов бумаги, указанных в таблице, определите, какими номерами они обозначены. Заполните таблицу, в бланк ответов перенесите последовательность четырёх цифр.</p>' +
        table(['Форматы бумаги'].concat(formats.map((f) => 'A' + f)), [['Номера листов', '', '', '', '']]),
      seq,
      [
        '<p>Чем больше число в названии формата, тем меньше лист: каждый следующий формат — половина предыдущего. Упорядочим листы по убыванию длины:</p>',
        '<p>' + formats.map((f) => 'A' + f + ' — ' + ISO[f][1] + ' × ' + ISO[f][0] + ' мм — лист № ' + (order.indexOf(f) + 1)).join('; ') + '.</p>',
      ],
      { kind: 'paper-match', formats, order },
      'seq',
    );
    // 2. сколько листов / масса пачки
    let t2;
    if (rng.chance(0.5)) {
      const m = rng.int(0, 3);
      const n = m + rng.int(2, 5);
      t2 = q(
        2,
        '<p>Сколько листов формата A' + n + ' получится из одного листа формата A' + m + '?</p>',
        Math.pow(2, n - m),
        [
          '<p>При переходе к следующему формату лист делится пополам, то есть число листов удваивается. От A' +
            m +
            ' до A' +
            n +
            ' — ' +
            (n - m) +
            ' ' +
            plural(n - m, 'шаг', 'шага', 'шагов') +
            ':</p>',
          h.block('2<sup>' + (n - m) + '</sup> = ' + Math.pow(2, n - m)),
        ],
        { kind: 'paper-count', m, n },
      );
    } else {
      const x = rng.int(3, 5);
      const N = rng.pick([100, 250, 500]);
      const dens = rng.pick([80, 100, 120, 160]);
      const mass = new Frac(N * dens, Math.pow(2, x));
      t2 = q(
        2,
        '<p>Бумагу формата A' +
          x +
          ' упаковали в пачки по ' +
          N +
          ' листов. Найдите массу пачки, если плотность бумаги равна ' +
          dens +
          ' г/м<sup>2</sup>. Ответ дайте в граммах.</p>',
        mass,
        [
          '<p>Площадь листа A0 — 1 м<sup>2</sup>, каждый следующий формат вдвое меньше: площадь A' +
            x +
            ' равна ' +
            h.m(h.frac(1, Math.pow(2, x)) + ' м<sup>2</sup>') +
            '.</p>',
          '<p>Площадь всей пачки: ' + h.m(N + ' · ' + h.frac(1, Math.pow(2, x)) + ' = ' + fmt(new Frac(N, Math.pow(2, x))) + ' м<sup>2</sup>') + '. Масса:</p>',
          h.block(fmt(new Frac(N, Math.pow(2, x))) + ' · ' + dens + ' = ' + fmt(mass) + ' г'),
        ],
        { kind: 'paper-mass', x, N, dens },
      );
    }
    // 3. сторона формата вне таблицы
    let t3;
    if (rng.chance(0.5)) {
      t3 = q(
        3,
        '<p>Найдите длину меньшей стороны листа формата A' + (k - 1) + '. Ответ дайте в миллиметрах.</p>',
        ISO[k][1],
        [
          '<p>Лист A' +
            (k - 1) +
            ' разрезают пополам параллельно меньшей стороне и получают два листа A' +
            k +
            '. Значит, меньшая сторона A' +
            (k - 1) +
            ' совпадает с большей стороной A' +
            k +
            ', которая есть в таблице: ' +
            ISO[k][1] +
            ' мм.</p>',
        ],
        { kind: 'paper-side', format: k - 1, side: 'short' },
      );
    } else {
      const n = k + 4;
      t3 = q(
        3,
        '<p>Найдите длину большей стороны листа формата A' + n + '. Ответ дайте в миллиметрах.</p>',
        ISO[k + 3][0],
        [
          '<p>Лист A' +
            n +
            ' — половина листа A' +
            (k + 3) +
            ', разрезанного параллельно меньшей стороне. Поэтому большая сторона A' +
            n +
            ' равна меньшей стороне A' +
            (k + 3) +
            ' из таблицы: ' +
            ISO[k + 3][0] +
            ' мм.</p>',
        ],
        { kind: 'paper-side', format: n, side: 'long' },
      );
    }
    // 4. площадь листа
    const fa = rng.pick(formats);
    const area = new Frac(ISO[fa][0] * ISO[fa][1], 100);
    const t4 = q(
      4,
      '<p>Найдите площадь листа формата A' + fa + '. Ответ дайте в квадратных сантиметрах.</p>',
      area,
      [
        '<p>Размеры листа A' +
          fa +
          ' по таблице: ' +
          ISO[fa][1] +
          ' мм × ' +
          ISO[fa][0] +
          ' мм = ' +
          fmt(ISO[fa][1] / 10) +
          ' см × ' +
          fmt(ISO[fa][0] / 10) +
          ' см.</p>',
        h.block('<i>S</i> = ' + fmt(ISO[fa][1] / 10) + ' · ' + fmt(ISO[fa][0] / 10) + ' = ' + fmt(area) + ' см<sup>2</sup>'),
      ],
      { kind: 'paper-area', format: fa },
    );
    // 5. отношение сторон или размер шрифта
    let t5;
    if (rng.chance(0.4)) {
      const fr = rng.pick(formats);
      const ratio = new Frac(ISO[fr][1], ISO[fr][0]);
      const r1 = OGE.roundFrac(ratio, 1);
      t5 = q(
        5,
        '<p>Найдите отношение длины большей стороны листа к меньшей у листа формата A' + fr + '. Ответ дайте с точностью до десятых.</p>',
        r1,
        [h.block(h.frac(ISO[fr][1], ISO[fr][0]) + ' ≈ ' + fmt(OGE.roundFrac(ratio, 3)) + ' ≈ ' + fmt(r1))],
        { kind: 'paper-ratio', format: fr },
      );
    } else {
      t5 = OGE.retry(rng, () => {
        const from = rng.pick(formats.slice(0, 3));
        const to = from + 1;
        const size = rng.int(10, 24);
        const exact = new Frac(size * ISO[to][1], ISO[from][1]);
        const res = OGE.roundFrac(exact, 0);
        const viaRoot = Math.round(size / Math.SQRT2);
        if (!safeRound(exact, 0) || res.toNumber() !== viaRoot) return null;
        return q(
          5,
          '<p>Размер (высота) типографского шрифта измеряется в пунктах. Один пункт равен 1/72 дюйма, то есть 0,3528 мм. Какой высоты нужен шрифт (в пунктах), чтобы текст был расположен на листе формата A' +
            to +
            ' так же, как этот же текст, напечатанный шрифтом высотой ' +
            size +
            ' ' +
            plural(size, 'пункт', 'пункта', 'пунктов') +
            ' на листе формата A' +
            from +
            '? Размер шрифта округляется до целого.</p>',
          res,
          [
            '<p>Листы подобны, и при переходе от A' +
              from +
              ' к A' +
              to +
              ' все размеры уменьшаются в одно и то же число раз: ' +
              h.m(h.frac(ISO[from][1], ISO[to][1]) + ' ≈ ' + fmt(OGE.roundFrac(new Frac(ISO[from][1], ISO[to][1]), 3))) +
              ' (≈ √2).</p>',
            '<p>Шрифт нужно уменьшить во столько же раз:</p>',
            h.block(size + ' · ' + h.frac(ISO[to][1], ISO[from][1]) + ' ≈ ' + fmt(OGE.roundFrac(exact, 2)) + ' ≈ ' + fmt(res)),
          ],
          { kind: 'paper-font', from, to, size },
        );
      });
    }
    return { title: 'Листы бумаги', context, tasks: [t1, t2, t3, t4, t5] };
  }

  // ============================== ПЛАН УЧАСТКА ==============================
  const PW = 18;
  const PH = 16;

  function rectDist(a, b) {
    const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
    const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
    return Math.hypot(dx, dy);
  }

  function plot(rng) {
    const L = OGE.retry(rng, () => {
      const gw = rng.int(4, 5);
      const gh = rng.int(3, 4);
      const sx = rng.int(11, 12);
      const sw = rng.int(3, 5);
      const sh = rng.int(3, 4);
      if (sx + sw > PW - 1) return null;
      const hx = rng.int(11, 12);
      const hw = rng.int(4, 5);
      const hy = 1 + sh + rng.int(2, 3);
      const hh = rng.int(3, 4);
      const bx = rng.int(11, 13);
      const bw = rng.int(2, 3);
      const by = hy + hh + rng.int(1, 2);
      const bh = rng.int(2, 3);
      if (hx + hw > PW - 1 || bx + bw > PW - 1 || by + bh > PH - 1) return null;
      const gardenY = hy + hh + 1;
      if (PH - 1 - gardenY < 3) return null;
      return {
        garage: { x: 1, y: 1, w: gw, h: gh },
        shed: { x: sx, y: 1, w: sw, h: sh },
        house: { x: hx, y: hy, w: hw, h: hh },
        bath: { x: bx, y: by, w: bw, h: bh },
        apples: { x: 1, y: hy, w: 6, h: hh },
        garden: { x: 1, y: gardenY, w: 7, h: PH - 1 - gardenY },
        greenhouse: { x: 2, y: gardenY + 1, w: 3, h: Math.max(1, PH - 3 - gardenY) },
        platform: { x: 1 + gw, y: 0, w: sx - 1 - gw, h: 2 },
      };
    });
    // дорожки: столбец x = 9 от площадки до бани и ответвления к дому и бане
    const cells = new Set();
    const add = (x, y) => cells.add(x + ',' + y);
    for (let x = L.platform.x; x < L.platform.x + L.platform.w; x++) for (let y = 0; y < 2; y++) add(x, y);
    const houseRow = L.house.y + 1;
    const bathRow = L.bath.y;
    for (let y = 2; y <= bathRow; y++) add(9, y);
    for (let x = 10; x < L.house.x; x++) add(x, houseRow);
    for (let x = 10; x < L.bath.x; x++) add(x, bathRow);
    const pathCells = Array.from(cells).map((s) => s.split(',').map(Number));
    const platformTiles = L.platform.w * L.platform.h;

    // зеркальное отражение: гараж справа, сарай слева
    const mirror = rng.chance(0.5);
    const mx = (r) => (mirror ? Object.assign({}, r, { x: PW - r.x - r.w }) : r);
    const R = {};
    Object.keys(L).forEach((k) => (R[k] = mx(L[k])));
    const P = pathCells.map(([x, y]) => (mirror ? [PW - 1 - x, y] : [x, y]));
    const gate = mirror ? { x: PW - 10, w: 2 } : { x: 8, w: 2 };

    // номера объектов на плане
    const names = ['garage', 'shed', 'house', 'apples', 'bath', 'garden'];
    const nums = rng.shuffle([1, 2, 3, 4, 5, 6]);
    const num = {};
    names.forEach((n, i) => (num[n] = nums[i]));
    const RU = { garage: 'Гараж', shed: 'Сарай', house: 'Жилой дом', apples: 'Яблони', bath: 'Баня', garden: 'Огород' };
    const RUgen = { garage: 'гаража', shed: 'сарая', house: 'жилого дома', bath: 'бани' };

    const shedArea = R.shed.w * R.shed.h;
    const left = mirror ? 'сарай' : 'гараж';
    const right = mirror ? 'гараж' : 'сарай';
    const trees = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++) trees.push({ x: R.apples.x + 1 + i * 2, y: R.apples.y + 1 + j * Math.max(1, R.apples.h - 2), r: 0.55, cls: 'tree' });
    const planSvg = D.grid({
      w: PW,
      h: PH,
      cell: 17,
      margin: 22,
      label: 'План участка',
      rects: [
        Object.assign({ cls: 'garden', label: String(num.garden), lx: R.garden.x + R.garden.w - 1.2, ly: R.garden.y + R.garden.h / 2 }, R.garden),
        Object.assign({ cls: 'greenhouse' }, R.greenhouse),
        Object.assign({ cls: 'orchard', label: String(num.apples), lx: R.apples.x + R.apples.w / 2, ly: R.apples.y + R.apples.h / 2 }, R.apples),
      ]
        .concat(P.map(([x, y]) => ({ x, y, w: 1, h: 1, cls: 'tile' })))
        .concat(['garage', 'shed', 'house', 'bath'].map((k) => Object.assign({ cls: 'building', label: String(num[k]) }, R[k]))),
      circles: trees,
      segs: [
        [[0, 0], [gate.x, 0], 'fence'],
        [[gate.x + gate.w, 0], [PW, 0], 'fence'],
        [[PW, 0], [PW, PH], 'fence'],
        [[PW, PH], [0, PH], 'fence'],
        [[0, PH], [0, 0], 'fence'],
      ],
      texts: [{ x: gate.x + gate.w / 2, y: -0.75, s: 'ворота', cls: 'tx sm' }],
    });

    const context =
      '<p>На плане изображено домохозяйство (сторона каждой клетки на плане равна 1 м). Участок имеет прямоугольную форму. Выезд и въезд осуществляются через единственные ворота.</p>' +
      '<p>При входе на участок слева от ворот находится ' +
      left +
      ', а справа — ' +
      right +
      '. Площадь сарая равна ' +
      shedArea +
      ' кв. м. ' +
      'Жилой дом расположен в глубине участка за сараем. Напротив жилого дома расположены яблоневые посадки. ' +
      'Также на участке есть баня, к которой ведёт дорожка, выложенная плиткой, и огород с теплицей внутри (огород отмечен на плане цифрой ' +
      num.garden +
      ').</p>' +
      '<p>Все дорожки внутри участка имеют ширину 1 м и вымощены тротуарной плиткой размером 1 м × 1 м. Между гаражом и сараем находится площадка, вымощенная такой же плиткой.</p>' +
      '<div class="fig-wrap plan">' +
      planSvg +
      '</div>';

    // 1. объекты и номера
    const ask1 = rng.sample(['house', 'shed', 'garage', 'bath', 'apples'], 4);
    const seq = ask1.map((k) => num[k]).join('');
    const where = {
      garage: (mirror ? 'справа' : 'слева') + ' от ворот',
      shed: (mirror ? 'слева' : 'справа') + ' от ворот, его площадь ' + shedArea + ' кв. м (' + R.shed.w + ' × ' + R.shed.h + ' клеток)',
      house: 'в глубине участка за сараем',
      bath: 'к ней ведёт дорожка от ворот',
      apples: 'напротив жилого дома (изображены деревья)',
    };
    const t1 = q(
      1,
      '<p>Для объектов, указанных в таблице, определите, какими цифрами они обозначены на плане. Заполните таблицу, в бланк ответов перенесите последовательность четырёх цифр.</p>' +
        table(['Объекты'].concat(ask1.map((k) => RU[k])), [['Цифры', '', '', '', '']]),
      seq,
      ['<ul>' + ask1.map((k) => '<li>' + RU[k] + ' — ' + where[k] + ': цифра ' + num[k] + '.</li>').join('') + '</ul>'],
      { kind: 'plot-match', ask: ask1, num, rects: R, mirror, gate },
      'seq',
    );
    // 2. упаковки плитки
    const tiles = P.length;
    const packOptions = [4, 5, 6, 8, 10].filter((p) => tiles % p !== 0);
    const pack = rng.pick(packOptions.length ? packOptions : [4, 5, 6, 8, 10]);
    const packs = Math.ceil(tiles / pack);
    const t2 = q(
      2,
      '<p>Тротуарная плитка продаётся в упаковках по ' +
        pack +
        ' штук. Сколько упаковок плитки понадобилось, чтобы выложить все дорожки и площадку между гаражом и сараем?</p>',
      packs,
      [
        '<p>Каждая клетка дорожки или площадки — одна плитка 1 м × 1 м. Площадка: ' +
          L.platform.w +
          ' × 2 = ' +
          platformTiles +
          ' плиток, дорожки: ' +
          (tiles - platformTiles) +
          ' плиток. Всего ' +
          tiles +
          '.</p>',
        '<p>' +
          tiles +
          ' : ' +
          pack +
          ' = ' +
          fmt(new Frac(tiles, pack)) +
          (tiles % pack ? ' — значит, нужно ' : ' — ровно ') +
          packs +
          ' ' +
          plural(packs, 'упаковка', 'упаковки', 'упаковок') +
          (tiles % pack ? ' (округляем вверх).' : '.') +
          '</p>',
      ],
      { kind: 'plot-tiles', cells: P, pack },
    );
    // 3. площадь объекта
    const obj3 = rng.pick(['house', 'garage', 'bath']);
    const t3 = q(
      3,
      '<p>Найдите площадь, которую занимает ' + { house: 'жилой дом', garage: 'гараж', bath: 'баня' }[obj3] + '. Ответ дайте в квадратных метрах.</p>',
      R[obj3].w * R[obj3].h,
      [
        '<p>' + RU[obj3] + ' (цифра ' + num[obj3] + ') занимает прямоугольник ' + R[obj3].w + ' × ' + R[obj3].h + ' клеток, каждая клетка — 1 м × 1 м:</p>',
        h.block('<i>S</i> = ' + R[obj3].w + ' · ' + R[obj3].h + ' = ' + R[obj3].w * R[obj3].h + ' кв. м'),
      ],
      { kind: 'plot-area', rect: R[obj3] },
    );
    // 4. расстояние между объектами
    const pairs = [];
    const objs = ['garage', 'shed', 'house', 'bath'];
    for (let i = 0; i < objs.length; i++)
      for (let j = i + 1; j < objs.length; j++) {
        const d = rectDist(R[objs[i]], R[objs[j]]);
        if (d > 0 && Math.abs(d - Math.round(d)) < 1e-9) pairs.push([objs[i], objs[j], Math.round(d)]);
      }
    const [oa, ob, dist] = rng.pick(pairs);
    const ra = R[oa];
    const rb = R[ob];
    const ddx = Math.max(0, Math.max(ra.x, rb.x) - Math.min(ra.x + ra.w, rb.x + rb.w));
    const ddy = Math.max(0, Math.max(ra.y, rb.y) - Math.min(ra.y + ra.h, rb.y + rb.h));
    const t4 = q(
      4,
      '<p>Найдите расстояние от ' + RUgen[oa] + ' до ' + RUgen[ob] + ' (расстояние между двумя ближайшими точками по прямой). Ответ дайте в метрах.</p>',
      dist,
      ddx && ddy
        ? [
            '<p>Ближайшие точки — углы зданий. Между ними ' + ddx + ' клеток по горизонтали и ' + ddy + ' по вертикали; по теореме Пифагора:</p>',
            h.block(h.sqrt(ddx + '<sup>2</sup> + ' + ddy + '<sup>2</sup>') + ' = ' + dist + ' м'),
          ]
        : ['<p>Здания расположены друг напротив друга, считаем клетки между их ближайшими стенами: ' + dist + ' (каждая клетка — 1 м).</p>'],
      { kind: 'plot-dist', a: ra, b: rb },
    );
    // 5. отопление: газ или электричество
    const t5 = OGE.retry(rng, () => {
      const gasRate = Frac.of(rng.pick(['1.2', '1.5', '1.6', '2']));
      const gasPrice = Frac.of(rng.pick(['5.6', '6', '6.4', '7']));
      const elPower = Frac.of(rng.pick(['5.6', '6', '7.5', '8']));
      const elPrice = Frac.of(rng.pick(['3.8', '4.2', '4.5', '5']));
      const gasHour = gasRate.mul(gasPrice);
      const elHour = elPower.mul(elPrice);
      const delta = elHour.sub(gasHour);
      if (delta.sign() <= 0) return null;
      const hours = rng.int(4, 40) * 50;
      const extra = delta.mul(hours);
      if (!extra.isInt()) return null;
      const elEquip = rng.int(15, 30) * 1000;
      const elMount = rng.int(10, 20) * 1000;
      const gasMount = rng.int(10, 25) * 1000 + rng.int(0, 9) * 100;
      const gasEquip = elEquip + elMount + extra.n - gasMount;
      if (gasEquip < 15000) return null;
      return q(
        5,
        '<p>Хозяин участка планирует устроить в жилом доме зимнее отопление. Он рассматривает два варианта: электрическое или газовое отопление. ' +
          'Цены на оборудование и стоимость его установки, данные о расходе газа, электроэнергии и их стоимости даны в таблице.</p>' +
          table(
            ['', 'Газовое отопление', 'Электрическое отопление'],
            [
              ['Нагреватель (оборудование)', fmtG(gasEquip) + ' руб.', fmtG(elEquip) + ' руб.'],
              ['Прочее оборудование и монтаж', fmtG(gasMount) + ' руб.', fmtG(elMount) + ' руб.'],
              ['Средний расход газа / мощность', fmt(gasRate) + ' куб. м/ч', fmt(elPower) + ' кВт'],
              ['Стоимость газа / электроэнергии', fmt(gasPrice) + ' руб. за 1 куб. м', fmt(elPrice) + ' руб. за 1 кВт · ч'],
            ],
            'rowhead',
          ) +
          '<p>Обдумав оба варианта, хозяин решил установить газовое оборудование. Через сколько часов непрерывной работы отопления экономия от использования газа вместо электричества компенсирует разницу в стоимости покупки и установки газового и электрического оборудования?</p>',
        hours,
        [
          '<p>Газовое оборудование с монтажом: ' +
            h.m(fmtG(gasEquip) + ' + ' + fmtG(gasMount) + ' = ' + fmtG(gasEquip + gasMount)) +
            ' руб.; электрическое: ' +
            h.m(fmtG(elEquip) + ' + ' + fmtG(elMount) + ' = ' + fmtG(elEquip + elMount)) +
            ' руб. Разница ' +
            fmtG(extra) +
            ' руб.</p>',
          '<p>Час работы на газе: ' +
            h.m(fmt(gasRate) + ' · ' + fmt(gasPrice) + ' = ' + fmt(gasHour)) +
            ' руб., на электричестве: ' +
            h.m(fmt(elPower) + ' · ' + fmt(elPrice) + ' = ' + fmt(elHour)) +
            ' руб. Экономия ' +
            fmt(delta) +
            ' руб. в час.</p>',
          h.block(fmtG(extra) + ' : ' + fmt(delta) + ' = ' + hours + ' ч'),
        ],
        {
          kind: 'plot-heat',
          gas: { equip: gasEquip, mount: gasMount, rate: gasRate.toNumber(), price: gasPrice.toNumber() },
          el: { equip: elEquip, mount: elMount, power: elPower.toNumber(), price: elPrice.toNumber() },
        },
      );
    });
    return { title: 'План участка', context, tasks: [t1, t2, t3, t4, t5] };
  }

  const SCENARIOS = { tires, paper, plot };

  // Сюжет выбирается по зерну: все пять заданий одного зерна — один сюжет.
  function scenario(rng, id) {
    const key = id || rng.pick(Object.keys(SCENARIOS));
    const sc = SCENARIOS[key](rng);
    sc.id = key;
    return sc;
  }

  [1, 2, 3, 4, 5].forEach((n) => {
    OGE.registerTask(
      n,
      function (rng, opts) {
        const sc = scenario(rng, opts.scenario);
        const t = sc.tasks[n - 1];
        t.subtype = sc.id + '-' + n;
        t.context = { key: sc.id + ':' + rng.seed, title: sc.title, html: sc.context };
        return t;
      },
      Object.keys(SCENARIOS),
    );
  });

  OGE.PRACTICE_SCENARIOS = Object.keys(SCENARIOS);
})(globalThis);
