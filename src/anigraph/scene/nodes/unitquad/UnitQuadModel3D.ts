import {ANodeModel3D} from "../../nodeModel/ANodeModel3D";
import {Mat4} from "../../../math";
import {ASerializable} from "../../../base";
import {AMaterial} from "../../../rendering";
import {NodeTransform3D} from "../../../math";

/**
 * A node that draws a single quad with a given material, via {@link UnitQuadView3D}. The view renders it with
 * `matrix * transform`, where `matrix` is an extra matrix applied on the left of the node's transform.
 */
@ASerializable("UnitQuadModel3D")
export class UnitQuadModel3D extends ANodeModel3D{
    /**
     * Extra matrix applied on the left of the node's transform when drawing. Starts as the identity. A plain field,
     * not state: changing it does not redraw by itself.
     */
    matrix!:Mat4;
    /**
     * @param material The material to draw the quad with.
     * @param transform The initial transform. Defaults to identity.
     */
    constructor(material:AMaterial, transform?:NodeTransform3D, ...args:any) {
        super(undefined, transform);
        this.setMaterial(material);
        this.matrix = new Mat4();
    }
}

