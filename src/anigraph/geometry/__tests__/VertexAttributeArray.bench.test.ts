/**
 * A performance check: `getAt`/`setAt`/`ApplyMatrix` loops over a 1,000,000-vertex array must stay within 10% of
 * a hand-indexed baseline.
 *
 * The baseline is kept here as hand-indexed `getAt`/`setAt`/`ApplyMatrix` method bodies (the `Oracle*` classes below, one per class, each holding its own `elements` so `this.elements`
 * costs the same property load and method dispatch on both sides), so the comparison stays meaningful however
 * the real classes are implemented. The only edits are `VertexAttributeColor3DArray.ElementsPerVertex` inlined as 3 in the Color3
 * oracle, and each `ApplyMatrix` calling its own oracle's `getAt`/`setAt`.
 *
 * Why the oracles are classes: free functions over a local array make a biased baseline (up to ~9% faster than
 * any method call, from method dispatch and property loads alone), and object literals were 5-38% slower than
 * the real classes. With class-based oracles, hand-indexed implementations measure 0.84-1.05 of the baseline,
 * while a purely generic `getAt`/`setAt` (no hand-indexed overrides) fails clearly (2D.setAt 2.36x, 3D.getAt
 * 1.28x, 4D.getAt 1.37x, Color3.getAt 1.58x, 2DH.getAt 1.50x), so the 10% threshold separates the two.
 *
 * Skipped by default (it takes tens of seconds). Run with:
 *   ANIGRAPH_BENCH=1 CI=true npx craco test --watchAll=false VertexAttributeArray.bench
 */
import {
    VertexAttributeArray2D,
    VertexAttributeArray3D,
    VertexAttributeArray4D,
    VertexAttributeColorArray,
    VertexAttributeColor3DArray,
    VertexPositionArray2DH,
    Vec2, Vec3, Vec4, Mat4, Color, V3,
} from "../../";

const N = 1000000;
const TRIALS = 7;
const THRESHOLD = 1.10;
const runBench = process.env.ANIGRAPH_BENCH === "1";
const describeBench = runBench ? describe : describe.skip;

// ---- Oracle: hand-indexed method bodies, one class per real class ----
class Oracle2D {
    constructor(public elements: number[]) {}
    getAt(i: number) {
        return new Vec2(this.elements[i * 2], this.elements[i * 2 + 1]);
    }
    setAt(i: number, vertex: Vec2 | number[]) {
        let elements = vertex instanceof Vec2 ? vertex.elements : vertex;
        this.elements[i * 2] = elements[0];
        this.elements[i * 2 + 1] = elements[1];
    }
}

class Oracle3D {
    constructor(public elements: number[]) {}
    get nVerts() {
        return this.elements.length / 3;
    }
    getAt(i: number) {
        return new Vec3(
            this.elements[i * 3],
            this.elements[i * 3 + 1],
            this.elements[i * 3 + 2]
        );
    }
    setAt(i: number, vertex: Vec3 | number[]) {
        let elements = vertex instanceof Vec3 ? vertex.elements : vertex;
        this.elements[i * 3] = elements[0];
        this.elements[i * 3 + 1] = elements[1];
        this.elements[i * 3 + 2] = elements[2];
    }
    ApplyMatrix(m: Mat4) {
        for (let v = 0; v < this.nVerts; v++) {
            this.setAt(v, m.times(this.getAt(v).Point3DH).Point3D);
        }
        return this;
    }
}

