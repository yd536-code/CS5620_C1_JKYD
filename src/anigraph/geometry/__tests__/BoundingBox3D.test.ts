/**
 * Characterization tests for `BoundingBox3D` (and the members `BoundingBox2D` shares with it), including `clone`,
 * `boundVertexPositionArrray` and `boundBounds`, which live on the shared `BoundingBox` base.
 */
import {
    BoundingBox2D,
    BoundingBox3D,
    VertexArray3D,
    VertexAttributeArray3D,
    VertexPositionArray2DH,
    VertexArray2D,
    V2, V3, Vec2, Vec3, Vec4, Mat3, Mat4, Color,
} from "../../";

describe("BoundingBox3D", () => {
    test("FromVec3s bounds min/max", () => {
        const b = BoundingBox3D.FromVec3s([V3(1, -2, 3), V3(-1, 5, 0), V3(0, 0, 9)]);
        expect(b.minPoint!.elements).toEqual([-1, -2, 0]);
        expect(b.maxPoint!.elements).toEqual([1, 5, 9]);
        expect(b.localWidth).toBe(2);
        expect(b.localHeight).toBe(7);
        expect(b.localDepth).toBe(9);
    });

    test("boundPoint accepts Vec2 (via From2DHPoint on first point), Vec3, Vec4 (via Point3D)", () => {
        const b = new BoundingBox3D();
        b.boundPoint(new Vec4(2, 4, 6, 2));
        expect(b.minPoint!.elements).toEqual([1, 2, 3]);
        b.boundPoint(V3(0, 5, 3));
        expect(b.minPoint!.elements).toEqual([0, 2, 3]);
        expect(b.maxPoint!.elements).toEqual([1, 5, 3]);
        const b2 = new BoundingBox3D();
        b2.boundPoint(V2(1, 2));
        expect(b2.minPoint).toBeInstanceOf(Vec3);
        expect(b2.minPoint!.elements).toEqual(Vec3.From2DHPoint(V2(1, 2)).elements);
    });

    test("clone is an independent copy of min/max/transform and keeps the class", () => {
        const b = BoundingBox3D.BoxAtLocationWithSize(V3(1, 2, 3), 2);
        const c = b.clone();
        expect(c).toBeInstanceOf(BoundingBox3D);
        expect(c.minPoint!.elements).toEqual(b.minPoint!.elements);
        expect(c.maxPoint!.elements).toEqual(b.maxPoint!.elements);
        expect(c.transform.elements).toEqual(b.transform.elements);
        c.minPoint!.x = 100;
        c.transform.elements[0] = 100;
        expect(b.minPoint!.x).toBe(-1);
        expect(b.transform.elements[0]).toBe(1);
    });

    test("clone of an empty box", () => {
        const c = new BoundingBox3D().clone();
        expect(c.minPoint).toBeUndefined();
        expect(c.maxPoint).toBeUndefined();
        expect(c.transform).toBeInstanceOf(Mat4);
    });

    test("boundVertexPositionArrray over 3D and 2DH attribute arrays", () => {
        const b = new BoundingBox3D();
        b.boundVertexPositionArrray(new VertexAttributeArray3D([1, 2, 3, -1, -2, -3]));
        expect(b.minPoint!.elements).toEqual([-1, -2, -3]);
        expect(b.maxPoint!.elements).toEqual([1, 2, 3]);
        const b2 = new BoundingBox3D();
        b2.boundVertexPositionArrray(new VertexPositionArray2DH([1, 2, 1, 3, -4, 1]));
        expect(b2.minPoint!.elements).toEqual([1, -4, 1]);
        expect(b2.maxPoint!.elements).toEqual([3, 2, 1]);
    });

    test("BoxAtLocationWithSize: center, corners, transform", () => {
        const b = BoundingBox3D.BoxAtLocationWithSize(V3(10, 0, 0), 2);
        expect(b.center!.elements).toEqual([10, 0, 0]);
        const corners = b.corners;
        expect(corners.length).toBe(8);
        expect(corners[0].elements).toEqual([9, -1, -1]);
        expect(corners[6].elements).toEqual([11, 1, 1]);
        expect(corners[3].elements).toEqual([9, 1, -1]);
    });

    test("boundBounds bounds another box's transformed corners (2D or 3D)", () => {
        const b = new BoundingBox3D();
        b.boundBounds(BoundingBox3D.BoxAtLocationWithSize(V3(10, 0, 0), 2));
        expect(b.minPoint!.elements).toEqual([9, -1, -1]);
        expect(b.maxPoint!.elements).toEqual([11, 1, 1]);
        const b2d = BoundingBox2D.FromVec2s([V2(0, 0), V2(1, 2)]);
        b2d.transform = Mat3.Translation2D(V2(5, 5));
        const b3 = new BoundingBox3D();
        b3.boundBounds(b2d);
        expect(b3.minPoint!.elements.slice(0, 2)).toEqual([5, 5]);
        expect(b3.maxPoint!.elements.slice(0, 2)).toEqual([6, 7]);
    });

    test("GetBoxTriangleMeshVerts: 8 verts, 12 triangles", () => {
        const va = BoundingBox3D.BoxAtLocationWithSize(V3(), 2).GetBoxTriangleMeshVerts();
        expect(va.nVerts).toBe(8);
        expect(va.indices.elements.length).toBe(36);
    });

    test("FromBoundingBox2D and getBoundsXY", () => {
        const b2d = BoundingBox2D.FromVec2s([V2(0, 0), V2(1, 2)]);
        const b3 = BoundingBox3D.FromBoundingBox2D(b2d);
        expect(b3.minPoint!.elements).toEqual([0, 0, 0]);
        expect(b3.maxPoint!.elements).toEqual([1, 2, 0]);
        const back = b3.getBoundsXY();
        expect(back).toBeInstanceOf(BoundingBox2D);
        expect(back.minPoint!.elements).toEqual([0, 0]);
        expect(back.maxPoint!.elements).toEqual([1, 2]);
    });

    test("pointInBounds", () => {
        const b = BoundingBox3D.FromVec3s([V3(0, 0, 0), V3(1, 1, 1)]);
        expect(b.pointInBounds(V3(0.5, 0.5, 0.5))).toBe(true);
        expect(b.pointInBounds(V3(0.5, 1.5, 0.5))).toBe(false);
        expect(new BoundingBox3D().pointInBounds(V3())).toBe(false);
    });
});

