/**
 * Checks that the event enums, camera enums, attribute names, app-state helpers, time interpolation classes and the
 * asset manager class that public members refer to are exported from the engine's top-level barrel (`anigraph/index.ts`), so scene code can import them by name.
 */
// Priming import: loading a higher-level module first resolves the engine's circular imports (see
// scene/__tests__/RenderMatrix.test.ts).
import {AMeshModel2D} from "../index";
import * as anigraph from "../index";
new AMeshModel2D();

describe("Top-level barrel exports", () => {
  it.each([
    "AModelEvents",
    "ANodeModelEvents",
    "AMaterialEvents",
    "ANODEVIEW_MATERIAL_EVENTS",
    "CamUpdateEvents",
    "CAMERA_PROJECTION_TYPES",
    "ATTRIBUTE_NAMES",
    "AStateCallbackSwitch",
    "AAppState",
    "SetAppState",
    "GetAAppState",
    "CheckAAppState",
    "AppStateEvents",
    "TimeFilterType",
    "ATimeFilter",
    "Tween",
    "ATimeInterpolationBase",
    "AAssetManager",
  ])("exports %s", (name) => {
    expect((anigraph as any)[name]).toBeDefined();
  });

  it("exports the same enum objects the classes use", () => {
    expect(anigraph.ANodeModelEvents).toBe(anigraph.ANodeModel.NodeModelEvents);
    expect(anigraph.AMaterialEvents).toBe(anigraph.AMaterial.Events);
  });
});
