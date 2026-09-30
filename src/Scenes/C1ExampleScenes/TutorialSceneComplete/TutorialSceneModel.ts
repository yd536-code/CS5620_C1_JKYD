import {ASceneModel2D} from "../../../anigraph/starter/Scene2D/ASceneModel2D";
import {
    AMeshModel2D,
    ANodeModel,
    ANodeModel2D,
    AObjectNode,
    AppState,
    AssetManager,
    ASVGLModel2D,
    Color,
    GetAppState,
    Mat3,
    V2,
    Vec2
} from "../../../anigraph";
import {PolygonModel2D} from "../../../anigraph/starter/nodes/polygon2D";
import {
    TutDotsModel,
    TutFactories,
    TutFlipbookModel,
    TutGroupModel,
    TutLineModel,
    TutMovableModel,
    TutNoiseModel,
    TutParticleSystemModel,
    TutPivotModel,
    TutShapeModel
} from "./nodes";

/**
 * The tutorial scene's model, with every step of the C1 tutorial done. The scene is a workbench of small, separate
 * demos, each at its own spot (see the README for which step added what, and where).
 *
 * The scene model builds the scene, passes time and input on to the nodes, and handles the few things that involve
 * more than one node: the Ping subscription (step 3.3), reparenting (2.5), the world-position marker (4.3), the
 * overlap check (8.7) and where particles are emitted (11.2). It also owns the scene-wide controls: the background,
 * the camera, and the controls for plain engine nodes that have no class of their own.
 */
export class TutorialSceneModel extends ASceneModel2D{
    /** Names of the controls the scene model owns. */
    static ControlKeys = {
        Ping: "Ping",
        MoveSquare: "MoveSquare",
        Background: "Background",
        SVGDepth: "SVGDepth",
        ShowGroups: "ShowGroups",
        Pulse: "Pulse",
        CameraZoom: "CameraZoom",
        CenterCamera: "CenterCamera",
    }

    /** The Background dropdown's choices (step 6.1). */
    static BackgroundOptions = {
        Plain: "Plain",
        Image: "Image",
    }

    /** The name the background image is stored under. */
    static BackgroundTextureName = "TutorialBackground";

    /** How close (in world units) the movable square has to be to highlight the shape (step 8.7). */
    static HighlightDistance = 1.5;

    /** Step 1.1: the first node. */
    shape!: TutShapeModel;
    /** Steps 2.2 and 2.5: the two groups. */
    groupA!: TutGroupModel;
    groupB!: TutGroupModel;
    /** Step 2.3: a square nested inside one of groupA's squares. */
    nested!: PolygonModel2D;
    /** Step 2.5: the square the MoveSquare button takes out of groupA and puts back. */
    traveler!: PolygonModel2D;
    /** Step 4.1 */
    pivot!: TutPivotModel;
    /** Step 4.2 */
    triangle!: PolygonModel2D;
    /** Step 4.3 */
    marker!: PolygonModel2D;
    /** Step 6.2 */
    fan!: AMeshModel2D;
    /** Step 6.4 */
    quad!: AMeshModel2D;
    /** Step 6.5 (optional) */
    flipbook!: TutFlipbookModel;
    /** Step 6.6 */
    svg!: ASVGLModel2D;
    /** Step 6.7 */
    line!: TutLineModel;
    /** Step 6.8 */
    dots!: TutDotsModel;
    /** Step 8.1 */
    movable!: TutMovableModel;
    /** Step 10.1 */
    wobbler!: TutNoiseModel;
    /** Step 11.1 */
    particles!: TutParticleSystemModel;

