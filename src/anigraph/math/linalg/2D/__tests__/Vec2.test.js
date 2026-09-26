import { Vec2 } from '../../../../';
import { VecCloseTo } from '../../../test/AMathTestHelpers';

expect.extend(VecCloseTo);

describe('Vec2 construction', () => {
  test('new Vec2(x, y) sets elements correctly', () => {
    const v = new Vec2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  test('new Vec2([x, y]) sets elements from array', () => {
    const v = new Vec2([7, -2]);
    expect(v.x).toBe(7);
    expect(v.y).toBe(-2);
  });

  test('new Vec2() produces zero vector', () => {
    const v = new Vec2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });
});

describe('Vec2 arithmetic', () => {
  test('plus returns correct sum', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(3, 4);
    expect(a.plus(b)).VecCloseTo(new Vec2(4, 6));
  });

  test('minus returns correct difference', () => {
    expect(new Vec2(5, 7).minus(new Vec2(2, 3))).VecCloseTo(new Vec2(3, 4));
  });

  test('times returns scaled vector', () => {
    expect(new Vec2(2, -3).times(4)).VecCloseTo(new Vec2(8, -12));
  });

  test('dot returns correct scalar', () => {
    expect(new Vec2(1, 2).dot(new Vec2(3, 4))).toBeCloseTo(11, 6);
  });

  test('timesElementWise returns per-element product', () => {
    expect(new Vec2(2, 3).timesElementWise(new Vec2(4, 5))).VecCloseTo(new Vec2(8, 15));
  });
});

describe('Vec2 geometry', () => {
  test('L2 returns correct length', () => {
    expect(new Vec2(3, 4).L2()).toBeCloseTo(5, 6);
    expect(new Vec2(0, 0).L2()).toBeCloseTo(0, 6);
  });

  test('getNormalized returns unit vector', () => {
    const v = new Vec2(3, 4).getNormalized();
    expect(v.L2()).toBeCloseTo(1, 6);
    expect(v).VecCloseTo(new Vec2(0.6, 0.8));
  });

  test('getNormalized on zero vector returns near-zero vector', () => {
    expect(new Vec2(0, 0).getNormalized().L2()).toBeCloseTo(0, 3);
  });
});

describe('Vec2 isEqualTo', () => {
  test('identical vectors are equal', () => {
    expect(new Vec2(1, 2).isEqualTo(new Vec2(1, 2))).toBe(true);
  });

  test('VecCloseTo passes for vectors within precision', () => {
    expect(new Vec2(1, 2)).VecCloseTo(new Vec2(1 + 1e-8, 2 + 1e-8));
  });

  test('vectors differing beyond epsilon are not equal', () => {
    expect(new Vec2(1, 2).isEqualTo(new Vec2(1 + 1e-4, 2))).toBe(false);
  });
});
