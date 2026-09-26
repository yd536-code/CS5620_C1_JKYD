import {AObject} from "../base/aobject";
import objectHash from "object-hash";

/**
 * A fake interactive element for tests, with `on`/`off`/`once` methods backed by `AObject` events. Listeners are
 * identified by a hash of `(type, fn)`.
 */
export class AMockInteractiveElement extends AObject{
    on(type:string, fn:(...args:any[])=>void) {
        let hash = objectHash({type:type,fn:fn});
        this.addEventListener(type, fn, hash);
    }
    off(type:string, fn:(...args:any[])=>void) {
        let hash = objectHash({type:type,fn:fn});
        this.removeEventListener(type, hash);
    };
    once(type:string, fn:(...args:any[])=>void) {
        let hash = objectHash({type:type,fn:fn});
        this.addOneTimeEventListener(type, fn, hash);
    };
}
