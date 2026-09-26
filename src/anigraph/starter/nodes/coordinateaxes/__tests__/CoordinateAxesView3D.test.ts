/**
 * Tests that `CoordinateAxesView3D` draws the axes with the model's transform, scaled by `axesScale`.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import * as THREE from "three";
import {Mat4, NodeTransform3D, Quaternion, V3} from "../../../../math";
import {CoordinateAxesModel3D} from "../CoordinateAxesModel3D";
import {CoordinateAxesView3D} from "../CoordinateAxesView3D";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function elementsOf(m: Mat4): number[] {
    const target = new THREE.Matrix4();
    m.assignTo(target);
    return target.elements.slice();
}

function expectClose(actual: number[], expected: number[]) {
    expect(actual).toHaveLength(16);
    for (let i = 0; i < 16; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], 12);
    }
}

describe("CoordinateAxesView3D", () => {
    test("the view's matrix is the model's transform times Scale3D(axesScale), and follows later changes", () => {
        const model = new CoordinateAxesModel3D(2);
        const view = new CoordinateAxesView3D();
        view.setModel(model);
        expectClose(view.threejs.matrix.elements.slice(), elementsOf(Mat4.Scale3D(2)));

        const pose = new NodeTransform3D(V3(1, -2, 3), Quaternion.RotationZ(0.7));
        model.setTransform(pose);
        expectClose(view.threejs.matrix.elements.slice(), elementsOf(pose.getMat4().times(Mat4.Scale3D(2))));

        model.axesScale = 0.5;
        expectClose(view.threejs.matrix.elements.slice(), elementsOf(pose.getMat4().times(Mat4.Scale3D(0.5))));
    });
});
