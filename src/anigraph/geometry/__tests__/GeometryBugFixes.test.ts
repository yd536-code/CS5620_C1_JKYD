/**
 * Regression tests for geometry bug fixes. Each `describe` block names the class or method it checks. The
 * `THREE.BufferGeometry` test in the `AGeometrySet` block covers `addMember`'s type signature rather than a bug.
 */
// `VertexArray3D.CreateForRendering` has nothing to do with testing-library's `render`, but its name trips this rule.
/* eslint-disable testing-library/render-result-naming-convention */
// Priming import: loading the whole engine through a node model first avoids circular-import errors.
import {AMeshModel2D} from "../../";
import * as THREE from "three";
import {
    AGeometrySet,
    AObject3DModelWrapper,
    BoundingBox2D,
    BoundingBox3D,
    VertexArray2D,
    VertexArray3D,
    VertexIndexArray,
    Color,
    Mat3,
    Mat4,
    NodeTransform3D,
    V2, V3,
} from "../../";

new AMeshModel2D();

describe("VertexArray3D.addTriangleWithAttributesCCW", () => {
    test("each vertex keeps its own uv", () => {
        const verts = VertexArray3D.CreateForRendering(true, true);
        verts.addTriangleWithAttributesCCW(
            {position: V3(0, 0, 0), uv: V2(0, 0)},
            {position: V3(1, 0, 0), uv: V2(1, 0)},
            {position: V3(0, 1, 0), uv: V2(0, 1)},
        );
        expect(verts.uv.getAt(0).elements).toEqual([0, 0]);
        expect(verts.uv.getAt(1).elements).toEqual([1, 0]);
        expect(verts.uv.getAt(2).elements).toEqual([0, 1]);
    });

    test("computed face normals are unit length", () => {
        const verts = VertexArray3D.CreateForRendering(true, false);
        // A thin triangle: the edges are far from perpendicular, so the cross of the normalized edges is short.
        verts.addTriangleWithAttributesCCW({position: V3(0, 0, 0)}, {position: V3(1, 0, 0)}, {position: V3(1, 0.1, 0)});
        for (let i = 0; i < 3; i++) {
            expect(verts.normal.getAt(i).L2()).toBeCloseTo(1, 6);
        }
    });
});

describe("BoundingBox3D.GetBoundaryLinesVertexArray", () => {
    test("keeps corner x and y for z != 0, 1 and has line-segment indices", () => {
        const b = BoundingBox3D.FromVec3s([V3(1, 2, 2), V3(3, 4, 5)]);
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        const verts = b.GetBoundaryLinesVertexArray();
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
        const corners = b.corners;
        expect(verts.length).toBe(8);
        for (let i = 0; i < 8; i++) {
            expect(verts.getPoint2DAt(i).x).toBeCloseTo(corners[i].x);
            expect(verts.getPoint2DAt(i).y).toBeCloseTo(corners[i].y);
        }
        expect(verts.indices).toBeDefined();
        expect(verts.indices.VertsPerElement).toBe(2);
        expect(verts.indices.nElements).toBe(12);
    });
});

describe("VertexArray2D.setUVToPositions", () => {
    test("uv is the position, transformed by textureTransform", () => {
        const verts = VertexArray2D.FromLists([V2(0, 0), V2(2, 0), V2(2, 3)]);
        verts.setUVToPositions();
        expect(verts.uv.getAt(1).elements).toEqual([2, 0]);
        expect(verts.uv.getAt(2).elements).toEqual([2, 3]);

        const T = Mat3.Translation2D(V2(1, 1)).times(Mat3.Scale2D(0.5));
        verts.setUVToPositions(T);
        expect(verts.uv.getAt(0).x).toBeCloseTo(1);
        expect(verts.uv.getAt(0).y).toBeCloseTo(1);
        expect(verts.uv.getAt(2).x).toBeCloseTo(2);
        expect(verts.uv.getAt(2).y).toBeCloseTo(2.5);
    });
});

describe("VertexArray2D.CreateForCurve", () => {
    test("hasColor controls whether there is a color attribute", () => {
        expect(VertexArray2D.CreateForCurve(true).hasColor).toBe(true);
        expect(VertexArray2D.CreateForCurve().hasColor).toBe(true);
        expect(VertexArray2D.CreateForCurve(false).hasColor).toBe(false);
    });
});

describe("VertexArray.uid", () => {
    test("each vertex array has its own non-empty uid, so a geometry set keeps both", () => {
        const a = VertexArray3D.SquareXYUV();
        const b = VertexArray3D.SquareXYUV();
        expect(a.uid).not.toBe("");
        expect(a.uid).not.toBe(b.uid);
        const err = jest.spyOn(console, "error").mockImplementation(() => {});
        const g = new AGeometrySet();
        g.addMember(a);
        g.addMember(b);
        expect(err).not.toHaveBeenCalled();
        err.mockRestore();
        expect(g.getMemberList().length).toBe(2);
    });

    test("a clone gets a new uid", () => {
        const a = VertexArray3D.SquareXYUV();
        expect(a.clone().uid).not.toBe(a.uid);
    });
});

