/**
 * Tests for `AGraphicElement.setColor`: the color is written to the material's `color`
 * property (as on `THREE.MeshBasicMaterial`), not only to materials that have a `diffuse` property.
 */
import * as THREE from "three";
import {AMeshModel2D, AGraphicElement, Color, VertexArray3D} from "../../../";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

describe("AGraphicElement.setColor", () => {
    test("changes the color and opacity of a MeshBasicMaterial", () => {
        const material = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true});
        const element = AGraphicElement.Create(VertexArray3D.SquareXYUV(), material);
        element.setColor(Color.FromRGBA(1, 0, 0, 0.5));
        expect(material.color.r).toBeCloseTo(1);
        expect(material.color.g).toBeCloseTo(0);
        expect(material.color.b).toBeCloseTo(0);
        expect(material.opacity).toBeCloseTo(0.5);
    });

    test("accepts a THREE.Color and leaves opacity alone", () => {
        const material = new THREE.MeshBasicMaterial({color: 0x000000, opacity: 0.3, transparent: true});
        const element = AGraphicElement.Create(VertexArray3D.SquareXYUV(), material);
        element.setColor(new THREE.Color(0, 1, 0));
        expect(material.color.g).toBeCloseTo(1);
        expect(material.opacity).toBeCloseTo(0.3);
    });
});