class Oracle4D {
    constructor(public elements: number[]) {}
    get nVerts() {
        return this.elements.length / 4;
    }
    getAt(i: number) {
        return new Vec4(
            this.elements[i * 4],
            this.elements[i * 4 + 1],
            this.elements[i * 4 + 2],
            this.elements[i * 4 + 3]
        );
    }
    setAt(i: number, vertex: Vec4 | Vec3 | number[]) {
        if (vertex instanceof Vec3) {
            vertex = vertex.Point3DH;
        }
        let elements = vertex instanceof Vec4 ? vertex.elements : vertex;
        this.elements[i * 4] = elements[0];
        this.elements[i * 4 + 1] = elements[1];
        this.elements[i * 4 + 2] = elements[2];
        this.elements[i * 4 + 3] = elements[3];
    }
    ApplyMatrix(m: Mat4) {
        for (let v = 0; v < this.nVerts; v++) {
            this.setAt(v, m.times(this.getAt(v)));
        }
        return this;
    }
}

class OracleColor {
    constructor(public elements: number[]) {}
    getAt(i: number) {
        return Color.FromRGBA(
            this.elements[i * 4],
            this.elements[i * 4 + 1],
            this.elements[i * 4 + 2],
            this.elements[i * 4 + 3]
        );
    }
    setAt(i: number, vertex: Color | Vec4 | Vec3 | number[]) {
        if (vertex instanceof Vec3) {
            vertex = vertex.Point3DH;
        }
        if (vertex instanceof Color) {
            vertex = vertex.Vec4;
        }
        let elements = vertex instanceof Vec4 ? vertex.elements : vertex;
        this.elements[i * 4] = elements[0];
        this.elements[i * 4 + 1] = elements[1];
        this.elements[i * 4 + 2] = elements[2];
        this.elements[i * 4 + 3] = elements[3];
    }
}

class OracleColor3 {
    constructor(public elements: number[]) {}
    getAt(i: number): Color {
        return new Color(
            this.elements[i * 3],
            this.elements[i * 3 + 1],
            this.elements[i * 3 + 2]
        );
    }
    setAt(i: number, vertex: Color | Vec3 | number[]) {
        if (vertex instanceof Color) {
            vertex = V3(vertex.r, vertex.g, vertex.b);
        }
        let elements = vertex instanceof Vec3 ? vertex.elements : vertex;
        this.elements[i * 3] = elements[0];
        this.elements[i * 3 + 1] = elements[1];
        this.elements[i * 3 + 2] = elements[2];
    }
}

class Oracle2DH extends Oracle3D {
    _defaultZ = 0;
    setAt(i: number, vertex: Vec2 | Vec3 | number[]) {
        let elements = Array.isArray(vertex) ? vertex : vertex.elements;
        this.elements[i * 3] = elements[0];
        this.elements[i * 3 + 1] = elements[1];
        if (elements.length === 2) {
            this.elements[i * 3 + 2] = this._defaultZ;
        } else {
            this.elements[i * 3 + 2] = elements[2];
        }
    }
}

function filled(stride: number) {
    const e = new Array(N * stride);
    for (let i = 0; i < e.length; i++) {
        e[i] = (i % 97) * 0.01;
    }
    return e;
}

let sink = 0;

function time(fn: () => void) {
    const t0 = performance.now();
    fn();
    return performance.now() - t0;
}

function median(xs: number[]) {
    const s = xs.slice().sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
}

/** Interleaved A/B trials after one warm-up of each; returns median(class)/median(oracle). */
function compare(label: string, classRun: () => void, oracleRun: () => void) {
    classRun();
    oracleRun();
    const a: number[] = [];
    const b: number[] = [];
    for (let t = 0; t < TRIALS; t++) {
        if (t % 2 === 0) {
            a.push(time(classRun));
            b.push(time(oracleRun));
        } else {
            b.push(time(oracleRun));
            a.push(time(classRun));
        }
    }
    const ratio = median(a) / median(b);
    // eslint-disable-next-line no-console
    console.log(`${label}: class ${median(a).toFixed(1)}ms, hand-indexed ${median(b).toFixed(1)}ms, ratio ${ratio.toFixed(3)}`);
    return ratio;
}

