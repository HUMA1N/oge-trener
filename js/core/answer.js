/*
 * Проверка ответа ученика.
 * Типы ответа:
 *   number — число (целое или конечная десятичная дробь), сравнивается точно;
 *   seq    — последовательность цифр, порядок важен (задание 11, соответствия);
 *   set    — набор номеров, порядок не важен (задание 19);
 *   list   — набор чисел через «;», порядок не важен (корни уравнения, значения параметра);
 *   pairs  — набор пар чисел (решения системы), например (1; 2), (−3; 4).
 * Во второй части можно писать и обыкновенные дроби: 1/3, −7/2.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE || (root.OGE = {});
  const Frac = OGE.Frac;

  function stripSpaces(s) {
    return String(s || '').replace(/[\s\u00a0\u202f]/g, '');
  }

  // Строка ученика → Frac или null. Принимает «2,5», «2.5», «−3», «-,5».
  function parseNumber(input) {
    let s = stripSpaces(input)
      .replace(/[\u2212\u2012\u2013\u2014]/g, '-')
      .replace(',', '.');
    if (!/^[-+]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;
    if (s[0] === '+') s = s.slice(1);
    s = s.replace(/^(-?)\./, '$10.').replace(/\.$/, '');
    if (s.replace(/\D/g, '').length > 15) return null;
    return Frac.parse(s);
  }

  // Число второй части: десятичная дробь или обыкновенная «a/b».
  function parseLoose(input) {
    const s = stripSpaces(input).replace(/[\u2212\u2012\u2013\u2014]/g, '-');
    const m = /^([-+]?)(\d{1,9})\/(\d{1,9})$/.exec(s);
    if (m) {
      if (+m[3] === 0) return null;
      return new Frac((m[1] === '-' ? -1 : 1) * +m[2], +m[3]);
    }
    return parseNumber(s);
  }

  // Упорядочивает значения ответа (по возрастанию), чтобы показывать их одинаково.
  function normList(values) {
    return values.map((v) => Frac.of(v)).sort((a, b) => a.cmp(b));
  }
  function normPairs(pairs) {
    return pairs.map((p) => [Frac.of(p[0]), Frac.of(p[1])]).sort((a, b) => a[0].cmp(b[0]) || a[1].cmp(b[1]));
  }

  // Убирает подписи вида «x = », «x₁ = », «m = », «m ∈ {…}».
  function stripLabels(s) {
    return s
      .replace(/[a-zа-я]\s*[\d₀-₉]*\s*=/gi, '')
      .replace(/[{}∈]/g, '');
  }

  // Строка с числами через «;» → массив Frac или строка-ошибка.
  function parseList(input) {
    let s = stripLabels(String(input).trim());
    let parts;
    if (s.indexOf(';') >= 0) parts = s.split(';');
    else if (/,\s/.test(s)) parts = s.split(/,\s+/); // «2, −3» — запятая с пробелом как разделитель
    else parts = [s];
    parts = parts.map((x) => x.trim()).filter((x) => x);
    if (!parts.length) return 'Введите ответ.';
    const out = [];
    for (const x of parts) {
      const v = parseLoose(x);
      if (!v) return 'Не удалось прочитать «' + x + '». Запишите числа через точку с запятой, например: −2; 3,5.';
      out.push(v);
    }
    return out;
  }

  function parsePairs(input) {
    const s = stripLabels(String(input).trim());
    const groups = [];
    if (/[()]/.test(s)) {
      const re = /\(([^()]*)\)/g;
      let m;
      let rest = s;
      while ((m = re.exec(s))) groups.push(m[1]);
      rest = s.replace(re, '').replace(/[\s,;и]/g, '');
      if (rest) return 'Запишите пары в скобках, например: (1; 2), (−3; 4).';
    } else {
      const nums = s.split(';').map((x) => x.trim());
      if (nums.length % 2) return 'Запишите пары в скобках, например: (1; 2), (−3; 4).';
      for (let i = 0; i < nums.length; i += 2) groups.push(nums[i] + ';' + nums[i + 1]);
    }
    if (!groups.length) return 'Введите ответ.';
    const out = [];
    for (const g of groups) {
      const xs = g.split(';');
      if (xs.length !== 2) return 'В каждой паре два числа через точку с запятой: (x; y).';
      const a = parseLoose(xs[0]);
      const b = parseLoose(xs[1]);
      if (!a || !b) return 'Не удалось прочитать пару «(' + g + ')». Пример записи: (1; −2,5).';
      out.push([a, b]);
    }
    return out;
  }

  function sameList(a, b, eq) {
    if (a.length !== b.length) return false;
    const used = b.map(() => false);
    return a.every((x) => {
      const i = b.findIndex((y, k) => !used[k] && eq(x, y));
      if (i < 0) return false;
      used[i] = true;
      return true;
    });
  }

  // Копия ответа в каноническом виде (числа — Frac, наборы — по возрастанию).
  function normalize(answer) {
    if (answer.type === 'number') return { type: 'number', value: Frac.of(answer.value) };
    if (answer.type === 'list') return { type: 'list', value: normList(answer.value) };
    if (answer.type === 'pairs') return { type: 'pairs', value: normPairs(answer.value) };
    return answer;
  }

  function display(answer) {
    if (answer.type === 'number') return OGE.fmt(Frac.of(answer.value));
    if (answer.type === 'list') return answer.value.map((v) => OGE.fmt(v)).join('; ');
    if (answer.type === 'pairs') return answer.value.map((p) => '(' + OGE.fmt(p[0]) + '; ' + OGE.fmt(p[1]) + ')').join(', ');
    return String(answer.value);
  }

  // Возвращает {status: 'correct' | 'wrong' | 'invalid', message?, note?}
  function check(answer, input) {
    const raw = stripSpaces(input);
    if (!raw) return { status: 'invalid', message: 'Введите ответ.' };
    if (answer.type === 'number') {
      if (/[/\\]/.test(raw)) {
        return { status: 'invalid', message: 'В бланк ОГЭ записывают целое число или десятичную дробь, например 0,25.' };
      }
      const v = parseNumber(raw);
      if (!v) return { status: 'invalid', message: 'Ответ должен быть числом: целым или десятичной дробью (через запятую).' };
      return { status: v.eq(Frac.of(answer.value)) ? 'correct' : 'wrong' };
    }
    if (answer.type === 'list' || answer.type === 'pairs') {
      const pairs = answer.type === 'pairs';
      const given = pairs ? parsePairs(input) : parseList(input);
      if (typeof given === 'string') return { status: 'invalid', message: given };
      const eq = pairs ? (x, y) => x[0].eq(y[0]) && x[1].eq(y[1]) : (x, y) => x.eq(y);
      // повторы («2; 2») не засчитываются как лишний корень, но и не дают «верно» при пропуске
      const uniq = given.filter((x, i) => given.findIndex((y) => eq(x, y)) === i);
      if (!sameList(uniq, answer.value, eq)) return { status: 'wrong' };
      return uniq.length < given.length ? { status: 'correct', note: 'Верно! Одинаковые значения в ответе достаточно записать один раз.' } : { status: 'correct' };
    }
    const digits = raw.replace(/[,;.]/g, '');
    if (!/^\d+$/.test(digits)) {
      return { status: 'invalid', message: 'Запишите ответ цифрами без пробелов и запятых, например 213.' };
    }
    const expected = String(answer.value);
    if (answer.type === 'seq') {
      return { status: digits === expected ? 'correct' : 'wrong' };
    }
    if (answer.type === 'set') {
      const sorted = digits.split('').sort().join('');
      if (sorted !== expected) return { status: 'wrong' };
      if (digits !== expected) {
        return { status: 'correct', note: 'Верно! В бланке номера обычно пишут по возрастанию: ' + expected + '.' };
      }
      return { status: 'correct' };
    }
    throw new Error('Неизвестный тип ответа: ' + answer.type);
  }

  OGE.answer = { parseNumber, parseLoose, parseList, parsePairs, normList, normPairs, normalize, check, display };
})(globalThis);
