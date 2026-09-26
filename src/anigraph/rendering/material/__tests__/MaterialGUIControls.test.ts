/**
 * Characterization tests for the two control-spec builder families, which share one implementation:
 * `AMaterialModelBase.MaterialGUIControl`/`MaterialGUIColorControl` (plain three.js material parameters) and
 * `AShaderModelBase.ShaderUniformGUIControl`/`ShaderUniformGUIColorControl` (shader uniforms).
 *
 * Pinned on purpose: the truthiness fallback (a stored `0` reads back as `defaultValue`, not `0`), the `'float'`
 * type argument on the uniform path, and the two color paths' different fallbacks and conversions.
 */
import * as THREE from "three";
import {AMaterialModelBase, AShaderModelBase, Color} from "../../../";

function fakeMaterial(values: { [k: string]: any } = {}) {
    const calls: any[] = [];
    return {
        calls,
        getValue: (k: string) => values[k],
        setValue: (k: string, v: any) => calls.push(["setValue", k, v]),
    } as any;
}

function fakeShaderMaterial(uniforms: { [k: string]: any } = {}) {
    const calls: any[] = [];
    return {
        calls,
        getUniformValue: (k: string) => uniforms[k],
        setUniform: (...args: any[]) => calls.push(["setUniform", ...args]),
        setUniformColor: (...args: any[]) => calls.push(["setUniformColor", ...args]),
    } as any;
}

describe("AMaterialModelBase.MaterialGUIControl", () => {
    test("reads the current value, merges otherSpecs, and writes through setValue", () => {
        const m = fakeMaterial({opacity: 0.5});
        const spec = AMaterialModelBase.MaterialGUIControl(m, "opacity", 1, {min: 0, max: 1, step: 0.01});
        expect(Object.keys(spec)).toEqual(["opacity"]);
        expect(spec.opacity.value).toBe(0.5);
        expect(spec.opacity.min).toBe(0);
        expect(spec.opacity.max).toBe(1);
        expect(spec.opacity.step).toBe(0.01);
        spec.opacity.onChange(0.25);
        expect(m.calls).toEqual([["setValue", "opacity", 0.25]]);
    });

    test("falls back to defaultValue when the stored value is missing -- or falsy, including 0", () => {
        expect(AMaterialModelBase.MaterialGUIControl(fakeMaterial({}), "opacity", 1, {}).opacity.value).toBe(1);
        expect(AMaterialModelBase.MaterialGUIControl(fakeMaterial({opacity: 0}), "opacity", 1, {}).opacity.value).toBe(1);
    });

    test("otherSpecs can override value/onChange keys (spread last)", () => {
        const spec = AMaterialModelBase.MaterialGUIControl(fakeMaterial({a: 2}), "a", 1, {value: 7});
        expect(spec.a.value).toBe(7);
    });
});

describe("AMaterialModelBase.MaterialGUIColorControl", () => {
    test("defaults to the 'color' key and #000000 when unset", () => {
        const spec = AMaterialModelBase.MaterialGUIColorControl(fakeMaterial({}));
        expect(Object.keys(spec)).toEqual(["color"]);
        expect(spec.color.value).toBe("#000000");
    });

    test("reads a three.js color as hex; onChange writes asThreeJS()", () => {
        const c = Color.FromString("#336699");
        const m = fakeMaterial({tint: c.asThreeJS()});
        const spec = AMaterialModelBase.MaterialGUIColorControl(m, "tint");
        expect(spec.tint.value).toBe("#336699");
        spec.tint.onChange("#ff0000");
        expect(m.calls.length).toBe(1);
        expect(m.calls[0][0]).toBe("setValue");
        expect(m.calls[0][1]).toBe("tint");
        expect(m.calls[0][2]).toEqual(Color.FromString("#ff0000").asThreeJS());
    });
});

describe("AShaderModelBase.ShaderUniformGUIControl", () => {
    test("reads the uniform, merges otherSpecs, writes setUniform(name, v, 'float')", () => {
        const m = fakeShaderMaterial({diffuse: 0.3});
        const spec = AShaderModelBase.ShaderUniformGUIControl(m, "diffuse", 1, {min: 0, max: 5, step: 0.01});
        expect(Object.keys(spec)).toEqual(["diffuse"]);
        expect(spec.diffuse.value).toBe(0.3);
        expect(spec.diffuse.min).toBe(0);
        expect(spec.diffuse.max).toBe(5);
        spec.diffuse.onChange(2);
        expect(m.calls).toEqual([["setUniform", "diffuse", 2, "float"]]);
    });

    test("falls back to defaultValue when the uniform is missing -- or falsy, including 0", () => {
        expect(AShaderModelBase.ShaderUniformGUIControl(fakeShaderMaterial({}), "x", 3, {}).x.value).toBe(3);
        expect(AShaderModelBase.ShaderUniformGUIControl(fakeShaderMaterial({x: 0}), "x", 3, {}).x.value).toBe(3);
    });
});

describe("AShaderModelBase.ShaderUniformGUIColorControl", () => {
    test("defaults to the 'color' key and #aaaaaa when unset", () => {
        const spec = AShaderModelBase.ShaderUniformGUIColorControl(fakeShaderMaterial({}));
        expect(Object.keys(spec)).toEqual(["color"]);
        expect(spec.color.value).toBe("#aaaaaa");
    });

    test("reads a THREE.Vector4 uniform as hex; onChange calls setUniformColor with a Color", () => {
        const c = Color.FromString("#336699");
        const m = fakeShaderMaterial({mainColor: new THREE.Vector4(c.r, c.g, c.b, 1)});
        const spec = AShaderModelBase.ShaderUniformGUIColorControl(m, "mainColor");
        expect(spec.mainColor.value).toBe("#336699");
        spec.mainColor.onChange("#00ff00");
        expect(m.calls.length).toBe(1);
        expect(m.calls[0][0]).toBe("setUniformColor");
        expect(m.calls[0][1]).toBe("mainColor");
        expect(m.calls[0][2]).toBeInstanceOf(Color);
        expect(m.calls[0][2].toHexString()).toBe(Color.FromString("#00ff00").toHexString());
    });
});
