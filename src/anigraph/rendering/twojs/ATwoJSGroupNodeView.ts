import {ATwoJSNodeView} from "./ATwoJSNodeView";

/**
 * Two.js view for group node models (e.g. `AGroupNodeModel2D`).
 *
 * A group renders no geometry of its own; it exists so that child views nested
 * under it inherit its transform. This is the Two.js counterpart of the
 * Three.js {@link AGroupNodeView}.
 */
export class ATwoJSGroupNodeView extends ATwoJSNodeView {
    /** Creates nothing: a group has no geometry. */
    init(): void {
        // No geometry — groups only propagate transforms.
    }

    /** Re-applies the group's transform. */
    update(): void {
        this.updateTransform();
    }
}
