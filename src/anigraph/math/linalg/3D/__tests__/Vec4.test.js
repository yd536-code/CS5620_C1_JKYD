import { Vec4, V4, Vec3 } from '../../../../';
import { VecCloseTo } from '../../../test/AMathTestHelpers';

expect.extend(VecCloseTo);

describe('Vec4 construction', () => {
  test('new Vec4(x,y,z,h) sets four elements', () => {
    const v = new Vec4(1, 2, 3, 4);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(3);
    expect(v.h).toBe(4);
  });

  test('V4(x,y,z,h) shorthand works', () => {
    const v = V4(5, 6, 7, 8);
    expect(v.x).toBe(5);
    expect(v.y).toBe(6);
    expect(v.z).toBe(7);
    expect(v.h).toBe(8);
  });

  test('new Vec4() produces zero vector', () => {
    const v = new Vec4();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
    expect(v.z).toBe(0);
    expect(v.h).toBe(0);
  });
});

describe('Vec4 getHomogenized', () => {
  test('Vec4(2,4,6,2).getHomogenized() gives (1,2,3,1)', () => {
    const h = new Vec4(2, 4, 6, 2).getHomogenized();
    expect(h.x).toBeCloseTo(1);
    expect(h.y).toBeCloseTo(2);
    expect(h.z).toBeCloseTo(3);
    expect(h.h).toBeCloseTo(1);
  });

  test('Vec4(x,y,z,1).getHomogenized() is unchanged', () => {
    const h = new Vec4(3, 5, 7, 1).getHomogenized();
    expect(h.x).toBeCloseTo(3);
    expect(h.y).toBeCloseTo(5);
    expect(h.z).toBeCloseTo(7);
    expect(h.h).toBeCloseTo(1);
  });

  test('Vec4 with h=0 is unchanged (direction vector)', () => {
    const h = new Vec4(1, 2, 3, 0).getHomogenized();
    expect(h.x).toBeCloseTo(1);
    expect(h.h).toBeCloseTo(0);
  });
});

describe('Vec4 Point3D accessor', () => {
  test('Point3D extracts xyz from homogeneous point', () => {
    const p = new Vec4(4, 6, 8, 2).Point3D;
    expect(p).toBeInstanceOf(Vec3);
    expect(p.x).toBeCloseTo(2);
    expect(p.y).toBeCloseTo(3);
    expect(p.z).toBeCloseTo(4);
  });

  test('Point3D with w=1 gives same xyz', () => {
    const p = new Vec4(3, 5, 7, 1).Point3D;
    expect(p.x).toBeCloseTo(3);
    expect(p.y).toBeCloseTo(5);
    expect(p.z).toBeCloseTo(7);
  });
});
