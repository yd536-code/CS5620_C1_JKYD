import { Vec2, Vec3, Vec2DH, Point2DH } from '../../../../';
import { VecCloseTo } from '../../../test/AMathTestHelpers';

expect.extend(VecCloseTo);

describe('Vec3 construction', () => {
  test('new Vec3(x, y, z) sets all three elements', () => {
    const v = new Vec3(1, 2, 3);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(3);
  });

  test('new Vec3([x,y,z]) works', () => {
    const v = new Vec3([4, 5, 6]);
    expect(v.x).toBe(4);
    expect(v.y).toBe(5);
    expect(v.z).toBe(6);
  });
});

describe('Vec3 arithmetic', () => {
  test('plus returns correct sum', () => {
    expect(new Vec3(1, 2, 3).plus(new Vec3(4, 5, 6))).VecCloseTo(new Vec3(5, 7, 9));
  });

  test('minus returns correct difference', () => {
    expect(new Vec3(5, 7, 9).minus(new Vec3(1, 2, 3))).VecCloseTo(new Vec3(4, 5, 6));
  });

  test('times scales all components', () => {
    expect(new Vec3(1, 2, 3).times(2)).VecCloseTo(new Vec3(2, 4, 6));
  });
});

describe('Vec3 cross product', () => {
  const i = new Vec3(1, 0, 0);
  const j = new Vec3(0, 1, 0);
  const k = new Vec3(0, 0, 1);

  test('i × j = k', () => {
    expect(i.cross(j)).VecCloseTo(k);
  });

  test('j × k = i', () => {
    expect(j.cross(k)).VecCloseTo(i);
  });

  test('v × v = zero vector', () => {
    expect(new Vec3(1, 2, 3).cross(new Vec3(1, 2, 3))).VecCloseTo(new Vec3(0, 0, 0));
  });

  test('cross is anti-commutative: a × b = -(b × a)', () => {
    const a = new Vec3(1, 2, 3);
    const b = new Vec3(4, 5, 6);
    expect(a.cross(b)).VecCloseTo(b.cross(a).times(-1));
  });
});

describe('Vec3 normalization', () => {
  test('normalized i-hat is i-hat', () => {
    expect(new Vec3(1, 0, 0).getNormalized()).VecCloseTo(new Vec3(1, 0, 0));
  });

  test('normalized (3,4,0) has length 1', () => {
    expect(new Vec3(3, 4, 0).getNormalized().L2()).toBeCloseTo(1, 6);
  });
});

describe('Vec3 homogeneous accessors', () => {
  test('.Point3DH produces Vec4 with w=1', () => {
    const h = new Vec3(1, 2, 3).Point3DH;
    expect(h.x).toBeCloseTo(1);
    expect(h.y).toBeCloseTo(2);
    expect(h.z).toBeCloseTo(3);
    expect(h.h).toBeCloseTo(1);
  });

  test('.Vec3DH produces Vec4 with w=0', () => {
    const h = new Vec3(1, 2, 3).Vec3DH;
    expect(h.h).toBeCloseTo(0);
  });

  test('.xy returns Vec2 with correct x,y', () => {
    const xy = new Vec3(3, 5, 7).xy;
    expect(xy.x).toBeCloseTo(3);
    expect(xy.y).toBeCloseTo(5);
  });

  test('Vec2DH helper produces Vec3 with z=0', () => {
    const v = Vec2DH(2, 3);
    expect(v.x).toBeCloseTo(2);
    expect(v.y).toBeCloseTo(3);
    expect(v.z).toBeCloseTo(0);
  });

  test('Point2DH helper produces Vec3 with z=1', () => {
    const v = Point2DH(2, 3);
    expect(v.x).toBeCloseTo(2);
    expect(v.y).toBeCloseTo(3);
    expect(v.z).toBeCloseTo(1);
  });
});

describe('VectorBase.RandomVector', () => {
  test('values lie in the given range and the length is n', () => {
    for (let trial = 0; trial < 20; trial++) {
      const v = Vec3.RandomVector(3, [2, 5]);
      expect(v.elements.length).toBe(3);
      for (const e of v.elements) {
        expect(e).toBeGreaterThanOrEqual(2);
        expect(e).toBeLessThanOrEqual(5);
      }
    }
  });

  test('without a range, values lie in [0, 1]', () => {
    const v = Vec3.RandomVector(3);
    expect(v.elements.length).toBe(3);
    for (const e of v.elements) {
      expect(e).toBeGreaterThanOrEqual(0);
      expect(e).toBeLessThanOrEqual(1);
    }
  });
});