function getAtCase(label: string, arr: any, stride: number, orc: any) {
    return compare(`${label}.getAt`,
        () => { for (let i = 0; i < N; i++) { sink += arr.getAt(i).elements[stride - 1]; } },
        () => { for (let i = 0; i < N; i++) { sink += orc.getAt(i).elements[stride - 1]; } });
}

function setAtCase(label: string, arr: any, v: any, orc: any) {
    return compare(`${label}.setAt`,
        () => { for (let i = 0; i < N; i++) { arr.setAt(i, v); } },
        () => { for (let i = 0; i < N; i++) { orc.setAt(i, v); } });
}

describeBench("VertexAttributeArray benchmark gate (1,000,000 vertices, <= 10% over hand-indexed)", () => {
    const m = Mat4.Translation3D(new Vec3(0.1, 0.2, 0.3));

    test("VertexAttributeArray2D getAt/setAt", () => {
        const a = new VertexAttributeArray2D(filled(2));
        const o = new Oracle2D(filled(2));
        expect(getAtCase("2D", a, 2, o)).toBeLessThanOrEqual(THRESHOLD);
        expect(setAtCase("2D", a, new Vec2(1, 2), o)).toBeLessThanOrEqual(THRESHOLD);
    });

    test("VertexAttributeArray3D getAt/setAt/ApplyMatrix", () => {
        const a = new VertexAttributeArray3D(filled(3));
        const o = new Oracle3D(filled(3));
        expect(getAtCase("3D", a, 3, o)).toBeLessThanOrEqual(THRESHOLD);
        expect(setAtCase("3D", a, new Vec3(1, 2, 3), o)).toBeLessThanOrEqual(THRESHOLD);
        expect(compare("3D.ApplyMatrix", () => a.ApplyMatrix(m), () => o.ApplyMatrix(m)))
            .toBeLessThanOrEqual(THRESHOLD);
    });

    test("VertexAttributeArray4D getAt/setAt/ApplyMatrix", () => {
        const a = new VertexAttributeArray4D(filled(4));
        const o = new Oracle4D(filled(4));
        expect(getAtCase("4D", a, 4, o)).toBeLessThanOrEqual(THRESHOLD);
        expect(setAtCase("4D", a, new Vec4(1, 2, 3, 4), o)).toBeLessThanOrEqual(THRESHOLD);
        expect(compare("4D.ApplyMatrix", () => a.ApplyMatrix(m), () => o.ApplyMatrix(m)))
            .toBeLessThanOrEqual(THRESHOLD);
    });

    test("VertexAttributeColorArray getAt/setAt", () => {
        const a = new VertexAttributeColorArray(filled(4));
        const o = new OracleColor(filled(4));
        expect(getAtCase("Color", a, 4, o)).toBeLessThanOrEqual(THRESHOLD);
        expect(setAtCase("Color", a, Color.FromRGBA(0.1, 0.2, 0.3, 0.4), o)).toBeLessThanOrEqual(THRESHOLD);
    });

    test("VertexAttributeColor3DArray getAt/setAt", () => {
        const a = new VertexAttributeColor3DArray(filled(3));
        const o = new OracleColor3(filled(3));
        expect(getAtCase("Color3", a, 3, o)).toBeLessThanOrEqual(THRESHOLD);
        expect(setAtCase("Color3", a, Color.FromRGBA(0.1, 0.2, 0.3, 0.4), o)).toBeLessThanOrEqual(THRESHOLD);
    });

    test("VertexPositionArray2DH getAt/setAt", () => {
        const a = new VertexPositionArray2DH(filled(3));
        const o = new Oracle2DH(filled(3));
        expect(getAtCase("2DH", a, 3, o)).toBeLessThanOrEqual(THRESHOLD);
        expect(setAtCase("2DH", a, new Vec2(1, 2), o)).toBeLessThanOrEqual(THRESHOLD);
    });

    afterAll(() => {
        expect(Number.isFinite(sink)).toBe(true);
    });
});
