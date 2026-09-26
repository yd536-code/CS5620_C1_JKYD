import {Particle2D} from "../../../physics";
import {AInstancedParticleSystemGraphic3D, AInstancedParticleSystemView3D} from "../../../effects";
import {InstancedParticleSystemModel2D} from "./InstancedParticleSystemModel2D";
import {Color, Mat3, Mat4} from "../../../math";

/**
 * Base view for an {@link InstancedParticleSystemModel2D}: draws every particle as one instance of a single
 * instanced graphic. Subclasses implement `get2DTransformForParticleIndex(i)` and `getColorForParticleIndex(i)`;
 * the 2D transforms are embedded into 4x4 matrices for rendering. `update()` applies the system model's own transform,
 * including its `zValue`.
 */
export abstract class InstancedParticleSystemView2D<P extends Particle2D> extends AInstancedParticleSystemView3D<P>{

    get particlesElement():AInstancedParticleSystemGraphic3D{
        return this._particlesElement as AInstancedParticleSystemGraphic3D;
    }
    get model():InstancedParticleSystemModel2D<P>{
        return this._model as InstancedParticleSystemModel2D<P>;
    }

    /** The 4x4 instance matrix for particle `i` (from `get2DTransformForParticleIndex`). Warns if there is no
     * instance `i`, i.e. `i >= count` (instances are numbered 0 to count - 1). */
    _getTransformForParticleIndex(i:number):Mat4{
        if(i>=this.particlesElement.count){
            console.warn("You are trying to set the transform for a graphic instance that doesn't exist! Instanced graphics need to have the number of instances specified up front for GPU resource allocation. When you initialize your model, specify the maximum number of particles you may use so that the GPU resources can be allocated! (e.g., when you initialize a particle system model, set the number of particles up front and just set visible=false for any you aren't using yet)")
        }
        let nodetransform = this.get2DTransformForParticleIndex(i);
        return Mat4.From2DMat3(nodetransform.getMatrix());
    };

    _getColorForParticleIndex(i: number): Color {
        return this.getColorForParticleIndex(i);
    }

    /** Returns particle `i`'s 2D transform (e.g. built from its position and size). */
    abstract get2DTransformForParticleIndex(i:number):Mat3;
    /** Returns particle `i`'s color. */
    abstract getColorForParticleIndex(i:number):Color;

    /** Creates the instanced graphic, with one instance per particle in the model, using the view's main material. */
    createParticlesElement(...args:any[]): AInstancedParticleSystemGraphic3D {
        return AInstancedParticleSystemGraphic3D.Create(this.model.nParticles, this.mainMaterial);
        // return AInstancedParticleSystemGraphic3D.Create(this.model.nParticles);
    }

    init() {
        super.init();
    }

    /** Applies the system model's transform, with its `zValue` as the z translation (so the particles are drawn
     * in depth order with other 2D nodes). */
    update(...args:any[]) {
        this.setTransform(this.model.transform);
    }

}
