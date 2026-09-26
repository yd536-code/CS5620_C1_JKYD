/**
 * Test for `getAspect()` on the shared `ARenderContext` base, which serves both backends: `AGLContext` and
 * `ATwoJSContext` (for Two.js, `getShape()` returns `two.width`/`two.height`), so the aspect is `getShape().x/y`.
 */
import {ARenderContext} from "../ARenderContext";

function fakeRenderContext(overrides: any = {}): any {
    return Object.assign(Object.create(ARenderContext.prototype), overrides);
}

describe("ARenderContext.getAspect", () => {
    test("computes getShape().x / getShape().y", () => {
        const ctx = fakeRenderContext({getShape: () => ({x: 800, y: 400})});
        expect(ctx.getAspect()).toBe(2);
    });

    test("reflects whatever getShape() reports, not a cached value", () => {
        let shape = {x: 800, y: 400};
        const ctx = fakeRenderContext({getShape: () => shape});
        expect(ctx.getAspect()).toBe(2);
        shape = {x: 800, y: 800};
        expect(ctx.getAspect()).toBe(1);
    });
});
