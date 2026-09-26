import {AppSceneModel2D} from "../../../anigraph/starter/App2D/AppSceneModel2D";
import {ANodeModel, Color, V2, Vec2} from "../../../anigraph";
import {ShapeModel} from "./nodes";

/**
 * # Mouse input
 *
 * The scene model receives mouse input from the controller, already turned into what it needs: the node under the
 * cursor (from picking) and the cursor in world coordinates. It decides what each input does to which shape. The
 * shapes only know how to be highlighted, moved and rotated.
 *
 * Which *interaction mode* is active (Edit or Create) is the controller's business: each mode forwards different
 * events to different methods here.
 */
export class MouseInputSceneModel extends AppSceneModel2D{
    /** How much a shift-drag rotates a shape, in radians per world unit the cursor moves to the right. */
    static RotationPerUnit = 0.5;

    /** The colors new shapes get, in turn. */
    static Palette = ["#3a7bd5", "#e4572e", "#29a36a", "#8e44ad", "#f2a900"].map((c)=>Color.FromString(c));

    /** The shape under the cursor, if any. It is drawn highlighted. */
    hovered?: ShapeModel;

    /** The shape being dragged, if any. Set when a drag starts on a shape, cleared when it ends. */
    dragged?: ShapeModel;

    /** The cursor position at the previous drag event, in world coordinates. Dragging moves by the difference. */
    lastDragPoint?: Vec2;

    /** How many shapes have been created, which picks the next one's color and number of sides. */
    nCreated: number = 0;

    /**
     * Builds the scene: three shapes to start with. This scene has no controls and loads no files.
     */
    async initScene(){
        this.addShape(V2(-5, 0));
        this.addShape(V2(0, 0));
        this.addShape(V2(5, 0));
    }

    /**
     * Adds a new shape. Each one has one more side than the last, and the next color in `Palette`.
     * @param position where to put it, in world coordinates
     */
    addShape(position: Vec2){
        const palette = MouseInputSceneModel.Palette;
        const shape = new ShapeModel(position, 3 + (this.nCreated % 5), palette[this.nCreated % palette.length]);
        this.nCreated += 1;
        this.addNode(shape);
    }

    /**
     * The node under the cursor, if it is one of the shapes. Picking returns whatever node is frontmost, so check its
     * class before treating it as a shape.
     * @param pickedNode
     */
    static AsShape(pickedNode: ANodeModel|undefined): ShapeModel|undefined{
        return (pickedNode instanceof ShapeModel) ? pickedNode : undefined;
    }

    /**
     * The cursor moved (without a button pressed, or while dragging): highlight the shape under it.
     * @param pickedNode the frontmost node under the cursor, if any
     */
    onHover(pickedNode: ANodeModel|undefined){
        const shape = MouseInputSceneModel.AsShape(pickedNode);
        if(shape === this.hovered){
            return;
        }
        this.hovered?.setHovered(false);
        this.hovered = shape;
        this.hovered?.setHovered(true);
    }

    /**
     * A drag started. If it started on a shape, that shape is the one the drag moves.
     * @param pickedNode the frontmost node under the cursor, if any
     * @param worldPoint the cursor, in world coordinates
     */
    onDragStart(pickedNode: ANodeModel|undefined, worldPoint: Vec2){
        this.dragged = MouseInputSceneModel.AsShape(pickedNode);
        this.lastDragPoint = worldPoint.clone();
    }

    /**
     * The cursor moved during a drag. Moves the dragged shape by however far the cursor moved since the last event,
     * or, with shift held, rotates it instead.
     * @param worldPoint the cursor, in world coordinates
     * @param shiftKey whether shift is held
     */
    onDrag(worldPoint: Vec2, shiftKey: boolean){
        if(this.dragged && this.lastDragPoint){
            const delta = worldPoint.minus(this.lastDragPoint);
            if(shiftKey){
                this.dragged.rotateBy(-delta.x*MouseInputSceneModel.RotationPerUnit);
            }else{
                this.dragged.moveBy(delta);
            }
        }
        this.lastDragPoint = worldPoint.clone();
    }

    /** The drag ended: nothing is being dragged any more. */
    onDragEnd(){
        this.dragged = undefined;
        this.lastDragPoint = undefined;
    }

    /**
     * A right click. Deletes the shape under the cursor, if there is one.
     * @param pickedNode the frontmost node under the cursor, if any
     */
    onRightClick(pickedNode: ANodeModel|undefined){
        const shape = MouseInputSceneModel.AsShape(pickedNode);
        if(!shape){
            return;
        }
        // Forget the shape before deleting it, so nothing refers to a deleted node.
        if(this.hovered === shape){
            this.hovered = undefined;
        }
        if(this.dragged === shape){
            this.dragged = undefined;
        }
        // release() deletes the node from the scene, along with its view.
        shape.release();
    }

    /**
     * A click in Create mode: adds a shape where you clicked.
     * @param worldPoint the cursor, in world coordinates
     */
    onCreateClick(worldPoint: Vec2){
        this.addShape(worldPoint);
    }
}
