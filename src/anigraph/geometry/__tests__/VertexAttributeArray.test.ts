/**
 * Characterization tests for `VertexAttributeArray` and its subclasses, whose shared logic lives on the generic
 * base. They pin today's behavior, including the per-class asymmetries a generic
 * implementation could quietly "fix" (e.g. `VertexAttributeArray4D.push(Vec3)` pads w with `_defaultH` = 0
 * while `setAt(i, Vec3)` goes through `Point3DH`, w = 1).
 *
 * Real `new` instances throughout, not `Object.create` fakes: the Babel class-field ordering hazard (fields
 * initialized in the wrong order) only shows up during real construction.
 */
import * as THREE from "three";
import {
    VertexAttributeArray2D,
    VertexAttributeArray3D,
    VertexAttributeArray4D,
    VertexAttributeColor3DArray,
    VertexAttributeColorArray,
    VertexPositionArray2DH,
    VertexPositionArray3DH,
    VertexAttributeArrayFromThreeJS,
    Vec2, Vec3, Vec4, Mat3, Mat4, Color,
} from "../../";
import {ASerializableToJSON, ASerializableFromJSON} from "../../base/aserial/ASerializable";

const ALL_CLASSES: [string, any, number][] = [
    ["VertexAttributeArray2D", VertexAttributeArray2D, 2],
    ["VertexAttributeArray3D", VertexAttributeArray3D, 3],
    ["VertexAttributeArray4D", VertexAttributeArray4D, 4],
    ["VertexAttributeColor3DArray", VertexAttributeColor3DArray, 3],
    ["VertexAttributeColorArray", VertexAttributeColorArray, 4],
    ["VertexPositionArray2DH", VertexPositionArray2DH, 3],
    ["VertexPositionArray3DH", VertexPositionArray3DH, 4],
];

describe.each(ALL_CLASSES)("%s shared behavior", (_name, Cls, stride) => {
    const elements = Array.from({length: stride * 3}, (_, i) => i + 0.5);

    test("ElementsPerVertex and nVerts", () => {
        expect(Cls.ElementsPerVertex).toBe(stride);
        expect(new Cls(elements).nVerts).toBe(3);
        expect(new Cls().nVerts).toBe(0);
    });

    test("getElementsSlice is an independent copy of all elements", () => {
        const a = new Cls(elements);
        const s = a.getElementsSlice();
        expect(s).toEqual(elements);
        s[0] = 999;
        expect(a.elements[0]).toBe(0.5);
    });

    test("constructor copies its input array", () => {
        const src = elements.slice();
        const a = new Cls(src);
        src[0] = 999;
        expect(a.elements[0]).toBe(0.5);
    });

    test("BufferAttribute/InstancedBufferAttribute default itemSize is the stride", () => {
        const a = new Cls(elements);
        const b = a.BufferAttribute();
        expect(b).toBeInstanceOf(THREE.BufferAttribute);
        expect(b.itemSize).toBe(stride);
        expect(Array.from(b.array)).toEqual(elements);
        expect(a.BufferAttribute(1).itemSize).toBe(1);
        const ib = a.InstancedBufferAttribute();
        expect(ib).toBeInstanceOf(THREE.InstancedBufferAttribute);
        expect(ib.itemSize).toBe(stride);
        expect(Array.from(ib.array)).toEqual(elements);
    });

    test("FromThreeJS returns this subclass", () => {
        const attr = new THREE.BufferAttribute(new Float32Array(elements), stride);
        const a = Cls.FromThreeJS(attr);
        expect(a).toBeInstanceOf(Cls);
        expect(a.constructor).toBe(Cls);
        expect(a.elements).toEqual(elements);
    });

    test("clone/deepCopy keep subclass identity", () => {
        const a = new Cls(elements);
        expect(a.clone().constructor).toBe(Cls);
        const d = a.deepCopy();
        expect(d.constructor).toBe(Cls);
        d.elements[0] = 999;
        expect(a.elements[0]).toBe(0.5);
    });

    test("serialization round trip revives the subclass", () => {
        const a = new Cls(elements);
        const revived = ASerializableFromJSON(ASerializableToJSON(a));
        expect(revived.constructor).toBe(Cls);
        expect(revived.elements).toEqual(elements);
        expect(revived.nVerts).toBe(3);
    });

    test("updateElements replaces same-length data, throws on mismatch", () => {
        const a = new Cls(elements);
        const verts = [0, 1, 2].map(i => a.getAt(i));
        const b = new Cls(elements.map(() => 0));
        b.updateElements(verts);
        expect(b.elements).toEqual(verts.flatMap((v: any) => v.elements));
        expect(() => b.updateElements(verts.slice(0, 2))).toThrow();
    });
});