describe("AGeometrySet source transforms", () => {
    test("each model-wrapper member gets its own copy of the set's source transform", () => {
        const g = new AGeometrySet();
        const m1 = new AObject3DModelWrapper(new THREE.Object3D());
        const m2 = new AObject3DModelWrapper(new THREE.Object3D());
        g.addMember(m1);
        g.addMember(m2);
        g.sourceTransform = new NodeTransform3D(V3(1, 2, 3));
        expect(m1.sourceTransform.getPosition().elements).toEqual([1, 2, 3]);
        expect(m2.sourceTransform.getPosition().elements).toEqual([1, 2, 3]);

        m1.setSourceScale(5);
        expect((m2.sourceTransform as NodeTransform3D).scale.elements).toEqual([1, 1, 1]);
        expect((g.sourceTransform as NodeTransform3D).scale.elements).toEqual([1, 1, 1]);
    });

    test("addMember accepts a THREE.BufferGeometry", () => {
        const g = new AGeometrySet();
        g.addMember(new THREE.BufferGeometry());
        expect(g.getMemberList()[0]).toBeInstanceOf(AObject3DModelWrapper);
    });
});

describe("BoundingBox.pointInBounds", () => {
    test("epsilon lets points just outside the box count as inside", () => {
        const b = BoundingBox3D.FromVec3s([V3(0, 0, 0), V3(1, 1, 1)]);
        expect(b.pointInBounds(V3(1.0005, 0.5, 0.5), 0.001)).toBe(true);
        expect(b.pointInBounds(V3(1.01, 0.5, 0.5), 0.001)).toBe(false);
        expect(b.pointInBounds(V3(1 + 1e-9, 0.5, 0.5))).toBe(true);
    });

    test("uses the box's transform (3D)", () => {
        const b = BoundingBox3D.FromVec3s([V3(0, 0, 0), V3(1, 1, 1)]);
        b.transform = Mat4.Translation3D(V3(10, 0, 0));
        expect(b.pointInBounds(V3(10.5, 0.5, 0.5))).toBe(true);
        expect(b.pointInBounds(V3(0.5, 0.5, 0.5))).toBe(false);
    });

    test("uses the box's transform (2D)", () => {
        const b = BoundingBox2D.FromVec2s([V2(0, 0), V2(1, 1)]);
        b.transform = Mat3.Translation2D(V2(0, 10));
        expect(b.pointInBounds(V2(0.5, 10.5))).toBe(true);
        expect(b.pointInBounds(V2(0.5, 0.5))).toBe(false);
    });
});

describe("VertexIndexArray", () => {
    test("getAt returns the stored index values", () => {
        const inds = new VertexIndexArray(3);
        inds.push([4, 5, 6]);
        inds.push([7, 8, 9]);
        expect(inds.getAt(1)).toEqual([7, 8, 9]);
    });

    test("nElements counts elements; nVerts is a deprecated alias", () => {
        const inds = new VertexIndexArray(2);
        inds.push([0, 1, 2, 3, 4, 5]);
        expect(inds.nElements).toBe(3);
        expect(inds.nVerts).toBe(3);
    });
});

describe("VertexArray3D normals", () => {
    test("SquareXYUV normals are unit length for any scale", () => {
        const verts = VertexArray3D.SquareXYUV(3);
        for (let i = 0; i < 4; i++) {
            expect(verts.normal.getAt(i).elements).toEqual([0, 0, 1]);
        }
    });

    test("Box3D gives each face an outward unit normal that matches its triangles' winding", () => {
        const minP = V3(-1, -2, -3);
        const maxP = V3(2, 3, 4);
        const verts = VertexArray3D.Box3D(minP, maxP);
        const center = minP.plus(maxP).times(0.5);
        const seen = new Set<string>();
        const nTris = verts.indices.elements.length / 3;
        for (let t = 0; t < nTris; t++) {
            const [ia, ib, ic] = verts.indices.getAt(t);
            const A = verts.position.getAt(ia), B = verts.position.getAt(ib), C = verts.position.getAt(ic);
            const geometric = B.minus(A).cross(C.minus(A)).getNormalized();
            const triCenter = A.plus(B).plus(C).times(1 / 3);
            for (const i of [ia, ib, ic]) {
                const n = verts.normal.getAt(i);
                expect(n.L2()).toBeCloseTo(1, 6);
                // The vertex normal matches the triangle's winding...
                expect(n.dot(geometric)).toBeCloseTo(1, 6);
                // ...and points out of the box.
                expect(n.dot(triCenter.minus(center))).toBeGreaterThan(0);
            }
            seen.add(geometric.elements.map((x: number) => Math.round(x)).join(","));
        }
        expect(seen.size).toBe(6);
    });

    test("addTriangleCCW gives unit normals and doesn't change the caller's color array", () => {
        const verts = VertexArray3D.CreateForRendering(true, false, true);
        const colors = [Color.FromString("#ff0000"), Color.FromString("#00ff00"), Color.FromString("#0000ff")];
        verts.addTriangleCCW(V3(0, 0, 0), V3(1, 0, 0), V3(1, 0.1, 0), undefined, colors);
        for (let i = 0; i < 3; i++) {
            expect(verts.normal.getAt(i).L2()).toBeCloseTo(1, 6);
            expect(colors[i]).toBeInstanceOf(Color);
        }
        expect(verts.color.getAt(1).elements.slice(0, 3)).toEqual([0, 1, 0]);
    });
});
