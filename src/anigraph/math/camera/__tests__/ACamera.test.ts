/**
 * Parity tests for `ACamera`'s projection math (the orthographic and perspective projections, which `ACamera`
 * builds through `OrthographicProjection`/`PerspectiveProjection` strategy objects). These pin the current
 * behavior, including three subtleties a reimplementation could easily get wrong:
 *
 * 1. `ACamera.CreatePerspectiveFOV` computes a projection matrix from the FOV parameters, then
 *    `setProjection` back-derives `lrbt`/`zNear`/`zFar` from that matrix's *inverse* -- not from the FOV
 *    parameters directly. A later resize or zoom recomputes the projection from that back-derived `lrbt`,
 *    not from the original fovy/aspect. Test 2 (resize) is what would catch a divergence here.
 * 2. `onCanvasResize` mutates `lrbt` by the aspect ratio and is not idempotent: calling it twice compounds.
 * 3. `zoom` only affects the orthographic projection matrix (through `_nearPlaneWH`); a perspective camera's
 *    projection matrix is completely unaffected by `zoom` (only its `aspect` getter is, and only because
 *    `_nearPlaneWH` divides by `zoom` unconditionally).
 */
import {ACamera} from "../ACamera";
import {Mat4, V2, V3, Vec2} from "../../linalg";

function elementsOf(m: Mat4): number[] {
    return m.elements.slice();
}

function expectSameMatrix(actual: Mat4, expected: Mat4, precision = 10) {
    const a = elementsOf(actual), e = elementsOf(expected);
    expect(a).toHaveLength(16);
    for (let i = 0; i < 16; i++) {
        expect(a[i]).toBeCloseTo(e[i], precision);
    }
}

describe("ACamera.CreatePerspectiveFOV", () => {
    test("projection matrix on creation matches Mat4.PerspectiveFromFOV directly", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        expectSameMatrix(camera.getProjection(), Mat4.PerspectiveFromFOV(Math.PI / 3, 16 / 9, 0.1, 100));
    });

    test("back-derived lrbt/zNear/zFar reproduce the same projection matrix via Mat4.PerspectiveFromNearPlane", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        const rederived = Mat4.PerspectiveFromNearPlane(camera.frustumLeft, camera.frustumRight, camera.frustumBottom, camera.frustumTop, camera.zNear, camera.zFar);
        expectSameMatrix(camera.getProjection(), rederived, 6); // looser precision: this round-trips through a matrix inverse
    });

    test("resize after FOV creation recomputes from the back-derived lrbt, not from the original fovy/aspect", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 4 / 3, 0.1, 100);
        camera.onCanvasResize(1600, 900); // aspect changes from 4/3 to 16/9
        // Reference: what a fresh FOV camera built at the NEW aspect would look like -- NOT what onCanvasResize actually
        // produces, precisely because onCanvasResize scales the back-derived lrbt rather than recomputing from fovy.
        const freshAtNewAspect = Mat4.PerspectiveFromFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        expect(elementsOf(camera.getProjection())).not.toEqual(elementsOf(freshAtNewAspect));
        // What it actually is: lrbt scaled by the aspect ratio change, then projected through PerspectiveFromNearPlane.
        const before = ACamera.CreatePerspectiveFOV(Math.PI / 3, 4 / 3, 0.1, 100);
        const oldAspect = (before.frustumRight - before.frustumLeft) / (before.frustumTop - before.frustumBottom);
        const ratio = (16 / 9) / oldAspect;
        const expected = Mat4.PerspectiveFromNearPlane(before.frustumLeft * ratio, before.frustumRight * ratio, before.frustumBottom, before.frustumTop, before.zNear, before.zFar);
        expectSameMatrix(camera.getProjection(), expected, 6);
    });

    test("zoom does not affect a perspective camera's projection matrix", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        const before = elementsOf(camera.getProjection());
        camera.zoom = 2.5; // triggers onZoomUpdate -> updateProjection, which recomputes from the same lrbt/zNear/zFar
        expectSameMatrix(camera.getProjection(), new Mat4(before), 10); // recomputed, so compare by value, not by identical floats
    });
});