describe("VertexAttributeArray2D", () => {
    test("getAt returns a Vec2; setAt accepts Vec2 or number[]", () => {
        const a = new VertexAttributeArray2D([1, 2, 3, 4]);
        const v = a.getAt(1);
        expect(v).toBeInstanceOf(Vec2);
        expect(v.elements).toEqual([3, 4]);
        a.setAt(0, new Vec2(9, 8));
        a.setAt(1, [7, 6]);
        expect(a.elements).toEqual([9, 8, 7, 6]);
    });
    test("push/pushArray/unshift/unshiftArray", () => {
        const a = new VertexAttributeArray2D();
        a.push(new Vec2(1, 2));
        a.pushArray([new Vec2(3, 4), new Vec2(5, 6)]);
        a.unshift(new Vec2(-1, 0));
        a.unshiftArray([new Vec2(-3, -2)]);
        expect(a.elements).toEqual([-3, -2, -1, 0, 1, 2, 3, 4, 5, 6]);
    });
    test("FromThreeJS throws on interleaved attributes", () => {
        const ib = new THREE.InterleavedBuffer(new Float32Array([1, 2, 3, 4]), 2);
        const attr = new THREE.InterleavedBufferAttribute(ib, 2, 0);
        expect(() => VertexAttributeArray2D.FromThreeJS(attr)).toThrow();
    });
});

describe("VertexAttributeArray3D", () => {
    test("getAt returns a Vec3; setAt accepts Vec3 or number[]", () => {
        const a = new VertexAttributeArray3D([1, 2, 3, 4, 5, 6]);
        expect(a.getAt(1)).toBeInstanceOf(Vec3);
        expect(a.getAt(1).elements).toEqual([4, 5, 6]);
        a.setAt(0, new Vec3(9, 8, 7));
        a.setAt(1, [6, 5, 4]);
        expect(a.elements).toEqual([9, 8, 7, 6, 5, 4]);
    });
    test("push/pushArray", () => {
        const a = new VertexAttributeArray3D();
        a.push(new Vec3(1, 2, 3));
        a.pushArray([new Vec3(4, 5, 6)]);
        expect(a.elements).toEqual([1, 2, 3, 4, 5, 6]);
    });
    test("ApplyMatrix(Mat4) transforms points in place and returns this", () => {
        const a = new VertexAttributeArray3D([1, 2, 3, 0, 0, 0]);
        const r = a.ApplyMatrix(Mat4.Translation3D(new Vec3(10, 20, 30)));
        expect(r).toBe(a);
        expect(a.elements).toEqual([11, 22, 33, 10, 20, 30]);
    });
    test("ApplyMatrix(Mat3) goes through Mat4.From2DMat3", () => {
        const a = new VertexAttributeArray3D([1, 2, 3]);
        const m3 = Mat3.Translation2D(new Vec2(5, 6));
        const expected = Mat4.From2DMat3(m3).times(new Vec3(1, 2, 3).Point3DH).Point3D;
        a.ApplyMatrix(m3);
        expect(a.elements).toEqual(expected.elements);
    });
    test("GetTransformedByMatrix leaves the original untouched", () => {
        const a = new VertexAttributeArray3D([1, 2, 3]);
        const b = a.GetTransformedByMatrix(Mat4.Translation3D(new Vec3(1, 1, 1)));
        expect(a.elements).toEqual([1, 2, 3]);
        expect(b.elements).toEqual([2, 3, 4]);
        expect(b.constructor).toBe(VertexAttributeArray3D);
    });
});

