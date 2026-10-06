/*
 * Проверка ответа ученика.
 * Типы ответа:
 *   number — число (целое или конечная десятичная дробь), сравнивается точно;
 *   seq    — последовательность цифр, порядок важен (задание 11, соответствия);
 *   set    — набор номеров, порядок не важен (задание 19).
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

  function display(answer) {
    if (answer.type === 'number') return OGE.fmt(Frac.of(answer.value));
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

  OGE.answer = { parseNumber, check, display };
})(globalThis);
