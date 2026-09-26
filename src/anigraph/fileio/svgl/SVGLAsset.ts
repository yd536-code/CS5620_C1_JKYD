import {
  Mat3,
  Mat4,
  NodeTransform3D,
  Quaternion,
  V2,
  V3
} from "../../math";

import {AObject3DModelWrapper, BoundingBox2D,
  BoundingBox3D,} from "../../geometry";
import { SVGLLoader, SVGLParsedData } from "./SVGLLoader";
import { ThreeJSObjectFromParsedSVGL } from "./SvgLToThreeJsObject";

/**
 * A 3D model asset built from SVG text: the SVG is parsed with {@link SVGLLoader} and turned into a hierarchy of
 * Three.js meshes (one per filled shape or stroke). Usually created with {@link SVGLAsset.Load} and placed in a scene
 * with {@link ASVGLModel2D} or {@link ASVGLModel3D}.
 */
export class SVGLAsset extends AObject3DModelWrapper {
  /** The original SVG text. */
  protected svgText: string;
  /** The parsed SVG tree. */
  protected parsedSVG: SVGLParsedData;
  /** Bounds of the Three.js object right after it was built, before any normalization. */
  protected originalBounds!:BoundingBox3D;

  /**
   * Parses `svgText` and builds the Three.js object for it. Does not normalize the size or flip the y-axis;
   * use {@link SVGLAsset.Load} for that.
   */
  constructor(svgText: string) {
    let parsedSVG = SVGLAsset.ParseSVGLText(svgText);
    let refObject3D = ThreeJSObjectFromParsedSVGL(parsedSVG);
    // Mat4.Scale2D(V2(1.0,-1.0)).assignTo(refObject3D.matrix);
    // Mat4.RotationZ(10).assignTo(refObject3D.matrix);
    // Mat4.Identity().assignTo(refObject3D.matrix);
    // Mat4.Scale2D(V2(1.0,-1.0)).assignTo(refObject3D.matrixWorld);
    super(refObject3D);
    this.svgText = svgText;
    this.parsedSVG = parsedSVG;
    this.originalBounds = this.getBounds();
  }

  /**
   * Fetches an SVG file and creates an asset from it.
   * @param svgURL URL of the SVG file
   * @param normalize if true (default), sets the asset's `sourceTransform` to a scale that makes the asset one unit
   * wide and flips the y-axis (SVG's y-axis points down; AniGraph's points up)
   */
  static async Load(svgURL:string, normalize:boolean=true){
    const loader = new SVGLLoader();
    let svgtext:string = await loader.loadSVGLText(svgURL);
    let newSVGAsset = new SVGLAsset(svgtext)
    if(normalize){
      let scaleFactor = 1.0/(newSVGAsset.originalBounds.localWidth);
      newSVGAsset.sourceTransform = new NodeTransform3D(V3(), Quaternion.Identity(), V3(1.0,-1.0,1.0).times(scaleFactor));
      // newSVGAsset.setSourceScale(1.0/(bounds.localWidth))
    }
    return newSVGAsset;
  }

  // get scale() {
  //   return this.sourceScale;
  // }

  // setScale(scale: number) {
  //   // this.setSourceScale(scale);
  //   this.setSourceTrans
  //   this._setMatrix(Mat4.Scale2D(scale));
  // }

  /** Writes `mat` into the wrapped Three.js object's matrix (a 2D `Mat3` is converted to a `Mat4` first). */
  protected _setMatrix(mat: Mat3 | Mat4) {
    if (mat instanceof Mat3) {
      Mat4.From2DMat3(mat).assignTo(this.object.matrix);
    } else {
      mat.assignTo(this.object.matrix);
    }
  }

  /** Parses SVG text into an {@link SVGLParsedData} tree. */
  static ParseSVGLText(svgText: string) {
    const loader = new SVGLLoader();
    const svgParsedData: SVGLParsedData = loader.parse(svgText);
    return svgParsedData;
  }
}
