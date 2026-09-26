/**
 * Tests for `ABasicTexturedShaderModel.CreateMaterial` and `ATerrainShaderModel.CreateMaterial`:
 * a uniforms dictionary passed after the texture arguments reaches the new material. The terrain
 * model used to call `super.CreateMaterial()` with no arguments, which dropped it.
 *
 * The models get a stand-in shader source (never compiled), so no shader files are loaded.
 */
import * as THREE from "three";
import {AMeshModel2D, ATexture} from "../../../";
import {ABasicTexturedShaderModel, ATerrainShaderModel} from "../index";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

/** Gives a model a stand-in shader source, so `CreateMaterial` can build a `THREE.ShaderMaterial`. */
function withFakeShader<T>(model: T): T {
    (model as any)._shaderSource = {vertexSource: "void main(){}", fragSource: "void main(){}"};
    return model;
}

describe("textured shader models forward the uniforms dictionary", () => {
    test("ABasicTexturedShaderModel: CreateMaterial(texture, uniforms)", () => {
        const model = withFakeShader(new ABasicTexturedShaderModel("textured"));
        const tex = new ATexture(new THREE.Texture());
        const mat = model.CreateMaterial(tex, {exposure: 3});
        expect(mat.getUniformValue("exposure")).toBe(3);
        expect(mat.getTexture("diffuse")).toBe(tex);
    });

    test("ATerrainShaderModel: CreateMaterial(diffuse, height, scale, uniforms)", () => {
        const model = withFakeShader(new ATerrainShaderModel("terrain"));
        const diffuse = new ATexture(new THREE.Texture());
        const height = new ATexture(new THREE.Texture());
        const mat = model.CreateMaterial(diffuse, height, 4, {exposure: 3});
        expect(mat.getUniformValue("exposure")).toBe(3);
        expect(mat.getUniformValue("texCoordScale")).toBe(4);
        expect(mat.getTexture("diffuse")).toBe(diffuse);
        expect(mat.getTexture("height")).toBe(height);
        // Blinn-Phong defaults still reach the material.
        expect(mat.getUniformValue("specularExp")).toBeDefined();
    });
});
