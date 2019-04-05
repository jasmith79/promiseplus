"use strict";

(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.undefined = mod.exports;
  }
})(void 0, function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function _typeof(obj) {
        return typeof obj;
      };
    } else {
      _typeof = function _typeof(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (_typeof(call) === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  /**
   * promiseplus
   *
   * @author jasmith79
   * @copyright 2018
   * @license MIT
   */
  var cancellations = new WeakMap();

  var addCancellationSubscriber = function addCancellationSubscriber(parent, child) {
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


  var LazyPromisePlus = exports.LazyPromisePlus = function () {
    _createClass(LazyPromisePlus, null, [{
      key: "of",

      /**
       * @description Wraps the passed in value as a LazyPromisePlus. Has the auto-flattening
       * semantics for Promises, LazyPromisePlusses, and PromisePlusses. **NOTE:** unlike
       * calling the constructor directly, since there is no callback to delay the underlying
       * Promise is immediately constructed.
       *
       * @param value The value to wrap.
       * @returns A LazyPromisePlus of the value.
       */
      value: function of(value) {
        return new LazyPromisePlus(function (resolve) {
          return resolve(value);
        });
      }
      /**
       * @description Alias for LazyPromisePlus.of.
       * @alias LazyPromisePlus.of
       */

    }, {
      key: "resolve",
      value: function resolve(value) {
        return LazyPromisePlus.of(value);
      }
      /**
       * @description Immediately rejects a LazyPromisePlus with the provided Error or
       * an Error constructed from the provided message (empty string if null).
       *
       * @param reason The desired rejection message/error.
       * @returns A LazyPromisePlus rejected with the error.
       */

    }, {
      key: "reject",
      value: function reject(reason) {
        var error = reason instanceof Error ? reason : new Error(reason || '');
        return new LazyPromisePlus(function (resolve, reject) {
          reject(error);
        }).init();
      }
    }]);

    function LazyPromisePlus(callback, timeout) {
      _classCallCheck(this, LazyPromisePlus);

      this.callback = callback;
      this.timeout = timeout;

      _defineProperty(this, "cancelled", false);

      _defineProperty(this, "completed", false);

      _defineProperty(this, "promise", null);

      _defineProperty(this, "error", null);

      _defineProperty(this, "rejector", null);
    }
    /**
     * @description Initializes the LazyPromisePlus, calls the callback passed to the
     * constructor and builds the underlying Promise.
     *
     * @returns This.
     */


    _createClass(LazyPromisePlus, [{
      key: "init",
      value: function init() {
        var _this = this;

        if (!this.promise && !this.isCancelled) {
          var p = new Promise(this.callback); // Yes, yes, anti-pattern, I know. No clean way to do this AFAIK.
          // Since cancellation needs to be able to reject the promise from the
          // outside, need to use the constructor here to get access to that
          // parameter rather than simply chaining .then or throwing.

          this.promise = new Promise(function (res, rej) {
            _this.rejector = rej;

            if (_this.timeout) {
              setTimeout(rej.bind(null, new Error("Promise reached timeout of ".concat(_this.timeout, " milliseconds."))), _this.timeout);
            }

            p.then(function (success) {
              _this.completed = true;

              if (_this.isCancelled) {
                rej(_this.error);
              }

              res(success);
            }, function (fail) {
              // Previous errors like cancellation take precedence.
              if (!_this.error) {
                _this.completed = true;
                _this.error = fail;
              }

              rej(_this.error);
            });
          });
        } // Surprised the compiler can't infer that this can't be null


        return this;
      }
    }, {
      key: "cancel",

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
      value: function cancel(reason, legacy) {
        var _this2 = this;

        if (!this.completed) {
          this.cancelled = true;
          this.completed = true;
          this.error = reason instanceof Error ? reason : legacy instanceof Error ? legacy : new Error(reason || 'Cancelled PromisePlus.'); // Propagate the cancellation downwards
          // TODO: fix type on forEach callback parameter.

          var promiseChain = cancellations.get(this) || [];
          promiseChain.forEach(function (p) {
            p.cancel('' + _this2.error, _this2.error);
          }); // May not have been initialized

          if (this.promise) {
            // If it has been though then it will have a rejector,
            // this cannot be null but the compiler can't infer
            this.rejector(this.error);
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

    }, {
      key: "then",
      value: function then(success, fail) {
        if (this.isCancelled) {
          return this.promise ? LazyPromisePlus.of(this.promise.catch(fail)) : LazyPromisePlus.reject(new Error('Cancelled uninitialized LazyPromisePlus'));
        }

        this.init();
        var p = this.promise ? LazyPromisePlus.of(this.promise.then(success, fail)) : LazyPromisePlus.resolve();
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

    }, {
      key: "catch",
      value: function _catch(fail) {
        if (this.isCancelled) {
          return LazyPromisePlus.of(this.error);
        }

        this.init();
        var p = LazyPromisePlus.of(this.promise.catch(fail));
        addCancellationSubscriber(this, p);
        return p;
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

    }, {
      key: "finally",
      value: function _finally(callback) {
        this.init(); // this.promise cannot be null here, but the compiler can't infer.

        if (this.promise && 'finally' in this.promise) {
          var cb = function cb(value) {
            callback();
            return value;
          };

          return LazyPromisePlus.of(this.promise.then(cb, cb));
        } else if (this.promise) {
          return LazyPromisePlus.of(this.promise.finally(callback));
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

    }, {
      key: "toPromise",
      value: function toPromise() {
        return this.promise || this.init().promise;
      }
    }, {
      key: "isCancelled",
      get: function get() {
        var parent = cancellations.get(this);
        return this.cancelled || Boolean(parent && parent.isCancelled);
      }
    }]);

    return LazyPromisePlus;
  }();

  var PromisePlus = exports.PromisePlus = function (_LazyPromisePlus) {
    _inherits(PromisePlus, _LazyPromisePlus);

    function PromisePlus(callback, timeout) {
      var _this3;

      _classCallCheck(this, PromisePlus);

      _this3 = _possibleConstructorReturn(this, _getPrototypeOf(PromisePlus).call(this, callback, timeout));
      _this3.callback = callback;
      _this3.timeout = timeout;

      _this3.init();

      return _this3;
    }
    /**
     * @description Wraps the passed in value as a PromisePlus. Has the auto-flattening
     * semantics for Promises, LazyPromisePlusses, and PromisePlusses.
     *
     * @param value The value to wrap.
     * @returns A LazyPromisePlus of the value.
     */


    _createClass(PromisePlus, null, [{
      key: "of",
      value: function of(value) {
        return new PromisePlus(function (resolve) {
          return resolve(value);
        });
      }
      /**
       * @description Alias for PromisePlus.of.
       * @alias PromisePlus.of
       */

    }, {
      key: "resolve",
      value: function resolve(value) {
        return PromisePlus.of(value);
      }
      /**
       * @description Immediately rejects a PromisePlus with the provided Error or
       * an Error constructed from the provided message (empty string if null).
       *
       * @param reason The desired rejection message/error.
       * @returns A PromisePlus rejected with the error.
       */

    }, {
      key: "reject",
      value: function reject(reason) {
        var error = reason instanceof Error ? reason : new Error(reason || '');
        return new PromisePlus(function (resolve, reject) {
          reject(error);
        });
      }
    }]);

    return PromisePlus;
  }(LazyPromisePlus);
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wcm9taXNlcGx1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7O0FBUUEsTUFBTSxhQUFhLEdBQUcsSUFBSSxPQUFKLEVBQXRCOztBQUVBLE1BQU0seUJBQXlCLEdBQUcsU0FBNUIseUJBQTRCLENBQU8sTUFBUCxFQUErQixLQUEvQixFQUErRDtBQUMvRixJQUFBLGFBQWEsQ0FBQyxHQUFkLENBQWtCLEtBQWxCLEVBQXlCLE1BQXpCO0FBQ0QsR0FGRDtBQUlBOzs7Ozs7Ozs7OztNQVNhLGUsV0FBQSxlOzs7O0FBRVg7Ozs7Ozs7Ozt5QkFTb0IsSyxFQUFXO0FBQzdCLGVBQU8sSUFBSSxlQUFKLENBQW9CLFVBQUMsT0FBRDtBQUFBLGlCQUFhLE9BQU8sQ0FBQyxLQUFELENBQXBCO0FBQUEsU0FBcEIsQ0FBUDtBQUNEO0FBRUQ7Ozs7Ozs7OEJBSXlCLEssRUFBVztBQUNsQyxlQUFPLGVBQWUsQ0FBQyxFQUFoQixDQUFtQixLQUFuQixDQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7Ozs2QkFPcUIsTSxFQUFnQztBQUNuRCxZQUFNLEtBQUssR0FBRyxNQUFNLFlBQVksS0FBbEIsR0FDVixNQURVLEdBRVYsSUFBSSxLQUFKLENBQVUsTUFBTSxJQUFJLEVBQXBCLENBRko7QUFJQSxlQUFPLElBQUksZUFBSixDQUFvQixVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQzlDLFVBQUEsTUFBTSxDQUFDLEtBQUQsQ0FBTjtBQUNELFNBRk0sRUFFSixJQUZJLEVBQVA7QUFHRDs7O0FBUUQsNkJBQ1ksUUFEWixFQUtXLE9BTFgsRUFNRTtBQUFBOztBQUFBO0FBQUE7O0FBQUEseUNBWjZCLEtBWTdCOztBQUFBLHlDQVg2QixLQVc3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ICpcbiAqIEBhdXRob3IgamFzbWl0aDc5XG4gKiBAY29weXJpZ2h0IDIwMThcbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbmNvbnN0IGNhbmNlbGxhdGlvbnMgPSBuZXcgV2Vha01hcCgpO1xuXG5jb25zdCBhZGRDYW5jZWxsYXRpb25TdWJzY3JpYmVyID0gPFgsIFk+KHBhcmVudDogUHJvbWlzZUxpa2U8WD4sIGNoaWxkOiBQcm9taXNlTGlrZTxZPik6IHZvaWQgPT4ge1xuICBjYW5jZWxsYXRpb25zLnNldChjaGlsZCwgcGFyZW50KTtcbn07XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uIEEgbGF6eS1pbml0aWFsaXplZCBQcm9taXNlIHdpdGggYWRkZWQgY2FwYWJpbGl0aWVzIGxpa2VcbiAqIHRpbWVvdXRzIGFuZCBjYW5jZWxsYXRpb24uIENhbGxzIHRoZSBmdW5jdGlvbiBwYXNzZWQgdG8gdGhlXG4gKiBjb25zdHJ1Y3RvciBvbmx5IG9uY2UgLnRoZW4sIC5jYXRjaCwgb3IgLmZpbmFsbHkgaGF2ZSBiZWVuIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgdGhlIGZ1bmN0aW9uIHRoYXQgcmVjaWV2ZXMgdGhlIHJlc29sdmUgYW5kIHJlamVjdCBwYXJhbWV0ZXJzLlxuICogQHBhcmFtIHRpbWVvdXQgdGhlIGFtb3VudCBvZiB0aW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSBhdXRvbWF0aWNhbGx5XG4gKiByZWplY3RpbmcuIFJlYWRvbmx5LiBPcHRpb25hbC5cbiAqL1xuZXhwb3J0IGNsYXNzIExhenlQcm9taXNlUGx1czxUPiBpbXBsZW1lbnRzIFByb21pc2VMaWtlPFQ+IHtcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIFdyYXBzIHRoZSBwYXNzZWQgaW4gdmFsdWUgYXMgYSBMYXp5UHJvbWlzZVBsdXMuIEhhcyB0aGUgYXV0by1mbGF0dGVuaW5nXG4gICAqIHNlbWFudGljcyBmb3IgUHJvbWlzZXMsIExhenlQcm9taXNlUGx1c3NlcywgYW5kIFByb21pc2VQbHVzc2VzLiAqKk5PVEU6KiogdW5saWtlXG4gICAqIGNhbGxpbmcgdGhlIGNvbnN0cnVjdG9yIGRpcmVjdGx5LCBzaW5jZSB0aGVyZSBpcyBubyBjYWxsYmFjayB0byBkZWxheSB0aGUgdW5kZXJseWluZ1xuICAgKiBQcm9taXNlIGlzIGltbWVkaWF0ZWx5IGNvbnN0cnVjdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHdyYXAuXG4gICAqIEByZXR1cm5zIEEgTGF6eVByb21pc2VQbHVzIG9mIHRoZSB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgb2Y8VD4odmFsdWU/OiBUKSB7XG4gICAgcmV0dXJuIG5ldyBMYXp5UHJvbWlzZVBsdXMoKHJlc29sdmUpID0+IHJlc29sdmUodmFsdWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gQWxpYXMgZm9yIExhenlQcm9taXNlUGx1cy5vZi5cbiAgICogQGFsaWFzIExhenlQcm9taXNlUGx1cy5vZlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZXNvbHZlPFQ+KHZhbHVlPzogVCkge1xuICAgIHJldHVybiBMYXp5UHJvbWlzZVBsdXMub2YodmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBJbW1lZGlhdGVseSByZWplY3RzIGEgTGF6eVByb21pc2VQbHVzIHdpdGggdGhlIHByb3ZpZGVkIEVycm9yIG9yXG4gICAqIGFuIEVycm9yIGNvbnN0cnVjdGVkIGZyb20gdGhlIHByb3ZpZGVkIG1lc3NhZ2UgKGVtcHR5IHN0cmluZyBpZiBudWxsKS5cbiAgICpcbiAgICogQHBhcmFtIHJlYXNvbiBUaGUgZGVzaXJlZCByZWplY3Rpb24gbWVzc2FnZS9lcnJvci5cbiAgICogQHJldHVybnMgQSBMYXp5UHJvbWlzZVBsdXMgcmVqZWN0ZWQgd2l0aCB0aGUgZXJyb3IuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlamVjdChyZWFzb24/OiBFcnJvciB8IHN0cmluZyB8IG51bGwpIHtcbiAgICBjb25zdCBlcnJvciA9IHJlYXNvbiBpbnN0YW5jZW9mIEVycm9yXG4gICAgICA/IHJlYXNvblxuICAgICAgOiBuZXcgRXJyb3IocmVhc29uIHx8ICcnKTtcblxuICAgIHJldHVybiBuZXcgTGF6eVByb21pc2VQbHVzKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdChlcnJvcik7XG4gICAgfSkuaW5pdCgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGNhbmNlbGxlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcm90ZWN0ZWQgY29tcGxldGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHByb3RlY3RlZCBwcm9taXNlOiBQcm9taXNlPFQ+IHwgbnVsbCA9IG51bGw7XG4gIHByb3RlY3RlZCBlcnJvcjogRXJyb3IgfCBudWxsID0gbnVsbDtcbiAgcHJvdGVjdGVkIHJlamVjdG9yOiAoKHJlYXNvbj86IGFueSkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcm90ZWN0ZWQgY2FsbGJhY2s6IChcbiAgICAgIHJlc29sdmU6ICh2YWx1ZT86IHt9IHwgUHJvbWlzZUxpa2U8e30+IHwgdW5kZWZpbmVkKSA9PiB2b2lkLFxuICAgICAgcmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkLFxuICAgICkgPT4gdm9pZCxcbiAgICByZWFkb25seSB0aW1lb3V0PzogbnVtYmVyLFxuICApIHt9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBJbml0aWFsaXplcyB0aGUgTGF6eVByb21pc2VQbHVzLCBjYWxscyB0aGUgY2FsbGJhY2sgcGFzc2VkIHRvIHRoZVxuICAgKiBjb25zdHJ1Y3RvciBhbmQgYnVpbGRzIHRoZSB1bmRlcmx5aW5nIFByb21pc2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoaXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgaW5pdCgpOiB0aGlzIHtcbiAgICBpZiAoIXRoaXMucHJvbWlzZSAmJiAhdGhpcy5pc0NhbmNlbGxlZCkge1xuICAgICAgY29uc3QgcCA9IG5ldyBQcm9taXNlKHRoaXMuY2FsbGJhY2spO1xuXG4gICAgICAvLyBZZXMsIHllcywgYW50aS1wYXR0ZXJuLCBJIGtub3cuIE5vIGNsZWFuIHdheSB0byBkbyB0aGlzIEFGQUlLLlxuICAgICAgLy8gU2luY2UgY2FuY2VsbGF0aW9uIG5lZWRzIHRvIGJlIGFibGUgdG8gcmVqZWN0IHRoZSBwcm9taXNlIGZyb20gdGhlXG4gICAgICAvLyBvdXRzaWRlLCBuZWVkIHRvIHVzZSB0aGUgY29uc3RydWN0b3IgaGVyZSB0byBnZXQgYWNjZXNzIHRvIHRoYXRcbiAgICAgIC8vIHBhcmFtZXRlciByYXRoZXIgdGhhbiBzaW1wbHkgY2hhaW5pbmcgLnRoZW4gb3IgdGhyb3dpbmcuXG4gICAgICB0aGlzLnByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgICAgdGhpcy5yZWplY3RvciA9IHJlajtcbiAgICAgICAgaWYgKHRoaXMudGltZW91dCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoXG4gICAgICAgICAgICByZWouYmluZChcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgbmV3IEVycm9yKGBQcm9taXNlIHJlYWNoZWQgdGltZW91dCBvZiAke3RoaXMudGltZW91dH0gbWlsbGlzZWNvbmRzLmApLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHRoaXMudGltZW91dCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcC50aGVuKFxuICAgICAgICAgIChzdWNjZXNzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0NhbmNlbGxlZCkge1xuICAgICAgICAgICAgICByZWoodGhpcy5lcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMoKHN1Y2Nlc3MgYXMgVCkpO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICAoZmFpbCkgPT4ge1xuICAgICAgICAgICAgLy8gUHJldmlvdXMgZXJyb3JzIGxpa2UgY2FuY2VsbGF0aW9uIHRha2UgcHJlY2VkZW5jZS5cbiAgICAgICAgICAgIGlmICghdGhpcy5lcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLmNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMuZXJyb3IgPSBmYWlsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVqKHRoaXMuZXJyb3IpO1xuICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBTdXJwcmlzZWQgdGhlIGNvbXBpbGVyIGNhbid0IGluZmVyIHRoYXQgdGhpcyBjYW4ndCBiZSBudWxsXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXQgaXNDYW5jZWxsZWQoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcGFyZW50ID0gY2FuY2VsbGF0aW9ucy5nZXQodGhpcyk7XG4gICAgcmV0dXJuIHRoaXMuY2FuY2VsbGVkIHx8IEJvb2xlYW4ocGFyZW50ICYmIHBhcmVudC5pc0NhbmNlbGxlZCk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIENhbmNlbHMgYSBwZW5kaW5nIFByb21zaWVQbHVzLiBJZiB0aGUgUHJvbWlzZSBoYXMgYWxyZWFkeVxuICAgKiBzZXR0bGVkIGl0J3MgYSBub29wLiBUaGUgUHJvbWlzZSB3aWxsIGltbWVkaWF0ZWx5IHJlamVjdCB3aXRoIHRoZSBzdXBwbGllZFxuICAgKiBFcnJvciBpbnN0YW5jZSBvciBhbiBFcnJvciBjcmVhdGVkIHdpdGggdGhlIHN1cHBsaWVkIG1lc3NhZ2UuXG4gICAqIE5PVEU6IENhbmNlbGxhdGlvbiB3aWxsIHByb3BhZ2F0ZSAqZG93biogdGhlIFByb21pc2UgY2hhaW4gYnV0IG5vdCB1cC5cbiAgICogU28gaWYgeW91IGhhdmU6XG4gICAqIGNvbnN0IHAxID0gbmV3IExhenlQcm9taXNlUGx1cygocmVzKSA9PiBmZXRjaCgnL3NvbWUvc2xvdy9yZXNwb25kaW5nL3VybCcpKTtcbiAgICogY29uc3QgcDIgPSBwMS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgICogcDEuY2FuY2VsKCdObyBUaGFua3MnKTtcbiAgICogVGhlbiAnTm8gVGhhbmtzJyB3aWxsIGxvZyB0byB0aGUgY29uc29sZSBhcyBhbiBlcnJvci5cbiAgICpcbiAgICogQHBhcmFtIHJlYXNvbiBUaGUgdXNlci1zdXBwbGllZCByZWFzb24gZm9yIGNhbmNlbGxpbmcuIE9wdGlvbmFsLlxuICAgKiBAcGFyYW0gbGVnYWN5IFRoaXMgaXMgc29sZWx5IGhlcmUgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGhcbiAgICogYW4gb2xkZXIgdmVyc2lvbiBvZiB0aGUgQVBJLlxuICAgKiBAcmV0dXJucyB0aGlzLlxuICAgKi9cbiAgcHVibGljIGNhbmNlbChyZWFzb24/OiBzdHJpbmcgfCBFcnJvciB8IG51bGwsIGxlZ2FjeT86IEVycm9yIHwgbnVsbCk6IHRoaXMge1xuICAgIGlmICghdGhpcy5jb21wbGV0ZWQpIHtcbiAgICAgIHRoaXMuY2FuY2VsbGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuY29tcGxldGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuZXJyb3IgPSByZWFzb24gaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICA/IHJlYXNvblxuICAgICAgICA6IGxlZ2FjeSBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgPyBsZWdhY3lcbiAgICAgICAgICA6IG5ldyBFcnJvcihyZWFzb24gfHwgJ0NhbmNlbGxlZCBQcm9taXNlUGx1cy4nKTtcblxuICAgICAgLy8gUHJvcGFnYXRlIHRoZSBjYW5jZWxsYXRpb24gZG93bndhcmRzXG4gICAgICAvLyBUT0RPOiBmaXggdHlwZSBvbiBmb3JFYWNoIGNhbGxiYWNrIHBhcmFtZXRlci5cbiAgICAgIGNvbnN0IHByb21pc2VDaGFpbiA9IGNhbmNlbGxhdGlvbnMuZ2V0KHRoaXMpIHx8IFtdO1xuICAgICAgcHJvbWlzZUNoYWluLmZvckVhY2goKHA6IGFueSkgPT4ge1xuICAgICAgICAocCBhcyBMYXp5UHJvbWlzZVBsdXM8YW55PikuY2FuY2VsKCcnICsgdGhpcy5lcnJvciwgdGhpcy5lcnJvcik7XG4gICAgICB9KTtcblxuICAgICAgLy8gTWF5IG5vdCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWRcbiAgICAgIGlmICh0aGlzLnByb21pc2UpIHtcbiAgICAgICAgLy8gSWYgaXQgaGFzIGJlZW4gdGhvdWdoIHRoZW4gaXQgd2lsbCBoYXZlIGEgcmVqZWN0b3IsXG4gICAgICAgIC8vIHRoaXMgY2Fubm90IGJlIG51bGwgYnV0IHRoZSBjb21waWxlciBjYW4ndCBpbmZlclxuICAgICAgICAvLyB0aGF0IHNvLi4uXG4gICAgICAgICh0aGlzLnJlamVjdG9yIGFzIChyZWFzb24/OiBhbnkpID0+IHZvaWQpKHRoaXMuZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wcm9taXNlID0gUHJvbWlzZS5yZWplY3QodGhpcy5lcnJvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIEp1c3QgbGlrZSBQcm9taXNlLnByb3RvdHlwZS50aGVuLCBidXQgd2lsbFxuICAgKiBjYWxsIHRoZSBpbml0IGZ1bmN0aW9uIGxvIGluaXRpYWxpemUgdGhlIExhenlQcm9taXNlUGx1cy5cbiAgICpcbiAgICogQHBhcmFtIHN1Y2Nlc3MgSGFuZGxlciBmdW5jdGlvbiwgY2FsbGVkIHdoZW4gdGhlIFByb21pc2UgcmVzb2x2ZXMuXG4gICAqIEBwYXJhbSBmYWlsIEhhbmRsZXIgZnVuY3Rpb24sIGNhbGxlZCB3aGVuIHRoZSBQcm9taXNlIHJlamVjdHMuXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBwdWJsaWMgdGhlbjxSPihcbiAgICBzdWNjZXNzOiAocmVzdWx0OiBUKSA9PiBSLFxuICAgIGZhaWw/OiAocmVhc29uOiBhbnkpID0+IGFueSxcbiAgKSB7XG4gICAgaWYgKHRoaXMuaXNDYW5jZWxsZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb21pc2VcbiAgICAgICAgPyBMYXp5UHJvbWlzZVBsdXMub2YodGhpcy5wcm9taXNlLmNhdGNoKGZhaWwpKVxuICAgICAgICA6IExhenlQcm9taXNlUGx1cy5yZWplY3QobmV3IEVycm9yKCdDYW5jZWxsZWQgdW5pbml0aWFsaXplZCBMYXp5UHJvbWlzZVBsdXMnKSk7XG4gICAgfVxuXG4gICAgdGhpcy5pbml0KCk7XG4gICAgY29uc3QgcCA9IHRoaXMucHJvbWlzZVxuICAgICAgPyBMYXp5UHJvbWlzZVBsdXMub2YodGhpcy5wcm9taXNlLnRoZW4oc3VjY2VzcywgZmFpbCkpXG4gICAgICA6IExhenlQcm9taXNlUGx1cy5yZXNvbHZlKCk7XG5cbiAgICBhZGRDYW5jZWxsYXRpb25TdWJzY3JpYmVyKHRoaXMsIHApO1xuICAgIHJldHVybiBwO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBKdXN0IGxpa2UgUHJvbWlzZS5wcm90b3R5cGUuY2F0Y2gsIGJ1dCB3aWxsXG4gICAqIGNhbGwgdGhlIGluaXQgZnVuY3Rpb24gbG8gaW5pdGlhbGl6ZSB0aGUgTGF6eVByb21pc2VQbHVzLlxuICAgKlxuICAgKiBAcGFyYW0gZmFpbCBIYW5kbGVyIGZ1bmN0aW9uLCBjYWxsZWQgd2hlbiB0aGUgUHJvbWlzZSByZWplY3RzLlxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgcHVibGljIGNhdGNoKGZhaWw6IChyZWFzb246IGFueSkgPT4gdm9pZCk6IExhenlQcm9taXNlUGx1czxUIHwgRXJyb3IgfCBudWxsPiB7XG4gICAgaWYgKHRoaXMuaXNDYW5jZWxsZWQpIHtcbiAgICAgIHJldHVybiAoTGF6eVByb21pc2VQbHVzLm9mKHRoaXMuZXJyb3IpIGFzIExhenlQcm9taXNlUGx1czxFcnJvciB8IG51bGw+KTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXQoKTtcbiAgICBjb25zdCBwID0gTGF6eVByb21pc2VQbHVzLm9mKCh0aGlzLnByb21pc2UgYXMgUHJvbWlzZTxUPikuY2F0Y2goZmFpbCkpO1xuXG4gICAgYWRkQ2FuY2VsbGF0aW9uU3Vic2NyaWJlcigodGhpcyBhcyBMYXp5UHJvbWlzZVBsdXM8VD4pLCBwKTtcbiAgICByZXR1cm4gKHAgYXMgTGF6eVByb21pc2VQbHVzPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gSnVzdCBsaWtlIFByb21pc2UucHJvdG90eXBlLmZpbmFsbHksIGJ1dCB3aWxsXG4gICAqIGNhbGwgdGhlIGluaXQgZnVuY3Rpb24gbG8gaW5pdGlhbGl6ZSB0aGUgTGF6eVByb21pc2VQbHVzLiBJZiB0aGUgdW5kZXJseWluZ1xuICAgKiBQcm9taXNlIGRvZXNuJ3QgeWV0IGltcGxlbWVudCAuZmluYWxseSwgdGhpcyBtZXRob2Qgd2lsbCBtaW1pYyB0aGUgcHJvcGVyXG4gICAqIHNlbWFudGljcyB3aXRoIC50aGVuLlxuICAgKlxuICAgKiBAcGFyYW0gY2FsbGJhY2sgV2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgUHJvbWlzZSBzZXR0bGVzLCBhbHRob3VnaCBpdCByZXR1cm5zIGEgbmV3XG4gICAqIExhenlQcm9taXNlUGx1cywgaXQgd2lsbCBoYXZlIHRoZSB2YWx1ZSBvZiB0aGUgc2V0dGxlZCBQcm9taXNlIGl0IGNoYWlucyBvZmYgb2YuXG4gICAqIEByZXR1cm5zIExhenlQcm9taXNlUGx1cy5cbiAgICovXG4gIHB1YmxpYyBmaW5hbGx5KGNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5pbml0KCk7XG5cbiAgICAvLyB0aGlzLnByb21pc2UgY2Fubm90IGJlIG51bGwgaGVyZSwgYnV0IHRoZSBjb21waWxlciBjYW4ndCBpbmZlci5cbiAgICBpZiAodGhpcy5wcm9taXNlICYmICdmaW5hbGx5JyBpbiB0aGlzLnByb21pc2UpIHtcbiAgICAgIGNvbnN0IGNiID0gKHZhbHVlOiBUIHwgRXJyb3IpID0+IHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfTtcbiAgICAgIHJldHVybiBMYXp5UHJvbWlzZVBsdXMub2YodGhpcy5wcm9taXNlLnRoZW4oY2IsIGNiKSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnByb21pc2UpIHtcbiAgICAgIHJldHVybiBMYXp5UHJvbWlzZVBsdXMub2YoKHRoaXMucHJvbWlzZSBhcyBQcm9taXNlPFQ+KS5maW5hbGx5KGNhbGxiYWNrKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBMYXp5UHJvbWlzZVBsdXMub2Yodm9pZCAwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIFdpbGwgcmV0dXJuIHRoZSB1bmRlcmx5aW5nIFByb21pc2Ugb2JqZWN0LiBBbiBlc2NhcGUgaGF0Y2ggaW4gY2FzZSBhbiBBUElcbiAgICogcmVxdWlyZXMgYW4gYWN0dWFsIFByb21pc2UgKGUuZy4gdmVyZmllZCB2aWEgaW5zdGFuY2VvZikgcmF0aGVyIHRoYW4gYSBnZW5lcmljIHRoZW5hYmxlLlxuICAgKiBJZiB0aGUgTGF6eVByb21pc2VQbHVzIGhhcyBub3QgYmVlbiBpbml0aWFsaXplZCwgdGhpcyBtZXRob2Qgd2lsbCBjYWxsIGluaXQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIFByb21pc2Ugb2JqZWN0LlxuICAgKi9cbiAgcHVibGljIHRvUHJvbWlzZSgpOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5wcm9taXNlIHx8ICh0aGlzLmluaXQoKS5wcm9taXNlIGFzIFByb21pc2U8VD4pO1xuICB9XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uIEEgVGhlbmFibGUgd2l0aCBhZGRlZCBjYXBhYmlsaXRpZXMgbGlrZVxuICogdGltZW91dHMgYW5kIGNhbmNlbGxhdGlvbi5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgdGhlIGZ1bmN0aW9uIHRoYXQgcmVjaWV2ZXMgdGhlIHJlc29sdmUgYW5kIHJlamVjdCBwYXJhbWV0ZXJzLlxuICogQHBhcmFtIHRpbWVvdXQgdGhlIGFtb3VudCBvZiB0aW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSBhdXRvbWF0aWNhbGx5XG4gKiByZWplY3RpbmcuIFJlYWRvbmx5LiBPcHRpb25hbC5cbiAqL1xuZXhwb3J0IGNsYXNzIFByb21pc2VQbHVzPFQ+IGV4dGVuZHMgTGF6eVByb21pc2VQbHVzPFQ+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJvdGVjdGVkIGNhbGxiYWNrOiAoXG4gICAgICByZXNvbHZlOiAodmFsdWU/OiB7fSB8IFByb21pc2VMaWtlPHt9PiB8IHVuZGVmaW5lZCkgPT4gdm9pZCxcbiAgICAgIHJlamVjdDogKHJlYXNvbj86IGFueSkgPT4gdm9pZCxcbiAgICApID0+IHZvaWQsXG4gICAgcmVhZG9ubHkgdGltZW91dD86IG51bWJlcixcbiAgKSB7XG4gICAgc3VwZXIoY2FsbGJhY2ssIHRpbWVvdXQpO1xuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBXcmFwcyB0aGUgcGFzc2VkIGluIHZhbHVlIGFzIGEgUHJvbWlzZVBsdXMuIEhhcyB0aGUgYXV0by1mbGF0dGVuaW5nXG4gICAqIHNlbWFudGljcyBmb3IgUHJvbWlzZXMsIExhenlQcm9taXNlUGx1c3NlcywgYW5kIFByb21pc2VQbHVzc2VzLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHdyYXAuXG4gICAqIEByZXR1cm5zIEEgTGF6eVByb21pc2VQbHVzIG9mIHRoZSB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgb2Y8VD4odmFsdWU/OiBUKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlUGx1cygocmVzb2x2ZSkgPT4gcmVzb2x2ZSh2YWx1ZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBBbGlhcyBmb3IgUHJvbWlzZVBsdXMub2YuXG4gICAqIEBhbGlhcyBQcm9taXNlUGx1cy5vZlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZXNvbHZlPFQ+KHZhbHVlPzogVCkge1xuICAgIHJldHVybiBQcm9taXNlUGx1cy5vZih2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIEltbWVkaWF0ZWx5IHJlamVjdHMgYSBQcm9taXNlUGx1cyB3aXRoIHRoZSBwcm92aWRlZCBFcnJvciBvclxuICAgKiBhbiBFcnJvciBjb25zdHJ1Y3RlZCBmcm9tIHRoZSBwcm92aWRlZCBtZXNzYWdlIChlbXB0eSBzdHJpbmcgaWYgbnVsbCkuXG4gICAqXG4gICAqIEBwYXJhbSByZWFzb24gVGhlIGRlc2lyZWQgcmVqZWN0aW9uIG1lc3NhZ2UvZXJyb3IuXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZVBsdXMgcmVqZWN0ZWQgd2l0aCB0aGUgZXJyb3IuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlamVjdChyZWFzb24/OiBFcnJvciB8IHN0cmluZyB8IG51bGwpIHtcbiAgICBjb25zdCBlcnJvciA9IHJlYXNvbiBpbnN0YW5jZW9mIEVycm9yXG4gICAgICA/IHJlYXNvblxuICAgICAgOiBuZXcgRXJyb3IocmVhc29uIHx8ICcnKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZVBsdXMoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICB9KTtcbiAgfVxufVxuIl19