/**
 * Two.js runtime import.
 *
 * `@types/two.js` uses `export = Two` (CommonJS namespace pattern). TypeScript
 * cannot simultaneously treat that as a value (for `new Two(...)`) and a
 * namespace (for `Two.Group`, `Two.Circle`, etc.) when imported with ES module
 * syntax. Using `require()` at runtime collapses both into a single value and
 * sidesteps the TS2539 "cannot augment module" error.
 *
 * **ESM interop**: two.js ships both a CJS build (`build/two.js`, `main`) and
 * an ESM build (`build/two.module.js`, `module`). CRA's webpack resolves
 * `mainFields` as `['browser', 'module', 'main']`, so it picks the ESM build.
 * When webpack processes a `require()` call targeting an ES module it returns
 * the module namespace object `{ __esModule: true, default: TwoClass }` rather
 * than the class itself. Node.js (used by tests) resolves `main` instead and
 * returns `TwoClass` directly.
 *
 * The `.default ?? module` fallback normalises both environments: if `.default`
 * exists (webpack/ESM path), use it; otherwise use the module directly
 * (Node.js/CJS path).
 *
 * All Two.js shapes and groups are typed as `any` here because the official
 * typedefs are incomplete and frequently inaccurate; downstream code casts to
 * the specific shape type it needs.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _twoModule = require("two.js");
export const Two = _twoModule.default ?? _twoModule;

/** A live Two.js renderer instance (returned by `new Two({...})`). */
export type TwoInstance = any;
/** A Two.js `Group` node — a container that holds shapes and sub-groups. */
export type TwoGroup = any;
/** A Two.js path/shape (Circle, Rectangle, Path, etc.). */
export type TwoPath = any;
/** A Two.js `Line` shape. */
export type TwoLine = any;
/** A Two.js `Circle` shape. */
export type TwoCircle = any;
/** A Two.js `Text` shape. */
export type TwoText = any;
/** A Two.js `Vector` (used for anchor point coordinates). */
export type TwoVector = any;
/** Generic Two.js scene-graph node. */
export type TwoObject = any;
