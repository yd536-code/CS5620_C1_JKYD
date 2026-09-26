/***
 * This is almost entirely based on the leva implementation
 */
import { V2, Vec2 } from "../math/linalg/2D/Vec2";

/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;
const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

const A = (aA1: number, aA2: number) => 1.0 - 3.0 * aA2 + 3.0 * aA1;
const B = (aA1: number, aA2: number) => 3.0 * aA2 - 6.0 * aA1;
const C = (aA1: number) => 3.0 * aA1;

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
const calcBezier = (aT: number, aA1: number, aA2: number) => {
  return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
};

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
const getSlope = (aT: number, aA1: number, aA2: number) => {
  return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
};

/**
 * @param {number} aX
 * @param {number} aA
 * @param {number} aB
 * @param {number} mX1
 * @param {number} mX2
 * @returns {any}
 */
const binarySubdivide = (
  aX: number,
  aA: number,
  aB: number,
  mX1: number,
  mX2: number
) => {
  let currentX,
    currentT,
    i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (
    Math.abs(currentX) > SUBDIVISION_PRECISION &&
    ++i < SUBDIVISION_MAX_ITERATIONS
  );
  return currentT;
};

const newtonRaphsonIterate = (
  aX: number,
  aGuessT: number,
  mX1: number,
  mX2: number
) => {
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0.0) {
      return aGuessT;
    }
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
};

const LinearEasing = (x: number) => {
  return x;
};

/**
 * A cubic Bezier easing curve, like CSS `cubic-bezier(x1, y1, x2, y2)`: the curve goes from (0, 0) to (1, 1) with
 * control points `(x1, y1)` and `(x2, y2)`. `eval(x)` returns the curve's y at a given x (e.g., eased progress for
 * linear progress x). The control points' x values must be in [0, 1].
 */
export class BezierTween {
  /** A new linear tween (`eval(x)` returns x). */
  static get Linear() {
    return new BezierTween(0.5, 0.5, 0.5, 0.5);
  }

  /** The control points as `[x1, y1, x2, y2]`. */
  x1y1x2y2: [number, number, number, number];
  /** The first control point `(x1, y1)`. */
  p0() {
    return V2(this.x1y1x2y2[0], this.x1y1x2y2[1]);
  }
  /** The second control point `(x2, y2)`. */
  p1() {
    return V2(this.x1y1x2y2[2], this.x1y1x2y2[3]);
  }
  /** x of the first control point. */
  get x0() {
    return this.x1y1x2y2[0];
  }
  /** y of the first control point. */
  get y0() {
    return this.x1y1x2y2[1];
  }
  /** x of the second control point. */
  get x1() {
    return this.x1y1x2y2[2];
  }
  /** y of the second control point. */
  get y1() {
    return this.x1y1x2y2[3];
  }

  protected _sampleValues: Float32Array;
  /** Precomputed x values of the curve at evenly spaced parameter values, used to invert x. */
  get sampleValues() {
    return this._sampleValues;
  }

  constructor();
  constructor(xyxy: [number, number, number, number]);
  constructor(x1: number, y1: number, x2: number, y2: number);
  constructor(p0: Vec2, p1: Vec2);
  constructor(p0: [number, number], p1: [number, number]);
  /**
   * Accepts no arguments (linear), `[x1, y1, x2, y2]`, four numbers, two `Vec2`s, or two `[x, y]` pairs.
   * Throws if either control point's x is outside [0, 1].
   */
  constructor(...args: any[]) {
    if (args[0] === undefined) {
      this.x1y1x2y2 = [0.5, 0.5, 0.5, 0.5];
    } else {
      this.x1y1x2y2 = [0, 0, 0, 0];
      if (Array.isArray(args[0])) {
        if (args[0].length == 4) {
          // @ts-ignore
          this.x1y1x2y2 = args[0];
        } else {
          this.x1y1x2y2[0] = args[0][0];
          this.x1y1x2y2[1] = args[0][1];
          this.x1y1x2y2[2] = args[1][0];
          this.x1y1x2y2[3] = args[1][1];
        }
      } else if (args[0] instanceof Vec2) {
        this.x1y1x2y2[0] = args[0].x;
        this.x1y1x2y2[1] = args[0].y;
        this.x1y1x2y2[2] = args[1].x;
        this.x1y1x2y2[3] = args[1].y;
      } else {
        this.x1y1x2y2[0] = args[0];
        this.x1y1x2y2[1] = args[1];
        this.x1y1x2y2[2] = args[2];
        this.x1y1x2y2[3] = args[3];
      }
    }

    if (!(0 <= this.x0 && this.x0 <= 1 && 0 <= this.x1 && this.x1 <= 1)) {
      throw new Error("bezier x values must be in [0, 1] range");
    }

    // Precompute samples table
    this._sampleValues = new Float32Array(kSplineTableSize);
    for (let i = 0; i < kSplineTableSize; ++i) {
      this.sampleValues[i] = calcBezier(i * kSampleStepSize, this.x0, this.x1);
    }
  }

  /** Finds the curve parameter t whose x is `aX`. */
  _getTForX(aX: number) {
    let intervalStart = 0.0;
    let currentSample = 1;
    let lastSample = kSplineTableSize - 1;

    for (
      ;
      currentSample !== lastSample && this.sampleValues[currentSample] <= aX;
      ++currentSample
    ) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    // Interpolate to provide an initial guess for t
    const dist =
      (aX - this.sampleValues[currentSample]) /
      (this.sampleValues[currentSample + 1] - this.sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;

    const initialSlope = getSlope(guessForT, this.x0, this.x1);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, this.x0, this.x1);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(
        aX,
        intervalStart,
        intervalStart + kSampleStepSize,
        this.x0,
        this.x1
      );
    }
  }

  /** Returns the curve's y value at `x` (x in [0, 1]); 0 and 1 map to themselves exactly. */
  eval(x: number) {
    // Because JavaScript number are imprecise, we should guarantee the extremes are right.
    if (x === 0 || x === 1) {
      return x;
    }
    return calcBezier(this._getTForX(x), this.y0, this.y1);
  }
}