describe("BoundingBox2D shared members", () => {
    test("clone is an independent copy and keeps the class", () => {
        const b = BoundingBox2D.FromVec2s([V2(0, 0), V2(1, 2)]);
        b.transform = Mat3.Translation2D(V2(3, 4));
        const c = b.clone();
        expect(c).toBeInstanceOf(BoundingBox2D);
        expect(c.minPoint!.elements).toEqual([0, 0]);
        expect(c.transform.elements).toEqual(b.transform.elements);
        c.maxPoint!.x = 50;
        c.transform.elements[0] = 50;
        expect(b.maxPoint!.x).toBe(1);
        expect(b.transform.elements[0]).toBe(1);
    });

    test("boundVertexPositionArrray treats 3D points as homogeneous 2D (Point2D divides by z)", () => {
        const b = new BoundingBox2D();
        b.boundVertexPositionArrray(new VertexAttributeArray3D([1, 2, 30, -1, 5, 40]));
        expect(b.minPoint).toBeInstanceOf(Vec2);
        expect(b.minPoint!.elements).toEqual([-1 / 40, 2 / 30]);
        expect(b.maxPoint!.elements).toEqual([1 / 30, 5 / 40]);
    });

    test("boundBounds bounds another box's transformed corners", () => {
        const inner = BoundingBox2D.FromVec2s([V2(0, 0), V2(1, 1)]);
        inner.transform = Mat3.Translation2D(V2(2, 2));
        const b = new BoundingBox2D();
        b.boundBounds(inner);
        expect(b.minPoint!.elements).toEqual([2, 2]);
        expect(b.maxPoint!.elements).toEqual([3, 3]);
    });
});

/** A position-weighted checksum, so reordering or perturbing any element changes it. */
function checksum(els: number[]) {
    let s = 0;
    for (let i = 0; i < els.length; i++) {
        s += els[i] * ((i % 13) + 1);
    }
    return s;
}

function fingerprint(va: VertexArray3D) {
    return {
        nVerts: va.nVerts,
        nIndices: va.indices.elements.length,
        position: checksum(va.position.elements),
        normal: checksum(va.normal.elements),
        uv: checksum(va.uv.elements),
        indices: checksum(va.indices.elements),
    };
}

