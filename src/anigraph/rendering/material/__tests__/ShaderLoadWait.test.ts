/**
 * Code that asks for a shader which is registered but still downloading must wait for the download.
 *
 * `AShaderModel.ShaderSourceLoaded` (and so `AShaderModel.CreateModel`) used to check only whether the shader was
 * *registered* (`GetShaderSource`), and returned at once if it was, even if its files hadn't arrived yet.
 * `AssetManager.loadShaderMaterialModel` makes the same check, but already waited, because
 * `AMaterialManager.setMaterialModel` awaits the new model's `sourcesLoadedPromise`; its test guards that.
 *
 * `AShaderProgramSource.LoadShaderFile` is mocked with deferred promises, so each test controls exactly when the
 * "download" finishes. No real files are fetched.
 */
import {AMeshModel2D, AShaderModel, AssetManager} from "../../../";
import {AShaderProgramSource} from "../ShaderManager";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

/** A promise plus the function that resolves it. */
function deferred<T>() {
    let resolve!: (v: T) => void;
    const promise = new Promise<T>((r) => { resolve = r; });
    return {promise, resolve};
}

/** Lets pending promise callbacks run. */
async function flush() {
    for (let i = 0; i < 10; i++) {
        await Promise.resolve();
    }
}

describe("waiting for a shader that is still loading", () => {
    let pendingFiles: {url: string, resolve: (s: string) => void}[];
    let spy: jest.SpyInstance;

    beforeEach(() => {
        pendingFiles = [];
        spy = jest.spyOn(AShaderProgramSource, "LoadShaderFile").mockImplementation((url: string) => {
            const d = deferred<string>();
            pendingFiles.push({url, resolve: d.resolve});
            return d.promise as any;
        });
    });
    afterEach(() => {
        spy.mockRestore();
    });

    /** Finishes every pending "download" (repeatedly, since the fragment file is requested after the vertex file). */
    async function finishDownloads() {
        for (let round = 0; round < 3; round++) {
            await flush();
            const files = pendingFiles.splice(0);
            files.forEach((f) => f.resolve(`// source of ${f.url}`));
        }
        await flush();
    }

    test("ShaderSourceLoaded waits for a load that is already in progress", async () => {
        const name = "rm11_test_shader_a";
        AssetManager.shaders.LoadShader(name);
        let done = false;
        const waiting = AShaderModel.ShaderSourceLoaded(name).then(() => { done = true; });

        await flush();
        expect(done).toBe(false);

        await finishDownloads();
        await waiting;
        expect(done).toBe(true);
        expect(AssetManager.shaders.GetShaderSource(name).fragSource).toContain("frag");
    });

    test("loadShaderMaterialModel waits for a load that is already in progress", async () => {
        // The pattern modules use: start loading a shader when the module is imported, register its model later.
        const name = "rm11_test_shader_b";
        AssetManager.shaders.LoadShader(name);
        let done = false;
        const waiting = AssetManager.loadShaderMaterialModel(name).then(() => { done = true; });

        await flush();
        expect(done).toBe(false);

        await finishDownloads();
        await waiting;
        expect(done).toBe(true);
    });

    test("two parallel CreateModel calls both finish only after the source arrives", async () => {
        const name = "rm11_test_shader_d";
        const sources: string[] = [];
        const record = () => { sources.push(AssetManager.shaders.GetShaderSource(name).fragSource); };
        const first = AShaderModel.CreateModel(name).then(record);
        const second = AShaderModel.CreateModel(name).then(record);

        await flush();
        expect(sources).toEqual([]);

        await finishDownloads();
        await Promise.all([first, second]);
        expect(sources.length).toBe(2);
        sources.forEach((src) => expect(src).toContain("frag"));
    });

    test("ShaderSourceLoaded on a shader that has finished loading returns without reloading it", async () => {
        const name = "rm11_test_shader_c";
        const loading = AssetManager.shaders.LoadShader(name);
        await finishDownloads();
        await loading;
        const callsBefore = spy.mock.calls.length;

        await AShaderModel.ShaderSourceLoaded(name);

        expect(spy.mock.calls.length).toBe(callsBefore);
    });
});
