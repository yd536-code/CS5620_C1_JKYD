import { BoundingBox2D, Vec2 } from '../../';

describe('BoundingBox2D FromVec2s', () => {
  test('bounding box of unit square corners has correct min/max', () => {
    const bb = BoundingBox2D.FromVec2s([new Vec2(0, 0), new Vec2(1, 0), new Vec2(1, 1), new Vec2(0, 1)]);
    expect(bb.minPoint.x).toBeCloseTo(0);
    expect(bb.minPoint.y).toBeCloseTo(0);
    expect(bb.maxPoint.x).toBeCloseTo(1);
    expect(bb.maxPoint.y).toBeCloseTo(1);
  });

  test('single point bounding box has zero dimensions', () => {
    const bb = BoundingBox2D.FromVec2s([new Vec2(3, 5)]);
    expect(bb.minPoint.x).toBeCloseTo(3);
    expect(bb.maxPoint.x).toBeCloseTo(3);
  });

  test('bounding box of scattered points is correct', () => {
    const bb = BoundingBox2D.FromVec2s([new Vec2(-2, 3), new Vec2(5, -1), new Vec2(0, 7)]);
    expect(bb.minPoint.x).toBeCloseTo(-2);
    expect(bb.minPoint.y).toBeCloseTo(-1);
    expect(bb.maxPoint.x).toBeCloseTo(5);
    expect(bb.maxPoint.y).toBeCloseTo(7);
  });
});

describe('BoundingBox2D dimensions', () => {
  test('localWidth and localHeight match expected values', () => {
    const bb = BoundingBox2D.FromVec2s([new Vec2(1, 2), new Vec2(4, 6)]);
    expect(bb.localWidth).toBeCloseTo(3);
    expect(bb.localHeight).toBeCloseTo(4);
  });

  test('center is midpoint of min and max', () => {
    const bb = BoundingBox2D.FromVec2s([new Vec2(0, 0), new Vec2(4, 6)]);
    expect(bb.center.x).toBeCloseTo(2);
    expect(bb.center.y).toBeCloseTo(3);
  });
});

describe('BoundingBox2D boundPoint (mutates in place)', () => {
  test('boundPoint expands box to include a new exterior point', () => {
    const bb = BoundingBox2D.FromVec2s([new Vec2(0, 0), new Vec2(1, 1)]);
    bb.boundPoint(new Vec2(3, 4));
    expect(bb.maxPoint.x).toBeCloseTo(3);
    expect(bb.maxPoint.y).toBeCloseTo(4);
    expect(bb.minPoint.x).toBeCloseTo(0);
  });

  test('boundPoint with interior point leaves box unchanged', () => {
    const bb = BoundingBox2D.FromVec2s([new Vec2(0, 0), new Vec2(10, 10)]);
    bb.boundPoint(new Vec2(5, 5));
    expect(bb.minPoint.x).toBeCloseTo(0);
    expect(bb.maxPoint.x).toBeCloseTo(10);
  });
});

describe('BoundingBox2D boundBounds (mutates in place)', () => {
  test('boundBounds expands this box to enclose another', () => {
    const bb1 = BoundingBox2D.FromVec2s([new Vec2(0, 0), new Vec2(1, 1)]);
    const bb2 = BoundingBox2D.FromVec2s([new Vec2(3, 3), new Vec2(5, 5)]);
    bb1.boundBounds(bb2);
    expect(bb1.minPoint.x).toBeCloseTo(0);
    expect(bb1.maxPoint.x).toBeCloseTo(5);
    expect(bb1.maxPoint.y).toBeCloseTo(5);
  });
});