    /**
     * 1st: adds control-panel controls, before assets load and before the panel is first drawn. Each node class
     * adds its own controls through a static `SetAppState`. Buttons that call a method on a particular node are
     * added here, because no node exists yet when a static `SetAppState` runs; the arrow function looks the node up
     * when the button is clicked.
     * @param appState the app state, which holds the value of every control
     */
    initAppState(appState: AppState){
        super.initAppState(appState);
        const keys = TutorialSceneModel.ControlKeys;
        TutShapeModel.SetAppState(appState);                            // steps 3.1, 3.2
        appState.addButton(keys.Ping, ()=>this.shape?.ping());           // step 3.3
        appState.addButton(keys.MoveSquare, ()=>this.moveTraveler());    // step 2.5
        appState.setSelectionControl(                                    // step 6.1
            keys.Background,
            TutorialSceneModel.BackgroundOptions.Plain,
            Object.values(TutorialSceneModel.BackgroundOptions)
        );
        TutFlipbookModel.SetAppState(appState);                          // step 6.5
        TutLineModel.SetAppState(appState);                              // step 6.7
        appState.addSliderIfMissing(keys.SVGDepth, 0.1, -1, 1, 0.01);    // step 6.9
        appState.addCheckboxControl(keys.ShowGroups, true);              // step 6.10
        appState.addButton(keys.Pulse, ()=>this.shape?.pulse());         // step 7.2
        appState.addSliderIfMissing(keys.CameraZoom, 1, 0.25, 3, 0.01);  // step 8.6
        appState.addButton(keys.CenterCamera, ()=>this.centerCamera());  // step 8.6
    }

    /**
     * 2nd: loads files. `super` first: it loads the standard materials. Each node class loads what it needs.
     */
    async PreloadAssets(): Promise<void> {
        await super.PreloadAssets();
        await TutShapeModel.PreloadAssets();                             // step 9.1 (the pop)
        await AssetManager.loadTexture("./images/SpaceBG.jpg", TutorialSceneModel.BackgroundTextureName); // step 6.1
        await TutFactories.PreloadAssets();                              // steps 6.4, 6.6
        await TutFlipbookModel.PreloadAssets();                          // step 6.5
        await TutParticleSystemModel.PreloadAssets();                    // step 11.1
    }

