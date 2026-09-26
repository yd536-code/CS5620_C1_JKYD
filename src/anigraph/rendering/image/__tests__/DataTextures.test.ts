/**
 * Characterization tests for the Float1D/Float4D pixel-data and data-texture classes: `CreateBlock`, `init`,
 * `Create`/`CreateSolid`, pixel access, and the three.js texture format each one produces.
 */
import * as THREE from "three";
import "../../../";
import {PixelDataFloat1D, PixelDataFloat4D} from "../pixeldata";
import {ADataTextureFloat1D} from "../ADataTextureFloat1D";
import {ADataTextureFloat4D} from "../ADataTextureFloat4D";

describe("PixelDataFloat1D / PixelDataFloat4D", () => {
    test("CreateBlock returns the subclass with width/height/data and a fixed channel count", () => {
        const d1 = PixelDataFloat1D.CreateBlock(3, 2, new Float32Array(6));
        expect(d1).toBeInstanceOf(PixelDataFloat1D);
        expect([d1.width, d1.height, d1.nChannels, d1.data.length]).toEqual([3, 2, 1, 6]);
        const d4 = PixelDataFloat4D.CreateBlock(3, 2, new Float32Array(24));
        expect(d4).toBeInstanceOf(PixelDataFloat4D);
        expect([d4.width, d4.height, d4.nChannels, d4.data.length]).toEqual([3, 2, 4, 24]);
    });

    test("Float1D get/set nearest-neighbor round-trips a scalar (rounded coordinates)", () => {
        const d = PixelDataFloat1D.CreateBlock(3, 2, new Float32Array(6));
        d.setPixelNN(2, 1, 0.75);
        expect(d.getPixelNN(1.6, 0.6)).toBeCloseTo(0.75);
        expect(d.data[1 * 3 + 2]).toBeCloseTo(0.75);
    });

    test("Float4D get/set nearest-neighbor round-trips 4 channels", () => {
        const d = PixelDataFloat4D.CreateBlock(3, 2, new Float32Array(24));
        d.setPixelNN(1, 1, [0.1, 0.2, 0.3, 0.4]);
        expect(Array.from(d.getPixelNN(1, 1) as Float32Array).map(v => +v.toFixed(5))).toEqual([0.1, 0.2, 0.3, 0.4]);
    });

    test("three.js format/type per class", () => {
        const d1 = PixelDataFloat1D.CreateBlock(1, 1, new Float32Array(1)).GetTHREEDataTexture();
        expect([d1.format, d1.type]).toEqual([THREE.RedFormat, THREE.FloatType]);
        const d4 = PixelDataFloat4D.CreateBlock(1, 1, new Float32Array(4)).GetTHREEDataTexture();
        expect([d4.format, d4.type]).toEqual([THREE.RGBAFormat, THREE.FloatType]);
    });
});

describe("ADataTextureFloat1D / ADataTextureFloat4D", () => {
    test("CreateSolid fills; setPixelNN/getPixelNN go through the pixel data", () => {
        const t1 = ADataTextureFloat1D.CreateSolid(4, 3, 0.5);
        expect([t1.width, t1.height, t1.nChannels]).toEqual([4, 3, 1]);
        expect(t1.pixelData.data.length).toBe(12);
        expect(t1.getPixelNN(0, 0)).toBeCloseTo(0.5);
        t1.setPixelNN(3, 2, 0.9);
        expect(t1.getPixelNN(3, 2)).toBeCloseTo(0.9);
        expect(t1.threejs).toBeInstanceOf(THREE.DataTexture);

        const t4 = ADataTextureFloat4D.CreateSolid(2, 2, [1, 0, 0, 1]);
        expect([t4.width, t4.height, t4.nChannels]).toEqual([2, 2, 4]);
        expect(Array.from(t4.getPixelNN(1, 1) as Float32Array)).toEqual([1, 0, 0, 1]);
        expect(ADataTextureFloat4D.CreateSolid(1, 1, 0.25).pixelData.data[3]).toBe(0.25);
    });

    test("Create wraps a given array, or allocates one; init sets pixel data and creates the three.js texture", () => {
        const arr = new Float32Array(4 * 2 * 2);
        const t4 = ADataTextureFloat4D.Create(2, 2, arr);
        expect(t4).toBeInstanceOf(ADataTextureFloat4D);
        expect(t4.pixelData.data).toBe(arr);
        expect(ADataTextureFloat4D.Create(2, 2).pixelData.data.length).toBe(16);
        expect(ADataTextureFloat1D.Create(2, 2)).toBeInstanceOf(ADataTextureFloat1D);
        // Float1D has one channel, so it allocates width*height values (not width*height*4 like Float4D).
        expect(ADataTextureFloat1D.Create(2, 2).pixelData.data.length).toBe(4);

        const t = new ADataTextureFloat1D();
        t.init(PixelDataFloat1D.CreateBlock(2, 1, new Float32Array([0.3, 0.6])));
        expect(t.getPixelNN(1, 0)).toBeCloseTo(0.6);
        expect(t.threejs).toBeInstanceOf(THREE.DataTexture);
    });
});
