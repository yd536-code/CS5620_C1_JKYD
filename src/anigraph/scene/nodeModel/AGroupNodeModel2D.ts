import {ANodeModel2D} from "./ANodeModel2D";
import {ASerializable} from "../../base/aserial";

/**
 * A group node for a 2D scene graph. It renders nothing itself; it exists so that its children's views, nested
 * under its own render object, inherit its transform. Its transform representation follows `ANodeModel2D`'s
 * default (`NodeTransform2D`); call `convertTransformToMatrix()` on an instance if you want a `Mat3` instead.
 */
@ASerializable("AGroupNodeModel2D")
export class AGroupNodeModel2D extends ANodeModel2D{
}
