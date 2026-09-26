



/**
 * Something that can be scaled by a number and added to or subtracted from another value of the same type (e.g.,
 * so it can be interpolated). Each operation returns a new value.
 * @typeParam T The type of value returned by the operations (usually the implementing class).
 */
export interface HasLinearOperations<T>{
    /** Returns this value scaled by `factor`. */
    times(factor:number):T,
    /** Returns this value plus `other`. */
    plus(other:T):T,
    /** Returns this value minus `other`. */
    minus(other:T):T,
}


