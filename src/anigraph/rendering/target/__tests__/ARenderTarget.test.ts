/**
 * Tests for `ARenderTarget`:
 * - `release()` frees the render target instead of throwing.
 * - the default `minFilter` and `magFilter` are both `LinearFilter` (`setMagFilter` does not overwrite `minFilter`).
 */
import * as THREE from "three";
import {AMeshModel2D} from "../../../";
import {ARenderTarget} from "../ARenderTarget";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

describe("ARenderTarget", () => {
    test("release() disposes the target and does not throw", () => {
        const rt = new ARenderTarget(4, 4);
        const disposeSpy = jest.spyOn(rt.target as THREE.WebGLRenderTarget, "dispose");
        expect(() => rt.release()).not.toThrow();
        expect(disposeSpy).toHaveBeenCalled();
    });

    test("default filters: minFilter and magFilter are LinearFilter", () => {
        const rt = ARenderTarget.CreateFloatRGBATarget(4, 4);
        expect(rt.targetTexture.threejs.minFilter).toBe(THREE.LinearFilter);
        expect(rt.targetTexture.threejs.magFilter).toBe(THREE.LinearFilter);
    });

    test("explicit filters are kept", () => {
        const rt = new ARenderTarget(4, 4, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
        expect(rt.targetTexture.threejs.minFilter).toBe(THREE.NearestFilter);
        expect(rt.targetTexture.threejs.magFilter).toBe(THREE.NearestFilter);
    });
});
