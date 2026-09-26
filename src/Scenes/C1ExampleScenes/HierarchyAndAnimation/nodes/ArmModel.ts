import {AGroupNodeModel2D, ANodeModel, AppState, ASerializable, Color, GetAppState, V2, Vec2} from "../../../../anigraph";
import {ArmLinkModel} from "./ArmLinkModel";

/**
 * # An articulated arm
 *
 * A chain of `ArmLinkModel`s, built in this node's constructor. The chain is a hierarchy, not a list of siblings:
 * ```
 * ArmModel
 *   └── link 0
 *         └── link 1
 *               └── link 2 ...
 * ```
 * Each link's transform is relative to the link before it, so rotating link 1 swings links 2, 3, ... along with
 * it, and moving the arm (or the star it is attached to) moves every link.
 *
 * The arm owns the controls that affect it: one rotation slider per link, the ArmStyle dropdown and the ShowArm
 * checkbox. It also owns selection: which link is selected, and turning a drag into a new angle for that link.
 *
 * A group node draws nothing itself; the controller pairs it with `AGroupNodeView`.
 */
@ASerializable("HAArmModel")
export class ArmModel extends AGroupNodeModel2D{
    /** Names of this node's control-panel entries. The rotation sliders' names come from `LinkRotationKey`. */
    static ControlKeys = {
        Style: "ArmStyle",
        Show: "ShowArm",
    }

    /** The choices in the ArmStyle dropdown. */
    static Styles = {
        Rainbow: "Rainbow",
        Solid: "Solid",
    }

    /** How many links the arm has. The rotation sliders are made from this, so it is static. */
    static NumLinks = 5;

    /** The color of every link in the "Solid" style, and the first link's color in the "Rainbow" style. */
    static BaseColor = Color.FromString("#3a7bd5");

    /** The links, from the star outward. `links[i+1]` is a child of `links[i]`. */
    links: ArmLinkModel[] = [];

    /** The selected link, if any. Dragging rotates it. */
    selectedLink?: ArmLinkModel;

    /**
     * The name of link `i`'s rotation slider.
     * @param i
     */
    static LinkRotationKey(i: number): string{
        return `ArmLink${i}Rotation`;
    }

    /**
     * Adds this node's controls to the control panel. The scene model calls it from `initAppState`.
     * @param appState
     */
    static SetAppState(appState: AppState){
        // A dropdown: name, initial value, list of options
        appState.setSelectionControl(ArmModel.ControlKeys.Style, ArmModel.Styles.Rainbow, Object.values(ArmModel.Styles));
        // A checkbox: name, initial value
        appState.addCheckboxControl(ArmModel.ControlKeys.Show, true);
        // One rotation slider per link. The range [-π, π] covers every angle a drag can produce (see `dragToward`).
        for(let i=0;i<ArmModel.NumLinks;i++){
            appState.addSliderIfMissing(ArmModel.LinkRotationKey(i), 0.3, -Math.PI, Math.PI, 0.01);
        }
    }

    constructor(){
        super();
        this.buildChain();
        this.applyStyle(GetAppState().getState(ArmModel.ControlKeys.Style));
        this.setShown(GetAppState().getState(ArmModel.ControlKeys.Show));

        // Subscriptions only fire on changes, which is why the current values were applied just above.
        this.subscribeToAppState(ArmModel.ControlKeys.Style, (style: string)=>this.applyStyle(style));
        this.subscribeToAppState(ArmModel.ControlKeys.Show, (show: boolean)=>this.setShown(show));
    }

    /**
     * Creates the links, each one a child of the previous one, and connects each to its rotation slider.
     */
    buildChain(){
        // The first link's joint is at this arm's origin; each later link's joint is at its parent's tip.
        let parent: AGroupNodeModel2D|ArmLinkModel = this;
        let jointInParent: Vec2 = V2(0, 0);
        for(let i=0;i<ArmModel.NumLinks;i++){
            const link = new ArmLinkModel(i);
            link.attachAt(jointInParent);
            parent.addChild(link);
            this.links.push(link);

            const rotationKey = ArmModel.LinkRotationKey(i);
            link.setAngle(GetAppState().getState(rotationKey));
            this.subscribeToAppState(rotationKey, (angle: number)=>link.setAngle(angle));

            parent = link;
            jointInParent = ArmLinkModel.Tip();
        }
    }

    /**
     * Colors the links for a style from the ArmStyle dropdown.
     * @param style one of `ArmModel.Styles`
     */
    applyStyle(style: string){
        this.links.forEach((link, i)=>{
            const hueShift = (style === ArmModel.Styles.Rainbow) ? i*2*Math.PI/this.links.length : 0;
            link.setColor(ArmModel.BaseColor.GetSpun(hueShift));
        });
    }

    /**
     * Shows or hides the whole arm. Hiding a node hides its descendants too.
     * A hidden node can still be picked by a click, so the arm also deselects and ignores picks while hidden
     * (see `onPress`).
     * @param show
     */
    setShown(show: boolean){
        this.visible = show;
        if(!show){
            this.select(undefined);
        }
    }

    /**
     * Makes `link` the selected link (or selects nothing, if `link` is undefined).
     * @param link
     */
    select(link: ArmLinkModel|undefined){
        this.selectedLink?.setSelected(false);
        this.selectedLink = link;
        this.selectedLink?.setSelected(true);
    }

    /**
     * A mouse press, forwarded from the scene model. Selects the pressed link if it is one of this arm's links, and
     * otherwise deselects.
     * @param pickedNode the frontmost node under the cursor, if any
     */
    onPress(pickedNode: ANodeModel|undefined){
        const link = this.links.find((l)=>l === pickedNode);
        this.select(this.visible ? link : undefined);
    }

    /**
     * A drag, forwarded from the scene model. Points the selected link at the cursor.
     *
     * Instead of setting the link's rotation directly, this sets the link's slider, and the slider's subscription
     * (in `buildChain`) rotates the link. That way the slider always shows the link's real angle.
     * `setControlPanelStateValue` also moves the slider in the panel; `setState` alone would not.
     * @param worldPoint the cursor, in world coordinates
     */
    dragToward(worldPoint: Vec2){
        if(!this.selectedLink){
            return;
        }
        const angle = this.selectedLink.angleToward(worldPoint);
        GetAppState().setControlPanelStateValue(ArmModel.LinkRotationKey(this.selectedLink.index), angle);
    }
}
