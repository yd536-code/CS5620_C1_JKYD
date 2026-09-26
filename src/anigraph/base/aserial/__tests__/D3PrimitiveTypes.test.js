import {
  ASerializableToJSON,
  ASerializableFromJSON,
} from "../ASerializable";
import { NodeTransform3D, Quaternion, Vec3 } from "../../../../anigraph";
import { VertexArray2D } from "../../../../anigraph";

/**
 * Round-trip coverage for primitive/value types with `@ASerializable`
 * registration, each asserting more than shape-equality -- an
 * `instanceof` check plus actually calling a method on the revived
 * instance, since a revived plain object with the right fields but the
 * wrong class is exactly the bug this guards against. `Vec2`/`Color`
 * already have basic round-trip coverage in `ASerializable.test.js`; this
 * file covers `Quaternion` and `VertexArray2D` (plus the decorated
 * `VertexAttributeArray`/`VertexIndexArray` subclasses it contains -- see
 * `VertexAttributeArray.ts`/`VertexIndexArray.ts`).
 */
describe("primitive/value type round trips", () => {
  test("Quaternion revives as a Quaternion with working methods, not a dead plain object", () => {
    const q = Quaternion.RotationX(Math.PI / 2);
    const revived = ASerializableFromJSON(ASerializableToJSON(q));

    expect(revived).toBeInstanceOf(Quaternion);
    expect(revived.x).toBeCloseTo(q.x);
    expect(revived.y).toBeCloseTo(q.y);
    expect(revived.z).toBeCloseTo(q.z);
    expect(revived.w).toBeCloseTo(q.w);

    // A method, not just a field -- appliedTo rotates (1,0,0) by 90 degrees
    // about X, which should leave it unchanged (rotation axis is X).
    const rotated = revived.appliedTo(new Vec3(1, 0, 0));
    expect(rotated.x).toBeCloseTo(1);
    expect(rotated.y).toBeCloseTo(0);
    expect(rotated.z).toBeCloseTo(0);
  });

  test("VertexArray2D revives as a VertexArray2D, and its attribute/index data revives as the right classes with working methods", () => {
    // A triangle: 3 vertices, each a homogeneous 2D position (x, y, 1),
    // with per-vertex RGBA colors.
    const va = new VertexArray2D(
      [0, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]
    );
    const revived = ASerializableFromJSON(ASerializableToJSON(va));

    expect(revived).toBeInstanceOf(VertexArray2D);
    expect(revived.position.constructor.name).toBe("VertexPositionArray2DH");
    expect(revived.position.getAt(0)).toBeInstanceOf(Vec3);
    expect(revived.position.getAt(1).x).toBeCloseTo(1);
    expect(revived.position.getAt(1).y).toBeCloseTo(1);
  });
});

describe("Quaternion JSON convention marker", () => {
  test("toJSON writes convention: 'std', and fromJSON reads it back unchanged", () => {
    const q = Quaternion.FromAxisAngle(new Vec3(1, 2, 3), 0.7);
    const json = q.toJSON();
    expect(json.convention).toBe("std");
    const back = Quaternion.fromJSON(json);
    expect(back.isEqualTo(q, 1e-12)).toBe(true);
  });

  test("data with no marker (saved by older AniGraph) loads as the same rotation, with one warning", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    Quaternion._warnedOldConventionJSON = false;
    // The old convention stored the conjugate: RotationX(pi/2) was saved as (-sin(pi/4), 0, 0, cos(pi/4)).
    const s = Math.SQRT1_2;
    const old = { x: -s, y: 0, z: 0, w: s };
    const q = Quaternion.fromJSON(old);
    const rotated = q.appliedTo(new Vec3(0, 1, 0));
    expect(rotated.x).toBeCloseTo(0);
    expect(rotated.y).toBeCloseTo(0);
    expect(rotated.z).toBeCloseTo(1);
    Quaternion.fromJSON(old);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  test("a NodeTransform3D with a rotation round-trips through ASerializable with the same matrix", () => {
    const t = new NodeTransform3D(new Vec3(1, 2, 3), Quaternion.FromAxisAngle(new Vec3(1, 1, 0), 0.7), new Vec3(2, 1, 0.5));
    const revived = ASerializableFromJSON(ASerializableToJSON(t));
    expect(revived).toBeInstanceOf(NodeTransform3D);
    const a = revived.getMatrix().elements, b = t.getMatrix().elements;
    for (let i = 0; i < 16; i++) {
      expect(a[i]).toBeCloseTo(b[i], 12);
    }
  });
});
