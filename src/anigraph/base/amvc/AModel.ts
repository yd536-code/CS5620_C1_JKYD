import {ASerializable} from "../aserial";
// import {ACallbackSwitch} from "../aevents";
import {AObjectNode} from "../aobject";

/** The members of a model that model/view bookkeeping code relies on. */
export interface AModelInterface extends AObjectNode {
    uid: string;
    name: string;
    parent: AObjectNode | null;
    serializationLabel: string;
    // addEventListener(eventName:string, callback:(...args:any[])=>void, handle?:string):ACallbackSwitch;
}

export enum AModelEvents {
    RELEASE = 'RELEASE'
}

/**
 * Base class for models in AniGraph's model-view-controller design. A model holds the data (state) for something
 * in the scene; views listen to it and draw it. Models form a tree through {@link AObjectNode}.
 */
@ASerializable("AModel")
export abstract class AModel extends AObjectNode implements AModelInterface {
    /** Events signaled by models. `RELEASE` is signaled by `release()`. */
    static AModelEvents = AModelEvents;

    /** Whether this model is the root of a scene's model graph (false here; `AModelGraph` returns true). */
    get isSceneGraphRoot(){
        return false;
    }

    /** Releases the model (see {@link AObjectNode.release}), then signals `AModelEvents.RELEASE`. */
    release() {
        super.release();
        this.signalEvent(AModel.AModelEvents.RELEASE);
    }
}
