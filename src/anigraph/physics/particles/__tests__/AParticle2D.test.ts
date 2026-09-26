/**
 * Tests for `AParticle2D`'s constructor: it should use the
 * `visible` and `size` it is given, including `visible: false` and `size: 0`.
 */
// Priming import: loading the whole engine through a node model first avoids circular-import errors.
import {AMeshModel2D} from "../../../";
import {AParticle2D, AParticleEuler2D, ParticleProperties2D, V2} from "../../../";

new AMeshModel2D();

/** Builds a properties object; `id` is required by the interface but not read by the constructor. */
function props(p: Partial<ParticleProperties2D>): ParticleProperties2D {
    return {position: V2(), depth: 0, id: 0, ...p} as ParticleProperties2D;
}

describe("AParticle2D constructor", () => {
    test("uses properties.visible", () => {
        expect(new AParticle2D(props({visible: false})).visible).toBe(false);
        expect(new AParticle2D(props({visible: true})).visible).toBe(true);
    });

    test("defaults visible to true", () => {
        expect(new AParticle2D(props({})).visible).toBe(true);
        expect(new AParticle2D().visible).toBe(true);
    });

    test("keeps a size of 0, and defaults a missing size to 1", () => {
        expect(new AParticle2D(props({size: 0})).size).toBe(0);
        expect(new AParticle2D(props({})).size).toBe(1);
        expect(new AParticle2D(props({size: 3})).size).toBe(3);
    });

    test("AParticleEuler2D passes the same properties through", () => {
        const p = new AParticleEuler2D(props({visible: false, size: 0, velocity: V2(1, 2), mass: 2}));
        expect(p.visible).toBe(false);
        expect(p.size).toBe(0);
        expect(p.mass).toBe(2);
    });
});
