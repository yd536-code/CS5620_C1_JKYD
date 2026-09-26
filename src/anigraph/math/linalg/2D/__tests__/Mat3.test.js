import { Vec2, Vec3, Mat3, Vec2DH, Point2DH } from '../../../../';
import { VecCloseTo, MatrixCloseTo } from '../../../test/AMathTestHelpers';

expect.extend(VecCloseTo);
expect.extend(MatrixCloseTo);

describe('Mat3 factories', () => {
  test('Mat3.Identity() times any Vec3 is identity', () => {
    const v = new Vec3(2, 3, 1);
    expect(Mat3.Identity().times(v)).VecCloseTo(v);
  });

  test('Mat3.Translation2D(tx, ty) maps (0,0,1) to (tx,ty,1)', () => {
    const T = Mat3.Translation2D(new Vec2(3, 4));
    expect(T.times(new Vec3(0, 0, 1))).VecCloseTo(new Vec3(3, 4, 1));
  });

  test('Mat3.Rotation(PI/2) maps (1,0,0) to (0,1,0)', () => {
    const R = Mat3.Rotation(Math.PI / 2);
    expect(R.times(new Vec3(1, 0, 0))).VecCloseTo(new Vec3(0, 1, 0));
  });

  test('Mat3.Scale2D(2,3) maps (1,1,1) to (2,3,1)', () => {
    const S = Mat3.Scale2D(new Vec2(2, 3));
    expect(S.times(new Vec3(1, 1, 1))).VecCloseTo(new Vec3(2, 3, 1));
  });
});

describe('Mat3 times Vec3', () => {
  test('T(tx,ty) * Point2DH(x,y) = Point2DH(x+tx, y+ty)', () => {
    const T = Mat3.Translation2D(new Vec2(5, -2));
    expect(T.times(Point2DH(3, 7))).VecCloseTo(Point2DH(8, 5));
  });

  test('R(pi/4) * Vec2DH(1,0) ≈ Vec2DH(cos45, sin45)', () => {
    const R = Mat3.Rotation(Math.PI / 4);
    const c = Math.cos(Math.PI / 4);
    const s = Math.sin(Math.PI / 4);
    expect(R.times(Vec2DH(1, 0))).VecCloseTo(Vec2DH(c, s));
  });

  test('S(sx,sy) * Point2DH(x,y) = Point2DH(sx*x, sy*y)', () => {
    const S = Mat3.Scale2D(new Vec2(3, 2));
    expect(S.times(Point2DH(4, 5))).VecCloseTo(Point2DH(12, 10));
  });
});

describe('Mat3 composition', () => {
  test('M * M_inverse ≈ Identity for translation', () => {
    const T = Mat3.Translation2D(new Vec2(7, -3));
    expect(T.times(T.getInverse())).MatrixCloseTo(Mat3.Identity());
  });

  test('M * M_inverse ≈ Identity for rotation', () => {
    const R = Mat3.Rotation(1.2);
    expect(R.times(R.getInverse())).MatrixCloseTo(Mat3.Identity());
  });

  test('M * M_inverse ≈ Identity for scale', () => {
    const S = Mat3.Scale2D(new Vec2(2, 3));
    expect(S.times(S.getInverse())).MatrixCloseTo(Mat3.Identity());
  });
});

describe('Mat3 getInverse', () => {
  test('inverse of Translation moves in opposite direction', () => {
    const T = Mat3.Translation2D(new Vec2(4, -2));
    expect(T.getInverse().times(Point2DH(4, -2))).VecCloseTo(Point2DH(0, 0));
  });

  test('inverse of Scale uses reciprocal', () => {
    const S = Mat3.Scale2D(new Vec2(4, 2));
    expect(S.getInverse().times(Point2DH(4, 2))).VecCloseTo(Point2DH(1, 1));
  });

  test('non-invertible matrix throws', () => {
    const singular = new Mat3(0, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(() => singular.getInverse()).toThrow();
  });
});

describe('Mat3.setPosition', () => {
  test('uses x and y directly, even when z is 0', () => {
    const m = Mat3.Identity();
    m.setPosition(new Vec3(1, 2, 0));
    expect(m.m02).toBe(1);
    expect(m.m12).toBe(2);
  });

  test('ignores z (z = 3 does not divide x and y)', () => {
    const m = Mat3.Identity();
    m.setPosition(new Vec3(1, 2, 3));
    expect(m.getPosition()).VecCloseTo(new Vec3(1, 2, 0));
  });
});
