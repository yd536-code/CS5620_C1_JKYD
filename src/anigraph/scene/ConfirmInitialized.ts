import {Mutex} from "async-mutex";

/** Something that initializes itself asynchronously, once, when `confirmInitialized()` is first called. */
export interface ConfirmInitialized{
    /** Mutex used to make sure initialization runs only once. */
    get initMutex():Mutex;
    /** Runs initialization if it hasn't run yet. */
    confirmInitialized():Promise<void>;
}

