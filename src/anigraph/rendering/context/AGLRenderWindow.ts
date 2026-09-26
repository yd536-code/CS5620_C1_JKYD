/**
 * @file Defines {@link AGLRenderWindow}, the Three.js render window.
 * @author Abe Davis
 */
import {ALabel} from "../../base";
import {AGLContext} from "./AGLContext";
import type {ASceneController} from "../../scene";
import {assert} from "../../basictypes";
import {ARenderWindow} from "./ARenderWindow";

/**
 * Makes the browser download `blob` as a file called `filename`. It does this by pointing a temporary `<a download>`
 * link at an object URL for the blob, clicking it, and then cleaning up the link and the URL.
 */
function DownloadBlob(blob:Blob, filename:string){
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

/**
 * Render window for Three.js scenes. Connects an {@link AGLContext} to a DOM container, runs the
 * `requestAnimationFrame` loop that drives the scene controller, and can capture a frame as an image
 * (`recordNextFrame`). The render loop, context/container storage, and resize listener come from
 * {@link ARenderWindow}.
 */
@ALabel("AGLRenderWindow")
export class AGLRenderWindow extends ARenderWindow {
    protected _recordNextFrame: boolean = false;
    protected _recordNextFrameCallback!: (imageBlob: Blob | null) => void;

    /** Sets the render context. */
    setContext(context:AGLContext){
        this._context = context;
    }

    /** Uses `context` if given; otherwise creates a default {@link AGLContext} if none is set yet. */
    initContext(context?:AGLContext){
        if(context){
            this.setContext(context);
        }else{
            if(this.context === undefined){
                this.setContext(new AGLContext());
            }
        }

    }

    /**
     * @param sceneController Controller to drive each frame. Must not already be assigned to a render window.
     * @param context Optional context; a default {@link AGLContext} is created if omitted.
     */
    constructor(sceneController:ASceneController, context?:AGLContext){
        super();
        this.bindMethods();
        this.initContext(context);
        assert(sceneController.renderWindow === undefined, "Tried to use scene controller that is already assigned to a window");
        this.setSceneController(sceneController);
        this._registerResizeListener();
    }

    /** The scene controller's `THREE.WebGLRenderer`. */
    get renderer() {
        return (this.sceneController.context as AGLContext).renderer;
    }


    /**
     * Moves the renderer's canvas into `container` (removing it from any previous container) and resizes the
     * renderer to the container's size.
     */
    setContainer(container:HTMLElement){
        const glContext = this.sceneController.context as AGLContext;
        if(this._container){
            this._container.removeChild(glContext.renderer.domElement)
        }
        this._container = container;
        this._container.appendChild(glContext.renderer.domElement);
        glContext.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    /** Sets the scene controller and registers this window with it. */
    setSceneController(sceneController:ASceneController){
        this._sceneController = sceneController;
        this.sceneController.setRenderWindow(this);
    }

    /** Binds `render` and the default save callback to this instance so they can be passed as callbacks. */
    bindMethods(){
        this.render = this.render.bind(this);
        this._saveSingleFrameCallback = this._saveSingleFrameCallback.bind(this);
    }

    /**
     * Captures the next rendered frame as an image blob. The capture happens after the next frame's
     * `onAnimationFrameCallback`, at the canvas's DOM resolution.
     * @param callback Receives the PNG blob. If omitted, the frame is downloaded as `<serializationLabel>.png` (see
     * `_saveSingleFrameCallback`).
     */
    recordNextFrame(callback?:(imageBlob:Blob|null)=>void){
        if(callback===undefined){
            this._recordNextFrameCallback = this._saveSingleFrameCallback;
        }else{
            this._recordNextFrameCallback=callback;
        }
        this._recordNextFrame = true;
    }

    /**
     * Default `recordNextFrame` callback: downloads the blob as `<serializationLabel>.png`. Warns and does nothing if
     * the capture produced no blob.
     */
    _saveSingleFrameCallback(imageBlob:Blob|null){
        if(!imageBlob){
            console.warn("AGLRenderWindow: frame capture produced no image, so nothing was saved.");
            return;
        }
        DownloadBlob(imageBlob, `${this.serializationLabel}.png`);
    }

    /**
     * One iteration of the render loop. While `isRendering`, schedules the next frame, then (if the controller is
     * initialized and ready) calls `sceneController.onAnimationFrameCallback` and handles any pending frame capture.
     */
    render(){
        if(this.isRendering){
            requestAnimationFrame(()=>this.render());
            if(this.sceneController.isInitialized && this.sceneController.isReadyToRender) {
                this.sceneController.onAnimationFrameCallback(this.context);
                if (this._recordNextFrame) {
                    this._recordNextFrame = false;
                    let self = this;
                    this.renderer.domElement.toBlob(function (blob: Blob | null) {
                        self._recordNextFrameCallback(blob);
                    });
                    console.warn("May be using DOM element resolution for saving frame...")
                }
            }
        }
    }
}
