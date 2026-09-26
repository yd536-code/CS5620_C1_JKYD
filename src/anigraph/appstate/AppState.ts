import {AAppState} from "../appstate/AAppState";
import type {
    ACallbackSwitch,
    ASceneController,
    ASceneModel,
    ClassInterface,
} from "../index";
import {SetAppState, CheckAAppState} from "../appstate/AAppState";
import {AGLRenderWindow} from "../rendering/context/AGLRenderWindow";
import {ARenderWindow} from "../rendering/context/ARenderWindow";
import {ATwoJSRenderWindow} from "../rendering/context/ATwoJSRenderWindow";
import {AHandlesEvents} from "../base/aobject/AHandlesEvents";

/** Names of the standard render windows. */
enum AppStateEnums{
    MAIN_RENDER_WINDOW="mainWindow",
    SECOND_RENDER_WINDOW="secondWindow"
}

/**
 * The concrete app state the app creates (via {@link CreateAppState}) and the type {@link GetAppState} returns.
 * Adds to `AAppState` a reference to the scene model, the app's render windows (each with its own
 * {@link ASceneController}), and hooks for injecting custom React content into the GUI panel.
 *
 * Control-panel methods (`addSliderControl`, `addStateValueListener`, ...) are inherited from `AAppState`;
 * register controls in your scene model's {@link ASceneModel.initAppState}.
 */
export class AppState extends AAppState{
    /** The app's scene model, shared by every render window's scene controller. */
    sceneModel:ASceneModel;
    /** Render windows by name; the main one is under `"mainWindow"` (see `mainRenderWindow`). */
    renderWindows:{[name:string]:ARenderWindow}={};
    constructor(sceneModel:ASceneModel) {
        super();
        this.sceneModel = sceneModel;
    }


    _getReactGUIContent!:(props:{appState:AppState})=>any;
    _getReactGUIBottomContent!:(props:{appState:AppState})=>any;

    /** Returns the custom React GUI content set with `setReactGUIContentFunction`, or `undefined` if none was set. */
    getReactGUIContent(){
        if(this._getReactGUIContent !== undefined){
            return this._getReactGUIContent({appState: this});
        }else{
            return undefined;
        }
    }

    /** Returns the custom React content for the bottom GUI area, set with `setReactGUIBottomContentFunction`, or `undefined`. */
    getReactGUIBottomContent(){
        if(this._getReactGUIBottomContent !== undefined){
            return this._getReactGUIBottomContent({appState: this});
        }else{
            return undefined;
        }
    }

    /** Sets a function `({appState}) => JSX` that renders custom React content in the GUI panel. */
    setReactGUIContentFunction(func:(props:{appState:any})=>any){
        this._getReactGUIContent=func;
    }

    /** Sets a function `({appState}) => JSX` that renders custom React content in the bottom GUI area. */
    setReactGUIBottomContentFunction(func:(props:{appState:any})=>any){
        this._getReactGUIBottomContent=func;
    }

    /** The main render window, or `undefined` before `createMainRenderWindow`/`createMainTwoRenderWindow` is called. */
    get mainRenderWindow(){
        return this.renderWindows[AppStateEnums.MAIN_RENDER_WINDOW];
    }
    /** Returns the render window registered under `key`, or `undefined`. */
    getRenderWindow(key:string){
        return this.renderWindows[key];
    }

    /** Creates the main WebGL (three.js) render window with a new scene controller of class `controllerClass`. */
    createMainRenderWindow(controllerClass:ClassInterface<ASceneController>){
        this.createRenderWindow(AppStateEnums.MAIN_RENDER_WINDOW, controllerClass);
    }

    /** Returns the scene controller of the render window named `name` (throws if there is no such window). */
    getSceneController(name:string){
        return this.renderWindows[name].sceneController;
    }

    /** The main render window's scene controller. */
    get mainSceneController(){
        return this.getSceneController(AppStateEnums.MAIN_RENDER_WINDOW);
    }

    /**
     * Waits for every render window's scene controller to finish initializing (which initializes the scene
     * model), then, while holding `initMutex`, makes sure `init()` has run (it runs only once; normally
     * `SetAppState` already ran it, so this does nothing more).
     */
    async confirmInitialized(){
        const self = this;
        for(let window_name in this.renderWindows){
            await self.renderWindows[window_name].sceneController.confirmInitialized();
        }
        return self.initMutex.runExclusive(async () => {
            self._initOnce();
        });
    }


    /** Signals the scene model's component update, which re-renders React components listening for it (e.g. the custom GUI content). */
    updateComponents(){
        this.sceneModel.signalComponentUpdate();
    }

    /** Adds a listener for `updateComponents()` signals (forwarded to the scene model). Returns a switch to deactivate it. */
    addComponentUpdateListener(callback:(self:AHandlesEvents)=>void, handle?:string):ACallbackSwitch{
        return this.sceneModel.addComponentUpdateListener(callback, handle);
    }


    /** Creates a WebGL (three.js) render window named `name` with a new `controllerClass` scene controller for `sceneModel`. */
    createRenderWindow(name:string, controllerClass:ClassInterface<ASceneController>): AGLRenderWindow {
        let sceneController = new controllerClass(this.sceneModel);
        const window = new AGLRenderWindow(sceneController);
        this.renderWindows[name] = window;
        return window;
    }

    /** Creates a Two.js (2D) render window named `name` with a new `controllerClass` scene controller for `sceneModel`. */
    createTwoRenderWindow(name: string, controllerClass: ClassInterface<ASceneController>): ATwoJSRenderWindow {
        const sceneController = new controllerClass(this.sceneModel);
        const window = new ATwoJSRenderWindow(sceneController);
        this.renderWindows[name] = window;
        return window;
    }

    /** Creates the main render window as a Two.js (2D) window. */
    createMainTwoRenderWindow(controllerClass: ClassInterface<ASceneController>): ATwoJSRenderWindow {
        return this.createTwoRenderWindow(AppStateEnums.MAIN_RENDER_WINDOW, controllerClass);
    }
}


/**
 * Creates the global {@link AppState} for `sceneModel` and installs it with `SetAppState`. Called once at app
 * startup (in `MainApp.tsx`), before the scene model's `initAppState`.
 *
 * If an app state already exists (e.g., after a hot reload), it logs a warning and returns the existing one
 * unchanged; `sceneModel` is not used in that case.
 */
export function CreateAppState(sceneModel:ASceneModel):AppState{
    let appState = CheckAAppState() as AppState;
    if(appState===undefined){
        appState = new AppState(sceneModel);
        SetAppState(appState);
    }else{
        console.warn(`CreateAppState: an app state already exists; returning the existing one.`);
    }
    return appState;
}
