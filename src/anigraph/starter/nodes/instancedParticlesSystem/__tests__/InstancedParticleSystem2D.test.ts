/**
 * Tests for the 2D instanced particle system starter classes: the view applies the system's `zValue` (so it sorts
 * in depth with other 2D nodes), the out-of-range warning fires for the first index past the last instance, and the
 * model constructor only creates particles when it is given a count.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import * as THREE from "three";
import {AMaterial} from "../../../../rendering/material";
import {AParticle2D} from "../../../../physics";
import {Color, Mat3, NodeTransform2D, V2} from "../../../../math";
import {InstancedParticleSystemModel2D} from "../InstancedParticleSystemModel2D";
import {InstancedParticleSystemView2D} from "../InstancedParticleSystemView2D";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

/** Every `initParticles` call made by a `TestSystemModel`, recorded outside the class because subclass fields are
 * not set up yet while the base constructor runs. */
const initParticlesCalls: number[] = [];

class TestSystemModel extends InstancedParticleSystemModel2D<AParticle2D> {
    initParticles(nParticles: number) {
        initParticlesCalls.push(nParticles);
        for (let i = 0; i < nParticles; i++) {
            this.addParticle(new AParticle2D());
        }
    }
}

class TestSystemView extends InstancedParticleSystemView2D<AParticle2D> {
    get2DTransformForParticleIndex(i: number): Mat3 {
        return Mat3.Translation2D(this.model.particles[i].position);
    }
    getColorForParticleIndex(i: number): Color {
        return Color.White();
    }
}

function makeMaterial(): AMaterial {
    const material = new AMaterial();
    material._material = new THREE.MeshBasicMaterial();
    return material;
}

function makeView(nParticles: number) {
    const model = new TestSystemModel(nParticles);
    model.setMaterial(makeMaterial());
    const view = new TestSystemView();
    view.setModel(model);
    return {model, view};
}

beforeEach(() => {
    initParticlesCalls.length = 0;
});

describe("InstancedParticleSystemView2D", () => {
    test("update() applies the system's transform together with its zValue (m23 of the render matrix)", () => {
        const {model, view} = makeView(3);
        model.setTransform(new NodeTransform2D(V2(1, 2)));
        model.zValue = -0.25;
        const m = view.threejs.matrix.elements; // column-major: [14] is the z translation
        expect(m[12]).toBeCloseTo(1, 12);
        expect(m[13]).toBeCloseTo(2, 12);
        expect(m[14]).toBeCloseTo(-0.25, 12);
    });

    test("_getTransformForParticleIndex warns for i == count (one past the last instance) but not for count - 1", () => {
        const {view} = makeView(3);
        const count = view.particlesElement.count;
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            view._getTransformForParticleIndex(count - 1);
            expect(warn).not.toHaveBeenCalled();
            try { view._getTransformForParticleIndex(count); } catch (e) { /* no particle there: only the warning matters */ }
            expect(warn).toHaveBeenCalledTimes(1);
        } finally {
            warn.mockRestore();
        }
    });
});

describe("InstancedParticleSystemModel2D constructor", () => {
    test("with a count, calls initParticles(count)", () => {
        const model = new TestSystemModel(5);
        expect(initParticlesCalls).toEqual([5]);
        expect(model.particles.length).toBe(5);
    });

    test("without a count, does not call initParticles (scenes call initParticles(n) themselves afterward)", () => {
        const model = new TestSystemModel();
        expect(initParticlesCalls).toEqual([]);
        expect(model.particles.length).toBe(0);
    });
});
