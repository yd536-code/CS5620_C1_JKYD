/**
 * Characterization tests for `ACoordinateAxesGraphic3D` and the `ALineSegmentsGraphic` behavior it inherits (it
 * extends `ALineSegmentsGraphic`). Real construction throughout (the Babel class-field-ordering hazard only shows up
 * there).
 */
import * as THREE from "three";
import {Line2} from "three/examples/jsm/lines/Line2";
// The package barrel first: importing a graphic class directly trips a module cycle ("Class extends value undefined").
import {VertexArray3D, V3, Color} from "../../../";
import {ACoordinateAxesGraphic3D} from "../ACoordinateAxesGraphic3D";
import {ALineSegmentsGraphic} from "../ALineSegmentsGraphic";

function segmentPositions(g: any): number[] {
    // LineSegmentsGeometry stores segment endpoints as instanceStart/instanceEnd over one interleaved buffer.
    return Array.from(g.geometry.getAttribute("instanceStart").data.array as Float32Array);
}

function segmentColors(g: any): number[] {
    return Array.from(g.geometry.getAttribute("instanceColorStart").data.array as Float32Array);
}

describe("ACoordinateAxesGraphic3D", () => {
    test("builds three scaled axis segments from the origin, colored red/green/blue", () => {
        const g = new ACoordinateAxesGraphic3D(2, 0.01);
        expect(g.axesScale).toBe(2);
        expect(segmentPositions(g)).toEqual([0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2]);
        expect(g.geometry.getAttribute("instanceColorStart").count).toBe(3);
        expect(g.geometry.getAttribute("instanceColorEnd").count).toBe(3);
        const r = Color.Red().Vec4.elements, gr = Color.Green().Vec4.elements, b = Color.Blue().Vec4.elements;
        expect(segmentColors(g).map(v => +v.toFixed(5))).toEqual([...r, ...r, ...gr, ...gr, ...b, ...b].map(v => +v.toFixed(5)));
    });

    test("defaults: scale 1, line width 0.005", () => {
        const g = new ACoordinateAxesGraphic3D();
        expect(g.axesScale).toBe(1);
        expect(g.lineWidth).toBeCloseTo(0.005);
        expect(segmentPositions(g).slice(3, 6)).toEqual([1, 0, 0]);
    });

    test("lineWidth reads the material; setLineWidth writes the line material", () => {
        const g = new ACoordinateAxesGraphic3D(1, 0.02);
        expect(g.lineWidth).toBeCloseTo(0.02);
        g.setLineWidth(0.1);
        expect(g.lineWidth).toBeCloseTo(0.1);
        expect(g.material).toBe(g.lineMaterial._material);
    });

    test("element/threejs is a Line2 over its geometry and material, with matrixAutoUpdate off", () => {
        const g = new ACoordinateAxesGraphic3D();
        expect(g.element).toBeInstanceOf(Line2);
        expect(g.threejs).toBe(g.element);
        expect(g.element.matrixAutoUpdate).toBe(false);
        expect(g.element.geometry).toBe(g.geometry);
        expect(g.element.material).toBe(g.material);
    });

    test("setLineVerts replaces the geometry (disposing the old one) and rebinds the element", () => {
        const g = new ACoordinateAxesGraphic3D();
        const old = g.geometry;
        const disposed = jest.spyOn(old, "dispose");
        g.setLineVerts(g.createVertexArray(3));
        expect(disposed).toHaveBeenCalled();
        expect(g.geometry).not.toBe(old);
        expect(g.element.geometry).toBe(g.geometry);
        expect(segmentPositions(g).slice(3, 6)).toEqual([3, 0, 0]);
    });

    test("Create(...args) constructs this class with the given args", () => {
        const g = ACoordinateAxesGraphic3D.Create(4, 0.03);
        expect(g).toBeInstanceOf(ACoordinateAxesGraphic3D);
        expect(g.axesScale).toBe(4);
        expect(g.lineWidth).toBeCloseTo(0.03);
    });

    test("setColors accepts number[] or Float32Array", () => {
        const g = new ACoordinateAxesGraphic3D();
        g.setColors(new Float32Array(24).fill(0.5));
        expect(segmentColors(g).every(v => v === 0.5)).toBe(true);
        g.setColors(new Array(24).fill(0.25));
        expect(segmentColors(g).every(v => v === 0.25)).toBe(true);
    });
});

describe("ALineSegmentsGraphic (the behavior the axes class duplicated)", () => {
    test("Create(verts, material, lineWidth) builds a Line2 from a VertexArray3D with colors", () => {
        const va = VertexArray3D.CreateForRendering(false, false, true);
        va.addVertices([V3(0, 0, 0), V3(1, 2, 3)], [Color.Red().Vec4, Color.Blue().Vec4]);
        const axes = new ACoordinateAxesGraphic3D();
        const g = ALineSegmentsGraphic.Create(va, axes.lineMaterial, 0.04);
        expect(g).toBeInstanceOf(ALineSegmentsGraphic);
        expect(g.threejs).toBeInstanceOf(Line2);
        expect(segmentPositions(g)).toEqual([0, 0, 0, 1, 2, 3]);
        expect(g.geometry.getAttribute("instanceColorStart")).toBeInstanceOf(THREE.InterleavedBufferAttribute);
        expect(g.lineWidth).toBeCloseTo(0.04);
    });
});
