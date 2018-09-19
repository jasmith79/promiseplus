
const cancellations = new WeakMap();

class CancellationError extends Error {
  constructor (message) {
    super(message);

    // Following is necessary to maintain instanceof accuracy after transpilation
    this.constructor = CancellationError;
    this.__proto__ = CancellationError.prototype;
    this.message = message;
  }
}

class LazyPromisePlus {
  constructor (cb, timeout=0) {
    this._cancelled = false;
    this._timeout = timeout;
    this._callback = cb;
    this._promise = null;
    this._cancellationError = null;
    this._rejector = function(){};
    this._completed = false;
  }

  of (arg, timeout) {
    return LazyPromisePlus.of(arg, timeout);
  }

  get cancelled () {
    const parent = cancellations.get(this);
    return this._cancelled || (parent && parent.cancelled);
  }

  set cancelled (arg) {
    this._cancelled = Boolean(arg);
  }

  _init () {
    if (!this._promise && !this.cancelled) {
      const p = this._callback ? new Promise(this._callback) : Promise.resolve();
      this._rejector =
      this._promise = new Promise((res, rej) => {
        if (this._timeout) {
          setTimeout(
            rej.bind(
              null,
              new Error(`Promise reached timeout of ${this._timeout} milliseconds.`)
            ),
            this._timeout
          );
        }

        // Yes, yes, anti-pattern blah, blah. No clean way to do this AFAIK.
        p.then(
          success => {
            if (this.cancelled) rej(this._cancellationError);
            res(success);
          },

          fail => {
            if (this.cancelled) rej(this._cancellationError);
            rej(fail);
          }
        );
      });
    }

    return this._promise;
  }

  then (success, fail) {
    if (this.cancelled) return this._promise.catch(fail);
    const p = LazyPromisePlus.of(this._init().then(
      result => {
        console.log('Completing');
        this._completed = true;
        return success(result);
      },
      err => {
        console.log('Completing');
        this._completed = true;
        return fail(err);
      }
    ));

    cancellations.set(p, this);
    return p;
  }

  catch (fail) {
    if (this.cancelled) return this._promise.catch(fail);
    const p = LazyPromisePlus.of(this._init().catch(err => {
      this._completed = true;
      return fail(err);
    }));

    cancellations.set(p, this);
    return p;
  }

  cancel (message) {
    console.log('Cancelling');
    if (!this._completed) {
      this.cancelled = true;

      const msg = message ? ` with reason: ${message}` : '';
      // Here we'll want to preserve the cancellation stack for debugging.
      this._cancellationError = new CancellationError(`Cancelled Promise ${msg}`);
      this._promise = Promise.reject(this._cancellationError);
    }
    return this;
  }

  finally (cb) {
    const p = this._init();
    return p.finally ? p.finally(cb) : p.then(cb, cb);
  }

  toPromise () {
    return this._init();
  }
}

// Class methods
LazyPromisePlus.of = (arg, timeout) => {
  let p = null;
  if (arg && arg.then) p = arg;
  if (typeof arg === 'function') p = new Promise(arg);

  if (p === null) {
    throw new TypeError(`Cannot convert argument to LazyPromisePlus.`);
  }

  return new LazyPromisePlus((resolve, reject) => {
    p.then(resolve, reject);
  }, timeout);
};

LazyPromisePlus.resolve = Promise.resolve;
LazyPromisePlus.reject = Promise.reject;

class PromisePlus extends LazyPromisePlus {
  constructor (cb, timeout) {
    super(cb, timeout);
    this._init();
  }
}

export {
  PromisePlus,
  LazyPromisePlus,
};

export default PromisePlus;