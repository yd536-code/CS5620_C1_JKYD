import React, {useEffect, useState} from "react";
import {v4 as uuidv4} from "uuid";
import {LevaPanel, levaStore, useControls, useCreateStore} from "leva";
import {AAppState} from "../appstate/AAppState";
import {useSnapshot} from "valtio";

/**
 * Creates a leva store, hands it to the parent through `setStore`, and registers `controlSpecs` in it. Renders
 * nothing itself.
 */
// @ts-ignore
function RenewStore({ controlSpecs, setStore }) {
    const store = useCreateStore();
    useEffect(() => {
        setStore(store);
    }, [setStore, store]);
    // Explicit deps ([controlSpecs], deep-compared by leva) instead of the 2-arg form: without
    // a deps array, leva never notices that controlSpecs changed content on later renders, so
    // schema edits made after startup (e.g. a slider's range being widened) would never reach
    // the store, since this component is not remounted.
    useControls(controlSpecs, { store }, [controlSpecs]);
    return <></>;
}

/**
 * Props for {@link ControlPanel}.
 * @internal
 */
export type ControlPanelProps = {
    appState:AAppState;
}


/**
 * React component that shows the app's control panel (a leva panel) built from `appState.GUIControlSpecs`. It
 * re-renders whenever the app state signals a control panel update, keeping each control's current value. Add
 * controls to the app state in `initAppState`.
 */
export function ControlPanel(props:ControlPanelProps) {
    // let standardControls = AAppState.GetAppState().getControlPanelStandardSpec();
    const [store, setStore] = useState(levaStore);
    const state = useSnapshot(props.appState.stateValues);
    // const selectionModelState = useSnapshot(appState.selectionModel.state);

    // Reading (without using) _guiKey is what makes this component re-render on every
    // updateControlPanel() call -- useSnapshot only subscribes to stateValues properties
    // actually accessed during render. Deliberately NOT passed to RenewStore as a `key`:
    // changing a key remounts the component, which recreates leva's store from scratch
    // (useCreateStore() is memoized per instance) and discards every control's live value.
    // A plain re-render is sufficient -- RenewStore's own useControls call picks up schema
    // changes via its explicit deps array (see RenewStore) without needing to be torn down.
    void state[AAppState._GUI_KEY_INDEX];

    // Registering this listener in the render body (as opposed to a useEffect) would add a
    // brand-new, never-removed listener on every re-render, compounding into ever more
    // duplicate re-renders each time _guiKey is bumped. Register (and clean up) it once instead.
    useEffect(() => {
        const listener = props.appState.addControlPanelListener(() => {
            props.appState._guiKey = uuidv4();
        });
        return () => listener.deactivate();
    }, [props.appState]);

    // Keep AAppState pointed at whichever store is actually backing the panel right now,
    // so AAppState.updateControlPanelValue(name) has something live to push a value into. `store`
    // starts as the placeholder `levaStore` and is swapped for RenewStore's own store
    // shortly after mount (see RenewStore's setStore effect above).
    useEffect(() => {
        props.appState._setControlPanelStore(store);
    }, [store, props.appState]);

    return (
        <>
            <LevaPanel store={store} />
            <RenewStore
                controlSpecs={props.appState.GUIControlSpecs}
                setStore={setStore}
            />
        </>
    );
}

//
// export function ControlPanel(props:ControlPanelProps){
//
//     let standardControls = AAppState.GetAppState().getControlPanelStandardSpec();
//     const [store, setStore] = useState(levaStore);
//     const state = useSnapshot(appState.state);
//
//     const [state, setState] = useState(uuidv4());
//     appState.addControlPanelListener(()=>{
//         // setState(uuidv4());
//         setState(`${Object.keys(appState.GUIControlSpecs)}`);
//     })
//     useControls(props.appState.GUIControlSpecs);
//     return(
//         <>
//             <LevaPanel store={store} />
//             <RenewStore
//                 key={state._guiKey}
//                 controlSpecs={{
//                     ...standardControls,
//                     ModelGUI: folder({
//                         ...appState.selectionModel.getModelGUIControlSpecs(),
//                     }),
//                 }}
//                 setStore={setStore}
//             />
//         </>
//     )
// }