    /**
     * 3rd: builds the scene. Each top-level node is added with `addNode`, which adds its children too.
     */
    async initScene(){
        // Step 1.1: the first node.
        this.shape = new TutShapeModel();
        this.addNode(this.shape);

        // Step 2.2: a group node that turns two squares.
        this.groupA = new TutGroupModel(1);
        this.groupA.prsa.position = V2(5, 2);
        this.addNode(this.groupA);

        // Step 2.3: a child of a child. It moves with its parent square, which moves with the group.
        this.nested = TutFactories.Square(0.35, Color.FromString("#1b5e20"));
        this.nested.prsa.position = V2(0.8, 0);
        this.groupA.squares[1].addChild(this.nested);

        // Step 2.4: tag a node, then find it by its tag.
        this.nested.addTag("highlight");
        for(const node of this.getNodesWithTag("highlight")){
            node.material.setValue("color", Color.White().asThreeJS());
        }

        // Step 2.4, continued: a second group, turning the other way. getNodesOfType finds it, so timeUpdate
        // updates it with no extra code.
        this.groupB = new TutGroupModel(-1, Color.FromString("#2e86c1"));
        this.groupB.prsa.position = V2(5, -2);
        this.addNode(this.groupB);

        // Step 2.5: the square the MoveSquare button takes out of groupA and puts back.
        this.traveler = this.groupA.squares[0];

        // Step 3.3: connect groupA to the shape's Ping event. Neither node refers to the other.
        this.groupA.subscribe(this.shape.addPingListener(()=>this.groupA.recolor()));

        // Step 4.1: a square that rotates about its corner.
        this.pivot = new TutPivotModel();
        this.pivot.prsa.position = V2(-5, 3);
        this.addNode(this.pivot);

        // Step 4.2: placed with a Mat3. setTransform keeps the node's PRSA transform, so prsa still works after.
        this.triangle = TutFactories.Triangle();
        this.triangle.setTransform(Mat3.Translation2D(V2(-5, 0)).times(Mat3.Rotation(Math.PI/6)));
        this.triangle.prsa.scale = V2(1.2, 1.2);
        this.addNode(this.triangle);

        // Step 4.3: a marker that the scene model moves to the nested square's world position every frame.
        this.marker = TutFactories.Marker();
        this.marker.zValue = 0.2;
        this.addNode(this.marker);

        // Step 6.2: a triangle mesh.
        this.fan = TutFactories.Fan();
        this.fan.prsa.position = V2(-6.5, -4);
        this.addNode(this.fan);

        // Step 6.4: a texture.
        this.quad = TutFactories.TexturedQuad();
        this.quad.prsa.position = V2(-3, -4);
        this.addNode(this.quad);

        // Step 6.5 (optional): a flipbook.
        this.flipbook = new TutFlipbookModel();
        this.flipbook.prsa.position = V2(-7, 0);
        this.flipbook.prsa.scale = V2(1.2, 1.2);
        this.addNode(this.flipbook);

        // Step 6.6: an SVG, overlapping the textured quad so that step 6.9 can move it in front or behind.
        this.svg = TutFactories.SVG();
        this.svg.prsa.position = V2(-2.5, -3.5);
        this.addNode(this.svg);

        // Step 6.7: a line.
        this.line = new TutLineModel();
        this.line.prsa.position = V2(6, -5.5);
        this.addNode(this.line);

        // Step 6.8: a polygon drawn by a custom view.
        this.dots = new TutDotsModel();
        this.dots.prsa.position = V2(2.5, -5);
        this.addNode(this.dots);

        // Steps 6.9 and 6.10: controls for nodes that have no class of their own. Apply the current values once,
        // then subscribe, since subscriptions only fire on changes.
        const keys = TutorialSceneModel.ControlKeys;
        const appState = GetAppState();
        this.applySVGDepth(appState.getState(keys.SVGDepth));
        this.applyShowGroups(appState.getState(keys.ShowGroups));
        this.subscribeToAppState(keys.SVGDepth, (z: number)=>this.applySVGDepth(z));
        this.subscribeToAppState(keys.ShowGroups, (show: boolean)=>this.applyShowGroups(show));

        // Step 8.1: a square moved with the keys.
        this.movable = new TutMovableModel();
        this.movable.prsa.position = V2(0, -3);
        this.movable.zValue = 0.1;
        this.addNode(this.movable);

        // Step 8.6: the camera's zoom.
        this.applyZoom(appState.getState(keys.CameraZoom));
        this.subscribeToAppState(keys.CameraZoom, (zoom: number)=>this.applyZoom(zoom));

        // Step 10.1: noise.
        this.wobbler = new TutNoiseModel(V2(0, 5));
        this.addNode(this.wobbler);

        // Step 11.1: particles, drawn in front of the movable square.
        this.particles = new TutParticleSystemModel();
        this.particles.zValue = 0.3;
        this.addNode(this.particles);
    }

    /**
     * Step 2.5: takes the traveler square out of groupA, or puts it back, without it jumping on screen. Detached,
     * it's a child of the scene's root and stops turning; put back, it turns with the group again from wherever it
     * is. A node's transform is relative to its parent, so after `reparent` the traveler's local transform is set to
     * keep its world transform the same: `newParentWorld⁻¹ * oldWorld`.
     */
    moveTraveler(){
        const newParent = (this.traveler.parent === this.groupA) ? this.modelGraph : this.groupA;
        const oldWorld = this.traveler.getWorldTransform();
        this.traveler.reparent(newParent);
        const newParentWorld = (newParent instanceof ANodeModel2D) ? newParent.getWorldTransform() : Mat3.Identity();
        this.traveler.setTransform(newParentWorld.getInverse().times(oldWorld));
    }

    /**
     * Step 6.9: moves the SVG in front of (positive) or behind (negative) the textured quad.
     * @param z the SVG's new `zValue`
     */
    applySVGDepth(z: number){
        this.svg.zValue = z;
    }

    /**
     * Step 6.10: shows or hides both groups. Hiding a node hides its descendants too.
     * @param show whether to show them
     */
    applyShowGroups(show: boolean){
        this.groupA.visible = show;
        this.groupB.visible = show;
    }

