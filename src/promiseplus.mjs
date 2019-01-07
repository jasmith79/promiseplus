
const identity = x => x;
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


const addCancellationSubscriber = (parent, child) => {
  const arr = cancellations.get(parent) || [];
  cancellations.set(parent, arr);
};

class LazyPromisePlus {
  constructor (cb, timeout=0) {
    this._cancelled = false;
    this._timeout = timeout;
    this._callback = cb;
    this._promise = null;
    this._error = null;
    this._rejector = function(){};
    this._completed = false;
    this._rejector = null;
  }

  of (arg, timeout) {
    return LazyPromisePlus.of(arg, timeout);
  }

  get cancelled () {
    const parent = cancellations.get(this);
    return this._cancelled || Boolean(parent && parent.cancelled);
  }

  set cancelled (arg) {
    this._cancelled = Boolean(arg);
  }

  _init () {
    if (!this._promise && !this.cancelled) {
      const p = this._callback ? new Promise(this._callback) : Promise.resolve();
      this._promise = new Promise((res, rej) => {
        this._rejector = rej;
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
            if (this.cancelled) rej(this._error);
            res(success);
          },

          fail => {
            if (this.cancelled) rej(this._error);
            rej(fail);
          }
        );
      });
    }

    return this._promise;
  }

  then (success, fail) {
    if (this.cancelled) return this._promise.catch(fail);
    const p = LazyPromisePlus.of(this._init().then(result => {
      this._completed = true;
      return success(result);
    }));

    addCancellationSubscriber(this, p);
    return fail ? p.catch(fail) : p;
  }

  catch (fail) {
    if (this.cancelled) return this._promise.catch(fail);
    const p = LazyPromisePlus.of(this._init().catch(err => {
      this._completed = true;
      return fail(err);
    }));

    addCancellationSubscriber(this, p);
    return p;
  }

  cancel (message, err) {
    if (!this._completed) {
      this._completed = true;
      this.cancelled = true;

      // Here we'll want to preserve the cancellation stack for debugging.
      const msg = message ? ` with reason: ${message}` : '';
      this._error = err || new Error(`Cancelled Promise ${msg}`);

      // propagate cancellations
      const arr = cancellations.get(this) || [];
      arr.forEach(p => {
        p.cancel(msg, this._error);
      });

      // The LazyP may not have been initialized
      if (this._promise) {
        this._rejector(this._error);
      } else {
        this._promise = Promise.reject(this._error);
      }
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

LazyPromisePlus.every = ps => {
  return Promise.all(ps.map(p => p.then(identity, identity)));
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
