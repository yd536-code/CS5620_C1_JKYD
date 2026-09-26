import {Color, V3} from "../../math";
import {VertexArray3D} from "../../geometry";
import {ALineMaterialModel, AMaterial, AGLLineMaterial} from "../material";
import {ALabel} from "../../base";
import {Line2} from "three/examples/jsm/lines/Line2";
import {ALineSegmentsGraphic} from "./ALineSegmentsGraphic";

/**
 * Red/green/blue X/Y/Z axis segments from the origin, drawn as wide lines. Line geometry, colors, width and the
 * `Line2` element come from {@link ALineSegmentsGraphic}; this class only builds the axes and owns their line
 * material (which uses vertex colors).
 */
@ALabel("ACoordinateAxesGraphic3D")
export class ACoordinateAxesGraphic3D extends ALineSegmentsGraphic {
    /** The line material used for the axes. */
    lineMaterial:AMaterial;
    /** Length of each axis segment. */
    axesScale:number=1;


    /** The Three.js `Line2` object. */
    get element():Line2{
        return this._element as Line2;
    }

    /** Sets the line width on the axes' own line material (`lineMaterial`), even if `setMaterial` later replaces `this.material`. */
    setLineWidth(lineWidth: number) {
        ((this.lineMaterial._material) as AGLLineMaterial).linewidth = lineWidth;
    }

    /** Returns vertices for three colored segments from the origin to `scale` along x (red), y (green), and z (blue). */
    createVertexArray(scale:number){
        let verts = VertexArray3D.CreateForRendering(false, false, true);
        let o = V3();
        let x = V3(scale,0,0);
        let y = V3(0,scale,0);
        let z = V3(0,0,scale);
        let r=Color.Red().Vec4;
        let g = Color.Green().Vec4;
        let b = Color.Blue().Vec4;
        verts.addVertices(
            [o,x,o,y,o,z],
            [r,r,g,g,b,b]
        )
        return verts
    }

    /** Same as `new ACoordinateAxesGraphic3D(...args)`. */
    static Create(...args:any[]) {
        return new this(...args);
    }

    /**
     * @param scale Length of each axis (default 1).
     * @param lineWidth Line width (default 0.005).
     */
    constructor(scale?:number, lineWidth?:number) {
        super();
        this.lineMaterial = ALineMaterialModel.GlobalInstance.CreateMaterial() as AMaterial;
        this.lineMaterial.usesVertexColors=true;
        this._material = this.lineMaterial._material;
        this.axesScale = (scale!==undefined)?scale:1.0;
        if(lineWidth !== undefined) {
            this.setLineWidth(lineWidth);
        }else{
            this.setLineWidth(0.005);
        }
        this.setLineVerts(this.createVertexArray(this.axesScale));
        this.setMaterial(this.lineMaterial);

        // @ts-ignore
        this._element = new Line2(this.geometry, this.material);
        this._element.matrixAutoUpdate = false;
    }
}