describe("VertexAttributeArray4D", () => {
    test("getAt returns a Vec4", () => {
        const a = new VertexAttributeArray4D([1, 2, 3, 4]);
        expect(a.getAt(0)).toBeInstanceOf(Vec4);
        expect(a.getAt(0).elements).toEqual([1, 2, 3, 4]);
    });
    test("setAt(Vec3) uses Point3DH (w = 1); setAt(number[]) writes as given", () => {
        const a = new VertexAttributeArray4D([0, 0, 0, 0, 0, 0, 0, 0]);
        a.setAt(0, new Vec3(1, 2, 3));
        a.setAt(1, [5, 6, 7, 8]);
        expect(a.elements).toEqual([1, 2, 3, 1, 5, 6, 7, 8]);
    });
    test("push(Vec3) pads with _defaultH = 0 (not Point3DH's 1)", () => {
        const a = new VertexAttributeArray4D();
        a.push(new Vec3(1, 2, 3));
        a.push(new Vec4(4, 5, 6, 7));
        expect(a.elements).toEqual([1, 2, 3, 0, 4, 5, 6, 7]);
        expect(() => a.push(new Vec2(1, 2) as any)).toThrow();
    });
    test("ApplyMatrix multiplies the full 4-vector", () => {
        const a = new VertexAttributeArray4D([1, 2, 3, 1, 1, 2, 3, 0]);
        a.ApplyMatrix(Mat4.Translation3D(new Vec3(10, 10, 10)));
        expect(a.elements).toEqual([11, 12, 13, 1, 1, 2, 3, 0]);
    });
});

describe("VertexPositionArray3DH", () => {
    test("push(Vec3) pads with its own _defaultH = 1", () => {
        const a = new VertexPositionArray3DH();
        expect(a._defaultH).toBe(1);
        a.push(new Vec3(1, 2, 3));
        expect(a.elements).toEqual([1, 2, 3, 1]);
    });
    test("setAt pads 3-long input with _defaultH", () => {
        const a = new VertexPositionArray3DH([0, 0, 0, 0]);
        a.setAt(0, [1, 2, 3]);
        expect(a.elements).toEqual([1, 2, 3, 1]);
        a._defaultH = 5;
        a.setAt(0, new Vec3(1, 2, 3));
        expect(a.elements).toEqual([1, 2, 3, 5]);
        a.setAt(0, new Vec4(1, 2, 3, 4));
        expect(a.elements).toEqual([1, 2, 3, 4]);
    });
    test("getAt is a Vec4 (inherited)", () => {
        expect(new VertexPositionArray3DH([1, 2, 3, 1]).getAt(0)).toBeInstanceOf(Vec4);
    });
});

describe("VertexPositionArray2DH", () => {
    test("_defaultZ padding in push/pushArray/unshift/unshiftArray/setAt", () => {
        const a = new VertexPositionArray2DH();
        expect(a._defaultZ).toBe(0);
        a.push(new Vec2(1, 2));
        a.push(new Vec3(3, 4, 5));
        a.pushArray([new Vec2(6, 7)]);
        a.unshift(new Vec2(-1, -2));
        a.unshiftArray([new Vec2(-3, -4), new Vec3(-5, -6, -7)] as any);
        expect(a.elements).toEqual([-3, -4, 0, -5, -6, -7, -1, -2, 0, 1, 2, 0, 3, 4, 5, 6, 7, 0]);
        a._defaultZ = 9;
        a.setAt(0, [1, 1]);
        a.setAt(1, new Vec2(2, 2));
        a.setAt(2, new Vec3(3, 3, 3));
        expect(a.elements.slice(0, 9)).toEqual([1, 1, 9, 2, 2, 9, 3, 3, 3]);
    });
    test("getAt is a Vec3; getPoint2DAt is its Point2D", () => {
        const a = new VertexPositionArray2DH([2, 4, 2]);
        expect(a.getAt(0)).toBeInstanceOf(Vec3);
        expect(a.getPoint2DAt(0).elements).toEqual(new Vec3(2, 4, 2).Point2D.elements);
    });
    test("ApplyMatrix(Mat3) maps Point2D and resets z to _defaultZ", () => {
        const a = new VertexPositionArray2DH([1, 2, 1, 3, 4, 1]);
        a._defaultZ = 7;
        a.ApplyMatrix(Mat3.Translation2D(new Vec2(10, 20)));
        expect(a.elements).toEqual([11, 22, 7, 13, 24, 7]);
    });
    test("ApplyMatrix(Mat4) maps the 3D point", () => {
        const a = new VertexPositionArray2DH([1, 2, 3]);
        a.ApplyMatrix(Mat4.Translation3D(new Vec3(1, 1, 1)));
        expect(a.elements).toEqual([2, 3, 4]);
    });
});

