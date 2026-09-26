/**
 * Pins what `Quaternion` means: it follows the three.js / standard convention.
 *
 * The first group ("meaning") checks what each rotation *does*: which way it turns a vector, which matrix it gives,
 * how a camera orientation points. It does not look at the stored x, y, z, w or at the order of `times`, so it
 * would still hold under any storage convention that gives the same rotations.
 *
 * The second group ("standard convention") checks the stored numbers and the order of `times`: a `Quaternion` holds
 * the same x, y, z, w as the `THREE.Quaternion` for the same rotation, and `a.times(b)` follows matrix order.
 */
import * as THREE from "three";
import {Mat3, Mat4, NodeTransform3D, Quaternion, V3, Vec3} from "../../../../";

const TOL = 1e-9;

function expectMatClose(a: Mat3 | Mat4, b: Mat3 | Mat4, tol: number = TOL) {
    expect(a.elements.length).toBe(b.elements.length);
    for (let i = 0; i < a.elements.length; i++) {
        expect(Math.abs(a.elements[i] - b.elements[i])).toBeLessThan(tol);
    }
}

function expectVecClose(a: Vec3, b: Vec3, tol: number = TOL) {
    expect(Math.abs(a.x - b.x)).toBeLessThan(tol);
    expect(Math.abs(a.y - b.y)).toBeLessThan(tol);
    expect(Math.abs(a.z - b.z)).toBeLessThan(tol);
}

/** Rodrigues' rotation matrix for a unit `axis` and `angle` (right-hand rule), written out independently. */
function rodrigues(axis: Vec3, angle: number): Mat3 {
    const a = axis.getNormalized();
    const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
    const x = a.x, y = a.y, z = a.z;
    return new Mat3(
        t * x * x + c, t * x * y - s * z, t * x * z + s * y,
        t * x * y + s * z, t * y * y + c, t * y * z - s * x,
        t * x * z - s * y, t * y * z + s * x, t * z * z + c
    );
}

/** A small deterministic pseudo-random generator, so failures are reproducible. */
function makeRng(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

const rng = makeRng(12345);
const CASES: Array<{axis: Vec3, angle: number}> = [];
for (let i = 0; i < 12; i++) {
    CASES.push({
        axis: V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).getNormalized(),
        angle: (rng() * 2 - 1) * Math.PI * 0.95,
    });
}
const VECS = [V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1), V3(0.3, -1.2, 2.5)];