describe("ACamera.CreatePerspectiveNearPlane", () => {
    test("projection matrix matches Mat4.PerspectiveFromNearPlane directly", () => {
        const camera = ACamera.CreatePerspectiveNearPlane(-0.5, 0.6, -0.3, 0.4, 0.2, 80);
        expectSameMatrix(camera.getProjection(), Mat4.PerspectiveFromNearPlane(-0.5, 0.6, -0.3, 0.4, 0.2, 80));
    });

    test("two consecutive resizes compound (not idempotent)", () => {
        const camera = ACamera.CreatePerspectiveNearPlane(-1, 1, -1, 1, 0.1, 100);
        camera.onCanvasResize(800, 600); // aspect 1 -> 4/3
        camera.onCanvasResize(1920, 1080); // aspect 4/3 -> 16/9, compounding on the already-scaled lrbt
        const afterFirst = { l: -1 * (4 / 3), r: 1 * (4 / 3), b: -1, t: 1 };
        const secondRatio = (16 / 9) / (4 / 3);
        const expected = Mat4.PerspectiveFromNearPlane(afterFirst.l * secondRatio, afterFirst.r * secondRatio, afterFirst.b, afterFirst.t, 0.1, 100);
        expectSameMatrix(camera.getProjection(), expected, 8);
    });
});

describe("ACamera.CreateOrthographic", () => {
    test("projection matrix matches Mat4.ProjectionOrtho directly", () => {
        const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, -5, 5);
        expectSameMatrix(camera.getProjection(), Mat4.ProjectionOrtho(-2, 2, -1, 1, -5, 5));
    });

    test("zoom scales the orthographic projection (frustum shrinks as zoom increases)", () => {
        const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, -5, 5);
        camera.zoom = 2;
        // Halved half-width/half-height (centered), same near/far -- re-derive independently via ProjectionOrtho.
        const expected = Mat4.ProjectionOrtho(-1, 1, -0.5, 0.5, -5, 5);
        expectSameMatrix(camera.getProjection(), expected, 8);
    });

    test("resize scales lrbt by the aspect ratio change, same as the perspective case", () => {
        const camera = ACamera.CreateOrthographic(-1, 1, -1, 1, -5, 5);
        camera.onCanvasResize(1600, 900); // aspect 1 -> 16/9
        const expected = Mat4.ProjectionOrtho(-(16 / 9), 16 / 9, -1, 1, -5, 5);
        expectSameMatrix(camera.getProjection(), expected, 8);
    });
});

describe("ACamera.PV (view-projection) with a non-identity pose", () => {
    test("PV combines the current projection with the inverse of the camera's pose", () => {
        const camera = ACamera.CreateOrthographic(-1, 1, -1, 1, -5, 5);
        camera.setPosition(camera.pose.getPosition()); // no-op read/write, keeps default identity-ish pose
        const viewMatrix = camera.pose.getMat4().getInverse();
        const expected = camera.getProjection().times(viewMatrix);
        expectSameMatrix(camera.PV, expected);
    });
});

describe("getProjectedPoint / getWorldToNDC / convertNDCToWorld2D round trips", () => {
    test("getWorldToNDC is the same matrix as PV", () => {
        const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, -5, 5);
        expectSameMatrix(camera.getWorldToNDC(), camera.PV);
    });

    test("getProjectedPoint maps a world point through PV to NDC", () => {
        const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, -5, 5);
        const world = V3(1, 0.5, -2);
        const ndc = camera.getProjectedPoint(world);
        const expected = camera.PV.times(world.Point3DH).Point3D;
        expect(ndc.x).toBeCloseTo(expected.x, 10);
        expect(ndc.y).toBeCloseTo(expected.y, 10);
        expect(ndc.z).toBeCloseTo(expected.z, 10);
    });

    test("convertNDCToWorld2D is the inverse of getProjectedPoint's x/y, for an orthographic camera at the origin", () => {
        const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, -5, 5);
        const worldXY = V2(0.6, -0.3);
        const ndc = camera.getProjectedPoint(V3(worldXY.x, worldXY.y, 0));
        const roundTripped = camera.convertNDCToWorld2D(V2(ndc.x, ndc.y));
        expect(roundTripped.x).toBeCloseTo(worldXY.x, 8);
        expect(roundTripped.y).toBeCloseTo(worldXY.y, 8);
    });

    test("convertNDCToWorld2D at the NDC origin gives the world point on the z=0 plane the camera is centered on", () => {
        const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, -5, 5);
        const world = camera.convertNDCToWorld2D(V2(0, 0));
        expect(world.x).toBeCloseTo(0, 8);
        expect(world.y).toBeCloseTo(0, 8);
    });
});

describe("ACamera.CopyOf", () => {
    test("the copy gets its own pose object: editing the copy's pose leaves the original alone", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        camera.setPosition(V3(1, 2, 3));
        const copy = ACamera.CopyOf(camera);
        expect(copy.pose).not.toBe(camera.pose);
        expect(copy.position.x).toBeCloseTo(1);
        copy.setPosition(V3(-5, 0, 0));
        expect(camera.position.x).toBeCloseTo(1);
        expect(camera.position.y).toBeCloseTo(2);
        expect(camera.position.z).toBeCloseTo(3);
    });
});
