/**
 * Tests for {@link AModelLoader3D}. The Three.js loaders' `load` methods are mocked to hand back hand-built
 * objects, so no files are read and the real OBJ/PLY/glTF parsers are not exercised.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, AModelLoader3D} from "../../index";
import * as THREE from "three";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {PLYLoader} from "three/examples/jsm/loaders/PLYLoader";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

new AMeshModel2D();

/** A one-triangle geometry with no normals. */
function triangleGeometry(){
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
    return g;
}

/**
 * Replaces `loaderClass.prototype.load` with a mock that remembers the callbacks instead of loading anything.
 * Call `finish(result)` or `fail(err)` on the returned object to end the "load".
 */
function mockLoader(loaderClass: any){
    const state: any = {};
    const spy = jest.spyOn(loaderClass.prototype, "load").mockImplementation(
        (url: any, onLoad: any, onProgress: any, onError: any) => {
            state.url = url;
            state.onLoad = onLoad;
            state.onError = onError;
        }
    );
    return {
        spy,
        get url(){return state.url;},
        finish(result: any){state.onLoad(result);},
        fail(err: any){state.onError(err);},
    };
}

/** Lets pending promise callbacks run. */
async function flushPromises(){
    for(let i=0;i<5;i++){ await Promise.resolve(); }
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe("AModelLoader3D._LoadFromPath", () => {
    test("the returned promise resolves only after the model has loaded and the callback has run", async () => {
        const mock = mockLoader(PLYLoader);
        const callback = jest.fn(async () => {});
        let resolved = false;
        const promise = AModelLoader3D._LoadFromPath("model.ply", callback).then(() => {resolved = true;});
        await flushPromises();
        expect(resolved).toBe(false);
        mock.finish(triangleGeometry());
        await promise;
        expect(callback).toHaveBeenCalledTimes(1);
        expect(resolved).toBe(true);
    });

    test("the returned promise rejects when loading fails", async () => {
        const mock = mockLoader(OBJLoader);
        const promise = AModelLoader3D._LoadFromPath("model.obj", async () => {});
        await flushPromises();
        mock.fail(new Error("404"));
        await expect(promise).rejects.toThrow("404");
    });

    test("accepts .gltf files", async () => {
        const mock = mockLoader(GLTFLoader);
        const scene = new THREE.Group();
        scene.add(new THREE.Mesh(triangleGeometry()));
        const callback = jest.fn(async () => {});
        const promise = AModelLoader3D._LoadFromPath("model.gltf", callback);
        await flushPromises();
        mock.finish({scene, scenes: [scene]});
        await promise;
        expect(callback).toHaveBeenCalledTimes(1);
    });
});

describe("AModelLoader3D extensions", () => {
    test("LoadSceneFromPath accepts .gltf files and returns the whole first scene", async () => {
        const mock = mockLoader(GLTFLoader);
        const scene = new THREE.Group();
        scene.add(new THREE.Mesh(triangleGeometry()));
        const promise = AModelLoader3D.LoadSceneFromPath("model.gltf");
        await flushPromises();
        mock.finish({scene, scenes: [scene]});
        const wrapper = await promise;
        expect(wrapper.object).toBe(scene);
    });

    test("LoadFromPath returns the first mesh of a glTF scene", async () => {
        const mock = mockLoader(GLTFLoader);
        const scene = new THREE.Group();
        const mesh = new THREE.Mesh(triangleGeometry());
        const inner = new THREE.Group();
        inner.add(mesh);
        scene.add(inner);
        const promise = AModelLoader3D.LoadFromPath("model.glb");
        await flushPromises();
        mock.finish({scene, scenes: [scene]});
        const wrapper = await promise;
        expect(wrapper.object).toBe(mesh);
    });

    test("unknown extensions throw", async () => {
        await expect(AModelLoader3D.LoadFromPath("model.fbx")).rejects.toThrow('Extension "fbx" not recognized');
        await expect(AModelLoader3D.LoadSceneFromPath("model.fbx")).rejects.toThrow('Extension "fbx" not recognized');
        await expect(AModelLoader3D._LoadFromPath("model.fbx", async () => {})).rejects.toThrow('Extension "fbx" not recognized');
    });
});

describe("AModelLoader3D computeVertexNormals", () => {
    test("LoadFromPath computes normals for PLY geometry that has none", async () => {
        const mock = mockLoader(PLYLoader);
        const promise = AModelLoader3D.LoadFromPath("model.ply");
        await flushPromises();
        mock.finish(triangleGeometry());
        const wrapper = await promise;
        const geometry = (wrapper.object as THREE.Mesh).geometry;
        expect(geometry.getAttribute("normal")).toBeDefined();
    });

    test("computeVertexNormals=true replaces normals that the file already had", async () => {
        const mock = mockLoader(OBJLoader);
        const geometry = triangleGeometry();
        // Deliberately wrong normals; the triangle's real normal is (0,0,1).
        geometry.setAttribute("normal", new THREE.Float32BufferAttribute([1,0,0, 1,0,0, 1,0,0], 3));
        const group = new THREE.Group();
        group.add(new THREE.Mesh(geometry));
        const promise = AModelLoader3D.LoadFromPath("model.obj", true);
        await flushPromises();
        mock.finish(group);
        await promise;
        const n = geometry.getAttribute("normal");
        expect([n.getX(0), n.getY(0), n.getZ(0)]).toEqual([0, 0, 1]);
    });

    test("computeVertexNormals=false keeps the file's normals", async () => {
        const mock = mockLoader(OBJLoader);
        const geometry = triangleGeometry();
        geometry.setAttribute("normal", new THREE.Float32BufferAttribute([1,0,0, 1,0,0, 1,0,0], 3));
        const group = new THREE.Group();
        group.add(new THREE.Mesh(geometry));
        const promise = AModelLoader3D.LoadSceneFromPath("model.obj");
        await flushPromises();
        mock.finish(group);
        await promise;
        const n = geometry.getAttribute("normal");
        expect([n.getX(0), n.getY(0), n.getZ(0)]).toEqual([1, 0, 0]);
    });
});
