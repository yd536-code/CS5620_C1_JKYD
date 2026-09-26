import type {Color} from "../../math";
import type {AMaterial} from "../material";

/**
 * Backend-agnostic interface for graphic objects — the individual composable
 * visual elements owned by a node view. {@link AGLGraphicObject} (Three.js) and
 * {@link ATwoJSGraphicObject} (Two.js) both implement this, so backend-agnostic
 * view code can hold graphics in a single typed collection.
 *
 * Note that *attaching* a graphic to the display hierarchy is intentionally
 * not part of this interface — it is backend-specific and handled by each
 * backend's node view.
 *
 * `onMaterialChange` accepts `AMaterial | Color` because the two backends
 * consume materials differently: Three.js graphics swap in the material's
 * underlying THREE material, while Two.js graphics can only extract a color.
 */
export interface AGraphicObject {
    /** Unique id, used as the key in a node view's graphics dictionary. */
    readonly uid: string;
    /** Whether the graphic is drawn. */
    visible: boolean;
    /** Sets the graphic's color. */
    setColor(color: Color): void;
    /** Turns wireframe (outline-only) drawing on or off. */
    setWireframe(value: boolean): void;
    /** Called when properties of the current material change. */
    onMaterialUpdate(newMaterial: AMaterial, ...args: any[]): void;
    /** Called when the model's material is replaced. */
    onMaterialChange(newMaterial: AMaterial | Color, ...args: any[]): void;
    /** Frees the graphic's resources and removes it from its parent. */
    dispose(): void;
}