describe("Quaternion meaning (independent of convention)", () => {
    test("RotationX/Y/Z by pi/2 turn the axes the right-handed way", () => {
        expectVecClose(Quaternion.RotationX(Math.PI / 2).appliedTo(V3(0, 1, 0)), V3(0, 0, 1));
        expectVecClose(Quaternion.RotationY(Math.PI / 2).appliedTo(V3(0, 0, 1)), V3(1, 0, 0));
        expectVecClose(Quaternion.RotationZ(Math.PI / 2).appliedTo(V3(1, 0, 0)), V3(0, 1, 0));
    });

    test("RotationX/Y/Z match Mat4.RotationX/Y/Z", () => {
        for (const t of [0.3, -1.1, 2.9]) {
            expectMatClose(Quaternion.RotationX(t).Mat4(), Mat4.RotationX(t));
            expectMatClose(Quaternion.RotationY(t).Mat4(), Mat4.RotationY(t));
            expectMatClose(Quaternion.RotationZ(t).Mat4(), Mat4.RotationZ(t));
        }
    });

    test.each(CASES.map((c, i) => [i, c]))("FromAxisAngle gives the Rodrigues matrix (case %i)", (_i, c) => {
        const {axis, angle} = c as {axis: Vec3, angle: number};
        expectMatClose(Quaternion.FromAxisAngle(axis, angle).Mat3(), rodrigues(axis, angle));
    });

    test("FromAxisAngle works with a non-unit axis", () => {
        expectMatClose(Quaternion.FromAxisAngle(V3(0, 0, 5), 0.7).Mat3(), rodrigues(V3(0, 0, 1), 0.7));
    });

    test.each(CASES.map((c, i) => [i, c]))("FromMatrix(R).Mat3() equals R (case %i)", (_i, c) => {
        const {axis, angle} = c as {axis: Vec3, angle: number};
        const R = rodrigues(axis, angle);
        expectMatClose(Quaternion.FromMatrix(R).Mat3(), R, 1e-8);
        expectMatClose(Quaternion.FromMatrix(Mat4.RotationAxisAngle(axis, angle)).Mat3(), R, 1e-8);
    });

    test("FromMatrix handles every branch (rotations by pi about each axis, and near-identity)", () => {
        for (const axis of [V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1), V3(1, 1, 0).getNormalized()]) {
            for (const angle of [Math.PI, Math.PI * 0.9, 0.01]) {
                const R = rodrigues(axis, angle);
                expectMatClose(Quaternion.FromMatrix(R).Mat3(), R, 1e-8);
            }
        }
    });

    test("FromMatrix accepts a THREE.Matrix4", () => {
        const R = Mat4.RotationAxisAngle(V3(1, 2, 3).getNormalized(), 1.1);
        const m = new THREE.Matrix4();
        R.assignTo(m);
        expectMatClose(Quaternion.FromMatrix(m).Mat4(), R, 1e-8);
    });

    test.each(CASES.map((c, i) => [i, c]))("appliedTo(v) equals Mat3()*v, and Mat4 agrees with Mat3 (case %i)", (_i, c) => {
        const {axis, angle} = c as {axis: Vec3, angle: number};
        const q = Quaternion.FromAxisAngle(axis, angle);
        for (const v of VECS) {
            expectVecClose(q.appliedTo(v), q.Mat3().times(v) as Vec3);
            expectVecClose(q.appliedTo(v), q.Mat4().times(v.Point3DH).Point3D);
        }
        expectVecClose(q.getLocalX(), q.Mat3().c0);
        expectVecClose(q.getLocalY(), q.Mat3().c1);
        expectVecClose(q.getLocalZ(), q.Mat3().c2);
    });

    test.each(CASES.map((c, i) => [i, c]))("getInverse undoes the rotation (case %i)", (_i, c) => {
        const {axis, angle} = c as {axis: Vec3, angle: number};
        const q = Quaternion.FromAxisAngle(axis, angle);
        for (const v of VECS) {
            expectVecClose(q.getInverse().appliedTo(q.appliedTo(v)), v);
        }
        expectMatClose(q.getInverse().Mat3(), rodrigues(axis, -angle));
    });

    test("FromCameraOrientationVectors: local -z points along forward, local y toward up", () => {
        const forward = V3(1, -2, 0.5).getNormalized();
        const up = V3(0, 0, 1);
        const q = Quaternion.FromCameraOrientationVectors(forward, up);
        expectVecClose(q.getLocalZ(), forward.times(-1));
        expect(Math.abs(q.getLocalY().dot(forward))).toBeLessThan(1e-9);
        expect(q.getLocalY().dot(up)).toBeGreaterThan(0);
        expectVecClose(q.getLocalX().cross(q.getLocalY()), q.getLocalZ());
    });

    test("FromZAndUp: local +z points along z", () => {
        const z = V3(-1, 0.4, 2).getNormalized();
        const q = Quaternion.FromZAndUp(z, V3(0, 1, 0));
        expectVecClose(q.getLocalZ(), z);
    });

    test("FromRotationBetweenTwoVectors turns the first direction into the second", () => {
        const a = V3(1, 2, -1), b = V3(-3, 0.5, 2);
        const q = Quaternion.FromRotationBetweenTwoVectors(a, b);
        expectVecClose(q.appliedTo(a.getNormalized()), b.getNormalized());
    });

    test("FromRotationBetweenTwoVectors does not change THREE.Vector3 inputs", () => {
        const a = new THREE.Vector3(1, 2, -1), b = new THREE.Vector3(-3, 0.5, 2);
        Quaternion.FromRotationBetweenTwoVectors(a, b);
        expect([a.x, a.y, a.z]).toEqual([1, 2, -1]);
        expect([b.x, b.y, b.z]).toEqual([-3, 0.5, 2]);
    });

    test("Slerp endpoints and midpoint", () => {
        const a = Quaternion.RotationZ(0.2), b = Quaternion.RotationZ(1.0);
        expectMatClose(Quaternion.Slerp(a, b, 0).Mat3(), a.Mat3());
        expectMatClose(Quaternion.Slerp(a, b, 1).Mat3(), b.Mat3());
        expectMatClose(Quaternion.Slerp(a, b, 0.5).Mat3(), Quaternion.RotationZ(0.6).Mat3());
    });

    test("NodeTransform3D matrix is P*R*S*A with R = rotation.Mat4()", () => {
        const q = Quaternion.FromAxisAngle(V3(1, 1, 0), 0.8);
        const T = new NodeTransform3D(V3(1, 2, 3), q, V3(2, 1, 0.5), V3(0.1, 0.2, 0.3));
        const expected = Mat4.Translation3D(V3(1, 2, 3))
            .times(Mat4.RotationAxisAngle(V3(1, 1, 0).getNormalized(), 0.8))
            .times(Mat4.Scale3D(V3(2, 1, 0.5)))
            .times(Mat4.Translation3D(V3(-0.1, -0.2, -0.3)));
        expectMatClose(T.getMatrix(), expected);
    });

    test("NodeTransform3D.LookAt: the camera at `location` looks at `target`", () => {
        const location = V3(1, 2, 3), target = V3(-1, 0, 0.5), up = V3(0, 0, 1);
        const pose = NodeTransform3D.LookAt(location, target, up);
        const M = pose.getMatrix();
        expectVecClose(M.times(V3(0, 0, 0).Point3DH).Point3D, location);
        // The local -z axis, in world space, points toward the target.
        const minusZ = M.times(V3(0, 0, -1).Point3DH).Point3D.minus(location);
        expectVecClose(minusZ, target.minus(location).getNormalized());
        // The local y axis leans toward `up`.
        expect(M.times(V3(0, 1, 0).Point3DH).Point3D.minus(location).dot(up)).toBeGreaterThan(0);
    });
});

