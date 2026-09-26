import { Quaternion, Vec3, V3, V4 } from '../../../../';
import { VecCloseTo } from '../../../test/AMathTestHelpers';

expect.extend(VecCloseTo);

const i = V3(1, 0, 0);
const j = V3(0, 1, 0);
const k = V3(0, 0, 1);

describe('Quaternion identity', () => {
  test('new Quaternion() has w=1, x=y=z=0', () => {
    const q = new Quaternion();
    expect(q.w).toBeCloseTo(1);
    expect(q.x).toBeCloseTo(0);
    expect(q.y).toBeCloseTo(0);
    expect(q.z).toBeCloseTo(0);
  });

  test('Quaternion.Identity() appliedTo(v) returns v', () => {
    const q = Quaternion.Identity();
    expect(q.appliedTo(i)).VecCloseTo(i);
    expect(q.appliedTo(V3(3, -2, 5))).VecCloseTo(V3(3, -2, 5));
  });
});

describe('Quaternion FromAxisAngle rotations', () => {
  test('RotationZ(PI/2).appliedTo(i) = j', () => {
    expect(Quaternion.RotationZ(Math.PI / 2).appliedTo(i)).VecCloseTo(j);
  });

  test('RotationX(PI/2).appliedTo(j) = k', () => {
    expect(Quaternion.RotationX(Math.PI / 2).appliedTo(j)).VecCloseTo(k);
  });

  test('RotationY(PI/2).appliedTo(k) = i', () => {
    expect(Quaternion.RotationY(Math.PI / 2).appliedTo(k)).VecCloseTo(i);
  });

  test('rotation by 2*PI returns original vector', () => {
    const v = V3(1, 2, 3);
    expect(Quaternion.RotationZ(2 * Math.PI).appliedTo(v)).VecCloseTo(v);
  });
});

describe('Quaternion composition (times)', () => {
  test('q * Identity applies only q rotation', () => {
    const q = Quaternion.RotationZ(Math.PI / 3);
    const r = q.times(Quaternion.Identity());
    expect(r.appliedTo(i)).VecCloseTo(q.appliedTo(i));
  });

  test('RotX(PI/2) * RotX(PI/2) = RotX(PI): j maps to -j', () => {
    const qx90 = Quaternion.RotationX(Math.PI / 2);
    expect(qx90.times(qx90).appliedTo(j)).VecCloseTo(j.times(-1));
  });
});

describe('Quaternion getInverse', () => {
  test('q * q.getInverse() gives identity rotation', () => {
    const q = Quaternion.RotationZ(Math.PI / 4);
    const v = V3(1, 2, 3);
    expect(q.times(q.getInverse()).appliedTo(v)).VecCloseTo(v);
  });

  test('unit quaternion inverse has negated xyz', () => {
    const q = Quaternion.RotationX(1.0);
    const qInv = q.getInverse();
    expect(qInv.x).toBeCloseTo(-q.x, 6);
    expect(qInv.y).toBeCloseTo(-q.y, 6);
    expect(qInv.z).toBeCloseTo(-q.z, 6);
    expect(qInv.w).toBeCloseTo(q.w, 6);
  });
});

describe('Quaternion Mat4', () => {
  test('RotationZ(PI/2).Mat4() applied to i gives j', () => {
    const M = Quaternion.RotationZ(Math.PI / 2).Mat4();
    const r = M.times(V4(1, 0, 0, 0));
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(1);
    expect(r.z).toBeCloseTo(0);
  });

  test('round-trip: Quaternion.FromMatrix(q.Mat4()) ≈ q', () => {
    const q = Quaternion.RotationX(0.8);
    const q2 = Quaternion.FromMatrix(q.Mat4());
    expect(q2.appliedTo(V3(1, 2, 3))).VecCloseTo(q.appliedTo(V3(1, 2, 3)));
  });
});

describe('Quaternion.isEqualTo', () => {
  test('quaternions that differ only in y, z or w are not equal', () => {
    const a = new Quaternion(0.1, 0.2, 0.3, 0.9);
    expect(a.isEqualTo(new Quaternion(0.1, 0.5, 0.3, 0.9))).toBe(false);
    expect(a.isEqualTo(new Quaternion(0.1, 0.2, 0.6, 0.9))).toBe(false);
    expect(a.isEqualTo(new Quaternion(0.1, 0.2, 0.3, 0.1))).toBe(false);
  });

  test('a quaternion equals itself and its negation (same rotation)', () => {
    const a = new Quaternion(0.1, 0.2, 0.3, 0.9);
    expect(a.isEqualTo(new Quaternion(0.1, 0.2, 0.3, 0.9))).toBe(true);
    expect(a.isEqualTo(new Quaternion(-0.1, -0.2, -0.3, -0.9))).toBe(true);
  });

  test('tolerance is respected', () => {
    const a = new Quaternion(0.1, 0.2, 0.3, 0.9);
    expect(a.isEqualTo(new Quaternion(0.1, 0.2, 0.3001, 0.9), 1e-3)).toBe(true);
    expect(a.isEqualTo(new Quaternion(0.1, 0.2, 0.3001, 0.9), 1e-6)).toBe(false);
  });
});
