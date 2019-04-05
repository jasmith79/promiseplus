/**
 * promiseplus
 *
 * @author jasmith79
 * @copyright 2018
 * @license MIT
 */

const cancellations = new WeakMap();

const addCancellationSubscriber = <X, Y>(parent: PromiseLike<X>, child: PromiseLike<Y>): void => {
  cancellations.set(child, parent);
};

/**
 * @description A lazy-initialized Promise with added capabilities like
 * timeouts and cancellation. Calls the function passed to the
 * constructor only once .then, .catch, or .finally have been called.
 *
 * @param callback the function that recieves the resolve and reject parameters.
 * @param timeout the amount of time in milliseconds to wait before automatically
 * rejecting. Readonly. Optional.
 */
export class LazyPromisePlus<T> implements PromiseLike<T> {

  /**
   * @description Wraps the passed in value as a LazyPromisePlus. Has the auto-flattening
   * semantics for Promises, LazyPromisePlusses, and PromisePlusses. **NOTE:** unlike
   * calling the constructor directly, since there is no callback to delay the underlying
   * Promise is immediately constructed.
   *
   * @param value The value to wrap.
   * @returns A LazyPromisePlus of the value.
   */
  public static of<T>(value?: T) {
    return new LazyPromisePlus((resolve) => resolve(value));
  }

  /**
   * @description Alias for LazyPromisePlus.of.
   * @alias LazyPromisePlus.of
   */
  public static resolve<T>(value?: T) {
    return LazyPromisePlus.of(value);
  }

  /**
   * @description Immediately rejects a LazyPromisePlus with the provided Error or
   * an Error constructed from the provided message (empty string if null).
   *
   * @param reason The desired rejection message/error.
   * @returns A LazyPromisePlus rejected with the error.
   */
  public static reject(reason?: Error | string | null) {
    const error = reason instanceof Error
      ? reason
      : new Error(reason || '');

    return new LazyPromisePlus((resolve, reject) => {
      reject(error);
    }).init();
  }

  protected cancelled: boolean = false;
  protected completed: boolean = false;
  protected promise: Promise<T> | null = null;
  protected error: Error | null = null;
  protected rejector: ((reason?: any) => void) | null = null;

  constructor(
    protected callback: (
      resolve: (value?: {} | PromiseLike<{}> | undefined) => void,
      reject: (reason?: any) => void,
    ) => void,
    readonly timeout?: number,
  ) {}

  /**
   * @description Initializes the LazyPromisePlus, calls the callback passed to the
   * constructor and builds the underlying Promise.
   *
   * @returns This.
   */
  protected init(): this {
    if (!this.promise && !this.isCancelled) {
      const p = new Promise(this.callback);

      // Yes, yes, anti-pattern, I know. No clean way to do this AFAIK.
      // Since cancellation needs to be able to reject the promise from the
      // outside, need to use the constructor here to get access to that
      // parameter rather than simply chaining .then or throwing.
      this.promise = new Promise((res, rej) => {
        this.rejector = rej;
        if (this.timeout) {
          setTimeout(
            rej.bind(
              null,
              new Error(`Promise reached timeout of ${this.timeout} milliseconds.`),
            ),
            this.timeout,
          );
        }

        p.then(
          (success) => {
            this.completed = true;
            if (this.isCancelled) {
              rej(this.error);
            }
            res((success as T));
          },

          (fail) => {
            // Previous errors like cancellation take precedence.
            if (!this.error) {
              this.completed = true;
              this.error = fail;
            }
            rej(this.error);
          },
        );
      });
    }

    // Surprised the compiler can't infer that this can't be null
    return this;
  }

  get isCancelled(): boolean {
    const parent = cancellations.get(this);
    return this.cancelled || Boolean(parent && parent.isCancelled);
  }

  /**
   * @description Cancels a pending PromsiePlus. If the Promise has already
   * settled it's a noop. The Promise will immediately reject with the supplied
   * Error instance or an Error created with the supplied message.
   * NOTE: Cancellation will propagate *down* the Promise chain but not up.
   * So if you have:
   * const p1 = new LazyPromisePlus((res) => fetch('/some/slow/responding/url'));
   * const p2 = p1.catch(console.error);
   * p1.cancel('No Thanks');
   * Then 'No Thanks' will log to the console as an error.
   *
   * @param reason The user-supplied reason for cancelling. Optional.
   * @param legacy This is solely here for backwards compatibility with
   * an older version of the API.
   * @returns this.
   */
  public cancel(reason?: string | Error | null, legacy?: Error | null): this {
    if (!this.completed) {
      this.cancelled = true;
      this.completed = true;
      this.error = reason instanceof Error
        ? reason
        : legacy instanceof Error
          ? legacy
          : new Error(reason || 'Cancelled PromisePlus.');

      // Propagate the cancellation downwards
      // TODO: fix type on forEach callback parameter.
      const promiseChain = cancellations.get(this) || [];
      promiseChain.forEach((p: any) => {
        (p as LazyPromisePlus<any>).cancel('' + this.error, this.error);
      });

      // May not have been initialized
      if (this.promise) {
        // If it has been though then it will have a rejector,
        // this cannot be null but the compiler can't infer
        // that so...
        (this.rejector as (reason?: any) => void)(this.error);
      } else {
        this.promise = Promise.reject(this.error);
      }
    }

    return this;
  }

