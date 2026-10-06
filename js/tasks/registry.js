/*
 * Реестр генераторов. Каждый генератор регистрируется под номером задания
 * и по объекту Rng строит задачу:
 *   {
 *     subtype,          — внутренний код разновидности (для тестов и статистики)
 *     html,             — условие (HTML)
 *     context,          — общий текст для заданий 1–5 {key, title, html}
 *     answer,           — {type: 'number'|'seq'|'set'|'list'|'pairs', value}
 *     steps,            — пошаговый разбор: массив HTML-фрагментов
 *     data,             — исходные параметры: по ним автотесты независимо
 *                         пересчитывают ответ
 *   }
 */
(function (root) {
  'use strict';
  const OGE = root.OGE || (root.OGE = {});

  OGE.TOPICS = {
    1: 'Практическая: план, таблица',
    2: 'Практическая: вычисления',
    3: 'Практическая: размеры, площади',
    4: 'Практическая: расстояния, сравнение',
    5: 'Практическая: выбор, проценты',
    6: 'Вычисления',
    7: 'Числа на координатной прямой',
    8: 'Степени и корни',
    9: 'Уравнения',
    10: 'Теория вероятностей',
    11: 'Графики функций',
    12: 'Расчёты по формулам',
    13: 'Неравенства',
    14: 'Прогрессии в задачах',
    15: 'Треугольники',
    16: 'Окружность',
    17: 'Четырёхугольники',
    18: 'Фигуры на клетчатой бумаге',
    19: 'Геометрические утверждения',
    20: 'Уравнения, неравенства, системы',
    21: 'Текстовые задачи',
    22: 'Графики функций с параметром',
  };
  OGE.TASK_NUMBERS = Object.keys(OGE.TOPICS).map(Number);
  // Первая часть (краткий ответ, 1 балл) и вторая часть (развёрнутое решение, 2 балла).
  OGE.PART1 = OGE.TASK_NUMBERS.filter((n) => n <= 19);
  OGE.PART2 = OGE.TASK_NUMBERS.filter((n) => n >= 20);
  // Задания по геометрии (для условия «не менее 2 баллов по геометрии»).
  OGE.GEOMETRY = [15, 16, 17, 18, 19];

  const generators = {};

  // subtypes — список разновидностей (для тестов: каждую проверяем отдельно).
  OGE.SUBTYPES = {};
  OGE.registerTask = function (num, gen, subtypes) {
    generators[num] = gen;
    OGE.SUBTYPES[num] = subtypes || [];
  };
  OGE.hasGenerator = (num) => !!generators[num];

  // Параметры генератора, чтобы получить задачу той же разновидности
  // (режим «Работа над ошибками»). У заданий 1–5 разновидность — «сюжет-номер».
  OGE.optsForSubtype = function (num, subtype) {
    if (!subtype) return {};
    if (num <= 5) return { scenario: String(subtype).split('-')[0] };
    return { subtype };
  };

  // Строит задачу номера num по зерну seed (одинаковое зерно — одинаковая задача).
  OGE.generateTask = function (num, seed, opts) {
    const gen = generators[num];
    if (!gen) throw new Error('Нет генератора для задания ' + num);
    const s = seed === undefined ? OGE.randomSeed() : seed >>> 0;
    const rng = OGE.createRng(s);
    const t = gen(rng, opts || {});
    t.num = num;
    t.seed = s;
    t.topic = OGE.TOPICS[num];
    t.steps = t.steps.filter(Boolean);
    t.answer = OGE.answer.normalize(t.answer);
    t.answerText = OGE.answer.display(t.answer);
    return t;
  };

  // Варианты ответа-кнопки (задания 7 и 13). Нажатие подставляет номер в поле ответа.
  OGE.optionsHtml = function (items, cls) {
    return (
      '<div class="opts ' +
      (cls || '') +
      '">' +
      items
        .map(
          (html, i) =>
            '<button type="button" class="opt" data-val="' +
            (i + 1) +
            '"><span class="opt-n">' +
            (i + 1) +
            ')</span><span class="opt-body">' +
            html +
            '</span></button>',
        )
        .join('') +
      '</div>'
    );
  };

  // Последняя строка разбора с ответом.
  OGE.answerLine = function (value) {
    return '<p class="ans-line">Ответ: <b>' + (typeof value === 'string' ? value : OGE.fmt(value)) + '</b></p>';
  };
})(globalThis);
