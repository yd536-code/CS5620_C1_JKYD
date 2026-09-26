import { Color } from '../../';
import { VecCloseTo } from '../test/AMathTestHelpers';

expect.extend(VecCloseTo);

describe('Color construction', () => {
  test('new Color(r,g,b) sets rgb, a defaults to 1', () => {
    const c = new Color(0.2, 0.4, 0.6);
    expect(c.r).toBeCloseTo(0.2);
    expect(c.g).toBeCloseTo(0.4);
    expect(c.b).toBeCloseTo(0.6);
    expect(c.a).toBeCloseTo(1.0);
  });

  test('new Color(r,g,b,a) sets all four channels', () => {
    const c = new Color(1, 0.5, 0, 0.8);
    expect(c.r).toBeCloseTo(1);
    expect(c.g).toBeCloseTo(0.5);
    expect(c.b).toBeCloseTo(0);
    expect(c.a).toBeCloseTo(0.8);
  });

  test('Color.FromRGBA matches direct constructor', () => {
    expect(Color.FromRGBA(0.1, 0.2, 0.3, 0.4)).VecCloseTo(new Color(0.1, 0.2, 0.3, 0.4));
  });
});

describe('Color named factories', () => {
  test('Color.White() has rgb=1', () => {
    const c = Color.White();
    expect(c.r).toBeCloseTo(1);
    expect(c.g).toBeCloseTo(1);
    expect(c.b).toBeCloseTo(1);
  });

  test('Color.Black() has rgb=0', () => {
    const c = Color.Black();
    expect(c.r).toBeCloseTo(0);
    expect(c.g).toBeCloseTo(0);
    expect(c.b).toBeCloseTo(0);
  });

  test('Color.Red() has r=1, g=b=0', () => {
    const c = Color.Red();
    expect(c.r).toBeCloseTo(1);
    expect(c.g).toBeCloseTo(0);
    expect(c.b).toBeCloseTo(0);
  });
});

describe('Color hex string', () => {
  test('toHexString on white returns #ffffff', () => {
    expect(Color.White().toHexString()).toBe('#ffffff');
  });

  test('toHexString on red returns #ff0000', () => {
    expect(Color.Red().toHexString()).toBe('#ff0000');
  });

  test('toHexString on black returns #000000', () => {
    expect(Color.Black().toHexString()).toBe('#000000');
  });
});

describe('Color mutations', () => {
  test('GetSpun by PI produces different hue', () => {
    const red = Color.Red();
    const spun = red.GetSpun(Math.PI);
    expect(spun.r).not.toBeCloseTo(red.r);
  });

  test('GetDesaturated(100) reduces saturation toward gray', () => {
    const gray = Color.Red().GetDesaturated(100);
    expect(gray.r).toBeCloseTo(gray.g, 1);
    expect(gray.g).toBeCloseTo(gray.b, 1);
  });

  test('GetDarkened(50) reduces brightness', () => {
    const red = Color.Red();
    expect(red.GetDarkened(50).r).toBeLessThan(red.r);
  });
});

describe('Color 0-255 conversions', () => {
  test('FromString("#ffffff") is exactly white', () => {
    const c = Color.FromString('#ffffff');
    expect(c.r).toBe(1);
    expect(c.g).toBe(1);
    expect(c.b).toBe(1);
  });

  test('RGBuintAfloat scales by 255 and round-trips through FromRGBuintAfloat', () => {
    const c = Color.FromRGBA(0.1, 0.2, 0.3, 0.5);
    const u = c.RGBuintAfloat;
    expect(u.r).toBeCloseTo(25.5);
    expect(u.g).toBeCloseTo(51);
    expect(u.b).toBeCloseTo(76.5);
    expect(u.a).toBe(0.5);
    const back = Color.FromRGBuintAfloat(u);
    expect(back.r).toBeCloseTo(0.1);
    expect(back.g).toBeCloseTo(0.2);
    expect(back.b).toBeCloseTo(0.3);
  });

  test('RGBuintAfloat round-trips through tinycolor (FromTinyColor)', () => {
    const tinycolor = require('tinycolor2');
    const c = Color.FromRGBA(0.2, 0.6, 1.0, 1);
    const back = Color.FromTinyColor(tinycolor(c.RGBuintAfloat));
    expect(back.r).toBeCloseTo(0.2, 2);
    expect(back.g).toBeCloseTo(0.6, 2);
    expect(back.b).toBeCloseTo(1.0, 5);
  });

  test('toHexString round-trips a hex string', () => {
    expect(Color.FromString('#123abe').toHexString()).toBe('#123abe');
  });
});

describe('Color.ThreeJS', () => {
  test('the string version keeps r, g, b in order', () => {
    const t = Color.ThreeJS('#123abe');
    expect(t.r).toBeCloseTo(0x12 / 255);
    expect(t.g).toBeCloseTo(0x3a / 255);
    expect(t.b).toBeCloseTo(0xbe / 255);
  });
});
