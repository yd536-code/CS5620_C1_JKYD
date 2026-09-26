/**
 * Tests for data-texture fixes:
 * - `setPixelData` can be called again (it used to throw). New data of the same size and format reuses the
 *   same `THREE.DataTexture`, so materials that use it see the change; data of a different size gets a new one.
 *   `setTextureNeedsUpdate(false)` does not flag an upload. Pixel edits still need an explicit
 *   `setTextureNeedsUpdate()` call (a deliberate design choice).
 * - `CheckWebGLSupport` uses `renderer.getContext()` (the deprecated `renderer.context` is undefined).
 */
import * as THREE from "three";
import {AMeshModel2D} from "../../../";
import {PixelDataFloat1D} from "../pixeldata";
import {ADataTexture} from "../ADataTexture";
import {ADataTextureFloat1D} from "../ADataTextureFloat1D";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

describe("ADataTexture.setPixelData", () => {
    test("a second call with same-size data works and keeps the same THREE texture", () => {
        const tex = ADataTextureFloat1D.Create(2, 2);
        const three = tex.threejs;
        const versionBefore = three.version;
        const newData = PixelDataFloat1D.CreateBlock(2, 2, new Float32Array([1, 2, 3, 4]));
        expect(() => tex.setPixelData(newData)).not.toThrow();
        expect(tex.threejs).toBe(three);
        expect(tex.pixelData).toBe(newData);
        expect((tex.threejs.image as any).data).toBe(newData.data);
        expect(tex.threejs.version).toBeGreaterThan(versionBefore);
        expect(tex.getPixelNN(1, 1)).toBe(4);
    });

    test("a second call with a different size makes a new THREE texture with the old settings", () => {
        const tex = ADataTextureFloat1D.Create(2, 2);
        tex.setMagFilter(THREE.NearestFilter);
        const old = tex.threejs;
        const disposeSpy = jest.spyOn(old, "dispose");
        tex.setPixelData(PixelDataFloat1D.CreateBlock(3, 1, new Float32Array(3)));
        expect(tex.threejs).not.toBe(old);
        expect(disposeSpy).toHaveBeenCalled();
        expect([tex.width, tex.height]).toEqual([3, 1]);
        expect(tex.threejs.magFilter).toBe(THREE.NearestFilter);
    });

    test("setTextureNeedsUpdate(false) does not flag an upload; no argument does", () => {
        const tex = ADataTextureFloat1D.Create(2, 2);
        const v0 = tex.threejs.version;
        tex.setTextureNeedsUpdate(false);
        expect(tex.threejs.version).toBe(v0);
        tex.setTextureNeedsUpdate();
        expect(tex.threejs.version).toBe(v0 + 1);
    });
});

describe("ADataTexture.CheckWebGLSupport", () => {
    test("checks both extensions through renderer.getContext()", () => {
        const asked: string[] = [];
        const gl = {getExtension: (name: string) => { asked.push(name); return {}; }};
        const renderer: any = {getContext: () => gl};
        ADataTexture._support_checked = false;
        expect(() => ADataTexture.CheckWebGLSupport(renderer)).not.toThrow();
        expect(asked).toEqual(["OES_texture_float", "OES_texture_float_linear"]);
        expect(ADataTexture._TextureFloatSupport).toBeTruthy();
        ADataTexture._support_checked = false;
    });
});
