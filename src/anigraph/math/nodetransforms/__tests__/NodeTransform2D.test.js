import { NodeTransform2D, Vec2, Vec3, Mat3, Point2DH } from '../../../';
import { VecCloseTo, MatrixCloseTo } from '../../test/AMathTestHelpers';

expect.extend(VecCloseTo);
expect.extend(MatrixCloseTo);

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

describe('NodeTransform2D getMatrix', () => {
  test('default transform produces identity', () => {
    expect(new NodeTransform2D().getMatrix()).MatrixCloseTo(Mat3.Identity());
  });

  test('translation-only transform maps origin to position', () => {
    const m = new NodeTransform2D(new Vec2(3, 4)).getMatrix();
    expect(m.times(Point2DH(0, 0))).VecCloseTo(new Vec3(3, 4, 1));
  });

  test('rotation-only transform rotates x-axis', () => {
    const m = new NodeTransform2D(new Vec2(0, 0), Math.PI / 2).getMatrix();
    const r = m.times(Point2DH(1, 0));
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(1);
  });

  test('scale-only transform scales a point', () => {
    const m = new NodeTransform2D(new Vec2(0, 0), 0, new Vec2(3, 2)).getMatrix();
    expect(m.times(Point2DH(1, 1))).VecCloseTo(new Vec3(3, 2, 1));
  });

  test('anchor offsets pivot point', () => {
    const T = new NodeTransform2D(new Vec2(0, 0), 0, new Vec2(1, 1), new Vec2(1, 0));
    const r = T.getMatrix().times(Point2DH(0, 0));
    expect(r.x).toBeCloseTo(-1);
    expect(r.y).toBeCloseTo(0);
  });
});

describe('NodeTransform2D setWithMatrix round-trip', () => {
  test('round-trip for pure translation', () => {
    const T = new NodeTransform2D(new Vec2(5, -3));
    const m = T.getMatrix();
    const T2 = new NodeTransform2D();
    T2.setWithMatrix(m);
    expect(T2.getMatrix()).MatrixCloseTo(m);
  });

  test('round-trip for pure rotation', () => {
    const T = new NodeTransform2D(new Vec2(0, 0), Math.PI / 6);
    const m = T.getMatrix();
    const T2 = new NodeTransform2D();
    T2.setWithMatrix(m);
    expect(T2.getMatrix()).MatrixCloseTo(m);
  });

  test('round-trip for pure uniform scale', () => {
    const T = new NodeTransform2D(new Vec2(0, 0), 0, new Vec2(2, 2));
    const m = T.getMatrix();
    const T2 = new NodeTransform2D();
    T2.setWithMatrix(m);
    expect(T2.getMatrix()).MatrixCloseTo(m);
  });
});

describe('NodeTransform2D clone', () => {
  test('clone produces same matrix', () => {
    const T = new NodeTransform2D(new Vec2(3, 4), Math.PI / 4, new Vec2(2, 2));
    expect(T.clone().getMatrix()).MatrixCloseTo(T.getMatrix());
  });

  test('mutating clone does not affect original', () => {
    const T = new NodeTransform2D(new Vec2(3, 4), 0.5, new Vec2(1, 1));
    const origMatrix = T.getMatrix();
    const C = T.clone();
    C.position = new Vec2(99, 99);
    expect(T.getMatrix()).MatrixCloseTo(origMatrix);
  });
});
