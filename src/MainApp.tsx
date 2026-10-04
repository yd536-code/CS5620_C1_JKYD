import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React, {useEffect, useState} from "react";
import {MainComponent, GUIComponent} from "./Component";
import {Layout, GUIBottomComponent, DefaultAppComponent} from "./Component";
import {CreateAppState, ControlPanel, ContextType} from "./anigraph";
import {loadExampleAssetDetails} from "./anigraph/starter/ExampleAssets";

/**
 * Choose which scene runs by leaving exactly one of these `import AppClasses` lines uncommented.
 * See the "Example Scenes" page of the C1 docs for what each scene shows.
 */
// import AppClasses from "./Scenes/C1ExampleScenes/TutorialScene";
// import AppClasses from "./Scenes/C1ExampleScenes/TutorialSceneComplete";
// import AppClasses from "./Scenes/C1ExampleScenes/ProjectScene";
// import AppClasses from "./Scenes/C1ExampleScenes/ShapesAndMaterials";
// import AppClasses from "./Scenes/C1ExampleScenes/HierarchyAndAnimation";
// import AppClasses from "./Scenes/C1ExampleScenes/ParticlePlayground2D";
// import AppClasses from "./Scenes/C1ExampleScenes/CopiesView";
// import AppClasses from "./Scenes/C1ExampleScenes/MouseInput";
// import AppClasses from "./Scenes/C1ExampleScenes/AttachAndDetach";
import AppClasses from "./Scenes/ProjectScene"

export const MainAppConfigs = {
    USE_STRICT_MODE: false
}


loadExampleAssetDetails();

const AppComponentClass = AppClasses.ComponentClass ?? DefaultAppComponent;
const contextType: ContextType = (AppClasses.SceneControllerClass as any).contextType ?? ContextType.THREEJS;

const sceneModel = new AppClasses.SceneModelClass();
const appState = CreateAppState(sceneModel);
sceneModel.initAppState(appState);

if (contextType === ContextType.TWOJS) {
    appState.createMainTwoRenderWindow(AppClasses.SceneControllerClass);
} else {
    appState.createMainRenderWindow(AppClasses.SceneControllerClass);
}
const initConfirmation = appState.confirmInitialized();

const USE_FULL_WINDOW_LAYOUT_KEY = "UseFullWindowLayout";
appState.addCheckboxControl(USE_FULL_WINDOW_LAYOUT_KEY, false);

function MainApp() {
    const [useFullWindowLayout, setUseFullWindowLayout] = useState<boolean>(
        !!appState.getState(USE_FULL_WINDOW_LAYOUT_KEY)
    );

    useEffect(() => {

        initConfirmation.then(() => {
                console.log("Main Initialized.");
                appState.updateControlPanel();
            }
        );
    }, []);

    // Keep this component's layout choice in sync with the control-panel checkbox.
    useEffect(() => {
        const listener = appState.addStateValueListener(USE_FULL_WINDOW_LAYOUT_KEY, (v: boolean) => {
            setUseFullWindowLayout(!!v);
        });
        return () => listener.deactivate();
    }, []);

    // The canvas is only resized in response to the browser's native "resize" event, so
    // toggling the CSS layout above doesn't by itself make the renderer re-measure its
    // container. Explicitly trigger that resize (once the new layout has been painted)
    // whenever the toggle changes.
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            for (const name in appState.renderWindows) {
                const renderWindow = appState.renderWindows[name];
                renderWindow.sceneController.onWindowResize(renderWindow);
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [useFullWindowLayout]);

    return (
        <Layout $fullWindow={useFullWindowLayout}>
            <div className={"control-panel-parent"}>
                <ControlPanel appState={appState}></ControlPanel>
            </div>
            <div className={"container-fluid"} id={"anigraph-app-div"}>
                <div className={"row anigraph-row"}>
                    <div
                        className={`col-${appState.getState("CanvasColumnSize") ?? 10} anigraph-component-container`}>
                        <MainComponent renderWindow={appState.mainRenderWindow} name={appState.sceneModel.name}>
                            <GUIComponent appState={appState}>
                                <AppComponentClass model={sceneModel}></AppComponentClass>
                            </GUIComponent>
                        </MainComponent>
                    </div>
                </div>
                <div className={"row"}>
                    <div
                        className={`col-${appState.getState("CanvasColumnSize") ?? 10} anigraph-component-container`}>
                        <GUIBottomComponent appState={appState}>
                        </GUIBottomComponent>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
export default MainApp;
