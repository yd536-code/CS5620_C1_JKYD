/**
 * Tests for {@link SVGLLoader}: transforms of nested groups (`globalTransform`) and the `load` callbacks.
 * Parsing uses jsdom's `DOMParser`; file loading is mocked.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, SVGLLoader} from "../../../index";
import type {SvgLNode} from "../../../index";
import * as THREE from "three";

new AMeshModel2D();

/** Finds the parsed node whose `id` attribute is `id`, searching depth-first from `root`. */
function findNode(root: SvgLNode, id: string): SvgLNode | undefined {
    if (root.id === id) return root;
    for (const c of root.children) {
        const found = findNode(c, id);
        if (found) return found;
    }
    return undefined;
}

/** Expects two 3x3 matrices to have (nearly) the same entries. */
function expectMatricesClose(a: THREE.Matrix3, b: THREE.Matrix3) {
    const ae = a.elements, be = b.elements;
    for (let i = 0; i < 9; i++) {
        expect(ae[i]).toBeCloseTo(be[i]);
    }
}

const translate = (x: number, y: number) => new THREE.Matrix3().set(1, 0, x, 0, 1, y, 0, 0, 1);
const scale = (s: number) => new THREE.Matrix3().set(s, 0, 0, 0, s, 0, 0, 0, 1);

const NESTED_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <g id="outer" transform="translate(10,0)">
    <g id="inner" transform="scale(2)">
      <rect id="deep" x="0" y="0" width="1" height="1" fill="red"/>
      <rect id="deepOwn" x="0" y="0" width="1" height="1" fill="red" transform="translate(0,5)"/>
    </g>
    <rect id="sibling" x="0" y="0" width="1" height="1" fill="blue"/>
  </g>
  <rect id="top" x="0" y="0" width="1" height="1" fill="green"/>
</svg>`;

describe("SVGLLoader.parse transforms", () => {
    const data = new SVGLLoader().parse(NESTED_SVG);
    const root = data.rootSvgNode;

    test("a path inside nested groups gets the product of the groups' transforms", () => {
        const expected = translate(10, 0).multiply(scale(2));
        expectMatricesClose(findNode(root, "deep")!.globalTransform, expected);
    });

    test("a path's own transform is applied after its ancestors'", () => {
        const expected = translate(10, 0).multiply(scale(2)).multiply(translate(0, 5));
        expectMatricesClose(findNode(root, "deepOwn")!.globalTransform, expected);
    });

    test("a path after a nested group only sees its own ancestors' transforms", () => {
        expectMatricesClose(findNode(root, "sibling")!.globalTransform, translate(10, 0));
        expectMatricesClose(findNode(root, "top")!.globalTransform, new THREE.Matrix3());
    });

    test("localTransform stays the element's own transform", () => {
        expectMatricesClose(findNode(root, "outer")!.localTransform, translate(10, 0));
        expectMatricesClose(findNode(root, "inner")!.localTransform, scale(2));
        expectMatricesClose(findNode(root, "deepOwn")!.localTransform, translate(0, 5));
        expectMatricesClose(findNode(root, "deep")!.localTransform, new THREE.Matrix3());
    });
});

describe("SVGLLoader.load", () => {
    const SIMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg"><rect id="r" width="1" height="1"/></svg>`;
    afterEach(() => jest.restoreAllMocks());

    test("calls onLoad with the parsed data and resolves with it", async () => {
        jest.spyOn(THREE.FileLoader.prototype, "load").mockImplementation(
            (url: any, onLoad: any) => { onLoad(SIMPLE_SVG); return undefined as any; }
        );
        const onLoad = jest.fn();
        const data = await new SVGLLoader().load("x.svg", onLoad);
        expect(onLoad).toHaveBeenCalledTimes(1);
        expect(onLoad).toHaveBeenCalledWith(data);
        expect(findNode(data.rootSvgNode, "r")).toBeDefined();
    });

    test("passes onProgress to the file loader", async () => {
        jest.spyOn(THREE.FileLoader.prototype, "load").mockImplementation(
            (url: any, onLoad: any, onProgress: any) => {
                onProgress?.({loaded: 1, total: 2});
                onLoad(SIMPLE_SVG);
                return undefined as any;
            }
        );
        const onProgress = jest.fn();
        await new SVGLLoader().load("x.svg", undefined, onProgress);
        expect(onProgress).toHaveBeenCalledWith({loaded: 1, total: 2});
    });

    test("calls onError and rejects when the file can't be loaded", async () => {
        const err = new Error("404");
        jest.spyOn(THREE.FileLoader.prototype, "load").mockImplementation(
            (url: any, onLoad: any, onProgress: any, onError: any) => { onError(err); return undefined as any; }
        );
        const onLoad = jest.fn();
        const onError = jest.fn();
        await expect(new SVGLLoader().load("x.svg", onLoad, undefined, onError)).rejects.toBe(err);
        expect(onError).toHaveBeenCalledWith(err);
        expect(onLoad).not.toHaveBeenCalled();
    });
});
