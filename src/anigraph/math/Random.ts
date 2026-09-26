import Chance from "chance";

/**
 * A random number generator with an optional seed (built on the `chance` library). Use the same seed to get the
 * same sequence of numbers every run. The shared instance {@link Random} is seeded with the current time.
 */
export class SeededRandom {
  /** The underlying `Chance` generator. */
  public chance: any;
  /**
   * @param seed Seed for the generator. Defaults to `Date.now()`.
   */
  constructor(seed?: number) {
    seed = seed??Date.now();
    this.chance = new Chance(seed);
    this.rand = this.rand.bind(this);
  }
  /** Returns a random float between 0 and 1. */
  rand() {
    return this.chance.floating({ min: 0, max: 1 });
  }

  /**
   * Returns a random integer. Both ends of the range are included.
   * @param range Either `max` (the range is `[0, max]`) or `[min, max]`.
   */
  randInt(range:number|[number,number]){
    if(Array.isArray(range)){
      return this.chance.integer({ min: range[0], max: range[1]})
    }else{
      return this.chance.integer({ min: 0, max: range})
    }
  }

  /** Returns an array of `n` random floats between 0 and 1. */
  floatArray(n: number) {
    const randomArray: number[] = [];
    for (let i = 0; i < n; i++) {
      randomArray.push(this.rand());
    }
    return randomArray;
  }
}

/** Shared {@link SeededRandom} instance (seeded with the time the app started), used by the `Random()` helpers. */
const Random = new SeededRandom();
export { Random };
