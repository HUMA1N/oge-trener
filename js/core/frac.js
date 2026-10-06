/*
 * Точные обыкновенные дроби. Генераторы считают ответы в дробях,
 * чтобы не было ошибок округления вида 0,1 + 0,2 = 0,30000000000000004.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE || (root.OGE = {});

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }
  function lcm(a, b) {
    return Math.abs((a / gcd(a, b)) * b);
  }

  function checkSafe(x) {
    if (!Number.isSafeInteger(x)) throw new Error('Frac: выход за пределы точной арифметики');
  }

  class Frac {
    constructor(n, d) {
      if (d === undefined) d = 1;
      if (!Number.isInteger(n) || !Number.isInteger(d)) {
        throw new Error('Frac: числитель и знаменатель должны быть целыми: ' + n + '/' + d);
      }
      if (d === 0) throw new Error('Frac: деление на ноль');
      checkSafe(n);
      checkSafe(d);
      if (d < 0) {
        n = -n;
        d = -d;
      }
      const g = gcd(n, d) || 1;
      this.n = n / g + 0; // + 0 убирает -0
      this.d = d / g;
    }

    // Из целого, десятичной дроби (число или строка "6,7"/"6.7") или Frac.
    static of(x) {
      if (x instanceof Frac) return x;
      if (typeof x === 'string') return Frac.parse(x);
      if (Number.isInteger(x)) return new Frac(x, 1);
      if (typeof x === 'number' && isFinite(x)) {
        // Десятичная запись с не более чем 10 знаками после запятой.
        let s = x.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
        return Frac.parse(s);
      }
      throw new Error('Frac.of: неподдерживаемое значение ' + x);
    }

    static parse(str) {
      const s = String(str).trim().replace(',', '.').replace('−', '-');
      if (s.indexOf('/') >= 0) {
        const p = s.split('/');
        return new Frac(parseInt(p[0], 10), parseInt(p[1], 10));
      }
      const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s);
      if (!m) throw new Error('Frac.parse: не число «' + str + '»');
      const frac = m[3] || '';
      const n = parseInt(m[2] + frac, 10) * (m[1] ? -1 : 1);
      return new Frac(n, Math.pow(10, frac.length));
    }

    add(o) {
      o = Frac.of(o);
      const l = lcm(this.d, o.d);
      return new Frac(this.n * (l / this.d) + o.n * (l / o.d), l);
    }
    sub(o) {
      return this.add(Frac.of(o).neg());
    }
    mul(o) {
      o = Frac.of(o);
      const g1 = gcd(this.n, o.d) || 1;
      const g2 = gcd(o.n, this.d) || 1;
      return new Frac((this.n / g1) * (o.n / g2), (this.d / g2) * (o.d / g1));
    }
    div(o) {
      o = Frac.of(o);
      if (o.n === 0) throw new Error('Frac: деление на ноль');
      return this.mul(new Frac(o.d, o.n));
    }
    neg() {
      return new Frac(-this.n, this.d);
    }
    abs() {
      return new Frac(Math.abs(this.n), this.d);
    }
    inv() {
      return new Frac(this.d, this.n);
    }
    pow(k) {
      if (!Number.isInteger(k)) throw new Error('Frac.pow: целый показатель');
      let base = k < 0 ? this.inv() : this;
      let r = new Frac(1);
      for (let i = 0; i < Math.abs(k); i++) r = r.mul(base);
      return r;
    }
    cmp(o) {
      o = Frac.of(o);
      return Math.sign(this.n * o.d - o.n * this.d);
    }
    eq(o) {
      return this.cmp(o) === 0;
    }
    sign() {
      return Math.sign(this.n);
    }
    isInt() {
      return this.d === 1;
    }
    isZero() {
      return this.n === 0;
    }
    toNumber() {
      return this.n / this.d;
    }
    valueOf() {
      return this.toNumber();
    }

    // Конечная ли десятичная дробь (знаменатель вида 2^a·5^b).
    isFiniteDecimal() {
      let d = this.d;
      while (d % 2 === 0) d /= 2;
      while (d % 5 === 0) d /= 5;
      return d === 1;
    }
    // Число знаков после запятой в десятичной записи (Infinity, если она бесконечна).
    decimalPlaces() {
      if (!this.isFiniteDecimal()) return Infinity;
      // минимальное k, при котором знаменатель делит 10^k
      let k = 0;
      while (Math.pow(10, k) % this.d !== 0) k++;
      return k;
    }
    // Точная десятичная запись с точкой ("-0.125") или null.
    toDecimalString() {
      if (!this.isFiniteDecimal()) return null;
      const k = this.decimalPlaces();
      const scaled = Math.abs(this.n) * (Math.pow(10, k) / this.d);
      let digits = String(scaled);
      if (k > 0) {
        digits = digits.padStart(k + 1, '0');
        digits = digits.slice(0, digits.length - k) + '.' + digits.slice(digits.length - k);
      }
      return (this.n < 0 ? '-' : '') + digits;
    }
    toString() {
      return this.d === 1 ? String(this.n) : this.n + '/' + this.d;
    }
  }

  OGE.Frac = Frac;
  OGE.F = (n, d) => (d === undefined ? Frac.of(n) : new Frac(n, d));
  OGE.gcd = gcd;
  OGE.lcm = lcm;
})(globalThis);
