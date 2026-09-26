/**
 * Every engine `@ASerializable` label equals its class name. These are the 33 engine classes that once had a
 * different label (e.g. `VectorBase` "Vector" and `ACameraModel3D` "ACameraModel"). Each must be registered under its
 * class name and not under its former label; the ones constructible with no arguments also get a real round trip.
 * The runtime-only ones among them use `@ALabel` instead (RELABELED_LABEL_ONLY) and are checked separately.
 */
import "../../../";
import {GETSERIALIZABLES, ASerializableToJSON, ASerializableFromJSON, GetClassLabel} from "../ASerializable";

// [class name, former label, module path]
const RELABELED: [string, string, string][] = [
    ["AParticleSystemModel2D", "A2DParticleSystemModel", "../../../effects/particles/AParticleSystemModel2D"],
    ["AParticleSystemModel3D", "AParticleSystemModel", "../../../effects/particles/AParticleSystemModel3D"],
    ["AInstancedParticleSystemModel3D", "AInstancedParticleSystemModel", "../../../effects/particles/InstancedParticles/AInstancedParticleSystemModel3D"],
    ["ASVGLModel2D", "ASVGLModel", "../../../fileio/svgl/node/ASVGLModel2D"],
    ["AGeometrySet", "GeometrySet", "../../../geometry/AGeometrySet"],
    ["VectorBase", "Vector", "../../../math/linalg/VectorBase"],
    ["ACameraModel3D", "ACameraModel", "../../../scene/camera/ACameraModel3D"],
    ["ALightModel3D", "ALightModel", "../../../scene/lights/ALightModel3D"],
    ["APointLightModel3D", "APointLightModel", "../../../scene/lights/APointLightModel3D"],
    ["AVisiblePointLightModel3D", "AVisiblePointLightModel", "../../../scene/lights/AVisiblePointLightModel3D"],
    ["VectorModel2D", "Vector2DModel", "../../../scene/nodes/2d/lines/VectorModel2D"],
    ["AMeshModel2D", "A2DMeshModel", "../../../scene/nodes/2d/mesh2d/AMeshModel2D"],
    ["ALoadedModel3D", "ALoadedModel", "../../../scene/nodes/loaded/ALoadedModel3D"],
    ["AMeshModel3D", "ATriangleMeshModel", "../../../scene/nodes/trianglemesh/AMeshModel3D"],
    ["UnitQuadModel3D", "AUnitQuadModel", "../../../scene/nodes/unitquad/UnitQuadModel3D"],
    ["ATwoJSAppSceneModel", "App2DTwoJSSceneModel", "../../../starter/App2DTwoJS/ATwoJSAppSceneModel"],
    ["ASceneModel3D", "AppSceneModel3D", "../../../starter/Scene3D/ASceneModel3D"],
    ["ABackgroundQuadModel3D", "ABackgroundQuadModel", "../../../starter/nodes/backgroundquad/ABackgroundQuadModel3D"],
    ["LoadedCharacterModel3D", "LoadedCharacterModel", "../../../starter/nodes/character/LoadedCharacter/LoadedCharacterModel3D"],
    ["CoordinateAxesModel3D", "CoordinateAxesModel", "../../../starter/nodes/coordinateaxes/CoordinateAxesModel3D"],
    ["AInstancedParticleSystemModel2D", "InstancedParticleSystemModel2D", "../../../starter/nodes/instancedparticlesystem2d/AInstancedParticleSystemModel2D"],
    ["PolygonModel2D", "Polygon2DModel", "../../../starter/nodes/polygon2D/PolygonModel2D"],
    ["RGBATestMeshModel3D", "RGBATestMeshModel", "../../../starter/nodes/rgbatestmesh/RGBATestMeshModel3D"],
    ["ATerrainModel3D", "ATerrainModel", "../../../starter/nodes/terrain/ATerrainModel3D"],
];

/**
 * The relabeled classes that are runtime-only (graphics, render contexts/windows, views, managers) and so use
 * `@ALabel`, not `@ASerializable`: they keep their class-name label but are not registered for serialization under
 * either name.
 */
