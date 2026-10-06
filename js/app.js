/*
 * Интерфейс тренажёра: главная, тренировка по номеру, работа над ошибками,
 * вариант на время, статистика, установка как приложение.
 * Маршруты — через location.hash, поэтому сайт работает и с диска (file://), и на любом хостинге.
 */
(function () {
  'use strict';
  const OGE = window.OGE;
  const app = document.getElementById('app');
  const tooltip = document.getElementById('tooltip');
  const VKEY = 'oge-trener:variant:v1';
  const PREFS = 'oge-trener:prefs:v1';
  const DURATIONS = [45, 60, 90, 120];
  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  // ---------- хранилище ----------
  function lsGet(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  function lsSet(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* приватный режим и т. п. — работаем без сохранения */
    }
  }
  function lsDel(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* нет доступа к хранилищу */
    }
  }

  // ---------- утилиты ----------
  const esc = OGE.esc;
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  }
  function plural(n, a, b, c) {
    return OGE.plural(n, a, b, c);
  }
  function pct(x) {
    return Math.round(x * 100) + '%';
  }
  function setNav(section) {
    document.querySelectorAll('.topnav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === section));
  }
  function render(html) {
    hideTip();
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  function answerHint(task) {
    if (task.html.indexOf('hint-format') >= 0) return '';
    if (task.answer.type === 'seq') return 'Запишите последовательность цифр без пробелов, например 213.';
    if (task.answer.type === 'set') return 'Запишите номера подряд без пробелов и запятых, например 13.';
    if (task.html.indexOf('class="opts') >= 0) return 'Запишите номер верного варианта (можно нажать на вариант).';
    return 'Целое число или десятичная дробь через запятую, например −2,5.';
  }
  function answerInput(task, attrs) {
    const numeric = task.answer.type === 'number';
    const many = task.answer.type === 'list' || task.answer.type === 'pairs';
    // для нескольких чисел нужна обычная клавиатура: на цифровой нет «;» и скобок
    const keys = many
      ? '<span class="ins-keys">' +
        (task.answer.type === 'pairs' ? ['(', ')'] : [])
          .concat([';', '−', '/'])
          .map((k) => '<button type="button" class="btn ins-btn" data-act="ins" data-ins="' + k + '" aria-label="Вставить ' + k + '">' + k + '</button>')
          .join('') +
        '</span>'
      : '';
    return (
      '<input class="answer-input' +
      (many ? ' wide' : '') +
      '" ' +
      (attrs || '') +
      ' type="text" autocomplete="off" autocapitalize="off" spellcheck="false" ' +
      'inputmode="' +
      (many ? 'text' : numeric ? 'decimal' : 'numeric') +
      '" enterkeyhint="done" placeholder="' +
      (task.answer.type === 'pairs' ? '(x; y), (x; y)' : many ? 'Ответ через ;' : 'Ответ') +
      '" aria-label="Ответ на задание ' +
      task.num +
      '">' +
      (numeric && !/class="opts/.test(task.html) ? '<button type="button" class="btn sign-btn" data-act="sign" aria-label="Поменять знак">±</button>' : '') +
      keys
    );
  }
  // Вставка символа в позицию курсора (кнопки «;», «−», «/» для телефона).
  function insertAtCursor(input, str) {
    const a = input.selectionStart === null ? input.value.length : input.selectionStart;
    const b = input.selectionEnd === null ? a : input.selectionEnd;
    const ins = str === ';' ? '; ' : str;
    input.value = input.value.slice(0, a) + ins + input.value.slice(b);
    const pos = a + ins.length;
    input.focus();
    try {
      input.setSelectionRange(pos, pos);
    } catch {
      /* старые браузеры */
    }
  }
  function contextBlock(ctx, open) {
    return (
      '<details class="context"' +
      (open ? ' open' : '') +
      '><summary>Общее условие к заданиям 1–5: «' +
      esc(ctx.title) +
      '»</summary>' +
      '<div class="context-body">' +
      ctx.html +
      '</div></details>'
    );
  }
  function stepsHtml(task) {
    return '<div class="steps"><div class="steps-title">Разбор решения</div>' + task.steps.join('') + '</div>';
  }
  function toggleSign(input) {
    const v = input.value.trim();
    input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : '−' + v;
    input.focus();
  }

  // ---------- маршрутизация ----------
  let timerId = null;
  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }
  function route() {
    stopTimer();
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    setNav(parts[0]);
    if (parts[0] === 'train' && parts[1]) return renderTrain(parts[1]);
    if (parts[0] === 'train') return renderTrainPicker();
    if (parts[0] === 'variant') return renderVariant();
    if (parts[0] === 'stats') return renderStats();
    if (parts[0] === 'install') return renderInstall();
    return renderHome();
  }

  // ---------- главная ----------
  function numGrid(summary, cls) {
    return (
      '<div class="num-grid' +
      (cls ? ' ' + cls : '') +
      '">' +
      summary
        .map((s) => {
          const acc = s.errorRate === null ? 0 : 1 - s.errorRate;
          const label = 'Задание ' + s.num + ': ' + OGE.TOPICS[s.num] + (s.errorRate === null ? '' : ', ошибок ' + pct(s.errorRate));
          return (
            '<a class="num-btn' +
            (s.weak ? ' weak' : '') +
            '" href="#/train/' +
            s.num +
            '" title="' +
            esc(label) +
            '" aria-label="' +
            esc(label) +
            '">' +
            s.num +
            '<span class="meter"><i style="width:' +
            Math.round(acc * 100) +
            '%"></i></span></a>'
          );
        })
        .join('') +
      '</div>'
    );
  }
  function durationPicker(selected) {
    return (
      '<div class="seg" role="group" aria-label="Время на вариант">' +
      DURATIONS.map((d) => '<button type="button" data-dur="' + d + '" aria-pressed="' + (d === selected ? 'true' : 'false') + '">' + d + ' мин</button>').join(
        '',
      ) +
      '</div>'
    );
  }
  function renderHome() {
    const data = OGE.stats.load();
    const summary = OGE.stats.summary(data);
    const total = summary.reduce((s, x) => s + x.attempts, 0);
    const weak = OGE.stats.weakest(data, 3);
    const v = lsGet(VKEY);
    const prefs = lsGet(PREFS) || {};
    const dur = DURATIONS.indexOf(prefs.duration) >= 0 ? prefs.duration : 90;
    let variantCta;
    if (v && !v.finishedAt) {
      const left = v.duration * 60 - (Date.now() - v.startedAt) / 1000;
      variantCta = '<a class="btn primary" href="#/variant">Продолжить вариант' + (left > 0 ? ' (осталось ' + fmtTime(left) + ')' : '') + '</a>';
    } else {
      variantCta = '<div class="select-row">' + durationPicker(dur) + '</div><button class="btn primary" data-act="start-variant">Начать вариант</button>';
    }
    const review = OGE.stats.reviewList(data);
    render(
      '<section class="hero"><h1>Тренажёр ОГЭ по математике</h1>' +
        '<p>Задания 1–19 первой части и 20–22 второй. Каждый раз — новые числа, ответ проверяется сразу, а при ошибке показывается пошаговый разбор.</p></section>' +
        installBanner() +
        '<div class="modes">' +
        '<section class="card mode"><h2><span class="mode-icon" aria-hidden="true">№</span>Тренировка по номеру задания</h2>' +
        '<p class="muted small">Выберите номер — задачи этого типа будут идти одна за другой. Полоска под номером — доля верных ответов.</p>' +
        numGrid(summary.filter((x) => x.num <= 19)) +
        '<h3 class="part-title">Вторая часть <span class="muted small">— развёрнутое решение</span></h3>' +
        numGrid(
          summary.filter((x) => x.num >= 20),
          'part2',
        ) +
        (total ? '<div class="btn-row" style="margin-top:12px"><a class="btn" href="#/train/weak">Тренировать слабые места</a></div>' : '') +
        '</section>' +
        reviewCard(review, data.reviewFixed) +
        '<section class="card mode"><h2><span class="mode-icon" aria-hidden="true">⏱</span>Полный вариант на время</h2>' +
        '<p class="muted small">19 заданий первой части, как на экзамене. Ответы проверяются после завершения, результат переводится в отметку.</p>' +
        variantCta +
        '</section>' +
        '<section class="card mode"><h2><span class="mode-icon" aria-hidden="true">▤</span>Статистика</h2>' +
        (total
          ? '<p>Решено задач: <b>' +
            total +
            '</b>.' +
            (weak.length
              ? ' Подтянуть в первую очередь: ' + weak.map((w) => '<a href="#/train/' + w.num + '">№' + w.num + '</a>').join(', ') + '.'
              : ' Явных слабых мест пока нет.') +
            '</p>'
          : '<p class="muted">Статистика появится после первых решённых задач.</p>') +
        '<a class="btn" href="#/stats">Открыть статистику</a></section>' +
        '</div>',
    );
  }

  // ---------- работа над ошибками ----------
  function streakDots(streak) {
    const goal = OGE.stats.REVIEW_GOAL;
    let out = '<span class="streak" aria-label="Верно подряд: ' + streak + ' из ' + goal + '">';
    for (let i = 0; i < goal; i++) out += '<i class="' + (i < streak ? 'on' : '') + '"></i>';
    return out + '</span>';
  }
  function reviewItems(list) {
    return (
      '<ul class="review-list">' +
      list
        .map(
          (e) =>
            '<li><span class="n">' +
            e.num +
            '</span><span class="review-main"><span>' +
            esc(OGE.TOPICS[e.num] || '') +
            '</span>' +
            (e.example ? '<span class="muted small review-ex">' + esc(e.example) + '</span>' : '') +
            '</span>' +
            streakDots(e.streak) +
            '</li>',
        )
        .join('') +
      '</ul>'
    );
  }
  function reviewCard(list, fixed) {
    const goal = OGE.stats.REVIEW_GOAL;
    let body;
    if (list.length) {
      body =
        '<p>Типов заданий с ошибками: <b>' +
        list.length +
        '</b>. Каждый будет повторяться, пока вы не решите его ' +
        goal +
        ' раза подряд верно.</p>' +
        '<a class="btn primary" href="#/train/review">Начать работу над ошибками</a>';
    } else {
      body =
        '<p class="muted">' +
        (fixed ? 'Все ошибки отработаны — отлично! ' : '') +
        'Сюда попадают типы заданий, в которых вы ошиблись (в тренировке или в варианте). Они повторяются, пока не будут решены ' +
        goal +
        ' раза подряд верно.</p>';
    }
    return '<section class="card mode"><h2><span class="mode-icon" aria-hidden="true">↻</span>Работа над ошибками</h2>' + body + '</section>';
  }

  // ---------- выбор номера ----------
  function pickerItem(s) {
    return (
      '<li><a href="#/train/' +
      s.num +
      '"><span class="n">' +
      s.num +
      '</span><span>' +
      esc(OGE.TOPICS[s.num]) +
      '</span>' +
      '<span class="stat' +
      (s.weak ? ' bad' : '') +
      '">' +
      (s.attempts ? 'ошибок ' + pct(s.errorRate) + ' · ' + s.attempts + ' ' + plural(s.attempts, 'попытка', 'попытки', 'попыток') : 'не решали') +
      '</span></a></li>'
    );
  }
  function renderTrainPicker() {
    const data = OGE.stats.load();
    const summary = OGE.stats.summary(data);
    const nReview = OGE.stats.reviewList(data).length;
    render(
      '<h1>Тренировка</h1><p class="muted">Выберите номер задания. Задачи генерируются заново при каждом запуске.</p>' +
        '<div class="btn-row" style="margin:12px 0 14px"><a class="btn primary" href="#/train/weak">Слабые места вперемешку</a>' +
        '<a class="btn" href="#/train/review">Работа над ошибками' +
        (nReview ? ' <span class="count">' + nReview + '</span>' : '') +
        '</a></div>' +
        '<h2 class="part-title">Первая часть</h2>' +
        '<ul class="num-list">' +
        summary
          .filter((s) => s.num <= 19)
          .map(pickerItem)
          .join('') +
        '</ul>' +
        '<h2 class="part-title">Вторая часть</h2>' +
        '<p class="muted small">На экзамене эти задания оформляются с полным решением (по 2 балла). В тренажёре вводится итоговый ответ, а разбор показывает, как записать решение.</p>' +
        '<ul class="num-list">' +
        summary
          .filter((s) => s.num >= 20)
          .map(pickerItem)
          .join('') +
        '</ul>',
    );
  }

  // ---------- тренировка ----------
  let train = null; // {mode, task, done, solved, correct, lastKey}
  const MIXED = { weak: 'Слабые места', review: 'Работа над ошибками' };

  function renderTrain(param) {
    const mode = MIXED[param] ? param : parseInt(param, 10);
    if (!MIXED[mode] && !OGE.TOPICS[mode]) {
      location.hash = '#/train';
      return;
    }
    if (!train || train.mode !== mode) train = { mode, solved: 0, correct: 0 };
    nextTask();
  }

  function nextTask() {
    const rng = OGE.createRng(OGE.randomSeed());
    if (train.mode === 'review') {
      // тип, который больше нельзя построить (например, после обновления), убираем из списка
      for (let tries = 0; tries < 50; tries++) {
        const data = OGE.stats.load();
        const e = OGE.stats.pickReview(data, rng, train.lastKey);
        if (!e) return renderReviewDone();
        try {
          train.task = OGE.generateTask(e.num, OGE.randomSeed(), OGE.optsForSubtype(e.num, e.subtype));
          train.task.subtype = e.subtype;
          train.lastKey = e.key;
          break;
        } catch {
          OGE.stats.dropReview(data, e.key);
        }
      }
    } else {
      const num = train.mode === 'weak' ? OGE.stats.pickWeighted(OGE.stats.load(), rng) : train.mode;
      train.task = OGE.generateTask(num, OGE.randomSeed());
    }
    train.done = false;
    drawTrain();
  }

  function renderReviewDone() {
    const data = OGE.stats.load();
    render(
      '<div class="crumbs"><a class="btn ghost" href="#/train">← Все задания</a></div>' +
        '<section class="card empty-state"><h1>Работа над ошибками</h1>' +
        (train && train.solved
          ? '<p class="verdict-big">Все ошибки отработаны!</p><p>За это занятие решено задач: ' + train.solved + ', верно: ' + train.correct + '.</p>'
          : '<p>Список пуст: ' + (data.reviewFixed ? 'все ошибки уже отработаны.' : 'ошибок пока не было.') + '</p>') +
        '<p class="muted small">Когда вы ошибётесь в тренировке или в варианте, тип задания появится здесь.</p>' +
        '<div class="btn-row" style="justify-content:center"><a class="btn primary" href="#/train">К тренировке</a><a class="btn" href="#/variant">Решить вариант</a></div></section>',
    );
  }

  function reviewProgressHtml(t) {
    const e = OGE.stats.reviewState(OGE.stats.load(), t.num, t.subtype);
    if (!e) return '';
    return '<div class="review-progress">Верно подряд: ' + streakDots(e.streak) + ' <span class="muted small">' + e.streak + ' из ' + OGE.stats.REVIEW_GOAL + '</span></div>';
  }

  function drawTrain() {
    const t = train.task;
    const left = train.mode === 'review' ? OGE.stats.reviewList(OGE.stats.load()).length : 0;
    render(
      '<div class="crumbs"><a class="btn ghost" href="#/train">← Все задания</a>' +
        (MIXED[train.mode] ? '<span class="mode-name">' + MIXED[train.mode] + (left ? ' · осталось типов: ' + left : '') + '</span>' : '') +
        '</div>' +
        '<article class="card task-card">' +
        '<div class="task-head"><span class="badge' +
        (t.num >= 20 ? ' part2' : '') +
        '">' +
        'Задание ' +
        t.num +
        '</span>' +
        '<span class="topic">' +
        esc(t.topic) +
        '</span>' +
        '<span class="session" aria-live="polite">' +
        (train.solved ? 'верно ' + train.correct + ' из ' + train.solved : '') +
        '</span></div>' +
        (train.mode === 'review' ? reviewProgressHtml(t) : '') +
        (t.context ? contextBlock(t.context, true) : '') +
        '<div class="task-body">' +
        t.html +
        '</div>' +
        '<form class="answer-form" novalidate>' +
        answerInput(t, 'id="ans"') +
        '<button class="btn primary" type="submit" data-act="check">Проверить</button>' +
        (answerHint(t) ? '<span class="answer-hint">' + answerHint(t) + '</span>' : '') +
        '</form>' +
        '<div class="fb-slot" aria-live="polite"></div>' +
        '<div class="btn-row next-row"><button type="button" class="btn ghost" data-act="giveup">Не знаю — показать решение</button></div>' +
        '</article>',
    );
    if (finePointer) document.getElementById('ans').focus();
  }

  function trainCheck(giveUp) {
    if (!train || train.done) return;
    const t = train.task;
    const input = document.getElementById('ans');
    const slot = app.querySelector('.fb-slot');
    let res;
    if (giveUp) res = { status: 'wrong', gaveUp: true };
    else {
      res = OGE.answer.check(t.answer, input.value);
      if (res.status === 'invalid') {
        slot.innerHTML = '<div class="feedback info">' + esc(res.message) + '</div>';
        input.focus();
        return;
      }
    }
    const ok = res.status === 'correct';
    train.done = true;
    train.solved++;
    if (ok) train.correct++;
    const before = OGE.stats.reviewState(OGE.stats.load(), t.num, t.subtype);
    const after = OGE.stats.reviewState(OGE.stats.record(t.num, t.subtype, ok), t.num, t.subtype);
    if (!ok) OGE.stats.describeReview(t.num, t.subtype, exampleText(t));
    input.readOnly = true;
    input.classList.add(ok ? 'ok' : 'err');
    app.querySelectorAll('.answer-form button').forEach((b) => (b.disabled = true));
    app.querySelector('.session').textContent = 'верно ' + train.correct + ' из ' + train.solved;
    let fb;
    const goal = OGE.stats.REVIEW_GOAL;
    let reviewNote = '';
    if (ok && before && !after) reviewNote = '<p class="review-note good">Тип задания отработан: ' + goal + ' верных ответа подряд. Он убран из «Работы над ошибками».</p>';
    else if (ok && after) reviewNote = '<p class="review-note">«Работа над ошибками»: верно подряд ' + after.streak + ' из ' + goal + '.</p>';
    else if (!ok && !before) reviewNote = '<p class="review-note">Этот тип задания добавлен в <a href="#/train/review">«Работу над ошибками»</a>.</p>';
    else if (!ok && before && before.streak) reviewNote = '<p class="review-note">Серия верных ответов сброшена: нужно ' + goal + ' подряд.</p>';
    if (train.mode === 'review') {
      const prog = app.querySelector('.review-progress');
      if (prog) prog.outerHTML = after ? reviewProgressHtml(t) : '<div class="review-progress done">Отработано ✓</div>';
    }
    if (ok) {
      fb =
        '<div class="feedback ok"><div class="verdict">Верно!</div>' +
        (res.note ? '<p>' + esc(res.note) + '</p>' : '') +
        reviewNote +
        '<details class="solution"><summary>Посмотреть решение</summary>' +
        stepsHtml(t) +
        '</details></div>';
    } else {
      fb =
        '<div class="feedback err"><div class="verdict">' +
        (res.gaveUp ? 'Разберём решение' : 'Неверно') +
        '</div>' +
        '<p>Правильный ответ: <b>' +
        esc(t.answerText) +
        '</b>' +
        (res.gaveUp ? '' : ', ваш ответ: ' + esc(input.value.trim())) +
        '.</p>' +
        reviewNote +
        stepsHtml(t) +
        '</div>';
    }
    slot.innerHTML = fb;
    const row = app.querySelector('.next-row');
    row.innerHTML = '<button type="button" class="btn primary" data-act="next">Следующая задача →</button>';
    const nextBtn = row.querySelector('button');
    if (finePointer || ok) nextBtn.focus({ preventScroll: !ok });
  }

  // Короткий пример условия для списка ошибок.
  function exampleText(t) {
    const div = document.createElement('div');
    div.innerHTML = t.html.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<div class="opts[\s\S]*$/, '');
    div.querySelectorAll('.hint-format').forEach((n) => n.remove());
    return div.textContent.replace(/\s+/g, ' ').trim();
  }

  // ---------- вариант ----------
  let variantCache = null; // {seed, tasks}
  function variantTasks(v) {
    if (!variantCache || variantCache.seed !== v.seed) variantCache = OGE.variant.create(v.seed);
    return variantCache.tasks;
  }

  function renderVariant() {
    const v = lsGet(VKEY);
    if (!v) return renderVariantSetup();
    if (v.finishedAt) return renderVariantResult(v);
    return renderVariantActive(v);
  }

  function renderVariantSetup() {
    const prefs = lsGet(PREFS) || {};
    const dur = DURATIONS.indexOf(prefs.duration) >= 0 ? prefs.duration : 90;
    const last = OGE.stats.load().variants.slice(-1)[0];
    render(
      '<h1>Вариант на время</h1>' +
        '<section class="card"><p>Вы получите 19 заданий первой части ОГЭ с новыми числами. Ответы можно менять до завершения; проверка — после нажатия «Завершить» или когда закончится время.</p>' +
        '<p class="muted small">На весь экзамен (две части) даётся 3 ч 55 мин. Для первой части обычно хватает 60–90 минут.</p>' +
        '<h3>Время на вариант</h3><div class="select-row">' +
        durationPicker(dur) +
        '</div>' +
        '<button class="btn primary" data-act="start-variant">Начать вариант</button>' +
        (last
          ? '<p class="muted small" style="margin-top:12px">Прошлый результат: ' + last.points + ' из ' + last.max + ' (отметка «' + last.grade + '»).</p>'
          : '') +
        '</section>',
    );
  }

  function startVariant() {
    const sel = app.querySelector('.seg button[aria-pressed="true"]');
    const duration = sel ? parseInt(sel.dataset.dur, 10) : 90;
    lsSet(PREFS, Object.assign(lsGet(PREFS) || {}, { duration }));
    lsSet(VKEY, { seed: OGE.randomSeed(), startedAt: Date.now(), duration, answers: {} });
    if (location.hash === '#/variant') renderVariant();
    else location.hash = '#/variant';
  }

  function renderVariantActive(v) {
    const tasks = variantTasks(v);
    const ctx = tasks[0].context;
    let body = '';
    tasks.forEach((t) => {
      if (t.num === 1 && ctx) body += contextBlock(ctx, true);
      body +=
        '<article class="card vtask" id="vt-' +
        t.num +
        '" data-num="' +
        t.num +
        '">' +
        '<div class="task-head"><span class="badge">Задание ' +
        t.num +
        '</span><span class="topic">' +
        esc(t.topic) +
        '</span></div>' +
        '<div class="task-body">' +
        t.html +
        '</div>' +
        '<div class="answer-form">' +
        answerInput(t, 'data-num="' + t.num + '"') +
        (answerHint(t) ? '<span class="answer-hint">' + answerHint(t) + '</span>' : '') +
        '</div>' +
        '</article>';
    });
    render(
      '<div class="variant-bar"><span class="timer" aria-label="Осталось времени"></span><span class="progress"></span>' +
        '<button type="button" class="btn" data-act="finish">Завершить</button></div>' +
        '<nav class="chips" aria-label="Переход к заданию">' +
        tasks.map((t) => '<button type="button" class="chip" data-goto="' + t.num + '">' + t.num + '</button>').join('') +
        '</nav>' +
        body +
        '<div class="btn-row"><button type="button" class="btn primary" data-act="finish">Завершить и проверить</button>' +
        '<button type="button" class="btn ghost danger" data-act="abandon">Бросить вариант</button></div>',
    );
    app.querySelectorAll('.vtask .answer-input').forEach((inp) => {
      inp.value = v.answers[inp.dataset.num] || '';
    });
    updateVariantProgress(v);
    tickTimer();
    timerId = setInterval(tickTimer, 1000);
  }

  function updateVariantProgress(v) {
    let n = 0;
    app.querySelectorAll('.chip').forEach((c) => {
      const has = !!(v.answers[c.dataset.goto] || '').trim();
      c.classList.toggle('done', has);
      if (has) n++;
    });
    const p = app.querySelector('.progress');
    if (p) p.textContent = 'Ответов: ' + n + ' из 19';
  }

  function tickTimer() {
    const v = lsGet(VKEY);
    if (!v || v.finishedAt) return stopTimer();
    const left = v.duration * 60 - (Date.now() - v.startedAt) / 1000;
    const el = app.querySelector('.timer');
    if (el) {
      el.textContent = fmtTime(left);
      el.classList.toggle('low', left < 300);
    }
    if (left <= 0) finishVariant(true);
  }

  function saveVariantAnswer(num, value) {
    const v = lsGet(VKEY);
    if (!v || v.finishedAt) return;
    v.answers[num] = value;
    lsSet(VKEY, v);
    updateVariantProgress(v);
  }

  function finishVariant(timeUp) {
    const v = lsGet(VKEY);
    if (!v || v.finishedAt) return;
    // забираем значения прямо из полей — на случай, если событие input не успело сработать
    app.querySelectorAll('.vtask .answer-input').forEach((inp) => (v.answers[inp.dataset.num] = inp.value));
    if (!timeUp) {
      const empty = 19 - Object.keys(v.answers).filter((k) => (v.answers[k] || '').trim()).length;
      const msg = empty
        ? 'Без ответа ' + empty + ' ' + plural(empty, 'задание', 'задания', 'заданий') + '. Завершить вариант?'
        : 'Завершить вариант и проверить ответы?';
      if (!window.confirm(msg)) return;
    }
    stopTimer();
    const tasks = variantTasks(v);
    const res = OGE.variant.score(tasks, v.answers);
    res.results.forEach((r, i) => {
      OGE.stats.record(r.num, tasks[i].subtype, r.status === 'correct');
      if (r.status !== 'correct') OGE.stats.describeReview(r.num, tasks[i].subtype, exampleText(tasks[i]));
    });
    v.finishedAt = Math.min(Date.now(), v.startedAt + v.duration * 60 * 1000);
    v.timeUp = !!timeUp;
    lsSet(VKEY, v);
    OGE.stats.recordVariant({
      date: v.finishedAt,
      points: res.points,
      max: res.max,
      grade: res.grade,
      geometry: res.geometryPoints,
      seconds: Math.round((v.finishedAt - v.startedAt) / 1000),
    });
    renderVariantResult(v);
  }

  function renderVariantResult(v) {
    const tasks = variantTasks(v);
    const res = OGE.variant.score(tasks, v.answers);
    const wrong = res.results.filter((r) => r.status !== 'correct');
    const gradeNote =
      res.grade === 2 && res.points >= 8 && res.geometryPoints < 2
        ? 'Баллов хватает на «3», но по геометрии (задания 15–19) нужно не меньше 2 баллов.'
        : res.grade < 4
          ? 'До отметки «' +
            (res.grade + 1) +
            '» не хватает ' +
            ((res.grade === 2 ? 8 : 15) - res.points) +
            ' ' +
            plural((res.grade === 2 ? 8 : 15) - res.points, 'балла', 'баллов', 'баллов') +
            '.'
          : 'Для «5» нужно 22 балла — их добирают заданиями второй части.';
    let list = '';
    res.results.forEach((r, i) => {
      const t = tasks[i];
      const mark = r.status === 'correct' ? '✓' : '✗';
      list +=
        '<li><div class="result-line"><span class="mark ' +
        r.status +
        '" aria-label="' +
        (r.status === 'correct' ? 'верно' : 'неверно') +
        '">' +
        mark +
        '</span>' +
        '<b>Задание ' +
        t.num +
        '</b><span class="muted small">' +
        esc(t.topic) +
        '</span></div>' +
        '<div class="small" style="margin:4px 0 0 36px">Ваш ответ: <b>' +
        (r.given.trim() ? esc(r.given.trim()) : '—') +
        '</b>' +
        (r.status === 'correct' ? '' : ' · верный: <b>' + esc(t.answerText) + '</b>') +
        '</div>' +
        '<details class="solution" style="margin-left:36px"><summary>Условие и разбор</summary>' +
        (t.context ? contextBlock(t.context, false) : '') +
        '<div class="task-body">' +
        t.html +
        '</div>' +
        stepsHtml(t) +
        '</details></li>';
    });
    render(
      '<h1>Результат варианта</h1>' +
        '<section class="card"><div class="score-row">' +
        '<div><div class="label">Первичный балл</div><div class="score-big">' +
        res.points +
        '<span class="muted" style="font-size:1.2rem"> из ' +
        res.max +
        '</span></div></div>' +
        '<div><div class="label">Отметка</div><div class="value">«' +
        res.grade +
        '»</div></div>' +
        '<div><div class="label">Геометрия (15–19)</div><div class="value">' +
        res.geometryPoints +
        ' из 5</div></div>' +
        '<div><div class="label">Время</div><div class="value">' +
        fmtTime((v.finishedAt - v.startedAt) / 1000) +
        (v.timeUp ? ' <span class="small muted">(время вышло)</span>' : '') +
        '</div></div>' +
        '</div><p class="small">' +
        gradeNote +
        '</p>' +
        '<p class="muted small">Отметка — по шкале ФИПИ: «3» от 8 баллов (из них не менее 2 по геометрии), «4» от 15, «5» от 22. Здесь учтена только первая часть.</p>' +
        '<div class="btn-row"><button class="btn primary" data-act="new-variant">Новый вариант</button><a class="btn" href="#/stats">Статистика</a></div></section>' +
        (wrong.length
          ? '<section class="card"><h2>Над чем поработать</h2><div class="chips">' +
            wrong
              .map((r) => '<a class="chip ' + r.status + '" href="#/train/' + r.num + '" title="Тренировать задание ' + r.num + '">' + r.num + '</a>')
              .join('') +
            '</div><p class="muted small">Нажмите на номер, чтобы потренировать такие задачи. Типы заданий с ошибками добавлены в «Работу над ошибками».</p>' +
            '<div class="btn-row"><a class="btn" href="#/train/review">Работа над ошибками</a></div></section>'
          : '') +
        '<section class="card"><h2>Задания</h2><ul class="result-list">' +
        list +
        '</ul></section>',
    );
  }

  // ---------- статистика ----------
  function renderStats() {
    const data = OGE.stats.load();
    const summary = OGE.stats.summary(data);
    const total = summary.reduce((s, x) => s + x.attempts, 0);
    const correct = summary.reduce((s, x) => s + x.correct, 0);
    const variants = data.variants;
    if (!total) {
      render(
        '<h1>Статистика</h1><section class="card empty-state"><p>Пока нет решённых задач.</p>' +
          '<div class="btn-row" style="justify-content:center"><a class="btn primary" href="#/train">Начать тренировку</a><a class="btn" href="#/variant">Решить вариант</a></div></section>',
      );
      return;
    }
    const weak = OGE.stats.weakest(data, 3);
    const sortBy = (lsGet(PREFS) || {}).sort === 'errors' ? 'errors' : 'num';
    const best = variants.length ? Math.max(...variants.map((x) => x.points)) : null;
    const table =
      '<div class="table-wrap"><table class="data"><thead><tr><th>№</th><th>Тема</th><th>Попыток</th><th>Ошибок всего</th><th>Ошибок в последних</th></tr></thead><tbody>' +
      summary
        .map(
          (s) =>
            '<tr><td>' +
            s.num +
            '</td><td style="text-align:left">' +
            esc(OGE.TOPICS[s.num]) +
            '</td><td>' +
            s.attempts +
            '</td><td>' +
            s.errors +
            '</td><td>' +
            (s.recentN ? s.recentErrors + ' из ' + s.recentN + ' (' + pct(s.errorRate) + ')' : '—') +
            '</td></tr>',
        )
        .join('') +
      '</tbody></table></div>';
    render(
      '<h1>Статистика</h1>' +
        '<div class="tiles">' +
        tile('Решено задач', total) +
        tile('Верных ответов', pct(correct / total)) +
        tile('Вариантов', variants.length) +
        (best !== null ? tile('Лучший вариант', best + ' из 19') : '') +
        '</div>' +
        '<section class="card"><h2>Доля ошибок по номерам заданий</h2>' +
        '<p class="muted small">По последним ' +
        OGE.stats.RECENT +
        ' попыткам каждого номера — так виден текущий уровень, а не старые ошибки. Нажмите на строку, чтобы потренировать это задание.</p>' +
        '<div class="select-row"><div class="seg seg-2" role="group" aria-label="Порядок">' +
        '<button type="button" data-sort="num" aria-pressed="' +
        (sortBy === 'num') +
        '">По номеру</button>' +
        '<button type="button" data-sort="errors" aria-pressed="' +
        (sortBy === 'errors') +
        '">Сначала слабые</button></div></div>' +
        OGE.charts.errorBars(summary, sortBy) +
        '<div class="legend"><span><span class="sw base"></span>доля ошибок</span><span><span class="sw weak"></span>нужно подтянуть (от ' +
        pct(OGE.stats.WEAK_RATE) +
        ' ошибок при ' +
        OGE.stats.MIN_ATTEMPTS +
        '+ попытках)</span><span><span class="sw line"></span>порог ' +
        pct(OGE.stats.WEAK_RATE) +
        '</span></div>' +
        '<details style="margin-top:10px"><summary>Таблица</summary>' +
        table +
        '</details>' +
        '</section>' +
        '<section class="card"><h2>Что подтянуть в первую очередь</h2>' +
        (weak.length
          ? '<ul class="num-list">' +
            weak
              .map(
                (w) =>
                  '<li><a href="#/train/' +
                  w.num +
                  '"><span class="n">' +
                  w.num +
                  '</span><span>' +
                  esc(OGE.TOPICS[w.num]) +
                  ' <span class="muted small">(ошибок ' +
                  w.recentErrors +
                  ' из ' +
                  w.recentN +
                  ')</span></span>' +
                  '<span class="stat bad">' +
                  pct(w.errorRate) +
                  ' →</span></a></li>',
              )
              .join('') +
            '</ul><div class="btn-row" style="margin-top:12px"><a class="btn primary" href="#/train/weak">Слабые места вперемешку</a></div>'
          : '<p class="muted">Пока нет заданий, где ошибок заметно больше, чем в остальных. Решите по 3–5 задач каждого номера, чтобы картина стала точнее.</p>') +
        '</section>' +
        reviewSection(data) +
        (variants.length
          ? '<section class="card"><h2>Пробные варианты</h2><p class="muted small">Первичный балл за первую часть (из 19). Линии — границы отметок «3» и «4».</p>' +
            '<div class="chart-wrap">' +
            OGE.charts.scoreChart(variants, 19) +
            '</div></section>'
          : '') +
        '<div class="btn-row"><button type="button" class="btn ghost danger" data-act="reset-stats">Сбросить статистику</button></div>',
    );
  }
  function reviewSection(data) {
    const list = OGE.stats.reviewList(data);
    return (
      '<section class="card"><h2>Работа над ошибками</h2>' +
      (list.length
        ? '<p class="muted small">Типы заданий, в которых были ошибки. Кружки — верные ответы подряд; после ' +
          OGE.stats.REVIEW_GOAL +
          ' тип исчезает из списка.' +
          (data.reviewFixed ? ' Уже отработано: ' + data.reviewFixed + '.' : '') +
          '</p>' +
          reviewItems(list) +
          '<div class="btn-row" style="margin-top:12px"><a class="btn primary" href="#/train/review">Начать работу над ошибками</a></div>'
        : '<p class="muted">Список пуст' + (data.reviewFixed ? ': отработано типов — ' + data.reviewFixed + '.' : '.') + '</p>') +
      '</section>'
    );
  }
  function tile(label, value) {
    return '<div class="tile-stat"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>';
  }

  // ---------- установка как приложение (PWA) ----------
  let installPrompt = null; // событие beforeinstallprompt (Chrome, Edge, Яндекс Браузер на Android и ПК)
  const isStandalone = () =>
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const offlineCapable = () => 'serviceWorker' in navigator && /^https?:$/.test(location.protocol);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    const slot = document.querySelector('.install-slot');
    if (slot) slot.outerHTML = installBanner();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    const slot = document.querySelector('.install-slot');
    if (slot) slot.outerHTML = installBanner();
  });

  function installBanner() {
    if (isStandalone() || (lsGet(PREFS) || {}).hideInstall) return '<div class="install-slot" hidden></div>';
    return (
      '<div class="install-slot card install-card"><div><b>Тренажёр можно установить на телефон</b>' +
      '<p class="muted small">Он появится на главном экране как приложение и будет работать без интернета.</p></div>' +
      '<div class="btn-row">' +
      (installPrompt ? '<button type="button" class="btn primary" data-act="install">Установить</button>' : '<a class="btn primary" href="#/install">Как установить</a>') +
      '<button type="button" class="btn ghost" data-act="hide-install">Скрыть</button></div></div>'
    );
  }

  async function offlineStatus() {
    if (!offlineCapable()) {
      return location.protocol === 'file:'
        ? 'Сайт открыт как файл с диска — он и так работает без интернета, но установить его как приложение можно только по ссылке (https://…), например с GitHub Pages.'
        : 'Этот браузер не поддерживает работу без интернета.';
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const keys = window.caches ? await caches.keys() : [];
      if (reg && reg.active && keys.some((k) => k.indexOf('oge-trener') === 0)) return '✓ Файлы тренажёра сохранены на устройстве — он откроется и без интернета.';
      return 'Файлы ещё сохраняются. Обновите страницу через несколько секунд, пока есть интернет.';
    } catch {
      return 'Не удалось проверить офлайн-режим.';
    }
  }

  function renderInstall() {
    setNav('');
    const standalone = isStandalone();
    render(
      '<h1>Установка на телефон</h1>' +
        (standalone ? '<section class="card feedback ok"><div class="verdict">Тренажёр уже установлен</div><p>Вы открыли его как приложение.</p></section>' : '') +
        '<section class="card"><h2>Работа без интернета</h2><p class="offline-status muted">Проверяем…</p>' +
        '<p class="small muted">Решённые задачи, статистика и список ошибок хранятся только на этом устройстве (в браузере). Если очистить данные браузера или удалить приложение, они пропадут.</p></section>' +
        (installPrompt && !standalone ? '<div class="btn-row"><button type="button" class="btn primary" data-act="install">Установить сейчас</button></div>' : '') +
        '<section class="card"><h2>Android (Chrome, Яндекс Браузер, Samsung Internet)</h2><ol>' +
        '<li>Откройте сайт тренажёра в браузере (нужен интернет только в первый раз).</li>' +
        '<li>Нажмите меню <b>⋮</b> в правом верхнем углу.</li>' +
        '<li>Выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b>.</li>' +
        '<li>На главном экране появится значок «ОГЭ матем.». Открывайте тренажёр с него — даже без интернета.</li></ol></section>' +
        '<section class="card"><h2>iPhone и iPad (Safari)</h2><ol>' +
        '<li>Откройте сайт в <b>Safari</b> (в других браузерах на iPhone пункта может не быть).</li>' +
        '<li>Нажмите кнопку <b>«Поделиться»</b> (квадрат со стрелкой вверх) внизу экрана.</li>' +
        '<li>Пролистайте и выберите <b>«На экран „Домой“»</b>, затем <b>«Добавить»</b>.</li></ol></section>' +
        '<section class="card"><h2>Компьютер (Chrome, Edge)</h2><p>В адресной строке справа появится значок установки (монитор со стрелкой) — нажмите его. Или: меню → <b>«Установить ОГЭ-тренажёр»</b> / <b>«Приложения» → «Установить этот сайт как приложение»</b>.</p></section>',
    );
    offlineStatus().then((msg) => {
      const el = app.querySelector('.offline-status');
      if (el) el.textContent = msg;
    });
  }

  // Индикатор «нет сети» в шапке.
  function updateNet() {
    const el = document.querySelector('.net-status');
    if (el) el.hidden = navigator.onLine !== false;
  }
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);
  updateNet();

  // ---------- подсказки на графиках ----------
  function showTip(target, x, y) {
    tooltip.textContent = target.getAttribute('data-tip');
    tooltip.hidden = false;
    const r = tooltip.getBoundingClientRect();
    if (x === undefined) {
      const b = target.getBoundingClientRect();
      x = b.left + b.width / 2;
      y = b.top;
    }
    let left = x - r.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - r.width - 8));
    let top = y - r.height - 12;
    if (top < 8) top = y + 16;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
  function hideTip() {
    if (tooltip) tooltip.hidden = true;
  }
  app.addEventListener('pointermove', (e) => {
    const g = e.target.closest && e.target.closest('[data-tip]');
    if (g) showTip(g, e.clientX, e.clientY);
    else hideTip();
  });
  app.addEventListener('pointerleave', hideTip);
  app.addEventListener('focusin', (e) => {
    const g = e.target.closest && e.target.closest('[data-tip]');
    if (g) showTip(g);
  });
  app.addEventListener('focusout', hideTip);
  window.addEventListener('scroll', hideTip, { passive: true });

  // ---------- события ----------
  app.addEventListener('click', (e) => {
    const t = e.target;
    const tipEl = t.closest('[data-tip]');
    if (tipEl) {
      showTip(tipEl, e.clientX, e.clientY);
      return;
    }
    const opt = t.closest('.opt');
    if (opt) {
      const scope = opt.closest('.vtask') || opt.closest('.task-card');
      const input = scope && scope.querySelector('.answer-input');
      if (input && !input.readOnly) {
        input.value = opt.dataset.val;
        scope.querySelectorAll('.opt').forEach((o) => o.classList.toggle('chosen', o === opt));
        if (input.dataset.num) saveVariantAnswer(input.dataset.num, input.value);
      }
      return;
    }
    const dur = t.closest('[data-dur]');
    if (dur) {
      dur.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === dur ? 'true' : 'false'));
      lsSet(PREFS, Object.assign(lsGet(PREFS) || {}, { duration: parseInt(dur.dataset.dur, 10) }));
      return;
    }
    const sortBtn = t.closest('[data-sort]');
    if (sortBtn) {
      lsSet(PREFS, Object.assign(lsGet(PREFS) || {}, { sort: sortBtn.dataset.sort }));
      const y = window.scrollY;
      renderStats();
      window.scrollTo(0, y);
      return;
    }
    const go = t.closest('[data-goto]');
    if (go) {
      const el = document.getElementById('vt-' + go.dataset.goto);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const inp = el.querySelector('.answer-input');
        if (inp && finePointer) setTimeout(() => inp.focus({ preventScroll: true }), 300);
      }
      return;
    }
    const act = t.closest('[data-act]');
    if (!act) return;
    switch (act.dataset.act) {
      case 'giveup':
        trainCheck(true);
        break;
      case 'next':
        nextTask();
        break;
      case 'sign': {
        const input = act.parentElement.querySelector('.answer-input');
        if (input && !input.readOnly) {
          toggleSign(input);
          if (input.dataset.num) saveVariantAnswer(input.dataset.num, input.value);
        }
        break;
      }
      case 'ins': {
        const input = act.closest('.answer-form').querySelector('.answer-input');
        if (input && !input.readOnly) {
          insertAtCursor(input, act.dataset.ins);
          if (input.dataset.num) saveVariantAnswer(input.dataset.num, input.value);
        }
        break;
      }
      case 'install':
        if (installPrompt) {
          installPrompt.prompt();
          installPrompt.userChoice.finally(() => {
            installPrompt = null;
            const slot = document.querySelector('.install-slot');
            if (slot) slot.outerHTML = installBanner();
          });
        }
        break;
      case 'hide-install': {
        lsSet(PREFS, Object.assign(lsGet(PREFS) || {}, { hideInstall: true }));
        const slot = act.closest('.install-slot');
        if (slot) slot.outerHTML = '<div class="install-slot" hidden></div>';
        break;
      }
      case 'start-variant':
        startVariant();
        break;
      case 'finish':
        finishVariant(false);
        break;
      case 'abandon':
        if (window.confirm('Бросить вариант? Ответы не будут засчитаны.')) {
          lsDel(VKEY);
          renderVariant();
        }
        break;
      case 'new-variant':
        lsDel(VKEY);
        renderVariantSetup();
        break;
      case 'reset-stats':
        if (window.confirm('Удалить всю статистику? Это действие нельзя отменить.')) {
          OGE.stats.reset();
          renderStats();
        }
        break;
    }
  });

  // кнопки «;», «−», «/» не должны забирать фокус у поля ответа (иначе на телефоне прячется клавиатура)
  app.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest('.ins-btn')) e.preventDefault();
  });

  app.addEventListener('submit', (e) => {
    e.preventDefault();
    if (train && train.done) nextTask();
    else trainCheck(false);
  });

  app.addEventListener('input', (e) => {
    const inp = e.target;
    if (inp.classList && inp.classList.contains('answer-input') && inp.dataset.num) {
      saveVariantAnswer(inp.dataset.num, inp.value);
      const scope = inp.closest('.vtask');
      if (scope) scope.querySelectorAll('.opt').forEach((o) => o.classList.toggle('chosen', o.dataset.val === inp.value.trim()));
    }
  });

  // Enter в поле варианта — переход к следующему заданию
  app.addEventListener('keydown', (e) => {
    const inp = e.target;
    if (e.key !== 'Enter' || !inp.dataset || !inp.dataset.num) return;
    e.preventDefault();
    const next = document.getElementById('vt-' + (parseInt(inp.dataset.num, 10) + 1));
    if (next) {
      next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const ni = next.querySelector('.answer-input');
      if (ni) ni.focus({ preventScroll: true });
    } else inp.blur();
  });

  window.addEventListener('hashchange', route);
  route();

  // Офлайн-режим: кэширование файлов сайта (работает только на http/https).
  if (offlineCapable()) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {
        /* офлайн-режим необязателен */
      });
    });
  }
})();