describe("Quaternion standard (three.js) convention", () => {
    test.each(CASES.map((c, i) => [i, c]))("FromAxisAngle stores the same x, y, z, w as THREE.Quaternion (case %i)", (_i, c) => {
        const {axis, angle} = c as {axis: Vec3, angle: number};
        const q = Quaternion.FromAxisAngle(axis, angle);
        const t = new THREE.Quaternion().setFromAxisAngle(axis.asThreeJS().normalize(), angle);
        expect(q.isEqualTo(new Quaternion(t.x, t.y, t.z, t.w), 1e-9)).toBe(true);
    });

    test("RotationX(t) stores (sin(t/2), 0, 0, cos(t/2))", () => {
        const q = Quaternion.RotationX(0.6);
        expect(q.x).toBeCloseTo(Math.sin(0.3), 12);
        expect(q.y).toBeCloseTo(0, 12);
        expect(q.z).toBeCloseTo(0, 12);
        expect(q.w).toBeCloseTo(Math.cos(0.3), 12);
    });

    test.each(CASES.map((c, i) => [i, c]))("FromMatrix matches THREE.Quaternion.setFromRotationMatrix (case %i)", (_i, c) => {
        const {axis, angle} = c as {axis: Vec3, angle: number};
        const R = Mat4.RotationAxisAngle(axis, angle);
        const m = new THREE.Matrix4();
        R.assignTo(m);
        const t = new THREE.Quaternion().setFromRotationMatrix(m);
        expect(Quaternion.FromMatrix(R).isEqualTo(new Quaternion(t.x, t.y, t.z, t.w), 1e-9)).toBe(true);
    });

    test.each(CASES.map((c, i) => [i, c]))("appliedTo matches THREE.Vector3.applyQuaternion (case %i)", (_i, c) => {
        const {axis, angle} = c as {axis: Vec3, angle: number};
        const q = Quaternion.FromAxisAngle(axis, angle);
        for (const v of VECS) {
            const tv = v.asThreeJS().applyQuaternion(q);
            expectVecClose(q.appliedTo(v), V3(tv.x, tv.y, tv.z));
        }
    });

    test("a.times(b) follows matrix order: a.times(b).Mat4() = a.Mat4() * b.Mat4()", () => {
        for (let i = 0; i + 1 < CASES.length; i++) {
            const a = Quaternion.FromAxisAngle(CASES[i].axis, CASES[i].angle);
            const b = Quaternion.FromAxisAngle(CASES[i + 1].axis, CASES[i + 1].angle);
            expectMatClose(a.times(b).Mat4(), a.Mat4().times(b.Mat4()), 1e-9);
        }
    });

    test("a.times(M) with a matrix M means a.times(FromMatrix(M))", () => {
        const a = Quaternion.RotationX(0.4);
        const M = Mat4.RotationY(1.2);
        expectMatClose(a.times(M).Mat4(), Mat4.RotationX(0.4).times(M), 1e-9);
    });

    test.each(CASES.map((c, i) => [i, c]))("getAxisAndAngle gives back the axis and angle (case %i)", (_i, c) => {
        const {axis, angle} = c as {axis: Vec3, angle: number};
        const {axis: a2, angle: t2} = Quaternion.FromAxisAngle(axis, angle).getAxisAndAngle();
        // (axis, angle) and (-axis, -angle) are the same rotation; getAxisAndAngle returns angle in [0, pi].
        expect(t2).toBeGreaterThanOrEqual(0);
        expect(t2).toBeLessThanOrEqual(Math.PI + 1e-12);
        expectMatClose(rodrigues(a2, t2), rodrigues(axis, angle), 1e-9);
        expect(t2).toBeCloseTo(Math.abs(angle), 9);
        expectVecClose(a2, angle >= 0 ? axis : axis.times(-1), 1e-9);
    });

    test("getAxisAndAngle of the identity is angle 0 with a finite unit axis", () => {
        const {axis, angle} = Quaternion.Identity().getAxisAndAngle();
        expect(angle).toBeCloseTo(0, 12);
        expect(axis.L2()).toBeCloseTo(1, 12);
    });

    test("assignToObject3DPose: three.js composes the same matrix as getMatrix()", () => {
        const pose = new NodeTransform3D(V3(1, -2, 3), Quaternion.FromAxisAngle(V3(1, 2, 3), 1.3), V3(2, 1, 0.5));
        const obj = new THREE.Object3D();
        pose.assignToObject3DPose(obj);
        obj.updateMatrix(); // recompose obj.matrix from position/quaternion/scale
        expectMatClose(Mat4.FromThreeJS(obj.matrix), pose.getMatrix(), 1e-9);
    });

    test("FromThreeJSObject reads a three.js object's pose with the same meaning", () => {
        const obj = new THREE.Object3D();
        obj.position.set(4, 5, 6);
        obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.9);
        obj.scale.set(1, 2, 3);
        obj.updateMatrix();
        expectMatClose(NodeTransform3D.FromThreeJSObject(obj).getMatrix(), Mat4.FromThreeJS(obj.matrix), 1e-9);
    });

    test("PoseProduct(lhs, rhs) is the pose of lhs.getMatrix() * rhs.getMatrix()", () => {
        const lhs = new NodeTransform3D(V3(1, 2, 3), Quaternion.FromAxisAngle(V3(1, 0, 1), 0.7));
        const rhs = new NodeTransform3D(V3(-1, 0.5, 2), Quaternion.FromAxisAngle(V3(0, 1, 1), -1.2));
        expectMatClose(NodeTransform3D.PoseProduct(lhs, rhs).getMatrix(), lhs.getMatrix().times(rhs.getMatrix()), 1e-9);
    });

    test("getLeftMultipliedByRotation(r) is r * T, and getRightMultipliedByRotation(r) is T * r", () => {
        const T = new NodeTransform3D(V3(1, 2, 3), Quaternion.FromAxisAngle(V3(1, 0, 1), 0.7));
        const r = Quaternion.FromAxisAngle(V3(0, 1, 1), -1.2);
        expectMatClose(T.getLeftMultipliedByRotation(r).getMatrix(), r.Mat4().times(T.getMatrix()), 1e-9);
        const right = T.getRightMultipliedByRotation(r).getMatrix();
        expectMatClose(right.getLinearPart() as any, T.getMatrix().times(r.Mat4()).getLinearPart() as any, 1e-9);
    });
});
