import {ANodeModel3D} from "./ANodeModel3D";
import {ASerializable} from "../../base/aserial";

/**
 * A group node for a 3D scene graph. It renders nothing itself; it exists so that its children's views, nested
 * under its own render object, inherit its transform. Drawn by {@link AGroupNodeView}.
 */
@ASerializable("AGroupNodeModel3D")
export class AGroupNodeModel3D extends ANodeModel3D{

}
