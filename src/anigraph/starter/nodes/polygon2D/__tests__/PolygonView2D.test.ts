/**
 * Tests that `PolygonModel2D`/`PolygonView2D` include the node's `zValue` (its depth, used for draw order) in the
 * render matrix.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import * as THREE from "three";
import {AMaterial} from "../../../../rendering/material";
import {NodeTransform2D, V2} from "../../../../math";
import {PolygonModel2D} from "../PolygonModel2D";
import {PolygonView2D} from "../PolygonView2D";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function makeMaterial(): AMaterial {
    const material = new AMaterial();
    material._material = new THREE.MeshBasicMaterial();
    return material;
}

describe("PolygonModel2D / PolygonView2D and zValue", () => {
    test("getTransform3D() includes zValue as the z translation", () => {
        const model = new PolygonModel2D(undefined, new NodeTransform2D(V2(3, 4)));
        model.zValue = 0.5;
        const m = model.getTransform3D();
        expect(m.m03).toBeCloseTo(3, 12);
        expect(m.m13).toBeCloseTo(4, 12);
        expect(m.m23).toBeCloseTo(0.5, 12);
    });

    test("the view's matrix has the model's zValue, and a larger zValue is drawn in front (larger z)", () => {
        const back = new PolygonModel2D();
        back.setMaterial(makeMaterial());
        const front = new PolygonModel2D();
        front.setMaterial(makeMaterial());
        const backView = new PolygonView2D();
        backView.setModel(back);
        const frontView = new PolygonView2D();
        frontView.setModel(front);
        back.zValue = -0.1;
        front.zValue = 0.1;
        expect(backView.threejs.matrix.elements[14]).toBeCloseTo(-0.1, 12);
        expect(frontView.threejs.matrix.elements[14]).toBeCloseTo(0.1, 12);
    });
});
