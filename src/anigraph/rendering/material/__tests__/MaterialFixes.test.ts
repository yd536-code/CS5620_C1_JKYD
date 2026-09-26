/**
 * Tests for material fixes:
 * - `AMaterialModel`'s constructor passes `defaults` and `sharedParams` to the base class in the right order,
 *   so shared parameters win over defaults.
 * - `ALineMaterialModel.getMaterialGUIParams` works on the plain `AMaterial` its `CreateMaterial` returns.
 * - `AShaderMaterial.Clone` copies the uniform dictionary (and textures), and the copy is independent.
 * - `AShaderMaterial.setUniformColor` uses its `alpha` argument when one is given.
 */
import * as THREE from "three";
import {AMeshModel2D, AMaterialModel, ALineMaterialModel, AShaderMaterial, ATexture, Color} from "../../../";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

describe("AMaterialModel constructor", () => {
    test("defaults and sharedParams land in the right fields; shared params win", () => {
        const model = new AMaterialModel("test", THREE.MeshBasicMaterial, {opacity: 0.5, transparent: true}, {opacity: 0.25});
        expect(model.defaults).toEqual({opacity: 0.5, transparent: true});
        expect(model.sharedParameters).toEqual({opacity: 0.25});
        const material = model.CreateMaterial();
        expect(material.getValue("opacity")).toBeCloseTo(0.25);
        expect(material.getValue("transparent")).toBe(true);
    });
});

describe("ALineMaterialModel GUI params", () => {
    test("getMaterialGUIParams does not throw and edits the line width", () => {
        const model = ALineMaterialModel.GlobalInstance;
        const material = model.CreateMaterial();
        let params: any;
        expect(() => { params = model.getMaterialGUIParams(material); }).not.toThrow();
        expect(params.linewidth.value).toBeCloseTo(0.005);
        params.linewidth.onChange(0.02);
        expect(material.getValue("linewidth")).toBeCloseTo(0.02);
    });
});

/** An `AShaderMaterial` with a real (never compiled) `THREE.ShaderMaterial`, so no shader files are needed. */
function makeShaderMaterial() {
    const m = new AShaderMaterial();
    m._material = new THREE.ShaderMaterial({uniforms: {}});
    return m;
}

describe("AShaderMaterial.Clone", () => {
    test("the clone has the same uniform values", () => {
        const original = makeShaderMaterial();
        original.setUniform("exposure", 2.5, "float");
        original.setUniformColor("tint", Color.FromRGBA(1, 0, 0, 1));
        const clone = AShaderMaterial.Clone(original) as AShaderMaterial;
        expect(clone).toBeInstanceOf(AShaderMaterial);
        expect(clone.getUniformValue("exposure")).toBe(2.5);
        expect(clone.getUniformValue("tint").x).toBeCloseTo(1);
        expect(clone.threejs.uniforms["exposure"].value).toBe(2.5);
    });

    test("changing the clone's uniforms does not change the original", () => {
        const original = makeShaderMaterial();
        original.setUniform("exposure", 2.5, "float");
        const clone = AShaderMaterial.Clone(original) as AShaderMaterial;
        clone.setUniform("exposure", 7, "float");
        expect(original.getUniformValue("exposure")).toBe(2.5);
        expect(original.threejs.uniforms["exposure"].value).toBe(2.5);
    });

    test("textures are shared, and texture uniforms keep the same THREE.Texture", () => {
        const original = makeShaderMaterial();
        const tex = new ATexture(new THREE.Texture());
        original.setTexture("diffuse", tex);
        const clone = AShaderMaterial.Clone(original) as AShaderMaterial;
        expect(clone.getTexture("diffuse")).toBe(tex);
        expect(clone.getUniformValue("diffuseMap")).toBeDefined();
        expect(clone.getUniformValue("diffuseMapProvided")).toBe(true);
        // The copy's Three.js material samples the very same THREE.Texture.
        expect(clone.threejs.uniforms["diffuseMap"].value).toBe(tex.threejs);
    });
});

describe("AShaderMaterial.setUniformColor alpha", () => {
    test("without alpha, the color's own alpha is used", () => {
        const m = makeShaderMaterial();
        m.setUniformColor("c", Color.FromRGBA(0.1, 0.2, 0.3, 0.4));
        expect(m.getUniformValue("c").w).toBeCloseTo(0.4);
    });

    test("alpha, when given, replaces the color's alpha", () => {
        const m = makeShaderMaterial();
        m.setUniformColor("c", Color.FromRGBA(0.1, 0.2, 0.3, 0.4), 0.8);
        const v = m.getUniformValue("c");
        expect([v.x, v.y, v.z, v.w].map((x: number) => +x.toFixed(5))).toEqual([0.1, 0.2, 0.3, 0.8]);
    });

    test("a THREE.Color with alpha becomes a vec4", () => {
        const m = makeShaderMaterial();
        m.setUniformColor("c", new THREE.Color(1, 0.5, 0), 0.5);
        const v = m.getUniformValue("c");
        expect(v).toBeInstanceOf(THREE.Vector4);
        expect([v.x, v.y, v.z, v.w]).toEqual([1, 0.5, 0, 0.5]);
    });
});