describe("VertexAttributeColor3DArray", () => {
    test("getAt returns a 3-element Color; getVec4At pads alpha 1", () => {
        const a = new VertexAttributeColor3DArray([0.1, 0.2, 0.3]);
        const c = a.getAt(0);
        expect(c).toBeInstanceOf(Color);
        expect(c.elements).toEqual([0.1, 0.2, 0.3]);
        expect(a.getVec4At(0)).toBeInstanceOf(Vec4);
        expect(a.getVec4At(0).elements).toEqual([0.1, 0.2, 0.3, 1]);
    });
    test("setAt accepts Color (rgb only), Vec3, number[]", () => {
        const a = new VertexAttributeColor3DArray([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        a.setAt(0, Color.FromRGBA(0.1, 0.2, 0.3, 0.4));
        a.setAt(1, new Vec3(0.5, 0.6, 0.7));
        a.setAt(2, [0.8, 0.9, 1.0]);
        expect(a.elements).toEqual([0.1, 0.2, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);
    });
    test("push takes the first 3 elements; pushArray concatenates all elements", () => {
        const a = new VertexAttributeColor3DArray();
        a.push(Color.FromRGBA(0.1, 0.2, 0.3, 0.4));
        a.push(new Vec3(0.5, 0.6, 0.7));
        expect(a.elements).toEqual([0.1, 0.2, 0.3, 0.5, 0.6, 0.7]);
        a.pushArray([new Vec3(1, 2, 3)]);
        expect(a.elements.slice(6)).toEqual([1, 2, 3]);
    });
});

describe("VertexAttributeColorArray", () => {
    test("getAt returns a Color via FromRGBA; getVec4At a Vec4", () => {
        const a = new VertexAttributeColorArray([0.1, 0.2, 0.3, 0.4]);
        const c = a.getAt(0);
        expect(c).toBeInstanceOf(Color);
        expect(c.elements).toEqual(Color.FromRGBA(0.1, 0.2, 0.3, 0.4).elements);
        expect(a.getVec4At(0).elements).toEqual([0.1, 0.2, 0.3, 0.4]);
    });
    test("setAt accepts Color, Vec4, Vec3 (Point3DH), number[]", () => {
        const a = new VertexAttributeColorArray(new Array(16).fill(0));
        a.setAt(0, Color.FromRGBA(0.1, 0.2, 0.3, 0.4));
        a.setAt(1, new Vec4(0.5, 0.6, 0.7, 0.8));
        a.setAt(2, new Vec3(0.9, 1.0, 0.1));
        a.setAt(3, [1, 2, 3, 4]);
        expect(a.elements).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 1, 1, 2, 3, 4]);
    });
    test("push/pushArray pad 3-element input with _defaultAlpha", () => {
        const a = new VertexAttributeColorArray();
        a._defaultAlpha = 0.5;
        a.push(new Vec3(1, 2, 3));
        a.push(new Vec4(4, 5, 6, 7));
        a.pushArray([new Vec3(8, 9, 10), new Vec4(1, 1, 1, 1)] as any);
        expect(a.elements).toEqual([1, 2, 3, 0.5, 4, 5, 6, 7, 8, 9, 10, 0.5, 1, 1, 1, 1]);
    });
    test("ApplyMatrix multiplies getVec4At", () => {
        const a = new VertexAttributeColorArray([1, 2, 3, 1]);
        a.ApplyMatrix(Mat4.Translation3D(new Vec3(1, 1, 1)));
        expect(a.elements).toEqual([2, 3, 4, 1]);
    });
});

describe("VertexAttributeArrayFromThreeJS", () => {
    test.each([[2, VertexAttributeArray2D], [3, VertexAttributeArray3D], [4, VertexAttributeArray4D]])(
        "itemSize %i -> %p", (itemSize, Cls) => {
            const attr = new THREE.BufferAttribute(new Float32Array(itemSize * 2), itemSize as number);
            expect(VertexAttributeArrayFromThreeJS(attr).constructor).toBe(Cls);
        });
    test("unsupported itemSize or interleaved input throws", () => {
        expect(() => VertexAttributeArrayFromThreeJS(new THREE.BufferAttribute(new Float32Array(5), 5))).toThrow();
        const ib = new THREE.InterleavedBuffer(new Float32Array(6), 3);
        expect(() => VertexAttributeArrayFromThreeJS(new THREE.InterleavedBufferAttribute(ib, 3, 0))).toThrow();
    });
});
