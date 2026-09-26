import { NodeTransform3D, Vec3, V3, V4, Mat4, Quaternion } from '../../../';
import { VecCloseTo, MatrixCloseTo } from '../../test/AMathTestHelpers';

expect.extend(VecCloseTo);
expect.extend(MatrixCloseTo);

describe('NodeTransform3D getMatrix', () => {
  test('default transform produces identity Mat4', () => {
    expect(new NodeTransform3D().getMatrix()).MatrixCloseTo(Mat4.Identity());
  });

  test('translation maps origin correctly', () => {
    const r = new NodeTransform3D(V3(1, 2, 3)).getMatrix().times(V4(0, 0, 0, 1));
    expect(r).VecCloseTo(V4(1, 2, 3, 1));
  });

  test('rotation by quaternion matches quaternion.Mat4()', () => {
    const q = Quaternion.RotationZ(Math.PI / 2);
    expect(new NodeTransform3D(V3(0, 0, 0), q).getMatrix()).MatrixCloseTo(q.Mat4());
  });

  test('uniform scale scales a point', () => {
    const r = new NodeTransform3D(V3(0, 0, 0), new Quaternion(), V3(3, 3, 3)).getMatrix().times(V4(1, 1, 1, 1));
    expect(r.x).toBeCloseTo(3);
    expect(r.y).toBeCloseTo(3);
    expect(r.z).toBeCloseTo(3);
  });
});

describe('NodeTransform3D getInverse', () => {
  test('T * T.getInverse() ≈ identity (translation only)', () => {
    const T = new NodeTransform3D(V3(5, -3, 2));
    expect(T.getMatrix().times(T.getInverse().getMatrix())).MatrixCloseTo(Mat4.Identity());
  });

  test('T * T.getInverse() round-trip on a point (with rotation)', () => {
    const T = new NodeTransform3D(V3(1, 2, 3), Quaternion.RotationY(Math.PI / 3), V3(2, 2, 2));
    const p = V4(0, 0, 0, 1);
    const roundTrip = T.getInverse().getMatrix().times(T.getMatrix().times(p));
    expect(roundTrip).VecCloseTo(p);
  });
});

describe('NodeTransform3D clone', () => {
  test('clone produces same matrix', () => {
    const T = new NodeTransform3D(V3(1, 2, 3), Quaternion.RotationX(0.5), V3(2, 2, 2));
    expect(T.clone().getMatrix()).MatrixCloseTo(T.getMatrix());
  });

  test('mutating clone does not affect original', () => {
    const T = new NodeTransform3D(V3(1, 2, 3));
    const origMatrix = T.getMatrix();
    const C = T.clone();
    C.position = V3(99, 99, 99);
    expect(T.getMatrix()).MatrixCloseTo(origMatrix);
  });
});

describe('NodeTransform3D getInverse with an anchor and scale', () => {
  const axis = V3(1, 2, -0.5).getNormalized();

  test('uniform scale + rotation + anchor: returns an exact NodeTransform3D inverse', () => {
    const T = new NodeTransform3D(V3(1, -2, 3), Quaternion.FromAxisAngle(axis, 0.8), V3(2, 2, 2), V3(0.5, 1, -1));
    const inv = T.getInverse();
    expect(inv).toBeInstanceOf(NodeTransform3D);
    expect(inv.getMatrix().times(T.getMatrix())).MatrixCloseTo(Mat4.Identity());
    expect(T.getMatrix().times(inv.getMatrix())).MatrixCloseTo(Mat4.Identity());
  });

  test('non-uniform scale + rotation + anchor: inverse matrix times matrix is the identity', () => {
    const T = new NodeTransform3D(V3(1, -2, 3), Quaternion.FromAxisAngle(axis, 0.8), V3(1, 2, 3), V3(0.5, 1, -1));
    const inv = T.getInverse();
    expect(inv.getMatrix().times(T.getMatrix())).MatrixCloseTo(Mat4.Identity());
  });
});
