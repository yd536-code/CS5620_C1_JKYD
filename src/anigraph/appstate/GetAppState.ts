import {GetAAppState} from "./AAppState";
import {AppState} from "./AppState";

/** Returns the app's global {@link AppState} (throws if it hasn't been created yet). */
export function GetAppState(){
    return GetAAppState() as AppState;
}
