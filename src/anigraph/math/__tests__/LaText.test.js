import { LaText } from '../../';

describe('LaText delimiters', () => {
  test('beginMath returns \\(', () => {
    expect(LaText.beginMath()).toBe('\\(');
  });

  test('endMath returns \\) (with the backslash)', () => {
    expect(LaText.endMath()).toBe('\\)');
  });

  test('inline wraps the raw template text in \\( ... \\)', () => {
    expect(LaText.inline`x^2`).toBe('\\(x^2\\)');
  });
});
