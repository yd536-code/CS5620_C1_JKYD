/**
 * Tests for `ARenderPass`: the pass's viewport math against a hand-written split-screen equivalent, and
 * `render()`'s call sequence against a minimal mock of `AGLContext`/`AGLSceneController`: a pass makes the same
 * renderer calls (viewport, clear, `render(scene, camera)`) as a hand-written main loop would.
 *
 * Also tests `findPassAtCursor`'s front-to-back hit-testing (which pass receives a cursor event), against fake passes.
 */
// Import order matters once real node-model/interaction classes are constructed below (the viewport tests only
// use `{} as any` stand-ins) -- see `RenderMatrix.test.ts`'s note. The priming import must also be referenced as a
// value: `@babel/preset-typescript` elides an import that never is.
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {ARenderPass, findPassAtCursor} from "../ARenderPass";
import {AInteraction, AMockInteractionEvent} from "../../interaction";
import {V2} from "../../math";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function mockEventAt(x: number, y: number) {
    const interaction = new AInteraction(AMockInteractionEvent.GetMockElement());
    return new AMockInteractionEvent(interaction, V2(x, y), false, false, false, {} as any);
}

function fakePass(name: string, viewport: [number, number, number, number], opts: {interactive?: boolean, visible?: boolean} = {}) {
    return new ARenderPass({
        name, sceneView: {} as any, cameraModel: {} as any, viewport,
        interactive: opts.interactive, visible: opts.visible,
    });
}

describe("findPassAtCursor", () => {
    test("a cursor over a single pass's viewport returns that pass", () => {
        const main = fakePass("main", [0, 0, 1, 1]);
        expect(findPassAtCursor([main], mockEventAt(0, 0))).toBe(main);
    });

    test("a cursor outside every pass's viewport returns undefined", () => {
        const left = fakePass("left", [0, 0, 0.5, 1]);
        expect(findPassAtCursor([left], mockEventAt(0.9, 0))).toBeUndefined();
    });

    test("checks front-to-back (reverse list order): a HUD pass added after the world pass it overlaps wins", () => {
        const world = fakePass("world", [0, 0, 1, 1]);
        const hud = fakePass("hud", [0, 0, 0.5, 0.5]); // bottom-left corner, overlapping `world`
        // cursor over the overlap region: canvas-global ndc (-0.5, -0.5) -> viewport-fraction (0.25, 0.25),
        // inside both [0,0,1,1] and [0,0,0.5,0.5].
        const event = mockEventAt(-0.5, -0.5);
        expect(findPassAtCursor([world, hud], event)).toBe(hud);
        // Outside the HUD's corner but still over the world pass: only `world` qualifies.
        expect(findPassAtCursor([world, hud], mockEventAt(0.9, 0.9))).toBe(world);
    });

    test("a display-only pass (interactive: false) is skipped, letting the pass underneath receive the event", () => {
        const world = fakePass("world", [0, 0, 1, 1]);
        const overlay = fakePass("overlay", [0, 0, 1, 1], {interactive: false});
        expect(findPassAtCursor([world, overlay], mockEventAt(0, 0))).toBe(world);
    });

    test("an invisible pass is skipped even if interactive", () => {
        const world = fakePass("world", [0, 0, 1, 1]);
        const hiddenHud = fakePass("hiddenHud", [0, 0, 1, 1], {visible: false});
        expect(findPassAtCursor([world, hiddenHud], mockEventAt(0, 0))).toBe(world);
    });

    test("an empty pass list returns undefined", () => {
        expect(findPassAtCursor([], mockEventAt(0, 0))).toBeUndefined();
    });
});

describe("ARenderPass.worldPointAtCursor", () => {
    function fakeCamera(worldPoint: any) {
        const calls: any[] = [];
        return {calls, ndcToWorld: (ndc: any) => { calls.push(ndc); return worldPoint; }};
    }

    test("passes this pass's own local NDC (not the canvas-global one) to this pass's own camera's ndcToWorld", () => {
        const camera = fakeCamera(V2(42, 7));
        const pass = new ARenderPass({name: "right", sceneView: {} as any, cameraModel: camera as any, viewport: [0.5, 0, 0.5, 1]});
        // canvas-global (0.5, 0) -> local (0, 0) in the right-half viewport (see AInteraction.test.ts's identical case).
        const result = pass.worldPointAtCursor(mockEventAt(0.5, 0));

        expect(result).toEqual(V2(42, 7));
        expect(camera.calls).toHaveLength(1);
        expect(camera.calls[0].x).toBeCloseTo(0);
        expect(camera.calls[0].y).toBeCloseTo(0);
    });

    test("returns undefined, and never calls ndcToWorld, when the cursor is outside this pass's viewport", () => {
        const camera = fakeCamera(V2(1, 1));
        const pass = new ARenderPass({name: "right", sceneView: {} as any, cameraModel: camera as any, viewport: [0.5, 0, 0.5, 1]});
        const result = pass.worldPointAtCursor(mockEventAt(-0.5, 0)); // in the left half

        expect(result).toBeUndefined();
        expect(camera.calls).toHaveLength(0);
    });
});