describe("VertexArray3D sphere generators (pinned by fingerprint)", () => {
    // Fingerprints (vertex counts and weighted checksums) recorded from a known-good implementation.
    test("Sphere default parameters", () => {
        const fp = fingerprint(VertexArray3D.Sphere());
        expect(fp.nVerts).toBe(33 * 17);
        expect(fp.nIndices).toBe(3 * (32 * 16 * 2 - 2 * 32));
        expect(fp.position).toBeCloseTo(-77.42507114645264, 9);
        expect(fp.normal).toBeCloseTo(-77.42507114645286, 9);
        expect(fp.uv).toBeCloseTo(3927.359375, 9);
        expect(fp.indices).toBe(5640172);
    });

    test("Sphere partial ranges, clockwise", () => {
        const fp = fingerprint(VertexArray3D.Sphere(2, 7, 5, 0.3, Math.PI, 0.2, 2.0, false));
        expect(fp.nVerts).toBe(48);
        expect(fp.nIndices).toBe(210);
        expect(fp.position).toBeCloseTo(499.0224157922542, 9);
        expect(fp.normal).toBeCloseTo(249.5112078961271, 9);
        expect(fp.uv).toBeCloseTo(326.62857142857143, 9);
        expect(fp.indices).toBe(34593);
    });

    test("ColoredSphere with a fixed color matches Sphere's geometry, colors every vertex", () => {
        const color = new Vec4(0.1, 0.2, 0.3, 1);
        const cs = VertexArray3D.ColoredSphere(3, 9, 6, color as any);
        const s = VertexArray3D.Sphere(3, 9, 6);
        expect(cs.position.elements).toEqual(s.position.elements);
        expect(cs.normal.elements).toEqual(s.normal.elements);
        expect(cs.uv.elements).toEqual(s.uv.elements);
        expect(cs.indices.elements).toEqual(s.indices.elements);
        expect(cs.color.nVerts).toBe(cs.nVerts);
        expect(cs.color.getElementsSlice().slice(0, 8)).toEqual([0.1, 0.2, 0.3, 1, 0.1, 0.2, 0.3, 1]);
        const fp = fingerprint(cs);
        expect(fp.nVerts).toBe(70);
        expect(fp.nIndices).toBe(270);
        expect(fp.position).toBeCloseTo(-89.48780002616923, 9);
        expect(fp.indices).toBe(65083);
    });

    test("ColoredSphere without a color gives each vertex a random RGBA", () => {
        const cs = VertexArray3D.ColoredSphere(1, 4, 3);
        expect(cs.color.nVerts).toBe(cs.nVerts);
    });
});

describe("addVertices (VertexArray2D / VertexArray3D)", () => {
    test("VertexArray3D.addVertices with a single Color fills every vertex", () => {
        const va = VertexArray3D.CreateForRendering(false, false, true);
        va.addVertices([V3(1, 2, 3), V3(4, 5, 6)], Color.FromRGBA(0.1, 0.2, 0.3, 0.4));
        expect(va.position.elements).toEqual([1, 2, 3, 4, 5, 6]);
        expect(va.color.getElementsSlice()).toEqual([0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4]);
    });

    test("VertexArray3D.addVertices with per-vertex colors, and without colors", () => {
        const va = VertexArray3D.CreateForRendering(false, false, true);
        va.addVertices([V3(1, 2, 3), V3(4, 5, 6)], [new Vec4(1, 0, 0, 1), new Vec3(0, 1, 0)] as any);
        expect(va.color.getElementsSlice()).toEqual([1, 0, 0, 1, 0, 1, 0, 1]);
        const plain = new VertexArray3D();
        plain.addVertices([V3(1, 2, 3)], [new Vec4(1, 0, 0, 1)]);
        expect(plain.position.elements).toEqual([1, 2, 3]);
        expect(plain.color).toBeUndefined();
    });

    test("VertexArray2D.addVertices pads 2D positions with z = 0, fills a single Color", () => {
        const va = new VertexArray2D();
        va.initColorAttribute();
        va.addVertices([V2(1, 2), V2(3, 4)], Color.FromRGBA(0.5, 0.5, 0.5, 1));
        expect(va.position.elements).toEqual([1, 2, 0, 3, 4, 0]);
        expect(va.color.getElementsSlice()).toEqual([0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1]);
    });
});
