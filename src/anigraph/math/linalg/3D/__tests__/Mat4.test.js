import { Mat4, Vec4, V4, Vec3, V3, Quaternion } from '../../../../';
import { VecCloseTo, MatrixCloseTo } from '../../../test/AMathTestHelpers';

expect.extend(VecCloseTo);
expect.extend(MatrixCloseTo);

describe('Mat4 factories', () => {
  test('Mat4.Identity() times Vec4 is identity', () => {
    const v = V4(1, 2, 3, 1);
    expect(Mat4.Identity().times(v)).VecCloseTo(v);
  });

  test('Mat4.Translation3D maps origin to translation vector', () => {
    const T = Mat4.Translation3D(2, 3, 4);
    expect(T.times(V4(0, 0, 0, 1))).VecCloseTo(V4(2, 3, 4, 1));
  });

  test('Mat4.Scale3D(s) scales uniformly', () => {
    const r = Mat4.Scale3D(3).times(V4(1, 1, 1, 1));
    expect(r.x).toBeCloseTo(3);
    expect(r.y).toBeCloseTo(3);
    expect(r.z).toBeCloseTo(3);
    expect(r.h).toBeCloseTo(1);
  });

  test('Mat4.Scale3D(Vec3) scales non-uniformly', () => {
    const r = Mat4.Scale3D(new Vec3(2, 3, 4)).times(V4(1, 1, 1, 1));
    expect(r.x).toBeCloseTo(2);
    expect(r.y).toBeCloseTo(3);
    expect(r.z).toBeCloseTo(4);
  });
});

describe('Mat4 times Vec4', () => {
  test('Identity * v = v', () => {
    const v = V4(5, -3, 2, 1);
    expect(Mat4.Identity().times(v)).VecCloseTo(v);
  });

  test('Translation(tx,ty,tz) * point = translated point', () => {
    expect(Mat4.Translation3D(1, 2, 3).times(V4(4, 5, 6, 1))).VecCloseTo(V4(5, 7, 9, 1));
  });

  test('Scale(2) * point = doubled coordinates', () => {
    const r = Mat4.Scale3D(2).times(V4(3, 4, 5, 1));
    expect(r.x).toBeCloseTo(6);
    expect(r.y).toBeCloseTo(8);
    expect(r.z).toBeCloseTo(10);
  });
});

describe('Mat4 inverse', () => {
  test('M * getInverse() ≈ Identity (translation)', () => {
    const T = Mat4.Translation3D(3, -2, 5);
    expect(T.times(T.getInverse())).MatrixCloseTo(Mat4.Identity());
  });

  test('M * getInverse() ≈ Identity (scale)', () => {
    const S = Mat4.Scale3D(new Vec3(2, 3, 4));
    expect(S.times(S.getInverse())).MatrixCloseTo(Mat4.Identity());
  });

  test('singular matrix getInverse() returns zero matrix', () => {
    const singular = new Mat4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    for (const el of singular.getInverse().elements) {
      expect(el).toBeCloseTo(0);
    }
  });
});

describe('Mat4 column and row accessors', () => {
  test('getTranspose swaps rows and columns', () => {
    const M = new Mat4(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    const MT = M.getTranspose();
    expect(MT.m01).toBeCloseTo(M.m10);
    expect(MT.m02).toBeCloseTo(M.m20);
  });

  test('c0 column accessor matches first column of identity', () => {
    const c0 = Mat4.Identity().c0;
    expect(c0.x).toBeCloseTo(1);
    expect(c0.y).toBeCloseTo(0);
    expect(c0.z).toBeCloseTo(0);
    expect(c0.h).toBeCloseTo(0);
  });
});

describe('Mat4.setPosition', () => {
  test('writes the last column, so getPosition() reads it back', () => {
    const m = new Mat4();
    m.setPosition(V3(1, 2, 3));
    expect(m.getPosition()).VecCloseTo(V3(1, 2, 3));
  });

  test('leaves the bottom row as (0,0,0,1)', () => {
    const m = new Mat4();
    m.setPosition(V3(1, 2, 3));
    expect([m.m30, m.m31, m.m32, m.m33]).toEqual([0, 0, 0, 1]);
  });

  test('_setQuaternionRotation keeps the translation', () => {
    const m = Mat4.Translation3D(V3(4, 5, 6));
    m._setQuaternionRotation(Quaternion.RotationZ(Math.PI / 2));
    expect(m.getPosition()).VecCloseTo(V3(4, 5, 6));
    expect([m.m30, m.m31, m.m32, m.m33]).toEqual([0, 0, 0, 1]);
  });
});

describe('Mat4.FromEulerAngles', () => {
  test('matches THREE.Matrix4.makeRotationFromEuler for the same angles (XYZ order)', () => {
    // three.js stores matrices column-major; Mat4.FromThreeJS converts to AniGraph's row-major layout.
    const THREE = require('three');
    const [x, y, z] = [0.3, -0.7, 1.1];
    const expected = Mat4.FromThreeJS(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(x, y, z)));
    expect(Mat4.FromEulerAngles(x, y, z)).MatrixCloseTo(expected);
  });
});
