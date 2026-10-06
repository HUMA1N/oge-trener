/*
 * Графики статистики в виде SVG-строк (без внешних библиотек — сайт работает офлайн).
 * Цвета задаются CSS-переменными, поэтому графики корректны в светлой и тёмной теме.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { el, text } = OGE.draw;
  const esc = OGE.esc;

  function pct(x) {
    return Math.round(x * 100) + '%';
  }

  // Доля ошибок по номерам заданий — горизонтальные столбики (HTML), удобно читать с телефона.
  // sortBy: 'num' — по номеру задания, 'errors' — сначала задания с наибольшей долей ошибок.
  function errorBars(summary, sortBy) {
    const rows = summary.slice();
    if (sortBy === 'errors') {
      rows.sort((a, b) => {
        if (a.errorRate === null && b.errorRate === null) return a.num - b.num;
        if (a.errorRate === null) return 1;
        if (b.errorRate === null) return -1;
        return b.errorRate - a.errorRate || b.recentErrors - a.recentErrors || a.num - b.num;
      });
    }
    const thr = Math.round(OGE.stats.WEAK_RATE * 100);
    return (
      '<div class="hbars" role="list" aria-label="Доля ошибок по номерам заданий">' +
      rows
        .map((s) => {
          const none = s.errorRate === null;
          const detail = none ? 'не решали' : s.recentErrors + ' из ' + s.recentN;
          const label = 'Задание ' + s.num + ', ' + OGE.TOPICS[s.num] + ': ' + (none ? 'ещё не решали' : 'ошибок ' + detail + ' (' + pct(s.errorRate) + ')');
          return (
            '<a class="hbar' +
            (s.weak ? ' weak' : '') +
            (none ? ' none' : '') +
            '" role="listitem" href="#/train/' +
            s.num +
            '" aria-label="' +
            esc(label) +
            '">' +
            '<span class="hbar-num">' +
            s.num +
            '</span>' +
            '<span class="hbar-main"><span class="hbar-topic">' +
            esc(OGE.TOPICS[s.num]) +
            ' <span class="hbar-detail">· ' +
            detail +
            '</span></span>' +
            '<span class="hbar-track">' +
            (none ? '' : '<span class="hbar-fill" style="width:' + Math.max(1.5, s.errorRate * 100).toFixed(1) + '%"></span>') +
            '<span class="hbar-thr" style="left:' +
            thr +
            '%"></span></span></span>' +
            '<span class="hbar-val">' +
            (none ? '—' : pct(s.errorRate)) +
            '</span></a>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  // Баллы за пробные варианты по порядку.
  function scoreChart(variants, max) {
    const n = variants.length;
    const left = 34;
    const top = 16;
    const ph = 140;
    const W = 340;
    const H = top + ph + 28;
    const pw = W - left - 30;
    const X = (i) => left + (n === 1 ? pw / 2 : (i * pw) / (n - 1));
    const Y = (v) => top + ph - (v / max) * ph;
    let b = '';
    [0, 5, 10, 15, max].forEach((v) => {
      b += el('line', { x1: left, y1: Y(v), x2: W - 10, y2: Y(v), class: v === 0 ? 'axis' : 'gridline' });
      b += text(left - 6, Y(v), String(v), 'tick', 'end');
    });
    // зоны отметок (по шкале первичных баллов)
    [8, 15].forEach((v) => {
      b += el('line', { x1: left, y1: Y(v), x2: W - 10, y2: Y(v), class: 'threshold' });
    });
    b += text(W - 12, Y(8) - 7, '«3»', 'tick', 'end');
    b += text(W - 12, Y(15) - 7, '«4»', 'tick', 'end');
    if (n > 1) {
      const d = variants.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v.points).toFixed(1)).join(' ');
      b += el('path', { d, class: 'line' });
    }
    variants.forEach((v, i) => {
      const date = new Date(v.date);
      const tip = 'Вариант ' + (i + 1) + ' (' + date.toLocaleDateString('ru-RU') + '): ' + v.points + ' из ' + v.max + ', отметка «' + v.grade + '»';
      b +=
        '<g class="bar-g" tabindex="0" role="img" aria-label="' +
        esc(tip) +
        '" data-tip="' +
        esc(tip) +
        '">' +
        el('circle', { cx: X(i), cy: Y(v.points), r: 4.5, class: 'pt' }) +
        el('rect', { x: X(i) - 12, y: top - 6, width: 24, height: ph + 12, class: 'hit' }) +
        '</g>';
    });
    const last = variants[n - 1];
    b += text(X(n - 1), Y(last.points) - 13, String(last.points), 'bar-label');
    b += text(left + pw / 2, H - 6, 'пробные варианты по порядку →', 'tick');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Баллы за пробные варианты">' + b + '</svg>';
  }

  OGE.charts = { errorBars, scoreChart };
})(globalThis);
