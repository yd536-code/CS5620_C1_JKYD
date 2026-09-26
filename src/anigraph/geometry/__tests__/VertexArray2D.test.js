import { VertexArray2D, Vec2 } from '../../';

describe('VertexArray2D addVertex', () => {
  test('length increases by 1 after addVertex', () => {
    const va = new VertexArray2D();
    expect(va.length).toBe(0);
    va.addVertex(new Vec2(1, 2));
    expect(va.length).toBe(1);
    va.addVertex(new Vec2(3, 4));
    expect(va.length).toBe(2);
  });

  test('position at index matches added position', () => {
    const va = new VertexArray2D();
    va.addVertex(new Vec2(5, 7));
    const p = va.getPoint2DAt(0);
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(7);
  });

  test('multiple vertices stored in order', () => {
    const va = new VertexArray2D();
    va.addVertex(new Vec2(1, 0));
    va.addVertex(new Vec2(0, 1));
    va.addVertex(new Vec2(-1, 0));
    expect(va.length).toBe(3);
    expect(va.getPoint2DAt(0).x).toBeCloseTo(1);
    expect(va.getPoint2DAt(1).y).toBeCloseTo(1);
    expect(va.getPoint2DAt(2).x).toBeCloseTo(-1);
  });
});

describe('VertexArray2D getBounds', () => {
  test('bounds of (0,0),(1,0),(0,1) has correct min/max', () => {
    const va = new VertexArray2D();
    va.addVertex(new Vec2(0, 0));
    va.addVertex(new Vec2(1, 0));
    va.addVertex(new Vec2(0, 1));
    const bb = va.getBounds();
    expect(bb.minPoint.x).toBeCloseTo(0);
    expect(bb.minPoint.y).toBeCloseTo(0);
    expect(bb.maxPoint.x).toBeCloseTo(1);
    expect(bb.maxPoint.y).toBeCloseTo(1);
  });

  test('bounds of a single vertex is degenerate box', () => {
    const va = new VertexArray2D();
    va.addVertex(new Vec2(3, 7));
    const bb = va.getBounds();
    expect(bb.minPoint.x).toBeCloseTo(3);
    expect(bb.minPoint.y).toBeCloseTo(7);
    expect(bb.maxPoint.x).toBeCloseTo(3);
    expect(bb.maxPoint.y).toBeCloseTo(7);
  });
});

describe('VertexArray2D getPoint2DAt', () => {
  test('getPoint2DAt(0) returns first vertex', () => {
    const va = new VertexArray2D();
    va.addVertex(new Vec2(10, 20));
    va.addVertex(new Vec2(30, 40));
    const p = va.getPoint2DAt(0);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(20);
  });

  test('getPoint2DAt(n-1) returns last vertex', () => {
    const va = new VertexArray2D();
    va.addVertex(new Vec2(1, 2));
    va.addVertex(new Vec2(3, 4));
    va.addVertex(new Vec2(5, 6));
    const last = va.getPoint2DAt(va.length - 1);
    expect(last.x).toBeCloseTo(5);
    expect(last.y).toBeCloseTo(6);
  });
});
