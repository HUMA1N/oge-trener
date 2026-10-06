/*
 * Задание 21 (вторая часть). Текстовые задачи: движение по реке, совместная
 * работа, трубы, смеси и сплавы, средняя скорость, поезд и пешеход.
 * Разбор построен так, как решение оформляют на экзамене: обозначение
 * неизвестной, таблица/выражения, уравнение, решение, отбор корней.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE;
  const { Frac, h, fmt, MINUS } = OGE;
  const { quadSteps, p } = OGE.part2;
  const x = '<i>x</i>';
  const y = '<i>y</i>';

  function table(head, rows) {
    return (
      '<div class="table-wrap"><table class="data small-table"><thead><tr>' +
      head.map((c) => '<th>' + c + '</th>').join('') +
      '</tr></thead><tbody>' +
      rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>'
    );
  }
  const pl = (n, a, b, c) => n + ' ' + OGE.plural(n, a, b, c);

  const builders = {
    // Скорость течения по разнице времени против течения и по течению.
    river(rng) {
      return OGE.retry(rng, () => {
        const u = rng.int(1, 6);
        const v = rng.int(Math.max(8, 2 * u + 2), 30);
        if ((v * v) % u) return null;
        const k = v * v / u - u; // = 2S/Δt
        const dt = rng.int(1, 10);
        if ((k * dt) % 2) return null;
        const S = (k * dt) / 2;
        if (S < 20 || S > 400 || S / (v - u) > 24) return null;
        const boat = rng.pick(['Моторная лодка', 'Катер', 'Теплоход']);
        const fem = boat === 'Моторная лодка';
        const html =
          '<p>' +
          boat +
          ' прош' +
          (fem ? 'ла' : 'ёл') +
          ' против течения реки ' +
          S +
          ' км и верну' +
          (fem ? 'лась' : 'лся') +
          ' в пункт отправления, затратив на обратный путь на ' +
          pl(dt, 'час', 'часа', 'часов') +
          ' меньше. Найдите скорость течения, если скорость ' +
          (fem ? 'лодки' : boat === 'Катер' ? 'катера' : 'теплохода') +
          ' в неподвижной воде равна ' +
          v +
          ' км/ч. Ответ дайте в км/ч.</p>';
        const steps = [
          '<p>Пусть скорость течения равна ' + x + ' км/ч (0 &lt; ' + x + ' &lt; ' + v + '). Тогда:</p>',
          table(
            ['', 'Скорость, км/ч', 'Расстояние, км', 'Время, ч'],
            [
              ['Против течения', v + ' ' + MINUS + ' ' + x, S, h.frac(S, v + ' ' + MINUS + ' ' + x)],
              ['По течению', v + ' + ' + x, S, h.frac(S, v + ' + ' + x)],
            ],
          ),
          '<p>Против течения времени ушло на ' + dt + ' ч больше:</p>',
          h.block(h.frac(S, v + ' ' + MINUS + ' ' + x) + ' ' + MINUS + ' ' + h.frac(S, v + ' + ' + x) + ' = ' + dt),
          '<p>Умножим обе части на (' + v + ' ' + MINUS + ' ' + x + ')(' + v + ' + ' + x + ') = ' + v * v + ' ' + MINUS + ' ' + x + '<sup>2</sup> &gt; 0:</p>',
          h.block(S + '(' + v + ' + ' + x + ') ' + MINUS + ' ' + S + '(' + v + ' ' + MINUS + ' ' + x + ') = ' + dt + '(' + v * v + ' ' + MINUS + ' ' + x + '<sup>2</sup>)'),
          h.block(2 * S + x + ' = ' + dt * v * v + ' ' + MINUS + ' ' + dt + x + '<sup>2</sup>'),
          h.block(OGE.expr.html(OGE.poly([[dt, 2], [2 * S, 1], [-dt * v * v, 0]])) + ' = 0'),
          dt > 1 ? '<p>Разделим на ' + dt + ':</p>' + h.block(OGE.expr.html(OGE.poly([[1, 2], [k, 1], [-v * v, 0]])) + ' = 0') : '',
        ]
          .concat(quadSteps('x', k, -v * v, -v * v / u, u))
          .concat(['<p>Скорость не может быть отрицательной, поэтому ' + x + ' = ' + u + ' км/ч.</p>']);
        return { html, answer: u, steps, data: { kind: 'river', S, v, dt } };
      });
    },

    // Туда и обратно со стоянкой — скорость течения.
    'river-stop'(rng) {
      return OGE.retry(rng, () => {
        const u = rng.int(1, 6);
        const v = rng.int(u + 5, 30);
        const tau = rng.int(4, 40);
        const num = tau * (v * v - u * u);
        if (num % (2 * v)) return null;
        const S = num / (2 * v);
        if (S < 30 || S > 600) return null;
        const stop = rng.int(1, 10);
        const T = tau + stop;
        const html =
          '<p>Теплоход проходит по течению реки до пункта назначения ' +
          S +
          ' км и после стоянки возвращается в пункт отправления. Найдите скорость течения, если скорость теплохода в неподвижной воде равна ' +
          v +
          ' км/ч, стоянка длится ' +
          pl(stop, 'час', 'часа', 'часов') +
          ', а в пункт отправления теплоход возвращается через ' +
          pl(T, 'час', 'часа', 'часов') +
          ' после отплытия из него. Ответ дайте в км/ч.</p>';
        const steps = [
          '<p>Пусть скорость течения ' + x + ' км/ч (0 &lt; ' + x + ' &lt; ' + v + '). По течению теплоход идёт со скоростью ' + v + ' + ' + x + ', против течения — ' + v + ' ' + MINUS + ' ' + x + ' км/ч.</p>',
          '<p>В движении теплоход был ' + T + ' ' + MINUS + ' ' + stop + ' = ' + tau + ' ч:</p>',
          h.block(h.frac(S, v + ' + ' + x) + ' + ' + h.frac(S, v + ' ' + MINUS + ' ' + x) + ' = ' + tau),
          '<p>Приведём к общему знаменателю (' + v + ' + ' + x + ')(' + v + ' ' + MINUS + ' ' + x + ') = ' + v * v + ' ' + MINUS + ' ' + x + '<sup>2</sup>:</p>',
          h.block(S + '(' + v + ' ' + MINUS + ' ' + x + ') + ' + S + '(' + v + ' + ' + x + ') = ' + tau + '(' + v * v + ' ' + MINUS + ' ' + x + '<sup>2</sup>)'),
          h.block(2 * S * v + ' = ' + tau * v * v + ' ' + MINUS + ' ' + tau + x + '<sup>2</sup>'),
          h.block(tau + x + '<sup>2</sup> = ' + tau * v * v + ' ' + MINUS + ' ' + 2 * S * v + ' = ' + tau * u * u),
          h.block(x + '<sup>2</sup> = ' + u * u + ', &nbsp; ' + x + ' = ±' + u),
          '<p>Скорость положительна: ' + x + ' = ' + u + ' км/ч.</p>',
        ];
        return { html, answer: u, steps, data: { kind: 'river-stop', S, v, stop, T } };
      });
    },

    // Две трубы / два велосипедиста: V/x − V/(x + d) = t
    pipes(rng) {
      return OGE.retry(rng, () => {
        const story = rng.pick(['pipe', 'bike']);
        const a = story === 'bike' ? rng.int(10, 30) : rng.int(2, 30);
        const d = rng.int(1, 9);
        const t = story === 'bike' ? rng.int(1, 6) : rng.int(1, 12);
        const prod = t * a * (a + d);
        if (prod % d) return null;
        const V = prod / d;
        if (V > 1500 || V < 20 || (story === 'bike' && V > 400)) return null;
        const askSecond = rng.chance(0.5);
        let html;
        let unit;
        if (story === 'pipe') {
          unit = 'л/мин';
          html =
            '<p>Первая труба пропускает на ' +
            pl(d, 'литр', 'литра', 'литров') +
            ' воды в минуту меньше, чем вторая. Сколько литров воды в минуту пропускает ' +
            (askSecond ? 'вторая' : 'первая') +
            ' труба, если резервуар объёмом ' +
            V +
            ' литров она заполняет на ' +
            pl(t, 'минуту', 'минуты', 'минут') +
            ' ' +
            (askSecond ? 'быстрее, чем первая' : 'дольше, чем вторая') +
            '?</p>';
        } else {
          unit = 'км/ч';
          html =
            '<p>Два велосипедиста одновременно отправились в ' +
            V +
            '-километровый пробег. Первый ехал со скоростью, на ' +
            d +
            ' км/ч большей, чем скорость второго, и прибыл к финишу на ' +
            pl(t, 'час', 'часа', 'часов') +
            ' раньше второго. Найдите скорость велосипедиста, пришедшего к финишу ' +
            (askSecond ? 'первым' : 'вторым') +
            '. Ответ дайте в км/ч.</p>';
        }
        const ans = askSecond ? a + d : a;
        const who = story === 'pipe' ? ['первая труба', 'вторая труба'] : ['второй (медленный) велосипедист', 'первый велосипедист'];
        const qty = story === 'pipe' ? ['Производительность, л/мин', 'Объём, л', 'Время, мин'] : ['Скорость, км/ч', 'Путь, км', 'Время, ч'];
        const steps = [
          '<p>Пусть ' + who[0] + (story === 'pipe' ? ' пропускает ' : ' едет со скоростью ') + x + ' ' + unit + ', тогда ' + who[1] + ' — ' + x + ' + ' + d + ' ' + unit + ' (' + x + ' &gt; 0).</p>',
          table(
            [''].concat(qty),
            [
              [who[0][0].toUpperCase() + who[0].slice(1), x, V, h.frac(V, x)],
              [who[1][0].toUpperCase() + who[1].slice(1), x + ' + ' + d, V, h.frac(V, x + ' + ' + d)],
            ],
          ),
          '<p>Разница во времени — ' + t + ':</p>',
          h.block(h.frac(V, x) + ' ' + MINUS + ' ' + h.frac(V, x + ' + ' + d) + ' = ' + t),
          '<p>Умножим обе части на ' + x + '(' + x + ' + ' + d + ') &gt; 0:</p>',
          h.block(V + '(' + x + ' + ' + d + ') ' + MINUS + ' ' + V + x + ' = ' + t + x + '(' + x + ' + ' + d + ')'),
          h.block(V * d + ' = ' + (t === 1 ? '' : t) + x + '<sup>2</sup> + ' + t * d + x),
          h.block(OGE.expr.html(OGE.poly([[t, 2], [t * d, 1], [-V * d, 0]])) + ' = 0'),
          t > 1 ? '<p>Разделим на ' + t + ':</p>' + h.block(OGE.expr.html(OGE.poly([[1, 2], [d, 1], [-a * (a + d), 0]])) + ' = 0') : '',
        ]
          .concat(quadSteps('x', d, -a * (a + d), -(a + d), a))
          .concat([
            '<p>Отрицательный корень не подходит, значит, ' + who[0] + ': ' + x + ' = ' + a + ' ' + unit + '.</p>',
            askSecond ? '<p>Спрашивают про ' + (story === 'pipe' ? 'вторую трубу' : 'первого велосипедиста') + ': ' + a + ' + ' + d + ' = ' + (a + d) + ' ' + unit + '.</p>' : '',
          ]);
        return { html, answer: ans, steps, data: { kind: 'pipes', V, d, t, askSecond } };
      });
    },

    // Совместная работа: первый за p дней делает то же, что второй за q дней.
    work(rng) {
      return OGE.retry(rng, () => {
        const pp = rng.int(2, 5);
        const q = rng.int(2, 6);
        if (pp === q || OGE.gcd(pp, q) !== 1) return null;
        const T = rng.int(2, 24);
        // первый: a = T(p + q)/q, второй: b = T(p + q)/p
        if ((T * (pp + q)) % q || (T * (pp + q)) % pp) return null;
        const a = (T * (pp + q)) / q;
        const b = (T * (pp + q)) / pp;
        const askSecond = rng.chance(0.4);
        const html =
          '<p>Двое рабочих, работая вместе, могут выполнить работу за ' +
          pl(T, 'день', 'дня', 'дней') +
          '. За сколько дней, работая отдельно, выполнит эту работу ' +
          (askSecond ? 'второй' : 'первый') +
          ' рабочий, если он за ' +
          (askSecond ? q : pp) +
          ' ' +
          OGE.plural(askSecond ? q : pp, 'день', 'дня', 'дней') +
          ' выполняет такую же часть работы, какую ' +
          (askSecond ? 'первый' : 'второй') +
          ' — за ' +
          pl(askSecond ? pp : q, 'день', 'дня', 'дней') +
          '?</p>';
        const steps = [
          '<p>Примем всю работу за 1. Пусть первый рабочий выполняет всю работу за ' + x + ' дней, второй — за ' + y + ' дней. Их производительности (часть работы за день): ' + h.frac(1, x) + ' и ' + h.frac(1, y) + '.</p>',
          '<p>За ' + pp + ' дн. первый делает ' + h.frac(pp, x) + ' работы, второй за ' + q + ' дн. — ' + h.frac(q, y) + ' работы. Эти части равны:</p>',
          h.block(h.frac(pp, x) + ' = ' + h.frac(q, y) + ' &nbsp; ⇒ &nbsp; ' + y + ' = ' + h.frac(q, pp) + x),
          '<p>Вместе за день они делают ' + h.frac(1, T) + ' работы:</p>',
          h.block(h.frac(1, x) + ' + ' + h.frac(1, y) + ' = ' + h.frac(1, T) + ' &nbsp; ⇒ &nbsp; ' + h.frac(1, x) + ' + ' + h.frac(pp, q + x) + ' = ' + h.frac(1, T)),
          h.block(h.frac(q + ' + ' + pp, q + x) + ' = ' + h.frac(1, T) + ' &nbsp; ⇒ &nbsp; ' + q + x + ' = ' + (pp + q) + ' · ' + T + ' = ' + T * (pp + q)),
          h.block(x + ' = ' + h.frac(T * (pp + q), q) + ' = ' + a),
          '<p>Первый рабочий выполнит работу за ' + a + ' дн.' + (askSecond ? ', а второй — за ' + y + ' = ' + h.frac(q, pp) + ' · ' + a + ' = ' + b + ' дн.' : '') + '</p>',
        ];
        return { html, answer: askSecond ? b : a, steps, data: { kind: 'work', T, p: pp, q, askSecond } };
      });
    },

    // Два сосуда с раствором: смешали целиком и в равных массах.
    mixture(rng) {
      return OGE.retry(rng, () => {
        const A = rng.int(2, 9) * rng.pick([5, 10]);
        const B = rng.int(2, 9) * rng.pick([5, 10]);
        if (A === B) return null;
        const c1 = rng.int(5, 95);
        const c2 = rng.int(5, 95);
        if (Math.abs(c1 - c2) < 10 || (c1 + c2) % 2) return null;
        const tot = A * c1 + B * c2;
        if (tot % (A + B)) return null;
        const pr = tot / (A + B);
        const q = (c1 + c2) / 2;
        const askSecond = rng.chance(0.4);
        const ans = Frac.of(askSecond ? B * c2 : A * c1).div(100);
        if (!ans.isFiniteDecimal()) return null;
        const html =
          '<p>Имеются два сосуда. Первый содержит ' +
          A +
          ' кг, а второй — ' +
          B +
          ' кг раствора кислоты различной концентрации. Если эти растворы смешать, то получится раствор, содержащий ' +
          pr +
          '% кислоты. Если же смешать равные массы этих растворов, то получится раствор, содержащий ' +
          q +
          '% кислоты. Сколько килограммов кислоты содержится в ' +
          (askSecond ? 'втором' : 'первом') +
          ' сосуде?</p>';
        const steps = [
          '<p>Пусть концентрация кислоты в первом растворе ' + x + '%, во втором — ' + y + '%.</p>',
          '<p><b>Смешали всё.</b> Кислоты: ' + h.frac(A + x, 100) + ' + ' + h.frac(B + y, 100) + ' кг, а в смеси массой ' + (A + B) + ' кг её ' + h.frac(pr + ' · ' + (A + B), 100) + ' кг. Умножив на 100:</p>',
          h.block(A + x + ' + ' + B + y + ' = ' + pr * (A + B)),
          '<p><b>Смешали равные массы</b> (например, по 1 кг): ' + h.frac(x, 100) + ' + ' + h.frac(y, 100) + ' = ' + h.frac(q + ' · 2', 100) + ', то есть</p>',
          h.block(x + ' + ' + y + ' = ' + 2 * q + ' &nbsp; ⇒ &nbsp; ' + y + ' = ' + 2 * q + ' ' + MINUS + ' ' + x),
          '<p>Подставим в первое уравнение:</p>',
          h.block(A + x + ' + ' + B + '(' + 2 * q + ' ' + MINUS + ' ' + x + ') = ' + pr * (A + B)),
          h.block(fmt(A - B) + x + ' = ' + pr * (A + B) + ' ' + MINUS + ' ' + p(2 * q * B) + ' = ' + fmt(pr * (A + B) - 2 * q * B)),
          h.block(x + ' = ' + c1 + ', &nbsp; ' + y + ' = ' + 2 * q + ' ' + MINUS + ' ' + c1 + ' = ' + c2),
          askSecond
            ? '<p>Во втором сосуде кислоты: ' + B + ' · ' + h.frac(c2, 100) + ' = ' + fmt(ans) + ' кг.</p>'
            : '<p>В первом сосуде кислоты: ' + A + ' · ' + h.frac(c1, 100) + ' = ' + fmt(ans) + ' кг.</p>',
        ];
        return { html, answer: ans, steps, data: { kind: 'mixture', A, B, pr, q, askSecond } };
      });
    },

    // Средняя скорость.
    avg(rng) {
      return OGE.retry(rng, () => {
        if (rng.chance(0.5)) {
          const v1 = rng.int(20, 120);
          const v2 = rng.int(20, 120);
          if (v1 === v2 || (2 * v1 * v2) % (v1 + v2)) return null;
          const avg = (2 * v1 * v2) / (v1 + v2);
          const html =
            '<p>Первую половину трассы автомобиль проехал со скоростью ' +
            v1 +
            ' км/ч, а вторую — со скоростью ' +
            v2 +
            ' км/ч. Найдите среднюю скорость автомобиля на протяжении всего пути. Ответ дайте в км/ч.</p>';
          const steps = [
            '<p>Средняя скорость — это <b>весь путь, делённый на всё время</b> (а не среднее арифметическое скоростей!).</p>',
            '<p>Пусть длина всей трассы 2<i>S</i> км. Время на первую половину ' + h.frac('<i>S</i>', v1) + ' ч, на вторую — ' + h.frac('<i>S</i>', v2) + ' ч.</p>',
            h.block(
              '<i>v</i><sub>ср</sub> = ' +
                h.frac('2<i>S</i>', h.frac('<i>S</i>', v1) + ' + ' + h.frac('<i>S</i>', v2)) +
                ' = ' +
                h.frac('2', h.frac(1, v1) + ' + ' + h.frac(1, v2)) +
                ' = ' +
                h.frac('2 · ' + v1 + ' · ' + v2, v1 + ' + ' + v2) +
                ' = ' +
                h.frac(2 * v1 * v2, v1 + v2) +
                ' = ' +
                avg,
            ),
          ];
          return { html, answer: avg, steps, data: { kind: 'avg-half', v1, v2 } };
        }
        const parts = [0, 1, 2].map(() => ({ t: rng.int(1, 4), v: rng.int(4, 24) * 5 }));
        const dist = parts.reduce((s, q) => s + q.t * q.v, 0);
        const time = parts.reduce((s, q) => s + q.t, 0);
        const avg = Frac.of(dist).div(time);
        if (!avg.isInt()) return null;
        const hours = (t, one, many) => (t === 1 ? one + ' час' : many + ' ' + pl(t, 'час', 'часа', 'часов'));
        const html =
          '<p>' +
          hours(parts[0].t, 'Первый', 'Первые') +
          ' автомобиль ехал со скоростью ' +
          parts[0].v +
          ' км/ч, ' +
          hours(parts[1].t, 'следующий', 'следующие') +
          ' — со скоростью ' +
          parts[1].v +
          ' км/ч, а затем ' +
          pl(parts[2].t, 'час', 'часа', 'часов') +
          ' — со скоростью ' +
          parts[2].v +
          ' км/ч. Найдите среднюю скорость автомобиля на протяжении всего пути. Ответ дайте в км/ч.</p>';
        const steps = [
          '<p>Средняя скорость — весь путь, делённый на всё время движения.</p>',
          '<p>Путь: ' + parts.map((q) => q.v + ' · ' + q.t).join(' + ') + ' = ' + dist + ' км.</p>',
          '<p>Время: ' + parts.map((q) => q.t).join(' + ') + ' = ' + time + ' ч.</p>',
          h.block('<i>v</i><sub>ср</sub> = ' + h.frac(dist, time) + ' = ' + fmt(avg) + ' км/ч'),
        ];
        return { html, answer: avg, steps, data: { kind: 'avg-parts', parts } };
      });
    },

    // Поезд проезжает мимо пешехода.
    train(rng) {
      return OGE.retry(rng, () => {
        const v = rng.int(40, 120);
        const w = rng.int(3, 6);
        const same = rng.chance(0.5);
        const rel = same ? v - w : v + w;
        const s = rng.int(6, 60);
        const L = Frac.of(rel * 1000 * s).div(3600);
        if (!L.isInt() || L.n < 150 || L.n > 1500) return null;
        const html =
          '<p>Поезд, двигаясь равномерно со скоростью ' +
          v +
          ' км/ч, проезжает мимо пешехода, идущего ' +
          (same ? 'в том же направлении' : 'навстречу поезду') +
          ' параллельно путям со скоростью ' +
          w +
          ' км/ч, за ' +
          pl(s, 'секунду', 'секунды', 'секунд') +
          '. Найдите длину поезда в метрах.</p>';
        const steps = [
          '<p>Удобно считать, что пешеход стоит, а поезд движется относительно него со скоростью ' +
            (same ? 'разности' : 'суммы') +
            ' скоростей (' +
            (same ? 'пешеход идёт в ту же сторону' : 'они движутся навстречу') +
            '):</p>',
          h.block('<i>v</i><sub>отн</sub> = ' + v + (same ? ' ' + MINUS + ' ' : ' + ') + w + ' = ' + rel + ' км/ч'),
          '<p>Переведём в метры в секунду: ' + rel + ' км/ч = ' + h.frac(rel + ' · 1000', 3600) + ' м/с = ' + h.frac(rel * 5, 18) + ' м/с.</p>',
          '<p>За ' + s + ' с поезд относительно пешехода проходит расстояние, равное своей длине:</p>',
          h.block('<i>L</i> = ' + h.frac(rel * 5, 18) + ' · ' + s + ' = ' + fmt(L) + ' м'),
        ];
        return { html, answer: L, steps, data: { kind: 'train', v, w, same, s } };
      });
    },
  };

  const WEIGHTS = { river: 2, 'river-stop': 1, pipes: 2, work: 2, mixture: 2, avg: 1, train: 1 };

  OGE.registerTask(
    21,
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
        answer: { type: 'number', value: b.answer },
        steps: b.steps.concat([OGE.answerLine(Frac.of(b.answer))]),
        data: b.data,
      };
    },
    Object.keys(WEIGHTS),
  );
})(globalThis);
