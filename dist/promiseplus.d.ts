/**
 * promiseplus
 *
 * @description Enhanced Promises featuring timeouts, cancellation.
 *
 * @author jasmith79
 * @copyright 2018
 * @license MIT
 */
/**
 * @description A lazy-initialized Promise with added capabilities like
 * timeouts and cancellation. Calls the function passed to the
 * constructor only once .then, .catch, or .finally have been called.
 *
 * @param callback the function that recieves the resolve and reject parameters.
 * @param timeout the amount of time in milliseconds to wait before automatically
 * rejecting. Readonly. Optional.
 */
export declare class LazyPromisePlus<T> implements PromiseLike<T> {
    protected callback: (resolve: (value?: {} | PromiseLike<{}> | undefined) => void, reject: (reason?: any) => void) => void;
    readonly timeout?: number | undefined;
    /**
     * @description Wraps the passed in value as a LazyPromisePlus. Has the auto-flattening
     * semantics for Promises, LazyPromisePlusses, and PromisePlusses. **NOTE:** unlike
     * calling the constructor directly, since there is no callback to delay the underlying
     * Promise is immediately constructed.
     *
     * @param value The value to wrap.
     * @returns A LazyPromisePlus of the value.
     */
    static of<T>(value?: T): LazyPromisePlus<{}>;
    /**
     * @description Alias for LazyPromisePlus.of.
     * @alias LazyPromisePlus.of
     */
    static resolve<T>(value?: T): LazyPromisePlus<{}>;
    /**
     * @description Immediately rejects a LazyPromisePlus with the provided Error or
     * an Error constructed from the provided message (empty string if null).
     *
     * @param reason The desired rejection message/error.
     * @returns A LazyPromisePlus rejected with the error.
     */
    static reject(reason?: Error | string | null): LazyPromisePlus<{}>;
    /**
     * @description Waits for ms milliseconds before resolving.
     *
     * @param ms The amount of time to wait before resolving in milliseconds.
     * @returns LazyPromisePlus<void>
     */
    static sleep(ms: number): LazyPromisePlus<void>;
    protected cancelled: boolean;
    protected completed: boolean;
    protected promise: Promise<T> | null;
    protected error: Error | null;
    protected rejector: ((reason?: any) => void) | null;
    constructor(callback: (resolve: (value?: {} | PromiseLike<{}> | undefined) => void, reject: (reason?: any) => void) => void, timeout?: number | undefined);
    /**
     * @description Initializes the LazyPromisePlus, calls the callback passed to the
     * constructor and builds the underlying Promise.
     *
     * @returns This.
     */
    protected init(): this;
    readonly isCancelled: boolean;
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
    cancel(reason?: string | Error | null, legacy?: Error | null): this;
    /**
     * @description Just like Promise.prototype.then, but will
     * call the init function lo initialize the LazyPromisePlus.
     *
     * @param success Handler function, called when the Promise resolves.
     * @param fail Handler function, called when the Promise rejects.
     * @returns
     */
    then<R>(success: (result: T) => R, fail?: (reason: any) => any): LazyPromisePlus<{}>;
    /**
     * @description Just like Promise.prototype.catch, but will
     * call the init function lo initialize the LazyPromisePlus.
     *
     * @param fail Handler function, called when the Promise rejects.
     * @returns
     */
    catch(fail: (reason: any) => void): LazyPromisePlus<T | Error | null>;
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
    finally(callback: () => void): LazyPromisePlus<{}>;
    /**
     * @description Will return the underlying Promise object. An escape hatch in case an API
     * requires an actual Promise (e.g. verfied via instanceof) rather than a generic thenable.
     * If the LazyPromisePlus has not been initialized, this method will call init.
     *
     * @returns The underlying Promise object.
     */
    toPromise(): Promise<T>;
}
/**
 * @description A Thenable with added capabilities like
 * timeouts and cancellation.
 *
 * @param callback the function that recieves the resolve and reject parameters.
 * @param timeout the amount of time in milliseconds to wait before automatically
 * rejecting. Readonly. Optional.
 */
export declare class PromisePlus<T> extends LazyPromisePlus<T> {
    protected callback: (resolve: (value?: {} | PromiseLike<{}> | undefined) => void, reject: (reason?: any) => void) => void;
    readonly timeout?: number | undefined;
    constructor(callback: (resolve: (value?: {} | PromiseLike<{}> | undefined) => void, reject: (reason?: any) => void) => void, timeout?: number | undefined);
    /**
     * @description Wraps the passed in value as a PromisePlus. Has the auto-flattening
     * semantics for Promises, LazyPromisePlusses, and PromisePlusses.
     *
     * @param value The value to wrap.
     * @returns A LazyPromisePlus of the value.
     */
    static of<T>(value?: T): PromisePlus<{}>;
    /**
     * @description Alias for PromisePlus.of.
     * @alias PromisePlus.of
     */
    static resolve<T>(value?: T): PromisePlus<{}>;
    /**
     * @description Immediately rejects a PromisePlus with the provided Error or
     * an Error constructed from the provided message (empty string if null).
     *
     * @param reason The desired rejection message/error.
     * @returns A PromisePlus rejected with the error.
     */
    static reject(reason?: Error | string | null): PromisePlus<{}>;
    /**
     * @description Waits for ms milliseconds before resolving.
     *
     * @param ms The amount of time to wait before resolving in milliseconds.
     * @returns LazyPromisePlus<void>
     */
    static sleep(ms: number): PromisePlus<void>;
}
