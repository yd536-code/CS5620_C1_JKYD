/***
 * Tolerances and helpers for dealing with floating-point precision (e.g., comparing numbers or avoiding division
 * by zero).
 */
export class Precision {
  /** Default tolerance used for "close enough" comparisons throughout the math library. */
  static epsilon: number = 1e-6;
  /** Twice the smallest positive number JavaScript can represent. */
  static SMALLEST: number = 2 * Number.MIN_VALUE;
  /** Tolerance used when comparing vectors in tests. */
  static VECTOR_TEST_PRECISION: number = 1e-6;
  /**
   * Returns true if `|a| <= epsilon`.
   *
   * @param a the number being evaluated
   * @param epsilon the tolerance (default `1e-6`)
   */
  static isTiny(a: number, epsilon: number = 1e-6) {
    return Math.abs(a) <= epsilon;
  }

  /** A small rotation amount (in radians). */
  static TinyRotation: number = 0.00001;

  /**
   * Returns `a` if `|a| >= epsilon`; otherwise returns `epsilon` with the sign of `a` (`+epsilon` for 0). Useful
   * for keeping a value away from zero, e.g. before dividing by it.
   *
   * @param a the number being evaluated
   * @param epsilon the smallest allowed magnitude (default `1e-6`)
   */
  static ClampAbsAboveEpsilon(a: number, epsilon: number = 1e-6) {
    if (!(Math.abs(a) < epsilon)) {
      return a;
    } else {
      return a >= 0 ? epsilon : -epsilon;
    }
  }

  /**
   * Returns true if `|a - b| < Precision.epsilon`.
   */
  static PEQ(a: number, b: number) {
    return Math.abs(a - b) < this.epsilon;
  }

  /**
   * Same as {@link Precision.ClampAbsAboveEpsilon}, but the default tolerance is `Precision.epsilon`: returns `a` if
   * `|a| >= epsilon`, otherwise `epsilon` with the sign of `a` (`+epsilon` for 0).
   *
   * @param a the number being evaluated
   * @param epsilon the smallest allowed magnitude (default `Precision.epsilon`)
   */
  static signedTiny(a: number, epsilon?: number) {
    const tinyValue = epsilon ? epsilon : Precision.epsilon;
    if (!(Math.abs(a) < tinyValue)) {
      return a;
    } else {
      return a >= 0 ? tinyValue : -tinyValue;
    }
  }

  /**
   * Returns `a` if `|a| >= 1`; otherwise returns `1` or `-1` with the sign of `a` (`1` for 0).
   *
   * @param a the number evaluated
   */
  static signedTinyInt(a: number) {
    if (Math.abs(a) < 1) {
      if (a < 0) {
        return -1;
      } else {
        return 1;
      }
    } else {
      return a;
    }
  }
}
