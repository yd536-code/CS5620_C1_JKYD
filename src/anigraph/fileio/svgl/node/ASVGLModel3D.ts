import {ASerializable} from "../../../base";
import {ANodeModel3D} from "../../../scene";
import {BoundingBox3D} from "../../../geometry";
import {SVGLAsset} from "../SVGLAsset";

/**
 * 3D node model that displays an {@link SVGLAsset} (flat SVG art placed in a 3D scene). The asset is added to the
 * model's `geometry`. Displayed by {@link ASVGLView}.
 */
@ASerializable("ASVGLModel3D")
export class ASVGLModel3D extends ANodeModel3D {
    /** The SVG asset this node displays. */
    svgAsset!:SVGLAsset;
    // refObject3D!:THREE.Object3D;

    constructor(svgAsset?:SVGLAsset) {
        super();
        if(svgAsset !== undefined){
            this._setAsset(svgAsset);
        }
    }

    /** Sets `svgAsset` and adds it to the model's geometry. */
    _setAsset(svgAsset:SVGLAsset){
        this.svgAsset=svgAsset;
        this.geometry.addMember(this.svgAsset);
    }

    /** Creates a model that displays an already-loaded asset. */
    static FromAsset(svgAsset:SVGLAsset){
        return new this(svgAsset);
    }

    /** Loads the SVG at `svgURL` with {@link SVGLAsset.Load} (normalized to unit width) and creates a model for it. */
    static async LoadFromSVGL(svgURL:string){
        let svgAsset:SVGLAsset = await SVGLAsset.Load(svgURL);
        return new this(svgAsset);
    }

    /** Returns the bounds of the model's geometry. */
    getBounds():BoundingBox3D{
        // let b = this._svgBounds.clone();
        // let threebox = new THREE.Box3().setFromObject(this.refObject3D);
        return this.geometry.getBounds();
        // let bounds = new BoundingBox3D()
        // bounds.minPoint=V3(threebox.min.x, threebox.min.y, threebox.min.z);
        // bounds.maxPoint=V3(threebox.max.x, threebox.max.y, threebox.max.z);
        // bounds.transform = this.transform;
        //     // this.getWorldTransform();
        // return bounds;
    }
}
