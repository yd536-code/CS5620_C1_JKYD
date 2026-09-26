import {AObject} from "../base/aobject/AObject";
import {ASerializable} from "../base/aserial/ASerializable";
import {HasLinearOperations} from "../math/linalg/HasLinearOperations";
import {BezierTween} from "../geometry/BezierTween";




/**
 * Base class for values that move from `startValue` to `endValue` between `startTime` and `endTime`. `V` can be
 * any type with linear operations (`plus`, `minus`, `times`), such as a vector or color.
 */
@ASerializable("ATimeInterpolationBase")
export abstract class ATimeInterpolationBase<V extends HasLinearOperations<any>> extends AObject{
    /** Constructor arguments are ignored; `tween` starts out linear. */
    constructor(...args:any[]) {
        super();
        this.tween = BezierTween.Linear;

    }
    /** Start and end time */
    abstract get startTime():number;
    abstract get endTime():number;

    /** Start and end values */
    abstract startValue:V;
    abstract endValue:V;

    /** Easing curve applied to the progress between start and end. */
    tween!:BezierTween;

    /**
     * Returns `startValue + (endValue - startValue) * tween.eval(x)`, where `x = (t - startTime) / (endTime -
     * startTime)`. `x` is not clamped to [0, 1].
     */
    getValueForTime(t:number):V{
        let x = (t-this.startTime)/(this.endTime-this.startTime);
        let y = this.tween.eval(x);
        return this.startValue.plus(this.endValue.minus(this.startValue).times(y));
    }
}


/** An {@link ATimeInterpolationBase} with fixed start and end values stored in `_startValue`/`_endValue`. */
@ASerializable("Tween")
export abstract class Tween<V extends HasLinearOperations<any>> extends ATimeInterpolationBase<V>{
    protected _startValue!:V;
    get startValue(){
        return this._startValue;
    }
    protected _endValue!:V;
    get endValue(){
        return this._endValue;
    }
}


export enum TimeFilterType{
    HAS_START="HAS_START",
    HAS_END="HAS_END"
}



/**
 * Smoothly follows a target value over time. `setTarget(v)` sets the value to move toward, and each
 * `updateFilter(t)` moves the current value (`startValue`) toward the target, as if it would reach it `latency`
 * time units after the last update. Start and end values can be stored directly or read/written through accessor
 * functions (e.g. to drive a model's property).
 */
@ASerializable("ATimeFilter")
export class ATimeFilter<V extends HasLinearOperations<any>> extends ATimeInterpolationBase<V>{
    static FilterTypes=TimeFilterType;
    // filterType:TimeFilterType=TimeFilterType.HAS_START;


    /** Time of the last `updateFilter` call. */
    lastTimeUpdated:number=0;
    /** How long after an update the value would reach the target. Set by the constructor (default 1). */
    latency:number=1;


    get startTime(): number {
        return this.lastTimeUpdated;
    }
    get endTime():number{
        return this.lastTimeUpdated+this.latency;
    }

    /** Sets the target value (`endValue`) to move toward. */
    setTarget(v:V){
        this.endValue=v;
    }

    /**
     * @param latency how long after an update the value would reach the target (see the `latency` field)
     */
    constructor(
        latency:number=1,
        ...args:any[]
    ) {
        super(0,latency);
        // Field initializers (like `latency = 1` above) run after `super()`, so set it here, after them.
        this.latency = latency;
    }

    /**
     * Makes `startValue` read and write through `getter`/`setter` instead of a stored value. Throws if a start value
     * was already stored.
     */
    setStartValueAccessor(getter:()=>V,setter:(v:V)=>void){
        if(this._startValue!==undefined){throw new Error("Cant set start value accessor when start value already set")}
        this._getStartValue=getter;
        this._setStartValue=setter;
    }
    /** Like `setStartValueAccessor`, for `endValue`. */
    setEndValueAccessor(getter:()=>V,setter:(v:V)=>void){
        if(this._endValue!==undefined){throw new Error("Cant set end value accessor when end value already set")}
        this._getEndValue=getter;
        this._setEndValue=setter;
    }

    /** Stores a start value. Throws if a start value accessor is set. */
    setStartValue(v:V){
        if(this._setStartValue!==undefined){throw new Error("Cant set start value when accessor already set")}
        this._startValue=v;
    }
    /** Stores an end value. Throws if an end value accessor is set. */
    setEndValue(v:V){
        if(this._setEndValue!==undefined){throw new Error("Cant set end value when accessor already set")}
        this._endValue=v;
    }

    _startValue:V|undefined=undefined;
    _getStartValue:(()=>V)|undefined=undefined;
    _setStartValue:((v:V)=>void)|undefined=undefined;

    _endValue:V|undefined=undefined;
    _getEndValue:(()=>V)|undefined=undefined;
    _setEndValue:((v:V)=>void)|undefined=undefined;


    /** The current value: read through the accessor if one is set, else the stored value. Throws if neither is set. */
    get startValue(){
        if(this._getStartValue!==undefined){
            return this._getStartValue();
        }else if(this._startValue){
            return this._startValue;
        }else{
            throw new Error("Start value not specified")
        }
    }
    set startValue(v:V){
        if(this._setStartValue !== undefined){
            this._setStartValue(v);
        }else {
            this._startValue = v;
        }
    }

    /** The target value: read through the accessor if one is set, else the stored value. Throws if neither is set. */
    get endValue(){
        if(this._getEndValue!==undefined){
            return this._getEndValue();
        }else if(this._endValue){
            return this._endValue;
        }else{
            throw new Error("End value not specified")
        }
    }
    set endValue(v:V){
        if(this._setEndValue !== undefined){
            this._setEndValue(v);
        }else {
            this._endValue = v;
        }
    }

    /**
     * Moves the current value toward the target: sets `startValue` to `getValueForTime(t)` (using the previous
     * update time as the start) and records `t` as the new update time. Call it once per frame with the current time.
     */
    updateFilter(t:number){
        let v = this.getValueForTime(t);
        this.startValue=v;
        this.lastTimeUpdated=t;
    }
}




