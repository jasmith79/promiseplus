(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.promiseplus = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var cancellations = new WeakMap();

  var CancellationError = function (_Error) {
    _inherits(CancellationError, _Error);

    function CancellationError(message) {
      _classCallCheck(this, CancellationError);

      var _this = _possibleConstructorReturn(this, (CancellationError.__proto__ || Object.getPrototypeOf(CancellationError)).call(this, message));

      // Following is necessary to maintain instanceof accuracy after transpilation
      _this.constructor = CancellationError;
      _this.__proto__ = CancellationError.prototype;
      _this.message = message;
      return _this;
    }

    return CancellationError;
  }(Error);

  var LazyPromisePlus = function () {
    function LazyPromisePlus(cb) {
      var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      _classCallCheck(this, LazyPromisePlus);

      this._cancelled = false;
      this._timeout = timeout;
      this._callback = cb;
      this._promise = null;
      this._cancellationError = null;
      this._rejector = function () {};
      this._completed = false;
    }

    _createClass(LazyPromisePlus, [{
      key: 'of',
      value: function of(arg, timeout) {
        return LazyPromisePlus.of(arg, timeout);
      }
    }, {
      key: '_init',
      value: function _init() {
        var _this2 = this;

        if (!this._promise && !this.cancelled) {
          var p = this._callback ? new Promise(this._callback) : Promise.resolve();
          this._rejector = this._promise = new Promise(function (res, rej) {
            if (_this2._timeout) {
              setTimeout(rej.bind(null, new Error('Promise reached timeout of ' + _this2._timeout + ' milliseconds.')), _this2._timeout);
            }

            // Yes, yes, anti-pattern blah, blah. No clean way to do this AFAIK.
            p.then(function (success) {
              if (_this2.cancelled) rej(_this2._cancellationError);
              res(success);
            }, function (fail) {
              if (_this2.cancelled) rej(_this2._cancellationError);
              rej(fail);
            });
          });
        }

        return this._promise;
      }
    }, {
      key: 'then',
      value: function then(success, fail) {
        var _this3 = this;

        if (this.cancelled) return this._promise.catch(fail);
        var p = LazyPromisePlus.of(this._init().then(function (result) {
          console.log('Completing');
          _this3._completed = true;
          return success(result);
        }, function (err) {
          console.log('Completing');
          _this3._completed = true;
          return fail(err);
        }));

        cancellations.set(p, this);
        return p;
      }
    }, {
      key: 'catch',
      value: function _catch(fail) {
        var _this4 = this;

        if (this.cancelled) return this._promise.catch(fail);
        var p = LazyPromisePlus.of(this._init().catch(function (err) {
          _this4._completed = true;
          return fail(err);
        }));

        cancellations.set(p, this);
        return p;
      }
    }, {
      key: 'cancel',
      value: function cancel(message) {
        console.log('Cancelling');
        if (!this._completed) {
          this.cancelled = true;

          var msg = message ? ' with reason: ' + message : '';
          // Here we'll want to preserve the cancellation stack for debugging.
          this._cancellationError = new CancellationError('Cancelled Promise ' + msg);
          this._promise = Promise.reject(this._cancellationError);
        }
        return this;
      }
    }, {
      key: 'finally',
      value: function _finally(cb) {
        var p = this._init();
        return p.finally ? p.finally(cb) : p.then(cb, cb);
      }
    }, {
      key: 'toPromise',
      value: function toPromise() {
        return this._init();
      }
    }, {
      key: 'cancelled',
      get: function get() {
        var parent = cancellations.get(this);
        return this._cancelled || parent && parent.cancelled;
      },
      set: function set(arg) {
        this._cancelled = Boolean(arg);
      }
    }]);

    return LazyPromisePlus;
  }();

  // Class methods
  LazyPromisePlus.of = function (arg, timeout) {
    var p = null;
    if (arg && arg.then) p = arg;
    if (typeof arg === 'function') p = new Promise(arg);

    if (p === null) {
      throw new TypeError('Cannot convert argument to LazyPromisePlus.');
    }

    return new LazyPromisePlus(function (resolve, reject) {
      p.then(resolve, reject);
    }, timeout);
  };

  LazyPromisePlus.resolve = Promise.resolve;
  LazyPromisePlus.reject = Promise.reject;

  var PromisePlus = function (_LazyPromisePlus) {
    _inherits(PromisePlus, _LazyPromisePlus);

    function PromisePlus(cb, timeout) {
      _classCallCheck(this, PromisePlus);

      var _this5 = _possibleConstructorReturn(this, (PromisePlus.__proto__ || Object.getPrototypeOf(PromisePlus)).call(this, cb, timeout));

      _this5._init();
      return _this5;
    }

    return PromisePlus;
  }(LazyPromisePlus);

  exports.PromisePlus = PromisePlus;
  exports.LazyPromisePlus = LazyPromisePlus;
  exports.default = PromisePlus;
});
