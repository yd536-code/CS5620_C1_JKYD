import {ASerializable} from "../../../base";
import {ANodeModel2D} from "../../../scene";
import {SVGLAsset} from "../../../fileio";
import {BoundingBox2D} from "../../../geometry";

/** Subscription handle names used with {@link SVGModel2D}. */
export enum SVGModelEnums{
    SelfSVGScaleListener = 'SelfSVGScaleListener'
}

/**
 * A 2D node that holds an SVG asset ({@link SVGLAsset}) as part of its geometry. Create one from a loaded asset with
 * `CreateFromAsset`, or load and create in one step with `await SVGModel2D.LoadFromSVG(url)`.
 */
@ASerializable("SVGModel2D")
export class SVGModel2D extends ANodeModel2D {
    /** The SVG asset, added to this node's geometry set. */
    svgAsset!:SVGLAsset;
    /** This node's children, typed as 2D node models. */
    get children():ANodeModel2D[]{
        return this._children as ANodeModel2D[];
    }

    constructor(svgAsset?:SVGLAsset, ...args:any[]) {
        super();
        if(svgAsset !== undefined){
            this._setAsset(svgAsset);
        }
    }

    /** Stores `svgAsset` and adds it to the geometry set. */
    _setAsset(svgAsset:SVGLAsset){
        this.svgAsset=svgAsset;
        this.geometry.addMember(this.svgAsset);
    }

    /** Creates a model from an already-loaded SVG asset. */
    static CreateFromAsset(svgAsset:SVGLAsset, ...args:any[]){
        return new this(svgAsset, ...args);
    }

    /** Loads the SVG at `svgURL` and returns a new model holding it. */
    static async LoadFromSVG(svgURL:string){
        let svgAsset:SVGLAsset = await SVGLAsset.Load(svgURL);
        return new this(svgAsset);
    }

    /** Same as `getBounds2D()`. */
    getBounds():BoundingBox2D{
        return this.getBounds2D();
    }

    /** Bounding box of this node's vertex positions and its children's `getBoundsXY()` boxes. */
    getBounds2D():BoundingBox2D{
        let b = new BoundingBox2D();
        b.boundVertexPositionArrray(this.verts.position);
        for(let c of this.children){
            b.boundBounds(c.getBoundsXY());
        }
        return b;
    }
}
