/**
 * Tests for {@link AppSceneController3D.initSkyBoxCubeMap}: which face URLs it loads, and which background rotation
 * it applies, for each way of calling it.
 *
 * A real controller needs a WebGL context, so these call the real prototype method on a small fake `this` that
 * records the calls. `THREE.CubeTextureLoader.load` is mocked, so no images are fetched.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D} from "../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import * as THREE from "three";
import {Quaternion} from "../../../math";
import {AppSceneController3D} from "../AppSceneController3D";

new AMeshModel2D();

/** The method under test. Typed loosely, because `.call` on an overloaded method only accepts the last overload. */
const initSkyBox: (this: any, ...args: any[]) => void = AppSceneController3D.prototype.initSkyBoxCubeMap;

/** Makes a fake controller that records the background texture and transform it is given. */
function makeFakeController() {
    const fake: any = {
        cubeTexture: undefined,
        backgroundTransform: undefined,
        _setBackgroundCubeTexture(tex: any) {fake.cubeTexture = tex;},
        setBackgroundTransform(q: Quaternion) {fake.backgroundTransform = q;},
    };
    return fake;
}

const FACE_URLS = ["a/px.png", "a/nx.png", "a/py.png", "a/ny.png", "a/pz.png", "a/nz.png"];

describe("AppSceneController3D.initSkyBoxCubeMap", () => {
    let loadSpy: jest.SpyInstance;
    beforeEach(() => {
        loadSpy = jest.spyOn(THREE.CubeTextureLoader.prototype, "load").mockImplementation(
            (urls: any) => ({urls: urls} as any));
    });
    afterEach(() => {
        loadSpy.mockRestore();
    });

    test("an array of URLs with a transform applies the transform", () => {
        const fake = makeFakeController();
        const q = Quaternion.RotationY(0.3);

        initSkyBox.call(fake, FACE_URLS, q);

        expect(loadSpy).toHaveBeenCalledWith(FACE_URLS);
        expect(fake.cubeTexture).toBeDefined();
        expect(fake.backgroundTransform).toBe(q);
    });

    test("an array of URLs with no transform leaves the background unrotated", () => {
        const fake = makeFakeController();

        initSkyBox.call(fake, FACE_URLS);

        expect(loadSpy).toHaveBeenCalledWith(FACE_URLS);
        expect(fake.backgroundTransform).toBeUndefined();
    });

    test("(path, format, transform) builds the six face URLs and applies the transform", () => {
        const fake = makeFakeController();
        const q = Quaternion.RotationX(0.5);

        initSkyBox.call(fake, "a/", ".png", q);

        expect(loadSpy).toHaveBeenCalledWith(FACE_URLS);
        expect(fake.backgroundTransform).toBe(q);
    });

    test("no arguments loads the default cube map rotated -90 degrees about x", () => {
        const fake = makeFakeController();

        initSkyBox.call(fake);

        expect(loadSpy).toHaveBeenCalledTimes(1);
        const q: Quaternion = fake.backgroundTransform;
        expect(q).toBeDefined();
        const expected = Quaternion.RotationX(-Math.PI * 0.5);
        expect(q.isEqualTo(expected)).toBe(true);
    });
});