const RELABELED_LABEL_ONLY: [string, string, string][] = [
    ["ATwoJSContext", "ATwoContext", "../../../rendering/context/ATwoJSContext"],
    ["ATwoJSRenderWindow", "ATwoRenderWindow", "../../../rendering/context/ATwoJSRenderWindow"],
    ["ACoordinateAxesGraphic3D", "ACoordinateAxesGraphic", "../../../rendering/graphicelements/ACoordinateAxesGraphic3D"],
    ["APlaneGraphic3D", "APlaneGraphic", "../../../rendering/graphicelements/APlaneGraphic3D"],
    ["APolygonGraphic2D", "APolygon2DGraphic", "../../../rendering/graphicelements/APolygonGraphic2D"],
    ["ASphereGraphic3D", "ASphereGraphic", "../../../rendering/graphicelements/ASphereGraphic3D"],
    ["AGLGraphicObject", "AGraphicObject", "../../../rendering/graphicobject/AGLGraphicObject"],
    ["AShaderSourceManager", "ShaderSourceManager", "../../../rendering/material/ShaderManager"],
    ["PolygonView2D", "Polygon2DView", "../../../starter/nodes/polygon2D/PolygonView2D"],
];

/** The class from its module (`ASphereGraphic3D` is a default export). */
function load(className: string, modulePath: string) {
    const mod = require(modulePath);
    return mod[className] ?? mod.default;
}

describe.each(RELABELED)("%s", (className, oldLabel, modulePath) => {
    const Cls = load(className, modulePath);

    test("is registered under its class name, not its old label", () => {
        const registry = GETSERIALIZABLES();
        expect(Cls).toBeDefined();
        expect(registry[className]).toBe(Cls);
        expect(registry[oldLabel]).not.toBe(Cls);
        expect(Cls._serializationLabel ?? className).toBe(className);
    });
});

describe.each(RELABELED_LABEL_ONLY)("%s (label only)", (className, oldLabel, modulePath) => {
    const Cls = load(className, modulePath);

    test("keeps its class-name label but is not registered for serialization", () => {
        const registry = GETSERIALIZABLES();
        expect(Cls).toBeDefined();
        expect(GetClassLabel(Cls)).toBe(className);
        expect(registry[className]).not.toBe(Cls);
        expect(registry[oldLabel]).not.toBe(Cls);
    });
});

describe("round trip under the new labels (classes constructible with no arguments)", () => {
    // Whole scene models overflow the stack in ASerializableToJSON regardless of label (they were never
    // serializable as a unit), so they are left out of the round trip; their registration is still checked above.
    const NOT_ROUND_TRIPPED = ["ATwoJSAppSceneModel", "ASceneModel3D"];
    const constructible = RELABELED.filter(([className, , modulePath]) => {
        if (NOT_ROUND_TRIPPED.includes(className)) return false;
        try { new (load(className, modulePath))(); return true; } catch (e) { return false; }
    });

    // ACameraModel3D is in this set because `new ACameraModel3D()` creates a default camera.
    test("the set of no-argument-constructible relabeled classes is what it was when this test was written", () => {
        expect(constructible.map(([c]) => c).sort()).toEqual([
            "ABackgroundQuadModel3D", "ACameraModel3D", "AGeometrySet", "AInstancedParticleSystemModel2D",
            "ALightModel3D", "AMeshModel2D", "AMeshModel3D", "AParticleSystemModel2D", "AParticleSystemModel3D",
            "ASVGLModel2D", "ATerrainModel3D",
            "CoordinateAxesModel3D", "PolygonModel2D",
            "RGBATestMeshModel3D", "UnitQuadModel3D", "VectorBase", "VectorModel2D",
        ]);
    });

    test.each(constructible)("%s survives ASerializableToJSON/FromJSON as the same class", (className, oldLabel, modulePath) => {
        const Cls = load(className, modulePath);
        const json = ASerializableToJSON(new Cls());
        expect(json).toContain(`"${className}"`);
        expect(json).not.toContain(`"_aserial_class_id":"${oldLabel}"`);
        expect(ASerializableFromJSON(json)).toBeInstanceOf(Cls);
    });
});
