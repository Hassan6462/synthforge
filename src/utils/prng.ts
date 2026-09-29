/**
 * Seedable Pseudo-Random Number Generator using Mulberry32.
 * Allows reproducible synthetic datasets with consistent statistical distributions.
 */
export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 1337;
    }
  }

  /**
   * Returns a float in [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer in [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(this.next() * (hi - lo + 1)) + lo;
  }

  /**
   * Returns a float in [min, max] rounded to specified precision
   */
  nextFloat(min: number, max: number, precision: number = 2): number {
    const val = min + this.next() * (max - min);
    const factor = Math.pow(10, precision);
    return Math.round(val * factor) / factor;
  }

  /**
   * Random item from array
   */
  nextItem<T>(items: readonly T[] | T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  /**
   * Returns true with given probability [0, 1]
   */
  nextBoolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Gaussian / Normal distribution using the Box-Muller transform
   */
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    let u1 = this.next();
    let u2 = this.next();
    // Avoid log(0)
    while (u1 === 0) u1 = this.next();
    while (u2 === 0) u2 = this.next();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Zipfian / Pareto power-law sample
   */
  nextPareto(alpha: number = 1.16): number {
    const u = this.next();
    return 1 / Math.pow(1 - u, 1 / alpha);
  }

  /**
   * Shuffles an array in place
   */
  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
