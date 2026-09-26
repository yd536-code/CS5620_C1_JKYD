/**
 * Tests for {@link ATimeFilter}'s constructor.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D} from "../../index";
import {ATimeFilter} from "../ATimeInterpolation";

new AMeshModel2D();

describe("ATimeFilter", () => {
  test("the constructor's latency argument sets latency", () => {
    expect(new ATimeFilter<any>(0.5).latency).toBe(0.5);
  });
  test("latency defaults to 1", () => {
    const f = new ATimeFilter<any>();
    expect(f.latency).toBe(1);
    expect(f.endTime - f.startTime).toBe(1);
  });
});
