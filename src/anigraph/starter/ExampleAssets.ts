import {ModelDetails, AssetManager} from "../fileio/AAssetManager";
import {Mat4, NodeTransform3D, Quaternion, V3, V4, Vec3} from "../math/";

/** Names of the example 3D model assets registered by `loadExampleAssetDetails`. */
export const enum ExampleAssetModels{
    dragon="dragon",
    cat="cat",
    duck="duck",
    car1GLTF="car1GLTF",
    car1="car1",
    LabCat="LabCat",
    LabCatGLTFlipped="LabCatGLTFlipped",
}

/**
 * You can add your own assets to the AssetManager by putting their information in a dictionary like the one below and calling `AssetManager.addModelAssetDetailsDict`. Then you should be able to use them with `AssetManager.loadModelAsset` and `AssetManager.createModelFromAsset`.
 */
const ExampleAssetDetails: {[name:string]:ModelDetails}= {
    /**
     * Dragon has colors stored in vertices instead of a texture
     */
    dragon: {
        path:"./models/ply/dragon.ply",
        textures:undefined,
        vertexColors: true,
        modelTransform: new NodeTransform3D(V3(0.0, 0.0, 0.0), Quaternion.RotationX(Math.PI*0.5),2)
    },
    /**
     * Cat model. Has a texture map and a bump map.
     */
    cat: {
        path: "./models/gltf/cat.glb",
        textures: {
            diffuse: "./models/gltf/Cat_diffuse.jpg",
            bump: "./models/gltf/Cat_bump.jpg"
        },
        modelTransform: NodeTransform3D.FromPositionZUpAndScale(V3(), Vec3.UnitZ().times(1), Vec3.UnitY().times(-1), 0.02)
    },
    /**
     * Duck model. [Good with baths](https://youtu.be/Mh85R-S-dh8?si=rzUyiVH9m94gh2Mi&t=22).
     */
    duck: {
        path:"./models/obj/duck/10602_Rubber_Duck_v1_L3.obj",
        textures: {
            diffuse: "./models/obj/duck/10602_Rubber_Duck_v1_diffuse.jpg"
        },
        modelTransform: new NodeTransform3D(V3(), Quaternion.RotationZ(Math.PI), 0.05)
    },
    /**
     * Red car. This one was exported from blender and has the flipped texture coordinates.
     */
    car1GLTF: {
        path:"./models/gltf/car1/car.gltf",
        textures: {
            diffuse: "./models/gltf/car1/10604_slot_car_red_SG_v1_diffuse.jpg"
        },
        modelTransform: Mat4.Scale3D(0.2)
    },

    /**
     * Original red car model. This one renders the windshield and the texture y coordinates are not flipped.
     */
    car1: {
        path:"./models/obj/car1/10604_slot_car_red_SG_v1_iterations-2.obj",
        textures: {
            diffuse: "./models/obj/car1/10604_slot_car_red_SG_v1_diffuse.jpg"
        },
        modelTransform: Mat4.Scale3D(0.2)
    },
    /**
     * Lab Cat likes to help. He is probably the best model. Definitely more handsome than that other Cat.
     */
    LabCat: {
        path: "models/obj/LabCat1/LabCat1.obj",
        textures: {
            diffuse: "models/obj/LabCat1/LabCat1.png",
        },
        modelTransform:Mat4.FromColumns(
            V4(-1,0,0,0),
            V4(0,0,1,0),
            V4(0,1,0,0),
            V4(0,0,0,1)
        ),
    },
    /**
     * Lab Cat is very flexible and can flip his texture. Check the model loading part of the assignment docs for an explanation...
     */
    LabCatGLTFlipped: {
        path: "models/gltf/LabCat/LabCatGLTF.gltf",
        textures: {
            diffuse: "models/gltf/LabCat/LabCatNov17_2024_V1_BaseColor.png",
        },
        modelTransform:Mat4.FromColumns(
            V4(-1,0,0,0),
            V4(0,0,1,0),
            V4(0,1,0,0),
            V4(0,0,0,1)
        ),
    }
}

/** Registers the example model assets with the `AssetManager`, so they can be loaded by name. */
export function loadExampleAssetDetails(){
    AssetManager.addModelAssetDetailsDict(ExampleAssetDetails);
}



// export {AssetManager}