describe("ARenderPass.pixelViewport", () => {
    test("full-canvas default matches [0, 0, w, h]", () => {
        const pass = new ARenderPass({name: "main", sceneView: {} as any, cameraModel: {} as any});
        expect(pass.pixelViewport([800, 600])).toEqual([0, 0, 800, 600]);
    });

    /** A hand-written left/right split-screen, as a multi-pass scene's onAnimationFrameCallback might compute it:
     *  let vsize = 0.5;
     *  let leftViewport = [0, h*vsize*0.5, w*vsize, h*vsize];
     *  let rightViewport = [w-w*vsize, h*vsize*0.5, w*vsize, h*vsize];
     * Two ARenderPasses with the equivalent fractional viewports must reproduce it exactly. */
    test("matches hand-written left/right split-screen viewports", () => {
        const w = 1000, h = 400, vsize = 0.5;
        const leftViewport = [0, h * vsize * 0.5, w * vsize, h * vsize];
        const rightViewport = [w - w * vsize, h * vsize * 0.5, w * vsize, h * vsize];

        const leftPass = new ARenderPass({
            name: "left", sceneView: {} as any, cameraModel: {} as any,
            viewport: [0, vsize * 0.5, vsize, vsize],
        });
        const rightPass = new ARenderPass({
            name: "right", sceneView: {} as any, cameraModel: {} as any,
            viewport: [1 - vsize, vsize * 0.5, vsize, vsize],
        });

        expect(leftPass.pixelViewport([w, h])).toEqual(leftViewport);
        expect(rightPass.pixelViewport([w, h])).toEqual(rightViewport);
    });

    test("scales with canvas size (normalized, not baked to one resolution)", () => {
        const pass = new ARenderPass({name: "p", sceneView: {} as any, cameraModel: {} as any, viewport: [0.25, 0.25, 0.5, 0.5]});
        expect(pass.pixelViewport([200, 100])).toEqual([50, 25, 100, 50]);
        expect(pass.pixelViewport([400, 200])).toEqual([100, 50, 200, 100]);
    });
});

describe("ARenderPass.render", () => {
    function mockContext(shape: [number, number]) {
        const calls: string[] = [];
        return {
            calls,
            getShape: () => ({x: shape[0], y: shape[1]}),
            setViewport: (...args: any[]) => calls.push(`setViewport(${args.join(",")})`),
            setScissor: (...args: any[]) => calls.push(`setScissor(${args.join(",")})`),
            setScissorTest: (v: boolean) => calls.push(`setScissorTest(${v})`),
            setRenderTarget: (t: any) => calls.push(`setRenderTarget(${t})`),
            clearBuffers: (color: boolean, depth: boolean) => calls.push(`clearBuffers(${color},${depth})`),
            renderer: {render: (scene: any, camera: any) => calls.push(`render(${scene},${camera})`)},
        };
    }

    function mockController(cameraThreeJS: string) {
        return {
            getViewListForModel: (_model: any) => [{threeJSCamera: cameraThreeJS}],
        };
    }

    test("defaults (visible, clearing both, full viewport, no target) produce the same calls a hand-written render loop makes, plus a matching scissor rect so a later pass's clear can't erase this one's pixels", () => {
        const context = mockContext([800, 600]);
        const controller = mockController("mainCamera");
        const pass = new ARenderPass({name: "main", sceneView: {threeJSScene: "mainScene"} as any, cameraModel: {} as any});

        pass.render(context as any, controller as any);

        expect(context.calls).toEqual([
            "setViewport(0,0,800,600)",
            "setScissor(0,0,800,600)",
            "setScissorTest(true)",
            "setRenderTarget(null)",
            "clearBuffers(true,true)",
            "render(mainScene,mainCamera)",
        ]);
    });

    test("an invisible pass makes no calls at all", () => {
        const context = mockContext([800, 600]);
        const controller = mockController("cam");
        const pass = new ARenderPass({name: "hidden", sceneView: {threeJSScene: "s"} as any, cameraModel: {} as any, visible: false});

        pass.render(context as any, controller as any);

        expect(context.calls).toEqual([]);
    });

    test("clearDepth-only (a HUD-style pass) does not clear color", () => {
        const context = mockContext([800, 600]);
        const controller = mockController("hudCam");
        const pass = new ARenderPass({
            name: "hud", sceneView: {threeJSScene: "hudScene"} as any, cameraModel: {} as any,
            clearColor: false, clearDepth: true,
        });

        pass.render(context as any, controller as any);

        expect(context.calls).toContain("clearBuffers(false,true)");
    });

    test("a second pass's scissor rect matches its own viewport, not the first pass's -- the fix for the bug this design closes: WebGLRenderer.clear() clears the whole framebuffer unless scissor-scoped, so without this a second pass's clear would erase the first pass's pixels outside its own viewport", () => {
        const context = mockContext([1000, 400]);
        const controller = mockController("cam");
        const leftPass = new ARenderPass({name: "left", sceneView: {threeJSScene: "leftScene"} as any, cameraModel: {} as any, viewport: [0, 0.25, 0.5, 0.5]});
        const rightPass = new ARenderPass({name: "right", sceneView: {threeJSScene: "rightScene"} as any, cameraModel: {} as any, viewport: [0.5, 0.25, 0.5, 0.5]});

        leftPass.render(context as any, controller as any);
        rightPass.render(context as any, controller as any);

        expect(context.calls).toEqual([
            "setViewport(0,100,500,200)", "setScissor(0,100,500,200)", "setScissorTest(true)",
            "setRenderTarget(null)", "clearBuffers(true,true)", "render(leftScene,cam)",
            "setViewport(500,100,500,200)", "setScissor(500,100,500,200)", "setScissorTest(true)",
            "setRenderTarget(null)", "clearBuffers(true,true)", "render(rightScene,cam)",
        ]);
    });
});
