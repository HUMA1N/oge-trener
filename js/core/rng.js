/*
 * Генератор псевдослучайных чисел с зерном (seed).
 * Одинаковое зерно даёт одинаковую задачу — это нужно для тестов
 * и для восстановления варианта после перезагрузки страницы.
 */
(function (root) {
  'use strict';
  const OGE = root.OGE || (root.OGE = {});

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // FNV-1a по строковому представлению частей.
  function hashSeed() {
    const s = Array.prototype.join.call(arguments, '|');
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  class Rng {
    constructor(seed) {
      this.seed = seed >>> 0;
      this._next = mulberry32(this.seed);
    }
    next() {
      return this._next();
    }
    // Целое из отрезка [a; b].
    int(a, b) {
      return a + Math.floor(this.next() * (b - a + 1));
    }
    // Целое из [a; b], не равное нулю.
    intNZ(a, b) {
      let x;
      do x = this.int(a, b);
      while (x === 0);
      return x;
    }
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    }
    chance(p) {
      return this.next() < p;
    }
    sign() {
      return this.next() < 0.5 ? -1 : 1;
    }
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
      }
      return a;
    }
    // k различных элементов массива в случайном порядке.
    sample(arr, k) {
      return this.shuffle(arr).slice(0, k);
    }
    // Выбор по весам: items — массив, weights — массив неотрицательных чисел.
    weighted(items, weights) {
      const total = weights.reduce((s, w) => s + w, 0);
      let r = this.next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    }
  }

  OGE.Rng = Rng;
  OGE.createRng = (seed) => new Rng(seed);
  OGE.hashSeed = hashSeed;
  OGE.deriveSeed = (seed, salt) => hashSeed(seed, salt);
  OGE.randomSeed = function () {
    if (root.crypto && root.crypto.getRandomValues) {
      const a = new Uint32Array(1);
      root.crypto.getRandomValues(a);
      return a[0];
    }
    return Math.floor(Math.random() * 4294967296);
  };

  // Повторяет попытку построить задачу, пока fn не вернёт значение (не null).
  // Генераторы подбирают «красивые» числа перебором — так проще, чем угадывать.
  OGE.retry = function (rng, fn, maxTries) {
    const limit = maxTries || 2000;
    for (let i = 0; i < limit; i++) {
      const r = fn(rng, i);
      if (r !== null && r !== undefined) return r;
    }
    throw new Error('Не удалось подобрать параметры задачи за ' + limit + ' попыток');
  };
})(globalThis);
