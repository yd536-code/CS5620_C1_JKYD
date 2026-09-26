import { Precision } from '../Precision';

describe('Precision.isTiny', () => {
  test('0 is tiny', () => {
    expect(Precision.isTiny(0)).toBe(true);
  });

  test('1e-7 is tiny (< default epsilon 1e-6)', () => {
    expect(Precision.isTiny(1e-7)).toBe(true);
  });

  test('1e-5 is not tiny', () => {
    expect(Precision.isTiny(1e-5)).toBe(false);
  });

  test('negative tiny value is tiny', () => {
    expect(Precision.isTiny(-1e-8)).toBe(true);
  });

  test('custom epsilon works', () => {
    expect(Precision.isTiny(0.01, 0.1)).toBe(true);
    expect(Precision.isTiny(0.5, 0.1)).toBe(false);
  });
});

describe('Precision.ClampAbsAboveEpsilon', () => {
  test('value > epsilon is returned unchanged', () => {
    expect(Precision.ClampAbsAboveEpsilon(0.01)).toBeCloseTo(0.01);
  });

  test('positive near-zero is clamped to +epsilon', () => {
    const result = Precision.ClampAbsAboveEpsilon(1e-10);
    expect(result).toBeCloseTo(Precision.epsilon);
  });

  test('negative near-zero is clamped to -epsilon', () => {
    const result = Precision.ClampAbsAboveEpsilon(-1e-10);
    expect(result).toBeCloseTo(-Precision.epsilon);
  });

  test('exact zero is clamped to +epsilon', () => {
    const result = Precision.ClampAbsAboveEpsilon(0);
    expect(result).toBeCloseTo(Precision.epsilon);
  });
});

describe('Precision.PEQ', () => {
  test('equal values return true', () => {
    expect(Precision.PEQ(1.5, 1.5)).toBe(true);
  });

  test('values within epsilon return true', () => {
    expect(Precision.PEQ(1.0, 1.0 + 1e-8)).toBe(true);
  });

  test('values beyond epsilon return false', () => {
    expect(Precision.PEQ(1.0, 1.0 + 1e-4)).toBe(false);
  });
});