  /**
   * @description Just like Promise.prototype.then, but will
   * call the init function lo initialize the LazyPromisePlus.
   *
   * @param success Handler function, called when the Promise resolves.
   * @param fail Handler function, called when the Promise rejects.
   * @returns
   */
  public then<R>(
    success: (result: T) => R,
    fail?: (reason: any) => any,
  ) {
    if (this.isCancelled) {
      return this.promise
        ? LazyPromisePlus.of(this.promise.catch(fail))
        : LazyPromisePlus.reject(new Error('Cancelled uninitialized LazyPromisePlus'));
    }

    this.init();
    const p = this.promise
      ? LazyPromisePlus.of(this.promise.then(success, fail))
      : LazyPromisePlus.resolve();

    addCancellationSubscriber(this, p);
    return p;
  }

  /**
   * @description Just like Promise.prototype.catch, but will
   * call the init function lo initialize the LazyPromisePlus.
   *
   * @param fail Handler function, called when the Promise rejects.
   * @returns
   */
  public catch(fail: (reason: any) => void): LazyPromisePlus<T | Error | null> {
    if (this.isCancelled) {
      return (LazyPromisePlus.of(this.error) as LazyPromisePlus<Error | null>);
    }

    this.init();
    const p = LazyPromisePlus.of((this.promise as Promise<T>).catch(fail));

    addCancellationSubscriber((this as LazyPromisePlus<T>), p);
    return (p as LazyPromisePlus<T>);
  }

  /**
   * @description Just like Promise.prototype.finally, but will
   * call the init function lo initialize the LazyPromisePlus. If the underlying
   * Promise doesn't yet implement .finally, this method will mimic the proper
   * semantics with .then.
   *
   * @param callback Will be called when the Promise settles, although it returns a new
   * LazyPromisePlus, it will have the value of the settled Promise it chains off of.
   * @returns LazyPromisePlus.
   */
  public finally(callback: () => void) {
    this.init();

    // this.promise cannot be null here, but the compiler can't infer.
    if (this.promise && 'finally' in this.promise) {
      const cb = (value: T | Error) => {
        callback();
        return value;
      };
      return LazyPromisePlus.of(this.promise.then(cb, cb));
    } else if (this.promise) {
      return LazyPromisePlus.of((this.promise as Promise<T>).finally(callback));
    } else {
      return LazyPromisePlus.of(void 0);
    }
  }

  /**
   * @description Will return the underlying Promise object. An escape hatch in case an API
   * requires an actual Promise (e.g. verfied via instanceof) rather than a generic thenable.
   * If the LazyPromisePlus has not been initialized, this method will call init.
   *
   * @returns The underlying Promise object.
   */
  public toPromise(): Promise<T> {
    return this.promise || (this.init().promise as Promise<T>);
  }
}

/**
 * @description A Thenable with added capabilities like
 * timeouts and cancellation.
 *
 * @param callback the function that recieves the resolve and reject parameters.
 * @param timeout the amount of time in milliseconds to wait before automatically
 * rejecting. Readonly. Optional.
 */
export class PromisePlus<T> extends LazyPromisePlus<T> {
  constructor(
    protected callback: (
      resolve: (value?: {} | PromiseLike<{}> | undefined) => void,
      reject: (reason?: any) => void,
    ) => void,
    readonly timeout?: number,
  ) {
    super(callback, timeout);
    this.init();
  }

  /**
   * @description Wraps the passed in value as a PromisePlus. Has the auto-flattening
   * semantics for Promises, LazyPromisePlusses, and PromisePlusses.
   *
   * @param value The value to wrap.
   * @returns A LazyPromisePlus of the value.
   */
  public static of<T>(value?: T) {
    return new PromisePlus((resolve) => resolve(value));
  }

  /**
   * @description Alias for PromisePlus.of.
   * @alias PromisePlus.of
   */
  public static resolve<T>(value?: T) {
    return PromisePlus.of(value);
  }

  /**
   * @description Immediately rejects a PromisePlus with the provided Error or
   * an Error constructed from the provided message (empty string if null).
   *
   * @param reason The desired rejection message/error.
   * @returns A PromisePlus rejected with the error.
   */
  public static reject(reason?: Error | string | null) {
    const error = reason instanceof Error
      ? reason
      : new Error(reason || '');

    return new PromisePlus((resolve, reject) => {
      reject(error);
    });
  }
}