    /**
     * Step 8.6: sets the camera's zoom. Higher is more magnified.
     * @param zoom the new zoom
     */
    applyZoom(zoom: number){
        this.cameraModel.camera.zoom = zoom;
    }

    /**
     * Step 8.6: moves the camera back to the origin. The Pan/Zoom mode may have turned the camera's transform into a
     * `Mat3`, so switch it back to PRSA before using `prsa`.
     */
    centerCamera(){
        this.cameraModel.convertTransformToPRSA();
        this.cameraModel.prsa.position = V2(0, 0);
    }

    /**
     * Called once per frame by the scene controller. Node `timeUpdate`s are not called automatically, so this calls
     * each one, then handles the per-frame things that involve more than one node.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number){
        // Step 2.1 (and each later node as it's added).
        this.shape.timeUpdate(t);
        // Step 2.4: every group, found by type, so a group added later is never missed.
        for(const group of this.getNodesOfType(TutGroupModel)){
            group.timeUpdate(t);
        }
        this.pivot.timeUpdate(t);
        this.flipbook.timeUpdate(t);
        this.movable.timeUpdate(t);
        this.wobbler.timeUpdate(t);

        // Step 4.3: the marker goes to the nested square's world position (its origin, mapped to world coordinates).
        this.marker.prsa.position = this.nested.getWorldTransform().times(V2(0, 0));

        // Step 8.7: highlight the shape while the movable square is near it.
        const distance = this.movable.prsa.position.minus(this.shape.prsa.position).L2();
        this.shape.setHighlighted(distance < TutorialSceneModel.HighlightDistance);

        // Step 11.2: particles are emitted where the movable square is.
        this.particles.emitPosition = this.movable.prsa.position.clone();
        this.particles.timeUpdate(t);
    }

    /**
     * Step 8.1: key presses, forwarded from the controller. X fires a particle (step 11.2), once per press; other
     * keys go to the movable square. (Not the space bar: it also scrolls the page.)
     * @param key the key's name (`KeyboardEvent.key`)
     */
    onKeyDown(key: string){
        if(key.toLowerCase() === "x"){
            this.particles.fire();
        }else{
            this.movable.onKeyDown(key);
        }
    }

    /**
     * Step 8.2: key releases, forwarded from the controller.
     * @param key the key's name (`KeyboardEvent.key`)
     */
    onKeyUp(key: string){
        this.movable.onKeyUp(key);
    }

    /**
     * Step 8.3: picking. The picked node is the one whose view was hit, so walk up the scene graph to a node this
     * scene cares about, then let that node decide what being picked means.
     * @param node the frontmost node under the cursor, or undefined
     */
    onPick(node?: AObjectNode){
        let current: AObjectNode|undefined|null = node;
        while(current && !(current instanceof TutShapeModel)){
            current = current.parent;
        }
        if(current instanceof TutShapeModel){
            current.pulse();
        }
    }

    /** Step 8.4: the node being dragged, if any. */
    dragged?: ANodeModel2D;

    /**
     * Step 8.4: a drag started on a node (or on nothing). Selected on press (drag start), not on click, since the
     * browser sends a click at the end of every drag.
     * @param node the frontmost node under the cursor, or undefined
     */
    onDragStart(node?: ANodeModel){
        this.dragged = (node instanceof ANodeModel2D && node.transformIsPRSA) ? node : undefined;
    }

    /**
     * Step 8.4: moves the dragged node to the cursor. A node's position is in its *parent's* coordinates, so the
     * world point is brought into those coordinates first. That's what makes this work for a square inside a
     * turning group.
     * @param worldPoint the cursor, in world coordinates
     */
    onDrag(worldPoint: Vec2){
        if(!this.dragged){
            return;
        }
        const parent = this.dragged.parent;
        const pointInParent = (parent instanceof ANodeModel2D) ?
            parent.getWorldTransform().getInverse().times(worldPoint) : worldPoint;
        this.dragged.prsa.position = pointInParent;
    }

    /** Step 8.4: the drag ended. */
    onDragEnd(){
        this.dragged = undefined;
    }
}
