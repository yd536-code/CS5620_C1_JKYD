/**
 * Tests for graphic-element fixes:
 * - `ALineSegmentsGraphic.onMaterialChange` applies a new line material, and `Create` called on a subclass
 *   returns that subclass.
 * - `AInstancedGraphic(Base)`: `setVerts(number[])` throws instead of leaving a disposed geometry behind;
 *   `setMatrixAndColorAt` works with a `Mat3` and does not modify the caller's `Mat4`; `geometry` is the correctly
 *   spelled name (the old `geometery` still works).
 * - `APolygonGraphic2D.setTextureMatrix` handles 2D, 3D, and 4D (homogeneous) position attributes.
 */
import * as THREE from "three";
import {Float32BufferAttribute} from "three";
import {LineMaterial} from "three/examples/jsm/lines/LineMaterial";
// The package barrel first: importing a graphic class directly trips a module cycle ("Class extends value undefined").
import {AMeshModel2D, Color, Mat3, Mat4, V2, V3, VertexArray2D, VertexArray3D, AMaterial} from "../../../";
import {ALineSegmentsGraphic} from "../ALineSegmentsGraphic";
import {AInstancedGraphic} from "../AInstancedGraphic";
import {APolygonGraphic2D} from "../APolygonGraphic2D";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

/** A two-segment vertex array for line tests. */
function lineVerts() {
    // The testing-library lint rule mistakes `CreateForRendering` for a React `render` call.
    // eslint-disable-next-line testing-library/render-result-naming-convention
    const verts = VertexArray3D.CreateForRendering(false, false, true);
    verts.addVertices([V3(0, 0, 0), V3(1, 0, 0)], [Color.Red().Vec4, Color.Blue().Vec4]);
    return verts;
}

/** Wraps a Three.js material in an `AMaterial` without a model (enough for `onMaterialChange`). */
function wrap(material: THREE.Material): AMaterial {
    const m = new AMaterial();
    m._material = material;
    return m;
}

describe("ALineSegmentsGraphic", () => {
    test("onMaterialChange applies a new line material", () => {
        const g = ALineSegmentsGraphic.Create(lineVerts(), new LineMaterial({linewidth: 0.01}));
        const newMaterial = new LineMaterial({linewidth: 0.02});
        g.onMaterialChange(wrap(newMaterial));
        expect(g.material).toBe(newMaterial);
        expect((g.threejs as any).material).toBe(newMaterial);
    });

    test("onMaterialChange ignores a material that is not a line material", () => {
        const lineMaterial = new LineMaterial({linewidth: 0.01});
        const g = ALineSegmentsGraphic.Create(lineVerts(), lineMaterial);
        g.onMaterialChange(wrap(new THREE.MeshBasicMaterial()));
        expect(g.material).toBe(lineMaterial);
    });

    test("Create on a subclass returns the subclass", () => {
        class MyLines extends ALineSegmentsGraphic {}
        const g = MyLines.Create(lineVerts(), new LineMaterial());
        expect(g).toBeInstanceOf(MyLines);
    });
});

/** A concrete instanced graphic (the base class is abstract). */
class TestInstanced extends AInstancedGraphic {}

function makeInstanced(n: number = 4) {
    const g = new TestInstanced();
    g.init(n, new THREE.MeshBasicMaterial());
    return g;
}

describe("AInstancedGraphic", () => {
    test("setVerts(number[]) throws and keeps the old geometry", () => {
        const g = makeInstanced();
        const before = g.geometry;
        expect(() => g.setVerts([0, 0, 0, 1, 0, 0, 0, 1, 0])).toThrow();
        expect(g.geometry).toBe(before);
        expect(g.mesh.geometry).toBe(before);
    });

    test("setMatrixAndColorAt accepts a Mat3 (2D transform) with useOpacity", () => {
        const g = makeInstanced();
        const m3 = Mat3.Translation2D(V2(2, 3));
        expect(() => g.setMatrixAndColorAt(0, m3, Color.FromRGBA(1, 1, 1, 0.25), true)).not.toThrow();
        const out = new THREE.Matrix4();
        g.mesh.getMatrixAt(0, out);
        // THREE.Matrix4 elements are column-major: [12], [13] are the x and y translation, [3] is row 3 col 0 (m30).
        expect(out.elements[12]).toBeCloseTo(2);
        expect(out.elements[13]).toBeCloseTo(3);
        expect(out.elements[3]).toBeCloseTo(0.75);
    });

    test("setMatrixAndColorAt does not modify the caller's Mat4", () => {
        const g = makeInstanced();
        const m4 = Mat4.Translation3D(V3(1, 2, 3));
        const copy = m4.clone();
        g.setMatrixAndColorAt(1, m4, Color.FromRGBA(1, 0, 0, 0.5), true);
        expect(m4.elements).toEqual(copy.elements);
        const out = new THREE.Matrix4();
        g.mesh.getMatrixAt(1, out);
        expect(out.elements[3]).toBeCloseTo(0.5);
    });

    test("geometry is the correctly spelled name; geometery still works", () => {
        const g = makeInstanced();
        expect(g.geometry).toBeInstanceOf(THREE.BufferGeometry);
        expect(g.geometery).toBe(g.geometry);
    });
});

describe("APolygonGraphic2D.setTextureMatrix", () => {
    /** A polygon whose position attribute is replaced with `itemSize`-component positions. */
    function polygonWithPositions(values: number[], itemSize: number) {
        const verts = new VertexArray2D();
        verts.addVertices([V2(0, 0), V2(1, 0), V2(1, 1)]);
        const g = new APolygonGraphic2D(verts, Color.Red());
        g.geometry.setAttribute("position", new Float32BufferAttribute(values, itemSize));
        return g;
    }
    const uvs = (g: APolygonGraphic2D) => Array.from(g.geometry.getAttribute("uv").array as Float32Array);
    const M = Mat4.Translation3D(V3(10, 20, 0));

    test("3D positions (w = 1)", () => {
        const g = polygonWithPositions([1, 2, 0, 3, 4, 0], 3);
        g.setTextureMatrix(M);
        expect(uvs(g)).toEqual([11, 22, 13, 24]);
    });

    test("4D positions use the 4th component as w", () => {
        // (2, 4, 0, 2) is the point (1, 2); translated by (10, 20) it is (11, 22).
        const g = polygonWithPositions([2, 4, 0, 2, 3, 4, 7, 1], 4);
        g.setTextureMatrix(M);
        expect(uvs(g)).toEqual([11, 22, 13, 24]);
    });

    test("2D positions (z = 0, w = 1)", () => {
        const g = polygonWithPositions([1, 2, 3, 4], 2);
        g.setTextureMatrix(M);
        expect(uvs(g)).toEqual([11, 22, 13, 24]);
    });
});
