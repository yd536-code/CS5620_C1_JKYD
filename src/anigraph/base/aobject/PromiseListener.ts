/**
 * Wraps a promise so you can check synchronously whether it is still pending, fulfilled, or rejected
 * (`_pending`, `_fulfilled`, `_rejected`).
 */
export class PromiseListener<T> {
  /** The wrapped promise. */
  _promise: Promise<T>;
  /** True until the promise settles. */
  _pending: boolean = true;
  /** True once the promise has been rejected. */
  _rejected: boolean = false;
  /** True once the promise has been fulfilled. */
  _fulfilled: boolean = false;
  /** A promise that settles the same way as `_promise`, after the flags above have been updated. */
  _result: Promise<any>;
  constructor(promise: Promise<T>) {
    this._promise = promise;
    const self = this;
    this._result = promise.then(
      function (v: T) {
        self._fulfilled = true;
        self._pending = false;
        return v;
      },
      function (e) {
        self._rejected = true;
        self._pending = false;
        throw e;
      }
    );
  }
}
