/*
 * Полный вариант первой части (задания 1–19) и его проверка.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE;

  // Шкала перевода первичного балла в отметку (ФИПИ, ОГЭ по математике 2024–2026).
  // Для «3» и выше нужно не менее 2 баллов за геометрию (задания 15–19 и 23–25).
  const SCALE = [
    { min: 22, grade: 5 },
    { min: 15, grade: 4 },
    { min: 8, grade: 3 },
    { min: 0, grade: 2 },
  ];

  function create(seed) {
    const s = seed === undefined ? OGE.randomSeed() : seed >>> 0;
    // задания 1–5 строятся из одного зерна — общий сюжет
    const practiceSeed = OGE.deriveSeed(s, 'practice');
    const tasks = OGE.TASK_NUMBERS.map((n) => OGE.generateTask(n, n <= 5 ? practiceSeed : OGE.deriveSeed(s, n)));
    return { seed: s, tasks };
  }

  function grade(points, geometryPoints) {
    const row = SCALE.find((r) => points >= r.min);
    let g = row.grade;
    if (g >= 3 && geometryPoints < 2) g = 2;
    return g;
  }

  // answers: {номер: строка ответа}
  function score(tasks, answers) {
    const results = tasks.map((t) => {
      const given = (answers && answers[t.num]) || '';
      let status = 'empty';
      if (given.trim()) {
        const r = OGE.answer.check(t.answer, given);
        status = r.status === 'correct' ? 'correct' : 'wrong';
      }
      return { num: t.num, status, given, expected: t.answerText };
    });
    const points = results.filter((r) => r.status === 'correct').length;
    const geometryPoints = results.filter((r) => r.status === 'correct' && OGE.GEOMETRY.indexOf(r.num) >= 0).length;
    return { results, points, max: tasks.length, geometryPoints, grade: grade(points, geometryPoints) };
  }

  OGE.variant = { create, score, grade, SCALE };
})(globalThis);
