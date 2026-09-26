/**
 * Tests that a light view keeps its three.js light's color in sync with the model. The
 * color used to be applied only when the model's `color` was reassigned, so editing the existing `Color` in place
 * (for example `light.color.r = 1`) never reached the three.js light. `ALightView3D` is abstract, so these use a
 * minimal subclass. (`APointLightModel3D` needs an app state to construct, so it isn't used here.)
 */
// Import order matters: see the note in scene/__tests__/RenderMatrix.test.ts.
import {AMeshModel2D} from "../../nodes/2d/mesh2d/AMeshModel2D";
import {ALightModel3D} from "../ALightModel3D";
import {ALightView3D} from "../ALightView3D";
import {Color} from "../../../math";
import * as THREE from "three";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

/** `ALightModel3D` is abstract; this concrete subclass adds nothing. */
class TestLightModel extends ALightModel3D {}

/** The smallest concrete light view: a `THREE.PointLight` made from the model's values, as `APointLightView3D` does. */
class TestLightView extends ALightView3D {
    init(): void {
        this._light = new THREE.PointLight(this.model.color.asThreeJS(), this.model.intensity);
        this.threejs.add(this._light);
    }
}

function makeLightAndView() {
    const model = new TestLightModel(Color.FromString("#000000"));
    const view = new TestLightView();
    view.setModel(model);
    return {model, view};
}

describe("ALightView3D color", () => {
    test("an in-place edit of the model's Color reaches the three.js light", () => {
        const {model, view} = makeLightAndView();
        model.color.r = 1;
        expect(view.light.color.r).toBeCloseTo(1, 6);
        expect(view.light.color.g).toBeCloseTo(0, 6);
    });

    test("assigning a new Color still reaches the three.js light", () => {
        const {model, view} = makeLightAndView();
        model.color = new Color(0, 1, 0);
        expect(view.light.color.g).toBeCloseTo(1, 6);
    });

    test("intensity edits still reach the three.js light", () => {
        const {model, view} = makeLightAndView();
        model.intensity = 7;
        expect(view.light.intensity).toBe(7);
    });
});
