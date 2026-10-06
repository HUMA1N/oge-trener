/*
 * Статистика ошибок по номерам заданий. Хранится в localStorage браузера.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const KEY = 'oge-trener:stats:v1';
  const RECENT = 20; // по скольким последним попыткам считается доля ошибок
  const WEAK_RATE = 0.4; // с какой доли ошибок задание считается «слабым»
  const MIN_ATTEMPTS = 3;
  const REVIEW_GOAL = 3; // сколько раз подряд решить верно, чтобы тип ушёл из «Работы над ошибками»

  function defaultStorage() {
    try {
      return root.localStorage || null;
    } catch {
      return null;
    }
  }

  function empty() {
    return { v: 1, tasks: {}, variants: [], review: {}, reviewFixed: 0 };
  }

  // Ключ типа задания: номер + разновидность.
  function reviewKey(num, subtype) {
    return num + '|' + subtype;
  }

  // Данные, сохранённые до появления «Работы над ошибками»: в список попадают
  // разновидности, в которых уже были ошибки.
  function seedReview(d) {
    d.review = {};
    Object.keys(d.tasks).forEach((num) => {
      const subs = (d.tasks[num] && d.tasks[num].subtypes) || {};
      Object.keys(subs).forEach((sub) => {
        const s = subs[sub];
        if (s && s.a > s.c) d.review[reviewKey(num, sub)] = { num: +num, subtype: sub, streak: 0, misses: s.a - s.c, addedAt: d.tasks[num].lastAt || 0, lastAt: 0 };
      });
    });
  }

  function load(storage) {
    const st = storage === undefined ? defaultStorage() : storage;
    if (!st) return empty();
    try {
      const raw = st.getItem(KEY);
      if (!raw) return empty();
      const d = JSON.parse(raw);
      if (!d || d.v !== 1 || typeof d.tasks !== 'object') return empty();
      d.variants = Array.isArray(d.variants) ? d.variants : [];
      if (!d.review || typeof d.review !== 'object') seedReview(d);
      d.reviewFixed = d.reviewFixed || 0;
      return d;
    } catch {
      return empty();
    }
  }

  function save(data, storage) {
    const st = storage === undefined ? defaultStorage() : storage;
    if (!st) return false;
    try {
      st.setItem(KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  // Записать попытку решения задания num.
  function record(num, subtype, ok, storage, now) {
    const d = load(storage);
    const t = d.tasks[num] || (d.tasks[num] = { attempts: 0, correct: 0, recent: [], subtypes: {}, lastAt: 0 });
    t.attempts++;
    if (ok) t.correct++;
    t.recent.push(ok ? 1 : 0);
    if (t.recent.length > RECENT) t.recent = t.recent.slice(-RECENT);
    const s = t.subtypes[subtype] || (t.subtypes[subtype] = { a: 0, c: 0 });
    s.a++;
    if (ok) s.c++;
    t.lastAt = now || Date.now();
    updateReview(d, num, subtype, ok, t.lastAt);
    save(d, storage);
    return d;
  }

  // Ошибка добавляет тип в «Работу над ошибками» и обнуляет серию верных ответов;
  // верный ответ продлевает серию, после REVIEW_GOAL подряд тип считается отработанным.
  function updateReview(d, num, subtype, ok, now) {
    const key = reviewKey(num, subtype);
    const e = d.review[key];
    if (!ok) {
      if (e) {
        e.streak = 0;
        e.misses++;
        e.lastAt = now;
      } else d.review[key] = { num: +num, subtype, streak: 0, misses: 1, addedAt: now, lastAt: now };
      return;
    }
    if (!e) return;
    e.streak++;
    e.lastAt = now;
    if (e.streak >= REVIEW_GOAL) {
      delete d.review[key];
      d.reviewFixed++;
    }
  }

  // Состояние типа задания в «Работе над ошибками»: null, если его там нет.
  function reviewState(d, num, subtype) {
    return d.review[reviewKey(num, subtype)] || null;
  }

  // Список типов с ошибками: по номеру задания, затем по времени добавления.
  function reviewList(d) {
    return Object.keys(d.review)
      .map((k) => Object.assign({ key: k }, d.review[k]))
      .sort((a, b) => a.num - b.num || a.addedAt - b.addedAt);
  }

  // Следующий тип для повторения. Тот же тип, что только что был, не повторяется
  // (если есть другие); типы с меньшей серией верных ответов выпадают чаще.
  function pickReview(d, rng, lastKey) {
    let list = reviewList(d);
    if (!list.length) return null;
    if (list.length > 1 && lastKey) list = list.filter((e) => e.key !== lastKey);
    return rng.weighted(
      list,
      list.map((e) => REVIEW_GOAL + 1 - e.streak),
    );
  }

  // Убрать тип из списка без решения (например, если такой разновидности больше нет).
  function dropReview(d, key, storage) {
    delete d.review[key];
    save(d, storage);
  }

  // Короткое описание задачи для списка ошибок (пример условия).
  function describeReview(num, subtype, text, storage) {
    const d = load(storage);
    const e = d.review[reviewKey(num, subtype)];
    if (!e) return d;
    e.example = String(text).slice(0, 90);
    save(d, storage);
    return d;
  }

  function recordVariant(entry, storage) {
    const d = load(storage);
    d.variants.push(entry);
    if (d.variants.length > 100) d.variants = d.variants.slice(-100);
    save(d, storage);
    return d;
  }

  function reset(storage) {
    save(empty(), storage);
  }

  // Сводка по всем номерам заданий: доля ошибок за последние попытки.
  function summary(d) {
    return OGE.TASK_NUMBERS.map((num) => {
      const t = d.tasks[num];
      if (!t || !t.attempts) {
        return { num, attempts: 0, correct: 0, errors: 0, recentN: 0, recentErrors: 0, errorRate: null, weak: false };
      }
      const recentErrors = t.recent.filter((x) => !x).length;
      const rate = recentErrors / t.recent.length;
      return {
        num,
        attempts: t.attempts,
        correct: t.correct,
        errors: t.attempts - t.correct,
        recentN: t.recent.length,
        recentErrors,
        errorRate: rate,
        weak: t.recent.length >= MIN_ATTEMPTS && rate >= WEAK_RATE,
      };
    });
  }

  // Задания, которые стоит подтянуть: сначала с наибольшей долей ошибок.
  function weakest(d, k) {
    return summary(d)
      .filter((s) => s.recentN >= MIN_ATTEMPTS && s.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate || b.recentErrors - a.recentErrors || a.num - b.num)
      .slice(0, k || 3);
  }

  // Номер задания для режима «слабые места»: вес растёт с долей ошибок,
  // нерешённые ни разу задания тоже попадаются.
  function pickWeighted(d, rng) {
    const s = summary(d);
    const weights = s.map((x) => (x.errorRate === null ? 0.6 : 0.15 + x.errorRate * 2));
    return rng.weighted(
      s.map((x) => x.num),
      weights,
    );
  }

  OGE.stats = {
    KEY,
    RECENT,
    WEAK_RATE,
    MIN_ATTEMPTS,
    REVIEW_GOAL,
    load,
    save,
    record,
    recordVariant,
    reset,
    summary,
    weakest,
    pickWeighted,
    empty,
    reviewKey,
    reviewState,
    reviewList,
    pickReview,
    dropReview,
    describeReview,
  };
})(globalThis);
