/**
 * Tests for SvgLToThreeJsObject.ts: the materials made by `createMeshesFromPath`, and reading SVG text from a
 * user-provided file with `getSVGLTextFromFile`.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, SVGLLoader, createMeshesFromPath, getSVGLTextFromFile} from "../../../index";
import * as THREE from "three";

new AMeshModel2D();

/** Parses a one-element SVG and returns its only path. */
function parseSinglePath(elementXML: string) {
    const data = new SVGLLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg">${elementXML}</svg>`);
    expect(data.paths.length).toBe(1);
    return data.paths[0];
}

describe("createMeshesFromPath fill transparency", () => {
    test("a fill with fill-opacity < 1 is transparent", () => {
        const path = parseSinglePath(`<rect width="1" height="1" fill="red" fill-opacity="0.5"/>`);
        const meshes = createMeshesFromPath(path);
        const material = meshes[0].material as THREE.MeshBasicMaterial;
        expect(material.opacity).toBeCloseTo(0.5);
        expect(material.transparent).toBe(true);
    });

    test("stroke-opacity < 1 does not make an opaque fill transparent", () => {
        const path = parseSinglePath(
            `<rect width="1" height="1" fill="red" fill-opacity="1" stroke="blue" stroke-opacity="0.5"/>`
        );
        const meshes = createMeshesFromPath(path);
        // Fill meshes come first, then stroke meshes.
        const fillMaterial = meshes[0].material as THREE.MeshBasicMaterial;
        const strokeMaterial = meshes[meshes.length - 1].material as THREE.MeshBasicMaterial;
        expect(fillMaterial.transparent).toBe(false);
        expect(strokeMaterial.transparent).toBe(true);
    });
});

describe("getSVGLTextFromFile", () => {
    afterEach(() => jest.restoreAllMocks());

    test("resolves with the file's text", async () => {
        const file = new File(["<svg></svg>"], "a.svg", {type: "image/svg+xml"});
        await expect(getSVGLTextFromFile(file)).resolves.toBe("<svg></svg>");
    });

    test("rejects (and does not call alert) when the file can't be read", async () => {
        const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
        jest.spyOn(FileReader.prototype, "readAsText").mockImplementation(function (this: FileReader) {
            // Simulate a read error on the next tick, like a real FileReader would.
            setTimeout(() => this.onerror?.(new ProgressEvent("error") as any), 0);
        });
        const file = new File(["x"], "a.svg");
        await expect(getSVGLTextFromFile(file)).rejects.toBeDefined();
        expect(alertSpy).not.toHaveBeenCalled();
    }, 1000);
});
