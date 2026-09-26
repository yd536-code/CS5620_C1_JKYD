import {ALineSegmentsGraphic} from "./ALineSegmentsGraphic";
import {Color, V2, Vector} from "../../math";
import {VertexArray2D} from "../../geometry";
import * as THREE from "three";
import {AMaterial} from "../material";

/**
 * A square grid of lines in the xy plane, centered at the origin, with spacing 1. Vertical lines run at
 * x = -floor(nVertical/2) ... floor(nVertical/2), and horizontal lines at y = -floor(nHorizontal/2) ... floor(nHorizontal/2).
 */
export class GridGraphic extends ALineSegmentsGraphic{
    nVertical:number=20;
    nHorizontal:number=20;
    /** The grid's line-segment vertices. */
    gridVerts!:VertexArray2D;
    /** Line color (stored per vertex). */
    color!:Color;

    /**
     * @param nVertical Number of vertical lines is `2 * floor(nVertical/2) + 1` (default 20).
     * @param nHorizontal Number of horizontal lines is `2 * floor(nHorizontal/2) + 1` (default 20).
     * @param material Line material. The line object is only created if this is given.
     * @param color Line color (default mid gray).
     * @param lineWidth Optional line width.
     */
    constructor(nVertical?:number, nHorizontal?:number, material?: Color | THREE.Color | THREE.Material | THREE.Material[] | AMaterial, color?:Color,
                lineWidth?:number) {
        super()
        this.color = color??Color.FromRGBA(0.5,0.5,0.5,1.0);
        this.nVertical = nVertical??20;
        this.nHorizontal = nHorizontal??20;
        this.gridVerts = new VertexArray2D();
        this.gridVerts.initColorAttribute();
        let vertical = Math.floor(this.nVertical*0.5);
        let horizontal = Math.floor(this.nHorizontal*0.5);
        let xvals = Vector.LinSpace(-vertical, vertical, 2*vertical+1, true );
        let yvals = Vector.LinSpace(-horizontal, horizontal,2*horizontal+1, true );
        for(let xval of xvals.elements){
            this.gridVerts.addVertices([
                V2(xval, -horizontal),
                V2(xval, horizontal)
            ],
                [
                    this.color,
                    this.color
                ])
        }

        for(let yval of yvals.elements){
            this.gridVerts.addVertices([
                    V2(-vertical, yval),
                    V2(vertical, yval)
                ],
                [
                    this.color,
                    this.color
                ])
        }
        this._initIfNotAlready(this.gridVerts, material);
        if(lineWidth!==undefined){
            this.setLineWidth(lineWidth);
        }
        // this.axesTranformNode = this._element;
        // this._element = element;
        // this._element.add(this.axesTranformNode);
    }

    // setSourceTransform(mat:Mat4){
    //     mat.assignTo(this.axesTranformNode.element);
    // }

}
