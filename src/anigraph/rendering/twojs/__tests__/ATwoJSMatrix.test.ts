/**
 * Tests that Two.js views read AniGraph's row-major `Mat4` correctly: a 3D transform
 * (rotation about z plus a translation) applied to a Two.js group gives the same translation and rotation as the
 * matching `Mat3`, and `ATwoJSDisplayObject.getMatrix` round-trips.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {Mat3, Mat4, V2, V3} from "../../../math";
import {ATwoJSDisplayObject} from "../ATwoJSDisplayObject";
import {ATwoJSNodeView} from "../ATwoJSNodeView";
import {Two} from "../TwoJSImport";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

const ANGLE = 0.6, TX = 12, TY = -7, SCALE = 2;
// A 3D transform whose 2D part is: translate (TX, TY), rotate by ANGLE, scale x and y by SCALE (z is left alone,
// since a Two.js group has no z).
const M4 = Mat4.Translation3D(V3(TX, TY, 0)).times(Mat4.RotationZ(ANGLE)).times(Mat4.Scale3D(V3(SCALE, SCALE, 1)));

function expectGroup(group: any) {
    expect(group.translation.x).toBeCloseTo(TX, 10);
    expect(group.translation.y).toBeCloseTo(TY, 10);
    expect(group.rotation).toBeCloseTo(ANGLE, 10);
    expect(group.scale).toBeCloseTo(SCALE, 10);
}

describe("Two.js views read a row-major Mat4", () => {
    test("ATwoJSDisplayObject.setMatrix(Mat4) keeps translation and rotation", () => {
        const obj = new ATwoJSDisplayObject();
        obj.setMatrix(M4);
        expectGroup(obj.nativeGroup);
    });

    test("ATwoJSDisplayObject.setMatrix(Mat3) still works", () => {
        const obj = new ATwoJSDisplayObject();
        obj.setMatrix(Mat3.Translation2D(V2(TX, TY)).times(Mat3.Rotation(ANGLE)).times(Mat3.Scale2D(SCALE)));
        expectGroup(obj.nativeGroup);
    });

    test("ATwoJSDisplayObject.getMatrix round-trips through setMatrix", () => {
        const obj = new ATwoJSDisplayObject();
        obj.setMatrix(M4);
        const back = obj.getMatrix();
        for (let i = 0; i < 16; i++) {
            expect(back.elements[i]).toBeCloseTo(M4.elements[i], 10);
        }
    });

    test("ATwoJSNodeView._applyMatrixToGroup(Mat4) keeps translation and rotation", () => {
        // Call the real methods against a minimal fake `this` that only has a Two.js group.
        const fake: any = {_twoGroup: new Two.Group()};
        fake._applyMat3ToGroup = (ATwoJSNodeView.prototype as any)._applyMat3ToGroup;
        (ATwoJSNodeView.prototype as any)._applyMatrixToGroup.call(fake, M4);
        expectGroup(fake._twoGroup);
    });
});
