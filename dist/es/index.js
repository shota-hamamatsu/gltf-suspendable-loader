/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */

var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
  return extendStatics(d, b);
};

function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() { this.constructor = d; }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
      next: function () {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
      }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  }
  catch (error) { e = { error: error }; }
  finally {
      try {
          if (r && !r.done && (m = i["return"])) m.call(i);
      }
      finally { if (e) throw e.error; }
  }
  return ar;
}

function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
      }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function isFunction(value) {
    return typeof value === 'function';
}

function createErrorClass(createImpl) {
    var _super = function (instance) {
        Error.call(instance);
        instance.stack = new Error().stack;
    };
    var ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
}

var UnsubscriptionError = createErrorClass(function (_super) {
    return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors
            ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ')
            : '';
        this.name = 'UnsubscriptionError';
        this.errors = errors;
    };
});

function arrRemove(arr, item) {
    if (arr) {
        var index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
    }
}

var Subscription = (function () {
    function Subscription(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._finalizers = null;
    }
    Subscription.prototype.unsubscribe = function () {
        var e_1, _a, e_2, _b;
        var errors;
        if (!this.closed) {
            this.closed = true;
            var _parentage = this._parentage;
            if (_parentage) {
                this._parentage = null;
                if (Array.isArray(_parentage)) {
                    try {
                        for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                            var parent_1 = _parentage_1_1.value;
                            parent_1.remove(this);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                else {
                    _parentage.remove(this);
                }
            }
            var initialFinalizer = this.initialTeardown;
            if (isFunction(initialFinalizer)) {
                try {
                    initialFinalizer();
                }
                catch (e) {
                    errors = e instanceof UnsubscriptionError ? e.errors : [e];
                }
            }
            var _finalizers = this._finalizers;
            if (_finalizers) {
                this._finalizers = null;
                try {
                    for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
                        var finalizer = _finalizers_1_1.value;
                        try {
                            execFinalizer(finalizer);
                        }
                        catch (err) {
                            errors = errors !== null && errors !== void 0 ? errors : [];
                            if (err instanceof UnsubscriptionError) {
                                errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                            }
                            else {
                                errors.push(err);
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            if (errors) {
                throw new UnsubscriptionError(errors);
            }
        }
    };
    Subscription.prototype.add = function (teardown) {
        var _a;
        if (teardown && teardown !== this) {
            if (this.closed) {
                execFinalizer(teardown);
            }
            else {
                if (teardown instanceof Subscription) {
                    if (teardown.closed || teardown._hasParent(this)) {
                        return;
                    }
                    teardown._addParent(this);
                }
                (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
            }
        }
    };
    Subscription.prototype._hasParent = function (parent) {
        var _parentage = this._parentage;
        return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
    };
    Subscription.prototype._addParent = function (parent) {
        var _parentage = this._parentage;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    };
    Subscription.prototype._removeParent = function (parent) {
        var _parentage = this._parentage;
        if (_parentage === parent) {
            this._parentage = null;
        }
        else if (Array.isArray(_parentage)) {
            arrRemove(_parentage, parent);
        }
    };
    Subscription.prototype.remove = function (teardown) {
        var _finalizers = this._finalizers;
        _finalizers && arrRemove(_finalizers, teardown);
        if (teardown instanceof Subscription) {
            teardown._removeParent(this);
        }
    };
    Subscription.EMPTY = (function () {
        var empty = new Subscription();
        empty.closed = true;
        return empty;
    })();
    return Subscription;
}());
Subscription.EMPTY;
function isSubscription(value) {
    return (value instanceof Subscription ||
        (value && 'closed' in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe)));
}
function execFinalizer(finalizer) {
    if (isFunction(finalizer)) {
        finalizer();
    }
    else {
        finalizer.unsubscribe();
    }
}

var config = {
    Promise: undefined};

var timeoutProvider = {
    setTimeout: function (handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
    },
    clearTimeout: function (handle) {
        return (clearTimeout)(handle);
    },
    delegate: undefined,
};

function reportUnhandledError(err) {
    timeoutProvider.setTimeout(function () {
        {
            throw err;
        }
    });
}

function noop() { }

function errorContext(cb) {
    {
        cb();
    }
}

var Subscriber = (function (_super) {
    __extends(Subscriber, _super);
    function Subscriber(destination) {
        var _this = _super.call(this) || this;
        _this.isStopped = false;
        if (destination) {
            _this.destination = destination;
            if (isSubscription(destination)) {
                destination.add(_this);
            }
        }
        else {
            _this.destination = EMPTY_OBSERVER;
        }
        return _this;
    }
    Subscriber.create = function (next, error, complete) {
        return new SafeSubscriber(next, error, complete);
    };
    Subscriber.prototype.next = function (value) {
        if (this.isStopped) ;
        else {
            this._next(value);
        }
    };
    Subscriber.prototype.error = function (err) {
        if (this.isStopped) ;
        else {
            this.isStopped = true;
            this._error(err);
        }
    };
    Subscriber.prototype.complete = function () {
        if (this.isStopped) ;
        else {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (!this.closed) {
            this.isStopped = true;
            _super.prototype.unsubscribe.call(this);
            this.destination = null;
        }
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        try {
            this.destination.error(err);
        }
        finally {
            this.unsubscribe();
        }
    };
    Subscriber.prototype._complete = function () {
        try {
            this.destination.complete();
        }
        finally {
            this.unsubscribe();
        }
    };
    return Subscriber;
}(Subscription));
var ConsumerObserver = (function () {
    function ConsumerObserver(partialObserver) {
        this.partialObserver = partialObserver;
    }
    ConsumerObserver.prototype.next = function (value) {
        var partialObserver = this.partialObserver;
        if (partialObserver.next) {
            try {
                partialObserver.next(value);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    ConsumerObserver.prototype.error = function (err) {
        var partialObserver = this.partialObserver;
        if (partialObserver.error) {
            try {
                partialObserver.error(err);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
        else {
            handleUnhandledError(err);
        }
    };
    ConsumerObserver.prototype.complete = function () {
        var partialObserver = this.partialObserver;
        if (partialObserver.complete) {
            try {
                partialObserver.complete();
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    return ConsumerObserver;
}());
var SafeSubscriber = (function (_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        var partialObserver;
        if (isFunction(observerOrNext) || !observerOrNext) {
            partialObserver = {
                next: (observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : undefined),
                error: error !== null && error !== void 0 ? error : undefined,
                complete: complete !== null && complete !== void 0 ? complete : undefined,
            };
        }
        else {
            {
                partialObserver = observerOrNext;
            }
        }
        _this.destination = new ConsumerObserver(partialObserver);
        return _this;
    }
    return SafeSubscriber;
}(Subscriber));
function handleUnhandledError(error) {
    {
        reportUnhandledError(error);
    }
}
function defaultErrorHandler(err) {
    throw err;
}
var EMPTY_OBSERVER = {
    closed: true,
    next: noop,
    error: defaultErrorHandler,
    complete: noop,
};

var observable = (function () { return (typeof Symbol === 'function' && Symbol.observable) || '@@observable'; })();

function identity(x) {
    return x;
}

function pipeFromArray(fns) {
    if (fns.length === 0) {
        return identity;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input) {
        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
    };
}

var Observable = (function () {
    function Observable(subscribe) {
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var _this = this;
        var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
        errorContext(function () {
            var _a = _this, operator = _a.operator, source = _a.source;
            subscriber.add(operator
                ?
                    operator.call(subscriber, source)
                : source
                    ?
                        _this._subscribe(subscriber)
                    :
                        _this._trySubscribe(subscriber));
        });
        return subscriber;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            sink.error(err);
        }
    };
    Observable.prototype.forEach = function (next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var subscriber = new SafeSubscriber({
                next: function (value) {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscriber.unsubscribe();
                    }
                },
                error: reject,
                complete: resolve,
            });
            _this.subscribe(subscriber);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    };
    Observable.prototype[observable] = function () {
        return this;
    };
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i] = arguments[_i];
        }
        return pipeFromArray(operations)(this);
    };
    Observable.prototype.toPromise = function (promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());
function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
    return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
}
function isSubscriber(value) {
    return (value && value instanceof Subscriber) || (isObserver(value) && isSubscription(value));
}

/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
const REVISION = '175';

/**
 * Only front faces are rendered.
 *
 * @type {number}
 * @constant
 */
const FrontSide = 0;

/**
 * Only back faces are rendered.
 *
 * @type {number}
 * @constant
 */
const BackSide = 1;

/**
 * Both front and back faces are rendered.
 *
 * @type {number}
 * @constant
 */
const DoubleSide = 2;

/**
 * The default blending.
 *
 * @type {number}
 * @constant
 */
const NormalBlending = 1;

/**
 * A `source + destination` blending equation.
 *
 * @type {number}
 * @constant
 */
const AddEquation = 100;

/**
 * Multiplies all colors by the source alpha value.
 *
 * @type {number}
 * @constant
 */
const SrcAlphaFactor = 204;

/**
 * Multiplies all colors by 1 minus the source alpha value.
 *
 * @type {number}
 * @constant
 */
const OneMinusSrcAlphaFactor = 205;

/**
 * Pass if the incoming value is less than or equal to the depth buffer value.
 *
 * @type {number}
 * @constant
 */
const LessEqualDepth = 3;

/**
 * Multiplies the environment map color with the surface color.
 *
 * @type {number}
 * @constant
 */
const MultiplyOperation = 0;

/**
 * The skinned mesh shares the same world space as the skeleton.
 *
 * @type {string}
 * @constant
 */
const AttachedBindMode = 'attached';

/**
 * The skinned mesh does not share the same world space as the skeleton.
 * This is useful when a skeleton is shared across multiple skinned meshes.
 *
 * @type {string}
 * @constant
 */
const DetachedBindMode = 'detached';

/**
 * Maps textures using the geometry's UV coordinates.
 *
 * @type {number}
 * @constant
 */
const UVMapping = 300;

/**
 * The texture will simply repeat to infinity.
 *
 * @type {number}
 * @constant
 */
const RepeatWrapping = 1000;

/**
 * The last pixel of the texture stretches to the edge of the mesh.
 *
 * @type {number}
 * @constant
 */
const ClampToEdgeWrapping = 1001;

/**
 * The texture will repeats to infinity, mirroring on each repeat.
 *
 * @type {number}
 * @constant
 */
const MirroredRepeatWrapping = 1002;

/**
 * Returns the value of the texture element that is nearest (in Manhattan distance)
 * to the specified texture coordinates.
 *
 * @type {number}
 * @constant
 */
const NearestFilter = 1003;

/**
 * Chooses the mipmap that most closely matches the size of the pixel being textured
 * and uses the `NearestFilter` criterion (the texel nearest to the center of the pixel)
 * to produce a texture value.
 *
 * @type {number}
 * @constant
 */
const NearestMipmapNearestFilter = 1004;

/**
 * Chooses the two mipmaps that most closely match the size of the pixel being textured and
 * uses the `NearestFilter` criterion to produce a texture value from each mipmap.
 * The final texture value is a weighted average of those two values.
 *
 * @type {number}
 * @constant
 */
const NearestMipmapLinearFilter = 1005;

/**
 * Returns the weighted average of the four texture elements that are closest to the specified
 * texture coordinates, and can include items wrapped or repeated from other parts of a texture,
 * depending on the values of `wrapS` and `wrapT`, and on the exact mapping.
 *
 * @type {number}
 * @constant
 */
const LinearFilter = 1006;

/**
 * Chooses the mipmap that most closely matches the size of the pixel being textured and uses
 * the `LinearFilter` criterion (a weighted average of the four texels that are closest to the
 * center of the pixel) to produce a texture value.
 *
 * @type {number}
 * @constant
 */
const LinearMipmapNearestFilter = 1007;

/**
 * Chooses the two mipmaps that most closely match the size of the pixel being textured and uses
 * the `LinearFilter` criterion to produce a texture value from each mipmap. The final texture value
 * is a weighted average of those two values.
 *
 * @type {number}
 * @constant
 */
const LinearMipmapLinearFilter = 1008;

/**
 * An unsigned byte data type for textures.
 *
 * @type {number}
 * @constant
 */
const UnsignedByteType = 1009;

/**
 * A float data type for textures.
 *
 * @type {number}
 * @constant
 */
const FloatType = 1015;

/**
 * Reads the red, green, blue and alpha components.
 *
 * @type {number}
 * @constant
 */
const RGBAFormat = 1023;

/**
 * Discards the green, blue and alpha components and reads just the red component.
 *
 * @type {number}
 * @constant
 */
const RedFormat = 1028;

/**
 * Discrete interpolation mode for keyframe tracks.
 *
 * @type {number}
 * @constant
 */
const InterpolateDiscrete = 2300;

/**
 * Linear interpolation mode for keyframe tracks.
 *
 * @type {number}
 * @constant
 */
const InterpolateLinear = 2301;

/**
 * Smooth interpolation mode for keyframe tracks.
 *
 * @type {number}
 * @constant
 */
const InterpolateSmooth = 2302;

/**
 * Zero curvature ending for animations.
 *
 * @type {number}
 * @constant
 */
const ZeroCurvatureEnding = 2400;

/**
 * Zero slope ending for animations.
 *
 * @type {number}
 * @constant
 */
const ZeroSlopeEnding = 2401;

/**
 * Wrap around ending for animations.
 *
 * @type {number}
 * @constant
 */
const WrapAroundEnding = 2402;

/**
 * Default animation blend mode.
 *
 * @type {number}
 * @constant
 */
const NormalAnimationBlendMode = 2500;

/**
 * For every three vertices draw a single triangle.
 *
 * @type {number}
 * @constant
 */
const TrianglesDrawMode = 0;

/**
 * For each vertex draw a triangle from the last three vertices.
 *
 * @type {number}
 * @constant
 */
const TriangleStripDrawMode = 1;

/**
 * For each vertex draw a triangle from the first vertex and the last two vertices.
 *
 * @type {number}
 * @constant
 */
const TriangleFanDrawMode = 2;

/**
 * Normal information is relative to the underlying surface.
 *
 * @type {number}
 * @constant
 */
const TangentSpaceNormalMap = 0;

// Color space string identifiers, matching CSS Color Module Level 4 and WebGPU names where available.

/**
 * No color space.
 *
 * @type {string}
 * @constant
 */
const NoColorSpace = '';

/**
 * sRGB color space.
 *
 * @type {string}
 * @constant
 */
const SRGBColorSpace = 'srgb';

/**
 * sRGB-linear color space.
 *
 * @type {string}
 * @constant
 */
const LinearSRGBColorSpace = 'srgb-linear';

/**
 * Linear transfer function.
 *
 * @type {string}
 * @constant
 */
const LinearTransfer = 'linear';

/**
 * sRGB transfer function.
 *
 * @type {string}
 * @constant
 */
const SRGBTransfer = 'srgb';

/**
 * Keeps the current value.
 *
 * @type {number}
 * @constant
 */
const KeepStencilOp = 7680;

/**
 * Will always return true.
 *
 * @type {number}
 * @constant
 */
const AlwaysStencilFunc = 519;

/**
 * The contents are intended to be specified once by the application, and used many
 * times as the source for drawing and image specification commands.
 *
 * @type {number}
 * @constant
 */
const StaticDrawUsage = 35044;

/**
 * WebGL coordinate system.
 *
 * @type {number}
 * @constant
 */
const WebGLCoordinateSystem = 2000;

/**
 * WebGPU coordinate system.
 *
 * @type {number}
 * @constant
 */
const WebGPUCoordinateSystem = 2001;

/**
 * This type represents mouse buttons and interaction types in context of controls.
 *
 * @typedef {Object} ConstantsMouse
 * @property {number} MIDDLE - The left mouse button.
 * @property {number} LEFT - The middle mouse button.
 * @property {number} RIGHT - The right mouse button.
 * @property {number} ROTATE - A rotate interaction.
 * @property {number} DOLLY - A dolly interaction.
 * @property {number} PAN - A pan interaction.
 **/

/**
 * This type represents touch interaction types in context of controls.
 *
 * @typedef {Object} ConstantsTouch
 * @property {number} ROTATE - A rotate interaction.
 * @property {number} PAN - A pan interaction.
 * @property {number} DOLLY_PAN - The dolly-pan interaction.
 * @property {number} DOLLY_ROTATE - A dolly-rotate interaction.
 **/

/**
 * This type represents the different timestamp query types.
 *
 * @typedef {Object} ConstantsTimestampQuery
 * @property {string} COMPUTE - A `compute` timestamp query.
 * @property {string} RENDER - A `render` timestamp query.
 **/

/**
 * This modules allows to dispatch event objects on custom JavaScript objects.
 *
 * Main repository: [eventdispatcher.js]{@link https://github.com/mrdoob/eventdispatcher.js/}
 *
 * Code Example:
 * ```js
 * class Car extends EventDispatcher {
 * 	start() {
 *		this.dispatchEvent( { type: 'start', message: 'vroom vroom!' } );
 *	}
 *};
 *
 * // Using events with the custom object
 * const car = new Car();
 * car.addEventListener( 'start', function ( event ) {
 * 	alert( event.message );
 * } );
 *
 * car.start();
 * ```
 */
class EventDispatcher {

	/**
	 * Adds the given event listener to the given event type.
	 *
	 * @param {string} type - The type of event to listen to.
	 * @param {Function} listener - The function that gets called when the event is fired.
	 */
	addEventListener( type, listener ) {

		if ( this._listeners === undefined ) this._listeners = {};

		const listeners = this._listeners;

		if ( listeners[ type ] === undefined ) {

			listeners[ type ] = [];

		}

		if ( listeners[ type ].indexOf( listener ) === -1 ) {

			listeners[ type ].push( listener );

		}

	}

	/**
	 * Returns `true` if the given event listener has been added to the given event type.
	 *
	 * @param {string} type - The type of event.
	 * @param {Function} listener - The listener to check.
	 * @return {boolean} Whether the given event listener has been added to the given event type.
	 */
	hasEventListener( type, listener ) {

		const listeners = this._listeners;

		if ( listeners === undefined ) return false;

		return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== -1;

	}

	/**
	 * Removes the given event listener from the given event type.
	 *
	 * @param {string} type - The type of event.
	 * @param {Function} listener - The listener to remove.
	 */
	removeEventListener( type, listener ) {

		const listeners = this._listeners;

		if ( listeners === undefined ) return;

		const listenerArray = listeners[ type ];

		if ( listenerArray !== undefined ) {

			const index = listenerArray.indexOf( listener );

			if ( index !== -1 ) {

				listenerArray.splice( index, 1 );

			}

		}

	}

	/**
	 * Dispatches an event object.
	 *
	 * @param {Object} event - The event that gets fired.
	 */
	dispatchEvent( event ) {

		const listeners = this._listeners;

		if ( listeners === undefined ) return;

		const listenerArray = listeners[ event.type ];

		if ( listenerArray !== undefined ) {

			event.target = this;

			// Make a copy, in case listeners are removed while iterating.
			const array = listenerArray.slice( 0 );

			for ( let i = 0, l = array.length; i < l; i ++ ) {

				array[ i ].call( this, event );

			}

			event.target = null;

		}

	}

}

const _lut = [ '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d', '4e', '4f', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a', '5b', '5c', '5d', '5e', '5f', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6a', '6b', '6c', '6d', '6e', '6f', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc', 'dd', 'de', 'df', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'ea', 'eb', 'ec', 'ed', 'ee', 'ef', 'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff' ];

let _seed = 1234567;


const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Generate a [UUID]{@link https://en.wikipedia.org/wiki/Universally_unique_identifier}
 * (universally unique identifier).
 *
 * @return {string} The UUID.
 */
function generateUUID() {

	// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

	const d0 = Math.random() * 0xffffffff | 0;
	const d1 = Math.random() * 0xffffffff | 0;
	const d2 = Math.random() * 0xffffffff | 0;
	const d3 = Math.random() * 0xffffffff | 0;
	const uuid = _lut[ d0 & 0xff ] + _lut[ d0 >> 8 & 0xff ] + _lut[ d0 >> 16 & 0xff ] + _lut[ d0 >> 24 & 0xff ] + '-' +
			_lut[ d1 & 0xff ] + _lut[ d1 >> 8 & 0xff ] + '-' + _lut[ d1 >> 16 & 0x0f | 0x40 ] + _lut[ d1 >> 24 & 0xff ] + '-' +
			_lut[ d2 & 0x3f | 0x80 ] + _lut[ d2 >> 8 & 0xff ] + '-' + _lut[ d2 >> 16 & 0xff ] + _lut[ d2 >> 24 & 0xff ] +
			_lut[ d3 & 0xff ] + _lut[ d3 >> 8 & 0xff ] + _lut[ d3 >> 16 & 0xff ] + _lut[ d3 >> 24 & 0xff ];

	// .toLowerCase() here flattens concatenated strings to save heap memory space.
	return uuid.toLowerCase();

}

/**
 * Clamps the given value between min and max.
 *
 * @param {number} value - The value to clamp.
 * @param {number} min - The min value.
 * @param {number} max - The max value.
 * @return {number} The clamped value.
 */
function clamp( value, min, max ) {

	return Math.max( min, Math.min( max, value ) );

}

/**
 * Computes the Euclidean modulo of the given parameters that
 * is `( ( n % m ) + m ) % m`.
 *
 * @param {number} n - The first parameter.
 * @param {number} m - The second parameter.
 * @return {number} The Euclidean modulo.
 */
function euclideanModulo( n, m ) {

	// https://en.wikipedia.org/wiki/Modulo_operation

	return ( ( n % m ) + m ) % m;

}

/**
 * Performs a linear mapping from range `<a1, a2>` to range `<b1, b2>`
 * for the given value.
 *
 * @param {number} x - The value to be mapped.
 * @param {number} a1 - Minimum value for range A.
 * @param {number} a2 - Maximum value for range A.
 * @param {number} b1 - Minimum value for range B.
 * @param {number} b2 - Maximum value for range B.
 * @return {number} The mapped value.
 */
function mapLinear( x, a1, a2, b1, b2 ) {

	return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

}

/**
 * Returns the percentage in the closed interval `[0, 1]` of the given value
 * between the start and end point.
 *
 * @param {number} x - The start point
 * @param {number} y - The end point.
 * @param {number} value - A value between start and end.
 * @return {number} The interpolation factor.
 */
function inverseLerp( x, y, value ) {

	// https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/inverse-lerp-a-super-useful-yet-often-overlooked-function-r5230/

	if ( x !== y ) {

		return ( value - x ) / ( y - x );

	} else {

		return 0;

	}

}

/**
 * Returns a value linearly interpolated from two known points based on the given interval -
 * `t = 0` will return `x` and `t = 1` will return `y`.
 *
 * @param {number} x - The start point
 * @param {number} y - The end point.
 * @param {number} t - The interpolation factor in the closed interval `[0, 1]`.
 * @return {number} The interpolated value.
 */
function lerp( x, y, t ) {

	return ( 1 - t ) * x + t * y;

}

/**
 * Smoothly interpolate a number from `x` to `y` in  a spring-like manner using a delta
 * time to maintain frame rate independent movement. For details, see
 * [Frame rate independent damping using lerp]{@link http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/}.
 *
 * @param {number} x - The current point.
 * @param {number} y - The target point.
 * @param {number} lambda - A higher lambda value will make the movement more sudden,
 * and a lower value will make the movement more gradual.
 * @param {number} dt - Delta time in seconds.
 * @return {number} The interpolated value.
 */
function damp( x, y, lambda, dt ) {

	return lerp( x, y, 1 - Math.exp( - lambda * dt ) );

}

/**
 * Returns a value that alternates between `0` and the given `length` parameter.
 *
 * @param {number} x - The value to pingpong.
 * @param {number} [length=1] - The positive value the function will pingpong to.
 * @return {number} The alternated value.
 */
function pingpong( x, length = 1 ) {

	// https://www.desmos.com/calculator/vcsjnyz7x4

	return length - Math.abs( euclideanModulo( x, length * 2 ) - length );

}

/**
 * Returns a value in the range `[0,1]` that represents the percentage that `x` has
 * moved between `min` and `max`, but smoothed or slowed down the closer `x` is to
 * the `min` and `max`.
 *
 * See [Smoothstep]{@link http://en.wikipedia.org/wiki/Smoothstep} for more details.
 *
 * @param {number} x - The value to evaluate based on its position between min and max.
 * @param {number} min - The min value. Any x value below min will be `0`.
 * @param {number} max - The max value. Any x value above max will be `1`.
 * @return {number} The alternated value.
 */
function smoothstep( x, min, max ) {

	if ( x <= min ) return 0;
	if ( x >= max ) return 1;

	x = ( x - min ) / ( max - min );

	return x * x * ( 3 - 2 * x );

}

/**
 * A [variation on smoothstep]{@link https://en.wikipedia.org/wiki/Smoothstep#Variations}
 * that has zero 1st and 2nd order derivatives at x=0 and x=1.
 *
 * @param {number} x - The value to evaluate based on its position between min and max.
 * @param {number} min - The min value. Any x value below min will be `0`.
 * @param {number} max - The max value. Any x value above max will be `1`.
 * @return {number} The alternated value.
 */
function smootherstep( x, min, max ) {

	if ( x <= min ) return 0;
	if ( x >= max ) return 1;

	x = ( x - min ) / ( max - min );

	return x * x * x * ( x * ( x * 6 - 15 ) + 10 );

}

/**
 * Returns a random integer from `<low, high>` interval.
 *
 * @param {number} low - The lower value boundary.
 * @param {number} high - The upper value boundary
 * @return {number} A random integer.
 */
function randInt( low, high ) {

	return low + Math.floor( Math.random() * ( high - low + 1 ) );

}

/**
 * Returns a random float from `<low, high>` interval.
 *
 * @param {number} low - The lower value boundary.
 * @param {number} high - The upper value boundary
 * @return {number} A random float.
 */
function randFloat( low, high ) {

	return low + Math.random() * ( high - low );

}

/**
 * Returns a random integer from `<-range/2, range/2>` interval.
 *
 * @param {number} range - Defines the value range.
 * @return {number} A random float.
 */
function randFloatSpread( range ) {

	return range * ( 0.5 - Math.random() );

}

/**
 * Returns a deterministic pseudo-random float in the interval `[0, 1]`.
 *
 * @param {number} [s] - The integer seed.
 * @return {number} A random float.
 */
function seededRandom( s ) {

	if ( s !== undefined ) _seed = s;

	// Mulberry32 generator

	let t = _seed += 0x6D2B79F5;

	t = Math.imul( t ^ t >>> 15, t | 1 );

	t ^= t + Math.imul( t ^ t >>> 7, t | 61 );

	return ( ( t ^ t >>> 14 ) >>> 0 ) / 4294967296;

}

/**
 * Converts degrees to radians.
 *
 * @param {number} degrees - A value in degrees.
 * @return {number} The converted value in radians.
 */
function degToRad( degrees ) {

	return degrees * DEG2RAD;

}

/**
 * Converts radians to degrees.
 *
 * @param {number} radians - A value in radians.
 * @return {number} The converted value in degrees.
 */
function radToDeg( radians ) {

	return radians * RAD2DEG;

}

/**
 * Returns `true` if the given number is a power of two.
 *
 * @param {number} value - The value to check.
 * @return {boolean} Whether the given number is a power of two or not.
 */
function isPowerOfTwo( value ) {

	return ( value & ( value - 1 ) ) === 0 && value !== 0;

}

/**
 * Returns the smallest power of two that is greater than or equal to the given number.
 *
 * @param {number} value - The value to find a POT for.
 * @return {number} The smallest power of two that is greater than or equal to the given number.
 */
function ceilPowerOfTwo( value ) {

	return Math.pow( 2, Math.ceil( Math.log( value ) / Math.LN2 ) );

}

/**
 * Returns the largest power of two that is less than or equal to the given number.
 *
 * @param {number} value - The value to find a POT for.
 * @return {number} The largest power of two that is less than or equal to the given number.
 */
function floorPowerOfTwo( value ) {

	return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );

}

/**
 * Sets the given quaternion from the [Intrinsic Proper Euler Angles]{@link https://en.wikipedia.org/wiki/Euler_angles}
 * defined by the given angles and order.
 *
 * Rotations are applied to the axes in the order specified by order:
 * rotation by angle `a` is applied first, then by angle `b`, then by angle `c`.
 *
 * @param {Quaternion} q - The quaternion to set.
 * @param {number} a - The rotation applied to the first axis, in radians.
 * @param {number} b - The rotation applied to the second axis, in radians.
 * @param {number} c - The rotation applied to the third axis, in radians.
 * @param {('XYX'|'XZX'|'YXY'|'YZY'|'ZXZ'|'ZYZ')} order - A string specifying the axes order.
 */
function setQuaternionFromProperEuler( q, a, b, c, order ) {

	const cos = Math.cos;
	const sin = Math.sin;

	const c2 = cos( b / 2 );
	const s2 = sin( b / 2 );

	const c13 = cos( ( a + c ) / 2 );
	const s13 = sin( ( a + c ) / 2 );

	const c1_3 = cos( ( a - c ) / 2 );
	const s1_3 = sin( ( a - c ) / 2 );

	const c3_1 = cos( ( c - a ) / 2 );
	const s3_1 = sin( ( c - a ) / 2 );

	switch ( order ) {

		case 'XYX':
			q.set( c2 * s13, s2 * c1_3, s2 * s1_3, c2 * c13 );
			break;

		case 'YZY':
			q.set( s2 * s1_3, c2 * s13, s2 * c1_3, c2 * c13 );
			break;

		case 'ZXZ':
			q.set( s2 * c1_3, s2 * s1_3, c2 * s13, c2 * c13 );
			break;

		case 'XZX':
			q.set( c2 * s13, s2 * s3_1, s2 * c3_1, c2 * c13 );
			break;

		case 'YXY':
			q.set( s2 * c3_1, c2 * s13, s2 * s3_1, c2 * c13 );
			break;

		case 'ZYZ':
			q.set( s2 * s3_1, s2 * c3_1, c2 * s13, c2 * c13 );
			break;

		default:
			console.warn( 'THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: ' + order );

	}

}

/**
 * Denormalizes the given value according to the given typed array.
 *
 * @param {number} value - The value to denormalize.
 * @param {TypedArray} array - The typed array that defines the data type of the value.
 * @return {number} The denormalize (float) value in the range `[0,1]`.
 */
function denormalize( value, array ) {

	switch ( array.constructor ) {

		case Float32Array:

			return value;

		case Uint32Array:

			return value / 4294967295.0;

		case Uint16Array:

			return value / 65535.0;

		case Uint8Array:

			return value / 255.0;

		case Int32Array:

			return Math.max( value / 2147483647.0, -1 );

		case Int16Array:

			return Math.max( value / 32767.0, -1 );

		case Int8Array:

			return Math.max( value / 127.0, -1 );

		default:

			throw new Error( 'Invalid component type.' );

	}

}

/**
 * Normalizes the given value according to the given typed array.
 *
 * @param {number} value - The float value in the range `[0,1]` to normalize.
 * @param {TypedArray} array - The typed array that defines the data type of the value.
 * @return {number} The normalize value.
 */
function normalize( value, array ) {

	switch ( array.constructor ) {

		case Float32Array:

			return value;

		case Uint32Array:

			return Math.round( value * 4294967295.0 );

		case Uint16Array:

			return Math.round( value * 65535.0 );

		case Uint8Array:

			return Math.round( value * 255.0 );

		case Int32Array:

			return Math.round( value * 2147483647.0 );

		case Int16Array:

			return Math.round( value * 32767.0 );

		case Int8Array:

			return Math.round( value * 127.0 );

		default:

			throw new Error( 'Invalid component type.' );

	}

}

/**
 * @class
 * @classdesc A collection of math utility functions.
 * @hideconstructor
 */
const MathUtils = {
	DEG2RAD: DEG2RAD,
	RAD2DEG: RAD2DEG,
	/**
	 * Generate a [UUID]{@link https://en.wikipedia.org/wiki/Universally_unique_identifier}
	 * (universally unique identifier).
	 *
	 * @static
	 * @method
	 * @return {string} The UUID.
	 */
	generateUUID: generateUUID,
	/**
	 * Clamps the given value between min and max.
	 *
	 * @static
	 * @method
	 * @param {number} value - The value to clamp.
	 * @param {number} min - The min value.
	 * @param {number} max - The max value.
	 * @return {number} The clamped value.
	 */
	clamp: clamp,
	/**
	 * Computes the Euclidean modulo of the given parameters that
	 * is `( ( n % m ) + m ) % m`.
	 *
	 * @static
	 * @method
	 * @param {number} n - The first parameter.
	 * @param {number} m - The second parameter.
	 * @return {number} The Euclidean modulo.
	 */
	euclideanModulo: euclideanModulo,
	/**
	 * Performs a linear mapping from range `<a1, a2>` to range `<b1, b2>`
	 * for the given value.
	 *
	 * @static
	 * @method
	 * @param {number} x - The value to be mapped.
	 * @param {number} a1 - Minimum value for range A.
	 * @param {number} a2 - Maximum value for range A.
	 * @param {number} b1 - Minimum value for range B.
	 * @param {number} b2 - Maximum value for range B.
	 * @return {number} The mapped value.
	 */
	mapLinear: mapLinear,
	/**
	 * Returns the percentage in the closed interval `[0, 1]` of the given value
	 * between the start and end point.
	 *
	 * @static
	 * @method
	 * @param {number} x - The start point
	 * @param {number} y - The end point.
	 * @param {number} value - A value between start and end.
	 * @return {number} The interpolation factor.
	 */
	inverseLerp: inverseLerp,
	/**
	 * Returns a value linearly interpolated from two known points based on the given interval -
	 * `t = 0` will return `x` and `t = 1` will return `y`.
	 *
	 * @static
	 * @method
	 * @param {number} x - The start point
	 * @param {number} y - The end point.
	 * @param {number} t - The interpolation factor in the closed interval `[0, 1]`.
	 * @return {number} The interpolated value.
	 */
	lerp: lerp,
	/**
	 * Smoothly interpolate a number from `x` to `y` in  a spring-like manner using a delta
	 * time to maintain frame rate independent movement. For details, see
	 * [Frame rate independent damping using lerp]{@link http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/}.
	 *
	 * @static
	 * @method
	 * @param {number} x - The current point.
	 * @param {number} y - The target point.
	 * @param {number} lambda - A higher lambda value will make the movement more sudden,
	 * and a lower value will make the movement more gradual.
	 * @param {number} dt - Delta time in seconds.
	 * @return {number} The interpolated value.
	 */
	damp: damp,
	/**
	 * Returns a value that alternates between `0` and the given `length` parameter.
	 *
	 * @static
	 * @method
	 * @param {number} x - The value to pingpong.
	 * @param {number} [length=1] - The positive value the function will pingpong to.
	 * @return {number} The alternated value.
	 */
	pingpong: pingpong,
	/**
	 * Returns a value in the range `[0,1]` that represents the percentage that `x` has
	 * moved between `min` and `max`, but smoothed or slowed down the closer `x` is to
	 * the `min` and `max`.
	 *
	 * See [Smoothstep]{@link http://en.wikipedia.org/wiki/Smoothstep} for more details.
	 *
	 * @static
	 * @method
	 * @param {number} x - The value to evaluate based on its position between min and max.
	 * @param {number} min - The min value. Any x value below min will be `0`.
	 * @param {number} max - The max value. Any x value above max will be `1`.
	 * @return {number} The alternated value.
	 */
	smoothstep: smoothstep,
	/**
	 * A [variation on smoothstep]{@link https://en.wikipedia.org/wiki/Smoothstep#Variations}
	 * that has zero 1st and 2nd order derivatives at x=0 and x=1.
	 *
	 * @static
	 * @method
	 * @param {number} x - The value to evaluate based on its position between min and max.
	 * @param {number} min - The min value. Any x value below min will be `0`.
	 * @param {number} max - The max value. Any x value above max will be `1`.
	 * @return {number} The alternated value.
	 */
	smootherstep: smootherstep,
	/**
	 * Returns a random integer from `<low, high>` interval.
	 *
	 * @static
	 * @method
	 * @param {number} low - The lower value boundary.
	 * @param {number} high - The upper value boundary
	 * @return {number} A random integer.
	 */
	randInt: randInt,
	/**
	 * Returns a random float from `<low, high>` interval.
	 *
	 * @static
	 * @method
	 * @param {number} low - The lower value boundary.
	 * @param {number} high - The upper value boundary
	 * @return {number} A random float.
	 */
	randFloat: randFloat,
	/**
	 * Returns a random integer from `<-range/2, range/2>` interval.
	 *
	 * @static
	 * @method
	 * @param {number} range - Defines the value range.
	 * @return {number} A random float.
	 */
	randFloatSpread: randFloatSpread,
	/**
	 * Returns a deterministic pseudo-random float in the interval `[0, 1]`.
	 *
	 * @static
	 * @method
	 * @param {number} [s] - The integer seed.
	 * @return {number} A random float.
	 */
	seededRandom: seededRandom,
	/**
	 * Converts degrees to radians.
	 *
	 * @static
	 * @method
	 * @param {number} degrees - A value in degrees.
	 * @return {number} The converted value in radians.
	 */
	degToRad: degToRad,
	/**
	 * Converts radians to degrees.
	 *
	 * @static
	 * @method
	 * @param {number} radians - A value in radians.
	 * @return {number} The converted value in degrees.
	 */
	radToDeg: radToDeg,
	/**
	 * Returns `true` if the given number is a power of two.
	 *
	 * @static
	 * @method
	 * @param {number} value - The value to check.
	 * @return {boolean} Whether the given number is a power of two or not.
	 */
	isPowerOfTwo: isPowerOfTwo,
	/**
	 * Returns the smallest power of two that is greater than or equal to the given number.
	 *
	 * @static
	 * @method
	 * @param {number} value - The value to find a POT for.
	 * @return {number} The smallest power of two that is greater than or equal to the given number.
	 */
	ceilPowerOfTwo: ceilPowerOfTwo,
	/**
	 * Returns the largest power of two that is less than or equal to the given number.
	 *
	 * @static
	 * @method
	 * @param {number} value - The value to find a POT for.
	 * @return {number} The largest power of two that is less than or equal to the given number.
	 */
	floorPowerOfTwo: floorPowerOfTwo,
	/**
	 * Sets the given quaternion from the [Intrinsic Proper Euler Angles]{@link https://en.wikipedia.org/wiki/Euler_angles}
	 * defined by the given angles and order.
	 *
	 * Rotations are applied to the axes in the order specified by order:
	 * rotation by angle `a` is applied first, then by angle `b`, then by angle `c`.
	 *
	 * @static
	 * @method
	 * @param {Quaternion} q - The quaternion to set.
	 * @param {number} a - The rotation applied to the first axis, in radians.
	 * @param {number} b - The rotation applied to the second axis, in radians.
	 * @param {number} c - The rotation applied to the third axis, in radians.
	 * @param {('XYX'|'XZX'|'YXY'|'YZY'|'ZXZ'|'ZYZ')} order - A string specifying the axes order.
	 */
	setQuaternionFromProperEuler: setQuaternionFromProperEuler,
	/**
	 * Normalizes the given value according to the given typed array.
	 *
	 * @static
	 * @method
	 * @param {number} value - The float value in the range `[0,1]` to normalize.
	 * @param {TypedArray} array - The typed array that defines the data type of the value.
	 * @return {number} The normalize value.
	 */
	normalize: normalize,
	/**
	 * Denormalizes the given value according to the given typed array.
	 *
	 * @static
	 * @method
	 * @param {number} value - The value to denormalize.
	 * @param {TypedArray} array - The typed array that defines the data type of the value.
	 * @return {number} The denormalize (float) value in the range `[0,1]`.
	 */
	denormalize: denormalize
};

/**
 * Class representing a 2D vector. A 2D vector is an ordered pair of numbers
 * (labeled x and y), which can be used to represent a number of things, such as:
 *
 * - A point in 2D space (i.e. a position on a plane).
 * - A direction and length across a plane. In three.js the length will
 * always be the Euclidean distance(straight-line distance) from `(0, 0)` to `(x, y)`
 * and the direction is also measured from `(0, 0)` towards `(x, y)`.
 * - Any arbitrary ordered pair of numbers.
 *
 * There are other things a 2D vector can be used to represent, such as
 * momentum vectors, complex numbers and so on, however these are the most
 * common uses in three.js.
 *
 * Iterating through a vector instance will yield its components `(x, y)` in
 * the corresponding order.
 * ```js
 * const a = new THREE.Vector2( 0, 1 );
 *
 * //no arguments; will be initialised to (0, 0)
 * const b = new THREE.Vector2( );
 *
 * const d = a.distanceTo( b );
 * ```
 */
class Vector2 {

	/**
	 * Constructs a new 2D vector.
	 *
	 * @param {number} [x=0] - The x value of this vector.
	 * @param {number} [y=0] - The y value of this vector.
	 */
	constructor( x = 0, y = 0 ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Vector2.prototype.isVector2 = true;

		/**
		 * The x value of this vector.
		 *
		 * @type {number}
		 */
		this.x = x;

		/**
		 * The y value of this vector.
		 *
		 * @type {number}
		 */
		this.y = y;

	}

	/**
	 * Alias for {@link Vector2#x}.
	 *
	 * @type {number}
	 */
	get width() {

		return this.x;

	}

	set width( value ) {

		this.x = value;

	}

	/**
	 * Alias for {@link Vector2#y}.
	 *
	 * @type {number}
	 */
	get height() {

		return this.y;

	}

	set height( value ) {

		this.y = value;

	}

	/**
	 * Sets the vector components.
	 *
	 * @param {number} x - The value of the x component.
	 * @param {number} y - The value of the y component.
	 * @return {Vector2} A reference to this vector.
	 */
	set( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	}

	/**
	 * Sets the vector components to the same value.
	 *
	 * @param {number} scalar - The value to set for all vector components.
	 * @return {Vector2} A reference to this vector.
	 */
	setScalar( scalar ) {

		this.x = scalar;
		this.y = scalar;

		return this;

	}

	/**
	 * Sets the vector's x component to the given value
	 *
	 * @param {number} x - The value to set.
	 * @return {Vector2} A reference to this vector.
	 */
	setX( x ) {

		this.x = x;

		return this;

	}

	/**
	 * Sets the vector's y component to the given value
	 *
	 * @param {number} y - The value to set.
	 * @return {Vector2} A reference to this vector.
	 */
	setY( y ) {

		this.y = y;

		return this;

	}

	/**
	 * Allows to set a vector component with an index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y.
	 * @param {number} value - The value to set.
	 * @return {Vector2} A reference to this vector.
	 */
	setComponent( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	}

	/**
	 * Returns the value of the vector component which matches the given index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y.
	 * @return {number} A vector component value.
	 */
	getComponent( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			default: throw new Error( 'index is out of range: ' + index );

		}

	}

	/**
	 * Returns a new vector with copied values from this instance.
	 *
	 * @return {Vector2} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this.x, this.y );

	}

	/**
	 * Copies the values of the given vector to this instance.
	 *
	 * @param {Vector2} v - The vector to copy.
	 * @return {Vector2} A reference to this vector.
	 */
	copy( v ) {

		this.x = v.x;
		this.y = v.y;

		return this;

	}

	/**
	 * Adds the given vector to this instance.
	 *
	 * @param {Vector2} v - The vector to add.
	 * @return {Vector2} A reference to this vector.
	 */
	add( v ) {

		this.x += v.x;
		this.y += v.y;

		return this;

	}

	/**
	 * Adds the given scalar value to all components of this instance.
	 *
	 * @param {number} s - The scalar to add.
	 * @return {Vector2} A reference to this vector.
	 */
	addScalar( s ) {

		this.x += s;
		this.y += s;

		return this;

	}

	/**
	 * Adds the given vectors and stores the result in this instance.
	 *
	 * @param {Vector2} a - The first vector.
	 * @param {Vector2} b - The second vector.
	 * @return {Vector2} A reference to this vector.
	 */
	addVectors( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;

		return this;

	}

	/**
	 * Adds the given vector scaled by the given factor to this instance.
	 *
	 * @param {Vector2} v - The vector.
	 * @param {number} s - The factor that scales `v`.
	 * @return {Vector2} A reference to this vector.
	 */
	addScaledVector( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;

		return this;

	}

	/**
	 * Subtracts the given vector from this instance.
	 *
	 * @param {Vector2} v - The vector to subtract.
	 * @return {Vector2} A reference to this vector.
	 */
	sub( v ) {

		this.x -= v.x;
		this.y -= v.y;

		return this;

	}

	/**
	 * Subtracts the given scalar value from all components of this instance.
	 *
	 * @param {number} s - The scalar to subtract.
	 * @return {Vector2} A reference to this vector.
	 */
	subScalar( s ) {

		this.x -= s;
		this.y -= s;

		return this;

	}

	/**
	 * Subtracts the given vectors and stores the result in this instance.
	 *
	 * @param {Vector2} a - The first vector.
	 * @param {Vector2} b - The second vector.
	 * @return {Vector2} A reference to this vector.
	 */
	subVectors( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;

		return this;

	}

	/**
	 * Multiplies the given vector with this instance.
	 *
	 * @param {Vector2} v - The vector to multiply.
	 * @return {Vector2} A reference to this vector.
	 */
	multiply( v ) {

		this.x *= v.x;
		this.y *= v.y;

		return this;

	}

	/**
	 * Multiplies the given scalar value with all components of this instance.
	 *
	 * @param {number} scalar - The scalar to multiply.
	 * @return {Vector2} A reference to this vector.
	 */
	multiplyScalar( scalar ) {

		this.x *= scalar;
		this.y *= scalar;

		return this;

	}

	/**
	 * Divides this instance by the given vector.
	 *
	 * @param {Vector2} v - The vector to divide.
	 * @return {Vector2} A reference to this vector.
	 */
	divide( v ) {

		this.x /= v.x;
		this.y /= v.y;

		return this;

	}

	/**
	 * Divides this vector by the given scalar.
	 *
	 * @param {number} scalar - The scalar to divide.
	 * @return {Vector2} A reference to this vector.
	 */
	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	}

	/**
	 * Multiplies this vector (with an implicit 1 as the 3rd component) by
	 * the given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The matrix to apply.
	 * @return {Vector2} A reference to this vector.
	 */
	applyMatrix3( m ) {

		const x = this.x, y = this.y;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ];
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ];

		return this;

	}

	/**
	 * If this vector's x or y value is greater than the given vector's x or y
	 * value, replace that value with the corresponding min value.
	 *
	 * @param {Vector2} v - The vector.
	 * @return {Vector2} A reference to this vector.
	 */
	min( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );

		return this;

	}

	/**
	 * If this vector's x or y value is less than the given vector's x or y
	 * value, replace that value with the corresponding max value.
	 *
	 * @param {Vector2} v - The vector.
	 * @return {Vector2} A reference to this vector.
	 */
	max( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );

		return this;

	}

	/**
	 * If this vector's x or y value is greater than the max vector's x or y
	 * value, it is replaced by the corresponding value.
	 * If this vector's x or y value is less than the min vector's x or y value,
	 * it is replaced by the corresponding value.
	 *
	 * @param {Vector2} min - The minimum x and y values.
	 * @param {Vector2} max - The maximum x and y values in the desired range.
	 * @return {Vector2} A reference to this vector.
	 */
	clamp( min, max ) {

		// assumes min < max, componentwise

		this.x = clamp( this.x, min.x, max.x );
		this.y = clamp( this.y, min.y, max.y );

		return this;

	}

	/**
	 * If this vector's x or y values are greater than the max value, they are
	 * replaced by the max value.
	 * If this vector's x or y values are less than the min value, they are
	 * replaced by the min value.
	 *
	 * @param {number} minVal - The minimum value the components will be clamped to.
	 * @param {number} maxVal - The maximum value the components will be clamped to.
	 * @return {Vector2} A reference to this vector.
	 */
	clampScalar( minVal, maxVal ) {

		this.x = clamp( this.x, minVal, maxVal );
		this.y = clamp( this.y, minVal, maxVal );

		return this;

	}

	/**
	 * If this vector's length is greater than the max value, it is replaced by
	 * the max value.
	 * If this vector's length is less than the min value, it is replaced by the
	 * min value.
	 *
	 * @param {number} min - The minimum value the vector length will be clamped to.
	 * @param {number} max - The maximum value the vector length will be clamped to.
	 * @return {Vector2} A reference to this vector.
	 */
	clampLength( min, max ) {

		const length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( clamp( length, min, max ) );

	}

	/**
	 * The components of this vector are rounded down to the nearest integer value.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	floor() {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );

		return this;

	}

	/**
	 * The components of this vector are rounded up to the nearest integer value.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	ceil() {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );

		return this;

	}

	/**
	 * The components of this vector are rounded to the nearest integer value
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	round() {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );

		return this;

	}

	/**
	 * The components of this vector are rounded towards zero (up if negative,
	 * down if positive) to an integer value.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	roundToZero() {

		this.x = Math.trunc( this.x );
		this.y = Math.trunc( this.y );

		return this;

	}

	/**
	 * Inverts this vector - i.e. sets x = -x and y = -y.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	negate() {

		this.x = - this.x;
		this.y = - this.y;

		return this;

	}

	/**
	 * Calculates the dot product of the given vector with this instance.
	 *
	 * @param {Vector2} v - The vector to compute the dot product with.
	 * @return {number} The result of the dot product.
	 */
	dot( v ) {

		return this.x * v.x + this.y * v.y;

	}

	/**
	 * Calculates the cross product of the given vector with this instance.
	 *
	 * @param {Vector2} v - The vector to compute the cross product with.
	 * @return {number} The result of the cross product.
	 */
	cross( v ) {

		return this.x * v.y - this.y * v.x;

	}

	/**
	 * Computes the square of the Euclidean length (straight-line length) from
	 * (0, 0) to (x, y). If you are comparing the lengths of vectors, you should
	 * compare the length squared instead as it is slightly more efficient to calculate.
	 *
	 * @return {number} The square length of this vector.
	 */
	lengthSq() {

		return this.x * this.x + this.y * this.y;

	}

	/**
	 * Computes the  Euclidean length (straight-line length) from (0, 0) to (x, y).
	 *
	 * @return {number} The length of this vector.
	 */
	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y );

	}

	/**
	 * Computes the Manhattan length of this vector.
	 *
	 * @return {number} The length of this vector.
	 */
	manhattanLength() {

		return Math.abs( this.x ) + Math.abs( this.y );

	}

	/**
	 * Converts this vector to a unit vector - that is, sets it equal to a vector
	 * with the same direction as this one, but with a vector length of `1`.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	normalize() {

		return this.divideScalar( this.length() || 1 );

	}

	/**
	 * Computes the angle in radians of this vector with respect to the positive x-axis.
	 *
	 * @return {number} The angle in radians.
	 */
	angle() {

		const angle = Math.atan2( - this.y, - this.x ) + Math.PI;

		return angle;

	}

	/**
	 * Returns the angle between the given vector and this instance in radians.
	 *
	 * @param {Vector2} v - The vector to compute the angle with.
	 * @return {number} The angle in radians.
	 */
	angleTo( v ) {

		const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

		if ( denominator === 0 ) return Math.PI / 2;

		const theta = this.dot( v ) / denominator;

		// clamp, to handle numerical problems

		return Math.acos( clamp( theta, -1, 1 ) );

	}

	/**
	 * Computes the distance from the given vector to this instance.
	 *
	 * @param {Vector2} v - The vector to compute the distance to.
	 * @return {number} The distance.
	 */
	distanceTo( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	}

	/**
	 * Computes the squared distance from the given vector to this instance.
	 * If you are just comparing the distance with another distance, you should compare
	 * the distance squared instead as it is slightly more efficient to calculate.
	 *
	 * @param {Vector2} v - The vector to compute the squared distance to.
	 * @return {number} The squared distance.
	 */
	distanceToSquared( v ) {

		const dx = this.x - v.x, dy = this.y - v.y;
		return dx * dx + dy * dy;

	}

	/**
	 * Computes the Manhattan distance from the given vector to this instance.
	 *
	 * @param {Vector2} v - The vector to compute the Manhattan distance to.
	 * @return {number} The Manhattan distance.
	 */
	manhattanDistanceTo( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y );

	}

	/**
	 * Sets this vector to a vector with the same direction as this one, but
	 * with the specified length.
	 *
	 * @param {number} length - The new length of this vector.
	 * @return {Vector2} A reference to this vector.
	 */
	setLength( length ) {

		return this.normalize().multiplyScalar( length );

	}

	/**
	 * Linearly interpolates between the given vector and this instance, where
	 * alpha is the percent distance along the line - alpha = 0 will be this
	 * vector, and alpha = 1 will be the given one.
	 *
	 * @param {Vector2} v - The vector to interpolate towards.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector2} A reference to this vector.
	 */
	lerp( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;

		return this;

	}

	/**
	 * Linearly interpolates between the given vectors, where alpha is the percent
	 * distance along the line - alpha = 0 will be first vector, and alpha = 1 will
	 * be the second one. The result is stored in this instance.
	 *
	 * @param {Vector2} v1 - The first vector.
	 * @param {Vector2} v2 - The second vector.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector2} A reference to this vector.
	 */
	lerpVectors( v1, v2, alpha ) {

		this.x = v1.x + ( v2.x - v1.x ) * alpha;
		this.y = v1.y + ( v2.y - v1.y ) * alpha;

		return this;

	}

	/**
	 * Returns `true` if this vector is equal with the given one.
	 *
	 * @param {Vector2} v - The vector to test for equality.
	 * @return {boolean} Whether this vector is equal with the given one.
	 */
	equals( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) );

	}

	/**
	 * Sets this vector's x value to be `array[ offset ]` and y
	 * value to be `array[ offset + 1 ]`.
	 *
	 * @param {Array<number>} array - An array holding the vector component values.
	 * @param {number} [offset=0] - The offset into the array.
	 * @return {Vector2} A reference to this vector.
	 */
	fromArray( array, offset = 0 ) {

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];

		return this;

	}

	/**
	 * Writes the components of this vector to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the vector components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The vector components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;

		return array;

	}

	/**
	 * Sets the components of this vector from the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - The buffer attribute holding vector data.
	 * @param {number} index - The index into the attribute.
	 * @return {Vector2} A reference to this vector.
	 */
	fromBufferAttribute( attribute, index ) {

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );

		return this;

	}

	/**
	 * Rotates this vector around the given center by the given angle.
	 *
	 * @param {Vector2} center - The point around which to rotate.
	 * @param {number} angle - The angle to rotate, in radians.
	 * @return {Vector2} A reference to this vector.
	 */
	rotateAround( center, angle ) {

		const c = Math.cos( angle ), s = Math.sin( angle );

		const x = this.x - center.x;
		const y = this.y - center.y;

		this.x = x * c - y * s + center.x;
		this.y = x * s + y * c + center.y;

		return this;

	}

	/**
	 * Sets each component of this vector to a pseudo-random value between `0` and
	 * `1`, excluding `1`.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	random() {

		this.x = Math.random();
		this.y = Math.random();

		return this;

	}

	*[ Symbol.iterator ]() {

		yield this.x;
		yield this.y;

	}

}

/**
 * Represents a 3x3 matrix.
 *
 * A Note on Row-Major and Column-Major Ordering:
 *
 * The constructor and {@link Matrix3#set} method take arguments in
 * [row-major]{@link https://en.wikipedia.org/wiki/Row-_and_column-major_order#Column-major_order}
 * order, while internally they are stored in the {@link Matrix3#elements} array in column-major order.
 * This means that calling:
 * ```js
 * const m = new THREE.Matrix();
 * m.set( 11, 12, 13,
 *        21, 22, 23,
 *        31, 32, 33 );
 * ```
 * will result in the elements array containing:
 * ```js
 * m.elements = [ 11, 21, 31,
 *                12, 22, 32,
 *                13, 23, 33 ];
 * ```
 * and internally all calculations are performed using column-major ordering.
 * However, as the actual ordering makes no difference mathematically and
 * most people are used to thinking about matrices in row-major order, the
 * three.js documentation shows matrices in row-major order. Just bear in
 * mind that if you are reading the source code, you'll have to take the
 * transpose of any matrices outlined here to make sense of the calculations.
 */
class Matrix3 {

	/**
	 * Constructs a new 3x3 matrix. The arguments are supposed to be
	 * in row-major order. If no arguments are provided, the constructor
	 * initializes the matrix as an identity matrix.
	 *
	 * @param {number} [n11] - 1-1 matrix element.
	 * @param {number} [n12] - 1-2 matrix element.
	 * @param {number} [n13] - 1-3 matrix element.
	 * @param {number} [n21] - 2-1 matrix element.
	 * @param {number} [n22] - 2-2 matrix element.
	 * @param {number} [n23] - 2-3 matrix element.
	 * @param {number} [n31] - 3-1 matrix element.
	 * @param {number} [n32] - 3-2 matrix element.
	 * @param {number} [n33] - 3-3 matrix element.
	 */
	constructor( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Matrix3.prototype.isMatrix3 = true;

		/**
		 * A column-major list of matrix values.
		 *
		 * @type {Array<number>}
		 */
		this.elements = [

			1, 0, 0,
			0, 1, 0,
			0, 0, 1

		];

		if ( n11 !== undefined ) {

			this.set( n11, n12, n13, n21, n22, n23, n31, n32, n33 );

		}

	}

	/**
	 * Sets the elements of the matrix.The arguments are supposed to be
	 * in row-major order.
	 *
	 * @param {number} [n11] - 1-1 matrix element.
	 * @param {number} [n12] - 1-2 matrix element.
	 * @param {number} [n13] - 1-3 matrix element.
	 * @param {number} [n21] - 2-1 matrix element.
	 * @param {number} [n22] - 2-2 matrix element.
	 * @param {number} [n23] - 2-3 matrix element.
	 * @param {number} [n31] - 3-1 matrix element.
	 * @param {number} [n32] - 3-2 matrix element.
	 * @param {number} [n33] - 3-3 matrix element.
	 * @return {Matrix3} A reference to this matrix.
	 */
	set( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

		const te = this.elements;

		te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
		te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
		te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

		return this;

	}

	/**
	 * Sets this matrix to the 3x3 identity matrix.
	 *
	 * @return {Matrix3} A reference to this matrix.
	 */
	identity() {

		this.set(

			1, 0, 0,
			0, 1, 0,
			0, 0, 1

		);

		return this;

	}

	/**
	 * Copies the values of the given matrix to this instance.
	 *
	 * @param {Matrix3} m - The matrix to copy.
	 * @return {Matrix3} A reference to this matrix.
	 */
	copy( m ) {

		const te = this.elements;
		const me = m.elements;

		te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ];
		te[ 3 ] = me[ 3 ]; te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ];
		te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ]; te[ 8 ] = me[ 8 ];

		return this;

	}

	/**
	 * Extracts the basis of this matrix into the three axis vectors provided.
	 *
	 * @param {Vector3} xAxis - The basis's x axis.
	 * @param {Vector3} yAxis - The basis's y axis.
	 * @param {Vector3} zAxis - The basis's z axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	extractBasis( xAxis, yAxis, zAxis ) {

		xAxis.setFromMatrix3Column( this, 0 );
		yAxis.setFromMatrix3Column( this, 1 );
		zAxis.setFromMatrix3Column( this, 2 );

		return this;

	}

	/**
	 * Set this matrix to the upper 3x3 matrix of the given 4x4 matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Matrix3} A reference to this matrix.
	 */
	setFromMatrix4( m ) {

		const me = m.elements;

		this.set(

			me[ 0 ], me[ 4 ], me[ 8 ],
			me[ 1 ], me[ 5 ], me[ 9 ],
			me[ 2 ], me[ 6 ], me[ 10 ]

		);

		return this;

	}

	/**
	 * Post-multiplies this matrix by the given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The matrix to multiply with.
	 * @return {Matrix3} A reference to this matrix.
	 */
	multiply( m ) {

		return this.multiplyMatrices( this, m );

	}

	/**
	 * Pre-multiplies this matrix by the given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The matrix to multiply with.
	 * @return {Matrix3} A reference to this matrix.
	 */
	premultiply( m ) {

		return this.multiplyMatrices( m, this );

	}

	/**
	 * Multiples the given 3x3 matrices and stores the result
	 * in this matrix.
	 *
	 * @param {Matrix3} a - The first matrix.
	 * @param {Matrix3} b - The second matrix.
	 * @return {Matrix3} A reference to this matrix.
	 */
	multiplyMatrices( a, b ) {

		const ae = a.elements;
		const be = b.elements;
		const te = this.elements;

		const a11 = ae[ 0 ], a12 = ae[ 3 ], a13 = ae[ 6 ];
		const a21 = ae[ 1 ], a22 = ae[ 4 ], a23 = ae[ 7 ];
		const a31 = ae[ 2 ], a32 = ae[ 5 ], a33 = ae[ 8 ];

		const b11 = be[ 0 ], b12 = be[ 3 ], b13 = be[ 6 ];
		const b21 = be[ 1 ], b22 = be[ 4 ], b23 = be[ 7 ];
		const b31 = be[ 2 ], b32 = be[ 5 ], b33 = be[ 8 ];

		te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31;
		te[ 3 ] = a11 * b12 + a12 * b22 + a13 * b32;
		te[ 6 ] = a11 * b13 + a12 * b23 + a13 * b33;

		te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31;
		te[ 4 ] = a21 * b12 + a22 * b22 + a23 * b32;
		te[ 7 ] = a21 * b13 + a22 * b23 + a23 * b33;

		te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31;
		te[ 5 ] = a31 * b12 + a32 * b22 + a33 * b32;
		te[ 8 ] = a31 * b13 + a32 * b23 + a33 * b33;

		return this;

	}

	/**
	 * Multiplies every component of the matrix by the given scalar.
	 *
	 * @param {number} s - The scalar.
	 * @return {Matrix3} A reference to this matrix.
	 */
	multiplyScalar( s ) {

		const te = this.elements;

		te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
		te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
		te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;

		return this;

	}

	/**
	 * Computes and returns the determinant of this matrix.
	 *
	 * @return {number} The determinant.
	 */
	determinant() {

		const te = this.elements;

		const a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
			d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
			g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

		return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;

	}

	/**
	 * Inverts this matrix, using the [analytic method]{@link https://en.wikipedia.org/wiki/Invertible_matrix#Analytic_solution}.
	 * You can not invert with a determinant of zero. If you attempt this, the method produces
	 * a zero matrix instead.
	 *
	 * @return {Matrix3} A reference to this matrix.
	 */
	invert() {

		const te = this.elements,

			n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ],
			n12 = te[ 3 ], n22 = te[ 4 ], n32 = te[ 5 ],
			n13 = te[ 6 ], n23 = te[ 7 ], n33 = te[ 8 ],

			t11 = n33 * n22 - n32 * n23,
			t12 = n32 * n13 - n33 * n12,
			t13 = n23 * n12 - n22 * n13,

			det = n11 * t11 + n21 * t12 + n31 * t13;

		if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0 );

		const detInv = 1 / det;

		te[ 0 ] = t11 * detInv;
		te[ 1 ] = ( n31 * n23 - n33 * n21 ) * detInv;
		te[ 2 ] = ( n32 * n21 - n31 * n22 ) * detInv;

		te[ 3 ] = t12 * detInv;
		te[ 4 ] = ( n33 * n11 - n31 * n13 ) * detInv;
		te[ 5 ] = ( n31 * n12 - n32 * n11 ) * detInv;

		te[ 6 ] = t13 * detInv;
		te[ 7 ] = ( n21 * n13 - n23 * n11 ) * detInv;
		te[ 8 ] = ( n22 * n11 - n21 * n12 ) * detInv;

		return this;

	}

	/**
	 * Transposes this matrix in place.
	 *
	 * @return {Matrix3} A reference to this matrix.
	 */
	transpose() {

		let tmp;
		const m = this.elements;

		tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
		tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
		tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

		return this;

	}

	/**
	 * Computes the normal matrix which is the inverse transpose of the upper
	 * left 3x3 portion of the given 4x4 matrix.
	 *
	 * @param {Matrix4} matrix4 - The 4x4 matrix.
	 * @return {Matrix3} A reference to this matrix.
	 */
	getNormalMatrix( matrix4 ) {

		return this.setFromMatrix4( matrix4 ).invert().transpose();

	}

	/**
	 * Transposes this matrix into the supplied array, and returns itself unchanged.
	 *
	 * @param {Array<number>} r - An array to store the transposed matrix elements.
	 * @return {Matrix3} A reference to this matrix.
	 */
	transposeIntoArray( r ) {

		const m = this.elements;

		r[ 0 ] = m[ 0 ];
		r[ 1 ] = m[ 3 ];
		r[ 2 ] = m[ 6 ];
		r[ 3 ] = m[ 1 ];
		r[ 4 ] = m[ 4 ];
		r[ 5 ] = m[ 7 ];
		r[ 6 ] = m[ 2 ];
		r[ 7 ] = m[ 5 ];
		r[ 8 ] = m[ 8 ];

		return this;

	}

	/**
	 * Sets the UV transform matrix from offset, repeat, rotation, and center.
	 *
	 * @param {number} tx - Offset x.
	 * @param {number} ty - Offset y.
	 * @param {number} sx - Repeat x.
	 * @param {number} sy - Repeat y.
	 * @param {number} rotation - Rotation, in radians. Positive values rotate counterclockwise.
	 * @param {number} cx - Center x of rotation.
	 * @param {number} cy - Center y of rotation
	 * @return {Matrix3} A reference to this matrix.
	 */
	setUvTransform( tx, ty, sx, sy, rotation, cx, cy ) {

		const c = Math.cos( rotation );
		const s = Math.sin( rotation );

		this.set(
			sx * c, sx * s, - sx * ( c * cx + s * cy ) + cx + tx,
			- sy * s, sy * c, - sy * ( - s * cx + c * cy ) + cy + ty,
			0, 0, 1
		);

		return this;

	}

	/**
	 * Scales this matrix with the given scalar values.
	 *
	 * @param {number} sx - The amount to scale in the X axis.
	 * @param {number} sy - The amount to scale in the Y axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	scale( sx, sy ) {

		this.premultiply( _m3.makeScale( sx, sy ) );

		return this;

	}

	/**
	 * Rotates this matrix by the given angle.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix3} A reference to this matrix.
	 */
	rotate( theta ) {

		this.premultiply( _m3.makeRotation( - theta ) );

		return this;

	}

	/**
	 * Translates this matrix by the given scalar values.
	 *
	 * @param {number} tx - The amount to translate in the X axis.
	 * @param {number} ty - The amount to translate in the Y axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	translate( tx, ty ) {

		this.premultiply( _m3.makeTranslation( tx, ty ) );

		return this;

	}

	// for 2D Transforms

	/**
	 * Sets this matrix as a 2D translation transform.
	 *
	 * @param {number|Vector2} x - The amount to translate in the X axis or alternatively a translation vector.
	 * @param {number} y - The amount to translate in the Y axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	makeTranslation( x, y ) {

		if ( x.isVector2 ) {

			this.set(

				1, 0, x.x,
				0, 1, x.y,
				0, 0, 1

			);

		} else {

			this.set(

				1, 0, x,
				0, 1, y,
				0, 0, 1

			);

		}

		return this;

	}

	/**
	 * Sets this matrix as a 2D rotational transformation.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix3} A reference to this matrix.
	 */
	makeRotation( theta ) {

		// counterclockwise

		const c = Math.cos( theta );
		const s = Math.sin( theta );

		this.set(

			c, - s, 0,
			s, c, 0,
			0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a 2D scale transform.
	 *
	 * @param {number} x - The amount to scale in the X axis.
	 * @param {number} y - The amount to scale in the Y axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	makeScale( x, y ) {

		this.set(

			x, 0, 0,
			0, y, 0,
			0, 0, 1

		);

		return this;

	}

	/**
	 * Returns `true` if this matrix is equal with the given one.
	 *
	 * @param {Matrix3} matrix - The matrix to test for equality.
	 * @return {boolean} Whether this matrix is equal with the given one.
	 */
	equals( matrix ) {

		const te = this.elements;
		const me = matrix.elements;

		for ( let i = 0; i < 9; i ++ ) {

			if ( te[ i ] !== me[ i ] ) return false;

		}

		return true;

	}

	/**
	 * Sets the elements of the matrix from the given array.
	 *
	 * @param {Array<number>} array - The matrix elements in column-major order.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Matrix3} A reference to this matrix.
	 */
	fromArray( array, offset = 0 ) {

		for ( let i = 0; i < 9; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	}

	/**
	 * Writes the elements of this matrix to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the matrix elements in column-major order.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The matrix elements in column-major order.
	 */
	toArray( array = [], offset = 0 ) {

		const te = this.elements;

		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];

		array[ offset + 3 ] = te[ 3 ];
		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];

		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];
		array[ offset + 8 ] = te[ 8 ];

		return array;

	}

	/**
	 * Returns a matrix with copied values from this instance.
	 *
	 * @return {Matrix3} A clone of this instance.
	 */
	clone() {

		return new this.constructor().fromArray( this.elements );

	}

}

const _m3 = /*@__PURE__*/ new Matrix3();

function arrayNeedsUint32( array ) {

	// assumes larger values usually on last

	for ( let i = array.length - 1; i >= 0; -- i ) {

		if ( array[ i ] >= 65535 ) return true; // account for PRIMITIVE_RESTART_FIXED_INDEX, #24565

	}

	return false;

}

function createElementNS( name ) {

	return document.createElementNS( 'http://www.w3.org/1999/xhtml', name );

}

const LINEAR_REC709_TO_XYZ = /*@__PURE__*/ new Matrix3().set(
	0.4123908, 0.3575843, 0.1804808,
	0.2126390, 0.7151687, 0.0721923,
	0.0193308, 0.1191948, 0.9505322
);

const XYZ_TO_LINEAR_REC709 = /*@__PURE__*/ new Matrix3().set(
	3.2409699, -1.5373832, -0.4986108,
	-0.9692436, 1.8759675, 0.0415551,
	0.0556301, -0.203977, 1.0569715
);

function createColorManagement() {

	const ColorManagement = {

		enabled: true,

		workingColorSpace: LinearSRGBColorSpace,

		/**
		 * Implementations of supported color spaces.
		 *
		 * Required:
		 *	- primaries: chromaticity coordinates [ rx ry gx gy bx by ]
		 *	- whitePoint: reference white [ x y ]
		 *	- transfer: transfer function (pre-defined)
		 *	- toXYZ: Matrix3 RGB to XYZ transform
		 *	- fromXYZ: Matrix3 XYZ to RGB transform
		 *	- luminanceCoefficients: RGB luminance coefficients
		 *
		 * Optional:
		 *  - outputColorSpaceConfig: { drawingBufferColorSpace: ColorSpace }
		 *  - workingColorSpaceConfig: { unpackColorSpace: ColorSpace }
		 *
		 * Reference:
		 * - https://www.russellcottrell.com/photo/matrixCalculator.htm
		 */
		spaces: {},

		convert: function ( color, sourceColorSpace, targetColorSpace ) {

			if ( this.enabled === false || sourceColorSpace === targetColorSpace || ! sourceColorSpace || ! targetColorSpace ) {

				return color;

			}

			if ( this.spaces[ sourceColorSpace ].transfer === SRGBTransfer ) {

				color.r = SRGBToLinear( color.r );
				color.g = SRGBToLinear( color.g );
				color.b = SRGBToLinear( color.b );

			}

			if ( this.spaces[ sourceColorSpace ].primaries !== this.spaces[ targetColorSpace ].primaries ) {

				color.applyMatrix3( this.spaces[ sourceColorSpace ].toXYZ );
				color.applyMatrix3( this.spaces[ targetColorSpace ].fromXYZ );

			}

			if ( this.spaces[ targetColorSpace ].transfer === SRGBTransfer ) {

				color.r = LinearToSRGB( color.r );
				color.g = LinearToSRGB( color.g );
				color.b = LinearToSRGB( color.b );

			}

			return color;

		},

		fromWorkingColorSpace: function ( color, targetColorSpace ) {

			return this.convert( color, this.workingColorSpace, targetColorSpace );

		},

		toWorkingColorSpace: function ( color, sourceColorSpace ) {

			return this.convert( color, sourceColorSpace, this.workingColorSpace );

		},

		getPrimaries: function ( colorSpace ) {

			return this.spaces[ colorSpace ].primaries;

		},

		getTransfer: function ( colorSpace ) {

			if ( colorSpace === NoColorSpace ) return LinearTransfer;

			return this.spaces[ colorSpace ].transfer;

		},

		getLuminanceCoefficients: function ( target, colorSpace = this.workingColorSpace ) {

			return target.fromArray( this.spaces[ colorSpace ].luminanceCoefficients );

		},

		define: function ( colorSpaces ) {

			Object.assign( this.spaces, colorSpaces );

		},

		// Internal APIs

		_getMatrix: function ( targetMatrix, sourceColorSpace, targetColorSpace ) {

			return targetMatrix
				.copy( this.spaces[ sourceColorSpace ].toXYZ )
				.multiply( this.spaces[ targetColorSpace ].fromXYZ );

		},

		_getDrawingBufferColorSpace: function ( colorSpace ) {

			return this.spaces[ colorSpace ].outputColorSpaceConfig.drawingBufferColorSpace;

		},

		_getUnpackColorSpace: function ( colorSpace = this.workingColorSpace ) {

			return this.spaces[ colorSpace ].workingColorSpaceConfig.unpackColorSpace;

		}

	};

	/******************************************************************************
	 * sRGB definitions
	 */

	const REC709_PRIMARIES = [ 0.640, 0.330, 0.300, 0.600, 0.150, 0.060 ];
	const REC709_LUMINANCE_COEFFICIENTS = [ 0.2126, 0.7152, 0.0722 ];
	const D65 = [ 0.3127, 0.3290 ];

	ColorManagement.define( {

		[ LinearSRGBColorSpace ]: {
			primaries: REC709_PRIMARIES,
			whitePoint: D65,
			transfer: LinearTransfer,
			toXYZ: LINEAR_REC709_TO_XYZ,
			fromXYZ: XYZ_TO_LINEAR_REC709,
			luminanceCoefficients: REC709_LUMINANCE_COEFFICIENTS,
			workingColorSpaceConfig: { unpackColorSpace: SRGBColorSpace },
			outputColorSpaceConfig: { drawingBufferColorSpace: SRGBColorSpace }
		},

		[ SRGBColorSpace ]: {
			primaries: REC709_PRIMARIES,
			whitePoint: D65,
			transfer: SRGBTransfer,
			toXYZ: LINEAR_REC709_TO_XYZ,
			fromXYZ: XYZ_TO_LINEAR_REC709,
			luminanceCoefficients: REC709_LUMINANCE_COEFFICIENTS,
			outputColorSpaceConfig: { drawingBufferColorSpace: SRGBColorSpace }
		},

	} );

	return ColorManagement;

}

const ColorManagement = /*@__PURE__*/ createColorManagement();

function SRGBToLinear( c ) {

	return ( c < 0.04045 ) ? c * 0.0773993808 : Math.pow( c * 0.9478672986 + 0.0521327014, 2.4 );

}

function LinearToSRGB( c ) {

	return ( c < 0.0031308 ) ? c * 12.92 : 1.055 * ( Math.pow( c, 0.41666 ) ) - 0.055;

}

let _canvas;

/**
 * A class containing utility functions for images.
 *
 * @hideconstructor
 */
class ImageUtils {

	/**
	 * Returns a data URI containing a representation of the given image.
	 *
	 * @param {(HTMLImageElement|HTMLCanvasElement)} image - The image object.
	 * @param {string} [type='image/png'] - Indicates the image format.
	 * @return {string} The data URI.
	 */
	static getDataURL( image, type = 'image/png' ) {

		if ( /^data:/i.test( image.src ) ) {

			return image.src;

		}

		if ( typeof HTMLCanvasElement === 'undefined' ) {

			return image.src;

		}

		let canvas;

		if ( image instanceof HTMLCanvasElement ) {

			canvas = image;

		} else {

			if ( _canvas === undefined ) _canvas = createElementNS( 'canvas' );

			_canvas.width = image.width;
			_canvas.height = image.height;

			const context = _canvas.getContext( '2d' );

			if ( image instanceof ImageData ) {

				context.putImageData( image, 0, 0 );

			} else {

				context.drawImage( image, 0, 0, image.width, image.height );

			}

			canvas = _canvas;

		}

		return canvas.toDataURL( type );

	}

	/**
	 * Converts the given sRGB image data to linear color space.
	 *
	 * @param {(HTMLImageElement|HTMLCanvasElement|ImageBitmap|Object)} image - The image object.
	 * @return {HTMLCanvasElement|Object} The converted image.
	 */
	static sRGBToLinear( image ) {

		if ( ( typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement ) ||
			( typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement ) ||
			( typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap ) ) {

			const canvas = createElementNS( 'canvas' );

			canvas.width = image.width;
			canvas.height = image.height;

			const context = canvas.getContext( '2d' );
			context.drawImage( image, 0, 0, image.width, image.height );

			const imageData = context.getImageData( 0, 0, image.width, image.height );
			const data = imageData.data;

			for ( let i = 0; i < data.length; i ++ ) {

				data[ i ] = SRGBToLinear( data[ i ] / 255 ) * 255;

			}

			context.putImageData( imageData, 0, 0 );

			return canvas;

		} else if ( image.data ) {

			const data = image.data.slice( 0 );

			for ( let i = 0; i < data.length; i ++ ) {

				if ( data instanceof Uint8Array || data instanceof Uint8ClampedArray ) {

					data[ i ] = Math.floor( SRGBToLinear( data[ i ] / 255 ) * 255 );

				} else {

					// assuming float

					data[ i ] = SRGBToLinear( data[ i ] );

				}

			}

			return {
				data: data,
				width: image.width,
				height: image.height
			};

		} else {

			console.warn( 'THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.' );
			return image;

		}

	}

}

let _sourceId = 0;

/**
 * Represents the data source of a texture.
 *
 * The main purpose of this class is to decouple the data definition from the texture
 * definition so the same data can be used with multiple texture instances.
 */
class Source {

	/**
	 * Constructs a new video texture.
	 *
	 * @param {any} [data=null] - The data definition of a texture.
	 */
	constructor( data = null ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isSource = true;

		/**
		 * The ID of the source.
		 *
		 * @name Source#id
		 * @type {number}
		 * @readonly
		 */
		Object.defineProperty( this, 'id', { value: _sourceId ++ } );

		/**
		 * The UUID of the source.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.uuid = generateUUID();

		/**
		 * The data definition of a texture.
		 *
		 * @type {any}
		 */
		this.data = data;

		/**
		 * This property is only relevant when {@link Source#needsUpdate} is set to `true` and
		 * provides more control on how texture data should be processed. When `dataReady` is set
		 * to `false`, the engine performs the memory allocation (if necessary) but does not transfer
		 * the data into the GPU memory.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.dataReady = true;

		/**
		 * This starts at `0` and counts how many times {@link Source#needsUpdate} is set to `true`.
		 *
		 * @type {number}
		 * @readonly
		 * @default 0
		 */
		this.version = 0;

	}

	/**
	 * When the property is set to `true`, the engine allocates the memory
	 * for the texture (if necessary) and triggers the actual texture upload
	 * to the GPU next time the source is used.
	 *
	 * @type {boolean}
	 * @default false
	 * @param {boolean} value
	 */
	set needsUpdate( value ) {

		if ( value === true ) this.version ++;

	}

	/**
	 * Serializes the source into JSON.
	 *
	 * @param {?(Object|string)} meta - An optional value holding meta information about the serialization.
	 * @return {Object} A JSON object representing the serialized source.
	 * @see {@link ObjectLoader#parse}
	 */
	toJSON( meta ) {

		const isRootObject = ( meta === undefined || typeof meta === 'string' );

		if ( ! isRootObject && meta.images[ this.uuid ] !== undefined ) {

			return meta.images[ this.uuid ];

		}

		const output = {
			uuid: this.uuid,
			url: ''
		};

		const data = this.data;

		if ( data !== null ) {

			let url;

			if ( Array.isArray( data ) ) {

				// cube texture

				url = [];

				for ( let i = 0, l = data.length; i < l; i ++ ) {

					if ( data[ i ].isDataTexture ) {

						url.push( serializeImage( data[ i ].image ) );

					} else {

						url.push( serializeImage( data[ i ] ) );

					}

				}

			} else {

				// texture

				url = serializeImage( data );

			}

			output.url = url;

		}

		if ( ! isRootObject ) {

			meta.images[ this.uuid ] = output;

		}

		return output;

	}

}

function serializeImage( image ) {

	if ( ( typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement ) ||
		( typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement ) ||
		( typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap ) ) {

		// default images

		return ImageUtils.getDataURL( image );

	} else {

		if ( image.data ) {

			// images of DataTexture

			return {
				data: Array.from( image.data ),
				width: image.width,
				height: image.height,
				type: image.data.constructor.name
			};

		} else {

			console.warn( 'THREE.Texture: Unable to serialize Texture.' );
			return {};

		}

	}

}

let _textureId = 0;

/**
 * Base class for all textures.
 *
 * Note: After the initial use of a texture, its dimensions, format, and type
 * cannot be changed. Instead, call {@link Texture#dispose} on the texture and instantiate a new one.
 *
 * @augments EventDispatcher
 */
class Texture extends EventDispatcher {

	/**
	 * Constructs a new texture.
	 *
	 * @param {?Object} [image=Texture.DEFAULT_IMAGE] - The image holding the texture data.
	 * @param {number} [mapping=Texture.DEFAULT_MAPPING] - The texture mapping.
	 * @param {number} [wrapS=ClampToEdgeWrapping] - The wrapS value.
	 * @param {number} [wrapT=ClampToEdgeWrapping] - The wrapT value.
	 * @param {number} [magFilter=LinearFilter] - The mag filter value.
	 * @param {number} [minFilter=LinearMipmapLinearFilter] - The min filter value.
	 * @param {number} [format=RGBAFormat] - The texture format.
	 * @param {number} [type=UnsignedByteType] - The texture type.
	 * @param {number} [anisotropy=Texture.DEFAULT_ANISOTROPY] - The anisotropy value.
	 * @param {string} [colorSpace=NoColorSpace] - The color space.
	 */
	constructor( image = Texture.DEFAULT_IMAGE, mapping = Texture.DEFAULT_MAPPING, wrapS = ClampToEdgeWrapping, wrapT = ClampToEdgeWrapping, magFilter = LinearFilter, minFilter = LinearMipmapLinearFilter, format = RGBAFormat, type = UnsignedByteType, anisotropy = Texture.DEFAULT_ANISOTROPY, colorSpace = NoColorSpace ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isTexture = true;

		/**
		 * The ID of the texture.
		 *
		 * @name Texture#id
		 * @type {number}
		 * @readonly
		 */
		Object.defineProperty( this, 'id', { value: _textureId ++ } );

		/**
		 * The UUID of the material.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.uuid = generateUUID();

		/**
		 * The name of the material.
		 *
		 * @type {string}
		 */
		this.name = '';

		/**
		 * The data definition of a texture. A reference to the data source can be
		 * shared across textures. This is often useful in context of spritesheets
		 * where multiple textures render the same data but with different texture
		 * transformations.
		 *
		 * @type {Source}
		 */
		this.source = new Source( image );

		/**
		 * An array holding user-defined mipmaps.
		 *
		 * @type {Array<Object>}
		 */
		this.mipmaps = [];

		/**
		 * How the texture is applied to the object. The value `UVMapping`
		 * is the default, where texture or uv coordinates are used to apply the map.
		 *
		 * @type {(UVMapping|CubeReflectionMapping|CubeRefractionMapping|EquirectangularReflectionMapping|EquirectangularRefractionMapping|CubeUVReflectionMapping)}
		 * @default UVMapping
		*/
		this.mapping = mapping;

		/**
		 * Lets you select the uv attribute to map the texture to. `0` for `uv`,
		 * `1` for `uv1`, `2` for `uv2` and `3` for `uv3`.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.channel = 0;

		/**
		 * This defines how the texture is wrapped horizontally and corresponds to
		 * *U* in UV mapping.
		 *
		 * @type {(RepeatWrapping|ClampToEdgeWrapping|MirroredRepeatWrapping)}
		 * @default ClampToEdgeWrapping
		 */
		this.wrapS = wrapS;

		/**
		 * This defines how the texture is wrapped horizontally and corresponds to
		 * *V* in UV mapping.
		 *
		 * @type {(RepeatWrapping|ClampToEdgeWrapping|MirroredRepeatWrapping)}
		 * @default ClampToEdgeWrapping
		 */
		this.wrapT = wrapT;

		/**
		 * How the texture is sampled when a texel covers more than one pixel.
		 *
		 * @type {(NearestFilter|NearestMipmapNearestFilter|NearestMipmapLinearFilter|LinearFilter|LinearMipmapNearestFilter|LinearMipmapLinearFilter)}
		 * @default LinearFilter
		 */
		this.magFilter = magFilter;

		/**
		 * How the texture is sampled when a texel covers less than one pixel.
		 *
		 * @type {(NearestFilter|NearestMipmapNearestFilter|NearestMipmapLinearFilter|LinearFilter|LinearMipmapNearestFilter|LinearMipmapLinearFilter)}
		 * @default LinearMipmapLinearFilter
		 */
		this.minFilter = minFilter;

		/**
		 * The number of samples taken along the axis through the pixel that has the
		 * highest density of texels. By default, this value is `1`. A higher value
		 * gives a less blurry result than a basic mipmap, at the cost of more
		 * texture samples being used.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.anisotropy = anisotropy;

		/**
		 * The format of the texture.
		 *
		 * @type {number}
		 * @default RGBAFormat
		 */
		this.format = format;

		/**
		 * The default internal format is derived from {@link Texture#format} and {@link Texture#type} and
		 * defines how the texture data is going to be stored on the GPU.
		 *
		 * This property allows to overwrite the default format.
		 *
		 * @type {?string}
		 * @default null
		 */
		this.internalFormat = null;

		/**
		 * The data type of the texture.
		 *
		 * @type {number}
		 * @default UnsignedByteType
		 */
		this.type = type;

		/**
		 * How much a single repetition of the texture is offset from the beginning,
		 * in each direction U and V. Typical range is `0.0` to `1.0`.
		 *
		 * @type {Vector2}
		 * @default (0,0)
		 */
		this.offset = new Vector2( 0, 0 );

		/**
		 * How many times the texture is repeated across the surface, in each
		 * direction U and V. If repeat is set greater than `1` in either direction,
		 * the corresponding wrap parameter should also be set to `RepeatWrapping`
		 * or `MirroredRepeatWrapping` to achieve the desired tiling effect.
		 *
		 * @type {Vector2}
		 * @default (1,1)
		 */
		this.repeat = new Vector2( 1, 1 );

		/**
		 * The point around which rotation occurs. A value of `(0.5, 0.5)` corresponds
		 * to the center of the texture. Default is `(0, 0)`, the lower left.
		 *
		 * @type {Vector2}
		 * @default (0,0)
		 */
		this.center = new Vector2( 0, 0 );

		/**
		 * How much the texture is rotated around the center point, in radians.
		 * Positive values are counter-clockwise.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.rotation = 0;

		/**
		 * Whether to update the texture's uv-transformation {@link Texture#matrix}
		 * from the properties {@link Texture#offset}, {@link Texture#repeat},
		 * {@link Texture#rotation}, and {@link Texture#center}.
		 *
		 * Set this to `false` if you are specifying the uv-transform matrix directly.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.matrixAutoUpdate = true;

		/**
		 * The uv-transformation matrix of the texture.
		 *
		 * @type {Matrix3}
		 */
		this.matrix = new Matrix3();

		/**
		 * Whether to generate mipmaps (if possible) for a texture.
		 *
		 * Set this to `false` if you are creating mipmaps manually.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.generateMipmaps = true;

		/**
		 * If set to `true`, the alpha channel, if present, is multiplied into the
		 * color channels when the texture is uploaded to the GPU.
		 *
		 * Note that this property has no effect when using `ImageBitmap`. You need to
		 * configure premultiply alpha on bitmap creation instead.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.premultiplyAlpha = false;

		/**
		 * If set to `true`, the texture is flipped along the vertical axis when
		 * uploaded to the GPU.
		 *
		 * Note that this property has no effect when using `ImageBitmap`. You need to
		 * configure the flip on bitmap creation instead.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.flipY = true;

		/**
		 * Specifies the alignment requirements for the start of each pixel row in memory.
		 * The allowable values are `1` (byte-alignment), `2` (rows aligned to even-numbered bytes),
		 * `4` (word-alignment), and `8` (rows start on double-word boundaries).
		 *
		 * @type {number}
		 * @default 4
		 */
		this.unpackAlignment = 4;	// valid values: 1, 2, 4, 8 (see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml)

		/**
		 * Textures containing color data should be annotated with `SRGBColorSpace` or `LinearSRGBColorSpace`.
		 *
		 * @type {string}
		 * @default NoColorSpace
		 */
		this.colorSpace = colorSpace;

		/**
		 * An object that can be used to store custom data about the texture. It
		 * should not hold references to functions as these will not be cloned.
		 *
		 * @type {Object}
		 */
		this.userData = {};

		/**
		 * This starts at `0` and counts how many times {@link Texture#needsUpdate} is set to `true`.
		 *
		 * @type {number}
		 * @readonly
		 * @default 0
		 */
		this.version = 0;

		/**
		 * A callback function, called when the texture is updated (e.g., when
		 * {@link Texture#needsUpdate} has been set to true and then the texture is used).
		 *
		 * @type {?Function}
		 * @default null
		 */
		this.onUpdate = null;

		/**
		 * An optional back reference to the textures render target.
		 *
		 * @type {?(RenderTarget|WebGLRenderTarget)}
		 * @default null
		 */
		this.renderTarget = null;

		/**
		 * Indicates whether a texture belongs to a render target or not.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default false
		 */
		this.isRenderTargetTexture = false;

		/**
		 * Indicates whether this texture should be processed by `PMREMGenerator` or not
		 * (only relevant for render target textures).
		 *
		 * @type {number}
		 * @readonly
		 * @default 0
		 */
		this.pmremVersion = 0;

	}

	/**
	 * The image object holding the texture data.
	 *
	 * @type {?Object}
	 */
	get image() {

		return this.source.data;

	}

	set image( value = null ) {

		this.source.data = value;

	}

	/**
	 * Updates the texture transformation matrix from the from the properties {@link Texture#offset},
	 * {@link Texture#repeat}, {@link Texture#rotation}, and {@link Texture#center}.
	 */
	updateMatrix() {

		this.matrix.setUvTransform( this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y );

	}

	/**
	 * Returns a new texture with copied values from this instance.
	 *
	 * @return {Texture} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

	/**
	 * Copies the values of the given texture to this instance.
	 *
	 * @param {Texture} source - The texture to copy.
	 * @return {Texture} A reference to this instance.
	 */
	copy( source ) {

		this.name = source.name;

		this.source = source.source;
		this.mipmaps = source.mipmaps.slice( 0 );

		this.mapping = source.mapping;
		this.channel = source.channel;

		this.wrapS = source.wrapS;
		this.wrapT = source.wrapT;

		this.magFilter = source.magFilter;
		this.minFilter = source.minFilter;

		this.anisotropy = source.anisotropy;

		this.format = source.format;
		this.internalFormat = source.internalFormat;
		this.type = source.type;

		this.offset.copy( source.offset );
		this.repeat.copy( source.repeat );
		this.center.copy( source.center );
		this.rotation = source.rotation;

		this.matrixAutoUpdate = source.matrixAutoUpdate;
		this.matrix.copy( source.matrix );

		this.generateMipmaps = source.generateMipmaps;
		this.premultiplyAlpha = source.premultiplyAlpha;
		this.flipY = source.flipY;
		this.unpackAlignment = source.unpackAlignment;
		this.colorSpace = source.colorSpace;

		this.renderTarget = source.renderTarget;
		this.isRenderTargetTexture = source.isRenderTargetTexture;

		this.userData = JSON.parse( JSON.stringify( source.userData ) );

		this.needsUpdate = true;

		return this;

	}

	/**
	 * Serializes the texture into JSON.
	 *
	 * @param {?(Object|string)} meta - An optional value holding meta information about the serialization.
	 * @return {Object} A JSON object representing the serialized texture.
	 * @see {@link ObjectLoader#parse}
	 */
	toJSON( meta ) {

		const isRootObject = ( meta === undefined || typeof meta === 'string' );

		if ( ! isRootObject && meta.textures[ this.uuid ] !== undefined ) {

			return meta.textures[ this.uuid ];

		}

		const output = {

			metadata: {
				version: 4.6,
				type: 'Texture',
				generator: 'Texture.toJSON'
			},

			uuid: this.uuid,
			name: this.name,

			image: this.source.toJSON( meta ).uuid,

			mapping: this.mapping,
			channel: this.channel,

			repeat: [ this.repeat.x, this.repeat.y ],
			offset: [ this.offset.x, this.offset.y ],
			center: [ this.center.x, this.center.y ],
			rotation: this.rotation,

			wrap: [ this.wrapS, this.wrapT ],

			format: this.format,
			internalFormat: this.internalFormat,
			type: this.type,
			colorSpace: this.colorSpace,

			minFilter: this.minFilter,
			magFilter: this.magFilter,
			anisotropy: this.anisotropy,

			flipY: this.flipY,

			generateMipmaps: this.generateMipmaps,
			premultiplyAlpha: this.premultiplyAlpha,
			unpackAlignment: this.unpackAlignment

		};

		if ( Object.keys( this.userData ).length > 0 ) output.userData = this.userData;

		if ( ! isRootObject ) {

			meta.textures[ this.uuid ] = output;

		}

		return output;

	}

	/**
	 * Frees the GPU-related resources allocated by this instance. Call this
	 * method whenever this instance is no longer used in your app.
	 *
	 * @fires Texture#dispose
	 */
	dispose() {

		/**
		 * Fires when the texture has been disposed of.
		 *
		 * @event Texture#dispose
		 * @type {Object}
		 */
		this.dispatchEvent( { type: 'dispose' } );

	}

	/**
	 * Transforms the given uv vector with the textures uv transformation matrix.
	 *
	 * @param {Vector2} uv - The uv vector.
	 * @return {Vector2} The transformed uv vector.
	 */
	transformUv( uv ) {

		if ( this.mapping !== UVMapping ) return uv;

		uv.applyMatrix3( this.matrix );

		if ( uv.x < 0 || uv.x > 1 ) {

			switch ( this.wrapS ) {

				case RepeatWrapping:

					uv.x = uv.x - Math.floor( uv.x );
					break;

				case ClampToEdgeWrapping:

					uv.x = uv.x < 0 ? 0 : 1;
					break;

				case MirroredRepeatWrapping:

					if ( Math.abs( Math.floor( uv.x ) % 2 ) === 1 ) {

						uv.x = Math.ceil( uv.x ) - uv.x;

					} else {

						uv.x = uv.x - Math.floor( uv.x );

					}

					break;

			}

		}

		if ( uv.y < 0 || uv.y > 1 ) {

			switch ( this.wrapT ) {

				case RepeatWrapping:

					uv.y = uv.y - Math.floor( uv.y );
					break;

				case ClampToEdgeWrapping:

					uv.y = uv.y < 0 ? 0 : 1;
					break;

				case MirroredRepeatWrapping:

					if ( Math.abs( Math.floor( uv.y ) % 2 ) === 1 ) {

						uv.y = Math.ceil( uv.y ) - uv.y;

					} else {

						uv.y = uv.y - Math.floor( uv.y );

					}

					break;

			}

		}

		if ( this.flipY ) {

			uv.y = 1 - uv.y;

		}

		return uv;

	}

	/**
	 * Setting this property to `true` indicates the engine the texture
	 * must be updated in the next render. This triggers a texture upload
	 * to the GPU and ensures correct texture parameter configuration.
	 *
	 * @type {boolean}
	 * @default false
	 * @param {boolean} value
	 */
	set needsUpdate( value ) {

		if ( value === true ) {

			this.version ++;
			this.source.needsUpdate = true;

		}

	}

	/**
	 * Setting this property to `true` indicates the engine the PMREM
	 * must be regenerated.
	 *
	 * @type {boolean}
	 * @default false
	 * @param {boolean} value
	 */
	set needsPMREMUpdate( value ) {

		if ( value === true ) {

			this.pmremVersion ++;

		}

	}

}

/**
 * The default image for all textures.
 *
 * @static
 * @type {?Image}
 * @default null
 */
Texture.DEFAULT_IMAGE = null;

/**
 * The default mapping for all textures.
 *
 * @static
 * @type {number}
 * @default UVMapping
 */
Texture.DEFAULT_MAPPING = UVMapping;

/**
 * The default anisotropy value for all textures.
 *
 * @static
 * @type {number}
 * @default 1
 */
Texture.DEFAULT_ANISOTROPY = 1;

/**
 * Class representing a 4D vector. A 4D vector is an ordered quadruplet of numbers
 * (labeled x, y, z and w), which can be used to represent a number of things, such as:
 *
 * - A point in 4D space.
 * - A direction and length in 4D space. In three.js the length will
 * always be the Euclidean distance(straight-line distance) from `(0, 0, 0, 0)` to `(x, y, z, w)`
 * and the direction is also measured from `(0, 0, 0, 0)` towards `(x, y, z, w)`.
 * - Any arbitrary ordered quadruplet of numbers.
 *
 * There are other things a 4D vector can be used to represent, however these
 * are the most common uses in *three.js*.
 *
 * Iterating through a vector instance will yield its components `(x, y, z, w)` in
 * the corresponding order.
 * ```js
 * const a = new THREE.Vector4( 0, 1, 0, 0 );
 *
 * //no arguments; will be initialised to (0, 0, 0, 1)
 * const b = new THREE.Vector4( );
 *
 * const d = a.dot( b );
 * ```
 */
class Vector4 {

	/**
	 * Constructs a new 4D vector.
	 *
	 * @param {number} [x=0] - The x value of this vector.
	 * @param {number} [y=0] - The y value of this vector.
	 * @param {number} [z=0] - The z value of this vector.
	 * @param {number} [w=1] - The w value of this vector.
	 */
	constructor( x = 0, y = 0, z = 0, w = 1 ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Vector4.prototype.isVector4 = true;

		/**
		 * The x value of this vector.
		 *
		 * @type {number}
		 */
		this.x = x;

		/**
		 * The y value of this vector.
		 *
		 * @type {number}
		 */
		this.y = y;

		/**
		 * The z value of this vector.
		 *
		 * @type {number}
		 */
		this.z = z;

		/**
		 * The w value of this vector.
		 *
		 * @type {number}
		 */
		this.w = w;

	}

	/**
	 * Alias for {@link Vector4#z}.
	 *
	 * @type {number}
	 */
	get width() {

		return this.z;

	}

	set width( value ) {

		this.z = value;

	}

	/**
	 * Alias for {@link Vector4#w}.
	 *
	 * @type {number}
	 */
	get height() {

		return this.w;

	}

	set height( value ) {

		this.w = value;

	}

	/**
	 * Sets the vector components.
	 *
	 * @param {number} x - The value of the x component.
	 * @param {number} y - The value of the y component.
	 * @param {number} z - The value of the z component.
	 * @param {number} w - The value of the w component.
	 * @return {Vector4} A reference to this vector.
	 */
	set( x, y, z, w ) {

		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

		return this;

	}

	/**
	 * Sets the vector components to the same value.
	 *
	 * @param {number} scalar - The value to set for all vector components.
	 * @return {Vector4} A reference to this vector.
	 */
	setScalar( scalar ) {

		this.x = scalar;
		this.y = scalar;
		this.z = scalar;
		this.w = scalar;

		return this;

	}

	/**
	 * Sets the vector's x component to the given value
	 *
	 * @param {number} x - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setX( x ) {

		this.x = x;

		return this;

	}

	/**
	 * Sets the vector's y component to the given value
	 *
	 * @param {number} y - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setY( y ) {

		this.y = y;

		return this;

	}

	/**
	 * Sets the vector's z component to the given value
	 *
	 * @param {number} z - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setZ( z ) {

		this.z = z;

		return this;

	}

	/**
	 * Sets the vector's w component to the given value
	 *
	 * @param {number} w - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setW( w ) {

		this.w = w;

		return this;

	}

	/**
	 * Allows to set a vector component with an index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y,
	 * `2` equals to z, `3` equals to w.
	 * @param {number} value - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setComponent( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			case 3: this.w = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	}

	/**
	 * Returns the value of the vector component which matches the given index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y,
	 * `2` equals to z, `3` equals to w.
	 * @return {number} A vector component value.
	 */
	getComponent( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			case 3: return this.w;
			default: throw new Error( 'index is out of range: ' + index );

		}

	}

	/**
	 * Returns a new vector with copied values from this instance.
	 *
	 * @return {Vector4} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this.x, this.y, this.z, this.w );

	}

	/**
	 * Copies the values of the given vector to this instance.
	 *
	 * @param {Vector3|Vector4} v - The vector to copy.
	 * @return {Vector4} A reference to this vector.
	 */
	copy( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		this.w = ( v.w !== undefined ) ? v.w : 1;

		return this;

	}

	/**
	 * Adds the given vector to this instance.
	 *
	 * @param {Vector4} v - The vector to add.
	 * @return {Vector4} A reference to this vector.
	 */
	add( v ) {

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		this.w += v.w;

		return this;

	}

	/**
	 * Adds the given scalar value to all components of this instance.
	 *
	 * @param {number} s - The scalar to add.
	 * @return {Vector4} A reference to this vector.
	 */
	addScalar( s ) {

		this.x += s;
		this.y += s;
		this.z += s;
		this.w += s;

		return this;

	}

	/**
	 * Adds the given vectors and stores the result in this instance.
	 *
	 * @param {Vector4} a - The first vector.
	 * @param {Vector4} b - The second vector.
	 * @return {Vector4} A reference to this vector.
	 */
	addVectors( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;
		this.w = a.w + b.w;

		return this;

	}

	/**
	 * Adds the given vector scaled by the given factor to this instance.
	 *
	 * @param {Vector4} v - The vector.
	 * @param {number} s - The factor that scales `v`.
	 * @return {Vector4} A reference to this vector.
	 */
	addScaledVector( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;
		this.w += v.w * s;

		return this;

	}

	/**
	 * Subtracts the given vector from this instance.
	 *
	 * @param {Vector4} v - The vector to subtract.
	 * @return {Vector4} A reference to this vector.
	 */
	sub( v ) {

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		this.w -= v.w;

		return this;

	}

	/**
	 * Subtracts the given scalar value from all components of this instance.
	 *
	 * @param {number} s - The scalar to subtract.
	 * @return {Vector4} A reference to this vector.
	 */
	subScalar( s ) {

		this.x -= s;
		this.y -= s;
		this.z -= s;
		this.w -= s;

		return this;

	}

	/**
	 * Subtracts the given vectors and stores the result in this instance.
	 *
	 * @param {Vector4} a - The first vector.
	 * @param {Vector4} b - The second vector.
	 * @return {Vector4} A reference to this vector.
	 */
	subVectors( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;
		this.w = a.w - b.w;

		return this;

	}

	/**
	 * Multiplies the given vector with this instance.
	 *
	 * @param {Vector4} v - The vector to multiply.
	 * @return {Vector4} A reference to this vector.
	 */
	multiply( v ) {

		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;
		this.w *= v.w;

		return this;

	}

	/**
	 * Multiplies the given scalar value with all components of this instance.
	 *
	 * @param {number} scalar - The scalar to multiply.
	 * @return {Vector4} A reference to this vector.
	 */
	multiplyScalar( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		this.w *= scalar;

		return this;

	}

	/**
	 * Multiplies this vector with the given 4x4 matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Vector4} A reference to this vector.
	 */
	applyMatrix4( m ) {

		const x = this.x, y = this.y, z = this.z, w = this.w;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] * w;
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] * w;
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] * w;
		this.w = e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] * w;

		return this;

	}

	/**
	 * Divides this instance by the given vector.
	 *
	 * @param {Vector4} v - The vector to divide.
	 * @return {Vector4} A reference to this vector.
	 */
	divide( v ) {

		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;
		this.w /= v.w;

		return this;

	}

	/**
	 * Divides this vector by the given scalar.
	 *
	 * @param {number} scalar - The scalar to divide.
	 * @return {Vector4} A reference to this vector.
	 */
	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	}

	/**
	 * Sets the x, y and z components of this
	 * vector to the quaternion's axis and w to the angle.
	 *
	 * @param {Quaternion} q - The Quaternion to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setAxisAngleFromQuaternion( q ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm

		// q is assumed to be normalized

		this.w = 2 * Math.acos( q.w );

		const s = Math.sqrt( 1 - q.w * q.w );

		if ( s < 0.0001 ) {

			this.x = 1;
			this.y = 0;
			this.z = 0;

		} else {

			this.x = q.x / s;
			this.y = q.y / s;
			this.z = q.z / s;

		}

		return this;

	}

	/**
	 * Sets the x, y and z components of this
	 * vector to the axis of rotation and w to the angle.
	 *
	 * @param {Matrix4} m - A 4x4 matrix of which the upper left 3x3 matrix is a pure rotation matrix.
	 * @return {Vector4} A reference to this vector.
	 */
	setAxisAngleFromRotationMatrix( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		let angle, x, y, z; // variables for result
		const epsilon = 0.01,		// margin to allow for rounding errors
			epsilon2 = 0.1,		// margin to distinguish between 0 and 180 degrees

			te = m.elements,

			m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
			m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
			m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

		if ( ( Math.abs( m12 - m21 ) < epsilon ) &&
		     ( Math.abs( m13 - m31 ) < epsilon ) &&
		     ( Math.abs( m23 - m32 ) < epsilon ) ) {

			// singularity found
			// first check for identity matrix which must have +1 for all terms
			// in leading diagonal and zero in other terms

			if ( ( Math.abs( m12 + m21 ) < epsilon2 ) &&
			     ( Math.abs( m13 + m31 ) < epsilon2 ) &&
			     ( Math.abs( m23 + m32 ) < epsilon2 ) &&
			     ( Math.abs( m11 + m22 + m33 - 3 ) < epsilon2 ) ) {

				// this singularity is identity matrix so angle = 0

				this.set( 1, 0, 0, 0 );

				return this; // zero angle, arbitrary axis

			}

			// otherwise this singularity is angle = 180

			angle = Math.PI;

			const xx = ( m11 + 1 ) / 2;
			const yy = ( m22 + 1 ) / 2;
			const zz = ( m33 + 1 ) / 2;
			const xy = ( m12 + m21 ) / 4;
			const xz = ( m13 + m31 ) / 4;
			const yz = ( m23 + m32 ) / 4;

			if ( ( xx > yy ) && ( xx > zz ) ) {

				// m11 is the largest diagonal term

				if ( xx < epsilon ) {

					x = 0;
					y = 0.707106781;
					z = 0.707106781;

				} else {

					x = Math.sqrt( xx );
					y = xy / x;
					z = xz / x;

				}

			} else if ( yy > zz ) {

				// m22 is the largest diagonal term

				if ( yy < epsilon ) {

					x = 0.707106781;
					y = 0;
					z = 0.707106781;

				} else {

					y = Math.sqrt( yy );
					x = xy / y;
					z = yz / y;

				}

			} else {

				// m33 is the largest diagonal term so base result on this

				if ( zz < epsilon ) {

					x = 0.707106781;
					y = 0.707106781;
					z = 0;

				} else {

					z = Math.sqrt( zz );
					x = xz / z;
					y = yz / z;

				}

			}

			this.set( x, y, z, angle );

			return this; // return 180 deg rotation

		}

		// as we have reached here there are no singularities so we can handle normally

		let s = Math.sqrt( ( m32 - m23 ) * ( m32 - m23 ) +
			( m13 - m31 ) * ( m13 - m31 ) +
			( m21 - m12 ) * ( m21 - m12 ) ); // used to normalize

		if ( Math.abs( s ) < 0.001 ) s = 1;

		// prevent divide by zero, should not happen if matrix is orthogonal and should be
		// caught by singularity test above, but I've left it in just in case

		this.x = ( m32 - m23 ) / s;
		this.y = ( m13 - m31 ) / s;
		this.z = ( m21 - m12 ) / s;
		this.w = Math.acos( ( m11 + m22 + m33 - 1 ) / 2 );

		return this;

	}

	/**
	 * Sets the vector components to the position elements of the
	 * given transformation matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Vector4} A reference to this vector.
	 */
	setFromMatrixPosition( m ) {

		const e = m.elements;

		this.x = e[ 12 ];
		this.y = e[ 13 ];
		this.z = e[ 14 ];
		this.w = e[ 15 ];

		return this;

	}

	/**
	 * If this vector's x, y, z or w value is greater than the given vector's x, y, z or w
	 * value, replace that value with the corresponding min value.
	 *
	 * @param {Vector4} v - The vector.
	 * @return {Vector4} A reference to this vector.
	 */
	min( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );
		this.z = Math.min( this.z, v.z );
		this.w = Math.min( this.w, v.w );

		return this;

	}

	/**
	 * If this vector's x, y, z or w value is less than the given vector's x, y, z or w
	 * value, replace that value with the corresponding max value.
	 *
	 * @param {Vector4} v - The vector.
	 * @return {Vector4} A reference to this vector.
	 */
	max( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );
		this.z = Math.max( this.z, v.z );
		this.w = Math.max( this.w, v.w );

		return this;

	}

	/**
	 * If this vector's x, y, z or w value is greater than the max vector's x, y, z or w
	 * value, it is replaced by the corresponding value.
	 * If this vector's x, y, z or w value is less than the min vector's x, y, z or w value,
	 * it is replaced by the corresponding value.
	 *
	 * @param {Vector4} min - The minimum x, y and z values.
	 * @param {Vector4} max - The maximum x, y and z values in the desired range.
	 * @return {Vector4} A reference to this vector.
	 */
	clamp( min, max ) {

		// assumes min < max, componentwise

		this.x = clamp( this.x, min.x, max.x );
		this.y = clamp( this.y, min.y, max.y );
		this.z = clamp( this.z, min.z, max.z );
		this.w = clamp( this.w, min.w, max.w );

		return this;

	}

	/**
	 * If this vector's x, y, z or w values are greater than the max value, they are
	 * replaced by the max value.
	 * If this vector's x, y, z or w values are less than the min value, they are
	 * replaced by the min value.
	 *
	 * @param {number} minVal - The minimum value the components will be clamped to.
	 * @param {number} maxVal - The maximum value the components will be clamped to.
	 * @return {Vector4} A reference to this vector.
	 */
	clampScalar( minVal, maxVal ) {

		this.x = clamp( this.x, minVal, maxVal );
		this.y = clamp( this.y, minVal, maxVal );
		this.z = clamp( this.z, minVal, maxVal );
		this.w = clamp( this.w, minVal, maxVal );

		return this;

	}

	/**
	 * If this vector's length is greater than the max value, it is replaced by
	 * the max value.
	 * If this vector's length is less than the min value, it is replaced by the
	 * min value.
	 *
	 * @param {number} min - The minimum value the vector length will be clamped to.
	 * @param {number} max - The maximum value the vector length will be clamped to.
	 * @return {Vector4} A reference to this vector.
	 */
	clampLength( min, max ) {

		const length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( clamp( length, min, max ) );

	}

	/**
	 * The components of this vector are rounded down to the nearest integer value.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	floor() {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );
		this.w = Math.floor( this.w );

		return this;

	}

	/**
	 * The components of this vector are rounded up to the nearest integer value.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	ceil() {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );
		this.w = Math.ceil( this.w );

		return this;

	}

	/**
	 * The components of this vector are rounded to the nearest integer value
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	round() {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );
		this.w = Math.round( this.w );

		return this;

	}

	/**
	 * The components of this vector are rounded towards zero (up if negative,
	 * down if positive) to an integer value.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	roundToZero() {

		this.x = Math.trunc( this.x );
		this.y = Math.trunc( this.y );
		this.z = Math.trunc( this.z );
		this.w = Math.trunc( this.w );

		return this;

	}

	/**
	 * Inverts this vector - i.e. sets x = -x, y = -y, z = -z, w = -w.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	negate() {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;
		this.w = - this.w;

		return this;

	}

	/**
	 * Calculates the dot product of the given vector with this instance.
	 *
	 * @param {Vector4} v - The vector to compute the dot product with.
	 * @return {number} The result of the dot product.
	 */
	dot( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;

	}

	/**
	 * Computes the square of the Euclidean length (straight-line length) from
	 * (0, 0, 0, 0) to (x, y, z, w). If you are comparing the lengths of vectors, you should
	 * compare the length squared instead as it is slightly more efficient to calculate.
	 *
	 * @return {number} The square length of this vector.
	 */
	lengthSq() {

		return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;

	}

	/**
	 * Computes the  Euclidean length (straight-line length) from (0, 0, 0, 0) to (x, y, z, w).
	 *
	 * @return {number} The length of this vector.
	 */
	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

	}

	/**
	 * Computes the Manhattan length of this vector.
	 *
	 * @return {number} The length of this vector.
	 */
	manhattanLength() {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z ) + Math.abs( this.w );

	}

	/**
	 * Converts this vector to a unit vector - that is, sets it equal to a vector
	 * with the same direction as this one, but with a vector length of `1`.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	normalize() {

		return this.divideScalar( this.length() || 1 );

	}

	/**
	 * Sets this vector to a vector with the same direction as this one, but
	 * with the specified length.
	 *
	 * @param {number} length - The new length of this vector.
	 * @return {Vector4} A reference to this vector.
	 */
	setLength( length ) {

		return this.normalize().multiplyScalar( length );

	}

	/**
	 * Linearly interpolates between the given vector and this instance, where
	 * alpha is the percent distance along the line - alpha = 0 will be this
	 * vector, and alpha = 1 will be the given one.
	 *
	 * @param {Vector4} v - The vector to interpolate towards.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector4} A reference to this vector.
	 */
	lerp( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;
		this.w += ( v.w - this.w ) * alpha;

		return this;

	}

	/**
	 * Linearly interpolates between the given vectors, where alpha is the percent
	 * distance along the line - alpha = 0 will be first vector, and alpha = 1 will
	 * be the second one. The result is stored in this instance.
	 *
	 * @param {Vector4} v1 - The first vector.
	 * @param {Vector4} v2 - The second vector.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector4} A reference to this vector.
	 */
	lerpVectors( v1, v2, alpha ) {

		this.x = v1.x + ( v2.x - v1.x ) * alpha;
		this.y = v1.y + ( v2.y - v1.y ) * alpha;
		this.z = v1.z + ( v2.z - v1.z ) * alpha;
		this.w = v1.w + ( v2.w - v1.w ) * alpha;

		return this;

	}

	/**
	 * Returns `true` if this vector is equal with the given one.
	 *
	 * @param {Vector4} v - The vector to test for equality.
	 * @return {boolean} Whether this vector is equal with the given one.
	 */
	equals( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) && ( v.w === this.w ) );

	}

	/**
	 * Sets this vector's x value to be `array[ offset ]`, y value to be `array[ offset + 1 ]`,
	 * z value to be `array[ offset + 2 ]`, w value to be `array[ offset + 3 ]`.
	 *
	 * @param {Array<number>} array - An array holding the vector component values.
	 * @param {number} [offset=0] - The offset into the array.
	 * @return {Vector4} A reference to this vector.
	 */
	fromArray( array, offset = 0 ) {

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];
		this.z = array[ offset + 2 ];
		this.w = array[ offset + 3 ];

		return this;

	}

	/**
	 * Writes the components of this vector to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the vector components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The vector components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;
		array[ offset + 3 ] = this.w;

		return array;

	}

	/**
	 * Sets the components of this vector from the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - The buffer attribute holding vector data.
	 * @param {number} index - The index into the attribute.
	 * @return {Vector4} A reference to this vector.
	 */
	fromBufferAttribute( attribute, index ) {

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );
		this.z = attribute.getZ( index );
		this.w = attribute.getW( index );

		return this;

	}

	/**
	 * Sets each component of this vector to a pseudo-random value between `0` and
	 * `1`, excluding `1`.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	random() {

		this.x = Math.random();
		this.y = Math.random();
		this.z = Math.random();
		this.w = Math.random();

		return this;

	}

	*[ Symbol.iterator ]() {

		yield this.x;
		yield this.y;
		yield this.z;
		yield this.w;

	}

}

/**
 * Class for representing a Quaternion. Quaternions are used in three.js to represent rotations.
 *
 * Iterating through a vector instance will yield its components `(x, y, z, w)` in
 * the corresponding order.
 *
 * Note that three.js expects Quaternions to be normalized.
 * ```js
 * const quaternion = new THREE.Quaternion();
 * quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );
 *
 * const vector = new THREE.Vector3( 1, 0, 0 );
 * vector.applyQuaternion( quaternion );
 * ```
 */
class Quaternion {

	/**
	 * Constructs a new quaternion.
	 *
	 * @param {number} [x=0] - The x value of this quaternion.
	 * @param {number} [y=0] - The y value of this quaternion.
	 * @param {number} [z=0] - The z value of this quaternion.
	 * @param {number} [w=1] - The w value of this quaternion.
	 */
	constructor( x = 0, y = 0, z = 0, w = 1 ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isQuaternion = true;

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

	}

	/**
	 * Interpolates between two quaternions via SLERP. This implementation assumes the
	 * quaternion data are managed  in flat arrays.
	 *
	 * @param {Array<number>} dst - The destination array.
	 * @param {number} dstOffset - An offset into the destination array.
	 * @param {Array<number>} src0 - The source array of the first quaternion.
	 * @param {number} srcOffset0 - An offset into the first source array.
	 * @param {Array<number>} src1 -  The source array of the second quaternion.
	 * @param {number} srcOffset1 - An offset into the second source array.
	 * @param {number} t - The interpolation factor in the range `[0,1]`.
	 * @see {@link Quaternion#slerp}
	 */
	static slerpFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t ) {

		// fuzz-free, array-based Quaternion SLERP operation

		let x0 = src0[ srcOffset0 + 0 ],
			y0 = src0[ srcOffset0 + 1 ],
			z0 = src0[ srcOffset0 + 2 ],
			w0 = src0[ srcOffset0 + 3 ];

		const x1 = src1[ srcOffset1 + 0 ],
			y1 = src1[ srcOffset1 + 1 ],
			z1 = src1[ srcOffset1 + 2 ],
			w1 = src1[ srcOffset1 + 3 ];

		if ( t === 0 ) {

			dst[ dstOffset + 0 ] = x0;
			dst[ dstOffset + 1 ] = y0;
			dst[ dstOffset + 2 ] = z0;
			dst[ dstOffset + 3 ] = w0;
			return;

		}

		if ( t === 1 ) {

			dst[ dstOffset + 0 ] = x1;
			dst[ dstOffset + 1 ] = y1;
			dst[ dstOffset + 2 ] = z1;
			dst[ dstOffset + 3 ] = w1;
			return;

		}

		if ( w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1 ) {

			let s = 1 - t;
			const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,
				dir = ( cos >= 0 ? 1 : -1 ),
				sqrSin = 1 - cos * cos;

			// Skip the Slerp for tiny steps to avoid numeric problems:
			if ( sqrSin > Number.EPSILON ) {

				const sin = Math.sqrt( sqrSin ),
					len = Math.atan2( sin, cos * dir );

				s = Math.sin( s * len ) / sin;
				t = Math.sin( t * len ) / sin;

			}

			const tDir = t * dir;

			x0 = x0 * s + x1 * tDir;
			y0 = y0 * s + y1 * tDir;
			z0 = z0 * s + z1 * tDir;
			w0 = w0 * s + w1 * tDir;

			// Normalize in case we just did a lerp:
			if ( s === 1 - t ) {

				const f = 1 / Math.sqrt( x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0 );

				x0 *= f;
				y0 *= f;
				z0 *= f;
				w0 *= f;

			}

		}

		dst[ dstOffset ] = x0;
		dst[ dstOffset + 1 ] = y0;
		dst[ dstOffset + 2 ] = z0;
		dst[ dstOffset + 3 ] = w0;

	}

	/**
	 * Multiplies two quaternions. This implementation assumes the quaternion data are managed
	 * in flat arrays.
	 *
	 * @param {Array<number>} dst - The destination array.
	 * @param {number} dstOffset - An offset into the destination array.
	 * @param {Array<number>} src0 - The source array of the first quaternion.
	 * @param {number} srcOffset0 - An offset into the first source array.
	 * @param {Array<number>} src1 -  The source array of the second quaternion.
	 * @param {number} srcOffset1 - An offset into the second source array.
	 * @return {Array<number>} The destination array.
	 * @see {@link Quaternion#multiplyQuaternions}.
	 */
	static multiplyQuaternionsFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1 ) {

		const x0 = src0[ srcOffset0 ];
		const y0 = src0[ srcOffset0 + 1 ];
		const z0 = src0[ srcOffset0 + 2 ];
		const w0 = src0[ srcOffset0 + 3 ];

		const x1 = src1[ srcOffset1 ];
		const y1 = src1[ srcOffset1 + 1 ];
		const z1 = src1[ srcOffset1 + 2 ];
		const w1 = src1[ srcOffset1 + 3 ];

		dst[ dstOffset ] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
		dst[ dstOffset + 1 ] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
		dst[ dstOffset + 2 ] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
		dst[ dstOffset + 3 ] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

		return dst;

	}

	/**
	 * The x value of this quaternion.
	 *
	 * @type {number}
	 * @default 0
	 */
	get x() {

		return this._x;

	}

	set x( value ) {

		this._x = value;
		this._onChangeCallback();

	}

	/**
	 * The y value of this quaternion.
	 *
	 * @type {number}
	 * @default 0
	 */
	get y() {

		return this._y;

	}

	set y( value ) {

		this._y = value;
		this._onChangeCallback();

	}

	/**
	 * The z value of this quaternion.
	 *
	 * @type {number}
	 * @default 0
	 */
	get z() {

		return this._z;

	}

	set z( value ) {

		this._z = value;
		this._onChangeCallback();

	}

	/**
	 * The w value of this quaternion.
	 *
	 * @type {number}
	 * @default 1
	 */
	get w() {

		return this._w;

	}

	set w( value ) {

		this._w = value;
		this._onChangeCallback();

	}

	/**
	 * Sets the quaternion components.
	 *
	 * @param {number} x - The x value of this quaternion.
	 * @param {number} y - The y value of this quaternion.
	 * @param {number} z - The z value of this quaternion.
	 * @param {number} w - The w value of this quaternion.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	set( x, y, z, w ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Returns a new quaternion with copied values from this instance.
	 *
	 * @return {Quaternion} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this._x, this._y, this._z, this._w );

	}

	/**
	 * Copies the values of the given quaternion to this instance.
	 *
	 * @param {Quaternion} quaternion - The quaternion to copy.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	copy( quaternion ) {

		this._x = quaternion.x;
		this._y = quaternion.y;
		this._z = quaternion.z;
		this._w = quaternion.w;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Sets this quaternion from the rotation specified by the given
	 * Euler angles.
	 *
	 * @param {Euler} euler - The Euler angles.
	 * @param {boolean} [update=true] - Whether the internal `onChange` callback should be executed or not.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	setFromEuler( euler, update = true ) {

		const x = euler._x, y = euler._y, z = euler._z, order = euler._order;

		// http://www.mathworks.com/matlabcentral/fileexchange/
		// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
		//	content/SpinCalc.m

		const cos = Math.cos;
		const sin = Math.sin;

		const c1 = cos( x / 2 );
		const c2 = cos( y / 2 );
		const c3 = cos( z / 2 );

		const s1 = sin( x / 2 );
		const s2 = sin( y / 2 );
		const s3 = sin( z / 2 );

		switch ( order ) {

			case 'XYZ':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'YXZ':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case 'ZXY':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'ZYX':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case 'YZX':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'XZY':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			default:
				console.warn( 'THREE.Quaternion: .setFromEuler() encountered an unknown order: ' + order );

		}

		if ( update === true ) this._onChangeCallback();

		return this;

	}

	/**
	 * Sets this quaternion from the given axis and angle.
	 *
	 * @param {Vector3} axis - The normalized axis.
	 * @param {number} angle - The angle in radians.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	setFromAxisAngle( axis, angle ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		const halfAngle = angle / 2, s = Math.sin( halfAngle );

		this._x = axis.x * s;
		this._y = axis.y * s;
		this._z = axis.z * s;
		this._w = Math.cos( halfAngle );

		this._onChangeCallback();

		return this;

	}

	/**
	 * Sets this quaternion from the given rotation matrix.
	 *
	 * @param {Matrix4} m - A 4x4 matrix of which the upper 3x3 of matrix is a pure rotation matrix (i.e. unscaled).
	 * @return {Quaternion} A reference to this quaternion.
	 */
	setFromRotationMatrix( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		const te = m.elements,

			m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
			m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
			m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

			trace = m11 + m22 + m33;

		if ( trace > 0 ) {

			const s = 0.5 / Math.sqrt( trace + 1.0 );

			this._w = 0.25 / s;
			this._x = ( m32 - m23 ) * s;
			this._y = ( m13 - m31 ) * s;
			this._z = ( m21 - m12 ) * s;

		} else if ( m11 > m22 && m11 > m33 ) {

			const s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

			this._w = ( m32 - m23 ) / s;
			this._x = 0.25 * s;
			this._y = ( m12 + m21 ) / s;
			this._z = ( m13 + m31 ) / s;

		} else if ( m22 > m33 ) {

			const s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

			this._w = ( m13 - m31 ) / s;
			this._x = ( m12 + m21 ) / s;
			this._y = 0.25 * s;
			this._z = ( m23 + m32 ) / s;

		} else {

			const s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

			this._w = ( m21 - m12 ) / s;
			this._x = ( m13 + m31 ) / s;
			this._y = ( m23 + m32 ) / s;
			this._z = 0.25 * s;

		}

		this._onChangeCallback();

		return this;

	}

	/**
	 * Sets this quaternion to the rotation required to rotate the direction vector
	 * `vFrom` to the direction vector `vTo`.
	 *
	 * @param {Vector3} vFrom - The first (normalized) direction vector.
	 * @param {Vector3} vTo - The second (normalized) direction vector.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	setFromUnitVectors( vFrom, vTo ) {

		// assumes direction vectors vFrom and vTo are normalized

		let r = vFrom.dot( vTo ) + 1;

		if ( r < Number.EPSILON ) {

			// vFrom and vTo point in opposite directions

			r = 0;

			if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

				this._x = - vFrom.y;
				this._y = vFrom.x;
				this._z = 0;
				this._w = r;

			} else {

				this._x = 0;
				this._y = - vFrom.z;
				this._z = vFrom.y;
				this._w = r;

			}

		} else {

			// crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

			this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
			this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
			this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
			this._w = r;

		}

		return this.normalize();

	}

	/**
	 * Returns the angle between this quaternion and the given one in radians.
	 *
	 * @param {Quaternion} q - The quaternion to compute the angle with.
	 * @return {number} The angle in radians.
	 */
	angleTo( q ) {

		return 2 * Math.acos( Math.abs( clamp( this.dot( q ), -1, 1 ) ) );

	}

	/**
	 * Rotates this quaternion by a given angular step to the given quaternion.
	 * The method ensures that the final quaternion will not overshoot `q`.
	 *
	 * @param {Quaternion} q - The target quaternion.
	 * @param {number} step - The angular step in radians.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	rotateTowards( q, step ) {

		const angle = this.angleTo( q );

		if ( angle === 0 ) return this;

		const t = Math.min( 1, step / angle );

		this.slerp( q, t );

		return this;

	}

	/**
	 * Sets this quaternion to the identity quaternion; that is, to the
	 * quaternion that represents "no rotation".
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	identity() {

		return this.set( 0, 0, 0, 1 );

	}

	/**
	 * Inverts this quaternion via {@link Quaternion#conjugate}. The
	 * quaternion is assumed to have unit length.
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	invert() {

		return this.conjugate();

	}

	/**
	 * Returns the rotational conjugate of this quaternion. The conjugate of a
	 * quaternion represents the same rotation in the opposite direction about
	 * the rotational axis.
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	conjugate() {

		this._x *= -1;
		this._y *= -1;
		this._z *= -1;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Calculates the dot product of this quaternion and the given one.
	 *
	 * @param {Quaternion} v - The quaternion to compute the dot product with.
	 * @return {number} The result of the dot product.
	 */
	dot( v ) {

		return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

	}

	/**
	 * Computes the squared Euclidean length (straight-line length) of this quaternion,
	 * considered as a 4 dimensional vector. This can be useful if you are comparing the
	 * lengths of two quaternions, as this is a slightly more efficient calculation than
	 * {@link Quaternion#length}.
	 *
	 * @return {number} The squared Euclidean length.
	 */
	lengthSq() {

		return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

	}

	/**
	 * Computes the Euclidean length (straight-line length) of this quaternion,
	 * considered as a 4 dimensional vector.
	 *
	 * @return {number} The Euclidean length.
	 */
	length() {

		return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

	}

	/**
	 * Normalizes this quaternion - that is, calculated the quaternion that performs
	 * the same rotation as this one, but has a length equal to `1`.
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	normalize() {

		let l = this.length();

		if ( l === 0 ) {

			this._x = 0;
			this._y = 0;
			this._z = 0;
			this._w = 1;

		} else {

			l = 1 / l;

			this._x = this._x * l;
			this._y = this._y * l;
			this._z = this._z * l;
			this._w = this._w * l;

		}

		this._onChangeCallback();

		return this;

	}

	/**
	 * Multiplies this quaternion by the given one.
	 *
	 * @param {Quaternion} q - The quaternion.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	multiply( q ) {

		return this.multiplyQuaternions( this, q );

	}

	/**
	 * Pre-multiplies this quaternion by the given one.
	 *
	 * @param {Quaternion} q - The quaternion.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	premultiply( q ) {

		return this.multiplyQuaternions( q, this );

	}

	/**
	 * Multiplies the given quaternions and stores the result in this instance.
	 *
	 * @param {Quaternion} a - The first quaternion.
	 * @param {Quaternion} b - The second quaternion.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	multiplyQuaternions( a, b ) {

		// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

		const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
		const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

		this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Performs a spherical linear interpolation between quaternions.
	 *
	 * @param {Quaternion} qb - The target quaternion.
	 * @param {number} t - The interpolation factor in the closed interval `[0, 1]`.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	slerp( qb, t ) {

		if ( t === 0 ) return this;
		if ( t === 1 ) return this.copy( qb );

		const x = this._x, y = this._y, z = this._z, w = this._w;

		// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

		let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

		if ( cosHalfTheta < 0 ) {

			this._w = - qb._w;
			this._x = - qb._x;
			this._y = - qb._y;
			this._z = - qb._z;

			cosHalfTheta = - cosHalfTheta;

		} else {

			this.copy( qb );

		}

		if ( cosHalfTheta >= 1.0 ) {

			this._w = w;
			this._x = x;
			this._y = y;
			this._z = z;

			return this;

		}

		const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

		if ( sqrSinHalfTheta <= Number.EPSILON ) {

			const s = 1 - t;
			this._w = s * w + t * this._w;
			this._x = s * x + t * this._x;
			this._y = s * y + t * this._y;
			this._z = s * z + t * this._z;

			this.normalize(); // normalize calls _onChangeCallback()

			return this;

		}

		const sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
		const halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
		const ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
			ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

		this._w = ( w * ratioA + this._w * ratioB );
		this._x = ( x * ratioA + this._x * ratioB );
		this._y = ( y * ratioA + this._y * ratioB );
		this._z = ( z * ratioA + this._z * ratioB );

		this._onChangeCallback();

		return this;

	}

	/**
	 * Performs a spherical linear interpolation between the given quaternions
	 * and stores the result in this quaternion.
	 *
	 * @param {Quaternion} qa - The source quaternion.
	 * @param {Quaternion} qb - The target quaternion.
	 * @param {number} t - The interpolation factor in the closed interval `[0, 1]`.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	slerpQuaternions( qa, qb, t ) {

		return this.copy( qa ).slerp( qb, t );

	}

	/**
	 * Sets this quaternion to a uniformly random, normalized quaternion.
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	random() {

		// Ken Shoemake
		// Uniform random rotations
		// D. Kirk, editor, Graphics Gems III, pages 124-132. Academic Press, New York, 1992.

		const theta1 = 2 * Math.PI * Math.random();
		const theta2 = 2 * Math.PI * Math.random();

		const x0 = Math.random();
		const r1 = Math.sqrt( 1 - x0 );
		const r2 = Math.sqrt( x0 );

		return this.set(
			r1 * Math.sin( theta1 ),
			r1 * Math.cos( theta1 ),
			r2 * Math.sin( theta2 ),
			r2 * Math.cos( theta2 ),
		);

	}

	/**
	 * Returns `true` if this quaternion is equal with the given one.
	 *
	 * @param {Quaternion} quaternion - The quaternion to test for equality.
	 * @return {boolean} Whether this quaternion is equal with the given one.
	 */
	equals( quaternion ) {

		return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

	}

	/**
	 * Sets this quaternion's components from the given array.
	 *
	 * @param {Array<number>} array - An array holding the quaternion component values.
	 * @param {number} [offset=0] - The offset into the array.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	fromArray( array, offset = 0 ) {

		this._x = array[ offset ];
		this._y = array[ offset + 1 ];
		this._z = array[ offset + 2 ];
		this._w = array[ offset + 3 ];

		this._onChangeCallback();

		return this;

	}

	/**
	 * Writes the components of this quaternion to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the quaternion components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The quaternion components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this._x;
		array[ offset + 1 ] = this._y;
		array[ offset + 2 ] = this._z;
		array[ offset + 3 ] = this._w;

		return array;

	}

	/**
	 * Sets the components of this quaternion from the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - The buffer attribute holding quaternion data.
	 * @param {number} index - The index into the attribute.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	fromBufferAttribute( attribute, index ) {

		this._x = attribute.getX( index );
		this._y = attribute.getY( index );
		this._z = attribute.getZ( index );
		this._w = attribute.getW( index );

		this._onChangeCallback();

		return this;

	}

	/**
	 * This methods defines the serialization result of this class. Returns the
	 * numerical elements of this quaternion in an array of format `[x, y, z, w]`.
	 *
	 * @return {Array<number>} The serialized quaternion.
	 */
	toJSON() {

		return this.toArray();

	}

	_onChange( callback ) {

		this._onChangeCallback = callback;

		return this;

	}

	_onChangeCallback() {}

	*[ Symbol.iterator ]() {

		yield this._x;
		yield this._y;
		yield this._z;
		yield this._w;

	}

}

/**
 * Class representing a 3D vector. A 3D vector is an ordered triplet of numbers
 * (labeled x, y and z), which can be used to represent a number of things, such as:
 *
 * - A point in 3D space.
 * - A direction and length in 3D space. In three.js the length will
 * always be the Euclidean distance(straight-line distance) from `(0, 0, 0)` to `(x, y, z)`
 * and the direction is also measured from `(0, 0, 0)` towards `(x, y, z)`.
 * - Any arbitrary ordered triplet of numbers.
 *
 * There are other things a 3D vector can be used to represent, such as
 * momentum vectors and so on, however these are the most
 * common uses in three.js.
 *
 * Iterating through a vector instance will yield its components `(x, y, z)` in
 * the corresponding order.
 * ```js
 * const a = new THREE.Vector3( 0, 1, 0 );
 *
 * //no arguments; will be initialised to (0, 0, 0)
 * const b = new THREE.Vector3( );
 *
 * const d = a.distanceTo( b );
 * ```
 */
class Vector3 {

	/**
	 * Constructs a new 3D vector.
	 *
	 * @param {number} [x=0] - The x value of this vector.
	 * @param {number} [y=0] - The y value of this vector.
	 * @param {number} [z=0] - The z value of this vector.
	 */
	constructor( x = 0, y = 0, z = 0 ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Vector3.prototype.isVector3 = true;

		/**
		 * The x value of this vector.
		 *
		 * @type {number}
		 */
		this.x = x;

		/**
		 * The y value of this vector.
		 *
		 * @type {number}
		 */
		this.y = y;

		/**
		 * The z value of this vector.
		 *
		 * @type {number}
		 */
		this.z = z;

	}

	/**
	 * Sets the vector components.
	 *
	 * @param {number} x - The value of the x component.
	 * @param {number} y - The value of the y component.
	 * @param {number} z - The value of the z component.
	 * @return {Vector3} A reference to this vector.
	 */
	set( x, y, z ) {

		if ( z === undefined ) z = this.z; // sprite.scale.set(x,y)

		this.x = x;
		this.y = y;
		this.z = z;

		return this;

	}

	/**
	 * Sets the vector components to the same value.
	 *
	 * @param {number} scalar - The value to set for all vector components.
	 * @return {Vector3} A reference to this vector.
	 */
	setScalar( scalar ) {

		this.x = scalar;
		this.y = scalar;
		this.z = scalar;

		return this;

	}

	/**
	 * Sets the vector's x component to the given value
	 *
	 * @param {number} x - The value to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setX( x ) {

		this.x = x;

		return this;

	}

	/**
	 * Sets the vector's y component to the given value
	 *
	 * @param {number} y - The value to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setY( y ) {

		this.y = y;

		return this;

	}

	/**
	 * Sets the vector's z component to the given value
	 *
	 * @param {number} z - The value to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setZ( z ) {

		this.z = z;

		return this;

	}

	/**
	 * Allows to set a vector component with an index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y, `2` equals to z.
	 * @param {number} value - The value to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setComponent( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	}

	/**
	 * Returns the value of the vector component which matches the given index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y, `2` equals to z.
	 * @return {number} A vector component value.
	 */
	getComponent( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			default: throw new Error( 'index is out of range: ' + index );

		}

	}

	/**
	 * Returns a new vector with copied values from this instance.
	 *
	 * @return {Vector3} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this.x, this.y, this.z );

	}

	/**
	 * Copies the values of the given vector to this instance.
	 *
	 * @param {Vector3} v - The vector to copy.
	 * @return {Vector3} A reference to this vector.
	 */
	copy( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;

		return this;

	}

	/**
	 * Adds the given vector to this instance.
	 *
	 * @param {Vector3} v - The vector to add.
	 * @return {Vector3} A reference to this vector.
	 */
	add( v ) {

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;

	}

	/**
	 * Adds the given scalar value to all components of this instance.
	 *
	 * @param {number} s - The scalar to add.
	 * @return {Vector3} A reference to this vector.
	 */
	addScalar( s ) {

		this.x += s;
		this.y += s;
		this.z += s;

		return this;

	}

	/**
	 * Adds the given vectors and stores the result in this instance.
	 *
	 * @param {Vector3} a - The first vector.
	 * @param {Vector3} b - The second vector.
	 * @return {Vector3} A reference to this vector.
	 */
	addVectors( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;

		return this;

	}

	/**
	 * Adds the given vector scaled by the given factor to this instance.
	 *
	 * @param {Vector3|Vector4} v - The vector.
	 * @param {number} s - The factor that scales `v`.
	 * @return {Vector3} A reference to this vector.
	 */
	addScaledVector( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;

		return this;

	}

	/**
	 * Subtracts the given vector from this instance.
	 *
	 * @param {Vector3} v - The vector to subtract.
	 * @return {Vector3} A reference to this vector.
	 */
	sub( v ) {

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;

	}

	/**
	 * Subtracts the given scalar value from all components of this instance.
	 *
	 * @param {number} s - The scalar to subtract.
	 * @return {Vector3} A reference to this vector.
	 */
	subScalar( s ) {

		this.x -= s;
		this.y -= s;
		this.z -= s;

		return this;

	}

	/**
	 * Subtracts the given vectors and stores the result in this instance.
	 *
	 * @param {Vector3} a - The first vector.
	 * @param {Vector3} b - The second vector.
	 * @return {Vector3} A reference to this vector.
	 */
	subVectors( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;

		return this;

	}

	/**
	 * Multiplies the given vector with this instance.
	 *
	 * @param {Vector3} v - The vector to multiply.
	 * @return {Vector3} A reference to this vector.
	 */
	multiply( v ) {

		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;

	}

	/**
	 * Multiplies the given scalar value with all components of this instance.
	 *
	 * @param {number} scalar - The scalar to multiply.
	 * @return {Vector3} A reference to this vector.
	 */
	multiplyScalar( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;

		return this;

	}

	/**
	 * Multiplies the given vectors and stores the result in this instance.
	 *
	 * @param {Vector3} a - The first vector.
	 * @param {Vector3} b - The second vector.
	 * @return {Vector3} A reference to this vector.
	 */
	multiplyVectors( a, b ) {

		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;

		return this;

	}

	/**
	 * Applies the given Euler rotation to this vector.
	 *
	 * @param {Euler} euler - The Euler angles.
	 * @return {Vector3} A reference to this vector.
	 */
	applyEuler( euler ) {

		return this.applyQuaternion( _quaternion$4.setFromEuler( euler ) );

	}

	/**
	 * Applies a rotation specified by an axis and an angle to this vector.
	 *
	 * @param {Vector3} axis - A normalized vector representing the rotation axis.
	 * @param {number} angle - The angle in radians.
	 * @return {Vector3} A reference to this vector.
	 */
	applyAxisAngle( axis, angle ) {

		return this.applyQuaternion( _quaternion$4.setFromAxisAngle( axis, angle ) );

	}

	/**
	 * Multiplies this vector with the given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The 3x3 matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	applyMatrix3( m ) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
		this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

		return this;

	}

	/**
	 * Multiplies this vector by the given normal matrix and normalizes
	 * the result.
	 *
	 * @param {Matrix3} m - The normal matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	applyNormalMatrix( m ) {

		return this.applyMatrix3( m ).normalize();

	}

	/**
	 * Multiplies this vector (with an implicit 1 in the 4th dimension) by m, and
	 * divides by perspective.
	 *
	 * @param {Matrix4} m - The matrix to apply.
	 * @return {Vector3} A reference to this vector.
	 */
	applyMatrix4( m ) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

		this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
		this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
		this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

		return this;

	}

	/**
	 * Applies the given Quaternion to this vector.
	 *
	 * @param {Quaternion} q - The Quaternion.
	 * @return {Vector3} A reference to this vector.
	 */
	applyQuaternion( q ) {

		// quaternion q is assumed to have unit length

		const vx = this.x, vy = this.y, vz = this.z;
		const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

		// t = 2 * cross( q.xyz, v );
		const tx = 2 * ( qy * vz - qz * vy );
		const ty = 2 * ( qz * vx - qx * vz );
		const tz = 2 * ( qx * vy - qy * vx );

		// v + q.w * t + cross( q.xyz, t );
		this.x = vx + qw * tx + qy * tz - qz * ty;
		this.y = vy + qw * ty + qz * tx - qx * tz;
		this.z = vz + qw * tz + qx * ty - qy * tx;

		return this;

	}

	/**
	 * Projects this vector from world space into the camera's normalized
	 * device coordinate (NDC) space.
	 *
	 * @param {Camera} camera - The camera.
	 * @return {Vector3} A reference to this vector.
	 */
	project( camera ) {

		return this.applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

	}

	/**
	 * Unprojects this vector from the camera's normalized device coordinate (NDC)
	 * space into world space.
	 *
	 * @param {Camera} camera - The camera.
	 * @return {Vector3} A reference to this vector.
	 */
	unproject( camera ) {

		return this.applyMatrix4( camera.projectionMatrixInverse ).applyMatrix4( camera.matrixWorld );

	}

	/**
	 * Transforms the direction of this vector by a matrix (the upper left 3 x 3
	 * subset of the given 4x4 matrix and then normalizes the result.
	 *
	 * @param {Matrix4} m - The matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	transformDirection( m ) {

		// input: THREE.Matrix4 affine matrix
		// vector interpreted as a direction

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

		return this.normalize();

	}

	/**
	 * Divides this instance by the given vector.
	 *
	 * @param {Vector3} v - The vector to divide.
	 * @return {Vector3} A reference to this vector.
	 */
	divide( v ) {

		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;

	}

	/**
	 * Divides this vector by the given scalar.
	 *
	 * @param {number} scalar - The scalar to divide.
	 * @return {Vector3} A reference to this vector.
	 */
	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	}

	/**
	 * If this vector's x, y or z value is greater than the given vector's x, y or z
	 * value, replace that value with the corresponding min value.
	 *
	 * @param {Vector3} v - The vector.
	 * @return {Vector3} A reference to this vector.
	 */
	min( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );
		this.z = Math.min( this.z, v.z );

		return this;

	}

	/**
	 * If this vector's x, y or z value is less than the given vector's x, y or z
	 * value, replace that value with the corresponding max value.
	 *
	 * @param {Vector3} v - The vector.
	 * @return {Vector3} A reference to this vector.
	 */
	max( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );
		this.z = Math.max( this.z, v.z );

		return this;

	}

	/**
	 * If this vector's x, y or z value is greater than the max vector's x, y or z
	 * value, it is replaced by the corresponding value.
	 * If this vector's x, y or z value is less than the min vector's x, y or z value,
	 * it is replaced by the corresponding value.
	 *
	 * @param {Vector3} min - The minimum x, y and z values.
	 * @param {Vector3} max - The maximum x, y and z values in the desired range.
	 * @return {Vector3} A reference to this vector.
	 */
	clamp( min, max ) {

		// assumes min < max, componentwise

		this.x = clamp( this.x, min.x, max.x );
		this.y = clamp( this.y, min.y, max.y );
		this.z = clamp( this.z, min.z, max.z );

		return this;

	}

	/**
	 * If this vector's x, y or z values are greater than the max value, they are
	 * replaced by the max value.
	 * If this vector's x, y or z values are less than the min value, they are
	 * replaced by the min value.
	 *
	 * @param {number} minVal - The minimum value the components will be clamped to.
	 * @param {number} maxVal - The maximum value the components will be clamped to.
	 * @return {Vector3} A reference to this vector.
	 */
	clampScalar( minVal, maxVal ) {

		this.x = clamp( this.x, minVal, maxVal );
		this.y = clamp( this.y, minVal, maxVal );
		this.z = clamp( this.z, minVal, maxVal );

		return this;

	}

	/**
	 * If this vector's length is greater than the max value, it is replaced by
	 * the max value.
	 * If this vector's length is less than the min value, it is replaced by the
	 * min value.
	 *
	 * @param {number} min - The minimum value the vector length will be clamped to.
	 * @param {number} max - The maximum value the vector length will be clamped to.
	 * @return {Vector3} A reference to this vector.
	 */
	clampLength( min, max ) {

		const length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( clamp( length, min, max ) );

	}

	/**
	 * The components of this vector are rounded down to the nearest integer value.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	floor() {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );

		return this;

	}

	/**
	 * The components of this vector are rounded up to the nearest integer value.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	ceil() {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );

		return this;

	}

	/**
	 * The components of this vector are rounded to the nearest integer value
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	round() {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );

		return this;

	}

	/**
	 * The components of this vector are rounded towards zero (up if negative,
	 * down if positive) to an integer value.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	roundToZero() {

		this.x = Math.trunc( this.x );
		this.y = Math.trunc( this.y );
		this.z = Math.trunc( this.z );

		return this;

	}

	/**
	 * Inverts this vector - i.e. sets x = -x, y = -y and z = -z.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	negate() {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;

		return this;

	}

	/**
	 * Calculates the dot product of the given vector with this instance.
	 *
	 * @param {Vector3} v - The vector to compute the dot product with.
	 * @return {number} The result of the dot product.
	 */
	dot( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z;

	}

	// TODO lengthSquared?

	/**
	 * Computes the square of the Euclidean length (straight-line length) from
	 * (0, 0, 0) to (x, y, z). If you are comparing the lengths of vectors, you should
	 * compare the length squared instead as it is slightly more efficient to calculate.
	 *
	 * @return {number} The square length of this vector.
	 */
	lengthSq() {

		return this.x * this.x + this.y * this.y + this.z * this.z;

	}

	/**
	 * Computes the  Euclidean length (straight-line length) from (0, 0, 0) to (x, y, z).
	 *
	 * @return {number} The length of this vector.
	 */
	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

	}

	/**
	 * Computes the Manhattan length of this vector.
	 *
	 * @return {number} The length of this vector.
	 */
	manhattanLength() {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

	}

	/**
	 * Converts this vector to a unit vector - that is, sets it equal to a vector
	 * with the same direction as this one, but with a vector length of `1`.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	normalize() {

		return this.divideScalar( this.length() || 1 );

	}

	/**
	 * Sets this vector to a vector with the same direction as this one, but
	 * with the specified length.
	 *
	 * @param {number} length - The new length of this vector.
	 * @return {Vector3} A reference to this vector.
	 */
	setLength( length ) {

		return this.normalize().multiplyScalar( length );

	}

	/**
	 * Linearly interpolates between the given vector and this instance, where
	 * alpha is the percent distance along the line - alpha = 0 will be this
	 * vector, and alpha = 1 will be the given one.
	 *
	 * @param {Vector3} v - The vector to interpolate towards.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector3} A reference to this vector.
	 */
	lerp( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;

		return this;

	}

	/**
	 * Linearly interpolates between the given vectors, where alpha is the percent
	 * distance along the line - alpha = 0 will be first vector, and alpha = 1 will
	 * be the second one. The result is stored in this instance.
	 *
	 * @param {Vector3} v1 - The first vector.
	 * @param {Vector3} v2 - The second vector.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector3} A reference to this vector.
	 */
	lerpVectors( v1, v2, alpha ) {

		this.x = v1.x + ( v2.x - v1.x ) * alpha;
		this.y = v1.y + ( v2.y - v1.y ) * alpha;
		this.z = v1.z + ( v2.z - v1.z ) * alpha;

		return this;

	}

	/**
	 * Calculates the cross product of the given vector with this instance.
	 *
	 * @param {Vector3} v - The vector to compute the cross product with.
	 * @return {Vector3} The result of the cross product.
	 */
	cross( v ) {

		return this.crossVectors( this, v );

	}

	/**
	 * Calculates the cross product of the given vectors and stores the result
	 * in this instance.
	 *
	 * @param {Vector3} a - The first vector.
	 * @param {Vector3} b - The second vector.
	 * @return {Vector3} A reference to this vector.
	 */
	crossVectors( a, b ) {

		const ax = a.x, ay = a.y, az = a.z;
		const bx = b.x, by = b.y, bz = b.z;

		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;

		return this;

	}

	/**
	 * Projects this vector onto the given one.
	 *
	 * @param {Vector3} v - The vector to project to.
	 * @return {Vector3} A reference to this vector.
	 */
	projectOnVector( v ) {

		const denominator = v.lengthSq();

		if ( denominator === 0 ) return this.set( 0, 0, 0 );

		const scalar = v.dot( this ) / denominator;

		return this.copy( v ).multiplyScalar( scalar );

	}

	/**
	 * Projects this vector onto a plane by subtracting this
	 * vector projected onto the plane's normal from this vector.
	 *
	 * @param {Vector3} planeNormal - The plane normal.
	 * @return {Vector3} A reference to this vector.
	 */
	projectOnPlane( planeNormal ) {

		_vector$c.copy( this ).projectOnVector( planeNormal );

		return this.sub( _vector$c );

	}

	/**
	 * Reflects this vector off a plane orthogonal to the given normal vector.
	 *
	 * @param {Vector3} normal - The (normalized) normal vector.
	 * @return {Vector3} A reference to this vector.
	 */
	reflect( normal ) {

		return this.sub( _vector$c.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

	}
	/**
	 * Returns the angle between the given vector and this instance in radians.
	 *
	 * @param {Vector3} v - The vector to compute the angle with.
	 * @return {number} The angle in radians.
	 */
	angleTo( v ) {

		const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

		if ( denominator === 0 ) return Math.PI / 2;

		const theta = this.dot( v ) / denominator;

		// clamp, to handle numerical problems

		return Math.acos( clamp( theta, -1, 1 ) );

	}

	/**
	 * Computes the distance from the given vector to this instance.
	 *
	 * @param {Vector3} v - The vector to compute the distance to.
	 * @return {number} The distance.
	 */
	distanceTo( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	}

	/**
	 * Computes the squared distance from the given vector to this instance.
	 * If you are just comparing the distance with another distance, you should compare
	 * the distance squared instead as it is slightly more efficient to calculate.
	 *
	 * @param {Vector3} v - The vector to compute the squared distance to.
	 * @return {number} The squared distance.
	 */
	distanceToSquared( v ) {

		const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

		return dx * dx + dy * dy + dz * dz;

	}

	/**
	 * Computes the Manhattan distance from the given vector to this instance.
	 *
	 * @param {Vector3} v - The vector to compute the Manhattan distance to.
	 * @return {number} The Manhattan distance.
	 */
	manhattanDistanceTo( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y ) + Math.abs( this.z - v.z );

	}

	/**
	 * Sets the vector components from the given spherical coordinates.
	 *
	 * @param {Spherical} s - The spherical coordinates.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromSpherical( s ) {

		return this.setFromSphericalCoords( s.radius, s.phi, s.theta );

	}

	/**
	 * Sets the vector components from the given spherical coordinates.
	 *
	 * @param {number} radius - The radius.
	 * @param {number} phi - The phi angle in radians.
	 * @param {number} theta - The theta angle in radians.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromSphericalCoords( radius, phi, theta ) {

		const sinPhiRadius = Math.sin( phi ) * radius;

		this.x = sinPhiRadius * Math.sin( theta );
		this.y = Math.cos( phi ) * radius;
		this.z = sinPhiRadius * Math.cos( theta );

		return this;

	}

	/**
	 * Sets the vector components from the given cylindrical coordinates.
	 *
	 * @param {Cylindrical} c - The cylindrical coordinates.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromCylindrical( c ) {

		return this.setFromCylindricalCoords( c.radius, c.theta, c.y );

	}

	/**
	 * Sets the vector components from the given cylindrical coordinates.
	 *
	 * @param {number} radius - The radius.
	 * @param {number} theta - The theta angle in radians.
	 * @param {number} y - The y value.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromCylindricalCoords( radius, theta, y ) {

		this.x = radius * Math.sin( theta );
		this.y = y;
		this.z = radius * Math.cos( theta );

		return this;

	}

	/**
	 * Sets the vector components to the position elements of the
	 * given transformation matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromMatrixPosition( m ) {

		const e = m.elements;

		this.x = e[ 12 ];
		this.y = e[ 13 ];
		this.z = e[ 14 ];

		return this;

	}

	/**
	 * Sets the vector components to the scale elements of the
	 * given transformation matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromMatrixScale( m ) {

		const sx = this.setFromMatrixColumn( m, 0 ).length();
		const sy = this.setFromMatrixColumn( m, 1 ).length();
		const sz = this.setFromMatrixColumn( m, 2 ).length();

		this.x = sx;
		this.y = sy;
		this.z = sz;

		return this;

	}

	/**
	 * Sets the vector components from the specified matrix column.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @param {number} index - The column index.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromMatrixColumn( m, index ) {

		return this.fromArray( m.elements, index * 4 );

	}

	/**
	 * Sets the vector components from the specified matrix column.
	 *
	 * @param {Matrix3} m - The 3x3 matrix.
	 * @param {number} index - The column index.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromMatrix3Column( m, index ) {

		return this.fromArray( m.elements, index * 3 );

	}

	/**
	 * Sets the vector components from the given Euler angles.
	 *
	 * @param {Euler} e - The Euler angles to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromEuler( e ) {

		this.x = e._x;
		this.y = e._y;
		this.z = e._z;

		return this;

	}

	/**
	 * Sets the vector components from the RGB components of the
	 * given color.
	 *
	 * @param {Color} c - The color to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromColor( c ) {

		this.x = c.r;
		this.y = c.g;
		this.z = c.b;

		return this;

	}

	/**
	 * Returns `true` if this vector is equal with the given one.
	 *
	 * @param {Vector3} v - The vector to test for equality.
	 * @return {boolean} Whether this vector is equal with the given one.
	 */
	equals( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

	}

	/**
	 * Sets this vector's x value to be `array[ offset ]`, y value to be `array[ offset + 1 ]`
	 * and z value to be `array[ offset + 2 ]`.
	 *
	 * @param {Array<number>} array - An array holding the vector component values.
	 * @param {number} [offset=0] - The offset into the array.
	 * @return {Vector3} A reference to this vector.
	 */
	fromArray( array, offset = 0 ) {

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];
		this.z = array[ offset + 2 ];

		return this;

	}

	/**
	 * Writes the components of this vector to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the vector components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The vector components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;

		return array;

	}

	/**
	 * Sets the components of this vector from the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - The buffer attribute holding vector data.
	 * @param {number} index - The index into the attribute.
	 * @return {Vector3} A reference to this vector.
	 */
	fromBufferAttribute( attribute, index ) {

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );
		this.z = attribute.getZ( index );

		return this;

	}

	/**
	 * Sets each component of this vector to a pseudo-random value between `0` and
	 * `1`, excluding `1`.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	random() {

		this.x = Math.random();
		this.y = Math.random();
		this.z = Math.random();

		return this;

	}

	/**
	 * Sets this vector to a uniformly random point on a unit sphere.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	randomDirection() {

		// https://mathworld.wolfram.com/SpherePointPicking.html

		const theta = Math.random() * Math.PI * 2;
		const u = Math.random() * 2 - 1;
		const c = Math.sqrt( 1 - u * u );

		this.x = c * Math.cos( theta );
		this.y = u;
		this.z = c * Math.sin( theta );

		return this;

	}

	*[ Symbol.iterator ]() {

		yield this.x;
		yield this.y;
		yield this.z;

	}

}

const _vector$c = /*@__PURE__*/ new Vector3();
const _quaternion$4 = /*@__PURE__*/ new Quaternion();

/**
 * Represents an axis-aligned bounding box (AABB) in 3D space.
 */
class Box3 {

	/**
	 * Constructs a new bounding box.
	 *
	 * @param {Vector3} [min=(Infinity,Infinity,Infinity)] - A vector representing the lower boundary of the box.
	 * @param {Vector3} [max=(-Infinity,-Infinity,-Infinity)] - A vector representing the upper boundary of the box.
	 */
	constructor( min = new Vector3( + Infinity, + Infinity, + Infinity ), max = new Vector3( - Infinity, - Infinity, - Infinity ) ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isBox3 = true;

		/**
		 * The lower boundary of the box.
		 *
		 * @type {Vector3}
		 */
		this.min = min;

		/**
		 * The upper boundary of the box.
		 *
		 * @type {Vector3}
		 */
		this.max = max;

	}

	/**
	 * Sets the lower and upper boundaries of this box.
	 * Please note that this method only copies the values from the given objects.
	 *
	 * @param {Vector3} min - The lower boundary of the box.
	 * @param {Vector3} max - The upper boundary of the box.
	 * @return {Box3} A reference to this bounding box.
	 */
	set( min, max ) {

		this.min.copy( min );
		this.max.copy( max );

		return this;

	}

	/**
	 * Sets the upper and lower bounds of this box so it encloses the position data
	 * in the given array.
	 *
	 * @param {Array<number>} array - An array holding 3D position data.
	 * @return {Box3} A reference to this bounding box.
	 */
	setFromArray( array ) {

		this.makeEmpty();

		for ( let i = 0, il = array.length; i < il; i += 3 ) {

			this.expandByPoint( _vector$b.fromArray( array, i ) );

		}

		return this;

	}

	/**
	 * Sets the upper and lower bounds of this box so it encloses the position data
	 * in the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - A buffer attribute holding 3D position data.
	 * @return {Box3} A reference to this bounding box.
	 */
	setFromBufferAttribute( attribute ) {

		this.makeEmpty();

		for ( let i = 0, il = attribute.count; i < il; i ++ ) {

			this.expandByPoint( _vector$b.fromBufferAttribute( attribute, i ) );

		}

		return this;

	}

	/**
	 * Sets the upper and lower bounds of this box so it encloses the position data
	 * in the given array.
	 *
	 * @param {Array<Vector3>} points - An array holding 3D position data as instances of {@link Vector3}.
	 * @return {Box3} A reference to this bounding box.
	 */
	setFromPoints( points ) {

		this.makeEmpty();

		for ( let i = 0, il = points.length; i < il; i ++ ) {

			this.expandByPoint( points[ i ] );

		}

		return this;

	}

	/**
	 * Centers this box on the given center vector and sets this box's width, height and
	 * depth to the given size values.
	 *
	 * @param {Vector3} center - The center of the box.
	 * @param {Vector3} size - The x, y and z dimensions of the box.
	 * @return {Box3} A reference to this bounding box.
	 */
	setFromCenterAndSize( center, size ) {

		const halfSize = _vector$b.copy( size ).multiplyScalar( 0.5 );

		this.min.copy( center ).sub( halfSize );
		this.max.copy( center ).add( halfSize );

		return this;

	}

	/**
	 * Computes the world-axis-aligned bounding box for the given 3D object
	 * (including its children), accounting for the object's, and children's,
	 * world transforms. The function may result in a larger box than strictly necessary.
	 *
	 * @param {Object3D} object - The 3D object to compute the bounding box for.
	 * @param {boolean} [precise=false] - If set to `true`, the method computes the smallest
	 * world-axis-aligned bounding box at the expense of more computation.
	 * @return {Box3} A reference to this bounding box.
	 */
	setFromObject( object, precise = false ) {

		this.makeEmpty();

		return this.expandByObject( object, precise );

	}

	/**
	 * Returns a new box with copied values from this instance.
	 *
	 * @return {Box3} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

	/**
	 * Copies the values of the given box to this instance.
	 *
	 * @param {Box3} box - The box to copy.
	 * @return {Box3} A reference to this bounding box.
	 */
	copy( box ) {

		this.min.copy( box.min );
		this.max.copy( box.max );

		return this;

	}

	/**
	 * Makes this box empty which means in encloses a zero space in 3D.
	 *
	 * @return {Box3} A reference to this bounding box.
	 */
	makeEmpty() {

		this.min.x = this.min.y = this.min.z = + Infinity;
		this.max.x = this.max.y = this.max.z = - Infinity;

		return this;

	}

	/**
	 * Returns true if this box includes zero points within its bounds.
	 * Note that a box with equal lower and upper bounds still includes one
	 * point, the one both bounds share.
	 *
	 * @return {boolean} Whether this box is empty or not.
	 */
	isEmpty() {

		// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

		return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y ) || ( this.max.z < this.min.z );

	}

	/**
	 * Returns the center point of this box.
	 *
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The center point.
	 */
	getCenter( target ) {

		return this.isEmpty() ? target.set( 0, 0, 0 ) : target.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

	}

	/**
	 * Returns the dimensions of this box.
	 *
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The size.
	 */
	getSize( target ) {

		return this.isEmpty() ? target.set( 0, 0, 0 ) : target.subVectors( this.max, this.min );

	}

	/**
	 * Expands the boundaries of this box to include the given point.
	 *
	 * @param {Vector3} point - The point that should be included by the bounding box.
	 * @return {Box3} A reference to this bounding box.
	 */
	expandByPoint( point ) {

		this.min.min( point );
		this.max.max( point );

		return this;

	}

	/**
	 * Expands this box equilaterally by the given vector. The width of this
	 * box will be expanded by the x component of the vector in both
	 * directions. The height of this box will be expanded by the y component of
	 * the vector in both directions. The depth of this box will be
	 * expanded by the z component of the vector in both directions.
	 *
	 * @param {Vector3} vector - The vector that should expand the bounding box.
	 * @return {Box3} A reference to this bounding box.
	 */
	expandByVector( vector ) {

		this.min.sub( vector );
		this.max.add( vector );

		return this;

	}

	/**
	 * Expands each dimension of the box by the given scalar. If negative, the
	 * dimensions of the box will be contracted.
	 *
	 * @param {number} scalar - The scalar value that should expand the bounding box.
	 * @return {Box3} A reference to this bounding box.
	 */
	expandByScalar( scalar ) {

		this.min.addScalar( - scalar );
		this.max.addScalar( scalar );

		return this;

	}

	/**
	 * Expands the boundaries of this box to include the given 3D object and
	 * its children, accounting for the object's, and children's, world
	 * transforms. The function may result in a larger box than strictly
	 * necessary (unless the precise parameter is set to true).
	 *
	 * @param {Object3D} object - The 3D object that should expand the bounding box.
	 * @param {boolean} precise - If set to `true`, the method expands the bounding box
	 * as little as necessary at the expense of more computation.
	 * @return {Box3} A reference to this bounding box.
	 */
	expandByObject( object, precise = false ) {

		// Computes the world-axis-aligned bounding box of an object (including its children),
		// accounting for both the object's, and children's, world transforms

		object.updateWorldMatrix( false, false );

		const geometry = object.geometry;

		if ( geometry !== undefined ) {

			const positionAttribute = geometry.getAttribute( 'position' );

			// precise AABB computation based on vertex data requires at least a position attribute.
			// instancing isn't supported so far and uses the normal (conservative) code path.

			if ( precise === true && positionAttribute !== undefined && object.isInstancedMesh !== true ) {

				for ( let i = 0, l = positionAttribute.count; i < l; i ++ ) {

					if ( object.isMesh === true ) {

						object.getVertexPosition( i, _vector$b );

					} else {

						_vector$b.fromBufferAttribute( positionAttribute, i );

					}

					_vector$b.applyMatrix4( object.matrixWorld );
					this.expandByPoint( _vector$b );

				}

			} else {

				if ( object.boundingBox !== undefined ) {

					// object-level bounding box

					if ( object.boundingBox === null ) {

						object.computeBoundingBox();

					}

					_box$4.copy( object.boundingBox );


				} else {

					// geometry-level bounding box

					if ( geometry.boundingBox === null ) {

						geometry.computeBoundingBox();

					}

					_box$4.copy( geometry.boundingBox );

				}

				_box$4.applyMatrix4( object.matrixWorld );

				this.union( _box$4 );

			}

		}

		const children = object.children;

		for ( let i = 0, l = children.length; i < l; i ++ ) {

			this.expandByObject( children[ i ], precise );

		}

		return this;

	}

	/**
	 * Returns `true` if the given point lies within or on the boundaries of this box.
	 *
	 * @param {Vector3} point - The point to test.
	 * @return {boolean} Whether the bounding box contains the given point or not.
	 */
	containsPoint( point ) {

		return point.x >= this.min.x && point.x <= this.max.x &&
			point.y >= this.min.y && point.y <= this.max.y &&
			point.z >= this.min.z && point.z <= this.max.z;

	}

	/**
	 * Returns `true` if this bounding box includes the entirety of the given bounding box.
	 * If this box and the given one are identical, this function also returns `true`.
	 *
	 * @param {Box3} box - The bounding box to test.
	 * @return {boolean} Whether the bounding box contains the given bounding box or not.
	 */
	containsBox( box ) {

		return this.min.x <= box.min.x && box.max.x <= this.max.x &&
			this.min.y <= box.min.y && box.max.y <= this.max.y &&
			this.min.z <= box.min.z && box.max.z <= this.max.z;

	}

	/**
	 * Returns a point as a proportion of this box's width, height and depth.
	 *
	 * @param {Vector3} point - A point in 3D space.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} A point as a proportion of this box's width, height and depth.
	 */
	getParameter( point, target ) {

		// This can potentially have a divide by zero if the box
		// has a size dimension of 0.

		return target.set(
			( point.x - this.min.x ) / ( this.max.x - this.min.x ),
			( point.y - this.min.y ) / ( this.max.y - this.min.y ),
			( point.z - this.min.z ) / ( this.max.z - this.min.z )
		);

	}

	/**
	 * Returns `true` if the given bounding box intersects with this bounding box.
	 *
	 * @param {Box3} box - The bounding box to test.
	 * @return {boolean} Whether the given bounding box intersects with this bounding box.
	 */
	intersectsBox( box ) {

		// using 6 splitting planes to rule out intersections.
		return box.max.x >= this.min.x && box.min.x <= this.max.x &&
			box.max.y >= this.min.y && box.min.y <= this.max.y &&
			box.max.z >= this.min.z && box.min.z <= this.max.z;

	}

	/**
	 * Returns `true` if the given bounding sphere intersects with this bounding box.
	 *
	 * @param {Sphere} sphere - The bounding sphere to test.
	 * @return {boolean} Whether the given bounding sphere intersects with this bounding box.
	 */
	intersectsSphere( sphere ) {

		// Find the point on the AABB closest to the sphere center.
		this.clampPoint( sphere.center, _vector$b );

		// If that point is inside the sphere, the AABB and sphere intersect.
		return _vector$b.distanceToSquared( sphere.center ) <= ( sphere.radius * sphere.radius );

	}

	/**
	 * Returns `true` if the given plane intersects with this bounding box.
	 *
	 * @param {Plane} plane - The plane to test.
	 * @return {boolean} Whether the given plane intersects with this bounding box.
	 */
	intersectsPlane( plane ) {

		// We compute the minimum and maximum dot product values. If those values
		// are on the same side (back or front) of the plane, then there is no intersection.

		let min, max;

		if ( plane.normal.x > 0 ) {

			min = plane.normal.x * this.min.x;
			max = plane.normal.x * this.max.x;

		} else {

			min = plane.normal.x * this.max.x;
			max = plane.normal.x * this.min.x;

		}

		if ( plane.normal.y > 0 ) {

			min += plane.normal.y * this.min.y;
			max += plane.normal.y * this.max.y;

		} else {

			min += plane.normal.y * this.max.y;
			max += plane.normal.y * this.min.y;

		}

		if ( plane.normal.z > 0 ) {

			min += plane.normal.z * this.min.z;
			max += plane.normal.z * this.max.z;

		} else {

			min += plane.normal.z * this.max.z;
			max += plane.normal.z * this.min.z;

		}

		return ( min <= - plane.constant && max >= - plane.constant );

	}

	/**
	 * Returns `true` if the given triangle intersects with this bounding box.
	 *
	 * @param {Triangle} triangle - The triangle to test.
	 * @return {boolean} Whether the given triangle intersects with this bounding box.
	 */
	intersectsTriangle( triangle ) {

		if ( this.isEmpty() ) {

			return false;

		}

		// compute box center and extents
		this.getCenter( _center );
		_extents.subVectors( this.max, _center );

		// translate triangle to aabb origin
		_v0$2.subVectors( triangle.a, _center );
		_v1$7.subVectors( triangle.b, _center );
		_v2$4.subVectors( triangle.c, _center );

		// compute edge vectors for triangle
		_f0.subVectors( _v1$7, _v0$2 );
		_f1.subVectors( _v2$4, _v1$7 );
		_f2.subVectors( _v0$2, _v2$4 );

		// test against axes that are given by cross product combinations of the edges of the triangle and the edges of the aabb
		// make an axis testing of each of the 3 sides of the aabb against each of the 3 sides of the triangle = 9 axis of separation
		// axis_ij = u_i x f_j (u0, u1, u2 = face normals of aabb = x,y,z axes vectors since aabb is axis aligned)
		let axes = [
			0, - _f0.z, _f0.y, 0, - _f1.z, _f1.y, 0, - _f2.z, _f2.y,
			_f0.z, 0, - _f0.x, _f1.z, 0, - _f1.x, _f2.z, 0, - _f2.x,
			- _f0.y, _f0.x, 0, - _f1.y, _f1.x, 0, - _f2.y, _f2.x, 0
		];
		if ( ! satForAxes( axes, _v0$2, _v1$7, _v2$4, _extents ) ) {

			return false;

		}

		// test 3 face normals from the aabb
		axes = [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ];
		if ( ! satForAxes( axes, _v0$2, _v1$7, _v2$4, _extents ) ) {

			return false;

		}

		// finally testing the face normal of the triangle
		// use already existing triangle edge vectors here
		_triangleNormal.crossVectors( _f0, _f1 );
		axes = [ _triangleNormal.x, _triangleNormal.y, _triangleNormal.z ];

		return satForAxes( axes, _v0$2, _v1$7, _v2$4, _extents );

	}

	/**
	 * Clamps the given point within the bounds of this box.
	 *
	 * @param {Vector3} point - The point to clamp.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The clamped point.
	 */
	clampPoint( point, target ) {

		return target.copy( point ).clamp( this.min, this.max );

	}

	/**
	 * Returns the euclidean distance from any edge of this box to the specified point. If
	 * the given point lies inside of this box, the distance will be `0`.
	 *
	 * @param {Vector3} point - The point to compute the distance to.
	 * @return {number} The euclidean distance.
	 */
	distanceToPoint( point ) {

		return this.clampPoint( point, _vector$b ).distanceTo( point );

	}

	/**
	 * Returns a bounding sphere that encloses this bounding box.
	 *
	 * @param {Sphere} target - The target sphere that is used to store the method's result.
	 * @return {Sphere} The bounding sphere that encloses this bounding box.
	 */
	getBoundingSphere( target ) {

		if ( this.isEmpty() ) {

			target.makeEmpty();

		} else {

			this.getCenter( target.center );

			target.radius = this.getSize( _vector$b ).length() * 0.5;

		}

		return target;

	}

	/**
	 * Computes the intersection of this bounding box and the given one, setting the upper
	 * bound of this box to the lesser of the two boxes' upper bounds and the
	 * lower bound of this box to the greater of the two boxes' lower bounds. If
	 * there's no overlap, makes this box empty.
	 *
	 * @param {Box3} box - The bounding box to intersect with.
	 * @return {Box3} A reference to this bounding box.
	 */
	intersect( box ) {

		this.min.max( box.min );
		this.max.min( box.max );

		// ensure that if there is no overlap, the result is fully empty, not slightly empty with non-inf/+inf values that will cause subsequence intersects to erroneously return valid values.
		if ( this.isEmpty() ) this.makeEmpty();

		return this;

	}

	/**
	 * Computes the union of this box and another and the given one, setting the upper
	 * bound of this box to the greater of the two boxes' upper bounds and the
	 * lower bound of this box to the lesser of the two boxes' lower bounds.
	 *
	 * @param {Box3} box - The bounding box that will be unioned with this instance.
	 * @return {Box3} A reference to this bounding box.
	 */
	union( box ) {

		this.min.min( box.min );
		this.max.max( box.max );

		return this;

	}

	/**
	 * Transforms this bounding box by the given 4x4 transformation matrix.
	 *
	 * @param {Matrix4} matrix - The transformation matrix.
	 * @return {Box3} A reference to this bounding box.
	 */
	applyMatrix4( matrix ) {

		// transform of empty box is an empty box.
		if ( this.isEmpty() ) return this;

		// NOTE: I am using a binary pattern to specify all 2^3 combinations below
		_points[ 0 ].set( this.min.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 000
		_points[ 1 ].set( this.min.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 001
		_points[ 2 ].set( this.min.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 010
		_points[ 3 ].set( this.min.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 011
		_points[ 4 ].set( this.max.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 100
		_points[ 5 ].set( this.max.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 101
		_points[ 6 ].set( this.max.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 110
		_points[ 7 ].set( this.max.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 111

		this.setFromPoints( _points );

		return this;

	}

	/**
	 * Adds the given offset to both the upper and lower bounds of this bounding box,
	 * effectively moving it in 3D space.
	 *
	 * @param {Vector3} offset - The offset that should be used to translate the bounding box.
	 * @return {Box3} A reference to this bounding box.
	 */
	translate( offset ) {

		this.min.add( offset );
		this.max.add( offset );

		return this;

	}

	/**
	 * Returns `true` if this bounding box is equal with the given one.
	 *
	 * @param {Box3} box - The box to test for equality.
	 * @return {boolean} Whether this bounding box is equal with the given one.
	 */
	equals( box ) {

		return box.min.equals( this.min ) && box.max.equals( this.max );

	}

}

const _points = [
	/*@__PURE__*/ new Vector3(),
	/*@__PURE__*/ new Vector3(),
	/*@__PURE__*/ new Vector3(),
	/*@__PURE__*/ new Vector3(),
	/*@__PURE__*/ new Vector3(),
	/*@__PURE__*/ new Vector3(),
	/*@__PURE__*/ new Vector3(),
	/*@__PURE__*/ new Vector3()
];

const _vector$b = /*@__PURE__*/ new Vector3();

const _box$4 = /*@__PURE__*/ new Box3();

// triangle centered vertices

const _v0$2 = /*@__PURE__*/ new Vector3();
const _v1$7 = /*@__PURE__*/ new Vector3();
const _v2$4 = /*@__PURE__*/ new Vector3();

// triangle edge vectors

const _f0 = /*@__PURE__*/ new Vector3();
const _f1 = /*@__PURE__*/ new Vector3();
const _f2 = /*@__PURE__*/ new Vector3();

const _center = /*@__PURE__*/ new Vector3();
const _extents = /*@__PURE__*/ new Vector3();
const _triangleNormal = /*@__PURE__*/ new Vector3();
const _testAxis = /*@__PURE__*/ new Vector3();

function satForAxes( axes, v0, v1, v2, extents ) {

	for ( let i = 0, j = axes.length - 3; i <= j; i += 3 ) {

		_testAxis.fromArray( axes, i );
		// project the aabb onto the separating axis
		const r = extents.x * Math.abs( _testAxis.x ) + extents.y * Math.abs( _testAxis.y ) + extents.z * Math.abs( _testAxis.z );
		// project all 3 vertices of the triangle onto the separating axis
		const p0 = v0.dot( _testAxis );
		const p1 = v1.dot( _testAxis );
		const p2 = v2.dot( _testAxis );
		// actual test, basically see if either of the most extreme of the triangle points intersects r
		if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

			// points of the projected triangle are outside the projected half-length of the aabb
			// the axis is separating and we can exit
			return false;

		}

	}

	return true;

}

const _box$3 = /*@__PURE__*/ new Box3();
const _v1$6 = /*@__PURE__*/ new Vector3();
const _v2$3 = /*@__PURE__*/ new Vector3();

/**
 * An analytical 3D sphere defined by a center and radius. This class is mainly
 * used as a Bounding Sphere for 3D objects.
 */
class Sphere {

	/**
	 * Constructs a new sphere.
	 *
	 * @param {Vector3} [center=(0,0,0)] - The center of the sphere
	 * @param {number} [radius=-1] - The radius of the sphere.
	 */
	constructor( center = new Vector3(), radius = -1 ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isSphere = true;

		/**
		 * The center of the sphere
		 *
		 * @type {Vector3}
		 */
		this.center = center;

		/**
		 * The radius of the sphere.
		 *
		 * @type {number}
		 */
		this.radius = radius;

	}

	/**
	 * Sets the sphere's components by copying the given values.
	 *
	 * @param {Vector3} center - The center.
	 * @param {number} radius - The radius.
	 * @return {Sphere} A reference to this sphere.
	 */
	set( center, radius ) {

		this.center.copy( center );
		this.radius = radius;

		return this;

	}

	/**
	 * Computes the minimum bounding sphere for list of points.
	 * If the optional center point is given, it is used as the sphere's
	 * center. Otherwise, the center of the axis-aligned bounding box
	 * encompassing the points is calculated.
	 *
	 * @param {Array<Vector3>} points - A list of points in 3D space.
	 * @param {Vector3} [optionalCenter] - The center of the sphere.
	 * @return {Sphere} A reference to this sphere.
	 */
	setFromPoints( points, optionalCenter ) {

		const center = this.center;

		if ( optionalCenter !== undefined ) {

			center.copy( optionalCenter );

		} else {

			_box$3.setFromPoints( points ).getCenter( center );

		}

		let maxRadiusSq = 0;

		for ( let i = 0, il = points.length; i < il; i ++ ) {

			maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( points[ i ] ) );

		}

		this.radius = Math.sqrt( maxRadiusSq );

		return this;

	}

	/**
	 * Copies the values of the given sphere to this instance.
	 *
	 * @param {Sphere} sphere - The sphere to copy.
	 * @return {Sphere} A reference to this sphere.
	 */
	copy( sphere ) {

		this.center.copy( sphere.center );
		this.radius = sphere.radius;

		return this;

	}

	/**
	 * Returns `true` if the sphere is empty (the radius set to a negative number).
	 *
	 * Spheres with a radius of `0` contain only their center point and are not
	 * considered to be empty.
	 *
	 * @return {boolean} Whether this sphere is empty or not.
	 */
	isEmpty() {

		return ( this.radius < 0 );

	}

	/**
	 * Makes this sphere empty which means in encloses a zero space in 3D.
	 *
	 * @return {Sphere} A reference to this sphere.
	 */
	makeEmpty() {

		this.center.set( 0, 0, 0 );
		this.radius = -1;

		return this;

	}

	/**
	 * Returns `true` if this sphere contains the given point inclusive of
	 * the surface of the sphere.
	 *
	 * @param {Vector3} point - The point to check.
	 * @return {boolean} Whether this sphere contains the given point or not.
	 */
	containsPoint( point ) {

		return ( point.distanceToSquared( this.center ) <= ( this.radius * this.radius ) );

	}

	/**
	 * Returns the closest distance from the boundary of the sphere to the
	 * given point. If the sphere contains the point, the distance will
	 * be negative.
	 *
	 * @param {Vector3} point - The point to compute the distance to.
	 * @return {number} The distance to the point.
	 */
	distanceToPoint( point ) {

		return ( point.distanceTo( this.center ) - this.radius );

	}

	/**
	 * Returns `true` if this sphere intersects with the given one.
	 *
	 * @param {Sphere} sphere - The sphere to test.
	 * @return {boolean} Whether this sphere intersects with the given one or not.
	 */
	intersectsSphere( sphere ) {

		const radiusSum = this.radius + sphere.radius;

		return sphere.center.distanceToSquared( this.center ) <= ( radiusSum * radiusSum );

	}

	/**
	 * Returns `true` if this sphere intersects with the given box.
	 *
	 * @param {Box3} box - The box to test.
	 * @return {boolean} Whether this sphere intersects with the given box or not.
	 */
	intersectsBox( box ) {

		return box.intersectsSphere( this );

	}

	/**
	 * Returns `true` if this sphere intersects with the given plane.
	 *
	 * @param {Plane} plane - The plane to test.
	 * @return {boolean} Whether this sphere intersects with the given plane or not.
	 */
	intersectsPlane( plane ) {

		return Math.abs( plane.distanceToPoint( this.center ) ) <= this.radius;

	}

	/**
	 * Clamps a point within the sphere. If the point is outside the sphere, it
	 * will clamp it to the closest point on the edge of the sphere. Points
	 * already inside the sphere will not be affected.
	 *
	 * @param {Vector3} point - The plane to clamp.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The clamped point.
	 */
	clampPoint( point, target ) {

		const deltaLengthSq = this.center.distanceToSquared( point );

		target.copy( point );

		if ( deltaLengthSq > ( this.radius * this.radius ) ) {

			target.sub( this.center ).normalize();
			target.multiplyScalar( this.radius ).add( this.center );

		}

		return target;

	}

	/**
	 * Returns a bounding box that encloses this sphere.
	 *
	 * @param {Box3} target - The target box that is used to store the method's result.
	 * @return {Box3} The bounding box that encloses this sphere.
	 */
	getBoundingBox( target ) {

		if ( this.isEmpty() ) {

			// Empty sphere produces empty bounding box
			target.makeEmpty();
			return target;

		}

		target.set( this.center, this.center );
		target.expandByScalar( this.radius );

		return target;

	}

	/**
	 * Transforms this sphere with the given 4x4 transformation matrix.
	 *
	 * @param {Matrix4} matrix - The transformation matrix.
	 * @return {Sphere} A reference to this sphere.
	 */
	applyMatrix4( matrix ) {

		this.center.applyMatrix4( matrix );
		this.radius = this.radius * matrix.getMaxScaleOnAxis();

		return this;

	}

	/**
	 * Translates the sphere's center by the given offset.
	 *
	 * @param {Vector3} offset - The offset.
	 * @return {Sphere} A reference to this sphere.
	 */
	translate( offset ) {

		this.center.add( offset );

		return this;

	}

	/**
	 * Expands the boundaries of this sphere to include the given point.
	 *
	 * @param {Vector3} point - The point to include.
	 * @return {Sphere} A reference to this sphere.
	 */
	expandByPoint( point ) {

		if ( this.isEmpty() ) {

			this.center.copy( point );

			this.radius = 0;

			return this;

		}

		_v1$6.subVectors( point, this.center );

		const lengthSq = _v1$6.lengthSq();

		if ( lengthSq > ( this.radius * this.radius ) ) {

			// calculate the minimal sphere

			const length = Math.sqrt( lengthSq );

			const delta = ( length - this.radius ) * 0.5;

			this.center.addScaledVector( _v1$6, delta / length );

			this.radius += delta;

		}

		return this;

	}

	/**
	 * Expands this sphere to enclose both the original sphere and the given sphere.
	 *
	 * @param {Sphere} sphere - The sphere to include.
	 * @return {Sphere} A reference to this sphere.
	 */
	union( sphere ) {

		if ( sphere.isEmpty() ) {

			return this;

		}

		if ( this.isEmpty() ) {

			this.copy( sphere );

			return this;

		}

		if ( this.center.equals( sphere.center ) === true ) {

			 this.radius = Math.max( this.radius, sphere.radius );

		} else {

			_v2$3.subVectors( sphere.center, this.center ).setLength( sphere.radius );

			this.expandByPoint( _v1$6.copy( sphere.center ).add( _v2$3 ) );

			this.expandByPoint( _v1$6.copy( sphere.center ).sub( _v2$3 ) );

		}

		return this;

	}

	/**
	 * Returns `true` if this sphere is equal with the given one.
	 *
	 * @param {Sphere} sphere - The sphere to test for equality.
	 * @return {boolean} Whether this bounding sphere is equal with the given one.
	 */
	equals( sphere ) {

		return sphere.center.equals( this.center ) && ( sphere.radius === this.radius );

	}

	/**
	 * Returns a new sphere with copied values from this instance.
	 *
	 * @return {Sphere} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

}

const _vector$a = /*@__PURE__*/ new Vector3();
const _segCenter = /*@__PURE__*/ new Vector3();
const _segDir = /*@__PURE__*/ new Vector3();
const _diff = /*@__PURE__*/ new Vector3();

const _edge1 = /*@__PURE__*/ new Vector3();
const _edge2 = /*@__PURE__*/ new Vector3();
const _normal$1 = /*@__PURE__*/ new Vector3();

/**
 * A ray that emits from an origin in a certain direction. The class is used by
 * {@link Raycaster} to assist with raycasting. Raycasting is used for
 * mouse picking (working out what objects in the 3D space the mouse is over)
 * amongst other things.
 */
class Ray {

	/**
	 * Constructs a new ray.
	 *
	 * @param {Vector3} [origin=(0,0,0)] - The origin of the ray.
	 * @param {Vector3} [direction=(0,0,-1)] - The (normalized) direction of the ray.
	 */
	constructor( origin = new Vector3(), direction = new Vector3( 0, 0, -1 ) ) {

		/**
		 * The origin of the ray.
		 *
		 * @type {Vector3}
		 */
		this.origin = origin;

		/**
		 * The (normalized) direction of the ray.
		 *
		 * @type {Vector3}
		 */
		this.direction = direction;

	}

	/**
	 * Sets the ray's components by copying the given values.
	 *
	 * @param {Vector3} origin - The origin.
	 * @param {Vector3} direction - The direction.
	 * @return {Ray} A reference to this ray.
	 */
	set( origin, direction ) {

		this.origin.copy( origin );
		this.direction.copy( direction );

		return this;

	}

	/**
	 * Copies the values of the given ray to this instance.
	 *
	 * @param {Ray} ray - The ray to copy.
	 * @return {Ray} A reference to this ray.
	 */
	copy( ray ) {

		this.origin.copy( ray.origin );
		this.direction.copy( ray.direction );

		return this;

	}

	/**
	 * Returns a vector that is located at a given distance along this ray.
	 *
	 * @param {number} t - The distance along the ray to retrieve a position for.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} A position on the ray.
	 */
	at( t, target ) {

		return target.copy( this.origin ).addScaledVector( this.direction, t );

	}

	/**
	 * Adjusts the direction of the ray to point at the given vector in world space.
	 *
	 * @param {Vector3} v - The target position.
	 * @return {Ray} A reference to this ray.
	 */
	lookAt( v ) {

		this.direction.copy( v ).sub( this.origin ).normalize();

		return this;

	}

	/**
	 * Shift the origin of this ray along its direction by the given distance.
	 *
	 * @param {number} t - The distance along the ray to interpolate.
	 * @return {Ray} A reference to this ray.
	 */
	recast( t ) {

		this.origin.copy( this.at( t, _vector$a ) );

		return this;

	}

	/**
	 * Returns the point along this ray that is closest to the given point.
	 *
	 * @param {Vector3} point - A point in 3D space to get the closet location on the ray for.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The closest point on this ray.
	 */
	closestPointToPoint( point, target ) {

		target.subVectors( point, this.origin );

		const directionDistance = target.dot( this.direction );

		if ( directionDistance < 0 ) {

			return target.copy( this.origin );

		}

		return target.copy( this.origin ).addScaledVector( this.direction, directionDistance );

	}

	/**
	 * Returns the distance of the closest approach between this ray and the given point.
	 *
	 * @param {Vector3} point - A point in 3D space to compute the distance to.
	 * @return {number} The distance.
	 */
	distanceToPoint( point ) {

		return Math.sqrt( this.distanceSqToPoint( point ) );

	}

	/**
	 * Returns the squared distance of the closest approach between this ray and the given point.
	 *
	 * @param {Vector3} point - A point in 3D space to compute the distance to.
	 * @return {number} The squared distance.
	 */
	distanceSqToPoint( point ) {

		const directionDistance = _vector$a.subVectors( point, this.origin ).dot( this.direction );

		// point behind the ray

		if ( directionDistance < 0 ) {

			return this.origin.distanceToSquared( point );

		}

		_vector$a.copy( this.origin ).addScaledVector( this.direction, directionDistance );

		return _vector$a.distanceToSquared( point );

	}

	/**
	 * Returns the squared distance between this ray and the given line segment.
	 *
	 * @param {Vector3} v0 - The start point of the line segment.
	 * @param {Vector3} v1 - The end point of the line segment.
	 * @param {Vector3} [optionalPointOnRay] - When provided, it receives the point on this ray that is closest to the segment.
	 * @param {Vector3} [optionalPointOnSegment] - When provided, it receives the point on the line segment that is closest to this ray.
	 * @return {number} The squared distance.
	 */
	distanceSqToSegment( v0, v1, optionalPointOnRay, optionalPointOnSegment ) {

		// from https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteDistRaySegment.h
		// It returns the min distance between the ray and the segment
		// defined by v0 and v1
		// It can also set two optional targets :
		// - The closest point on the ray
		// - The closest point on the segment

		_segCenter.copy( v0 ).add( v1 ).multiplyScalar( 0.5 );
		_segDir.copy( v1 ).sub( v0 ).normalize();
		_diff.copy( this.origin ).sub( _segCenter );

		const segExtent = v0.distanceTo( v1 ) * 0.5;
		const a01 = - this.direction.dot( _segDir );
		const b0 = _diff.dot( this.direction );
		const b1 = - _diff.dot( _segDir );
		const c = _diff.lengthSq();
		const det = Math.abs( 1 - a01 * a01 );
		let s0, s1, sqrDist, extDet;

		if ( det > 0 ) {

			// The ray and segment are not parallel.

			s0 = a01 * b1 - b0;
			s1 = a01 * b0 - b1;
			extDet = segExtent * det;

			if ( s0 >= 0 ) {

				if ( s1 >= - extDet ) {

					if ( s1 <= extDet ) {

						// region 0
						// Minimum at interior points of ray and segment.

						const invDet = 1 / det;
						s0 *= invDet;
						s1 *= invDet;
						sqrDist = s0 * ( s0 + a01 * s1 + 2 * b0 ) + s1 * ( a01 * s0 + s1 + 2 * b1 ) + c;

					} else {

						// region 1

						s1 = segExtent;
						s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					}

				} else {

					// region 5

					s1 = - segExtent;
					s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
					sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

				}

			} else {

				if ( s1 <= - extDet ) {

					// region 4

					s0 = Math.max( 0, - ( - a01 * segExtent + b0 ) );
					s1 = ( s0 > 0 ) ? - segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
					sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

				} else if ( s1 <= extDet ) {

					// region 3

					s0 = 0;
					s1 = Math.min( Math.max( - segExtent, - b1 ), segExtent );
					sqrDist = s1 * ( s1 + 2 * b1 ) + c;

				} else {

					// region 2

					s0 = Math.max( 0, - ( a01 * segExtent + b0 ) );
					s1 = ( s0 > 0 ) ? segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
					sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

				}

			}

		} else {

			// Ray and segment are parallel.

			s1 = ( a01 > 0 ) ? - segExtent : segExtent;
			s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
			sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

		}

		if ( optionalPointOnRay ) {

			optionalPointOnRay.copy( this.origin ).addScaledVector( this.direction, s0 );

		}

		if ( optionalPointOnSegment ) {

			optionalPointOnSegment.copy( _segCenter ).addScaledVector( _segDir, s1 );

		}

		return sqrDist;

	}

	/**
	 * Intersects this ray with the given sphere, returning the intersection
	 * point or `null` if there is no intersection.
	 *
	 * @param {Sphere} sphere - The sphere to intersect.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {?Vector3} The intersection point.
	 */
	intersectSphere( sphere, target ) {

		_vector$a.subVectors( sphere.center, this.origin );
		const tca = _vector$a.dot( this.direction );
		const d2 = _vector$a.dot( _vector$a ) - tca * tca;
		const radius2 = sphere.radius * sphere.radius;

		if ( d2 > radius2 ) return null;

		const thc = Math.sqrt( radius2 - d2 );

		// t0 = first intersect point - entrance on front of sphere
		const t0 = tca - thc;

		// t1 = second intersect point - exit point on back of sphere
		const t1 = tca + thc;

		// test to see if t1 is behind the ray - if so, return null
		if ( t1 < 0 ) return null;

		// test to see if t0 is behind the ray:
		// if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
		// in order to always return an intersect point that is in front of the ray.
		if ( t0 < 0 ) return this.at( t1, target );

		// else t0 is in front of the ray, so return the first collision point scaled by t0
		return this.at( t0, target );

	}

	/**
	 * Returns `true` if this ray intersects with the given sphere.
	 *
	 * @param {Sphere} sphere - The sphere to intersect.
	 * @return {boolean} Whether this ray intersects with the given sphere or not.
	 */
	intersectsSphere( sphere ) {

		return this.distanceSqToPoint( sphere.center ) <= ( sphere.radius * sphere.radius );

	}

	/**
	 * Computes the distance from the ray's origin to the given plane. Returns `null` if the ray
	 * does not intersect with the plane.
	 *
	 * @param {Plane} plane - The plane to compute the distance to.
	 * @return {?number} Whether this ray intersects with the given sphere or not.
	 */
	distanceToPlane( plane ) {

		const denominator = plane.normal.dot( this.direction );

		if ( denominator === 0 ) {

			// line is coplanar, return origin
			if ( plane.distanceToPoint( this.origin ) === 0 ) {

				return 0;

			}

			// Null is preferable to undefined since undefined means.... it is undefined

			return null;

		}

		const t = - ( this.origin.dot( plane.normal ) + plane.constant ) / denominator;

		// Return if the ray never intersects the plane

		return t >= 0 ? t : null;

	}

	/**
	 * Intersects this ray with the given plane, returning the intersection
	 * point or `null` if there is no intersection.
	 *
	 * @param {Plane} plane - The plane to intersect.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {?Vector3} The intersection point.
	 */
	intersectPlane( plane, target ) {

		const t = this.distanceToPlane( plane );

		if ( t === null ) {

			return null;

		}

		return this.at( t, target );

	}

	/**
	 * Returns `true` if this ray intersects with the given plane.
	 *
	 * @param {Plane} plane - The plane to intersect.
	 * @return {boolean} Whether this ray intersects with the given plane or not.
	 */
	intersectsPlane( plane ) {

		// check if the ray lies on the plane first

		const distToPoint = plane.distanceToPoint( this.origin );

		if ( distToPoint === 0 ) {

			return true;

		}

		const denominator = plane.normal.dot( this.direction );

		if ( denominator * distToPoint < 0 ) {

			return true;

		}

		// ray origin is behind the plane (and is pointing behind it)

		return false;

	}

	/**
	 * Intersects this ray with the given bounding box, returning the intersection
	 * point or `null` if there is no intersection.
	 *
	 * @param {Box3} box - The box to intersect.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {?Vector3} The intersection point.
	 */
	intersectBox( box, target ) {

		let tmin, tmax, tymin, tymax, tzmin, tzmax;

		const invdirx = 1 / this.direction.x,
			invdiry = 1 / this.direction.y,
			invdirz = 1 / this.direction.z;

		const origin = this.origin;

		if ( invdirx >= 0 ) {

			tmin = ( box.min.x - origin.x ) * invdirx;
			tmax = ( box.max.x - origin.x ) * invdirx;

		} else {

			tmin = ( box.max.x - origin.x ) * invdirx;
			tmax = ( box.min.x - origin.x ) * invdirx;

		}

		if ( invdiry >= 0 ) {

			tymin = ( box.min.y - origin.y ) * invdiry;
			tymax = ( box.max.y - origin.y ) * invdiry;

		} else {

			tymin = ( box.max.y - origin.y ) * invdiry;
			tymax = ( box.min.y - origin.y ) * invdiry;

		}

		if ( ( tmin > tymax ) || ( tymin > tmax ) ) return null;

		if ( tymin > tmin || isNaN( tmin ) ) tmin = tymin;

		if ( tymax < tmax || isNaN( tmax ) ) tmax = tymax;

		if ( invdirz >= 0 ) {

			tzmin = ( box.min.z - origin.z ) * invdirz;
			tzmax = ( box.max.z - origin.z ) * invdirz;

		} else {

			tzmin = ( box.max.z - origin.z ) * invdirz;
			tzmax = ( box.min.z - origin.z ) * invdirz;

		}

		if ( ( tmin > tzmax ) || ( tzmin > tmax ) ) return null;

		if ( tzmin > tmin || tmin !== tmin ) tmin = tzmin;

		if ( tzmax < tmax || tmax !== tmax ) tmax = tzmax;

		//return point closest to the ray (positive side)

		if ( tmax < 0 ) return null;

		return this.at( tmin >= 0 ? tmin : tmax, target );

	}

	/**
	 * Returns `true` if this ray intersects with the given box.
	 *
	 * @param {Box3} box - The box to intersect.
	 * @return {boolean} Whether this ray intersects with the given box or not.
	 */
	intersectsBox( box ) {

		return this.intersectBox( box, _vector$a ) !== null;

	}

	/**
	 * Intersects this ray with the given triangle, returning the intersection
	 * point or `null` if there is no intersection.
	 *
	 * @param {Vector3} a - The first vertex of the triangle.
	 * @param {Vector3} b - The second vertex of the triangle.
	 * @param {Vector3} c - The third vertex of the triangle.
	 * @param {boolean} backfaceCulling - Whether to use backface culling or not.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {?Vector3} The intersection point.
	 */
	intersectTriangle( a, b, c, backfaceCulling, target ) {

		// Compute the offset origin, edges, and normal.

		// from https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

		_edge1.subVectors( b, a );
		_edge2.subVectors( c, a );
		_normal$1.crossVectors( _edge1, _edge2 );

		// Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
		// E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
		//   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
		//   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
		//   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
		let DdN = this.direction.dot( _normal$1 );
		let sign;

		if ( DdN > 0 ) {

			if ( backfaceCulling ) return null;
			sign = 1;

		} else if ( DdN < 0 ) {

			sign = -1;
			DdN = - DdN;

		} else {

			return null;

		}

		_diff.subVectors( this.origin, a );
		const DdQxE2 = sign * this.direction.dot( _edge2.crossVectors( _diff, _edge2 ) );

		// b1 < 0, no intersection
		if ( DdQxE2 < 0 ) {

			return null;

		}

		const DdE1xQ = sign * this.direction.dot( _edge1.cross( _diff ) );

		// b2 < 0, no intersection
		if ( DdE1xQ < 0 ) {

			return null;

		}

		// b1+b2 > 1, no intersection
		if ( DdQxE2 + DdE1xQ > DdN ) {

			return null;

		}

		// Line intersects triangle, check if ray does.
		const QdN = - sign * _diff.dot( _normal$1 );

		// t < 0, no intersection
		if ( QdN < 0 ) {

			return null;

		}

		// Ray intersects triangle.
		return this.at( QdN / DdN, target );

	}

	/**
	 * Transforms this ray with the given 4x4 transformation matrix.
	 *
	 * @param {Matrix4} matrix4 - The transformation matrix.
	 * @return {Ray} A reference to this ray.
	 */
	applyMatrix4( matrix4 ) {

		this.origin.applyMatrix4( matrix4 );
		this.direction.transformDirection( matrix4 );

		return this;

	}

	/**
	 * Returns `true` if this ray is equal with the given one.
	 *
	 * @param {Ray} ray - The ray to test for equality.
	 * @return {boolean} Whether this ray is equal with the given one.
	 */
	equals( ray ) {

		return ray.origin.equals( this.origin ) && ray.direction.equals( this.direction );

	}

	/**
	 * Returns a new ray with copied values from this instance.
	 *
	 * @return {Ray} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

}

/**
 * Represents a 4x4 matrix.
 *
 * The most common use of a 4x4 matrix in 3D computer graphics is as a transformation matrix.
 * For an introduction to transformation matrices as used in WebGL, check out [this tutorial]{@link https://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices}
 *
 * This allows a 3D vector representing a point in 3D space to undergo
 * transformations such as translation, rotation, shear, scale, reflection,
 * orthogonal or perspective projection and so on, by being multiplied by the
 * matrix. This is known as `applying` the matrix to the vector.
 *
 * A Note on Row-Major and Column-Major Ordering:
 *
 * The constructor and {@link Matrix3#set} method take arguments in
 * [row-major]{@link https://en.wikipedia.org/wiki/Row-_and_column-major_order#Column-major_order}
 * order, while internally they are stored in the {@link Matrix3#elements} array in column-major order.
 * This means that calling:
 * ```js
 * const m = new THREE.Matrix4();
 * m.set( 11, 12, 13, 14,
 *        21, 22, 23, 24,
 *        31, 32, 33, 34,
 *        41, 42, 43, 44 );
 * ```
 * will result in the elements array containing:
 * ```js
 * m.elements = [ 11, 21, 31, 41,
 *                12, 22, 32, 42,
 *                13, 23, 33, 43,
 *                14, 24, 34, 44 ];
 * ```
 * and internally all calculations are performed using column-major ordering.
 * However, as the actual ordering makes no difference mathematically and
 * most people are used to thinking about matrices in row-major order, the
 * three.js documentation shows matrices in row-major order. Just bear in
 * mind that if you are reading the source code, you'll have to take the
 * transpose of any matrices outlined here to make sense of the calculations.
 */
class Matrix4 {

	/**
	 * Constructs a new 4x4 matrix. The arguments are supposed to be
	 * in row-major order. If no arguments are provided, the constructor
	 * initializes the matrix as an identity matrix.
	 *
	 * @param {number} [n11] - 1-1 matrix element.
	 * @param {number} [n12] - 1-2 matrix element.
	 * @param {number} [n13] - 1-3 matrix element.
	 * @param {number} [n14] - 1-4 matrix element.
	 * @param {number} [n21] - 2-1 matrix element.
	 * @param {number} [n22] - 2-2 matrix element.
	 * @param {number} [n23] - 2-3 matrix element.
	 * @param {number} [n24] - 2-4 matrix element.
	 * @param {number} [n31] - 3-1 matrix element.
	 * @param {number} [n32] - 3-2 matrix element.
	 * @param {number} [n33] - 3-3 matrix element.
	 * @param {number} [n34] - 3-4 matrix element.
	 * @param {number} [n41] - 4-1 matrix element.
	 * @param {number} [n42] - 4-2 matrix element.
	 * @param {number} [n43] - 4-3 matrix element.
	 * @param {number} [n44] - 4-4 matrix element.
	 */
	constructor( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Matrix4.prototype.isMatrix4 = true;

		/**
		 * A column-major list of matrix values.
		 *
		 * @type {Array<number>}
		 */
		this.elements = [

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		];

		if ( n11 !== undefined ) {

			this.set( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 );

		}

	}

	/**
	 * Sets the elements of the matrix.The arguments are supposed to be
	 * in row-major order.
	 *
	 * @param {number} [n11] - 1-1 matrix element.
	 * @param {number} [n12] - 1-2 matrix element.
	 * @param {number} [n13] - 1-3 matrix element.
	 * @param {number} [n14] - 1-4 matrix element.
	 * @param {number} [n21] - 2-1 matrix element.
	 * @param {number} [n22] - 2-2 matrix element.
	 * @param {number} [n23] - 2-3 matrix element.
	 * @param {number} [n24] - 2-4 matrix element.
	 * @param {number} [n31] - 3-1 matrix element.
	 * @param {number} [n32] - 3-2 matrix element.
	 * @param {number} [n33] - 3-3 matrix element.
	 * @param {number} [n34] - 3-4 matrix element.
	 * @param {number} [n41] - 4-1 matrix element.
	 * @param {number} [n42] - 4-2 matrix element.
	 * @param {number} [n43] - 4-3 matrix element.
	 * @param {number} [n44] - 4-4 matrix element.
	 * @return {Matrix4} A reference to this matrix.
	 */
	set( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

		const te = this.elements;

		te[ 0 ] = n11; te[ 4 ] = n12; te[ 8 ] = n13; te[ 12 ] = n14;
		te[ 1 ] = n21; te[ 5 ] = n22; te[ 9 ] = n23; te[ 13 ] = n24;
		te[ 2 ] = n31; te[ 6 ] = n32; te[ 10 ] = n33; te[ 14 ] = n34;
		te[ 3 ] = n41; te[ 7 ] = n42; te[ 11 ] = n43; te[ 15 ] = n44;

		return this;

	}

	/**
	 * Sets this matrix to the 4x4 identity matrix.
	 *
	 * @return {Matrix4} A reference to this matrix.
	 */
	identity() {

		this.set(

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Returns a matrix with copied values from this instance.
	 *
	 * @return {Matrix4} A clone of this instance.
	 */
	clone() {

		return new Matrix4().fromArray( this.elements );

	}

	/**
	 * Copies the values of the given matrix to this instance.
	 *
	 * @param {Matrix4} m - The matrix to copy.
	 * @return {Matrix4} A reference to this matrix.
	 */
	copy( m ) {

		const te = this.elements;
		const me = m.elements;

		te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ]; te[ 3 ] = me[ 3 ];
		te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ]; te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ];
		te[ 8 ] = me[ 8 ]; te[ 9 ] = me[ 9 ]; te[ 10 ] = me[ 10 ]; te[ 11 ] = me[ 11 ];
		te[ 12 ] = me[ 12 ]; te[ 13 ] = me[ 13 ]; te[ 14 ] = me[ 14 ]; te[ 15 ] = me[ 15 ];

		return this;

	}

	/**
	 * Copies the translation component of the given matrix
	 * into this matrix's translation component.
	 *
	 * @param {Matrix4} m - The matrix to copy the translation component.
	 * @return {Matrix4} A reference to this matrix.
	 */
	copyPosition( m ) {

		const te = this.elements, me = m.elements;

		te[ 12 ] = me[ 12 ];
		te[ 13 ] = me[ 13 ];
		te[ 14 ] = me[ 14 ];

		return this;

	}

	/**
	 * Set the upper 3x3 elements of this matrix to the values of given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The 3x3 matrix.
	 * @return {Matrix4} A reference to this matrix.
	 */
	setFromMatrix3( m ) {

		const me = m.elements;

		this.set(

			me[ 0 ], me[ 3 ], me[ 6 ], 0,
			me[ 1 ], me[ 4 ], me[ 7 ], 0,
			me[ 2 ], me[ 5 ], me[ 8 ], 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Extracts the basis of this matrix into the three axis vectors provided.
	 *
	 * @param {Vector3} xAxis - The basis's x axis.
	 * @param {Vector3} yAxis - The basis's y axis.
	 * @param {Vector3} zAxis - The basis's z axis.
	 * @return {Matrix4} A reference to this matrix.
	 */
	extractBasis( xAxis, yAxis, zAxis ) {

		xAxis.setFromMatrixColumn( this, 0 );
		yAxis.setFromMatrixColumn( this, 1 );
		zAxis.setFromMatrixColumn( this, 2 );

		return this;

	}

	/**
	 * Sets the given basis vectors to this matrix.
	 *
	 * @param {Vector3} xAxis - The basis's x axis.
	 * @param {Vector3} yAxis - The basis's y axis.
	 * @param {Vector3} zAxis - The basis's z axis.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeBasis( xAxis, yAxis, zAxis ) {

		this.set(
			xAxis.x, yAxis.x, zAxis.x, 0,
			xAxis.y, yAxis.y, zAxis.y, 0,
			xAxis.z, yAxis.z, zAxis.z, 0,
			0, 0, 0, 1
		);

		return this;

	}

	/**
	 * Extracts the rotation component of the given matrix
	 * into this matrix's rotation component.
	 *
	 * Note: This method does not support reflection matrices.
	 *
	 * @param {Matrix4} m - The matrix.
	 * @return {Matrix4} A reference to this matrix.
	 */
	extractRotation( m ) {

		const te = this.elements;
		const me = m.elements;

		const scaleX = 1 / _v1$5.setFromMatrixColumn( m, 0 ).length();
		const scaleY = 1 / _v1$5.setFromMatrixColumn( m, 1 ).length();
		const scaleZ = 1 / _v1$5.setFromMatrixColumn( m, 2 ).length();

		te[ 0 ] = me[ 0 ] * scaleX;
		te[ 1 ] = me[ 1 ] * scaleX;
		te[ 2 ] = me[ 2 ] * scaleX;
		te[ 3 ] = 0;

		te[ 4 ] = me[ 4 ] * scaleY;
		te[ 5 ] = me[ 5 ] * scaleY;
		te[ 6 ] = me[ 6 ] * scaleY;
		te[ 7 ] = 0;

		te[ 8 ] = me[ 8 ] * scaleZ;
		te[ 9 ] = me[ 9 ] * scaleZ;
		te[ 10 ] = me[ 10 ] * scaleZ;
		te[ 11 ] = 0;

		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;

	}

	/**
	 * Sets the rotation component (the upper left 3x3 matrix) of this matrix to
	 * the rotation specified by the given Euler angles. The rest of
	 * the matrix is set to the identity. Depending on the {@link Euler#order},
	 * there are six possible outcomes. See [this page]{@link https://en.wikipedia.org/wiki/Euler_angles#Rotation_matrix}
	 * for a complete list.
	 *
	 * @param {Euler} euler - The Euler angles.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationFromEuler( euler ) {

		const te = this.elements;

		const x = euler.x, y = euler.y, z = euler.z;
		const a = Math.cos( x ), b = Math.sin( x );
		const c = Math.cos( y ), d = Math.sin( y );
		const e = Math.cos( z ), f = Math.sin( z );

		if ( euler.order === 'XYZ' ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = - c * f;
			te[ 8 ] = d;

			te[ 1 ] = af + be * d;
			te[ 5 ] = ae - bf * d;
			te[ 9 ] = - b * c;

			te[ 2 ] = bf - ae * d;
			te[ 6 ] = be + af * d;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YXZ' ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce + df * b;
			te[ 4 ] = de * b - cf;
			te[ 8 ] = a * d;

			te[ 1 ] = a * f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b;

			te[ 2 ] = cf * b - de;
			te[ 6 ] = df + ce * b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZXY' ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce - df * b;
			te[ 4 ] = - a * f;
			te[ 8 ] = de + cf * b;

			te[ 1 ] = cf + de * b;
			te[ 5 ] = a * e;
			te[ 9 ] = df - ce * b;

			te[ 2 ] = - a * d;
			te[ 6 ] = b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZYX' ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = be * d - af;
			te[ 8 ] = ae * d + bf;

			te[ 1 ] = c * f;
			te[ 5 ] = bf * d + ae;
			te[ 9 ] = af * d - be;

			te[ 2 ] = - d;
			te[ 6 ] = b * c;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YZX' ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = bd - ac * f;
			te[ 8 ] = bc * f + ad;

			te[ 1 ] = f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b * e;

			te[ 2 ] = - d * e;
			te[ 6 ] = ad * f + bc;
			te[ 10 ] = ac - bd * f;

		} else if ( euler.order === 'XZY' ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = - f;
			te[ 8 ] = d * e;

			te[ 1 ] = ac * f + bd;
			te[ 5 ] = a * e;
			te[ 9 ] = ad * f - bc;

			te[ 2 ] = bc * f - ad;
			te[ 6 ] = b * e;
			te[ 10 ] = bd * f + ac;

		}

		// bottom row
		te[ 3 ] = 0;
		te[ 7 ] = 0;
		te[ 11 ] = 0;

		// last column
		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;

	}

	/**
	 * Sets the rotation component of this matrix to the rotation specified by
	 * the given Quaternion as outlined [here]{@link https://en.wikipedia.org/wiki/Rotation_matrix#Quaternion}
	 * The rest of the matrix is set to the identity.
	 *
	 * @param {Quaternion} q - The Quaternion.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationFromQuaternion( q ) {

		return this.compose( _zero, q, _one );

	}

	/**
	 * Sets the rotation component of the transformation matrix, looking from `eye` towards
	 * `target`, and oriented by the up-direction.
	 *
	 * @param {Vector3} eye - The eye vector.
	 * @param {Vector3} target - The target vector.
	 * @param {Vector3} up - The up vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	lookAt( eye, target, up ) {

		const te = this.elements;

		_z.subVectors( eye, target );

		if ( _z.lengthSq() === 0 ) {

			// eye and target are in the same position

			_z.z = 1;

		}

		_z.normalize();
		_x.crossVectors( up, _z );

		if ( _x.lengthSq() === 0 ) {

			// up and z are parallel

			if ( Math.abs( up.z ) === 1 ) {

				_z.x += 0.0001;

			} else {

				_z.z += 0.0001;

			}

			_z.normalize();
			_x.crossVectors( up, _z );

		}

		_x.normalize();
		_y.crossVectors( _z, _x );

		te[ 0 ] = _x.x; te[ 4 ] = _y.x; te[ 8 ] = _z.x;
		te[ 1 ] = _x.y; te[ 5 ] = _y.y; te[ 9 ] = _z.y;
		te[ 2 ] = _x.z; te[ 6 ] = _y.z; te[ 10 ] = _z.z;

		return this;

	}

	/**
	 * Post-multiplies this matrix by the given 4x4 matrix.
	 *
	 * @param {Matrix4} m - The matrix to multiply with.
	 * @return {Matrix4} A reference to this matrix.
	 */
	multiply( m ) {

		return this.multiplyMatrices( this, m );

	}

	/**
	 * Pre-multiplies this matrix by the given 4x4 matrix.
	 *
	 * @param {Matrix4} m - The matrix to multiply with.
	 * @return {Matrix4} A reference to this matrix.
	 */
	premultiply( m ) {

		return this.multiplyMatrices( m, this );

	}

	/**
	 * Multiples the given 4x4 matrices and stores the result
	 * in this matrix.
	 *
	 * @param {Matrix4} a - The first matrix.
	 * @param {Matrix4} b - The second matrix.
	 * @return {Matrix4} A reference to this matrix.
	 */
	multiplyMatrices( a, b ) {

		const ae = a.elements;
		const be = b.elements;
		const te = this.elements;

		const a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
		const a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
		const a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
		const a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

		const b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
		const b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
		const b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
		const b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

		te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

		te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

		te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

		te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

		return this;

	}

	/**
	 * Multiplies every component of the matrix by the given scalar.
	 *
	 * @param {number} s - The scalar.
	 * @return {Matrix4} A reference to this matrix.
	 */
	multiplyScalar( s ) {

		const te = this.elements;

		te[ 0 ] *= s; te[ 4 ] *= s; te[ 8 ] *= s; te[ 12 ] *= s;
		te[ 1 ] *= s; te[ 5 ] *= s; te[ 9 ] *= s; te[ 13 ] *= s;
		te[ 2 ] *= s; te[ 6 ] *= s; te[ 10 ] *= s; te[ 14 ] *= s;
		te[ 3 ] *= s; te[ 7 ] *= s; te[ 11 ] *= s; te[ 15 ] *= s;

		return this;

	}

	/**
	 * Computes and returns the determinant of this matrix.
	 *
	 * Based on the method outlined [here]{@link http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.html}.
	 *
	 * @return {number} The determinant.
	 */
	determinant() {

		const te = this.elements;

		const n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
		const n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
		const n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
		const n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];

		//TODO: make this more efficient

		return (
			n41 * (
				+ n14 * n23 * n32
				 - n13 * n24 * n32
				 - n14 * n22 * n33
				 + n12 * n24 * n33
				 + n13 * n22 * n34
				 - n12 * n23 * n34
			) +
			n42 * (
				+ n11 * n23 * n34
				 - n11 * n24 * n33
				 + n14 * n21 * n33
				 - n13 * n21 * n34
				 + n13 * n24 * n31
				 - n14 * n23 * n31
			) +
			n43 * (
				+ n11 * n24 * n32
				 - n11 * n22 * n34
				 - n14 * n21 * n32
				 + n12 * n21 * n34
				 + n14 * n22 * n31
				 - n12 * n24 * n31
			) +
			n44 * (
				- n13 * n22 * n31
				 - n11 * n23 * n32
				 + n11 * n22 * n33
				 + n13 * n21 * n32
				 - n12 * n21 * n33
				 + n12 * n23 * n31
			)

		);

	}

	/**
	 * Transposes this matrix in place.
	 *
	 * @return {Matrix4} A reference to this matrix.
	 */
	transpose() {

		const te = this.elements;
		let tmp;

		tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
		tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
		tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

		tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
		tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
		tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;

		return this;

	}

	/**
	 * Sets the position component for this matrix from the given vector,
	 * without affecting the rest of the matrix.
	 *
	 * @param {number|Vector3} x - The x component of the vector or alternatively the vector object.
	 * @param {number} y - The y component of the vector.
	 * @param {number} z - The z component of the vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	setPosition( x, y, z ) {

		const te = this.elements;

		if ( x.isVector3 ) {

			te[ 12 ] = x.x;
			te[ 13 ] = x.y;
			te[ 14 ] = x.z;

		} else {

			te[ 12 ] = x;
			te[ 13 ] = y;
			te[ 14 ] = z;

		}

		return this;

	}

	/**
	 * Inverts this matrix, using the [analytic method]{@link https://en.wikipedia.org/wiki/Invertible_matrix#Analytic_solution}.
	 * You can not invert with a determinant of zero. If you attempt this, the method produces
	 * a zero matrix instead.
	 *
	 * @return {Matrix4} A reference to this matrix.
	 */
	invert() {

		// based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
		const te = this.elements,

			n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ], n41 = te[ 3 ],
			n12 = te[ 4 ], n22 = te[ 5 ], n32 = te[ 6 ], n42 = te[ 7 ],
			n13 = te[ 8 ], n23 = te[ 9 ], n33 = te[ 10 ], n43 = te[ 11 ],
			n14 = te[ 12 ], n24 = te[ 13 ], n34 = te[ 14 ], n44 = te[ 15 ],

			t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
			t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
			t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
			t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

		const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

		if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 );

		const detInv = 1 / det;

		te[ 0 ] = t11 * detInv;
		te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
		te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
		te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

		te[ 4 ] = t12 * detInv;
		te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
		te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
		te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

		te[ 8 ] = t13 * detInv;
		te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
		te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
		te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

		te[ 12 ] = t14 * detInv;
		te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
		te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
		te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

		return this;

	}

	/**
	 * Multiplies the columns of this matrix by the given vector.
	 *
	 * @param {Vector3} v - The scale vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	scale( v ) {

		const te = this.elements;
		const x = v.x, y = v.y, z = v.z;

		te[ 0 ] *= x; te[ 4 ] *= y; te[ 8 ] *= z;
		te[ 1 ] *= x; te[ 5 ] *= y; te[ 9 ] *= z;
		te[ 2 ] *= x; te[ 6 ] *= y; te[ 10 ] *= z;
		te[ 3 ] *= x; te[ 7 ] *= y; te[ 11 ] *= z;

		return this;

	}

	/**
	 * Gets the maximum scale value of the three axes.
	 *
	 * @return {number} The maximum scale.
	 */
	getMaxScaleOnAxis() {

		const te = this.elements;

		const scaleXSq = te[ 0 ] * te[ 0 ] + te[ 1 ] * te[ 1 ] + te[ 2 ] * te[ 2 ];
		const scaleYSq = te[ 4 ] * te[ 4 ] + te[ 5 ] * te[ 5 ] + te[ 6 ] * te[ 6 ];
		const scaleZSq = te[ 8 ] * te[ 8 ] + te[ 9 ] * te[ 9 ] + te[ 10 ] * te[ 10 ];

		return Math.sqrt( Math.max( scaleXSq, scaleYSq, scaleZSq ) );

	}

	/**
	 * Sets this matrix as a translation transform from the given vector.
	 *
	 * @param {number|Vector3} x - The amount to translate in the X axis or alternatively a translation vector.
	 * @param {number} y - The amount to translate in the Y axis.
	 * @param {number} z - The amount to translate in the z axis.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeTranslation( x, y, z ) {

		if ( x.isVector3 ) {

			this.set(

				1, 0, 0, x.x,
				0, 1, 0, x.y,
				0, 0, 1, x.z,
				0, 0, 0, 1

			);

		} else {

			this.set(

				1, 0, 0, x,
				0, 1, 0, y,
				0, 0, 1, z,
				0, 0, 0, 1

			);

		}

		return this;

	}

	/**
	 * Sets this matrix as a rotational transformation around the X axis by
	 * the given angle.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationX( theta ) {

		const c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			1, 0, 0, 0,
			0, c, - s, 0,
			0, s, c, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a rotational transformation around the Y axis by
	 * the given angle.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationY( theta ) {

		const c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			 c, 0, s, 0,
			 0, 1, 0, 0,
			- s, 0, c, 0,
			 0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a rotational transformation around the Z axis by
	 * the given angle.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationZ( theta ) {

		const c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			c, - s, 0, 0,
			s, c, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a rotational transformation around the given axis by
	 * the given angle.
	 *
	 * This is a somewhat controversial but mathematically sound alternative to
	 * rotating via Quaternions. See the discussion [here]{@link https://www.gamedev.net/articles/programming/math-and-physics/do-we-really-need-quaternions-r1199}.
	 *
	 * @param {Vector3} axis - The normalized rotation axis.
	 * @param {number} angle - The rotation in radians.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationAxis( axis, angle ) {

		// Based on http://www.gamedev.net/reference/articles/article1199.asp

		const c = Math.cos( angle );
		const s = Math.sin( angle );
		const t = 1 - c;
		const x = axis.x, y = axis.y, z = axis.z;
		const tx = t * x, ty = t * y;

		this.set(

			tx * x + c, tx * y - s * z, tx * z + s * y, 0,
			tx * y + s * z, ty * y + c, ty * z - s * x, 0,
			tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a scale transformation.
	 *
	 * @param {number} x - The amount to scale in the X axis.
	 * @param {number} y - The amount to scale in the Y axis.
	 * @param {number} z - The amount to scale in the Z axis.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeScale( x, y, z ) {

		this.set(

			x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a shear transformation.
	 *
	 * @param {number} xy - The amount to shear X by Y.
	 * @param {number} xz - The amount to shear X by Z.
	 * @param {number} yx - The amount to shear Y by X.
	 * @param {number} yz - The amount to shear Y by Z.
	 * @param {number} zx - The amount to shear Z by X.
	 * @param {number} zy - The amount to shear Z by Y.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeShear( xy, xz, yx, yz, zx, zy ) {

		this.set(

			1, yx, zx, 0,
			xy, 1, zy, 0,
			xz, yz, 1, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix to the transformation composed of the given position,
	 * rotation (Quaternion) and scale.
	 *
	 * @param {Vector3} position - The position vector.
	 * @param {Quaternion} quaternion - The rotation as a Quaternion.
	 * @param {Vector3} scale - The scale vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	compose( position, quaternion, scale ) {

		const te = this.elements;

		const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
		const x2 = x + x,	y2 = y + y, z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;

		const sx = scale.x, sy = scale.y, sz = scale.z;

		te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
		te[ 1 ] = ( xy + wz ) * sx;
		te[ 2 ] = ( xz - wy ) * sx;
		te[ 3 ] = 0;

		te[ 4 ] = ( xy - wz ) * sy;
		te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
		te[ 6 ] = ( yz + wx ) * sy;
		te[ 7 ] = 0;

		te[ 8 ] = ( xz + wy ) * sz;
		te[ 9 ] = ( yz - wx ) * sz;
		te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
		te[ 11 ] = 0;

		te[ 12 ] = position.x;
		te[ 13 ] = position.y;
		te[ 14 ] = position.z;
		te[ 15 ] = 1;

		return this;

	}

	/**
	 * Decomposes this matrix into its position, rotation and scale components
	 * and provides the result in the given objects.
	 *
	 * Note: Not all matrices are decomposable in this way. For example, if an
	 * object has a non-uniformly scaled parent, then the object's world matrix
	 * may not be decomposable, and this method may not be appropriate.
	 *
	 * @param {Vector3} position - The position vector.
	 * @param {Quaternion} quaternion - The rotation as a Quaternion.
	 * @param {Vector3} scale - The scale vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	decompose( position, quaternion, scale ) {

		const te = this.elements;

		let sx = _v1$5.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
		const sy = _v1$5.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
		const sz = _v1$5.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

		// if determine is negative, we need to invert one scale
		const det = this.determinant();
		if ( det < 0 ) sx = - sx;

		position.x = te[ 12 ];
		position.y = te[ 13 ];
		position.z = te[ 14 ];

		// scale the rotation part
		_m1$2.copy( this );

		const invSX = 1 / sx;
		const invSY = 1 / sy;
		const invSZ = 1 / sz;

		_m1$2.elements[ 0 ] *= invSX;
		_m1$2.elements[ 1 ] *= invSX;
		_m1$2.elements[ 2 ] *= invSX;

		_m1$2.elements[ 4 ] *= invSY;
		_m1$2.elements[ 5 ] *= invSY;
		_m1$2.elements[ 6 ] *= invSY;

		_m1$2.elements[ 8 ] *= invSZ;
		_m1$2.elements[ 9 ] *= invSZ;
		_m1$2.elements[ 10 ] *= invSZ;

		quaternion.setFromRotationMatrix( _m1$2 );

		scale.x = sx;
		scale.y = sy;
		scale.z = sz;

		return this;

	}

	/**
	 * Creates a perspective projection matrix. This is used internally by
	 * {@link PerspectiveCamera#updateProjectionMatrix}.

	 * @param {number} left - Left boundary of the viewing frustum at the near plane.
	 * @param {number} right - Right boundary of the viewing frustum at the near plane.
	 * @param {number} top - Top boundary of the viewing frustum at the near plane.
	 * @param {number} bottom - Bottom boundary of the viewing frustum at the near plane.
	 * @param {number} near - The distance from the camera to the near plane.
	 * @param {number} far - The distance from the camera to the far plane.
	 * @param {(WebGLCoordinateSystem|WebGPUCoordinateSystem)} [coordinateSystem=WebGLCoordinateSystem] - The coordinate system.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makePerspective( left, right, top, bottom, near, far, coordinateSystem = WebGLCoordinateSystem ) {

		const te = this.elements;
		const x = 2 * near / ( right - left );
		const y = 2 * near / ( top - bottom );

		const a = ( right + left ) / ( right - left );
		const b = ( top + bottom ) / ( top - bottom );

		let c, d;

		if ( coordinateSystem === WebGLCoordinateSystem ) {

			c = - ( far + near ) / ( far - near );
			d = ( -2 * far * near ) / ( far - near );

		} else if ( coordinateSystem === WebGPUCoordinateSystem ) {

			c = - far / ( far - near );
			d = ( - far * near ) / ( far - near );

		} else {

			throw new Error( 'THREE.Matrix4.makePerspective(): Invalid coordinate system: ' + coordinateSystem );

		}

		te[ 0 ] = x;	te[ 4 ] = 0;	te[ 8 ] = a; 	te[ 12 ] = 0;
		te[ 1 ] = 0;	te[ 5 ] = y;	te[ 9 ] = b; 	te[ 13 ] = 0;
		te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = c; 	te[ 14 ] = d;
		te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = -1;	te[ 15 ] = 0;

		return this;

	}

	/**
	 * Creates a orthographic projection matrix. This is used internally by
	 * {@link OrthographicCamera#updateProjectionMatrix}.

	 * @param {number} left - Left boundary of the viewing frustum at the near plane.
	 * @param {number} right - Right boundary of the viewing frustum at the near plane.
	 * @param {number} top - Top boundary of the viewing frustum at the near plane.
	 * @param {number} bottom - Bottom boundary of the viewing frustum at the near plane.
	 * @param {number} near - The distance from the camera to the near plane.
	 * @param {number} far - The distance from the camera to the far plane.
	 * @param {(WebGLCoordinateSystem|WebGPUCoordinateSystem)} [coordinateSystem=WebGLCoordinateSystem] - The coordinate system.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeOrthographic( left, right, top, bottom, near, far, coordinateSystem = WebGLCoordinateSystem ) {

		const te = this.elements;
		const w = 1.0 / ( right - left );
		const h = 1.0 / ( top - bottom );
		const p = 1.0 / ( far - near );

		const x = ( right + left ) * w;
		const y = ( top + bottom ) * h;

		let z, zInv;

		if ( coordinateSystem === WebGLCoordinateSystem ) {

			z = ( far + near ) * p;
			zInv = -2 * p;

		} else if ( coordinateSystem === WebGPUCoordinateSystem ) {

			z = near * p;
			zInv = -1 * p;

		} else {

			throw new Error( 'THREE.Matrix4.makeOrthographic(): Invalid coordinate system: ' + coordinateSystem );

		}

		te[ 0 ] = 2 * w;	te[ 4 ] = 0;		te[ 8 ] = 0; 		te[ 12 ] = - x;
		te[ 1 ] = 0; 		te[ 5 ] = 2 * h;	te[ 9 ] = 0; 		te[ 13 ] = - y;
		te[ 2 ] = 0; 		te[ 6 ] = 0;		te[ 10 ] = zInv;	te[ 14 ] = - z;
		te[ 3 ] = 0; 		te[ 7 ] = 0;		te[ 11 ] = 0;		te[ 15 ] = 1;

		return this;

	}

	/**
	 * Returns `true` if this matrix is equal with the given one.
	 *
	 * @param {Matrix4} matrix - The matrix to test for equality.
	 * @return {boolean} Whether this matrix is equal with the given one.
	 */
	equals( matrix ) {

		const te = this.elements;
		const me = matrix.elements;

		for ( let i = 0; i < 16; i ++ ) {

			if ( te[ i ] !== me[ i ] ) return false;

		}

		return true;

	}

	/**
	 * Sets the elements of the matrix from the given array.
	 *
	 * @param {Array<number>} array - The matrix elements in column-major order.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Matrix4} A reference to this matrix.
	 */
	fromArray( array, offset = 0 ) {

		for ( let i = 0; i < 16; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	}

	/**
	 * Writes the elements of this matrix to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the matrix elements in column-major order.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The matrix elements in column-major order.
	 */
	toArray( array = [], offset = 0 ) {

		const te = this.elements;

		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];
		array[ offset + 3 ] = te[ 3 ];

		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];
		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];

		array[ offset + 8 ] = te[ 8 ];
		array[ offset + 9 ] = te[ 9 ];
		array[ offset + 10 ] = te[ 10 ];
		array[ offset + 11 ] = te[ 11 ];

		array[ offset + 12 ] = te[ 12 ];
		array[ offset + 13 ] = te[ 13 ];
		array[ offset + 14 ] = te[ 14 ];
		array[ offset + 15 ] = te[ 15 ];

		return array;

	}

}

const _v1$5 = /*@__PURE__*/ new Vector3();
const _m1$2 = /*@__PURE__*/ new Matrix4();
const _zero = /*@__PURE__*/ new Vector3( 0, 0, 0 );
const _one = /*@__PURE__*/ new Vector3( 1, 1, 1 );
const _x = /*@__PURE__*/ new Vector3();
const _y = /*@__PURE__*/ new Vector3();
const _z = /*@__PURE__*/ new Vector3();

const _matrix$2 = /*@__PURE__*/ new Matrix4();
const _quaternion$3 = /*@__PURE__*/ new Quaternion();

/**
 * A class representing Euler angles.
 *
 * Euler angles describe a rotational transformation by rotating an object on
 * its various axes in specified amounts per axis, and a specified axis
 * order.
 *
 * Iterating through an instance will yield its components (x, y, z,
 * order) in the corresponding order.
 *
 * ```js
 * const a = new THREE.Euler( 0, 1, 1.57, 'XYZ' );
 * const b = new THREE.Vector3( 1, 0, 1 );
 * b.applyEuler(a);
 * ```
 */
class Euler {

	/**
	 * Constructs a new euler instance.
	 *
	 * @param {number} [x=0] - The angle of the x axis in radians.
	 * @param {number} [y=0] - The angle of the y axis in radians.
	 * @param {number} [z=0] - The angle of the z axis in radians.
	 * @param {string} [order=Euler.DEFAULT_ORDER] - A string representing the order that the rotations are applied.
	 */
	constructor( x = 0, y = 0, z = 0, order = Euler.DEFAULT_ORDER ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isEuler = true;

		this._x = x;
		this._y = y;
		this._z = z;
		this._order = order;

	}

	/**
	 * The angle of the x axis in radians.
	 *
	 * @type {number}
	 * @default 0
	 */
	get x() {

		return this._x;

	}

	set x( value ) {

		this._x = value;
		this._onChangeCallback();

	}

	/**
	 * The angle of the y axis in radians.
	 *
	 * @type {number}
	 * @default 0
	 */
	get y() {

		return this._y;

	}

	set y( value ) {

		this._y = value;
		this._onChangeCallback();

	}

	/**
	 * The angle of the z axis in radians.
	 *
	 * @type {number}
	 * @default 0
	 */
	get z() {

		return this._z;

	}

	set z( value ) {

		this._z = value;
		this._onChangeCallback();

	}

	/**
	 * A string representing the order that the rotations are applied.
	 *
	 * @type {string}
	 * @default 'XYZ'
	 */
	get order() {

		return this._order;

	}

	set order( value ) {

		this._order = value;
		this._onChangeCallback();

	}

	/**
	 * Sets the Euler components.
	 *
	 * @param {number} x - The angle of the x axis in radians.
	 * @param {number} y - The angle of the y axis in radians.
	 * @param {number} z - The angle of the z axis in radians.
	 * @param {string} [order] - A string representing the order that the rotations are applied.
	 * @return {Euler} A reference to this Euler instance.
	 */
	set( x, y, z, order = this._order ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._order = order;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Returns a new Euler instance with copied values from this instance.
	 *
	 * @return {Euler} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this._x, this._y, this._z, this._order );

	}

	/**
	 * Copies the values of the given Euler instance to this instance.
	 *
	 * @param {Euler} euler - The Euler instance to copy.
	 * @return {Euler} A reference to this Euler instance.
	 */
	copy( euler ) {

		this._x = euler._x;
		this._y = euler._y;
		this._z = euler._z;
		this._order = euler._order;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Sets the angles of this Euler instance from a pure rotation matrix.
	 *
	 * @param {Matrix4} m - A 4x4 matrix of which the upper 3x3 of matrix is a pure rotation matrix (i.e. unscaled).
	 * @param {string} [order] - A string representing the order that the rotations are applied.
	 * @param {boolean} [update=true] - Whether the internal `onChange` callback should be executed or not.
	 * @return {Euler} A reference to this Euler instance.
	 */
	setFromRotationMatrix( m, order = this._order, update = true ) {

		const te = m.elements;
		const m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
		const m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
		const m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

		switch ( order ) {

			case 'XYZ':

				this._y = Math.asin( clamp( m13, -1, 1 ) );

				if ( Math.abs( m13 ) < 0.9999999 ) {

					this._x = Math.atan2( - m23, m33 );
					this._z = Math.atan2( - m12, m11 );

				} else {

					this._x = Math.atan2( m32, m22 );
					this._z = 0;

				}

				break;

			case 'YXZ':

				this._x = Math.asin( - clamp( m23, -1, 1 ) );

				if ( Math.abs( m23 ) < 0.9999999 ) {

					this._y = Math.atan2( m13, m33 );
					this._z = Math.atan2( m21, m22 );

				} else {

					this._y = Math.atan2( - m31, m11 );
					this._z = 0;

				}

				break;

			case 'ZXY':

				this._x = Math.asin( clamp( m32, -1, 1 ) );

				if ( Math.abs( m32 ) < 0.9999999 ) {

					this._y = Math.atan2( - m31, m33 );
					this._z = Math.atan2( - m12, m22 );

				} else {

					this._y = 0;
					this._z = Math.atan2( m21, m11 );

				}

				break;

			case 'ZYX':

				this._y = Math.asin( - clamp( m31, -1, 1 ) );

				if ( Math.abs( m31 ) < 0.9999999 ) {

					this._x = Math.atan2( m32, m33 );
					this._z = Math.atan2( m21, m11 );

				} else {

					this._x = 0;
					this._z = Math.atan2( - m12, m22 );

				}

				break;

			case 'YZX':

				this._z = Math.asin( clamp( m21, -1, 1 ) );

				if ( Math.abs( m21 ) < 0.9999999 ) {

					this._x = Math.atan2( - m23, m22 );
					this._y = Math.atan2( - m31, m11 );

				} else {

					this._x = 0;
					this._y = Math.atan2( m13, m33 );

				}

				break;

			case 'XZY':

				this._z = Math.asin( - clamp( m12, -1, 1 ) );

				if ( Math.abs( m12 ) < 0.9999999 ) {

					this._x = Math.atan2( m32, m22 );
					this._y = Math.atan2( m13, m11 );

				} else {

					this._x = Math.atan2( - m23, m33 );
					this._y = 0;

				}

				break;

			default:

				console.warn( 'THREE.Euler: .setFromRotationMatrix() encountered an unknown order: ' + order );

		}

		this._order = order;

		if ( update === true ) this._onChangeCallback();

		return this;

	}

	/**
	 * Sets the angles of this Euler instance from a normalized quaternion.
	 *
	 * @param {Quaternion} q - A normalized Quaternion.
	 * @param {string} [order] - A string representing the order that the rotations are applied.
	 * @param {boolean} [update=true] - Whether the internal `onChange` callback should be executed or not.
	 * @return {Euler} A reference to this Euler instance.
	 */
	setFromQuaternion( q, order, update ) {

		_matrix$2.makeRotationFromQuaternion( q );

		return this.setFromRotationMatrix( _matrix$2, order, update );

	}

	/**
	 * Sets the angles of this Euler instance from the given vector.
	 *
	 * @param {Vector3} v - The vector.
	 * @param {string} [order] - A string representing the order that the rotations are applied.
	 * @return {Euler} A reference to this Euler instance.
	 */
	setFromVector3( v, order = this._order ) {

		return this.set( v.x, v.y, v.z, order );

	}

	/**
	 * Resets the euler angle with a new order by creating a quaternion from this
	 * euler angle and then setting this euler angle with the quaternion and the
	 * new order.
	 *
	 * Warning: This discards revolution information.
	 *
	 * @param {string} [newOrder] - A string representing the new order that the rotations are applied.
	 * @return {Euler} A reference to this Euler instance.
	 */
	reorder( newOrder ) {

		_quaternion$3.setFromEuler( this );

		return this.setFromQuaternion( _quaternion$3, newOrder );

	}

	/**
	 * Returns `true` if this Euler instance is equal with the given one.
	 *
	 * @param {Euler} euler - The Euler instance to test for equality.
	 * @return {boolean} Whether this Euler instance is equal with the given one.
	 */
	equals( euler ) {

		return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );

	}

	/**
	 * Sets this Euler instance's components to values from the given array. The first three
	 * entries of the array are assign to the x,y and z components. An optional fourth entry
	 * defines the Euler order.
	 *
	 * @param {Array<number,number,number,?string>} array - An array holding the Euler component values.
	 * @return {Euler} A reference to this Euler instance.
	 */
	fromArray( array ) {

		this._x = array[ 0 ];
		this._y = array[ 1 ];
		this._z = array[ 2 ];
		if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

		this._onChangeCallback();

		return this;

	}

	/**
	 * Writes the components of this Euler instance to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number,number,number,string>} [array=[]] - The target array holding the Euler components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number,number,number,string>} The Euler components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this._x;
		array[ offset + 1 ] = this._y;
		array[ offset + 2 ] = this._z;
		array[ offset + 3 ] = this._order;

		return array;

	}

	_onChange( callback ) {

		this._onChangeCallback = callback;

		return this;

	}

	_onChangeCallback() {}

	*[ Symbol.iterator ]() {

		yield this._x;
		yield this._y;
		yield this._z;
		yield this._order;

	}

}

/**
 * The default Euler angle order.
 *
 * @static
 * @type {string}
 * @default 'XYZ'
 */
Euler.DEFAULT_ORDER = 'XYZ';

/**
 * A layers object assigns an 3D object to 1 or more of 32
 * layers numbered `0` to `31` - internally the layers are stored as a
 * bit mask], and by default all 3D objects are a member of layer `0`.
 *
 * This can be used to control visibility - an object must share a layer with
 * a camera to be visible when that camera's view is
 * rendered.
 *
 * All classes that inherit from {@link Object3D} have an `layers` property which
 * is an instance of this class.
 */
class Layers {

	/**
	 * Constructs a new layers instance, with membership
	 * initially set to layer `0`.
	 */
	constructor() {

		/**
		 * A bit mask storing which of the 32 layers this layers object is currently
		 * a member of.
		 *
		 * @type {number}
		 */
		this.mask = 1 | 0;

	}

	/**
	 * Sets membership to the given layer, and remove membership all other layers.
	 *
	 * @param {number} layer - The layer to set.
	 */
	set( layer ) {

		this.mask = ( 1 << layer | 0 ) >>> 0;

	}

	/**
	 * Adds membership of the given layer.
	 *
	 * @param {number} layer - The layer to enable.
	 */
	enable( layer ) {

		this.mask |= 1 << layer | 0;

	}

	/**
	 * Adds membership to all layers.
	 */
	enableAll() {

		this.mask = 0xffffffff | 0;

	}

	/**
	 * Toggles the membership of the given layer.
	 *
	 * @param {number} layer - The layer to toggle.
	 */
	toggle( layer ) {

		this.mask ^= 1 << layer | 0;

	}

	/**
	 * Removes membership of the given layer.
	 *
	 * @param {number} layer - The layer to enable.
	 */
	disable( layer ) {

		this.mask &= ~ ( 1 << layer | 0 );

	}

	/**
	 * Removes the membership from all layers.
	 */
	disableAll() {

		this.mask = 0;

	}

	/**
	 * Returns `true` if this and the given layers object have at least one
	 * layer in common.
	 *
	 * @param {Layers} layers - The layers to test.
	 * @return {boolean } Whether this and the given layers object have at least one layer in common or not.
	 */
	test( layers ) {

		return ( this.mask & layers.mask ) !== 0;

	}

	/**
	 * Returns `true` if the given layer is enabled.
	 *
	 * @param {number} layer - The layer to test.
	 * @return {boolean } Whether the given layer is enabled or not.
	 */
	isEnabled( layer ) {

		return ( this.mask & ( 1 << layer | 0 ) ) !== 0;

	}

}

let _object3DId = 0;

const _v1$4 = /*@__PURE__*/ new Vector3();
const _q1 = /*@__PURE__*/ new Quaternion();
const _m1$1 = /*@__PURE__*/ new Matrix4();
const _target = /*@__PURE__*/ new Vector3();

const _position$3 = /*@__PURE__*/ new Vector3();
const _scale$2 = /*@__PURE__*/ new Vector3();
const _quaternion$2 = /*@__PURE__*/ new Quaternion();

const _xAxis = /*@__PURE__*/ new Vector3( 1, 0, 0 );
const _yAxis = /*@__PURE__*/ new Vector3( 0, 1, 0 );
const _zAxis = /*@__PURE__*/ new Vector3( 0, 0, 1 );

/**
 * Fires when the object has been added to its parent object.
 *
 * @event Object3D#added
 * @type {Object}
 */
const _addedEvent = { type: 'added' };

/**
 * Fires when the object has been removed from its parent object.
 *
 * @event Object3D#removed
 * @type {Object}
 */
const _removedEvent = { type: 'removed' };

/**
 * Fires when a new child object has been added.
 *
 * @event Object3D#childadded
 * @type {Object}
 */
const _childaddedEvent = { type: 'childadded', child: null };

/**
 * Fires when a new child object has been added.
 *
 * @event Object3D#childremoved
 * @type {Object}
 */
const _childremovedEvent = { type: 'childremoved', child: null };

/**
 * This is the base class for most objects in three.js and provides a set of
 * properties and methods for manipulating objects in 3D space.
 *
 * @augments EventDispatcher
 */
class Object3D extends EventDispatcher {

	/**
	 * Constructs a new 3D object.
	 */
	constructor() {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isObject3D = true;

		/**
		 * The ID of the 3D object.
		 *
		 * @name Object3D#id
		 * @type {number}
		 * @readonly
		 */
		Object.defineProperty( this, 'id', { value: _object3DId ++ } );

		/**
		 * The UUID of the 3D object.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.uuid = generateUUID();

		/**
		 * The name of the 3D object.
		 *
		 * @type {string}
		 */
		this.name = '';

		/**
		 * The type property is used for detecting the object type
		 * in context of serialization/deserialization.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.type = 'Object3D';

		/**
		 * A reference to the parent object.
		 *
		 * @type {?Object3D}
		 * @default null
		 */
		this.parent = null;

		/**
		 * An array holding the child 3D objects of this instance.
		 *
		 * @type {Array<Object3D>}
		 */
		this.children = [];

		/**
		 * Defines the `up` direction of the 3D object which influences
		 * the orientation via methods like {@link Object3D#lookAt}.
		 *
		 * The default values for all 3D objects is defined by `Object3D.DEFAULT_UP`.
		 *
		 * @type {Vector3}
		 */
		this.up = Object3D.DEFAULT_UP.clone();

		const position = new Vector3();
		const rotation = new Euler();
		const quaternion = new Quaternion();
		const scale = new Vector3( 1, 1, 1 );

		function onRotationChange() {

			quaternion.setFromEuler( rotation, false );

		}

		function onQuaternionChange() {

			rotation.setFromQuaternion( quaternion, undefined, false );

		}

		rotation._onChange( onRotationChange );
		quaternion._onChange( onQuaternionChange );

		Object.defineProperties( this, {
			/**
			 * Represents the object's local position.
			 *
			 * @name Object3D#position
			 * @type {Vector3}
			 * @default (0,0,0)
			 */
			position: {
				configurable: true,
				enumerable: true,
				value: position
			},
			/**
			 * Represents the object's local rotation as Euler angles, in radians.
			 *
			 * @name Object3D#rotation
			 * @type {Euler}
			 * @default (0,0,0)
			 */
			rotation: {
				configurable: true,
				enumerable: true,
				value: rotation
			},
			/**
			 * Represents the object's local rotation as Quaternions.
			 *
			 * @name Object3D#quaternion
			 * @type {Quaternion}
			 */
			quaternion: {
				configurable: true,
				enumerable: true,
				value: quaternion
			},
			/**
			 * Represents the object's local scale.
			 *
			 * @name Object3D#scale
			 * @type {Vector3}
			 * @default (1,1,1)
			 */
			scale: {
				configurable: true,
				enumerable: true,
				value: scale
			},
			/**
			 * Represents the object's model-view matrix.
			 *
			 * @name Object3D#modelViewMatrix
			 * @type {Matrix4}
			 */
			modelViewMatrix: {
				value: new Matrix4()
			},
			/**
			 * Represents the object's normal matrix.
			 *
			 * @name Object3D#normalMatrix
			 * @type {Matrix3}
			 */
			normalMatrix: {
				value: new Matrix3()
			}
		} );

		/**
		 * Represents the object's transformation matrix in local space.
		 *
		 * @type {Matrix4}
		 */
		this.matrix = new Matrix4();

		/**
		 * Represents the object's transformation matrix in world space.
		 * If the 3D object has no parent, then it's identical to the local transformation matrix
		 *
		 * @type {Matrix4}
		 */
		this.matrixWorld = new Matrix4();

		/**
		 * When set to `true`, the engine automatically computes the local matrix from position,
		 * rotation and scale every frame.
		 *
		 * The default values for all 3D objects is defined by `Object3D.DEFAULT_MATRIX_AUTO_UPDATE`.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.matrixAutoUpdate = Object3D.DEFAULT_MATRIX_AUTO_UPDATE;

		/**
		 * When set to `true`, the engine automatically computes the world matrix from the current local
		 * matrix and the object's transformation hierarchy.
		 *
		 * The default values for all 3D objects is defined by `Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE`.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.matrixWorldAutoUpdate = Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE; // checked by the renderer

		/**
		 * When set to `true`, it calculates the world matrix in that frame and resets this property
		 * to `false`.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.matrixWorldNeedsUpdate = false;

		/**
		 * The layer membership of the 3D object. The 3D object is only visible if it has
		 * at least one layer in common with the camera in use. This property can also be
		 * used to filter out unwanted objects in ray-intersection tests when using {@link Raycaster}.
		 *
		 * @type {Layers}
		 */
		this.layers = new Layers();

		/**
		 * When set to `true`, the 3D object gets rendered.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.visible = true;

		/**
		 * When set to `true`, the 3D object gets rendered into shadow maps.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.castShadow = false;

		/**
		 * When set to `true`, the 3D object is affected by shadows in the scene.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.receiveShadow = false;

		/**
		 * When set to `true`, the 3D object is honored by view frustum culling.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.frustumCulled = true;

		/**
		 * This value allows the default rendering order of scene graph objects to be
		 * overridden although opaque and transparent objects remain sorted independently.
		 * When this property is set for an instance of {@link Group},all descendants
		 * objects will be sorted and rendered together. Sorting is from lowest to highest
		 * render order.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.renderOrder = 0;

		/**
		 * An array holding the animation clips of the 3D object.
		 *
		 * @type {Array<AnimationClip>}
		 */
		this.animations = [];

		/**
		 * Custom depth material to be used when rendering to the depth map. Can only be used
		 * in context of meshes. When shadow-casting with a {@link DirectionalLight} or {@link SpotLight},
		 * if you are modifying vertex positions in the vertex shader you must specify a custom depth
		 * material for proper shadows.
		 *
		 * Only relevant in context of {@link WebGLRenderer}.
		 *
		 * @type {(Material|undefined)}
		 * @default undefined
		 */
		this.customDepthMaterial = undefined;

		/**
		 * Same as {@link Object3D#customDepthMaterial}, but used with {@link PointLight}.
		 *
		 * Only relevant in context of {@link WebGLRenderer}.
		 *
		 * @type {(Material|undefined)}
		 * @default undefined
		 */
		this.customDistanceMaterial = undefined;

		/**
		 * An object that can be used to store custom data about the 3D object. It
		 * should not hold references to functions as these will not be cloned.
		 *
		 * @type {Object}
		 */
		this.userData = {};

	}

	/**
	 * A callback that is executed immediately before a 3D object is rendered to a shadow map.
	 *
	 * @param {Renderer|WebGLRenderer} renderer - The renderer.
	 * @param {Object3D} object - The 3D object.
	 * @param {Camera} camera - The camera that is used to render the scene.
	 * @param {Camera} shadowCamera - The shadow camera.
	 * @param {BufferGeometry} geometry - The 3D object's geometry.
	 * @param {Material} depthMaterial - The depth material.
	 * @param {Object} group - The geometry group data.
	 */
	onBeforeShadow( /* renderer, object, camera, shadowCamera, geometry, depthMaterial, group */ ) {}

	/**
	 * A callback that is executed immediately after a 3D object is rendered to a shadow map.
	 *
	 * @param {Renderer|WebGLRenderer} renderer - The renderer.
	 * @param {Object3D} object - The 3D object.
	 * @param {Camera} camera - The camera that is used to render the scene.
	 * @param {Camera} shadowCamera - The shadow camera.
	 * @param {BufferGeometry} geometry - The 3D object's geometry.
	 * @param {Material} depthMaterial - The depth material.
	 * @param {Object} group - The geometry group data.
	 */
	onAfterShadow( /* renderer, object, camera, shadowCamera, geometry, depthMaterial, group */ ) {}

	/**
	 * A callback that is executed immediately before a 3D object is rendered.
	 *
	 * @param {Renderer|WebGLRenderer} renderer - The renderer.
	 * @param {Object3D} object - The 3D object.
	 * @param {Camera} camera - The camera that is used to render the scene.
	 * @param {BufferGeometry} geometry - The 3D object's geometry.
	 * @param {Material} material - The 3D object's material.
	 * @param {Object} group - The geometry group data.
	 */
	onBeforeRender( /* renderer, scene, camera, geometry, material, group */ ) {}

	/**
	 * A callback that is executed immediately after a 3D object is rendered.
	 *
	 * @param {Renderer|WebGLRenderer} renderer - The renderer.
	 * @param {Object3D} object - The 3D object.
	 * @param {Camera} camera - The camera that is used to render the scene.
	 * @param {BufferGeometry} geometry - The 3D object's geometry.
	 * @param {Material} material - The 3D object's material.
	 * @param {Object} group - The geometry group data.
	 */
	onAfterRender( /* renderer, scene, camera, geometry, material, group */ ) {}

	/**
	 * Applies the given transformation matrix to the object and updates the object's position,
	 * rotation and scale.
	 *
	 * @param {Matrix4} matrix - The transformation matrix.
	 */
	applyMatrix4( matrix ) {

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		this.matrix.premultiply( matrix );

		this.matrix.decompose( this.position, this.quaternion, this.scale );

	}

	/**
	 * Applies a rotation represented by given the quaternion to the 3D object.
	 *
	 * @param {Quaternion} q - The quaternion.
	 * @return {Object3D} A reference to this instance.
	 */
	applyQuaternion( q ) {

		this.quaternion.premultiply( q );

		return this;

	}

	/**
	 * Sets the given rotation represented as an axis/angle couple to the 3D object.
	 *
	 * @param {Vector3} axis - The (normalized) axis vector.
	 * @param {number} angle - The angle in radians.
	 */
	setRotationFromAxisAngle( axis, angle ) {

		// assumes axis is normalized

		this.quaternion.setFromAxisAngle( axis, angle );

	}

	/**
	 * Sets the given rotation represented as Euler angles to the 3D object.
	 *
	 * @param {Euler} euler - The Euler angles.
	 */
	setRotationFromEuler( euler ) {

		this.quaternion.setFromEuler( euler, true );

	}

	/**
	 * Sets the given rotation represented as rotation matrix to the 3D object.
	 *
	 * @param {Matrix4} m - Although a 4x4 matrix is expected, the upper 3x3 portion must be
	 * a pure rotation matrix (i.e, unscaled).
	 */
	setRotationFromMatrix( m ) {

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		this.quaternion.setFromRotationMatrix( m );

	}

	/**
	 * Sets the given rotation represented as a Quaternion to the 3D object.
	 *
	 * @param {Quaternion} q - The Quaternion
	 */
	setRotationFromQuaternion( q ) {

		// assumes q is normalized

		this.quaternion.copy( q );

	}

	/**
	 * Rotates the 3D object along an axis in local space.
	 *
	 * @param {Vector3} axis - The (normalized) axis vector.
	 * @param {number} angle - The angle in radians.
	 * @return {Object3D} A reference to this instance.
	 */
	rotateOnAxis( axis, angle ) {

		// rotate object on axis in object space
		// axis is assumed to be normalized

		_q1.setFromAxisAngle( axis, angle );

		this.quaternion.multiply( _q1 );

		return this;

	}

	/**
	 * Rotates the 3D object along an axis in world space.
	 *
	 * @param {Vector3} axis - The (normalized) axis vector.
	 * @param {number} angle - The angle in radians.
	 * @return {Object3D} A reference to this instance.
	 */
	rotateOnWorldAxis( axis, angle ) {

		// rotate object on axis in world space
		// axis is assumed to be normalized
		// method assumes no rotated parent

		_q1.setFromAxisAngle( axis, angle );

		this.quaternion.premultiply( _q1 );

		return this;

	}

	/**
	 * Rotates the 3D object around its X axis in local space.
	 *
	 * @param {number} angle - The angle in radians.
	 * @return {Object3D} A reference to this instance.
	 */
	rotateX( angle ) {

		return this.rotateOnAxis( _xAxis, angle );

	}

	/**
	 * Rotates the 3D object around its Y axis in local space.
	 *
	 * @param {number} angle - The angle in radians.
	 * @return {Object3D} A reference to this instance.
	 */
	rotateY( angle ) {

		return this.rotateOnAxis( _yAxis, angle );

	}

	/**
	 * Rotates the 3D object around its Z axis in local space.
	 *
	 * @param {number} angle - The angle in radians.
	 * @return {Object3D} A reference to this instance.
	 */
	rotateZ( angle ) {

		return this.rotateOnAxis( _zAxis, angle );

	}

	/**
	 * Translate the 3D object by a distance along the given axis in local space.
	 *
	 * @param {Vector3} axis - The (normalized) axis vector.
	 * @param {number} distance - The distance in world units.
	 * @return {Object3D} A reference to this instance.
	 */
	translateOnAxis( axis, distance ) {

		// translate object by distance along axis in object space
		// axis is assumed to be normalized

		_v1$4.copy( axis ).applyQuaternion( this.quaternion );

		this.position.add( _v1$4.multiplyScalar( distance ) );

		return this;

	}

	/**
	 * Translate the 3D object by a distance along its X-axis in local space.
	 *
	 * @param {number} distance - The distance in world units.
	 * @return {Object3D} A reference to this instance.
	 */
	translateX( distance ) {

		return this.translateOnAxis( _xAxis, distance );

	}

	/**
	 * Translate the 3D object by a distance along its Y-axis in local space.
	 *
	 * @param {number} distance - The distance in world units.
	 * @return {Object3D} A reference to this instance.
	 */
	translateY( distance ) {

		return this.translateOnAxis( _yAxis, distance );

	}

	/**
	 * Translate the 3D object by a distance along its Z-axis in local space.
	 *
	 * @param {number} distance - The distance in world units.
	 * @return {Object3D} A reference to this instance.
	 */
	translateZ( distance ) {

		return this.translateOnAxis( _zAxis, distance );

	}

	/**
	 * Converts the given vector from this 3D object's local space to world space.
	 *
	 * @param {Vector3} vector - The vector to convert.
	 * @return {Vector3} The converted vector.
	 */
	localToWorld( vector ) {

		this.updateWorldMatrix( true, false );

		return vector.applyMatrix4( this.matrixWorld );

	}

	/**
	 * Converts the given vector from this 3D object's word space to local space.
	 *
	 * @param {Vector3} vector - The vector to convert.
	 * @return {Vector3} The converted vector.
	 */
	worldToLocal( vector ) {

		this.updateWorldMatrix( true, false );

		return vector.applyMatrix4( _m1$1.copy( this.matrixWorld ).invert() );

	}

	/**
	 * Rotates the object to face a point in world space.
	 *
	 * This method does not support objects having non-uniformly-scaled parent(s).
	 *
	 * @param {number|Vector3} x - The x coordinate in world space. Alternatively, a vector representing a position in world space
	 * @param {number} [y] - The y coordinate in world space.
	 * @param {number} [z] - The z coordinate in world space.
	 */
	lookAt( x, y, z ) {

		// This method does not support objects having non-uniformly-scaled parent(s)

		if ( x.isVector3 ) {

			_target.copy( x );

		} else {

			_target.set( x, y, z );

		}

		const parent = this.parent;

		this.updateWorldMatrix( true, false );

		_position$3.setFromMatrixPosition( this.matrixWorld );

		if ( this.isCamera || this.isLight ) {

			_m1$1.lookAt( _position$3, _target, this.up );

		} else {

			_m1$1.lookAt( _target, _position$3, this.up );

		}

		this.quaternion.setFromRotationMatrix( _m1$1 );

		if ( parent ) {

			_m1$1.extractRotation( parent.matrixWorld );
			_q1.setFromRotationMatrix( _m1$1 );
			this.quaternion.premultiply( _q1.invert() );

		}

	}

	/**
	 * Adds the given 3D object as a child to this 3D object. An arbitrary number of
	 * objects may be added. Any current parent on an object passed in here will be
	 * removed, since an object can have at most one parent.
	 *
	 * @fires Object3D#added
	 * @fires Object3D#childadded
	 * @param {Object3D} object - The 3D object to add.
	 * @return {Object3D} A reference to this instance.
	 */
	add( object ) {

		if ( arguments.length > 1 ) {

			for ( let i = 0; i < arguments.length; i ++ ) {

				this.add( arguments[ i ] );

			}

			return this;

		}

		if ( object === this ) {

			console.error( 'THREE.Object3D.add: object can\'t be added as a child of itself.', object );
			return this;

		}

		if ( object && object.isObject3D ) {

			object.removeFromParent();
			object.parent = this;
			this.children.push( object );

			object.dispatchEvent( _addedEvent );

			_childaddedEvent.child = object;
			this.dispatchEvent( _childaddedEvent );
			_childaddedEvent.child = null;

		} else {

			console.error( 'THREE.Object3D.add: object not an instance of THREE.Object3D.', object );

		}

		return this;

	}

	/**
	 * Removes the given 3D object as child from this 3D object.
	 * An arbitrary number of objects may be removed.
	 *
	 * @fires Object3D#removed
	 * @fires Object3D#childremoved
	 * @param {Object3D} object - The 3D object to remove.
	 * @return {Object3D} A reference to this instance.
	 */
	remove( object ) {

		if ( arguments.length > 1 ) {

			for ( let i = 0; i < arguments.length; i ++ ) {

				this.remove( arguments[ i ] );

			}

			return this;

		}

		const index = this.children.indexOf( object );

		if ( index !== -1 ) {

			object.parent = null;
			this.children.splice( index, 1 );

			object.dispatchEvent( _removedEvent );

			_childremovedEvent.child = object;
			this.dispatchEvent( _childremovedEvent );
			_childremovedEvent.child = null;

		}

		return this;

	}

	/**
	 * Removes this 3D object from its current parent.
	 *
	 * @fires Object3D#removed
	 * @fires Object3D#childremoved
	 * @return {Object3D} A reference to this instance.
	 */
	removeFromParent() {

		const parent = this.parent;

		if ( parent !== null ) {

			parent.remove( this );

		}

		return this;

	}

	/**
	 * Removes all child objects.
	 *
	 * @fires Object3D#removed
	 * @fires Object3D#childremoved
	 * @return {Object3D} A reference to this instance.
	 */
	clear() {

		return this.remove( ... this.children );

	}

	/**
	 * Adds the given 3D object as a child of this 3D object, while maintaining the object's world
	 * transform. This method does not support scene graphs having non-uniformly-scaled nodes(s).
	 *
	 * @fires Object3D#added
	 * @fires Object3D#childadded
	 * @param {Object3D} object - The 3D object to attach.
	 * @return {Object3D} A reference to this instance.
	 */
	attach( object ) {

		// adds object as a child of this, while maintaining the object's world transform

		// Note: This method does not support scene graphs having non-uniformly-scaled nodes(s)

		this.updateWorldMatrix( true, false );

		_m1$1.copy( this.matrixWorld ).invert();

		if ( object.parent !== null ) {

			object.parent.updateWorldMatrix( true, false );

			_m1$1.multiply( object.parent.matrixWorld );

		}

		object.applyMatrix4( _m1$1 );

		object.removeFromParent();
		object.parent = this;
		this.children.push( object );

		object.updateWorldMatrix( false, true );

		object.dispatchEvent( _addedEvent );

		_childaddedEvent.child = object;
		this.dispatchEvent( _childaddedEvent );
		_childaddedEvent.child = null;

		return this;

	}

	/**
	 * Searches through the 3D object and its children, starting with the 3D object
	 * itself, and returns the first with a matching ID.
	 *
	 * @param {number} id - The id.
	 * @return {Object3D|undefined} The found 3D object. Returns `undefined` if no 3D object has been found.
	 */
	getObjectById( id ) {

		return this.getObjectByProperty( 'id', id );

	}

	/**
	 * Searches through the 3D object and its children, starting with the 3D object
	 * itself, and returns the first with a matching name.
	 *
	 * @param {string} name - The name.
	 * @return {Object3D|undefined} The found 3D object. Returns `undefined` if no 3D object has been found.
	 */
	getObjectByName( name ) {

		return this.getObjectByProperty( 'name', name );

	}

	/**
	 * Searches through the 3D object and its children, starting with the 3D object
	 * itself, and returns the first with a matching property value.
	 *
	 * @param {string} name - The name of the property.
	 * @param {any} value - The value.
	 * @return {Object3D|undefined} The found 3D object. Returns `undefined` if no 3D object has been found.
	 */
	getObjectByProperty( name, value ) {

		if ( this[ name ] === value ) return this;

		for ( let i = 0, l = this.children.length; i < l; i ++ ) {

			const child = this.children[ i ];
			const object = child.getObjectByProperty( name, value );

			if ( object !== undefined ) {

				return object;

			}

		}

		return undefined;

	}

	/**
	 * Searches through the 3D object and its children, starting with the 3D object
	 * itself, and returns all 3D objects with a matching property value.
	 *
	 * @param {string} name - The name of the property.
	 * @param {any} value - The value.
	 * @param {Array<Object3D>} result - The method stores the result in this array.
	 * @return {Array<Object3D>} The found 3D objects.
	 */
	getObjectsByProperty( name, value, result = [] ) {

		if ( this[ name ] === value ) result.push( this );

		const children = this.children;

		for ( let i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].getObjectsByProperty( name, value, result );

		}

		return result;

	}

	/**
	 * Returns a vector representing the position of the 3D object in world space.
	 *
	 * @param {Vector3} target - The target vector the result is stored to.
	 * @return {Vector3} The 3D object's position in world space.
	 */
	getWorldPosition( target ) {

		this.updateWorldMatrix( true, false );

		return target.setFromMatrixPosition( this.matrixWorld );

	}

	/**
	 * Returns a Quaternion representing the position of the 3D object in world space.
	 *
	 * @param {Quaternion} target - The target Quaternion the result is stored to.
	 * @return {Quaternion} The 3D object's rotation in world space.
	 */
	getWorldQuaternion( target ) {

		this.updateWorldMatrix( true, false );

		this.matrixWorld.decompose( _position$3, target, _scale$2 );

		return target;

	}

	/**
	 * Returns a vector representing the scale of the 3D object in world space.
	 *
	 * @param {Vector3} target - The target vector the result is stored to.
	 * @return {Vector3} The 3D object's scale in world space.
	 */
	getWorldScale( target ) {

		this.updateWorldMatrix( true, false );

		this.matrixWorld.decompose( _position$3, _quaternion$2, target );

		return target;

	}

	/**
	 * Returns a vector representing the ("look") direction of the 3D object in world space.
	 *
	 * @param {Vector3} target - The target vector the result is stored to.
	 * @return {Vector3} The 3D object's direction in world space.
	 */
	getWorldDirection( target ) {

		this.updateWorldMatrix( true, false );

		const e = this.matrixWorld.elements;

		return target.set( e[ 8 ], e[ 9 ], e[ 10 ] ).normalize();

	}

	/**
	 * Abstract method to get intersections between a casted ray and this
	 * 3D object. Renderable 3D objects such as {@link Mesh}, {@link Line} or {@link Points}
	 * implement this method in order to use raycasting.
	 *
	 * @abstract
	 * @param {Raycaster} raycaster - The raycaster.
	 * @param {Array<Object>} intersects - An array holding the result of the method.
	 */
	raycast( /* raycaster, intersects */ ) {}

	/**
	 * Executes the callback on this 3D object and all descendants.
	 *
	 * Note: Modifying the scene graph inside the callback is discouraged.
	 *
	 * @param {Function} callback - A callback function that allows to process the current 3D object.
	 */
	traverse( callback ) {

		callback( this );

		const children = this.children;

		for ( let i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].traverse( callback );

		}

	}

	/**
	 * Like {@link Object3D#traverse}, but the callback will only be executed for visible 3D objects.
	 * Descendants of invisible 3D objects are not traversed.
	 *
	 * Note: Modifying the scene graph inside the callback is discouraged.
	 *
	 * @param {Function} callback - A callback function that allows to process the current 3D object.
	 */
	traverseVisible( callback ) {

		if ( this.visible === false ) return;

		callback( this );

		const children = this.children;

		for ( let i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].traverseVisible( callback );

		}

	}

	/**
	 * Like {@link Object3D#traverse}, but the callback will only be executed for all ancestors.
	 *
	 * Note: Modifying the scene graph inside the callback is discouraged.
	 *
	 * @param {Function} callback - A callback function that allows to process the current 3D object.
	 */
	traverseAncestors( callback ) {

		const parent = this.parent;

		if ( parent !== null ) {

			callback( parent );

			parent.traverseAncestors( callback );

		}

	}

	/**
	 * Updates the transformation matrix in local space by computing it from the current
	 * position, rotation and scale values.
	 */
	updateMatrix() {

		this.matrix.compose( this.position, this.quaternion, this.scale );

		this.matrixWorldNeedsUpdate = true;

	}

	/**
	 * Updates the transformation matrix in world space of this 3D objects and its descendants.
	 *
	 * To ensure correct results, this method also recomputes the 3D object's transformation matrix in
	 * local space. The computation of the local and world matrix can be controlled with the
	 * {@link Object3D#matrixAutoUpdate} and {@link Object3D#matrixWorldAutoUpdate} flags which are both
	 * `true` by default.  Set these flags to `false` if you need more control over the update matrix process.
	 *
	 * @param {boolean} [force=false] - When set to `true`, a recomputation of world matrices is forced even
	 * when {@link Object3D#matrixWorldAutoUpdate} is set to `false`.
	 */
	updateMatrixWorld( force ) {

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.matrixWorldNeedsUpdate || force ) {

			if ( this.matrixWorldAutoUpdate === true ) {

				if ( this.parent === null ) {

					this.matrixWorld.copy( this.matrix );

				} else {

					this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

				}

			}

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// make sure descendants are updated if required

		const children = this.children;

		for ( let i = 0, l = children.length; i < l; i ++ ) {

			const child = children[ i ];

			child.updateMatrixWorld( force );

		}

	}

	/**
	 * An alternative version of {@link Object3D#updateMatrixWorld} with more control over the
	 * update of ancestor and descendant nodes.
	 *
	 * @param {boolean} [updateParents=false] Whether ancestor nodes should be updated or not.
	 * @param {boolean} [updateChildren=false] Whether descendant nodes should be updated or not.
	 */
	updateWorldMatrix( updateParents, updateChildren ) {

		const parent = this.parent;

		if ( updateParents === true && parent !== null ) {

			parent.updateWorldMatrix( true, false );

		}

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.matrixWorldAutoUpdate === true ) {

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

		}

		// make sure descendants are updated

		if ( updateChildren === true ) {

			const children = this.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				const child = children[ i ];

				child.updateWorldMatrix( false, true );

			}

		}

	}

	/**
	 * Serializes the 3D object into JSON.
	 *
	 * @param {?(Object|string)} meta - An optional value holding meta information about the serialization.
	 * @return {Object} A JSON object representing the serialized 3D object.
	 * @see {@link ObjectLoader#parse}
	 */
	toJSON( meta ) {

		// meta is a string when called from JSON.stringify
		const isRootObject = ( meta === undefined || typeof meta === 'string' );

		const output = {};

		// meta is a hash used to collect geometries, materials.
		// not providing it implies that this is the root object
		// being serialized.
		if ( isRootObject ) {

			// initialize meta obj
			meta = {
				geometries: {},
				materials: {},
				textures: {},
				images: {},
				shapes: {},
				skeletons: {},
				animations: {},
				nodes: {}
			};

			output.metadata = {
				version: 4.6,
				type: 'Object',
				generator: 'Object3D.toJSON'
			};

		}

		// standard Object3D serialization

		const object = {};

		object.uuid = this.uuid;
		object.type = this.type;

		if ( this.name !== '' ) object.name = this.name;
		if ( this.castShadow === true ) object.castShadow = true;
		if ( this.receiveShadow === true ) object.receiveShadow = true;
		if ( this.visible === false ) object.visible = false;
		if ( this.frustumCulled === false ) object.frustumCulled = false;
		if ( this.renderOrder !== 0 ) object.renderOrder = this.renderOrder;
		if ( Object.keys( this.userData ).length > 0 ) object.userData = this.userData;

		object.layers = this.layers.mask;
		object.matrix = this.matrix.toArray();
		object.up = this.up.toArray();

		if ( this.matrixAutoUpdate === false ) object.matrixAutoUpdate = false;

		// object specific properties

		if ( this.isInstancedMesh ) {

			object.type = 'InstancedMesh';
			object.count = this.count;
			object.instanceMatrix = this.instanceMatrix.toJSON();
			if ( this.instanceColor !== null ) object.instanceColor = this.instanceColor.toJSON();

		}

		if ( this.isBatchedMesh ) {

			object.type = 'BatchedMesh';
			object.perObjectFrustumCulled = this.perObjectFrustumCulled;
			object.sortObjects = this.sortObjects;

			object.drawRanges = this._drawRanges;
			object.reservedRanges = this._reservedRanges;

			object.visibility = this._visibility;
			object.active = this._active;
			object.bounds = this._bounds.map( bound => ( {
				boxInitialized: bound.boxInitialized,
				boxMin: bound.box.min.toArray(),
				boxMax: bound.box.max.toArray(),

				sphereInitialized: bound.sphereInitialized,
				sphereRadius: bound.sphere.radius,
				sphereCenter: bound.sphere.center.toArray()
			} ) );

			object.maxInstanceCount = this._maxInstanceCount;
			object.maxVertexCount = this._maxVertexCount;
			object.maxIndexCount = this._maxIndexCount;

			object.geometryInitialized = this._geometryInitialized;
			object.geometryCount = this._geometryCount;

			object.matricesTexture = this._matricesTexture.toJSON( meta );

			if ( this._colorsTexture !== null ) object.colorsTexture = this._colorsTexture.toJSON( meta );

			if ( this.boundingSphere !== null ) {

				object.boundingSphere = {
					center: object.boundingSphere.center.toArray(),
					radius: object.boundingSphere.radius
				};

			}

			if ( this.boundingBox !== null ) {

				object.boundingBox = {
					min: object.boundingBox.min.toArray(),
					max: object.boundingBox.max.toArray()
				};

			}

		}

		//

		function serialize( library, element ) {

			if ( library[ element.uuid ] === undefined ) {

				library[ element.uuid ] = element.toJSON( meta );

			}

			return element.uuid;

		}

		if ( this.isScene ) {

			if ( this.background ) {

				if ( this.background.isColor ) {

					object.background = this.background.toJSON();

				} else if ( this.background.isTexture ) {

					object.background = this.background.toJSON( meta ).uuid;

				}

			}

			if ( this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== true ) {

				object.environment = this.environment.toJSON( meta ).uuid;

			}

		} else if ( this.isMesh || this.isLine || this.isPoints ) {

			object.geometry = serialize( meta.geometries, this.geometry );

			const parameters = this.geometry.parameters;

			if ( parameters !== undefined && parameters.shapes !== undefined ) {

				const shapes = parameters.shapes;

				if ( Array.isArray( shapes ) ) {

					for ( let i = 0, l = shapes.length; i < l; i ++ ) {

						const shape = shapes[ i ];

						serialize( meta.shapes, shape );

					}

				} else {

					serialize( meta.shapes, shapes );

				}

			}

		}

		if ( this.isSkinnedMesh ) {

			object.bindMode = this.bindMode;
			object.bindMatrix = this.bindMatrix.toArray();

			if ( this.skeleton !== undefined ) {

				serialize( meta.skeletons, this.skeleton );

				object.skeleton = this.skeleton.uuid;

			}

		}

		if ( this.material !== undefined ) {

			if ( Array.isArray( this.material ) ) {

				const uuids = [];

				for ( let i = 0, l = this.material.length; i < l; i ++ ) {

					uuids.push( serialize( meta.materials, this.material[ i ] ) );

				}

				object.material = uuids;

			} else {

				object.material = serialize( meta.materials, this.material );

			}

		}

		//

		if ( this.children.length > 0 ) {

			object.children = [];

			for ( let i = 0; i < this.children.length; i ++ ) {

				object.children.push( this.children[ i ].toJSON( meta ).object );

			}

		}

		//

		if ( this.animations.length > 0 ) {

			object.animations = [];

			for ( let i = 0; i < this.animations.length; i ++ ) {

				const animation = this.animations[ i ];

				object.animations.push( serialize( meta.animations, animation ) );

			}

		}

		if ( isRootObject ) {

			const geometries = extractFromCache( meta.geometries );
			const materials = extractFromCache( meta.materials );
			const textures = extractFromCache( meta.textures );
			const images = extractFromCache( meta.images );
			const shapes = extractFromCache( meta.shapes );
			const skeletons = extractFromCache( meta.skeletons );
			const animations = extractFromCache( meta.animations );
			const nodes = extractFromCache( meta.nodes );

			if ( geometries.length > 0 ) output.geometries = geometries;
			if ( materials.length > 0 ) output.materials = materials;
			if ( textures.length > 0 ) output.textures = textures;
			if ( images.length > 0 ) output.images = images;
			if ( shapes.length > 0 ) output.shapes = shapes;
			if ( skeletons.length > 0 ) output.skeletons = skeletons;
			if ( animations.length > 0 ) output.animations = animations;
			if ( nodes.length > 0 ) output.nodes = nodes;

		}

		output.object = object;

		return output;

		// extract data from the cache hash
		// remove metadata on each item
		// and return as array
		function extractFromCache( cache ) {

			const values = [];
			for ( const key in cache ) {

				const data = cache[ key ];
				delete data.metadata;
				values.push( data );

			}

			return values;

		}

	}

	/**
	 * Returns a new 3D object with copied values from this instance.
	 *
	 * @param {boolean} [recursive=true] - When set to `true`, descendants of the 3D object are also cloned.
	 * @return {Object3D} A clone of this instance.
	 */
	clone( recursive ) {

		return new this.constructor().copy( this, recursive );

	}

	/**
	 * Copies the values of the given 3D object to this instance.
	 *
	 * @param {Object3D} source - The 3D object to copy.
	 * @param {boolean} [recursive=true] - When set to `true`, descendants of the 3D object are cloned.
	 * @return {Object3D} A reference to this instance.
	 */
	copy( source, recursive = true ) {

		this.name = source.name;

		this.up.copy( source.up );

		this.position.copy( source.position );
		this.rotation.order = source.rotation.order;
		this.quaternion.copy( source.quaternion );
		this.scale.copy( source.scale );

		this.matrix.copy( source.matrix );
		this.matrixWorld.copy( source.matrixWorld );

		this.matrixAutoUpdate = source.matrixAutoUpdate;

		this.matrixWorldAutoUpdate = source.matrixWorldAutoUpdate;
		this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

		this.layers.mask = source.layers.mask;
		this.visible = source.visible;

		this.castShadow = source.castShadow;
		this.receiveShadow = source.receiveShadow;

		this.frustumCulled = source.frustumCulled;
		this.renderOrder = source.renderOrder;

		this.animations = source.animations.slice();

		this.userData = JSON.parse( JSON.stringify( source.userData ) );

		if ( recursive === true ) {

			for ( let i = 0; i < source.children.length; i ++ ) {

				const child = source.children[ i ];
				this.add( child.clone() );

			}

		}

		return this;

	}

}

/**
 * The default up direction for objects, also used as the default
 * position for {@link DirectionalLight} and {@link HemisphereLight}.
 *
 * @static
 * @type {Vector3}
 * @default (0,1,0)
 */
Object3D.DEFAULT_UP = /*@__PURE__*/ new Vector3( 0, 1, 0 );

/**
 * The default setting for {@link Object3D#matrixAutoUpdate} for
 * newly created 3D objects.
 *
 * @static
 * @type {boolean}
 * @default true
 */
Object3D.DEFAULT_MATRIX_AUTO_UPDATE = true;

/**
 * The default setting for {@link Object3D#matrixWorldAutoUpdate} for
 * newly created 3D objects.
 *
 * @static
 * @type {boolean}
 * @default true
 */
Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true;

const _v0$1 = /*@__PURE__*/ new Vector3();
const _v1$3 = /*@__PURE__*/ new Vector3();
const _v2$2 = /*@__PURE__*/ new Vector3();
const _v3$2 = /*@__PURE__*/ new Vector3();

const _vab = /*@__PURE__*/ new Vector3();
const _vac = /*@__PURE__*/ new Vector3();
const _vbc = /*@__PURE__*/ new Vector3();
const _vap = /*@__PURE__*/ new Vector3();
const _vbp = /*@__PURE__*/ new Vector3();
const _vcp = /*@__PURE__*/ new Vector3();

const _v40 = /*@__PURE__*/ new Vector4();
const _v41 = /*@__PURE__*/ new Vector4();
const _v42 = /*@__PURE__*/ new Vector4();

/**
 * A geometric triangle as defined by three vectors representing its three corners.
 */
class Triangle {

	/**
	 * Constructs a new triangle.
	 *
	 * @param {Vector3} [a=(0,0,0)] - The first corner of the triangle.
	 * @param {Vector3} [b=(0,0,0)] - The second corner of the triangle.
	 * @param {Vector3} [c=(0,0,0)] - The third corner of the triangle.
	 */
	constructor( a = new Vector3(), b = new Vector3(), c = new Vector3() ) {

		/**
		 * The first corner of the triangle.
		 *
		 * @type {Vector3}
		 */
		this.a = a;

		/**
		 * The second corner of the triangle.
		 *
		 * @type {Vector3}
		 */
		this.b = b;

		/**
		 * The third corner of the triangle.
		 *
		 * @type {Vector3}
		 */
		this.c = c;

	}

	/**
	 * Computes the normal vector of a triangle.
	 *
	 * @param {Vector3} a - The first corner of the triangle.
	 * @param {Vector3} b - The second corner of the triangle.
	 * @param {Vector3} c - The third corner of the triangle.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The triangle's normal.
	 */
	static getNormal( a, b, c, target ) {

		target.subVectors( c, b );
		_v0$1.subVectors( a, b );
		target.cross( _v0$1 );

		const targetLengthSq = target.lengthSq();
		if ( targetLengthSq > 0 ) {

			return target.multiplyScalar( 1 / Math.sqrt( targetLengthSq ) );

		}

		return target.set( 0, 0, 0 );

	}

	/**
	 * Computes a barycentric coordinates from the given vector.
	 * Returns `null` if the triangle is degenerate.
	 *
	 * @param {Vector3} point - A point in 3D space.
	 * @param {Vector3} a - The first corner of the triangle.
	 * @param {Vector3} b - The second corner of the triangle.
	 * @param {Vector3} c - The third corner of the triangle.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {?Vector3} The barycentric coordinates for the given point
	 */
	static getBarycoord( point, a, b, c, target ) {

		// based on: http://www.blackpawn.com/texts/pointinpoly/default.html

		_v0$1.subVectors( c, a );
		_v1$3.subVectors( b, a );
		_v2$2.subVectors( point, a );

		const dot00 = _v0$1.dot( _v0$1 );
		const dot01 = _v0$1.dot( _v1$3 );
		const dot02 = _v0$1.dot( _v2$2 );
		const dot11 = _v1$3.dot( _v1$3 );
		const dot12 = _v1$3.dot( _v2$2 );

		const denom = ( dot00 * dot11 - dot01 * dot01 );

		// collinear or singular triangle
		if ( denom === 0 ) {

			target.set( 0, 0, 0 );
			return null;

		}

		const invDenom = 1 / denom;
		const u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
		const v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

		// barycentric coordinates must always sum to 1
		return target.set( 1 - u - v, v, u );

	}

	/**
	 * Returns `true` if the given point, when projected onto the plane of the
	 * triangle, lies within the triangle.
	 *
	 * @param {Vector3} point - The point in 3D space to test.
	 * @param {Vector3} a - The first corner of the triangle.
	 * @param {Vector3} b - The second corner of the triangle.
	 * @param {Vector3} c - The third corner of the triangle.
	 * @return {boolean} Whether the given point, when projected onto the plane of the
	 * triangle, lies within the triangle or not.
	 */
	static containsPoint( point, a, b, c ) {

		// if the triangle is degenerate then we can't contain a point
		if ( this.getBarycoord( point, a, b, c, _v3$2 ) === null ) {

			return false;

		}

		return ( _v3$2.x >= 0 ) && ( _v3$2.y >= 0 ) && ( ( _v3$2.x + _v3$2.y ) <= 1 );

	}

	/**
	 * Computes the value barycentrically interpolated for the given point on the
	 * triangle. Returns `null` if the triangle is degenerate.
	 *
	 * @param {Vector3} point - Position of interpolated point.
	 * @param {Vector3} p1 - The first corner of the triangle.
	 * @param {Vector3} p2 - The second corner of the triangle.
	 * @param {Vector3} p3 - The third corner of the triangle.
	 * @param {Vector3} v1 - Value to interpolate of first vertex.
	 * @param {Vector3} v2 - Value to interpolate of second vertex.
	 * @param {Vector3} v3 - Value to interpolate of third vertex.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {?Vector3} The interpolated value.
	 */
	static getInterpolation( point, p1, p2, p3, v1, v2, v3, target ) {

		if ( this.getBarycoord( point, p1, p2, p3, _v3$2 ) === null ) {

			target.x = 0;
			target.y = 0;
			if ( 'z' in target ) target.z = 0;
			if ( 'w' in target ) target.w = 0;
			return null;

		}

		target.setScalar( 0 );
		target.addScaledVector( v1, _v3$2.x );
		target.addScaledVector( v2, _v3$2.y );
		target.addScaledVector( v3, _v3$2.z );

		return target;

	}

	/**
	 * Computes the value barycentrically interpolated for the given attribute and indices.
	 *
	 * @param {BufferAttribute} attr - The attribute to interpolate.
	 * @param {number} i1 - Index of first vertex.
	 * @param {number} i2 - Index of second vertex.
	 * @param {number} i3 - Index of third vertex.
	 * @param {Vector3} barycoord - The barycoordinate value to use to interpolate.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The interpolated attribute value.
	 */
	static getInterpolatedAttribute( attr, i1, i2, i3, barycoord, target ) {

		_v40.setScalar( 0 );
		_v41.setScalar( 0 );
		_v42.setScalar( 0 );

		_v40.fromBufferAttribute( attr, i1 );
		_v41.fromBufferAttribute( attr, i2 );
		_v42.fromBufferAttribute( attr, i3 );

		target.setScalar( 0 );
		target.addScaledVector( _v40, barycoord.x );
		target.addScaledVector( _v41, barycoord.y );
		target.addScaledVector( _v42, barycoord.z );

		return target;

	}

	/**
	 * Returns `true` if the triangle is oriented towards the given direction.
	 *
	 * @param {Vector3} a - The first corner of the triangle.
	 * @param {Vector3} b - The second corner of the triangle.
	 * @param {Vector3} c - The third corner of the triangle.
	 * @param {Vector3} direction - The (normalized) direction vector.
	 * @return {boolean} Whether the triangle is oriented towards the given direction or not.
	 */
	static isFrontFacing( a, b, c, direction ) {

		_v0$1.subVectors( c, b );
		_v1$3.subVectors( a, b );

		// strictly front facing
		return ( _v0$1.cross( _v1$3 ).dot( direction ) < 0 ) ? true : false;

	}

	/**
	 * Sets the triangle's vertices by copying the given values.
	 *
	 * @param {Vector3} a - The first corner of the triangle.
	 * @param {Vector3} b - The second corner of the triangle.
	 * @param {Vector3} c - The third corner of the triangle.
	 * @return {Triangle} A reference to this triangle.
	 */
	set( a, b, c ) {

		this.a.copy( a );
		this.b.copy( b );
		this.c.copy( c );

		return this;

	}

	/**
	 * Sets the triangle's vertices by copying the given array values.
	 *
	 * @param {Array<Vector3>} points - An array with 3D points.
	 * @param {number} i0 - The array index representing the first corner of the triangle.
	 * @param {number} i1 - The array index representing the second corner of the triangle.
	 * @param {number} i2 - The array index representing the third corner of the triangle.
	 * @return {Triangle} A reference to this triangle.
	 */
	setFromPointsAndIndices( points, i0, i1, i2 ) {

		this.a.copy( points[ i0 ] );
		this.b.copy( points[ i1 ] );
		this.c.copy( points[ i2 ] );

		return this;

	}

	/**
	 * Sets the triangle's vertices by copying the given attribute values.
	 *
	 * @param {BufferAttribute} attribute - A buffer attribute with 3D points data.
	 * @param {number} i0 - The attribute index representing the first corner of the triangle.
	 * @param {number} i1 - The attribute index representing the second corner of the triangle.
	 * @param {number} i2 - The attribute index representing the third corner of the triangle.
	 * @return {Triangle} A reference to this triangle.
	 */
	setFromAttributeAndIndices( attribute, i0, i1, i2 ) {

		this.a.fromBufferAttribute( attribute, i0 );
		this.b.fromBufferAttribute( attribute, i1 );
		this.c.fromBufferAttribute( attribute, i2 );

		return this;

	}

	/**
	 * Returns a new triangle with copied values from this instance.
	 *
	 * @return {Triangle} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

	/**
	 * Copies the values of the given triangle to this instance.
	 *
	 * @param {Triangle} triangle - The triangle to copy.
	 * @return {Triangle} A reference to this triangle.
	 */
	copy( triangle ) {

		this.a.copy( triangle.a );
		this.b.copy( triangle.b );
		this.c.copy( triangle.c );

		return this;

	}

	/**
	 * Computes the area of the triangle.
	 *
	 * @return {number} The triangle's area.
	 */
	getArea() {

		_v0$1.subVectors( this.c, this.b );
		_v1$3.subVectors( this.a, this.b );

		return _v0$1.cross( _v1$3 ).length() * 0.5;

	}

	/**
	 * Computes the midpoint of the triangle.
	 *
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The triangle's midpoint.
	 */
	getMidpoint( target ) {

		return target.addVectors( this.a, this.b ).add( this.c ).multiplyScalar( 1 / 3 );

	}

	/**
	 * Computes the normal of the triangle.
	 *
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The triangle's normal.
	 */
	getNormal( target ) {

		return Triangle.getNormal( this.a, this.b, this.c, target );

	}

	/**
	 * Computes a plane the triangle lies within.
	 *
	 * @param {Plane} target - The target vector that is used to store the method's result.
	 * @return {Plane} The plane the triangle lies within.
	 */
	getPlane( target ) {

		return target.setFromCoplanarPoints( this.a, this.b, this.c );

	}

	/**
	 * Computes a barycentric coordinates from the given vector.
	 * Returns `null` if the triangle is degenerate.
	 *
	 * @param {Vector3} point - A point in 3D space.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {?Vector3} The barycentric coordinates for the given point
	 */
	getBarycoord( point, target ) {

		return Triangle.getBarycoord( point, this.a, this.b, this.c, target );

	}

	/**
	 * Computes the value barycentrically interpolated for the given point on the
	 * triangle. Returns `null` if the triangle is degenerate.
	 *
	 * @param {Vector3} point - Position of interpolated point.
	 * @param {Vector3} v1 - Value to interpolate of first vertex.
	 * @param {Vector3} v2 - Value to interpolate of second vertex.
	 * @param {Vector3} v3 - Value to interpolate of third vertex.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {?Vector3} The interpolated value.
	 */
	getInterpolation( point, v1, v2, v3, target ) {

		return Triangle.getInterpolation( point, this.a, this.b, this.c, v1, v2, v3, target );

	}

	/**
	 * Returns `true` if the given point, when projected onto the plane of the
	 * triangle, lies within the triangle.
	 *
	 * @param {Vector3} point - The point in 3D space to test.
	 * @return {boolean} Whether the given point, when projected onto the plane of the
	 * triangle, lies within the triangle or not.
	 */
	containsPoint( point ) {

		return Triangle.containsPoint( point, this.a, this.b, this.c );

	}

	/**
	 * Returns `true` if the triangle is oriented towards the given direction.
	 *
	 * @param {Vector3} direction - The (normalized) direction vector.
	 * @return {boolean} Whether the triangle is oriented towards the given direction or not.
	 */
	isFrontFacing( direction ) {

		return Triangle.isFrontFacing( this.a, this.b, this.c, direction );

	}

	/**
	 * Returns `true` if this triangle intersects with the given box.
	 *
	 * @param {Box3} box - The box to intersect.
	 * @return {boolean} Whether this triangle intersects with the given box or not.
	 */
	intersectsBox( box ) {

		return box.intersectsTriangle( this );

	}

	/**
	 * Returns the closest point on the triangle to the given point.
	 *
	 * @param {Vector3} p - The point to compute the closest point for.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The closest point on the triangle.
	 */
	closestPointToPoint( p, target ) {

		const a = this.a, b = this.b, c = this.c;
		let v, w;

		// algorithm thanks to Real-Time Collision Detection by Christer Ericson,
		// published by Morgan Kaufmann Publishers, (c) 2005 Elsevier Inc.,
		// under the accompanying license; see chapter 5.1.5 for detailed explanation.
		// basically, we're distinguishing which of the voronoi regions of the triangle
		// the point lies in with the minimum amount of redundant computation.

		_vab.subVectors( b, a );
		_vac.subVectors( c, a );
		_vap.subVectors( p, a );
		const d1 = _vab.dot( _vap );
		const d2 = _vac.dot( _vap );
		if ( d1 <= 0 && d2 <= 0 ) {

			// vertex region of A; barycentric coords (1, 0, 0)
			return target.copy( a );

		}

		_vbp.subVectors( p, b );
		const d3 = _vab.dot( _vbp );
		const d4 = _vac.dot( _vbp );
		if ( d3 >= 0 && d4 <= d3 ) {

			// vertex region of B; barycentric coords (0, 1, 0)
			return target.copy( b );

		}

		const vc = d1 * d4 - d3 * d2;
		if ( vc <= 0 && d1 >= 0 && d3 <= 0 ) {

			v = d1 / ( d1 - d3 );
			// edge region of AB; barycentric coords (1-v, v, 0)
			return target.copy( a ).addScaledVector( _vab, v );

		}

		_vcp.subVectors( p, c );
		const d5 = _vab.dot( _vcp );
		const d6 = _vac.dot( _vcp );
		if ( d6 >= 0 && d5 <= d6 ) {

			// vertex region of C; barycentric coords (0, 0, 1)
			return target.copy( c );

		}

		const vb = d5 * d2 - d1 * d6;
		if ( vb <= 0 && d2 >= 0 && d6 <= 0 ) {

			w = d2 / ( d2 - d6 );
			// edge region of AC; barycentric coords (1-w, 0, w)
			return target.copy( a ).addScaledVector( _vac, w );

		}

		const va = d3 * d6 - d5 * d4;
		if ( va <= 0 && ( d4 - d3 ) >= 0 && ( d5 - d6 ) >= 0 ) {

			_vbc.subVectors( c, b );
			w = ( d4 - d3 ) / ( ( d4 - d3 ) + ( d5 - d6 ) );
			// edge region of BC; barycentric coords (0, 1-w, w)
			return target.copy( b ).addScaledVector( _vbc, w ); // edge region of BC

		}

		// face region
		const denom = 1 / ( va + vb + vc );
		// u = va * denom
		v = vb * denom;
		w = vc * denom;

		return target.copy( a ).addScaledVector( _vab, v ).addScaledVector( _vac, w );

	}

	/**
	 * Returns `true` if this triangle is equal with the given one.
	 *
	 * @param {Triangle} triangle - The triangle to test for equality.
	 * @return {boolean} Whether this triangle is equal with the given one.
	 */
	equals( triangle ) {

		return triangle.a.equals( this.a ) && triangle.b.equals( this.b ) && triangle.c.equals( this.c );

	}

}

const _colorKeywords = { 'aliceblue': 0xF0F8FF, 'antiquewhite': 0xFAEBD7, 'aqua': 0x00FFFF, 'aquamarine': 0x7FFFD4, 'azure': 0xF0FFFF,
	'beige': 0xF5F5DC, 'bisque': 0xFFE4C4, 'black': 0x000000, 'blanchedalmond': 0xFFEBCD, 'blue': 0x0000FF, 'blueviolet': 0x8A2BE2,
	'brown': 0xA52A2A, 'burlywood': 0xDEB887, 'cadetblue': 0x5F9EA0, 'chartreuse': 0x7FFF00, 'chocolate': 0xD2691E, 'coral': 0xFF7F50,
	'cornflowerblue': 0x6495ED, 'cornsilk': 0xFFF8DC, 'crimson': 0xDC143C, 'cyan': 0x00FFFF, 'darkblue': 0x00008B, 'darkcyan': 0x008B8B,
	'darkgoldenrod': 0xB8860B, 'darkgray': 0xA9A9A9, 'darkgreen': 0x006400, 'darkgrey': 0xA9A9A9, 'darkkhaki': 0xBDB76B, 'darkmagenta': 0x8B008B,
	'darkolivegreen': 0x556B2F, 'darkorange': 0xFF8C00, 'darkorchid': 0x9932CC, 'darkred': 0x8B0000, 'darksalmon': 0xE9967A, 'darkseagreen': 0x8FBC8F,
	'darkslateblue': 0x483D8B, 'darkslategray': 0x2F4F4F, 'darkslategrey': 0x2F4F4F, 'darkturquoise': 0x00CED1, 'darkviolet': 0x9400D3,
	'deeppink': 0xFF1493, 'deepskyblue': 0x00BFFF, 'dimgray': 0x696969, 'dimgrey': 0x696969, 'dodgerblue': 0x1E90FF, 'firebrick': 0xB22222,
	'floralwhite': 0xFFFAF0, 'forestgreen': 0x228B22, 'fuchsia': 0xFF00FF, 'gainsboro': 0xDCDCDC, 'ghostwhite': 0xF8F8FF, 'gold': 0xFFD700,
	'goldenrod': 0xDAA520, 'gray': 0x808080, 'green': 0x008000, 'greenyellow': 0xADFF2F, 'grey': 0x808080, 'honeydew': 0xF0FFF0, 'hotpink': 0xFF69B4,
	'indianred': 0xCD5C5C, 'indigo': 0x4B0082, 'ivory': 0xFFFFF0, 'khaki': 0xF0E68C, 'lavender': 0xE6E6FA, 'lavenderblush': 0xFFF0F5, 'lawngreen': 0x7CFC00,
	'lemonchiffon': 0xFFFACD, 'lightblue': 0xADD8E6, 'lightcoral': 0xF08080, 'lightcyan': 0xE0FFFF, 'lightgoldenrodyellow': 0xFAFAD2, 'lightgray': 0xD3D3D3,
	'lightgreen': 0x90EE90, 'lightgrey': 0xD3D3D3, 'lightpink': 0xFFB6C1, 'lightsalmon': 0xFFA07A, 'lightseagreen': 0x20B2AA, 'lightskyblue': 0x87CEFA,
	'lightslategray': 0x778899, 'lightslategrey': 0x778899, 'lightsteelblue': 0xB0C4DE, 'lightyellow': 0xFFFFE0, 'lime': 0x00FF00, 'limegreen': 0x32CD32,
	'linen': 0xFAF0E6, 'magenta': 0xFF00FF, 'maroon': 0x800000, 'mediumaquamarine': 0x66CDAA, 'mediumblue': 0x0000CD, 'mediumorchid': 0xBA55D3,
	'mediumpurple': 0x9370DB, 'mediumseagreen': 0x3CB371, 'mediumslateblue': 0x7B68EE, 'mediumspringgreen': 0x00FA9A, 'mediumturquoise': 0x48D1CC,
	'mediumvioletred': 0xC71585, 'midnightblue': 0x191970, 'mintcream': 0xF5FFFA, 'mistyrose': 0xFFE4E1, 'moccasin': 0xFFE4B5, 'navajowhite': 0xFFDEAD,
	'navy': 0x000080, 'oldlace': 0xFDF5E6, 'olive': 0x808000, 'olivedrab': 0x6B8E23, 'orange': 0xFFA500, 'orangered': 0xFF4500, 'orchid': 0xDA70D6,
	'palegoldenrod': 0xEEE8AA, 'palegreen': 0x98FB98, 'paleturquoise': 0xAFEEEE, 'palevioletred': 0xDB7093, 'papayawhip': 0xFFEFD5, 'peachpuff': 0xFFDAB9,
	'peru': 0xCD853F, 'pink': 0xFFC0CB, 'plum': 0xDDA0DD, 'powderblue': 0xB0E0E6, 'purple': 0x800080, 'rebeccapurple': 0x663399, 'red': 0xFF0000, 'rosybrown': 0xBC8F8F,
	'royalblue': 0x4169E1, 'saddlebrown': 0x8B4513, 'salmon': 0xFA8072, 'sandybrown': 0xF4A460, 'seagreen': 0x2E8B57, 'seashell': 0xFFF5EE,
	'sienna': 0xA0522D, 'silver': 0xC0C0C0, 'skyblue': 0x87CEEB, 'slateblue': 0x6A5ACD, 'slategray': 0x708090, 'slategrey': 0x708090, 'snow': 0xFFFAFA,
	'springgreen': 0x00FF7F, 'steelblue': 0x4682B4, 'tan': 0xD2B48C, 'teal': 0x008080, 'thistle': 0xD8BFD8, 'tomato': 0xFF6347, 'turquoise': 0x40E0D0,
	'violet': 0xEE82EE, 'wheat': 0xF5DEB3, 'white': 0xFFFFFF, 'whitesmoke': 0xF5F5F5, 'yellow': 0xFFFF00, 'yellowgreen': 0x9ACD32 };

const _hslA = { h: 0, s: 0, l: 0 };
const _hslB = { h: 0, s: 0, l: 0 };

function hue2rgb( p, q, t ) {

	if ( t < 0 ) t += 1;
	if ( t > 1 ) t -= 1;
	if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
	if ( t < 1 / 2 ) return q;
	if ( t < 2 / 3 ) return p + ( q - p ) * 6 * ( 2 / 3 - t );
	return p;

}

/**
 * A Color instance is represented by RGB components in the linear <i>working
 * color space</i>, which defaults to `LinearSRGBColorSpace`. Inputs
 * conventionally using `SRGBColorSpace` (such as hexadecimals and CSS
 * strings) are converted to the working color space automatically.
 *
 * ```js
 * // converted automatically from SRGBColorSpace to LinearSRGBColorSpace
 * const color = new THREE.Color().setHex( 0x112233 );
 * ```
 * Source color spaces may be specified explicitly, to ensure correct conversions.
 * ```js
 * // assumed already LinearSRGBColorSpace; no conversion
 * const color = new THREE.Color().setRGB( 0.5, 0.5, 0.5 );
 *
 * // converted explicitly from SRGBColorSpace to LinearSRGBColorSpace
 * const color = new THREE.Color().setRGB( 0.5, 0.5, 0.5, SRGBColorSpace );
 * ```
 * If THREE.ColorManagement is disabled, no conversions occur. For details,
 * see <i>Color management</i>. Iterating through a Color instance will yield
 * its components (r, g, b) in the corresponding order. A Color can be initialised
 * in any of the following ways:
 * ```js
 * //empty constructor - will default white
 * const color1 = new THREE.Color();
 *
 * //Hexadecimal color (recommended)
 * const color2 = new THREE.Color( 0xff0000 );
 *
 * //RGB string
 * const color3 = new THREE.Color("rgb(255, 0, 0)");
 * const color4 = new THREE.Color("rgb(100%, 0%, 0%)");
 *
 * //X11 color name - all 140 color names are supported.
 * //Note the lack of CamelCase in the name
 * const color5 = new THREE.Color( 'skyblue' );
 * //HSL string
 * const color6 = new THREE.Color("hsl(0, 100%, 50%)");
 *
 * //Separate RGB values between 0 and 1
 * const color7 = new THREE.Color( 1, 0, 0 );
 * ```
 */
class Color {

	/**
	 * Constructs a new color.
	 *
	 * Note that standard method of specifying color in three.js is with a hexadecimal triplet,
	 * and that method is used throughout the rest of the documentation.
	 *
	 * @param {(number|string|Color)} [r] - The red component of the color. If `g` and `b` are
	 * not provided, it can be hexadecimal triplet, a CSS-style string or another `Color` instance.
	 * @param {number} [g] - The green component.
	 * @param {number} [b] - The blue component.
	 */
	constructor( r, g, b ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isColor = true;

		/**
		 * The red component.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.r = 1;

		/**
		 * The green component.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.g = 1;

		/**
		 * The blue component.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.b = 1;

		return this.set( r, g, b );

	}

	/**
	 * Sets the colors's components from the given values.
	 *
	 * @param {(number|string|Color)} [r] - The red component of the color. If `g` and `b` are
	 * not provided, it can be hexadecimal triplet, a CSS-style string or another `Color` instance.
	 * @param {number} [g] - The green component.
	 * @param {number} [b] - The blue component.
	 * @return {Color} A reference to this color.
	 */
	set( r, g, b ) {

		if ( g === undefined && b === undefined ) {

			// r is THREE.Color, hex or string

			const value = r;

			if ( value && value.isColor ) {

				this.copy( value );

			} else if ( typeof value === 'number' ) {

				this.setHex( value );

			} else if ( typeof value === 'string' ) {

				this.setStyle( value );

			}

		} else {

			this.setRGB( r, g, b );

		}

		return this;

	}

	/**
	 * Sets the colors's components to the given scalar value.
	 *
	 * @param {number} scalar - The scalar value.
	 * @return {Color} A reference to this color.
	 */
	setScalar( scalar ) {

		this.r = scalar;
		this.g = scalar;
		this.b = scalar;

		return this;

	}

	/**
	 * Sets this color from a hexadecimal value.
	 *
	 * @param {number} hex - The hexadecimal value.
	 * @param {string} [colorSpace=SRGBColorSpace] - The color space.
	 * @return {Color} A reference to this color.
	 */
	setHex( hex, colorSpace = SRGBColorSpace ) {

		hex = Math.floor( hex );

		this.r = ( hex >> 16 & 255 ) / 255;
		this.g = ( hex >> 8 & 255 ) / 255;
		this.b = ( hex & 255 ) / 255;

		ColorManagement.toWorkingColorSpace( this, colorSpace );

		return this;

	}

	/**
	 * Sets this color from RGB values.
	 *
	 * @param {number} r - Red channel value between `0.0` and `1.0`.
	 * @param {number} g - Green channel value between `0.0` and `1.0`.
	 * @param {number} b - Blue channel value between `0.0` and `1.0`.
	 * @param {string} [colorSpace=ColorManagement.workingColorSpace] - The color space.
	 * @return {Color} A reference to this color.
	 */
	setRGB( r, g, b, colorSpace = ColorManagement.workingColorSpace ) {

		this.r = r;
		this.g = g;
		this.b = b;

		ColorManagement.toWorkingColorSpace( this, colorSpace );

		return this;

	}

	/**
	 * Sets this color from RGB values.
	 *
	 * @param {number} h - Hue value between `0.0` and `1.0`.
	 * @param {number} s - Saturation value between `0.0` and `1.0`.
	 * @param {number} l - Lightness value between `0.0` and `1.0`.
	 * @param {string} [colorSpace=ColorManagement.workingColorSpace] - The color space.
	 * @return {Color} A reference to this color.
	 */
	setHSL( h, s, l, colorSpace = ColorManagement.workingColorSpace ) {

		// h,s,l ranges are in 0.0 - 1.0
		h = euclideanModulo( h, 1 );
		s = clamp( s, 0, 1 );
		l = clamp( l, 0, 1 );

		if ( s === 0 ) {

			this.r = this.g = this.b = l;

		} else {

			const p = l <= 0.5 ? l * ( 1 + s ) : l + s - ( l * s );
			const q = ( 2 * l ) - p;

			this.r = hue2rgb( q, p, h + 1 / 3 );
			this.g = hue2rgb( q, p, h );
			this.b = hue2rgb( q, p, h - 1 / 3 );

		}

		ColorManagement.toWorkingColorSpace( this, colorSpace );

		return this;

	}

	/**
	 * Sets this color from a CSS-style string. For example, `rgb(250, 0,0)`,
	 * `rgb(100%, 0%, 0%)`, `hsl(0, 100%, 50%)`, `#ff0000`, `#f00`, or `red` ( or
	 * any [X11 color name]{@link https://en.wikipedia.org/wiki/X11_color_names#Color_name_chart} -
	 * all 140 color names are supported).
	 *
	 * @param {string} style - Color as a CSS-style string.
	 * @param {string} [colorSpace=SRGBColorSpace] - The color space.
	 * @return {Color} A reference to this color.
	 */
	setStyle( style, colorSpace = SRGBColorSpace ) {

		function handleAlpha( string ) {

			if ( string === undefined ) return;

			if ( parseFloat( string ) < 1 ) {

				console.warn( 'THREE.Color: Alpha component of ' + style + ' will be ignored.' );

			}

		}


		let m;

		if ( m = /^(\w+)\(([^\)]*)\)/.exec( style ) ) {

			// rgb / hsl

			let color;
			const name = m[ 1 ];
			const components = m[ 2 ];

			switch ( name ) {

				case 'rgb':
				case 'rgba':

					if ( color = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec( components ) ) {

						// rgb(255,0,0) rgba(255,0,0,0.5)

						handleAlpha( color[ 4 ] );

						return this.setRGB(
							Math.min( 255, parseInt( color[ 1 ], 10 ) ) / 255,
							Math.min( 255, parseInt( color[ 2 ], 10 ) ) / 255,
							Math.min( 255, parseInt( color[ 3 ], 10 ) ) / 255,
							colorSpace
						);

					}

					if ( color = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec( components ) ) {

						// rgb(100%,0%,0%) rgba(100%,0%,0%,0.5)

						handleAlpha( color[ 4 ] );

						return this.setRGB(
							Math.min( 100, parseInt( color[ 1 ], 10 ) ) / 100,
							Math.min( 100, parseInt( color[ 2 ], 10 ) ) / 100,
							Math.min( 100, parseInt( color[ 3 ], 10 ) ) / 100,
							colorSpace
						);

					}

					break;

				case 'hsl':
				case 'hsla':

					if ( color = /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec( components ) ) {

						// hsl(120,50%,50%) hsla(120,50%,50%,0.5)

						handleAlpha( color[ 4 ] );

						return this.setHSL(
							parseFloat( color[ 1 ] ) / 360,
							parseFloat( color[ 2 ] ) / 100,
							parseFloat( color[ 3 ] ) / 100,
							colorSpace
						);

					}

					break;

				default:

					console.warn( 'THREE.Color: Unknown color model ' + style );

			}

		} else if ( m = /^\#([A-Fa-f\d]+)$/.exec( style ) ) {

			// hex color

			const hex = m[ 1 ];
			const size = hex.length;

			if ( size === 3 ) {

				// #ff0
				return this.setRGB(
					parseInt( hex.charAt( 0 ), 16 ) / 15,
					parseInt( hex.charAt( 1 ), 16 ) / 15,
					parseInt( hex.charAt( 2 ), 16 ) / 15,
					colorSpace
				);

			} else if ( size === 6 ) {

				// #ff0000
				return this.setHex( parseInt( hex, 16 ), colorSpace );

			} else {

				console.warn( 'THREE.Color: Invalid hex color ' + style );

			}

		} else if ( style && style.length > 0 ) {

			return this.setColorName( style, colorSpace );

		}

		return this;

	}

	/**
	 * Sets this color from a color name. Faster than {@link Color#setStyle} if
	 * you don't need the other CSS-style formats.
	 *
	 * For convenience, the list of names is exposed in `Color.NAMES` as a hash.
	 * ```js
	 * Color.NAMES.aliceblue // returns 0xF0F8FF
	 * ```
	 *
	 * @param {string} style - The color name.
	 * @param {string} [colorSpace=SRGBColorSpace] - The color space.
	 * @return {Color} A reference to this color.
	 */
	setColorName( style, colorSpace = SRGBColorSpace ) {

		// color keywords
		const hex = _colorKeywords[ style.toLowerCase() ];

		if ( hex !== undefined ) {

			// red
			this.setHex( hex, colorSpace );

		} else {

			// unknown color
			console.warn( 'THREE.Color: Unknown color ' + style );

		}

		return this;

	}

	/**
	 * Returns a new color with copied values from this instance.
	 *
	 * @return {Color} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this.r, this.g, this.b );

	}

	/**
	 * Copies the values of the given color to this instance.
	 *
	 * @param {Color} color - The color to copy.
	 * @return {Color} A reference to this color.
	 */
	copy( color ) {

		this.r = color.r;
		this.g = color.g;
		this.b = color.b;

		return this;

	}

	/**
	 * Copies the given color into this color, and then converts this color from
	 * `SRGBColorSpace` to `LinearSRGBColorSpace`.
	 *
	 * @param {Color} color - The color to copy/convert.
	 * @return {Color} A reference to this color.
	 */
	copySRGBToLinear( color ) {

		this.r = SRGBToLinear( color.r );
		this.g = SRGBToLinear( color.g );
		this.b = SRGBToLinear( color.b );

		return this;

	}

	/**
	 * Copies the given color into this color, and then converts this color from
	 * `LinearSRGBColorSpace` to `SRGBColorSpace`.
	 *
	 * @param {Color} color - The color to copy/convert.
	 * @return {Color} A reference to this color.
	 */
	copyLinearToSRGB( color ) {

		this.r = LinearToSRGB( color.r );
		this.g = LinearToSRGB( color.g );
		this.b = LinearToSRGB( color.b );

		return this;

	}

	/**
	 * Converts this color from `SRGBColorSpace` to `LinearSRGBColorSpace`.
	 *
	 * @return {Color} A reference to this color.
	 */
	convertSRGBToLinear() {

		this.copySRGBToLinear( this );

		return this;

	}

	/**
	 * Converts this color from `LinearSRGBColorSpace` to `SRGBColorSpace`.
	 *
	 * @return {Color} A reference to this color.
	 */
	convertLinearToSRGB() {

		this.copyLinearToSRGB( this );

		return this;

	}

	/**
	 * Returns the hexadecimal value of this color.
	 *
	 * @param {string} [colorSpace=SRGBColorSpace] - The color space.
	 * @return {number} The hexadecimal value.
	 */
	getHex( colorSpace = SRGBColorSpace ) {

		ColorManagement.fromWorkingColorSpace( _color.copy( this ), colorSpace );

		return Math.round( clamp( _color.r * 255, 0, 255 ) ) * 65536 + Math.round( clamp( _color.g * 255, 0, 255 ) ) * 256 + Math.round( clamp( _color.b * 255, 0, 255 ) );

	}

	/**
	 * Returns the hexadecimal value of this color as a string (for example, 'FFFFFF').
	 *
	 * @param {string} [colorSpace=SRGBColorSpace] - The color space.
	 * @return {string} The hexadecimal value as a string.
	 */
	getHexString( colorSpace = SRGBColorSpace ) {

		return ( '000000' + this.getHex( colorSpace ).toString( 16 ) ).slice( -6 );

	}

	/**
	 * Converts the colors RGB values into the HSL format and stores them into the
	 * given target object.
	 *
	 * @param {{h:number,s:number,l:number}} target - The target object that is used to store the method's result.
	 * @param {string} [colorSpace=ColorManagement.workingColorSpace] - The color space.
	 * @return {{h:number,s:number,l:number}} The HSL representation of this color.
	 */
	getHSL( target, colorSpace = ColorManagement.workingColorSpace ) {

		// h,s,l ranges are in 0.0 - 1.0

		ColorManagement.fromWorkingColorSpace( _color.copy( this ), colorSpace );

		const r = _color.r, g = _color.g, b = _color.b;

		const max = Math.max( r, g, b );
		const min = Math.min( r, g, b );

		let hue, saturation;
		const lightness = ( min + max ) / 2.0;

		if ( min === max ) {

			hue = 0;
			saturation = 0;

		} else {

			const delta = max - min;

			saturation = lightness <= 0.5 ? delta / ( max + min ) : delta / ( 2 - max - min );

			switch ( max ) {

				case r: hue = ( g - b ) / delta + ( g < b ? 6 : 0 ); break;
				case g: hue = ( b - r ) / delta + 2; break;
				case b: hue = ( r - g ) / delta + 4; break;

			}

			hue /= 6;

		}

		target.h = hue;
		target.s = saturation;
		target.l = lightness;

		return target;

	}

	/**
	 * Returns the RGB values of this color and stores them into the given target object.
	 *
	 * @param {Color} target - The target color that is used to store the method's result.
	 * @param {string} [colorSpace=ColorManagement.workingColorSpace] - The color space.
	 * @return {Color} The RGB representation of this color.
	 */
	getRGB( target, colorSpace = ColorManagement.workingColorSpace ) {

		ColorManagement.fromWorkingColorSpace( _color.copy( this ), colorSpace );

		target.r = _color.r;
		target.g = _color.g;
		target.b = _color.b;

		return target;

	}

	/**
	 * Returns the value of this color as a CSS style string. Example: `rgb(255,0,0)`.
	 *
	 * @param {string} [colorSpace=SRGBColorSpace] - The color space.
	 * @return {string} The CSS representation of this color.
	 */
	getStyle( colorSpace = SRGBColorSpace ) {

		ColorManagement.fromWorkingColorSpace( _color.copy( this ), colorSpace );

		const r = _color.r, g = _color.g, b = _color.b;

		if ( colorSpace !== SRGBColorSpace ) {

			// Requires CSS Color Module Level 4 (https://www.w3.org/TR/css-color-4/).
			return `color(${ colorSpace } ${ r.toFixed( 3 ) } ${ g.toFixed( 3 ) } ${ b.toFixed( 3 ) })`;

		}

		return `rgb(${ Math.round( r * 255 ) },${ Math.round( g * 255 ) },${ Math.round( b * 255 ) })`;

	}

	/**
	 * Adds the given HSL values to this color's values.
	 * Internally, this converts the color's RGB values to HSL, adds HSL
	 * and then converts the color back to RGB.
	 *
	 * @param {number} h - Hue value between `0.0` and `1.0`.
	 * @param {number} s - Saturation value between `0.0` and `1.0`.
	 * @param {number} l - Lightness value between `0.0` and `1.0`.
	 * @return {Color} A reference to this color.
	 */
	offsetHSL( h, s, l ) {

		this.getHSL( _hslA );

		return this.setHSL( _hslA.h + h, _hslA.s + s, _hslA.l + l );

	}

	/**
	 * Adds the RGB values of the given color to the RGB values of this color.
	 *
	 * @param {Color} color - The color to add.
	 * @return {Color} A reference to this color.
	 */
	add( color ) {

		this.r += color.r;
		this.g += color.g;
		this.b += color.b;

		return this;

	}

	/**
	 * Adds the RGB values of the given colors and stores the result in this instance.
	 *
	 * @param {Color} color1 - The first color.
	 * @param {Color} color2 - The second color.
	 * @return {Color} A reference to this color.
	 */
	addColors( color1, color2 ) {

		this.r = color1.r + color2.r;
		this.g = color1.g + color2.g;
		this.b = color1.b + color2.b;

		return this;

	}

	/**
	 * Adds the given scalar value to the RGB values of this color.
	 *
	 * @param {number} s - The scalar to add.
	 * @return {Color} A reference to this color.
	 */
	addScalar( s ) {

		this.r += s;
		this.g += s;
		this.b += s;

		return this;

	}

	/**
	 * Subtracts the RGB values of the given color from the RGB values of this color.
	 *
	 * @param {Color} color - The color to subtract.
	 * @return {Color} A reference to this color.
	 */
	sub( color ) {

		this.r = Math.max( 0, this.r - color.r );
		this.g = Math.max( 0, this.g - color.g );
		this.b = Math.max( 0, this.b - color.b );

		return this;

	}

	/**
	 * Multiplies the RGB values of the given color with the RGB values of this color.
	 *
	 * @param {Color} color - The color to multiply.
	 * @return {Color} A reference to this color.
	 */
	multiply( color ) {

		this.r *= color.r;
		this.g *= color.g;
		this.b *= color.b;

		return this;

	}

	/**
	 * Multiplies the given scalar value with the RGB values of this color.
	 *
	 * @param {number} s - The scalar to multiply.
	 * @return {Color} A reference to this color.
	 */
	multiplyScalar( s ) {

		this.r *= s;
		this.g *= s;
		this.b *= s;

		return this;

	}

	/**
	 * Linearly interpolates this color's RGB values toward the RGB values of the
	 * given color. The alpha argument can be thought of as the ratio between
	 * the two colors, where `0.0` is this color and `1.0` is the first argument.
	 *
	 * @param {Color} color - The color to converge on.
	 * @param {number} alpha - The interpolation factor in the closed interval `[0,1]`.
	 * @return {Color} A reference to this color.
	 */
	lerp( color, alpha ) {

		this.r += ( color.r - this.r ) * alpha;
		this.g += ( color.g - this.g ) * alpha;
		this.b += ( color.b - this.b ) * alpha;

		return this;

	}

	/**
	 * Linearly interpolates between the given colors and stores the result in this instance.
	 * The alpha argument can be thought of as the ratio between the two colors, where `0.0`
	 * is the first and `1.0` is the second color.
	 *
	 * @param {Color} color1 - The first color.
	 * @param {Color} color2 - The second color.
	 * @param {number} alpha - The interpolation factor in the closed interval `[0,1]`.
	 * @return {Color} A reference to this color.
	 */
	lerpColors( color1, color2, alpha ) {

		this.r = color1.r + ( color2.r - color1.r ) * alpha;
		this.g = color1.g + ( color2.g - color1.g ) * alpha;
		this.b = color1.b + ( color2.b - color1.b ) * alpha;

		return this;

	}

	/**
	 * Linearly interpolates this color's HSL values toward the HSL values of the
	 * given color. It differs from {@link Color#lerp} by not interpolating straight
	 * from one color to the other, but instead going through all the hues in between
	 * those two colors. The alpha argument can be thought of as the ratio between
	 * the two colors, where 0.0 is this color and 1.0 is the first argument.
	 *
	 * @param {Color} color - The color to converge on.
	 * @param {number} alpha - The interpolation factor in the closed interval `[0,1]`.
	 * @return {Color} A reference to this color.
	 */
	lerpHSL( color, alpha ) {

		this.getHSL( _hslA );
		color.getHSL( _hslB );

		const h = lerp( _hslA.h, _hslB.h, alpha );
		const s = lerp( _hslA.s, _hslB.s, alpha );
		const l = lerp( _hslA.l, _hslB.l, alpha );

		this.setHSL( h, s, l );

		return this;

	}

	/**
	 * Sets the color's RGB components from the given 3D vector.
	 *
	 * @param {Vector3} v - The vector to set.
	 * @return {Color} A reference to this color.
	 */
	setFromVector3( v ) {

		this.r = v.x;
		this.g = v.y;
		this.b = v.z;

		return this;

	}

	/**
	 * Transforms this color with the given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The matrix.
	 * @return {Color} A reference to this color.
	 */
	applyMatrix3( m ) {

		const r = this.r, g = this.g, b = this.b;
		const e = m.elements;

		this.r = e[ 0 ] * r + e[ 3 ] * g + e[ 6 ] * b;
		this.g = e[ 1 ] * r + e[ 4 ] * g + e[ 7 ] * b;
		this.b = e[ 2 ] * r + e[ 5 ] * g + e[ 8 ] * b;

		return this;

	}

	/**
	 * Returns `true` if this color is equal with the given one.
	 *
	 * @param {Color} c - The color to test for equality.
	 * @return {boolean} Whether this bounding color is equal with the given one.
	 */
	equals( c ) {

		return ( c.r === this.r ) && ( c.g === this.g ) && ( c.b === this.b );

	}

	/**
	 * Sets this color's RGB components from the given array.
	 *
	 * @param {Array<number>} array - An array holding the RGB values.
	 * @param {number} [offset=0] - The offset into the array.
	 * @return {Color} A reference to this color.
	 */
	fromArray( array, offset = 0 ) {

		this.r = array[ offset ];
		this.g = array[ offset + 1 ];
		this.b = array[ offset + 2 ];

		return this;

	}

	/**
	 * Writes the RGB components of this color to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the color components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The color components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.r;
		array[ offset + 1 ] = this.g;
		array[ offset + 2 ] = this.b;

		return array;

	}

	/**
	 * Sets the components of this color from the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - The buffer attribute holding color data.
	 * @param {number} index - The index into the attribute.
	 * @return {Color} A reference to this color.
	 */
	fromBufferAttribute( attribute, index ) {

		this.r = attribute.getX( index );
		this.g = attribute.getY( index );
		this.b = attribute.getZ( index );

		return this;

	}

	/**
	 * This methods defines the serialization result of this class. Returns the color
	 * as a hexadecimal value.
	 *
	 * @return {number} The hexadecimal value.
	 */
	toJSON() {

		return this.getHex();

	}

	*[ Symbol.iterator ]() {

		yield this.r;
		yield this.g;
		yield this.b;

	}

}

const _color = /*@__PURE__*/ new Color();

/**
 * A dictionary with X11 color names.
 *
 * Note that multiple words such as Dark Orange become the string 'darkorange'.
 *
 * @static
 * @type {Object}
 */
Color.NAMES = _colorKeywords;

let _materialId = 0;

/**
 * Abstract base class for materials.
 *
 * Materials define the appearance of renderable 3D objects.
 *
 * @abstract
 * @augments EventDispatcher
 */
class Material extends EventDispatcher {

	/**
	 * Constructs a new material.
	 */
	constructor() {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isMaterial = true;

		/**
		 * The ID of the material.
		 *
		 * @name Material#id
		 * @type {number}
		 * @readonly
		 */
		Object.defineProperty( this, 'id', { value: _materialId ++ } );

		/**
		 * The UUID of the material.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.uuid = generateUUID();

		/**
		 * The name of the material.
		 *
		 * @type {string}
		 */
		this.name = '';

		/**
		 * The type property is used for detecting the object type
		 * in context of serialization/deserialization.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.type = 'Material';

		/**
		 * Defines the blending type of the material.
		 *
		 * It must be set to `CustomBlending` if custom blending properties like
		 * {@link Material#blendSrc}, {@link Material#blendDst} or {@link Material#blendEquation}
		 * should have any effect.
		 *
		 * @type {(NoBlending|NormalBlending|AdditiveBlending|SubtractiveBlending|MultiplyBlending|CustomBlending)}
		 * @default NormalBlending
		 */
		this.blending = NormalBlending;

		/**
		 * Defines which side of faces will be rendered - front, back or both.
		 *
		 * @type {(FrontSide|BackSide|DoubleSide)}
		 * @default FrontSide
		 */
		this.side = FrontSide;

		/**
		 * If set to `true`, vertex colors should be used.
		 *
		 * The engine supports RGB and RGBA vertex colors depending on whether a three (RGB) or
		 * four (RGBA) component color buffer attribute is used.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.vertexColors = false;

		/**
		 * Defines how transparent the material is.
		 * A value of `0.0` indicates fully transparent, `1.0` is fully opaque.
		 *
		 * If the {@link Material#transparent} is not set to `true`,
		 * the material will remain fully opaque and this value will only affect its color.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.opacity = 1;

		/**
		 * Defines whether this material is transparent. This has an effect on
		 * rendering as transparent objects need special treatment and are rendered
		 * after non-transparent objects.
		 *
		 * When set to true, the extent to which the material is transparent is
		 * controlled by {@link Material#opacity}.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.transparent = false;

		/**
		 * Enables alpha hashed transparency, an alternative to {@link Material#transparent} or
		 * {@link Material#alphaTest}. The material will not be rendered if opacity is lower than
		 * a random threshold. Randomization introduces some grain or noise, but approximates alpha
		 * blending without the associated problems of sorting. Using TAA can reduce the resulting noise.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.alphaHash = false;

		/**
		 * Defines the blending source factor.
		 *
		 * @type {(ZeroFactor|OneFactor|SrcColorFactor|OneMinusSrcColorFactor|SrcAlphaFactor|OneMinusSrcAlphaFactor|DstAlphaFactor|OneMinusDstAlphaFactor|DstColorFactor|OneMinusDstColorFactor|SrcAlphaSaturateFactor|ConstantColorFactor|OneMinusConstantColorFactor|ConstantAlphaFactor|OneMinusConstantAlphaFactor)}
		 * @default SrcAlphaFactor
		 */
		this.blendSrc = SrcAlphaFactor;

		/**
		 * Defines the blending destination factor.
		 *
		 * @type {(ZeroFactor|OneFactor|SrcColorFactor|OneMinusSrcColorFactor|SrcAlphaFactor|OneMinusSrcAlphaFactor|DstAlphaFactor|OneMinusDstAlphaFactor|DstColorFactor|OneMinusDstColorFactor|SrcAlphaSaturateFactor|ConstantColorFactor|OneMinusConstantColorFactor|ConstantAlphaFactor|OneMinusConstantAlphaFactor)}
		 * @default OneMinusSrcAlphaFactor
		 */
		this.blendDst = OneMinusSrcAlphaFactor;

		/**
		 * Defines the blending equation.
		 *
		 * @type {(AddEquation|SubtractEquation|ReverseSubtractEquation|MinEquation|MaxEquation)}
		 * @default AddEquation
		 */
		this.blendEquation = AddEquation;

		/**
		 * Defines the blending source alpha factor.
		 *
		 * @type {?(ZeroFactor|OneFactor|SrcColorFactor|OneMinusSrcColorFactor|SrcAlphaFactor|OneMinusSrcAlphaFactor|DstAlphaFactor|OneMinusDstAlphaFactor|DstColorFactor|OneMinusDstColorFactor|SrcAlphaSaturateFactor|ConstantColorFactor|OneMinusConstantColorFactor|ConstantAlphaFactor|OneMinusConstantAlphaFactor)}
		 * @default null
		 */
		this.blendSrcAlpha = null;

		/**
		 * Defines the blending destination alpha factor.
		 *
		 * @type {?(ZeroFactor|OneFactor|SrcColorFactor|OneMinusSrcColorFactor|SrcAlphaFactor|OneMinusSrcAlphaFactor|DstAlphaFactor|OneMinusDstAlphaFactor|DstColorFactor|OneMinusDstColorFactor|SrcAlphaSaturateFactor|ConstantColorFactor|OneMinusConstantColorFactor|ConstantAlphaFactor|OneMinusConstantAlphaFactor)}
		 * @default null
		 */
		this.blendDstAlpha = null;

		/**
		 * Defines the blending equation of the alpha channel.
		 *
		 * @type {?(AddEquation|SubtractEquation|ReverseSubtractEquation|MinEquation|MaxEquation)}
		 * @default null
		 */
		this.blendEquationAlpha = null;

		/**
		 * Represents the RGB values of the constant blend color.
		 *
		 * This property has only an effect when using custom blending with `ConstantColor` or `OneMinusConstantColor`.
		 *
		 * @type {Color}
		 * @default (0,0,0)
		 */
		this.blendColor = new Color( 0, 0, 0 );

		/**
		 * Represents the alpha value of the constant blend color.
		 *
		 * This property has only an effect when using custom blending with `ConstantAlpha` or `OneMinusConstantAlpha`.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.blendAlpha = 0;

		/**
		 * Defines the depth function.
		 *
		 * @type {(NeverDepth|AlwaysDepth|LessDepth|LessEqualDepth|EqualDepth|GreaterEqualDepth|GreaterDepth|NotEqualDepth)}
		 * @default LessEqualDepth
		 */
		this.depthFunc = LessEqualDepth;

		/**
		 * Whether to have depth test enabled when rendering this material.
		 * When the depth test is disabled, the depth write will also be implicitly disabled.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.depthTest = true;

		/**
		 * Whether rendering this material has any effect on the depth buffer.
		 *
		 * When drawing 2D overlays it can be useful to disable the depth writing in
		 * order to layer several things together without creating z-index artifacts.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.depthWrite = true;

		/**
		 * The bit mask to use when writing to the stencil buffer.
		 *
		 * @type {number}
		 * @default 0xff
		 */
		this.stencilWriteMask = 0xff;

		/**
		 * The stencil comparison function to use.
		 *
		 * @type {NeverStencilFunc|LessStencilFunc|EqualStencilFunc|LessEqualStencilFunc|GreaterStencilFunc|NotEqualStencilFunc|GreaterEqualStencilFunc|AlwaysStencilFunc}
		 * @default AlwaysStencilFunc
		 */
		this.stencilFunc = AlwaysStencilFunc;

		/**
		 * The value to use when performing stencil comparisons or stencil operations.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.stencilRef = 0;

		/**
		 * The bit mask to use when comparing against the stencil buffer.
		 *
		 * @type {number}
		 * @default 0xff
		 */
		this.stencilFuncMask = 0xff;

		/**
		 * Which stencil operation to perform when the comparison function returns `false`.
		 *
		 * @type {ZeroStencilOp|KeepStencilOp|ReplaceStencilOp|IncrementStencilOp|DecrementStencilOp|IncrementWrapStencilOp|DecrementWrapStencilOp|InvertStencilOp}
		 * @default KeepStencilOp
		 */
		this.stencilFail = KeepStencilOp;

		/**
		 * Which stencil operation to perform when the comparison function returns
		 * `true` but the depth test fails.
		 *
		 * @type {ZeroStencilOp|KeepStencilOp|ReplaceStencilOp|IncrementStencilOp|DecrementStencilOp|IncrementWrapStencilOp|DecrementWrapStencilOp|InvertStencilOp}
		 * @default KeepStencilOp
		 */
		this.stencilZFail = KeepStencilOp;

		/**
		 * Which stencil operation to perform when the comparison function returns
		 * `true` and the depth test passes.
		 *
		 * @type {ZeroStencilOp|KeepStencilOp|ReplaceStencilOp|IncrementStencilOp|DecrementStencilOp|IncrementWrapStencilOp|DecrementWrapStencilOp|InvertStencilOp}
		 * @default KeepStencilOp
		 */
		this.stencilZPass = KeepStencilOp;

		/**
		 * Whether stencil operations are performed against the stencil buffer. In
		 * order to perform writes or comparisons against the stencil buffer this
		 * value must be `true`.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.stencilWrite = false;

		/**
		 * User-defined clipping planes specified as THREE.Plane objects in world
		 * space. These planes apply to the objects this material is attached to.
		 * Points in space whose signed distance to the plane is negative are clipped
		 * (not rendered). This requires {@link WebGLRenderer#localClippingEnabled} to
		 * be `true`.
		 *
		 * @type {?Array<Plane>}
		 * @default null
		 */
		this.clippingPlanes = null;

		/**
		 * Changes the behavior of clipping planes so that only their intersection is
		 * clipped, rather than their union.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.clipIntersection = false;

		/**
		 * Defines whether to clip shadows according to the clipping planes specified
		 * on this material.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.clipShadows = false;

		/**
		 * Defines which side of faces cast shadows. If `null`, the side casting shadows
		 * is determined as follows:
		 *
		 * - When {@link Material#side} is set to `FrontSide`, the back side cast shadows.
		 * - When {@link Material#side} is set to `BackSide`, the front side cast shadows.
		 * - When {@link Material#side} is set to `DoubleSide`, both sides cast shadows.
		 *
		 * @type {?(FrontSide|BackSide|DoubleSide)}
		 * @default null
		 */
		this.shadowSide = null;

		/**
		 * Whether to render the material's color.
		 *
		 * This can be used in conjunction with {@link Object3D#renderOder} to create invisible
		 * objects that occlude other objects.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.colorWrite = true;

		/**
		 * Override the renderer's default precision for this material.
		 *
		 * @type {?('highp'|'mediump'|'lowp')}
		 * @default null
		 */
		this.precision = null;

		/**
		 * Whether to use polygon offset or not. When enabled, each fragment's depth value will
		 * be offset after it is interpolated from the depth values of the appropriate vertices.
		 * The offset is added before the depth test is performed and before the value is written
		 * into the depth buffer.
		 *
		 * Can be useful for rendering hidden-line images, for applying decals to surfaces, and for
		 * rendering solids with highlighted edges.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.polygonOffset = false;

		/**
		 * Specifies a scale factor that is used to create a variable depth offset for each polygon.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.polygonOffsetFactor = 0;

		/**
		 * Is multiplied by an implementation-specific value to create a constant depth offset.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.polygonOffsetUnits = 0;

		/**
		 * Whether to apply dithering to the color to remove the appearance of banding.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.dithering = false;

		/**
		 * Whether alpha to coverage should be enabled or not. Can only be used with MSAA-enabled contexts
		 * (meaning when the renderer was created with *antialias* parameter set to `true`). Enabling this
		 * will smooth aliasing on clip plane edges and alphaTest-clipped edges.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.alphaToCoverage = false;

		/**
		 * Whether to premultiply the alpha (transparency) value.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.premultipliedAlpha = false;

		/**
		 * Whether double-sided, transparent objects should be rendered with a single pass or not.
		 *
		 * The engine renders double-sided, transparent objects with two draw calls (back faces first,
		 * then front faces) to mitigate transparency artifacts. There are scenarios however where this
		 * approach produces no quality gains but still doubles draw calls e.g. when rendering flat
		 * vegetation like grass sprites. In these cases, set the `forceSinglePass` flag to `true` to
		 * disable the two pass rendering to avoid performance issues.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.forceSinglePass = false;

		/**
		 * Whether it's possible to override the material with {@link Scene#overrideMaterial} or not.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.allowOverride = true;

		/**
		 * Defines whether 3D objects using this material are visible.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.visible = true;

		/**
		 * Defines whether this material is tone mapped according to the renderer's tone mapping setting.
		 *
		 * It is ignored when rendering to a render target or using post processing or when using
		 * `WebGPURenderer`. In all these cases, all materials are honored by tone mapping.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.toneMapped = true;

		/**
		 * An object that can be used to store custom data about the Material. It
		 * should not hold references to functions as these will not be cloned.
		 *
		 * @type {Object}
		 */
		this.userData = {};

		/**
		 * This starts at `0` and counts how many times {@link Material#needsUpdate} is set to `true`.
		 *
		 * @type {number}
		 * @readonly
		 * @default 0
		 */
		this.version = 0;

		this._alphaTest = 0;

	}

	/**
	 * Sets the alpha value to be used when running an alpha test. The material
	 * will not be rendered if the opacity is lower than this value.
	 *
	 * @type {number}
	 * @readonly
	 * @default 0
	 */
	get alphaTest() {

		return this._alphaTest;

	}

	set alphaTest( value ) {

		if ( this._alphaTest > 0 !== value > 0 ) {

			this.version ++;

		}

		this._alphaTest = value;

	}

	/**
	 * An optional callback that is executed immediately before the material is used to render a 3D object.
	 *
	 * This method can only be used when rendering with {@link WebGLRenderer}.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Scene} scene - The scene.
	 * @param {Camera} camera - The camera that is used to render the scene.
	 * @param {BufferGeometry} geometry - The 3D object's geometry.
	 * @param {Object3D} object - The 3D object.
	 * @param {Object} group - The geometry group data.
	 */
	onBeforeRender( /* renderer, scene, camera, geometry, object, group */ ) {}

	/**
	 * An optional callback that is executed immediately before the shader
	 * program is compiled. This function is called with the shader source code
	 * as a parameter. Useful for the modification of built-in materials.
	 *
	 * This method can only be used when rendering with {@link WebGLRenderer}. The
	 * recommended approach when customizing materials is to use `WebGPURenderer` with the new
	 * Node Material system and [TSL]{@link https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language}.
	 *
	 * @param {{vertexShader:string,fragmentShader:string,uniforms:Object}} shaderobject - The object holds the uniforms and the vertex and fragment shader source.
	 * @param {WebGLRenderer} renderer - A reference to the renderer.
	 */
	onBeforeCompile( /* shaderobject, renderer */ ) {}

	/**
	 * In case {@link Material#onBeforeCompile} is used, this callback can be used to identify
	 * values of settings used in `onBeforeCompile()`, so three.js can reuse a cached
	 * shader or recompile the shader for this material as needed.
	 *
	 * This method can only be used when rendering with {@link WebGLRenderer}.
	 *
	 * @return {string} The custom program cache key.
	 */
	customProgramCacheKey() {

		return this.onBeforeCompile.toString();

	}

	/**
	 * This method can be used to set default values from parameter objects.
	 * It is a generic implementation so it can be used with different types
	 * of materials.
	 *
	 * @param {Object} [values] - The material values to set.
	 */
	setValues( values ) {

		if ( values === undefined ) return;

		for ( const key in values ) {

			const newValue = values[ key ];

			if ( newValue === undefined ) {

				console.warn( `THREE.Material: parameter '${ key }' has value of undefined.` );
				continue;

			}

			const currentValue = this[ key ];

			if ( currentValue === undefined ) {

				console.warn( `THREE.Material: '${ key }' is not a property of THREE.${ this.type }.` );
				continue;

			}

			if ( currentValue && currentValue.isColor ) {

				currentValue.set( newValue );

			} else if ( ( currentValue && currentValue.isVector3 ) && ( newValue && newValue.isVector3 ) ) {

				currentValue.copy( newValue );

			} else {

				this[ key ] = newValue;

			}

		}

	}

	/**
	 * Serializes the material into JSON.
	 *
	 * @param {?(Object|string)} meta - An optional value holding meta information about the serialization.
	 * @return {Object} A JSON object representing the serialized material.
	 * @see {@link ObjectLoader#parse}
	 */
	toJSON( meta ) {

		const isRootObject = ( meta === undefined || typeof meta === 'string' );

		if ( isRootObject ) {

			meta = {
				textures: {},
				images: {}
			};

		}

		const data = {
			metadata: {
				version: 4.6,
				type: 'Material',
				generator: 'Material.toJSON'
			}
		};

		// standard Material serialization
		data.uuid = this.uuid;
		data.type = this.type;

		if ( this.name !== '' ) data.name = this.name;

		if ( this.color && this.color.isColor ) data.color = this.color.getHex();

		if ( this.roughness !== undefined ) data.roughness = this.roughness;
		if ( this.metalness !== undefined ) data.metalness = this.metalness;

		if ( this.sheen !== undefined ) data.sheen = this.sheen;
		if ( this.sheenColor && this.sheenColor.isColor ) data.sheenColor = this.sheenColor.getHex();
		if ( this.sheenRoughness !== undefined ) data.sheenRoughness = this.sheenRoughness;
		if ( this.emissive && this.emissive.isColor ) data.emissive = this.emissive.getHex();
		if ( this.emissiveIntensity !== undefined && this.emissiveIntensity !== 1 ) data.emissiveIntensity = this.emissiveIntensity;

		if ( this.specular && this.specular.isColor ) data.specular = this.specular.getHex();
		if ( this.specularIntensity !== undefined ) data.specularIntensity = this.specularIntensity;
		if ( this.specularColor && this.specularColor.isColor ) data.specularColor = this.specularColor.getHex();
		if ( this.shininess !== undefined ) data.shininess = this.shininess;
		if ( this.clearcoat !== undefined ) data.clearcoat = this.clearcoat;
		if ( this.clearcoatRoughness !== undefined ) data.clearcoatRoughness = this.clearcoatRoughness;

		if ( this.clearcoatMap && this.clearcoatMap.isTexture ) {

			data.clearcoatMap = this.clearcoatMap.toJSON( meta ).uuid;

		}

		if ( this.clearcoatRoughnessMap && this.clearcoatRoughnessMap.isTexture ) {

			data.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON( meta ).uuid;

		}

		if ( this.clearcoatNormalMap && this.clearcoatNormalMap.isTexture ) {

			data.clearcoatNormalMap = this.clearcoatNormalMap.toJSON( meta ).uuid;
			data.clearcoatNormalScale = this.clearcoatNormalScale.toArray();

		}

		if ( this.dispersion !== undefined ) data.dispersion = this.dispersion;

		if ( this.iridescence !== undefined ) data.iridescence = this.iridescence;
		if ( this.iridescenceIOR !== undefined ) data.iridescenceIOR = this.iridescenceIOR;
		if ( this.iridescenceThicknessRange !== undefined ) data.iridescenceThicknessRange = this.iridescenceThicknessRange;

		if ( this.iridescenceMap && this.iridescenceMap.isTexture ) {

			data.iridescenceMap = this.iridescenceMap.toJSON( meta ).uuid;

		}

		if ( this.iridescenceThicknessMap && this.iridescenceThicknessMap.isTexture ) {

			data.iridescenceThicknessMap = this.iridescenceThicknessMap.toJSON( meta ).uuid;

		}

		if ( this.anisotropy !== undefined ) data.anisotropy = this.anisotropy;
		if ( this.anisotropyRotation !== undefined ) data.anisotropyRotation = this.anisotropyRotation;

		if ( this.anisotropyMap && this.anisotropyMap.isTexture ) {

			data.anisotropyMap = this.anisotropyMap.toJSON( meta ).uuid;

		}

		if ( this.map && this.map.isTexture ) data.map = this.map.toJSON( meta ).uuid;
		if ( this.matcap && this.matcap.isTexture ) data.matcap = this.matcap.toJSON( meta ).uuid;
		if ( this.alphaMap && this.alphaMap.isTexture ) data.alphaMap = this.alphaMap.toJSON( meta ).uuid;

		if ( this.lightMap && this.lightMap.isTexture ) {

			data.lightMap = this.lightMap.toJSON( meta ).uuid;
			data.lightMapIntensity = this.lightMapIntensity;

		}

		if ( this.aoMap && this.aoMap.isTexture ) {

			data.aoMap = this.aoMap.toJSON( meta ).uuid;
			data.aoMapIntensity = this.aoMapIntensity;

		}

		if ( this.bumpMap && this.bumpMap.isTexture ) {

			data.bumpMap = this.bumpMap.toJSON( meta ).uuid;
			data.bumpScale = this.bumpScale;

		}

		if ( this.normalMap && this.normalMap.isTexture ) {

			data.normalMap = this.normalMap.toJSON( meta ).uuid;
			data.normalMapType = this.normalMapType;
			data.normalScale = this.normalScale.toArray();

		}

		if ( this.displacementMap && this.displacementMap.isTexture ) {

			data.displacementMap = this.displacementMap.toJSON( meta ).uuid;
			data.displacementScale = this.displacementScale;
			data.displacementBias = this.displacementBias;

		}

		if ( this.roughnessMap && this.roughnessMap.isTexture ) data.roughnessMap = this.roughnessMap.toJSON( meta ).uuid;
		if ( this.metalnessMap && this.metalnessMap.isTexture ) data.metalnessMap = this.metalnessMap.toJSON( meta ).uuid;

		if ( this.emissiveMap && this.emissiveMap.isTexture ) data.emissiveMap = this.emissiveMap.toJSON( meta ).uuid;
		if ( this.specularMap && this.specularMap.isTexture ) data.specularMap = this.specularMap.toJSON( meta ).uuid;
		if ( this.specularIntensityMap && this.specularIntensityMap.isTexture ) data.specularIntensityMap = this.specularIntensityMap.toJSON( meta ).uuid;
		if ( this.specularColorMap && this.specularColorMap.isTexture ) data.specularColorMap = this.specularColorMap.toJSON( meta ).uuid;

		if ( this.envMap && this.envMap.isTexture ) {

			data.envMap = this.envMap.toJSON( meta ).uuid;

			if ( this.combine !== undefined ) data.combine = this.combine;

		}

		if ( this.envMapRotation !== undefined ) data.envMapRotation = this.envMapRotation.toArray();
		if ( this.envMapIntensity !== undefined ) data.envMapIntensity = this.envMapIntensity;
		if ( this.reflectivity !== undefined ) data.reflectivity = this.reflectivity;
		if ( this.refractionRatio !== undefined ) data.refractionRatio = this.refractionRatio;

		if ( this.gradientMap && this.gradientMap.isTexture ) {

			data.gradientMap = this.gradientMap.toJSON( meta ).uuid;

		}

		if ( this.transmission !== undefined ) data.transmission = this.transmission;
		if ( this.transmissionMap && this.transmissionMap.isTexture ) data.transmissionMap = this.transmissionMap.toJSON( meta ).uuid;
		if ( this.thickness !== undefined ) data.thickness = this.thickness;
		if ( this.thicknessMap && this.thicknessMap.isTexture ) data.thicknessMap = this.thicknessMap.toJSON( meta ).uuid;
		if ( this.attenuationDistance !== undefined && this.attenuationDistance !== Infinity ) data.attenuationDistance = this.attenuationDistance;
		if ( this.attenuationColor !== undefined ) data.attenuationColor = this.attenuationColor.getHex();

		if ( this.size !== undefined ) data.size = this.size;
		if ( this.shadowSide !== null ) data.shadowSide = this.shadowSide;
		if ( this.sizeAttenuation !== undefined ) data.sizeAttenuation = this.sizeAttenuation;

		if ( this.blending !== NormalBlending ) data.blending = this.blending;
		if ( this.side !== FrontSide ) data.side = this.side;
		if ( this.vertexColors === true ) data.vertexColors = true;

		if ( this.opacity < 1 ) data.opacity = this.opacity;
		if ( this.transparent === true ) data.transparent = true;

		if ( this.blendSrc !== SrcAlphaFactor ) data.blendSrc = this.blendSrc;
		if ( this.blendDst !== OneMinusSrcAlphaFactor ) data.blendDst = this.blendDst;
		if ( this.blendEquation !== AddEquation ) data.blendEquation = this.blendEquation;
		if ( this.blendSrcAlpha !== null ) data.blendSrcAlpha = this.blendSrcAlpha;
		if ( this.blendDstAlpha !== null ) data.blendDstAlpha = this.blendDstAlpha;
		if ( this.blendEquationAlpha !== null ) data.blendEquationAlpha = this.blendEquationAlpha;
		if ( this.blendColor && this.blendColor.isColor ) data.blendColor = this.blendColor.getHex();
		if ( this.blendAlpha !== 0 ) data.blendAlpha = this.blendAlpha;

		if ( this.depthFunc !== LessEqualDepth ) data.depthFunc = this.depthFunc;
		if ( this.depthTest === false ) data.depthTest = this.depthTest;
		if ( this.depthWrite === false ) data.depthWrite = this.depthWrite;
		if ( this.colorWrite === false ) data.colorWrite = this.colorWrite;

		if ( this.stencilWriteMask !== 0xff ) data.stencilWriteMask = this.stencilWriteMask;
		if ( this.stencilFunc !== AlwaysStencilFunc ) data.stencilFunc = this.stencilFunc;
		if ( this.stencilRef !== 0 ) data.stencilRef = this.stencilRef;
		if ( this.stencilFuncMask !== 0xff ) data.stencilFuncMask = this.stencilFuncMask;
		if ( this.stencilFail !== KeepStencilOp ) data.stencilFail = this.stencilFail;
		if ( this.stencilZFail !== KeepStencilOp ) data.stencilZFail = this.stencilZFail;
		if ( this.stencilZPass !== KeepStencilOp ) data.stencilZPass = this.stencilZPass;
		if ( this.stencilWrite === true ) data.stencilWrite = this.stencilWrite;

		// rotation (SpriteMaterial)
		if ( this.rotation !== undefined && this.rotation !== 0 ) data.rotation = this.rotation;

		if ( this.polygonOffset === true ) data.polygonOffset = true;
		if ( this.polygonOffsetFactor !== 0 ) data.polygonOffsetFactor = this.polygonOffsetFactor;
		if ( this.polygonOffsetUnits !== 0 ) data.polygonOffsetUnits = this.polygonOffsetUnits;

		if ( this.linewidth !== undefined && this.linewidth !== 1 ) data.linewidth = this.linewidth;
		if ( this.dashSize !== undefined ) data.dashSize = this.dashSize;
		if ( this.gapSize !== undefined ) data.gapSize = this.gapSize;
		if ( this.scale !== undefined ) data.scale = this.scale;

		if ( this.dithering === true ) data.dithering = true;

		if ( this.alphaTest > 0 ) data.alphaTest = this.alphaTest;
		if ( this.alphaHash === true ) data.alphaHash = true;
		if ( this.alphaToCoverage === true ) data.alphaToCoverage = true;
		if ( this.premultipliedAlpha === true ) data.premultipliedAlpha = true;
		if ( this.forceSinglePass === true ) data.forceSinglePass = true;

		if ( this.wireframe === true ) data.wireframe = true;
		if ( this.wireframeLinewidth > 1 ) data.wireframeLinewidth = this.wireframeLinewidth;
		if ( this.wireframeLinecap !== 'round' ) data.wireframeLinecap = this.wireframeLinecap;
		if ( this.wireframeLinejoin !== 'round' ) data.wireframeLinejoin = this.wireframeLinejoin;

		if ( this.flatShading === true ) data.flatShading = true;

		if ( this.visible === false ) data.visible = false;

		if ( this.toneMapped === false ) data.toneMapped = false;

		if ( this.fog === false ) data.fog = false;

		if ( Object.keys( this.userData ).length > 0 ) data.userData = this.userData;

		// TODO: Copied from Object3D.toJSON

		function extractFromCache( cache ) {

			const values = [];

			for ( const key in cache ) {

				const data = cache[ key ];
				delete data.metadata;
				values.push( data );

			}

			return values;

		}

		if ( isRootObject ) {

			const textures = extractFromCache( meta.textures );
			const images = extractFromCache( meta.images );

			if ( textures.length > 0 ) data.textures = textures;
			if ( images.length > 0 ) data.images = images;

		}

		return data;

	}

	/**
	 * Returns a new material with copied values from this instance.
	 *
	 * @return {Material} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

	/**
	 * Copies the values of the given material to this instance.
	 *
	 * @param {Material} source - The material to copy.
	 * @return {Material} A reference to this instance.
	 */
	copy( source ) {

		this.name = source.name;

		this.blending = source.blending;
		this.side = source.side;
		this.vertexColors = source.vertexColors;

		this.opacity = source.opacity;
		this.transparent = source.transparent;

		this.blendSrc = source.blendSrc;
		this.blendDst = source.blendDst;
		this.blendEquation = source.blendEquation;
		this.blendSrcAlpha = source.blendSrcAlpha;
		this.blendDstAlpha = source.blendDstAlpha;
		this.blendEquationAlpha = source.blendEquationAlpha;
		this.blendColor.copy( source.blendColor );
		this.blendAlpha = source.blendAlpha;

		this.depthFunc = source.depthFunc;
		this.depthTest = source.depthTest;
		this.depthWrite = source.depthWrite;

		this.stencilWriteMask = source.stencilWriteMask;
		this.stencilFunc = source.stencilFunc;
		this.stencilRef = source.stencilRef;
		this.stencilFuncMask = source.stencilFuncMask;
		this.stencilFail = source.stencilFail;
		this.stencilZFail = source.stencilZFail;
		this.stencilZPass = source.stencilZPass;
		this.stencilWrite = source.stencilWrite;

		const srcPlanes = source.clippingPlanes;
		let dstPlanes = null;

		if ( srcPlanes !== null ) {

			const n = srcPlanes.length;
			dstPlanes = new Array( n );

			for ( let i = 0; i !== n; ++ i ) {

				dstPlanes[ i ] = srcPlanes[ i ].clone();

			}

		}

		this.clippingPlanes = dstPlanes;
		this.clipIntersection = source.clipIntersection;
		this.clipShadows = source.clipShadows;

		this.shadowSide = source.shadowSide;

		this.colorWrite = source.colorWrite;

		this.precision = source.precision;

		this.polygonOffset = source.polygonOffset;
		this.polygonOffsetFactor = source.polygonOffsetFactor;
		this.polygonOffsetUnits = source.polygonOffsetUnits;

		this.dithering = source.dithering;

		this.alphaTest = source.alphaTest;
		this.alphaHash = source.alphaHash;
		this.alphaToCoverage = source.alphaToCoverage;
		this.premultipliedAlpha = source.premultipliedAlpha;
		this.forceSinglePass = source.forceSinglePass;

		this.visible = source.visible;

		this.toneMapped = source.toneMapped;

		this.userData = JSON.parse( JSON.stringify( source.userData ) );

		return this;

	}

	/**
	 * Frees the GPU-related resources allocated by this instance. Call this
	 * method whenever this instance is no longer used in your app.
	 *
	 * @fires Material#dispose
	 */
	dispose() {

		/**
		 * Fires when the material has been disposed of.
		 *
		 * @event Material#dispose
		 * @type {Object}
		 */
		this.dispatchEvent( { type: 'dispose' } );

	}

	/**
	 * Setting this property to `true` indicates the engine the material
	 * needs to be recompiled.
	 *
	 * @type {boolean}
	 * @default false
	 * @param {boolean} value
	 */
	set needsUpdate( value ) {

		if ( value === true ) this.version ++;

	}

	onBuild( /* shaderobject, renderer */ ) {

		console.warn( 'Material: onBuild() has been removed.' ); // @deprecated, r166

	}

}

/**
 * A material for drawing geometries in a simple shaded (flat or wireframe) way.
 *
 * This material is not affected by lights.
 *
 * @augments Material
 */
class MeshBasicMaterial extends Material {

	/**
	 * Constructs a new mesh basic material.
	 *
	 * @param {Object} [parameters] - An object with one or more properties
	 * defining the material's appearance. Any property of the material
	 * (including any property from inherited materials) can be passed
	 * in here. Color values can be passed any type of value accepted
	 * by {@link Color#set}.
	 */
	constructor( parameters ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isMeshBasicMaterial = true;

		this.type = 'MeshBasicMaterial';

		/**
		 * Color of the material.
		 *
		 * @type {Color}
		 * @default (1,1,1)
		 */
		this.color = new Color( 0xffffff ); // emissive

		/**
		 * The color map. May optionally include an alpha channel, typically combined
		 * with {@link Material#transparent} or {@link Material#alphaTest}. The texture map
		 * color is modulated by the diffuse `color`.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.map = null;

		/**
		 * The light map. Requires a second set of UVs.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.lightMap = null;

		/**
		 * Intensity of the baked light.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.lightMapIntensity = 1.0;

		/**
		 * The red channel of this texture is used as the ambient occlusion map.
		 * Requires a second set of UVs.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.aoMap = null;

		/**
		 * Intensity of the ambient occlusion effect. Range is `[0,1]`, where `0`
		 * disables ambient occlusion. Where intensity is `1` and the AO map's
		 * red channel is also `1`, ambient light is fully occluded on a surface.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.aoMapIntensity = 1.0;

		/**
		 * Specular map used by the material.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.specularMap = null;

		/**
		 * The alpha map is a grayscale texture that controls the opacity across the
		 * surface (black: fully transparent; white: fully opaque).
		 *
		 * Only the color of the texture is used, ignoring the alpha channel if one
		 * exists. For RGB and RGBA textures, the renderer will use the green channel
		 * when sampling this texture due to the extra bit of precision provided for
		 * green in DXT-compressed and uncompressed RGB 565 formats. Luminance-only and
		 * luminance/alpha textures will also still work as expected.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.alphaMap = null;

		/**
		 * The environment map.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.envMap = null;

		/**
		 * The rotation of the environment map in radians.
		 *
		 * @type {Euler}
		 * @default (0,0,0)
		 */
		this.envMapRotation = new Euler();

		/**
		 * How to combine the result of the surface's color with the environment map, if any.
		 *
		 * When set to `MixOperation`, the {@link MeshBasicMaterial#reflectivity} is used to
		 * blend between the two colors.
		 *
		 * @type {(MultiplyOperation|MixOperation|AddOperation)}
		 * @default MultiplyOperation
		 */
		this.combine = MultiplyOperation;

		/**
		 * How much the environment map affects the surface.
		 * The valid range is between `0` (no reflections) and `1` (full reflections).
		 *
		 * @type {number}
		 * @default 1
		 */
		this.reflectivity = 1;

		/**
		 * The index of refraction (IOR) of air (approximately 1) divided by the
		 * index of refraction of the material. It is used with environment mapping
		 * modes {@link CubeRefractionMapping} and {@link EquirectangularRefractionMapping}.
		 * The refraction ratio should not exceed `1`.
		 *
		 * @type {number}
		 * @default 0.98
		 */
		this.refractionRatio = 0.98;

		/**
		 * Renders the geometry as a wireframe.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.wireframe = false;

		/**
		 * Controls the thickness of the wireframe.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.wireframeLinewidth = 1;

		/**
		 * Defines appearance of wireframe ends.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {('round'|'bevel'|'miter')}
		 * @default 'round'
		 */
		this.wireframeLinecap = 'round';

		/**
		 * Defines appearance of wireframe joints.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {('round'|'bevel'|'miter')}
		 * @default 'round'
		 */
		this.wireframeLinejoin = 'round';

		/**
		 * Whether the material is affected by fog or not.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.fog = true;

		this.setValues( parameters );

	}

	copy( source ) {

		super.copy( source );

		this.color.copy( source.color );

		this.map = source.map;

		this.lightMap = source.lightMap;
		this.lightMapIntensity = source.lightMapIntensity;

		this.aoMap = source.aoMap;
		this.aoMapIntensity = source.aoMapIntensity;

		this.specularMap = source.specularMap;

		this.alphaMap = source.alphaMap;

		this.envMap = source.envMap;
		this.envMapRotation.copy( source.envMapRotation );
		this.combine = source.combine;
		this.reflectivity = source.reflectivity;
		this.refractionRatio = source.refractionRatio;

		this.wireframe = source.wireframe;
		this.wireframeLinewidth = source.wireframeLinewidth;
		this.wireframeLinecap = source.wireframeLinecap;
		this.wireframeLinejoin = source.wireframeLinejoin;

		this.fog = source.fog;

		return this;

	}

}

const _vector$9 = /*@__PURE__*/ new Vector3();
const _vector2$1 = /*@__PURE__*/ new Vector2();

let _id$2 = 0;

/**
 * This class stores data for an attribute (such as vertex positions, face
 * indices, normals, colors, UVs, and any custom attributes ) associated with
 * a geometry, which allows for more efficient passing of data to the GPU.
 *
 * When working with vector-like data, the `fromBufferAttribute( attribute, index )`
 * helper methods on vector and color class might be helpful. E.g. {@link Vector3#fromBufferAttribute}.
 */
class BufferAttribute {

	/**
	 * Constructs a new buffer attribute.
	 *
	 * @param {TypedArray} array - The array holding the attribute data.
	 * @param {number} itemSize - The item size.
	 * @param {boolean} [normalized=false] - Whether the data are normalized or not.
	 */
	constructor( array, itemSize, normalized = false ) {

		if ( Array.isArray( array ) ) {

			throw new TypeError( 'THREE.BufferAttribute: array should be a Typed Array.' );

		}

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isBufferAttribute = true;

		/**
		 * The ID of the buffer attribute.
		 *
		 * @name BufferAttribute#id
		 * @type {number}
		 * @readonly
		 */
		Object.defineProperty( this, 'id', { value: _id$2 ++ } );

		/**
		 * The name of the buffer attribute.
		 *
		 * @type {string}
		 */
		this.name = '';

		/**
		 * The array holding the attribute data. It should have `itemSize * numVertices`
		 * elements, where `numVertices` is the number of vertices in the associated geometry.
		 *
		 * @type {TypedArray}
		 */
		this.array = array;

		/**
		 * The number of values of the array that should be associated with a particular vertex.
		 * For instance, if this attribute is storing a 3-component vector (such as a position,
		 * normal, or color), then the value should be `3`.
		 *
		 * @type {number}
		 */
		this.itemSize = itemSize;

		/**
		 * Represents the number of items this buffer attribute stores. It is internally computed
		 * by dividing the `array` length by the `itemSize`.
		 *
		 * @type {number}
		 * @readonly
		 */
		this.count = array !== undefined ? array.length / itemSize : 0;

		/**
		 * Applies to integer data only. Indicates how the underlying data in the buffer maps to
		 * the values in the GLSL code. For instance, if `array` is an instance of `UInt16Array`,
		 * and `normalized` is `true`, the values `0 -+65535` in the array data will be mapped to
		 * `0.0f - +1.0f` in the GLSL attribute. If `normalized` is `false`, the values will be converted
		 * to floats unmodified, i.e. `65535` becomes `65535.0f`.
		 *
		 * @type {boolean}
		 */
		this.normalized = normalized;

		/**
		 * Defines the intended usage pattern of the data store for optimization purposes.
		 *
		 * Note: After the initial use of a buffer, its usage cannot be changed. Instead,
		 * instantiate a new one and set the desired usage before the next render.
		 *
		 * @type {(StaticDrawUsage|DynamicDrawUsage|StreamDrawUsage|StaticReadUsage|DynamicReadUsage|StreamReadUsage|StaticCopyUsage|DynamicCopyUsage|StreamCopyUsage)}
		 * @default StaticDrawUsage
		 */
		this.usage = StaticDrawUsage;

		/**
		 * This can be used to only update some components of stored vectors (for example, just the
		 * component related to color). Use the `addUpdateRange()` function to add ranges to this array.
		 *
		 * @type {Array<Object>}
		 */
		this.updateRanges = [];

		/**
		 * Configures the bound GPU type for use in shaders.
		 *
		 * Note: this only has an effect for integer arrays and is not configurable for float arrays.
		 * For lower precision float types, use `Float16BufferAttribute`.
		 *
		 * @type {(FloatType|IntType)}
		 * @default FloatType
		 */
		this.gpuType = FloatType;

		/**
		 * A version number, incremented every time the `needsUpdate` is set to `true`.
		 *
		 * @type {number}
		 */
		this.version = 0;

	}

	/**
	 * A callback function that is executed after the renderer has transferred the attribute
	 * array data to the GPU.
	 */
	onUploadCallback() {}

	/**
	 * Flag to indicate that this attribute has changed and should be re-sent to
	 * the GPU. Set this to `true` when you modify the value of the array.
	 *
	 * @type {number}
	 * @default false
	 * @param {boolean} value
	 */
	set needsUpdate( value ) {

		if ( value === true ) this.version ++;

	}

	/**
	 * Sets the usage of this buffer attribute.
	 *
	 * @param {(StaticDrawUsage|DynamicDrawUsage|StreamDrawUsage|StaticReadUsage|DynamicReadUsage|StreamReadUsage|StaticCopyUsage|DynamicCopyUsage|StreamCopyUsage)} value - The usage to set.
	 * @return {BufferAttribute} A reference to this buffer attribute.
	 */
	setUsage( value ) {

		this.usage = value;

		return this;

	}

	/**
	 * Adds a range of data in the data array to be updated on the GPU.
	 *
	 * @param {number} start - Position at which to start update.
	 * @param {number} count - The number of components to update.
	 */
	addUpdateRange( start, count ) {

		this.updateRanges.push( { start, count } );

	}

	/**
	 * Clears the update ranges.
	 */
	clearUpdateRanges() {

		this.updateRanges.length = 0;

	}

	/**
	 * Copies the values of the given buffer attribute to this instance.
	 *
	 * @param {BufferAttribute} source - The buffer attribute to copy.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	copy( source ) {

		this.name = source.name;
		this.array = new source.array.constructor( source.array );
		this.itemSize = source.itemSize;
		this.count = source.count;
		this.normalized = source.normalized;

		this.usage = source.usage;
		this.gpuType = source.gpuType;

		return this;

	}

	/**
	 * Copies a vector from the given buffer attribute to this one. The start
	 * and destination position in the attribute buffers are represented by the
	 * given indices.
	 *
	 * @param {number} index1 - The destination index into this buffer attribute.
	 * @param {BufferAttribute} attribute - The buffer attribute to copy from.
	 * @param {number} index2 - The source index into the given buffer attribute.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	copyAt( index1, attribute, index2 ) {

		index1 *= this.itemSize;
		index2 *= attribute.itemSize;

		for ( let i = 0, l = this.itemSize; i < l; i ++ ) {

			this.array[ index1 + i ] = attribute.array[ index2 + i ];

		}

		return this;

	}

	/**
	 * Copies the given array data into this buffer attribute.
	 *
	 * @param {(TypedArray|Array)} array - The array to copy.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	copyArray( array ) {

		this.array.set( array );

		return this;

	}

	/**
	 * Applies the given 3x3 matrix to the given attribute. Works with
	 * item size `2` and `3`.
	 *
	 * @param {Matrix3} m - The matrix to apply.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	applyMatrix3( m ) {

		if ( this.itemSize === 2 ) {

			for ( let i = 0, l = this.count; i < l; i ++ ) {

				_vector2$1.fromBufferAttribute( this, i );
				_vector2$1.applyMatrix3( m );

				this.setXY( i, _vector2$1.x, _vector2$1.y );

			}

		} else if ( this.itemSize === 3 ) {

			for ( let i = 0, l = this.count; i < l; i ++ ) {

				_vector$9.fromBufferAttribute( this, i );
				_vector$9.applyMatrix3( m );

				this.setXYZ( i, _vector$9.x, _vector$9.y, _vector$9.z );

			}

		}

		return this;

	}

	/**
	 * Applies the given 4x4 matrix to the given attribute. Only works with
	 * item size `3`.
	 *
	 * @param {Matrix4} m - The matrix to apply.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	applyMatrix4( m ) {

		for ( let i = 0, l = this.count; i < l; i ++ ) {

			_vector$9.fromBufferAttribute( this, i );

			_vector$9.applyMatrix4( m );

			this.setXYZ( i, _vector$9.x, _vector$9.y, _vector$9.z );

		}

		return this;

	}

	/**
	 * Applies the given 3x3 normal matrix to the given attribute. Only works with
	 * item size `3`.
	 *
	 * @param {Matrix3} m - The normal matrix to apply.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	applyNormalMatrix( m ) {

		for ( let i = 0, l = this.count; i < l; i ++ ) {

			_vector$9.fromBufferAttribute( this, i );

			_vector$9.applyNormalMatrix( m );

			this.setXYZ( i, _vector$9.x, _vector$9.y, _vector$9.z );

		}

		return this;

	}

	/**
	 * Applies the given 4x4 matrix to the given attribute. Only works with
	 * item size `3` and with direction vectors.
	 *
	 * @param {Matrix4} m - The matrix to apply.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	transformDirection( m ) {

		for ( let i = 0, l = this.count; i < l; i ++ ) {

			_vector$9.fromBufferAttribute( this, i );

			_vector$9.transformDirection( m );

			this.setXYZ( i, _vector$9.x, _vector$9.y, _vector$9.z );

		}

		return this;

	}

	/**
	 * Sets the given array data in the buffer attribute.
	 *
	 * @param {(TypedArray|Array)} value - The array data to set.
	 * @param {number} [offset=0] - The offset in this buffer attribute's array.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	set( value, offset = 0 ) {

		// Matching BufferAttribute constructor, do not normalize the array.
		this.array.set( value, offset );

		return this;

	}

	/**
	 * Returns the given component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} component - The component index.
	 * @return {number} The returned value.
	 */
	getComponent( index, component ) {

		let value = this.array[ index * this.itemSize + component ];

		if ( this.normalized ) value = denormalize( value, this.array );

		return value;

	}

	/**
	 * Sets the given value to the given component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} component - The component index.
	 * @param {number} value - The value to set.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	setComponent( index, component, value ) {

		if ( this.normalized ) value = normalize( value, this.array );

		this.array[ index * this.itemSize + component ] = value;

		return this;

	}

	/**
	 * Returns the x component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @return {number} The x component.
	 */
	getX( index ) {

		let x = this.array[ index * this.itemSize ];

		if ( this.normalized ) x = denormalize( x, this.array );

		return x;

	}

	/**
	 * Sets the x component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} x - The value to set.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	setX( index, x ) {

		if ( this.normalized ) x = normalize( x, this.array );

		this.array[ index * this.itemSize ] = x;

		return this;

	}

	/**
	 * Returns the y component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @return {number} The y component.
	 */
	getY( index ) {

		let y = this.array[ index * this.itemSize + 1 ];

		if ( this.normalized ) y = denormalize( y, this.array );

		return y;

	}

	/**
	 * Sets the y component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} y - The value to set.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	setY( index, y ) {

		if ( this.normalized ) y = normalize( y, this.array );

		this.array[ index * this.itemSize + 1 ] = y;

		return this;

	}

	/**
	 * Returns the z component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @return {number} The z component.
	 */
	getZ( index ) {

		let z = this.array[ index * this.itemSize + 2 ];

		if ( this.normalized ) z = denormalize( z, this.array );

		return z;

	}

	/**
	 * Sets the z component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} z - The value to set.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	setZ( index, z ) {

		if ( this.normalized ) z = normalize( z, this.array );

		this.array[ index * this.itemSize + 2 ] = z;

		return this;

	}

	/**
	 * Returns the w component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @return {number} The w component.
	 */
	getW( index ) {

		let w = this.array[ index * this.itemSize + 3 ];

		if ( this.normalized ) w = denormalize( w, this.array );

		return w;

	}

	/**
	 * Sets the w component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} w - The value to set.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	setW( index, w ) {

		if ( this.normalized ) w = normalize( w, this.array );

		this.array[ index * this.itemSize + 3 ] = w;

		return this;

	}

	/**
	 * Sets the x and y component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} x - The value for the x component to set.
	 * @param {number} y - The value for the y component to set.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	setXY( index, x, y ) {

		index *= this.itemSize;

		if ( this.normalized ) {

			x = normalize( x, this.array );
			y = normalize( y, this.array );

		}

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;

		return this;

	}

	/**
	 * Sets the x, y and z component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} x - The value for the x component to set.
	 * @param {number} y - The value for the y component to set.
	 * @param {number} z - The value for the z component to set.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	setXYZ( index, x, y, z ) {

		index *= this.itemSize;

		if ( this.normalized ) {

			x = normalize( x, this.array );
			y = normalize( y, this.array );
			z = normalize( z, this.array );

		}

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;
		this.array[ index + 2 ] = z;

		return this;

	}

	/**
	 * Sets the x, y, z and w component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} x - The value for the x component to set.
	 * @param {number} y - The value for the y component to set.
	 * @param {number} z - The value for the z component to set.
	 * @param {number} w - The value for the w component to set.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	setXYZW( index, x, y, z, w ) {

		index *= this.itemSize;

		if ( this.normalized ) {

			x = normalize( x, this.array );
			y = normalize( y, this.array );
			z = normalize( z, this.array );
			w = normalize( w, this.array );

		}

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;
		this.array[ index + 2 ] = z;
		this.array[ index + 3 ] = w;

		return this;

	}

	/**
	 * Sets the given callback function that is executed after the Renderer has transferred
	 * the attribute array data to the GPU. Can be used to perform clean-up operations after
	 * the upload when attribute data are not needed anymore on the CPU side.
	 *
	 * @param {Function} callback - The `onUpload()` callback.
	 * @return {BufferAttribute} A reference to this instance.
	 */
	onUpload( callback ) {

		this.onUploadCallback = callback;

		return this;

	}

	/**
	 * Returns a new buffer attribute with copied values from this instance.
	 *
	 * @return {BufferAttribute} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this.array, this.itemSize ).copy( this );

	}

	/**
	 * Serializes the buffer attribute into JSON.
	 *
	 * @return {Object} A JSON object representing the serialized buffer attribute.
	 */
	toJSON() {

		const data = {
			itemSize: this.itemSize,
			type: this.array.constructor.name,
			array: Array.from( this.array ),
			normalized: this.normalized
		};

		if ( this.name !== '' ) data.name = this.name;
		if ( this.usage !== StaticDrawUsage ) data.usage = this.usage;

		return data;

	}

}

/**
 * Convenient class that can be used when creating a `UInt16` buffer attribute with
 * a plain `Array` instance.
 *
 * @augments BufferAttribute
 */
class Uint16BufferAttribute extends BufferAttribute {

	/**
	 * Constructs a new buffer attribute.
	 *
	 * @param {(Array<number>|Uint16Array)} array - The array holding the attribute data.
	 * @param {number} itemSize - The item size.
	 * @param {boolean} [normalized=false] - Whether the data are normalized or not.
	 */
	constructor( array, itemSize, normalized ) {

		super( new Uint16Array( array ), itemSize, normalized );

	}

}

/**
 * Convenient class that can be used when creating a `UInt32` buffer attribute with
 * a plain `Array` instance.
 *
 * @augments BufferAttribute
 */
class Uint32BufferAttribute extends BufferAttribute {

	/**
	 * Constructs a new buffer attribute.
	 *
	 * @param {(Array<number>|Uint32Array)} array - The array holding the attribute data.
	 * @param {number} itemSize - The item size.
	 * @param {boolean} [normalized=false] - Whether the data are normalized or not.
	 */
	constructor( array, itemSize, normalized ) {

		super( new Uint32Array( array ), itemSize, normalized );

	}

}

/**
 * Convenient class that can be used when creating a `Float32` buffer attribute with
 * a plain `Array` instance.
 *
 * @augments BufferAttribute
 */
class Float32BufferAttribute extends BufferAttribute {

	/**
	 * Constructs a new buffer attribute.
	 *
	 * @param {(Array<number>|Float32Array)} array - The array holding the attribute data.
	 * @param {number} itemSize - The item size.
	 * @param {boolean} [normalized=false] - Whether the data are normalized or not.
	 */
	constructor( array, itemSize, normalized ) {

		super( new Float32Array( array ), itemSize, normalized );

	}

}

let _id$1 = 0;

const _m1 = /*@__PURE__*/ new Matrix4();
const _obj = /*@__PURE__*/ new Object3D();
const _offset = /*@__PURE__*/ new Vector3();
const _box$2 = /*@__PURE__*/ new Box3();
const _boxMorphTargets = /*@__PURE__*/ new Box3();
const _vector$8 = /*@__PURE__*/ new Vector3();

/**
 * A representation of mesh, line, or point geometry. Includes vertex
 * positions, face indices, normals, colors, UVs, and custom attributes
 * within buffers, reducing the cost of passing all this data to the GPU.
 *
 * ```js
 * const geometry = new THREE.BufferGeometry();
 * // create a simple square shape. We duplicate the top left and bottom right
 * // vertices because each vertex needs to appear once per triangle.
 * const vertices = new Float32Array( [
 * 	-1.0, -1.0,  1.0, // v0
 * 	 1.0, -1.0,  1.0, // v1
 * 	 1.0,  1.0,  1.0, // v2
 *
 * 	 1.0,  1.0,  1.0, // v3
 * 	-1.0,  1.0,  1.0, // v4
 * 	-1.0, -1.0,  1.0  // v5
 * ] );
 * // itemSize = 3 because there are 3 values (components) per vertex
 * geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
 * const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
 * const mesh = new THREE.Mesh( geometry, material );
 * ```
 *
 * @augments EventDispatcher
 */
class BufferGeometry extends EventDispatcher {

	/**
	 * Constructs a new geometry.
	 */
	constructor() {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isBufferGeometry = true;

		/**
		 * The ID of the geometry.
		 *
		 * @name BufferGeometry#id
		 * @type {number}
		 * @readonly
		 */
		Object.defineProperty( this, 'id', { value: _id$1 ++ } );

		/**
		 * The UUID of the geometry.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.uuid = generateUUID();

		/**
		 * The name of the geometry.
		 *
		 * @type {string}
		 */
		this.name = '';
		this.type = 'BufferGeometry';

		/**
		 * Allows for vertices to be re-used across multiple triangles; this is
		 * called using "indexed triangles". Each triangle is associated with the
		 * indices of three vertices. This attribute therefore stores the index of
		 * each vertex for each triangular face. If this attribute is not set, the
		 * renderer assumes that each three contiguous positions represent a single triangle.
		 *
		 * @type {?BufferAttribute}
		 * @default null
		 */
		this.index = null;

		/**
		 * A (storage) buffer attribute which was generated with a compute shader and
		 * now defines indirect draw calls.
		 *
		 * Can only be used with {@link WebGPURenderer} and a WebGPU backend.
		 *
		 * @type {?BufferAttribute}
		 * @default null
		 */
		this.indirect = null;

		/**
		 * This dictionary has as id the name of the attribute to be set and as value
		 * the buffer attribute to set it to. Rather than accessing this property directly,
		 * use `setAttribute()` and `getAttribute()` to access attributes of this geometry.
		 *
		 * @type {Object<string,(BufferAttribute|InterleavedBufferAttribute)>}
		 */
		this.attributes = {};

		/**
		 * This dictionary holds the morph targets of the geometry.
		 *
		 * Note: Once the geometry has been rendered, the morph attribute data cannot
		 * be changed. You will have to call `dispose()?, and create a new geometry instance.
		 *
		 * @type {Object}
		 */
		this.morphAttributes = {};

		/**
		 * Used to control the morph target behavior; when set to `true`, the morph
		 * target data is treated as relative offsets, rather than as absolute
		 * positions/normals.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.morphTargetsRelative = false;

		/**
		 * Split the geometry into groups, each of which will be rendered in a
		 * separate draw call. This allows an array of materials to be used with the geometry.
		 *
		 * Use `addGroup()` and `clearGroups()` to edit groups, rather than modifying this array directly.
		 *
		 * Every vertex and index must belong to exactly one group — groups must not share vertices or
		 * indices, and must not leave vertices or indices unused.
		 *
		 * @type {Array<Object>}
		 */
		this.groups = [];

		/**
		 * Bounding box for the geometry which can be calculated with `computeBoundingBox()`.
		 *
		 * @type {Box3}
		 * @default null
		 */
		this.boundingBox = null;

		/**
		 * Bounding sphere for the geometry which can be calculated with `computeBoundingSphere()`.
		 *
		 * @type {Sphere}
		 * @default null
		 */
		this.boundingSphere = null;

		/**
		 * Determines the part of the geometry to render. This should not be set directly,
		 * instead use `setDrawRange()`.
		 *
		 * @type {{start:number,count:number}}
		 */
		this.drawRange = { start: 0, count: Infinity };

		/**
		 * An object that can be used to store custom data about the geometry.
		 * It should not hold references to functions as these will not be cloned.
		 *
		 * @type {Object}
		 */
		this.userData = {};

	}

	/**
	 * Returns the index of this geometry.
	 *
	 * @return {?BufferAttribute} The index. Returns `null` if no index is defined.
	 */
	getIndex() {

		return this.index;

	}

	/**
	 * Sets the given index to this geometry.
	 *
	 * @param {Array<number>|BufferAttribute} index - The index to set.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	setIndex( index ) {

		if ( Array.isArray( index ) ) {

			this.index = new ( arrayNeedsUint32( index ) ? Uint32BufferAttribute : Uint16BufferAttribute )( index, 1 );

		} else {

			this.index = index;

		}

		return this;

	}

	/**
	 * Sets the given indirect attribute to this geometry.
	 *
	 * @param {BufferAttribute} indirect - The attribute holding indirect draw calls.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	setIndirect( indirect ) {

		this.indirect = indirect;

		return this;

	}

	/**
	 * Returns the indirect attribute of this geometry.
	 *
	 * @return {?BufferAttribute} The indirect attribute. Returns `null` if no indirect attribute is defined.
	 */
	getIndirect() {

		return this.indirect;

	}

	/**
	 * Returns the buffer attribute for the given name.
	 *
	 * @param {string} name - The attribute name.
	 * @return {BufferAttribute|InterleavedBufferAttribute|undefined} The buffer attribute.
	 * Returns `undefined` if not attribute has been found.
	 */
	getAttribute( name ) {

		return this.attributes[ name ];

	}

	/**
	 * Sets the given attribute for the given name.
	 *
	 * @param {string} name - The attribute name.
	 * @param {BufferAttribute|InterleavedBufferAttribute} attribute - The attribute to set.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	setAttribute( name, attribute ) {

		this.attributes[ name ] = attribute;

		return this;

	}

	/**
	 * Deletes the attribute for the given name.
	 *
	 * @param {string} name - The attribute name to delete.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	deleteAttribute( name ) {

		delete this.attributes[ name ];

		return this;

	}

	/**
	 * Returns `true` if this geometry has an attribute for the given name.
	 *
	 * @param {string} name - The attribute name.
	 * @return {boolean} Whether this geometry has an attribute for the given name or not.
	 */
	hasAttribute( name ) {

		return this.attributes[ name ] !== undefined;

	}

	/**
	 * Adds a group to this geometry.
	 *
	 * @param {number} start - The first element in this draw call. That is the first
	 * vertex for non-indexed geometry, otherwise the first triangle index.
	 * @param {number} count - Specifies how many vertices (or indices) are part of this group.
	 * @param {number} [materialIndex=0] - The material array index to use.
	 */
	addGroup( start, count, materialIndex = 0 ) {

		this.groups.push( {

			start: start,
			count: count,
			materialIndex: materialIndex

		} );

	}

	/**
	 * Clears all groups.
	 */
	clearGroups() {

		this.groups = [];

	}

	/**
	 * Sets the draw range for this geometry.
	 *
	 * @param {number} start - The first vertex for non-indexed geometry, otherwise the first triangle index.
	 * @param {number} count - For non-indexed BufferGeometry, `count` is the number of vertices to render.
	 * For indexed BufferGeometry, `count` is the number of indices to render.
	 */
	setDrawRange( start, count ) {

		this.drawRange.start = start;
		this.drawRange.count = count;

	}

	/**
	 * Applies the given 4x4 transformation matrix to the geometry.
	 *
	 * @param {Matrix4} matrix - The matrix to apply.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	applyMatrix4( matrix ) {

		const position = this.attributes.position;

		if ( position !== undefined ) {

			position.applyMatrix4( matrix );

			position.needsUpdate = true;

		}

		const normal = this.attributes.normal;

		if ( normal !== undefined ) {

			const normalMatrix = new Matrix3().getNormalMatrix( matrix );

			normal.applyNormalMatrix( normalMatrix );

			normal.needsUpdate = true;

		}

		const tangent = this.attributes.tangent;

		if ( tangent !== undefined ) {

			tangent.transformDirection( matrix );

			tangent.needsUpdate = true;

		}

		if ( this.boundingBox !== null ) {

			this.computeBoundingBox();

		}

		if ( this.boundingSphere !== null ) {

			this.computeBoundingSphere();

		}

		return this;

	}

	/**
	 * Applies the rotation represented by the Quaternion to the geometry.
	 *
	 * @param {Quaternion} q - The Quaternion to apply.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	applyQuaternion( q ) {

		_m1.makeRotationFromQuaternion( q );

		this.applyMatrix4( _m1 );

		return this;

	}

	/**
	 * Rotates the geometry about the X axis. This is typically done as a one time
	 * operation, and not during a loop. Use {@link Object3D#rotation} for typical
	 * real-time mesh rotation.
	 *
	 * @param {number} angle - The angle in radians.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	rotateX( angle ) {

		// rotate geometry around world x-axis

		_m1.makeRotationX( angle );

		this.applyMatrix4( _m1 );

		return this;

	}

	/**
	 * Rotates the geometry about the Y axis. This is typically done as a one time
	 * operation, and not during a loop. Use {@link Object3D#rotation} for typical
	 * real-time mesh rotation.
	 *
	 * @param {number} angle - The angle in radians.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	rotateY( angle ) {

		// rotate geometry around world y-axis

		_m1.makeRotationY( angle );

		this.applyMatrix4( _m1 );

		return this;

	}

	/**
	 * Rotates the geometry about the Z axis. This is typically done as a one time
	 * operation, and not during a loop. Use {@link Object3D#rotation} for typical
	 * real-time mesh rotation.
	 *
	 * @param {number} angle - The angle in radians.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	rotateZ( angle ) {

		// rotate geometry around world z-axis

		_m1.makeRotationZ( angle );

		this.applyMatrix4( _m1 );

		return this;

	}

	/**
	 * Translates the geometry. This is typically done as a one time
	 * operation, and not during a loop. Use {@link Object3D#position} for typical
	 * real-time mesh rotation.
	 *
	 * @param {number} x - The x offset.
	 * @param {number} y - The y offset.
	 * @param {number} z - The z offset.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	translate( x, y, z ) {

		// translate geometry

		_m1.makeTranslation( x, y, z );

		this.applyMatrix4( _m1 );

		return this;

	}

	/**
	 * Scales the geometry. This is typically done as a one time
	 * operation, and not during a loop. Use {@link Object3D#scale} for typical
	 * real-time mesh rotation.
	 *
	 * @param {number} x - The x scale.
	 * @param {number} y - The y scale.
	 * @param {number} z - The z scale.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	scale( x, y, z ) {

		// scale geometry

		_m1.makeScale( x, y, z );

		this.applyMatrix4( _m1 );

		return this;

	}

	/**
	 * Rotates the geometry to face a point in 3D space. This is typically done as a one time
	 * operation, and not during a loop. Use {@link Object3D#lookAt} for typical
	 * real-time mesh rotation.
	 *
	 * @param {Vector3} vector - The target point.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	lookAt( vector ) {

		_obj.lookAt( vector );

		_obj.updateMatrix();

		this.applyMatrix4( _obj.matrix );

		return this;

	}

	/**
	 * Center the geometry based on its bounding box.
	 *
	 * @return {BufferGeometry} A reference to this instance.
	 */
	center() {

		this.computeBoundingBox();

		this.boundingBox.getCenter( _offset ).negate();

		this.translate( _offset.x, _offset.y, _offset.z );

		return this;

	}

	/**
	 * Defines a geometry by creating a `position` attribute based on the given array of points. The array
	 * can hold 2D or 3D vectors. When using two-dimensional data, the `z` coordinate for all vertices is
	 * set to `0`.
	 *
	 * If the method is used with an existing `position` attribute, the vertex data are overwritten with the
	 * data from the array. The length of the array must match the vertex count.
	 *
	 * @param {Array<Vector2>|Array<Vector3>} points - The points.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	setFromPoints( points ) {

		const positionAttribute = this.getAttribute( 'position' );

		if ( positionAttribute === undefined ) {

			const position = [];

			for ( let i = 0, l = points.length; i < l; i ++ ) {

				const point = points[ i ];
				position.push( point.x, point.y, point.z || 0 );

			}

			this.setAttribute( 'position', new Float32BufferAttribute( position, 3 ) );

		} else {

			const l = Math.min( points.length, positionAttribute.count ); // make sure data do not exceed buffer size

			for ( let i = 0; i < l; i ++ ) {

				const point = points[ i ];
				positionAttribute.setXYZ( i, point.x, point.y, point.z || 0 );

			}

			if ( points.length > positionAttribute.count ) {

				console.warn( 'THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.' );

			}

			positionAttribute.needsUpdate = true;

		}

		return this;

	}

	/**
	 * Computes the bounding box of the geometry, and updates the `boundingBox` member.
	 * The bounding box is not computed by the engine; it must be computed by your app.
	 * You may need to recompute the bounding box if the geometry vertices are modified.
	 */
	computeBoundingBox() {

		if ( this.boundingBox === null ) {

			this.boundingBox = new Box3();

		}

		const position = this.attributes.position;
		const morphAttributesPosition = this.morphAttributes.position;

		if ( position && position.isGLBufferAttribute ) {

			console.error( 'THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.', this );

			this.boundingBox.set(
				new Vector3( - Infinity, - Infinity, - Infinity ),
				new Vector3( + Infinity, + Infinity, + Infinity )
			);

			return;

		}

		if ( position !== undefined ) {

			this.boundingBox.setFromBufferAttribute( position );

			// process morph attributes if present

			if ( morphAttributesPosition ) {

				for ( let i = 0, il = morphAttributesPosition.length; i < il; i ++ ) {

					const morphAttribute = morphAttributesPosition[ i ];
					_box$2.setFromBufferAttribute( morphAttribute );

					if ( this.morphTargetsRelative ) {

						_vector$8.addVectors( this.boundingBox.min, _box$2.min );
						this.boundingBox.expandByPoint( _vector$8 );

						_vector$8.addVectors( this.boundingBox.max, _box$2.max );
						this.boundingBox.expandByPoint( _vector$8 );

					} else {

						this.boundingBox.expandByPoint( _box$2.min );
						this.boundingBox.expandByPoint( _box$2.max );

					}

				}

			}

		} else {

			this.boundingBox.makeEmpty();

		}

		if ( isNaN( this.boundingBox.min.x ) || isNaN( this.boundingBox.min.y ) || isNaN( this.boundingBox.min.z ) ) {

			console.error( 'THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.', this );

		}

	}

	/**
	 * Computes the bounding sphere of the geometry, and updates the `boundingSphere` member.
	 * The engine automatically computes the bounding sphere when it is needed, e.g., for ray casting or view frustum culling.
	 * You may need to recompute the bounding sphere if the geometry vertices are modified.
	 */
	computeBoundingSphere() {

		if ( this.boundingSphere === null ) {

			this.boundingSphere = new Sphere();

		}

		const position = this.attributes.position;
		const morphAttributesPosition = this.morphAttributes.position;

		if ( position && position.isGLBufferAttribute ) {

			console.error( 'THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.', this );

			this.boundingSphere.set( new Vector3(), Infinity );

			return;

		}

		if ( position ) {

			// first, find the center of the bounding sphere

			const center = this.boundingSphere.center;

			_box$2.setFromBufferAttribute( position );

			// process morph attributes if present

			if ( morphAttributesPosition ) {

				for ( let i = 0, il = morphAttributesPosition.length; i < il; i ++ ) {

					const morphAttribute = morphAttributesPosition[ i ];
					_boxMorphTargets.setFromBufferAttribute( morphAttribute );

					if ( this.morphTargetsRelative ) {

						_vector$8.addVectors( _box$2.min, _boxMorphTargets.min );
						_box$2.expandByPoint( _vector$8 );

						_vector$8.addVectors( _box$2.max, _boxMorphTargets.max );
						_box$2.expandByPoint( _vector$8 );

					} else {

						_box$2.expandByPoint( _boxMorphTargets.min );
						_box$2.expandByPoint( _boxMorphTargets.max );

					}

				}

			}

			_box$2.getCenter( center );

			// second, try to find a boundingSphere with a radius smaller than the
			// boundingSphere of the boundingBox: sqrt(3) smaller in the best case

			let maxRadiusSq = 0;

			for ( let i = 0, il = position.count; i < il; i ++ ) {

				_vector$8.fromBufferAttribute( position, i );

				maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( _vector$8 ) );

			}

			// process morph attributes if present

			if ( morphAttributesPosition ) {

				for ( let i = 0, il = morphAttributesPosition.length; i < il; i ++ ) {

					const morphAttribute = morphAttributesPosition[ i ];
					const morphTargetsRelative = this.morphTargetsRelative;

					for ( let j = 0, jl = morphAttribute.count; j < jl; j ++ ) {

						_vector$8.fromBufferAttribute( morphAttribute, j );

						if ( morphTargetsRelative ) {

							_offset.fromBufferAttribute( position, j );
							_vector$8.add( _offset );

						}

						maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( _vector$8 ) );

					}

				}

			}

			this.boundingSphere.radius = Math.sqrt( maxRadiusSq );

			if ( isNaN( this.boundingSphere.radius ) ) {

				console.error( 'THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.', this );

			}

		}

	}

	/**
	 * Calculates and adds a tangent attribute to this geometry.
	 *
	 * The computation is only supported for indexed geometries and if position, normal, and uv attributes
	 * are defined. When using a tangent space normal map, prefer the MikkTSpace algorithm provided by
	 * {@link BufferGeometryUtils#computeMikkTSpaceTangents} instead.
	 */
	computeTangents() {

		const index = this.index;
		const attributes = this.attributes;

		// based on http://www.terathon.com/code/tangent.html
		// (per vertex tangents)

		if ( index === null ||
			 attributes.position === undefined ||
			 attributes.normal === undefined ||
			 attributes.uv === undefined ) {

			console.error( 'THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)' );
			return;

		}

		const positionAttribute = attributes.position;
		const normalAttribute = attributes.normal;
		const uvAttribute = attributes.uv;

		if ( this.hasAttribute( 'tangent' ) === false ) {

			this.setAttribute( 'tangent', new BufferAttribute( new Float32Array( 4 * positionAttribute.count ), 4 ) );

		}

		const tangentAttribute = this.getAttribute( 'tangent' );

		const tan1 = [], tan2 = [];

		for ( let i = 0; i < positionAttribute.count; i ++ ) {

			tan1[ i ] = new Vector3();
			tan2[ i ] = new Vector3();

		}

		const vA = new Vector3(),
			vB = new Vector3(),
			vC = new Vector3(),

			uvA = new Vector2(),
			uvB = new Vector2(),
			uvC = new Vector2(),

			sdir = new Vector3(),
			tdir = new Vector3();

		function handleTriangle( a, b, c ) {

			vA.fromBufferAttribute( positionAttribute, a );
			vB.fromBufferAttribute( positionAttribute, b );
			vC.fromBufferAttribute( positionAttribute, c );

			uvA.fromBufferAttribute( uvAttribute, a );
			uvB.fromBufferAttribute( uvAttribute, b );
			uvC.fromBufferAttribute( uvAttribute, c );

			vB.sub( vA );
			vC.sub( vA );

			uvB.sub( uvA );
			uvC.sub( uvA );

			const r = 1.0 / ( uvB.x * uvC.y - uvC.x * uvB.y );

			// silently ignore degenerate uv triangles having coincident or colinear vertices

			if ( ! isFinite( r ) ) return;

			sdir.copy( vB ).multiplyScalar( uvC.y ).addScaledVector( vC, - uvB.y ).multiplyScalar( r );
			tdir.copy( vC ).multiplyScalar( uvB.x ).addScaledVector( vB, - uvC.x ).multiplyScalar( r );

			tan1[ a ].add( sdir );
			tan1[ b ].add( sdir );
			tan1[ c ].add( sdir );

			tan2[ a ].add( tdir );
			tan2[ b ].add( tdir );
			tan2[ c ].add( tdir );

		}

		let groups = this.groups;

		if ( groups.length === 0 ) {

			groups = [ {
				start: 0,
				count: index.count
			} ];

		}

		for ( let i = 0, il = groups.length; i < il; ++ i ) {

			const group = groups[ i ];

			const start = group.start;
			const count = group.count;

			for ( let j = start, jl = start + count; j < jl; j += 3 ) {

				handleTriangle(
					index.getX( j + 0 ),
					index.getX( j + 1 ),
					index.getX( j + 2 )
				);

			}

		}

		const tmp = new Vector3(), tmp2 = new Vector3();
		const n = new Vector3(), n2 = new Vector3();

		function handleVertex( v ) {

			n.fromBufferAttribute( normalAttribute, v );
			n2.copy( n );

			const t = tan1[ v ];

			// Gram-Schmidt orthogonalize

			tmp.copy( t );
			tmp.sub( n.multiplyScalar( n.dot( t ) ) ).normalize();

			// Calculate handedness

			tmp2.crossVectors( n2, t );
			const test = tmp2.dot( tan2[ v ] );
			const w = ( test < 0.0 ) ? -1 : 1.0;

			tangentAttribute.setXYZW( v, tmp.x, tmp.y, tmp.z, w );

		}

		for ( let i = 0, il = groups.length; i < il; ++ i ) {

			const group = groups[ i ];

			const start = group.start;
			const count = group.count;

			for ( let j = start, jl = start + count; j < jl; j += 3 ) {

				handleVertex( index.getX( j + 0 ) );
				handleVertex( index.getX( j + 1 ) );
				handleVertex( index.getX( j + 2 ) );

			}

		}

	}

	/**
	 * Computes vertex normals for the given vertex data. For indexed geometries, the method sets
	 * each vertex normal to be the average of the face normals of the faces that share that vertex.
	 * For non-indexed geometries, vertices are not shared, and the method sets each vertex normal
	 * to be the same as the face normal.
	 */
	computeVertexNormals() {

		const index = this.index;
		const positionAttribute = this.getAttribute( 'position' );

		if ( positionAttribute !== undefined ) {

			let normalAttribute = this.getAttribute( 'normal' );

			if ( normalAttribute === undefined ) {

				normalAttribute = new BufferAttribute( new Float32Array( positionAttribute.count * 3 ), 3 );
				this.setAttribute( 'normal', normalAttribute );

			} else {

				// reset existing normals to zero

				for ( let i = 0, il = normalAttribute.count; i < il; i ++ ) {

					normalAttribute.setXYZ( i, 0, 0, 0 );

				}

			}

			const pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
			const nA = new Vector3(), nB = new Vector3(), nC = new Vector3();
			const cb = new Vector3(), ab = new Vector3();

			// indexed elements

			if ( index ) {

				for ( let i = 0, il = index.count; i < il; i += 3 ) {

					const vA = index.getX( i + 0 );
					const vB = index.getX( i + 1 );
					const vC = index.getX( i + 2 );

					pA.fromBufferAttribute( positionAttribute, vA );
					pB.fromBufferAttribute( positionAttribute, vB );
					pC.fromBufferAttribute( positionAttribute, vC );

					cb.subVectors( pC, pB );
					ab.subVectors( pA, pB );
					cb.cross( ab );

					nA.fromBufferAttribute( normalAttribute, vA );
					nB.fromBufferAttribute( normalAttribute, vB );
					nC.fromBufferAttribute( normalAttribute, vC );

					nA.add( cb );
					nB.add( cb );
					nC.add( cb );

					normalAttribute.setXYZ( vA, nA.x, nA.y, nA.z );
					normalAttribute.setXYZ( vB, nB.x, nB.y, nB.z );
					normalAttribute.setXYZ( vC, nC.x, nC.y, nC.z );

				}

			} else {

				// non-indexed elements (unconnected triangle soup)

				for ( let i = 0, il = positionAttribute.count; i < il; i += 3 ) {

					pA.fromBufferAttribute( positionAttribute, i + 0 );
					pB.fromBufferAttribute( positionAttribute, i + 1 );
					pC.fromBufferAttribute( positionAttribute, i + 2 );

					cb.subVectors( pC, pB );
					ab.subVectors( pA, pB );
					cb.cross( ab );

					normalAttribute.setXYZ( i + 0, cb.x, cb.y, cb.z );
					normalAttribute.setXYZ( i + 1, cb.x, cb.y, cb.z );
					normalAttribute.setXYZ( i + 2, cb.x, cb.y, cb.z );

				}

			}

			this.normalizeNormals();

			normalAttribute.needsUpdate = true;

		}

	}

	/**
	 * Ensures every normal vector in a geometry will have a magnitude of `1`. This will
	 * correct lighting on the geometry surfaces.
	 */
	normalizeNormals() {

		const normals = this.attributes.normal;

		for ( let i = 0, il = normals.count; i < il; i ++ ) {

			_vector$8.fromBufferAttribute( normals, i );

			_vector$8.normalize();

			normals.setXYZ( i, _vector$8.x, _vector$8.y, _vector$8.z );

		}

	}

	/**
	 * Return a new non-index version of this indexed geometry. If the geometry
	 * is already non-indexed, the method is a NOOP.
	 *
	 * @return {BufferGeometry} The non-indexed version of this indexed geometry.
	 */
	toNonIndexed() {

		function convertBufferAttribute( attribute, indices ) {

			const array = attribute.array;
			const itemSize = attribute.itemSize;
			const normalized = attribute.normalized;

			const array2 = new array.constructor( indices.length * itemSize );

			let index = 0, index2 = 0;

			for ( let i = 0, l = indices.length; i < l; i ++ ) {

				if ( attribute.isInterleavedBufferAttribute ) {

					index = indices[ i ] * attribute.data.stride + attribute.offset;

				} else {

					index = indices[ i ] * itemSize;

				}

				for ( let j = 0; j < itemSize; j ++ ) {

					array2[ index2 ++ ] = array[ index ++ ];

				}

			}

			return new BufferAttribute( array2, itemSize, normalized );

		}

		//

		if ( this.index === null ) {

			console.warn( 'THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.' );
			return this;

		}

		const geometry2 = new BufferGeometry();

		const indices = this.index.array;
		const attributes = this.attributes;

		// attributes

		for ( const name in attributes ) {

			const attribute = attributes[ name ];

			const newAttribute = convertBufferAttribute( attribute, indices );

			geometry2.setAttribute( name, newAttribute );

		}

		// morph attributes

		const morphAttributes = this.morphAttributes;

		for ( const name in morphAttributes ) {

			const morphArray = [];
			const morphAttribute = morphAttributes[ name ]; // morphAttribute: array of Float32BufferAttributes

			for ( let i = 0, il = morphAttribute.length; i < il; i ++ ) {

				const attribute = morphAttribute[ i ];

				const newAttribute = convertBufferAttribute( attribute, indices );

				morphArray.push( newAttribute );

			}

			geometry2.morphAttributes[ name ] = morphArray;

		}

		geometry2.morphTargetsRelative = this.morphTargetsRelative;

		// groups

		const groups = this.groups;

		for ( let i = 0, l = groups.length; i < l; i ++ ) {

			const group = groups[ i ];
			geometry2.addGroup( group.start, group.count, group.materialIndex );

		}

		return geometry2;

	}

	/**
	 * Serializes the geometry into JSON.
	 *
	 * @return {Object} A JSON object representing the serialized geometry.
	 */
	toJSON() {

		const data = {
			metadata: {
				version: 4.6,
				type: 'BufferGeometry',
				generator: 'BufferGeometry.toJSON'
			}
		};

		// standard BufferGeometry serialization

		data.uuid = this.uuid;
		data.type = this.type;
		if ( this.name !== '' ) data.name = this.name;
		if ( Object.keys( this.userData ).length > 0 ) data.userData = this.userData;

		if ( this.parameters !== undefined ) {

			const parameters = this.parameters;

			for ( const key in parameters ) {

				if ( parameters[ key ] !== undefined ) data[ key ] = parameters[ key ];

			}

			return data;

		}

		// for simplicity the code assumes attributes are not shared across geometries, see #15811

		data.data = { attributes: {} };

		const index = this.index;

		if ( index !== null ) {

			data.data.index = {
				type: index.array.constructor.name,
				array: Array.prototype.slice.call( index.array )
			};

		}

		const attributes = this.attributes;

		for ( const key in attributes ) {

			const attribute = attributes[ key ];

			data.data.attributes[ key ] = attribute.toJSON( data.data );

		}

		const morphAttributes = {};
		let hasMorphAttributes = false;

		for ( const key in this.morphAttributes ) {

			const attributeArray = this.morphAttributes[ key ];

			const array = [];

			for ( let i = 0, il = attributeArray.length; i < il; i ++ ) {

				const attribute = attributeArray[ i ];

				array.push( attribute.toJSON( data.data ) );

			}

			if ( array.length > 0 ) {

				morphAttributes[ key ] = array;

				hasMorphAttributes = true;

			}

		}

		if ( hasMorphAttributes ) {

			data.data.morphAttributes = morphAttributes;
			data.data.morphTargetsRelative = this.morphTargetsRelative;

		}

		const groups = this.groups;

		if ( groups.length > 0 ) {

			data.data.groups = JSON.parse( JSON.stringify( groups ) );

		}

		const boundingSphere = this.boundingSphere;

		if ( boundingSphere !== null ) {

			data.data.boundingSphere = {
				center: boundingSphere.center.toArray(),
				radius: boundingSphere.radius
			};

		}

		return data;

	}

	/**
	 * Returns a new geometry with copied values from this instance.
	 *
	 * @return {BufferGeometry} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

	/**
	 * Copies the values of the given geometry to this instance.
	 *
	 * @param {BufferGeometry} source - The geometry to copy.
	 * @return {BufferGeometry} A reference to this instance.
	 */
	copy( source ) {

		// reset

		this.index = null;
		this.attributes = {};
		this.morphAttributes = {};
		this.groups = [];
		this.boundingBox = null;
		this.boundingSphere = null;

		// used for storing cloned, shared data

		const data = {};

		// name

		this.name = source.name;

		// index

		const index = source.index;

		if ( index !== null ) {

			this.setIndex( index.clone() );

		}

		// attributes

		const attributes = source.attributes;

		for ( const name in attributes ) {

			const attribute = attributes[ name ];
			this.setAttribute( name, attribute.clone( data ) );

		}

		// morph attributes

		const morphAttributes = source.morphAttributes;

		for ( const name in morphAttributes ) {

			const array = [];
			const morphAttribute = morphAttributes[ name ]; // morphAttribute: array of Float32BufferAttributes

			for ( let i = 0, l = morphAttribute.length; i < l; i ++ ) {

				array.push( morphAttribute[ i ].clone( data ) );

			}

			this.morphAttributes[ name ] = array;

		}

		this.morphTargetsRelative = source.morphTargetsRelative;

		// groups

		const groups = source.groups;

		for ( let i = 0, l = groups.length; i < l; i ++ ) {

			const group = groups[ i ];
			this.addGroup( group.start, group.count, group.materialIndex );

		}

		// bounding box

		const boundingBox = source.boundingBox;

		if ( boundingBox !== null ) {

			this.boundingBox = boundingBox.clone();

		}

		// bounding sphere

		const boundingSphere = source.boundingSphere;

		if ( boundingSphere !== null ) {

			this.boundingSphere = boundingSphere.clone();

		}

		// draw range

		this.drawRange.start = source.drawRange.start;
		this.drawRange.count = source.drawRange.count;

		// user data

		this.userData = source.userData;

		return this;

	}

	/**
	 * Frees the GPU-related resources allocated by this instance. Call this
	 * method whenever this instance is no longer used in your app.
	 *
	 * @fires BufferGeometry#dispose
	 */
	dispose() {

		this.dispatchEvent( { type: 'dispose' } );

	}

}

const _inverseMatrix$3 = /*@__PURE__*/ new Matrix4();
const _ray$3 = /*@__PURE__*/ new Ray();
const _sphere$6 = /*@__PURE__*/ new Sphere();
const _sphereHitAt = /*@__PURE__*/ new Vector3();

const _vA$1 = /*@__PURE__*/ new Vector3();
const _vB$1 = /*@__PURE__*/ new Vector3();
const _vC$1 = /*@__PURE__*/ new Vector3();

const _tempA = /*@__PURE__*/ new Vector3();
const _morphA = /*@__PURE__*/ new Vector3();

const _intersectionPoint = /*@__PURE__*/ new Vector3();
const _intersectionPointWorld = /*@__PURE__*/ new Vector3();

/**
 * Class representing triangular polygon mesh based objects.
 *
 * ```js
 * const geometry = new THREE.BoxGeometry( 1, 1, 1 );
 * const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
 * const mesh = new THREE.Mesh( geometry, material );
 * scene.add( mesh );
 * ```
 *
 * @augments Object3D
 */
class Mesh extends Object3D {

	/**
	 * Constructs a new mesh.
	 *
	 * @param {BufferGeometry} [geometry] - The mesh geometry.
	 * @param {Material|Array<Material>} [material] - The mesh material.
	 */
	constructor( geometry = new BufferGeometry(), material = new MeshBasicMaterial() ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isMesh = true;

		this.type = 'Mesh';

		/**
		 * The mesh geometry.
		 *
		 * @type {BufferGeometry}
		 */
		this.geometry = geometry;

		/**
		 * The mesh material.
		 *
		 * @type {Material|Array<Material>}
		 * @default MeshBasicMaterial
		 */
		this.material = material;

		/**
		 * A dictionary representing the morph targets in the geometry. The key is the
		 * morph targets name, the value its attribute index. This member is `undefined`
		 * by default and only set when morph targets are detected in the geometry.
		 *
		 * @type {Object<String,number>|undefined}
		 * @default undefined
		 */
		this.morphTargetDictionary = undefined;

		/**
		 * An array of weights typically in the range `[0,1]` that specify how much of the morph
		 * is applied. This member is `undefined` by default and only set when morph targets are
		 * detected in the geometry.
		 *
		 * @type {Array<number>|undefined}
		 * @default undefined
		 */
		this.morphTargetInfluences = undefined;

		this.updateMorphTargets();

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		if ( source.morphTargetInfluences !== undefined ) {

			this.morphTargetInfluences = source.morphTargetInfluences.slice();

		}

		if ( source.morphTargetDictionary !== undefined ) {

			this.morphTargetDictionary = Object.assign( {}, source.morphTargetDictionary );

		}

		this.material = Array.isArray( source.material ) ? source.material.slice() : source.material;
		this.geometry = source.geometry;

		return this;

	}

	/**
	 * Sets the values of {@link Mesh#morphTargetDictionary} and {@link Mesh#morphTargetInfluences}
	 * to make sure existing morph targets can influence this 3D object.
	 */
	updateMorphTargets() {

		const geometry = this.geometry;

		const morphAttributes = geometry.morphAttributes;
		const keys = Object.keys( morphAttributes );

		if ( keys.length > 0 ) {

			const morphAttribute = morphAttributes[ keys[ 0 ] ];

			if ( morphAttribute !== undefined ) {

				this.morphTargetInfluences = [];
				this.morphTargetDictionary = {};

				for ( let m = 0, ml = morphAttribute.length; m < ml; m ++ ) {

					const name = morphAttribute[ m ].name || String( m );

					this.morphTargetInfluences.push( 0 );
					this.morphTargetDictionary[ name ] = m;

				}

			}

		}

	}

	/**
	 * Returns the local-space position of the vertex at the given index, taking into
	 * account the current animation state of both morph targets and skinning.
	 *
	 * @param {number} index - The vertex index.
	 * @param {Vector3} target - The target object that is used to store the method's result.
	 * @return {Vector3} The vertex position in local space.
	 */
	getVertexPosition( index, target ) {

		const geometry = this.geometry;
		const position = geometry.attributes.position;
		const morphPosition = geometry.morphAttributes.position;
		const morphTargetsRelative = geometry.morphTargetsRelative;

		target.fromBufferAttribute( position, index );

		const morphInfluences = this.morphTargetInfluences;

		if ( morphPosition && morphInfluences ) {

			_morphA.set( 0, 0, 0 );

			for ( let i = 0, il = morphPosition.length; i < il; i ++ ) {

				const influence = morphInfluences[ i ];
				const morphAttribute = morphPosition[ i ];

				if ( influence === 0 ) continue;

				_tempA.fromBufferAttribute( morphAttribute, index );

				if ( morphTargetsRelative ) {

					_morphA.addScaledVector( _tempA, influence );

				} else {

					_morphA.addScaledVector( _tempA.sub( target ), influence );

				}

			}

			target.add( _morphA );

		}

		return target;

	}

	/**
	 * Computes intersection points between a casted ray and this line.
	 *
	 * @param {Raycaster} raycaster - The raycaster.
	 * @param {Array<Object>} intersects - The target array that holds the intersection points.
	 */
	raycast( raycaster, intersects ) {

		const geometry = this.geometry;
		const material = this.material;
		const matrixWorld = this.matrixWorld;

		if ( material === undefined ) return;

		// test with bounding sphere in world space

		if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

		_sphere$6.copy( geometry.boundingSphere );
		_sphere$6.applyMatrix4( matrixWorld );

		// check distance from ray origin to bounding sphere

		_ray$3.copy( raycaster.ray ).recast( raycaster.near );

		if ( _sphere$6.containsPoint( _ray$3.origin ) === false ) {

			if ( _ray$3.intersectSphere( _sphere$6, _sphereHitAt ) === null ) return;

			if ( _ray$3.origin.distanceToSquared( _sphereHitAt ) > ( raycaster.far - raycaster.near ) ** 2 ) return;

		}

		// convert ray to local space of mesh

		_inverseMatrix$3.copy( matrixWorld ).invert();
		_ray$3.copy( raycaster.ray ).applyMatrix4( _inverseMatrix$3 );

		// test with bounding box in local space

		if ( geometry.boundingBox !== null ) {

			if ( _ray$3.intersectsBox( geometry.boundingBox ) === false ) return;

		}

		// test for intersections with geometry

		this._computeIntersections( raycaster, intersects, _ray$3 );

	}

	_computeIntersections( raycaster, intersects, rayLocalSpace ) {

		let intersection;

		const geometry = this.geometry;
		const material = this.material;

		const index = geometry.index;
		const position = geometry.attributes.position;
		const uv = geometry.attributes.uv;
		const uv1 = geometry.attributes.uv1;
		const normal = geometry.attributes.normal;
		const groups = geometry.groups;
		const drawRange = geometry.drawRange;

		if ( index !== null ) {

			// indexed buffer geometry

			if ( Array.isArray( material ) ) {

				for ( let i = 0, il = groups.length; i < il; i ++ ) {

					const group = groups[ i ];
					const groupMaterial = material[ group.materialIndex ];

					const start = Math.max( group.start, drawRange.start );
					const end = Math.min( index.count, Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) ) );

					for ( let j = start, jl = end; j < jl; j += 3 ) {

						const a = index.getX( j );
						const b = index.getX( j + 1 );
						const c = index.getX( j + 2 );

						intersection = checkGeometryIntersection( this, groupMaterial, raycaster, rayLocalSpace, uv, uv1, normal, a, b, c );

						if ( intersection ) {

							intersection.faceIndex = Math.floor( j / 3 ); // triangle number in indexed buffer semantics
							intersection.face.materialIndex = group.materialIndex;
							intersects.push( intersection );

						}

					}

				}

			} else {

				const start = Math.max( 0, drawRange.start );
				const end = Math.min( index.count, ( drawRange.start + drawRange.count ) );

				for ( let i = start, il = end; i < il; i += 3 ) {

					const a = index.getX( i );
					const b = index.getX( i + 1 );
					const c = index.getX( i + 2 );

					intersection = checkGeometryIntersection( this, material, raycaster, rayLocalSpace, uv, uv1, normal, a, b, c );

					if ( intersection ) {

						intersection.faceIndex = Math.floor( i / 3 ); // triangle number in indexed buffer semantics
						intersects.push( intersection );

					}

				}

			}

		} else if ( position !== undefined ) {

			// non-indexed buffer geometry

			if ( Array.isArray( material ) ) {

				for ( let i = 0, il = groups.length; i < il; i ++ ) {

					const group = groups[ i ];
					const groupMaterial = material[ group.materialIndex ];

					const start = Math.max( group.start, drawRange.start );
					const end = Math.min( position.count, Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) ) );

					for ( let j = start, jl = end; j < jl; j += 3 ) {

						const a = j;
						const b = j + 1;
						const c = j + 2;

						intersection = checkGeometryIntersection( this, groupMaterial, raycaster, rayLocalSpace, uv, uv1, normal, a, b, c );

						if ( intersection ) {

							intersection.faceIndex = Math.floor( j / 3 ); // triangle number in non-indexed buffer semantics
							intersection.face.materialIndex = group.materialIndex;
							intersects.push( intersection );

						}

					}

				}

			} else {

				const start = Math.max( 0, drawRange.start );
				const end = Math.min( position.count, ( drawRange.start + drawRange.count ) );

				for ( let i = start, il = end; i < il; i += 3 ) {

					const a = i;
					const b = i + 1;
					const c = i + 2;

					intersection = checkGeometryIntersection( this, material, raycaster, rayLocalSpace, uv, uv1, normal, a, b, c );

					if ( intersection ) {

						intersection.faceIndex = Math.floor( i / 3 ); // triangle number in non-indexed buffer semantics
						intersects.push( intersection );

					}

				}

			}

		}

	}

}

function checkIntersection$1( object, material, raycaster, ray, pA, pB, pC, point ) {

	let intersect;

	if ( material.side === BackSide ) {

		intersect = ray.intersectTriangle( pC, pB, pA, true, point );

	} else {

		intersect = ray.intersectTriangle( pA, pB, pC, ( material.side === FrontSide ), point );

	}

	if ( intersect === null ) return null;

	_intersectionPointWorld.copy( point );
	_intersectionPointWorld.applyMatrix4( object.matrixWorld );

	const distance = raycaster.ray.origin.distanceTo( _intersectionPointWorld );

	if ( distance < raycaster.near || distance > raycaster.far ) return null;

	return {
		distance: distance,
		point: _intersectionPointWorld.clone(),
		object: object
	};

}

function checkGeometryIntersection( object, material, raycaster, ray, uv, uv1, normal, a, b, c ) {

	object.getVertexPosition( a, _vA$1 );
	object.getVertexPosition( b, _vB$1 );
	object.getVertexPosition( c, _vC$1 );

	const intersection = checkIntersection$1( object, material, raycaster, ray, _vA$1, _vB$1, _vC$1, _intersectionPoint );

	if ( intersection ) {

		const barycoord = new Vector3();
		Triangle.getBarycoord( _intersectionPoint, _vA$1, _vB$1, _vC$1, barycoord );

		if ( uv ) {

			intersection.uv = Triangle.getInterpolatedAttribute( uv, a, b, c, barycoord, new Vector2() );

		}

		if ( uv1 ) {

			intersection.uv1 = Triangle.getInterpolatedAttribute( uv1, a, b, c, barycoord, new Vector2() );

		}

		if ( normal ) {

			intersection.normal = Triangle.getInterpolatedAttribute( normal, a, b, c, barycoord, new Vector3() );

			if ( intersection.normal.dot( ray.direction ) > 0 ) {

				intersection.normal.multiplyScalar( -1 );

			}

		}

		const face = {
			a: a,
			b: b,
			c: c,
			normal: new Vector3(),
			materialIndex: 0
		};

		Triangle.getNormal( _vA$1, _vB$1, _vC$1, face.normal );

		intersection.face = face;
		intersection.barycoord = barycoord;

	}

	return intersection;

}

/**
 * Abstract base class for cameras. This class should always be inherited
 * when you build a new camera.
 *
 * @abstract
 * @augments Object3D
 */
class Camera extends Object3D {

	/**
	 * Constructs a new camera.
	 */
	constructor() {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isCamera = true;

		this.type = 'Camera';

		/**
		 * The inverse of the camera's world matrix.
		 *
		 * @type {Matrix4}
		 */
		this.matrixWorldInverse = new Matrix4();

		/**
		 * The camera's projection matrix.
		 *
		 * @type {Matrix4}
		 */
		this.projectionMatrix = new Matrix4();

		/**
		 * The inverse of the camera's projection matrix.
		 *
		 * @type {Matrix4}
		 */
		this.projectionMatrixInverse = new Matrix4();

		/**
		 * The coordinate system in which the camera is used.
		 *
		 * @type {(WebGLCoordinateSystem|WebGPUCoordinateSystem)}
		 */
		this.coordinateSystem = WebGLCoordinateSystem;

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.matrixWorldInverse.copy( source.matrixWorldInverse );

		this.projectionMatrix.copy( source.projectionMatrix );
		this.projectionMatrixInverse.copy( source.projectionMatrixInverse );

		this.coordinateSystem = source.coordinateSystem;

		return this;

	}

	/**
	 * Returns a vector representing the ("look") direction of the 3D object in world space.
	 *
	 * This method is overwritten since cameras have a different forward vector compared to other
	 * 3D objects. A camera looks down its local, negative z-axis by default.
	 *
	 * @param {Vector3} target - The target vector the result is stored to.
	 * @return {Vector3} The 3D object's direction in world space.
	 */
	getWorldDirection( target ) {

		return super.getWorldDirection( target ).negate();

	}

	updateMatrixWorld( force ) {

		super.updateMatrixWorld( force );

		this.matrixWorldInverse.copy( this.matrixWorld ).invert();

	}

	updateWorldMatrix( updateParents, updateChildren ) {

		super.updateWorldMatrix( updateParents, updateChildren );

		this.matrixWorldInverse.copy( this.matrixWorld ).invert();

	}

	clone() {

		return new this.constructor().copy( this );

	}

}

const _v3$1 = /*@__PURE__*/ new Vector3();
const _minTarget = /*@__PURE__*/ new Vector2();
const _maxTarget = /*@__PURE__*/ new Vector2();

/**
 * Camera that uses [perspective projection]{@link https://en.wikipedia.org/wiki/Perspective_(graphical)}.
 *
 * This projection mode is designed to mimic the way the human eye sees. It
 * is the most common projection mode used for rendering a 3D scene.
 *
 * ```js
 * const camera = new THREE.PerspectiveCamera( 45, width / height, 1, 1000 );
 * scene.add( camera );
 * ```
 *
 * @augments Camera
 */
class PerspectiveCamera extends Camera {

	/**
	 * Constructs a new perspective camera.
	 *
	 * @param {number} [fov=50] - The vertical field of view.
	 * @param {number} [aspect=1] - The aspect ratio.
	 * @param {number} [near=0.1] - The camera's near plane.
	 * @param {number} [far=2000] - The camera's far plane.
	 */
	constructor( fov = 50, aspect = 1, near = 0.1, far = 2000 ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isPerspectiveCamera = true;

		this.type = 'PerspectiveCamera';

		/**
		 * The vertical field of view, from bottom to top of view,
		 * in degrees.
		 *
		 * @type {number}
		 * @default 50
		 */
		this.fov = fov;

		/**
		 * The zoom factor of the camera.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.zoom = 1;

		/**
		 * The camera's near plane. The valid range is greater than `0`
		 * and less than the current value of {@link PerspectiveCamera#far}.
		 *
		 * Note that, unlike for the {@link OrthographicCamera}, `0` is <em>not</em> a
		 * valid value for a perspective camera's near plane.
		 *
		 * @type {number}
		 * @default 0.1
		 */
		this.near = near;

		/**
		 * The camera's far plane. Must be greater than the
		 * current value of {@link PerspectiveCamera#near}.
		 *
		 * @type {number}
		 * @default 2000
		 */
		this.far = far;

		/**
		 * Object distance used for stereoscopy and depth-of-field effects. This
		 * parameter does not influence the projection matrix unless a
		 * {@link StereoCamera} is being used.
		 *
		 * @type {number}
		 * @default 10
		 */
		this.focus = 10;

		/**
		 * The aspect ratio, usually the canvas width / canvas height.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.aspect = aspect;

		/**
		 * Represents the frustum window specification. This property should not be edited
		 * directly but via {@link PerspectiveCamera#setViewOffset} and {@link PerspectiveCamera#clearViewOffset}.
		 *
		 * @type {?Object}
		 * @default null
		 */
		this.view = null;

		/**
		 * Film size used for the larger axis. Default is `35` (millimeters). This
		 * parameter does not influence the projection matrix unless {@link PerspectiveCamera#filmOffset}
		 * is set to a nonzero value.
		 *
		 * @type {number}
		 * @default 35
		 */
		this.filmGauge = 35;

		/**
		 * Horizontal off-center offset in the same unit as {@link PerspectiveCamera#filmGauge}.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.filmOffset = 0;

		this.updateProjectionMatrix();

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.fov = source.fov;
		this.zoom = source.zoom;

		this.near = source.near;
		this.far = source.far;
		this.focus = source.focus;

		this.aspect = source.aspect;
		this.view = source.view === null ? null : Object.assign( {}, source.view );

		this.filmGauge = source.filmGauge;
		this.filmOffset = source.filmOffset;

		return this;

	}

	/**
	 * Sets the FOV by focal length in respect to the current {@link PerspectiveCamera#filmGauge}.
	 *
	 * The default film gauge is 35, so that the focal length can be specified for
	 * a 35mm (full frame) camera.
	 *
	 * @param {number} focalLength - Values for focal length and film gauge must have the same unit.
	 */
	setFocalLength( focalLength ) {

		/** see {@link http://www.bobatkins.com/photography/technical/field_of_view.html} */
		const vExtentSlope = 0.5 * this.getFilmHeight() / focalLength;

		this.fov = RAD2DEG * 2 * Math.atan( vExtentSlope );
		this.updateProjectionMatrix();

	}

	/**
	 * Returns the focal length from the current {@link PerspectiveCamera#fov} and
	 * {@link PerspectiveCamera#filmGauge}.
	 *
	 * @return {number} The computed focal length.
	 */
	getFocalLength() {

		const vExtentSlope = Math.tan( DEG2RAD * 0.5 * this.fov );

		return 0.5 * this.getFilmHeight() / vExtentSlope;

	}

	/**
	 * Returns the current vertical field of view angle in degrees considering {@link PerspectiveCamera#zoom}.
	 *
	 * @return {number} The effective FOV.
	 */
	getEffectiveFOV() {

		return RAD2DEG * 2 * Math.atan(
			Math.tan( DEG2RAD * 0.5 * this.fov ) / this.zoom );

	}

	/**
	 * Returns the width of the image on the film. If {@link PerspectiveCamera#aspect} is greater than or
	 * equal to one (landscape format), the result equals {@link PerspectiveCamera#filmGauge}.
	 *
	 * @return {number} The film width.
	 */
	getFilmWidth() {

		// film not completely covered in portrait format (aspect < 1)
		return this.filmGauge * Math.min( this.aspect, 1 );

	}

	/**
	 * Returns the height of the image on the film. If {@link PerspectiveCamera#aspect} is greater than or
	 * equal to one (landscape format), the result equals {@link PerspectiveCamera#filmGauge}.
	 *
	 * @return {number} The film width.
	 */
	getFilmHeight() {

		// film not completely covered in landscape format (aspect > 1)
		return this.filmGauge / Math.max( this.aspect, 1 );

	}

	/**
	 * Computes the 2D bounds of the camera's viewable rectangle at a given distance along the viewing direction.
	 * Sets `minTarget` and `maxTarget` to the coordinates of the lower-left and upper-right corners of the view rectangle.
	 *
	 * @param {number} distance - The viewing distance.
	 * @param {Vector2} minTarget - The lower-left corner of the view rectangle is written into this vector.
	 * @param {Vector2} maxTarget - The upper-right corner of the view rectangle is written into this vector.
	 */
	getViewBounds( distance, minTarget, maxTarget ) {

		_v3$1.set( -1, -1, 0.5 ).applyMatrix4( this.projectionMatrixInverse );

		minTarget.set( _v3$1.x, _v3$1.y ).multiplyScalar( - distance / _v3$1.z );

		_v3$1.set( 1, 1, 0.5 ).applyMatrix4( this.projectionMatrixInverse );

		maxTarget.set( _v3$1.x, _v3$1.y ).multiplyScalar( - distance / _v3$1.z );

	}

	/**
	 * Computes the width and height of the camera's viewable rectangle at a given distance along the viewing direction.
	 *
	 * @param {number} distance - The viewing distance.
	 * @param {Vector2} target - The target vector that is used to store result where x is width and y is height.
	 * @returns {Vector2} The view size.
	 */
	getViewSize( distance, target ) {

		this.getViewBounds( distance, _minTarget, _maxTarget );

		return target.subVectors( _maxTarget, _minTarget );

	}

	/**
	 * Sets an offset in a larger frustum. This is useful for multi-window or
	 * multi-monitor/multi-machine setups.
	 *
	 * For example, if you have 3x2 monitors and each monitor is 1920x1080 and
	 * the monitors are in grid like this
	 *```
	 *   +---+---+---+
	 *   | A | B | C |
	 *   +---+---+---+
	 *   | D | E | F |
	 *   +---+---+---+
	 *```
	 * then for each monitor you would call it like this:
	 *```js
	 * const w = 1920;
	 * const h = 1080;
	 * const fullWidth = w * 3;
	 * const fullHeight = h * 2;
	 *
	 * // --A--
	 * camera.setViewOffset( fullWidth, fullHeight, w * 0, h * 0, w, h );
	 * // --B--
	 * camera.setViewOffset( fullWidth, fullHeight, w * 1, h * 0, w, h );
	 * // --C--
	 * camera.setViewOffset( fullWidth, fullHeight, w * 2, h * 0, w, h );
	 * // --D--
	 * camera.setViewOffset( fullWidth, fullHeight, w * 0, h * 1, w, h );
	 * // --E--
	 * camera.setViewOffset( fullWidth, fullHeight, w * 1, h * 1, w, h );
	 * // --F--
	 * camera.setViewOffset( fullWidth, fullHeight, w * 2, h * 1, w, h );
	 * ```
	 *
	 * Note there is no reason monitors have to be the same size or in a grid.
	 *
	 * @param {number} fullWidth - The full width of multiview setup.
	 * @param {number} fullHeight - The full height of multiview setup.
	 * @param {number} x - The horizontal offset of the subcamera.
	 * @param {number} y - The vertical offset of the subcamera.
	 * @param {number} width - The width of subcamera.
	 * @param {number} height - The height of subcamera.
	 */
	setViewOffset( fullWidth, fullHeight, x, y, width, height ) {

		this.aspect = fullWidth / fullHeight;

		if ( this.view === null ) {

			this.view = {
				enabled: true,
				fullWidth: 1,
				fullHeight: 1,
				offsetX: 0,
				offsetY: 0,
				width: 1,
				height: 1
			};

		}

		this.view.enabled = true;
		this.view.fullWidth = fullWidth;
		this.view.fullHeight = fullHeight;
		this.view.offsetX = x;
		this.view.offsetY = y;
		this.view.width = width;
		this.view.height = height;

		this.updateProjectionMatrix();

	}

	/**
	 * Removes the view offset from the projection matrix.
	 */
	clearViewOffset() {

		if ( this.view !== null ) {

			this.view.enabled = false;

		}

		this.updateProjectionMatrix();

	}

	/**
	 * Updates the camera's projection matrix. Must be called after any change of
	 * camera properties.
	 */
	updateProjectionMatrix() {

		const near = this.near;
		let top = near * Math.tan( DEG2RAD * 0.5 * this.fov ) / this.zoom;
		let height = 2 * top;
		let width = this.aspect * height;
		let left = -0.5 * width;
		const view = this.view;

		if ( this.view !== null && this.view.enabled ) {

			const fullWidth = view.fullWidth,
				fullHeight = view.fullHeight;

			left += view.offsetX * width / fullWidth;
			top -= view.offsetY * height / fullHeight;
			width *= view.width / fullWidth;
			height *= view.height / fullHeight;

		}

		const skew = this.filmOffset;
		if ( skew !== 0 ) left += near * skew / this.getFilmWidth();

		this.projectionMatrix.makePerspective( left, left + width, top, top - height, near, this.far, this.coordinateSystem );

		this.projectionMatrixInverse.copy( this.projectionMatrix ).invert();

	}

	toJSON( meta ) {

		const data = super.toJSON( meta );

		data.object.fov = this.fov;
		data.object.zoom = this.zoom;

		data.object.near = this.near;
		data.object.far = this.far;
		data.object.focus = this.focus;

		data.object.aspect = this.aspect;

		if ( this.view !== null ) data.object.view = Object.assign( {}, this.view );

		data.object.filmGauge = this.filmGauge;
		data.object.filmOffset = this.filmOffset;

		return data;

	}

}

/**
 * This is almost identical to an {@link Object3D}. Its purpose is to
 * make working with groups of objects syntactically clearer.
 *
 * ```js
 * // Create a group and add the two cubes.
 * // These cubes can now be rotated / scaled etc as a group.
 * const group = new THREE.Group();
 *
 * group.add( meshA );
 * group.add( meshB );
 *
 * scene.add( group );
 * ```
 *
 * @augments Object3D
 */
class Group extends Object3D {

	constructor() {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isGroup = true;

		this.type = 'Group';

	}

}

/**
 * "Interleaved" means that multiple attributes, possibly of different types,
 * (e.g., position, normal, uv, color) are packed into a single array buffer.
 *
 * An introduction into interleaved arrays can be found here: [Interleaved array basics]{@link https://blog.tojicode.com/2011/05/interleaved-array-basics.html}
 */
class InterleavedBuffer {

	/**
	 * Constructs a new interleaved buffer.
	 *
	 * @param {TypedArray} array - A typed array with a shared buffer storing attribute data.
	 * @param {number} stride - The number of typed-array elements per vertex.
	 */
	constructor( array, stride ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isInterleavedBuffer = true;

		/**
		 * A typed array with a shared buffer storing attribute data.
		 *
		 * @type {TypedArray}
		 */
		this.array = array;

		/**
		 * The number of typed-array elements per vertex.
		 *
		 * @type {number}
		 */
		this.stride = stride;

		/**
		 * The total number of elements in the array
		 *
		 * @type {number}
		 * @readonly
		 */
		this.count = array !== undefined ? array.length / stride : 0;

		/**
		 * Defines the intended usage pattern of the data store for optimization purposes.
		 *
		 * Note: After the initial use of a buffer, its usage cannot be changed. Instead,
		 * instantiate a new one and set the desired usage before the next render.
		 *
		 * @type {(StaticDrawUsage|DynamicDrawUsage|StreamDrawUsage|StaticReadUsage|DynamicReadUsage|StreamReadUsage|StaticCopyUsage|DynamicCopyUsage|StreamCopyUsage)}
		 * @default StaticDrawUsage
		 */
		this.usage = StaticDrawUsage;

		/**
		 * This can be used to only update some components of stored vectors (for example, just the
		 * component related to color). Use the `addUpdateRange()` function to add ranges to this array.
		 *
		 * @type {Array<Object>}
		 */
		this.updateRanges = [];

		/**
		 * A version number, incremented every time the `needsUpdate` is set to `true`.
		 *
		 * @type {number}
		 */
		this.version = 0;

		/**
		 * The UUID of the interleaved buffer.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.uuid = generateUUID();

	}

	/**
	 * A callback function that is executed after the renderer has transferred the attribute array
	 * data to the GPU.
	 */
	onUploadCallback() {}

	/**
	 * Flag to indicate that this attribute has changed and should be re-sent to
	 * the GPU. Set this to `true` when you modify the value of the array.
	 *
	 * @type {number}
	 * @default false
	 * @param {boolean} value
	 */
	set needsUpdate( value ) {

		if ( value === true ) this.version ++;

	}

	/**
	 * Sets the usage of this interleaved buffer.
	 *
	 * @param {(StaticDrawUsage|DynamicDrawUsage|StreamDrawUsage|StaticReadUsage|DynamicReadUsage|StreamReadUsage|StaticCopyUsage|DynamicCopyUsage|StreamCopyUsage)} value - The usage to set.
	 * @return {InterleavedBuffer} A reference to this interleaved buffer.
	 */
	setUsage( value ) {

		this.usage = value;

		return this;

	}

	/**
	 * Adds a range of data in the data array to be updated on the GPU.
	 *
	 * @param {number} start - Position at which to start update.
	 * @param {number} count - The number of components to update.
	 */
	addUpdateRange( start, count ) {

		this.updateRanges.push( { start, count } );

	}

	/**
	 * Clears the update ranges.
	 */
	clearUpdateRanges() {

		this.updateRanges.length = 0;

	}

	/**
	 * Copies the values of the given interleaved buffer to this instance.
	 *
	 * @param {InterleavedBuffer} source - The interleaved buffer to copy.
	 * @return {InterleavedBuffer} A reference to this instance.
	 */
	copy( source ) {

		this.array = new source.array.constructor( source.array );
		this.count = source.count;
		this.stride = source.stride;
		this.usage = source.usage;

		return this;

	}

	/**
	 * Copies a vector from the given interleaved buffer to this one. The start
	 * and destination position in the attribute buffers are represented by the
	 * given indices.
	 *
	 * @param {number} index1 - The destination index into this interleaved buffer.
	 * @param {InterleavedBuffer} interleavedBuffer - The interleaved buffer to copy from.
	 * @param {number} index2 - The source index into the given interleaved buffer.
	 * @return {InterleavedBuffer} A reference to this instance.
	 */
	copyAt( index1, interleavedBuffer, index2 ) {

		index1 *= this.stride;
		index2 *= interleavedBuffer.stride;

		for ( let i = 0, l = this.stride; i < l; i ++ ) {

			this.array[ index1 + i ] = interleavedBuffer.array[ index2 + i ];

		}

		return this;

	}

	/**
	 * Sets the given array data in the interleaved buffer.
	 *
	 * @param {(TypedArray|Array)} value - The array data to set.
	 * @param {number} [offset=0] - The offset in this interleaved buffer's array.
	 * @return {InterleavedBuffer} A reference to this instance.
	 */
	set( value, offset = 0 ) {

		this.array.set( value, offset );

		return this;

	}

	/**
	 * Returns a new interleaved buffer with copied values from this instance.
	 *
	 * @param {Object} [data] - An object with shared array buffers that allows to retain shared structures.
	 * @return {InterleavedBuffer} A clone of this instance.
	 */
	clone( data ) {

		if ( data.arrayBuffers === undefined ) {

			data.arrayBuffers = {};

		}

		if ( this.array.buffer._uuid === undefined ) {

			this.array.buffer._uuid = generateUUID();

		}

		if ( data.arrayBuffers[ this.array.buffer._uuid ] === undefined ) {

			data.arrayBuffers[ this.array.buffer._uuid ] = this.array.slice( 0 ).buffer;

		}

		const array = new this.array.constructor( data.arrayBuffers[ this.array.buffer._uuid ] );

		const ib = new this.constructor( array, this.stride );
		ib.setUsage( this.usage );

		return ib;

	}

	/**
	 * Sets the given callback function that is executed after the Renderer has transferred
	 * the array data to the GPU. Can be used to perform clean-up operations after
	 * the upload when data are not needed anymore on the CPU side.
	 *
	 * @param {Function} callback - The `onUpload()` callback.
	 * @return {InterleavedBuffer} A reference to this instance.
	 */
	onUpload( callback ) {

		this.onUploadCallback = callback;

		return this;

	}

	/**
	 * Serializes the interleaved buffer into JSON.
	 *
	 * @param {Object} [data] - An optional value holding meta information about the serialization.
	 * @return {Object} A JSON object representing the serialized interleaved buffer.
	 */
	toJSON( data ) {

		if ( data.arrayBuffers === undefined ) {

			data.arrayBuffers = {};

		}

		// generate UUID for array buffer if necessary

		if ( this.array.buffer._uuid === undefined ) {

			this.array.buffer._uuid = generateUUID();

		}

		if ( data.arrayBuffers[ this.array.buffer._uuid ] === undefined ) {

			data.arrayBuffers[ this.array.buffer._uuid ] = Array.from( new Uint32Array( this.array.buffer ) );

		}

		//

		return {
			uuid: this.uuid,
			buffer: this.array.buffer._uuid,
			type: this.array.constructor.name,
			stride: this.stride
		};

	}

}

const _vector$7 = /*@__PURE__*/ new Vector3();

/**
 * An alternative version of a buffer attribute with interleaved data. Interleaved
 * attributes share a common interleaved data storage ({@link InterleavedBuffer}) and refer with
 * different offsets into the buffer.
 */
class InterleavedBufferAttribute {

	/**
	 * Constructs a new interleaved buffer attribute.
	 *
	 * @param {InterleavedBuffer} interleavedBuffer - The buffer holding the interleaved data.
	 * @param {number} itemSize - The item size.
	 * @param {number} offset - The attribute offset into the buffer.
	 * @param {boolean} [normalized=false] - Whether the data are normalized or not.
	 */
	constructor( interleavedBuffer, itemSize, offset, normalized = false ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isInterleavedBufferAttribute = true;

		/**
		 * The name of the buffer attribute.
		 *
		 * @type {string}
		 */
		this.name = '';

		/**
		 * The buffer holding the interleaved data.
		 *
		 * @type {InterleavedBuffer}
		 */
		this.data = interleavedBuffer;

		/**
		 * The item size, see {@link BufferAttribute#itemSize}.
		 *
		 * @type {number}
		 */
		this.itemSize = itemSize;

		/**
		 * The attribute offset into the buffer.
		 *
		 * @type {number}
		 */
		this.offset = offset;

		/**
		 * Whether the data are normalized or not, see {@link BufferAttribute#normalized}
		 *
		 * @type {InterleavedBuffer}
		 */
		this.normalized = normalized;

	}

	/**
	 * The item count of this buffer attribute.
	 *
	 * @type {number}
	 * @readonly
	 */
	get count() {

		return this.data.count;

	}

	/**
	 * The array holding the interleaved buffer attribute data.
	 *
	 * @type {TypedArray}
	 */
	get array() {

		return this.data.array;

	}

	/**
	 * Flag to indicate that this attribute has changed and should be re-sent to
	 * the GPU. Set this to `true` when you modify the value of the array.
	 *
	 * @type {number}
	 * @default false
	 * @param {boolean} value
	 */
	set needsUpdate( value ) {

		this.data.needsUpdate = value;

	}

	/**
	 * Applies the given 4x4 matrix to the given attribute. Only works with
	 * item size `3`.
	 *
	 * @param {Matrix4} m - The matrix to apply.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	applyMatrix4( m ) {

		for ( let i = 0, l = this.data.count; i < l; i ++ ) {

			_vector$7.fromBufferAttribute( this, i );

			_vector$7.applyMatrix4( m );

			this.setXYZ( i, _vector$7.x, _vector$7.y, _vector$7.z );

		}

		return this;

	}

	/**
	 * Applies the given 3x3 normal matrix to the given attribute. Only works with
	 * item size `3`.
	 *
	 * @param {Matrix3} m - The normal matrix to apply.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	applyNormalMatrix( m ) {

		for ( let i = 0, l = this.count; i < l; i ++ ) {

			_vector$7.fromBufferAttribute( this, i );

			_vector$7.applyNormalMatrix( m );

			this.setXYZ( i, _vector$7.x, _vector$7.y, _vector$7.z );

		}

		return this;

	}

	/**
	 * Applies the given 4x4 matrix to the given attribute. Only works with
	 * item size `3` and with direction vectors.
	 *
	 * @param {Matrix4} m - The matrix to apply.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	transformDirection( m ) {

		for ( let i = 0, l = this.count; i < l; i ++ ) {

			_vector$7.fromBufferAttribute( this, i );

			_vector$7.transformDirection( m );

			this.setXYZ( i, _vector$7.x, _vector$7.y, _vector$7.z );

		}

		return this;

	}

	/**
	 * Returns the given component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} component - The component index.
	 * @return {number} The returned value.
	 */
	getComponent( index, component ) {

		let value = this.array[ index * this.data.stride + this.offset + component ];

		if ( this.normalized ) value = denormalize( value, this.array );

		return value;

	}

	/**
	 * Sets the given value to the given component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} component - The component index.
	 * @param {number} value - The value to set.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	setComponent( index, component, value ) {

		if ( this.normalized ) value = normalize( value, this.array );

		this.data.array[ index * this.data.stride + this.offset + component ] = value;

		return this;

	}

	/**
	 * Sets the x component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} x - The value to set.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	setX( index, x ) {

		if ( this.normalized ) x = normalize( x, this.array );

		this.data.array[ index * this.data.stride + this.offset ] = x;

		return this;

	}

	/**
	 * Sets the y component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} y - The value to set.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	setY( index, y ) {

		if ( this.normalized ) y = normalize( y, this.array );

		this.data.array[ index * this.data.stride + this.offset + 1 ] = y;

		return this;

	}

	/**
	 * Sets the z component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} z - The value to set.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	setZ( index, z ) {

		if ( this.normalized ) z = normalize( z, this.array );

		this.data.array[ index * this.data.stride + this.offset + 2 ] = z;

		return this;

	}

	/**
	 * Sets the w component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} w - The value to set.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	setW( index, w ) {

		if ( this.normalized ) w = normalize( w, this.array );

		this.data.array[ index * this.data.stride + this.offset + 3 ] = w;

		return this;

	}

	/**
	 * Returns the x component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @return {number} The x component.
	 */
	getX( index ) {

		let x = this.data.array[ index * this.data.stride + this.offset ];

		if ( this.normalized ) x = denormalize( x, this.array );

		return x;

	}

	/**
	 * Returns the y component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @return {number} The y component.
	 */
	getY( index ) {

		let y = this.data.array[ index * this.data.stride + this.offset + 1 ];

		if ( this.normalized ) y = denormalize( y, this.array );

		return y;

	}

	/**
	 * Returns the z component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @return {number} The z component.
	 */
	getZ( index ) {

		let z = this.data.array[ index * this.data.stride + this.offset + 2 ];

		if ( this.normalized ) z = denormalize( z, this.array );

		return z;

	}

	/**
	 * Returns the w component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @return {number} The w component.
	 */
	getW( index ) {

		let w = this.data.array[ index * this.data.stride + this.offset + 3 ];

		if ( this.normalized ) w = denormalize( w, this.array );

		return w;

	}

	/**
	 * Sets the x and y component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} x - The value for the x component to set.
	 * @param {number} y - The value for the y component to set.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	setXY( index, x, y ) {

		index = index * this.data.stride + this.offset;

		if ( this.normalized ) {

			x = normalize( x, this.array );
			y = normalize( y, this.array );

		}

		this.data.array[ index + 0 ] = x;
		this.data.array[ index + 1 ] = y;

		return this;

	}

	/**
	 * Sets the x, y and z component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} x - The value for the x component to set.
	 * @param {number} y - The value for the y component to set.
	 * @param {number} z - The value for the z component to set.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	setXYZ( index, x, y, z ) {

		index = index * this.data.stride + this.offset;

		if ( this.normalized ) {

			x = normalize( x, this.array );
			y = normalize( y, this.array );
			z = normalize( z, this.array );

		}

		this.data.array[ index + 0 ] = x;
		this.data.array[ index + 1 ] = y;
		this.data.array[ index + 2 ] = z;

		return this;

	}

	/**
	 * Sets the x, y, z and w component of the vector at the given index.
	 *
	 * @param {number} index - The index into the buffer attribute.
	 * @param {number} x - The value for the x component to set.
	 * @param {number} y - The value for the y component to set.
	 * @param {number} z - The value for the z component to set.
	 * @param {number} w - The value for the w component to set.
	 * @return {InterleavedBufferAttribute} A reference to this instance.
	 */
	setXYZW( index, x, y, z, w ) {

		index = index * this.data.stride + this.offset;

		if ( this.normalized ) {

			x = normalize( x, this.array );
			y = normalize( y, this.array );
			z = normalize( z, this.array );
			w = normalize( w, this.array );

		}

		this.data.array[ index + 0 ] = x;
		this.data.array[ index + 1 ] = y;
		this.data.array[ index + 2 ] = z;
		this.data.array[ index + 3 ] = w;

		return this;

	}

	/**
	 * Returns a new buffer attribute with copied values from this instance.
	 *
	 * If no parameter is provided, cloning an interleaved buffer attribute will de-interleave buffer data.
	 *
	 * @param {Object} [data] - An object with interleaved buffers that allows to retain the interleaved property.
	 * @return {BufferAttribute|InterleavedBufferAttribute} A clone of this instance.
	 */
	clone( data ) {

		if ( data === undefined ) {

			console.log( 'THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.' );

			const array = [];

			for ( let i = 0; i < this.count; i ++ ) {

				const index = i * this.data.stride + this.offset;

				for ( let j = 0; j < this.itemSize; j ++ ) {

					array.push( this.data.array[ index + j ] );

				}

			}

			return new BufferAttribute( new this.array.constructor( array ), this.itemSize, this.normalized );

		} else {

			if ( data.interleavedBuffers === undefined ) {

				data.interleavedBuffers = {};

			}

			if ( data.interleavedBuffers[ this.data.uuid ] === undefined ) {

				data.interleavedBuffers[ this.data.uuid ] = this.data.clone( data );

			}

			return new InterleavedBufferAttribute( data.interleavedBuffers[ this.data.uuid ], this.itemSize, this.offset, this.normalized );

		}

	}

	/**
	 * Serializes the buffer attribute into JSON.
	 *
	 * If no parameter is provided, cloning an interleaved buffer attribute will de-interleave buffer data.
	 *
	 * @param {Object} [data] - An optional value holding meta information about the serialization.
	 * @return {Object} A JSON object representing the serialized buffer attribute.
	 */
	toJSON( data ) {

		if ( data === undefined ) {

			console.log( 'THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.' );

			const array = [];

			for ( let i = 0; i < this.count; i ++ ) {

				const index = i * this.data.stride + this.offset;

				for ( let j = 0; j < this.itemSize; j ++ ) {

					array.push( this.data.array[ index + j ] );

				}

			}

			// de-interleave data and save it as an ordinary buffer attribute for now

			return {
				itemSize: this.itemSize,
				type: this.array.constructor.name,
				array: array,
				normalized: this.normalized
			};

		} else {

			// save as true interleaved attribute

			if ( data.interleavedBuffers === undefined ) {

				data.interleavedBuffers = {};

			}

			if ( data.interleavedBuffers[ this.data.uuid ] === undefined ) {

				data.interleavedBuffers[ this.data.uuid ] = this.data.toJSON( data );

			}

			return {
				isInterleavedBufferAttribute: true,
				itemSize: this.itemSize,
				data: this.data.uuid,
				offset: this.offset,
				normalized: this.normalized
			};

		}

	}

}

const _basePosition = /*@__PURE__*/ new Vector3();

const _skinIndex = /*@__PURE__*/ new Vector4();
const _skinWeight = /*@__PURE__*/ new Vector4();

const _vector3 = /*@__PURE__*/ new Vector3();
const _matrix4 = /*@__PURE__*/ new Matrix4();
const _vertex = /*@__PURE__*/ new Vector3();

const _sphere$5 = /*@__PURE__*/ new Sphere();
const _inverseMatrix$2 = /*@__PURE__*/ new Matrix4();
const _ray$2 = /*@__PURE__*/ new Ray();

/**
 * A mesh that has a {@link Skeleton} that can then be used to animate the
 * vertices of the geometry with skinning/skeleton animation.
 *
 * Next to a valid skeleton, the skinned mesh requires skin indices and weights
 * as buffer attributes in its geometry. These attribute define which bones affect a single
 * vertex to a certain extend.
 *
 * Typically skinned meshes are not created manually but loaders like {@link GLTFLoader}
 * or {@link FBXLoader } import respective models.
 *
 * @augments Mesh
 */
class SkinnedMesh extends Mesh {

	/**
	 * Constructs a new skinned mesh.
	 *
	 * @param {BufferGeometry} [geometry] - The mesh geometry.
	 * @param {Material|Array<Material>} [material] - The mesh material.
	 */
	constructor( geometry, material ) {

		super( geometry, material );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isSkinnedMesh = true;

		this.type = 'SkinnedMesh';

		/**
		 * `AttachedBindMode` means the skinned mesh shares the same world space as the skeleton.
		 * This is not true when using `DetachedBindMode` which is useful when sharing a skeleton
		 * across multiple skinned meshes.
		 *
		 * @type {(AttachedBindMode|DetachedBindMode)}
		 * @default AttachedBindMode
		 */
		this.bindMode = AttachedBindMode;

		/**
		 * The base matrix that is used for the bound bone transforms.
		 *
		 * @type {Matrix4}
		 */
		this.bindMatrix = new Matrix4();

		/**
		 * The base matrix that is used for resetting the bound bone transforms.
		 *
		 * @type {Matrix4}
		 */
		this.bindMatrixInverse = new Matrix4();

		/**
		 * The bounding box of the skinned mesh. Can be computed via {@link SkinnedMesh#computeBoundingBox}.
		 *
		 * @type {?Box3}
		 * @default null
		 */
		this.boundingBox = null;

		/**
		 * The bounding sphere of the skinned mesh. Can be computed via {@link SkinnedMesh#computeBoundingSphere}.
		 *
		 * @type {?Sphere}
		 * @default null
		 */
		this.boundingSphere = null;

	}

	/**
	 * Computes the bounding box of the skinned mesh, and updates {@link SkinnedMesh#boundingBox}.
	 * The bounding box is not automatically computed by the engine; this method must be called by your app.
	 * If the skinned mesh is animated, the bounding box should be recomputed per frame in order to reflect
	 * the current animation state.
	 */
	computeBoundingBox() {

		const geometry = this.geometry;

		if ( this.boundingBox === null ) {

			this.boundingBox = new Box3();

		}

		this.boundingBox.makeEmpty();

		const positionAttribute = geometry.getAttribute( 'position' );

		for ( let i = 0; i < positionAttribute.count; i ++ ) {

			this.getVertexPosition( i, _vertex );
			this.boundingBox.expandByPoint( _vertex );

		}

	}

	/**
	 * Computes the bounding sphere of the skinned mesh, and updates {@link SkinnedMesh#boundingSphere}.
	 * The bounding sphere is automatically computed by the engine once when it is needed, e.g., for ray casting
	 * and view frustum culling. If the skinned mesh is animated, the bounding sphere should be recomputed
	 * per frame in order to reflect the current animation state.
	 */
	computeBoundingSphere() {

		const geometry = this.geometry;

		if ( this.boundingSphere === null ) {

			this.boundingSphere = new Sphere();

		}

		this.boundingSphere.makeEmpty();

		const positionAttribute = geometry.getAttribute( 'position' );

		for ( let i = 0; i < positionAttribute.count; i ++ ) {

			this.getVertexPosition( i, _vertex );
			this.boundingSphere.expandByPoint( _vertex );

		}

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.bindMode = source.bindMode;
		this.bindMatrix.copy( source.bindMatrix );
		this.bindMatrixInverse.copy( source.bindMatrixInverse );

		this.skeleton = source.skeleton;

		if ( source.boundingBox !== null ) this.boundingBox = source.boundingBox.clone();
		if ( source.boundingSphere !== null ) this.boundingSphere = source.boundingSphere.clone();

		return this;

	}

	raycast( raycaster, intersects ) {

		const material = this.material;
		const matrixWorld = this.matrixWorld;

		if ( material === undefined ) return;

		// test with bounding sphere in world space

		if ( this.boundingSphere === null ) this.computeBoundingSphere();

		_sphere$5.copy( this.boundingSphere );
		_sphere$5.applyMatrix4( matrixWorld );

		if ( raycaster.ray.intersectsSphere( _sphere$5 ) === false ) return;

		// convert ray to local space of skinned mesh

		_inverseMatrix$2.copy( matrixWorld ).invert();
		_ray$2.copy( raycaster.ray ).applyMatrix4( _inverseMatrix$2 );

		// test with bounding box in local space

		if ( this.boundingBox !== null ) {

			if ( _ray$2.intersectsBox( this.boundingBox ) === false ) return;

		}

		// test for intersections with geometry

		this._computeIntersections( raycaster, intersects, _ray$2 );

	}

	getVertexPosition( index, target ) {

		super.getVertexPosition( index, target );

		this.applyBoneTransform( index, target );

		return target;

	}

	/**
	 * Binds the given skeleton to the skinned mesh.
	 *
	 * @param {Skeleton} skeleton - The skeleton to bind.
	 * @param {Matrix4} [bindMatrix] - The bind matrix. If no bind matrix is provided,
	 * the skinned mesh's world matrix will be used instead.
	 */
	bind( skeleton, bindMatrix ) {

		this.skeleton = skeleton;

		if ( bindMatrix === undefined ) {

			this.updateMatrixWorld( true );

			this.skeleton.calculateInverses();

			bindMatrix = this.matrixWorld;

		}

		this.bindMatrix.copy( bindMatrix );
		this.bindMatrixInverse.copy( bindMatrix ).invert();

	}

	/**
	 * This method sets the skinned mesh in the rest pose).
	 */
	pose() {

		this.skeleton.pose();

	}

	/**
	 * Normalizes the skin weights which are defined as a buffer attribute
	 * in the skinned mesh's geometry.
	 */
	normalizeSkinWeights() {

		const vector = new Vector4();

		const skinWeight = this.geometry.attributes.skinWeight;

		for ( let i = 0, l = skinWeight.count; i < l; i ++ ) {

			vector.fromBufferAttribute( skinWeight, i );

			const scale = 1.0 / vector.manhattanLength();

			if ( scale !== Infinity ) {

				vector.multiplyScalar( scale );

			} else {

				vector.set( 1, 0, 0, 0 ); // do something reasonable

			}

			skinWeight.setXYZW( i, vector.x, vector.y, vector.z, vector.w );

		}

	}

	updateMatrixWorld( force ) {

		super.updateMatrixWorld( force );

		if ( this.bindMode === AttachedBindMode ) {

			this.bindMatrixInverse.copy( this.matrixWorld ).invert();

		} else if ( this.bindMode === DetachedBindMode ) {

			this.bindMatrixInverse.copy( this.bindMatrix ).invert();

		} else {

			console.warn( 'THREE.SkinnedMesh: Unrecognized bindMode: ' + this.bindMode );

		}

	}

	/**
	 * Applies the bone transform associated with the given index to the given
	 * vertex position. Returns the updated vector.
	 *
	 * @param {number} index - The vertex index.
	 * @param {Vector3} target - The target object that is used to store the method's result.
	 * the skinned mesh's world matrix will be used instead.
	 * @return {Vector3} The updated vertex position.
	 */
	applyBoneTransform( index, target ) {

		const skeleton = this.skeleton;
		const geometry = this.geometry;

		_skinIndex.fromBufferAttribute( geometry.attributes.skinIndex, index );
		_skinWeight.fromBufferAttribute( geometry.attributes.skinWeight, index );

		_basePosition.copy( target ).applyMatrix4( this.bindMatrix );

		target.set( 0, 0, 0 );

		for ( let i = 0; i < 4; i ++ ) {

			const weight = _skinWeight.getComponent( i );

			if ( weight !== 0 ) {

				const boneIndex = _skinIndex.getComponent( i );

				_matrix4.multiplyMatrices( skeleton.bones[ boneIndex ].matrixWorld, skeleton.boneInverses[ boneIndex ] );

				target.addScaledVector( _vector3.copy( _basePosition ).applyMatrix4( _matrix4 ), weight );

			}

		}

		return target.applyMatrix4( this.bindMatrixInverse );

	}

}

/**
 * A bone which is part of a {@link Skeleton}. The skeleton in turn is used by
 * the {@link SkinnedMesh}.
 *
 * ```js
 * const root = new THREE.Bone();
 * const child = new THREE.Bone();
 *
 * root.add( child );
 * child.position.y = 5;
 * ```
 *
 * @augments Object3D
 */
class Bone extends Object3D {

	/**
	 * Constructs a new bone.
	 */
	constructor() {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isBone = true;

		this.type = 'Bone';

	}

}

/**
 * Creates a texture directly from raw buffer data.
 *
 * The interpretation of the data depends on type and format: If the type is
 * `UnsignedByteType`, a `Uint8Array` will be useful for addressing the
 * texel data. If the format is `RGBAFormat`, data needs four values for
 * one texel; Red, Green, Blue and Alpha (typically the opacity).
 *
 * @augments Texture
 */
class DataTexture extends Texture {

	/**
	 * Constructs a new data texture.
	 *
	 * @param {?TypedArray} [data=null] - The buffer data.
	 * @param {number} [width=1] - The width of the texture.
	 * @param {number} [height=1] - The height of the texture.
	 * @param {number} [format=RGBAFormat] - The texture format.
	 * @param {number} [type=UnsignedByteType] - The texture type.
	 * @param {number} [mapping=Texture.DEFAULT_MAPPING] - The texture mapping.
	 * @param {number} [wrapS=ClampToEdgeWrapping] - The wrapS value.
	 * @param {number} [wrapT=ClampToEdgeWrapping] - The wrapT value.
	 * @param {number} [magFilter=NearestFilter] - The mag filter value.
	 * @param {number} [minFilter=NearestFilter] - The min filter value.
	 * @param {number} [anisotropy=Texture.DEFAULT_ANISOTROPY] - The anisotropy value.
	 * @param {string} [colorSpace=NoColorSpace] - The color space.
	 */
	constructor( data = null, width = 1, height = 1, format, type, mapping, wrapS, wrapT, magFilter = NearestFilter, minFilter = NearestFilter, anisotropy, colorSpace ) {

		super( null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isDataTexture = true;

		/**
		 * The image definition of a data texture.
		 *
		 * @type {{data:TypedArray,width:number,height:number}}
		 */
		this.image = { data: data, width: width, height: height };

		/**
		 * Whether to generate mipmaps (if possible) for a texture.
		 *
		 * Overwritten and set to `false` by default.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.generateMipmaps = false;

		/**
		 * If set to `true`, the texture is flipped along the vertical axis when
		 * uploaded to the GPU.
		 *
		 * Overwritten and set to `false` by default.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.flipY = false;

		/**
		 * Specifies the alignment requirements for the start of each pixel row in memory.
		 *
		 * Overwritten and set to `1` by default.
		 *
		 * @type {boolean}
		 * @default 1
		 */
		this.unpackAlignment = 1;

	}

}

const _offsetMatrix = /*@__PURE__*/ new Matrix4();
const _identityMatrix$1 = /*@__PURE__*/ new Matrix4();

/**
 * Class for representing the armatures in `three.js`. The skeleton
 * is defined by a hierarchy of bones.
 *
 * ```js
 * const bones = [];
 *
 * const shoulder = new THREE.Bone();
 * const elbow = new THREE.Bone();
 * const hand = new THREE.Bone();
 *
 * shoulder.add( elbow );
 * elbow.add( hand );
 *
 * bones.push( shoulder , elbow, hand);
 *
 * shoulder.position.y = -5;
 * elbow.position.y = 0;
 * hand.position.y = 5;
 *
 * const armSkeleton = new THREE.Skeleton( bones );
 * ```
 */
class Skeleton {

	/**
	 * Constructs a new skeleton.
	 *
	 * @param {Array<Bone>} [bones] - An array of bones.
	 * @param {Array<Matrix4>} [boneInverses] - An array of bone inverse matrices.
	 * If not provided, these matrices will be computed automatically via {@link Skeleton#calculateInverses}.
	 */
	constructor( bones = [], boneInverses = [] ) {

		this.uuid = generateUUID();

		/**
		 * An array of bones defining the skeleton.
		 *
		 * @type {Array<Bone>}
		 */
		this.bones = bones.slice( 0 );

		/**
		 * An array of bone inverse matrices.
		 *
		 * @type {Array<Matrix4>}
		 */
		this.boneInverses = boneInverses;

		/**
		 * An array buffer holding the bone data.
		 * Input data for {@link Skeleton#boneTexture}.
		 *
		 * @type {?Float32Array}
		 * @default null
		 */
		this.boneMatrices = null;

		/**
		 * A texture holding the bone data for use
		 * in the vertex shader.
		 *
		 * @type {?DataTexture}
		 * @default null
		 */
		this.boneTexture = null;

		this.init();

	}

	/**
	 * Initializes the skeleton. This method gets automatically called by the constructor
	 * but depending on how the skeleton is created it might be necessary to call this method
	 * manually.
	 */
	init() {

		const bones = this.bones;
		const boneInverses = this.boneInverses;

		this.boneMatrices = new Float32Array( bones.length * 16 );

		// calculate inverse bone matrices if necessary

		if ( boneInverses.length === 0 ) {

			this.calculateInverses();

		} else {

			// handle special case

			if ( bones.length !== boneInverses.length ) {

				console.warn( 'THREE.Skeleton: Number of inverse bone matrices does not match amount of bones.' );

				this.boneInverses = [];

				for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

					this.boneInverses.push( new Matrix4() );

				}

			}

		}

	}

	/**
	 * Computes the bone inverse matrices. This method resets {@link Skeleton#boneInverses}
	 * and fills it with new matrices.
	 */
	calculateInverses() {

		this.boneInverses.length = 0;

		for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

			const inverse = new Matrix4();

			if ( this.bones[ i ] ) {

				inverse.copy( this.bones[ i ].matrixWorld ).invert();

			}

			this.boneInverses.push( inverse );

		}

	}

	/**
	 * Resets the skeleton to the base pose.
	 */
	pose() {

		// recover the bind-time world matrices

		for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

			const bone = this.bones[ i ];

			if ( bone ) {

				bone.matrixWorld.copy( this.boneInverses[ i ] ).invert();

			}

		}

		// compute the local matrices, positions, rotations and scales

		for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

			const bone = this.bones[ i ];

			if ( bone ) {

				if ( bone.parent && bone.parent.isBone ) {

					bone.matrix.copy( bone.parent.matrixWorld ).invert();
					bone.matrix.multiply( bone.matrixWorld );

				} else {

					bone.matrix.copy( bone.matrixWorld );

				}

				bone.matrix.decompose( bone.position, bone.quaternion, bone.scale );

			}

		}

	}

	/**
	 * Resets the skeleton to the base pose.
	 */
	update() {

		const bones = this.bones;
		const boneInverses = this.boneInverses;
		const boneMatrices = this.boneMatrices;
		const boneTexture = this.boneTexture;

		// flatten bone matrices to array

		for ( let i = 0, il = bones.length; i < il; i ++ ) {

			// compute the offset between the current and the original transform

			const matrix = bones[ i ] ? bones[ i ].matrixWorld : _identityMatrix$1;

			_offsetMatrix.multiplyMatrices( matrix, boneInverses[ i ] );
			_offsetMatrix.toArray( boneMatrices, i * 16 );

		}

		if ( boneTexture !== null ) {

			boneTexture.needsUpdate = true;

		}

	}

	/**
	 * Returns a new skeleton with copied values from this instance.
	 *
	 * @return {Skeleton} A clone of this instance.
	 */
	clone() {

		return new Skeleton( this.bones, this.boneInverses );

	}

	/**
	 * Computes a data texture for passing bone data to the vertex shader.
	 *
	 * @return {Skeleton} A reference of this instance.
	 */
	computeBoneTexture() {

		// layout (1 matrix = 4 pixels)
		//      RGBA RGBA RGBA RGBA (=> column1, column2, column3, column4)
		//  with  8x8  pixel texture max   16 bones * 4 pixels =  (8 * 8)
		//       16x16 pixel texture max   64 bones * 4 pixels = (16 * 16)
		//       32x32 pixel texture max  256 bones * 4 pixels = (32 * 32)
		//       64x64 pixel texture max 1024 bones * 4 pixels = (64 * 64)

		let size = Math.sqrt( this.bones.length * 4 ); // 4 pixels needed for 1 matrix
		size = Math.ceil( size / 4 ) * 4;
		size = Math.max( size, 4 );

		const boneMatrices = new Float32Array( size * size * 4 ); // 4 floats per RGBA pixel
		boneMatrices.set( this.boneMatrices ); // copy current values

		const boneTexture = new DataTexture( boneMatrices, size, size, RGBAFormat, FloatType );
		boneTexture.needsUpdate = true;

		this.boneMatrices = boneMatrices;
		this.boneTexture = boneTexture;

		return this;

	}

	/**
	 * Searches through the skeleton's bone array and returns the first with a
	 * matching name.
	 *
	 * @param {string} name - The name of the bone.
	 * @return {Bone|undefined} The found bone. `undefined` if no bone has been found.
	 */
	getBoneByName( name ) {

		for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

			const bone = this.bones[ i ];

			if ( bone.name === name ) {

				return bone;

			}

		}

		return undefined;

	}

	/**
	 * Frees the GPU-related resources allocated by this instance. Call this
	 * method whenever this instance is no longer used in your app.
	 */
	dispose( ) {

		if ( this.boneTexture !== null ) {

			this.boneTexture.dispose();

			this.boneTexture = null;

		}

	}

	/**
	 * Setups the skeleton by the given JSON and bones.
	 *
	 * @param {Object} json - The skeleton as serialized JSON.
	 * @param {Object<string, Bone>} bones - An array of bones.
	 * @return {Skeleton} A reference of this instance.
	 */
	fromJSON( json, bones ) {

		this.uuid = json.uuid;

		for ( let i = 0, l = json.bones.length; i < l; i ++ ) {

			const uuid = json.bones[ i ];
			let bone = bones[ uuid ];

			if ( bone === undefined ) {

				console.warn( 'THREE.Skeleton: No bone found with UUID:', uuid );
				bone = new Bone();

			}

			this.bones.push( bone );
			this.boneInverses.push( new Matrix4().fromArray( json.boneInverses[ i ] ) );

		}

		this.init();

		return this;

	}

	/**
	 * Serializes the skeleton into JSON.
	 *
	 * @return {Object} A JSON object representing the serialized skeleton.
	 * @see {@link ObjectLoader#parse}
	 */
	toJSON() {

		const data = {
			metadata: {
				version: 4.6,
				type: 'Skeleton',
				generator: 'Skeleton.toJSON'
			},
			bones: [],
			boneInverses: []
		};

		data.uuid = this.uuid;

		const bones = this.bones;
		const boneInverses = this.boneInverses;

		for ( let i = 0, l = bones.length; i < l; i ++ ) {

			const bone = bones[ i ];
			data.bones.push( bone.uuid );

			const boneInverse = boneInverses[ i ];
			data.boneInverses.push( boneInverse.toArray() );

		}

		return data;

	}

}

/**
 * An instanced version of a buffer attribute.
 *
 * @augments BufferAttribute
 */
class InstancedBufferAttribute extends BufferAttribute {

	/**
	 * Constructs a new instanced buffer attribute.
	 *
	 * @param {TypedArray} array - The array holding the attribute data.
	 * @param {number} itemSize - The item size.
	 * @param {boolean} [normalized=false] - Whether the data are normalized or not.
	 * @param {number} [meshPerAttribute=1] - How often a value of this buffer attribute should be repeated.
	 */
	constructor( array, itemSize, normalized, meshPerAttribute = 1 ) {

		super( array, itemSize, normalized );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isInstancedBufferAttribute = true;

		/**
		 * Defines how often a value of this buffer attribute should be repeated. A
		 * value of one means that each value of the instanced attribute is used for
		 * a single instance. A value of two means that each value is used for two
		 * consecutive instances (and so on).
		 *
		 * @type {number}
		 * @default 1
		 */
		this.meshPerAttribute = meshPerAttribute;

	}

	copy( source ) {

		super.copy( source );

		this.meshPerAttribute = source.meshPerAttribute;

		return this;

	}

	toJSON() {

		const data = super.toJSON();

		data.meshPerAttribute = this.meshPerAttribute;

		data.isInstancedBufferAttribute = true;

		return data;

	}

}

const _instanceLocalMatrix = /*@__PURE__*/ new Matrix4();
const _instanceWorldMatrix = /*@__PURE__*/ new Matrix4();

const _instanceIntersects = [];

const _box3 = /*@__PURE__*/ new Box3();
const _identity = /*@__PURE__*/ new Matrix4();
const _mesh$1 = /*@__PURE__*/ new Mesh();
const _sphere$4 = /*@__PURE__*/ new Sphere();

/**
 * A special version of a mesh with instanced rendering support. Use
 * this class if you have to render a large number of objects with the same
 * geometry and material(s) but with different world transformations. The usage
 * of 'InstancedMesh' will help you to reduce the number of draw calls and thus
 * improve the overall rendering performance in your application.
 *
 * @augments Mesh
 */
class InstancedMesh extends Mesh {

	/**
	 * Constructs a new instanced mesh.
	 *
	 * @param {BufferGeometry} [geometry] - The mesh geometry.
	 * @param {Material|Array<Material>} [material] - The mesh material.
	 * @param {number} count - The number of instances.
	 */
	constructor( geometry, material, count ) {

		super( geometry, material );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isInstancedMesh = true;

		/**
		 * Represents the local transformation of all instances. You have to set its
		 * {@link BufferAttribute#needsUpdate} flag to true if you modify instanced data
		 * via {@link InstancedMesh#setMatrixAt}.
		 *
		 * @type {InstancedBufferAttribute}
		 */
		this.instanceMatrix = new InstancedBufferAttribute( new Float32Array( count * 16 ), 16 );

		/**
		 * Represents the color of all instances. You have to set its
		 * {@link BufferAttribute#needsUpdate} flag to true if you modify instanced data
		 * via {@link InstancedMesh#setColorAt}.
		 *
		 * @type {?InstancedBufferAttribute}
		 * @default null
		 */
		this.instanceColor = null;

		/**
		 * Represents the morph target weights of all instances. You have to set its
		 * {@link Texture#needsUpdate} flag to true if you modify instanced data
		 * via {@link InstancedMesh#setMorphAt}.
		 *
		 * @type {?DataTexture}
		 * @default null
		 */
		this.morphTexture = null;

		/**
		 * The number of instances.
		 *
		 * @type {number}
		 */
		this.count = count;

		/**
		 * The bounding box of the instanced mesh. Can be computed via {@link InstancedMesh#computeBoundingBox}.
		 *
		 * @type {?Box3}
		 * @default null
		 */
		this.boundingBox = null;

		/**
		 * The bounding sphere of the instanced mesh. Can be computed via {@link InstancedMesh#computeBoundingSphere}.
		 *
		 * @type {?Sphere}
		 * @default null
		 */
		this.boundingSphere = null;

		for ( let i = 0; i < count; i ++ ) {

			this.setMatrixAt( i, _identity );

		}

	}

	/**
	 * Computes the bounding box of the instanced mesh, and updates {@link InstancedMesh#boundingBox}.
	 * The bounding box is not automatically computed by the engine; this method must be called by your app.
	 * You may need to recompute the bounding box if an instance is transformed via {@link InstancedMesh#setMatrixAt}.
	 */
	computeBoundingBox() {

		const geometry = this.geometry;
		const count = this.count;

		if ( this.boundingBox === null ) {

			this.boundingBox = new Box3();

		}

		if ( geometry.boundingBox === null ) {

			geometry.computeBoundingBox();

		}

		this.boundingBox.makeEmpty();

		for ( let i = 0; i < count; i ++ ) {

			this.getMatrixAt( i, _instanceLocalMatrix );

			_box3.copy( geometry.boundingBox ).applyMatrix4( _instanceLocalMatrix );

			this.boundingBox.union( _box3 );

		}

	}

	/**
	 * Computes the bounding sphere of the instanced mesh, and updates {@link InstancedMesh#boundingSphere}
	 * The engine automatically computes the bounding sphere when it is needed, e.g., for ray casting or view frustum culling.
	 * You may need to recompute the bounding sphere if an instance is transformed via {@link InstancedMesh#setMatrixAt}.
	 */
	computeBoundingSphere() {

		const geometry = this.geometry;
		const count = this.count;

		if ( this.boundingSphere === null ) {

			this.boundingSphere = new Sphere();

		}

		if ( geometry.boundingSphere === null ) {

			geometry.computeBoundingSphere();

		}

		this.boundingSphere.makeEmpty();

		for ( let i = 0; i < count; i ++ ) {

			this.getMatrixAt( i, _instanceLocalMatrix );

			_sphere$4.copy( geometry.boundingSphere ).applyMatrix4( _instanceLocalMatrix );

			this.boundingSphere.union( _sphere$4 );

		}

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.instanceMatrix.copy( source.instanceMatrix );

		if ( source.morphTexture !== null ) this.morphTexture = source.morphTexture.clone();
		if ( source.instanceColor !== null ) this.instanceColor = source.instanceColor.clone();

		this.count = source.count;

		if ( source.boundingBox !== null ) this.boundingBox = source.boundingBox.clone();
		if ( source.boundingSphere !== null ) this.boundingSphere = source.boundingSphere.clone();

		return this;

	}

	/**
	 * Gets the color of the defined instance.
	 *
	 * @param {number} index - The instance index.
	 * @param {Color} color - The target object that is used to store the method's result.
	 */
	getColorAt( index, color ) {

		color.fromArray( this.instanceColor.array, index * 3 );

	}

	/**
	 * Gets the local transformation matrix of the defined instance.
	 *
	 * @param {number} index - The instance index.
	 * @param {Matrix4} matrix - The target object that is used to store the method's result.
	 */
	getMatrixAt( index, matrix ) {

		matrix.fromArray( this.instanceMatrix.array, index * 16 );

	}

	/**
	 * Gets the morph target weights of the defined instance.
	 *
	 * @param {number} index - The instance index.
	 * @param {Mesh} object - The target object that is used to store the method's result.
	 */
	getMorphAt( index, object ) {

		const objectInfluences = object.morphTargetInfluences;

		const array = this.morphTexture.source.data.data;

		const len = objectInfluences.length + 1; // All influences + the baseInfluenceSum

		const dataIndex = index * len + 1; // Skip the baseInfluenceSum at the beginning

		for ( let i = 0; i < objectInfluences.length; i ++ ) {

			objectInfluences[ i ] = array[ dataIndex + i ];

		}

	}

	raycast( raycaster, intersects ) {

		const matrixWorld = this.matrixWorld;
		const raycastTimes = this.count;

		_mesh$1.geometry = this.geometry;
		_mesh$1.material = this.material;

		if ( _mesh$1.material === undefined ) return;

		// test with bounding sphere first

		if ( this.boundingSphere === null ) this.computeBoundingSphere();

		_sphere$4.copy( this.boundingSphere );
		_sphere$4.applyMatrix4( matrixWorld );

		if ( raycaster.ray.intersectsSphere( _sphere$4 ) === false ) return;

		// now test each instance

		for ( let instanceId = 0; instanceId < raycastTimes; instanceId ++ ) {

			// calculate the world matrix for each instance

			this.getMatrixAt( instanceId, _instanceLocalMatrix );

			_instanceWorldMatrix.multiplyMatrices( matrixWorld, _instanceLocalMatrix );

			// the mesh represents this single instance

			_mesh$1.matrixWorld = _instanceWorldMatrix;

			_mesh$1.raycast( raycaster, _instanceIntersects );

			// process the result of raycast

			for ( let i = 0, l = _instanceIntersects.length; i < l; i ++ ) {

				const intersect = _instanceIntersects[ i ];
				intersect.instanceId = instanceId;
				intersect.object = this;
				intersects.push( intersect );

			}

			_instanceIntersects.length = 0;

		}

	}

	/**
	 * Sets the given color to the defined instance. Make sure you set the `needsUpdate` flag of
	 * {@link InstancedMesh#instanceColor} to `true` after updating all the colors.
	 *
	 * @param {number} index - The instance index.
	 * @param {Color} color - The instance color.
	 */
	setColorAt( index, color ) {

		if ( this.instanceColor === null ) {

			this.instanceColor = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 3 ).fill( 1 ), 3 );

		}

		color.toArray( this.instanceColor.array, index * 3 );

	}

	/**
	 * Sets the given local transformation matrix to the defined instance. Make sure you set the `needsUpdate` flag of
	 * {@link InstancedMesh#instanceMatrix} to `true` after updating all the colors.
	 *
	 * @param {number} index - The instance index.
	 * @param {Matrix4} matrix - The local transformation.
	 */
	setMatrixAt( index, matrix ) {

		matrix.toArray( this.instanceMatrix.array, index * 16 );

	}

	/**
	 * Sets the morph target weights to the defined instance. Make sure you set the `needsUpdate` flag of
	 * {@link InstancedMesh#morphTexture} to `true` after updating all the influences.
	 *
	 * @param {number} index - The instance index.
	 * @param {Mesh} object -  A mesh which `morphTargetInfluences` property containing the morph target weights
	 * of a single instance.
	 */
	setMorphAt( index, object ) {

		const objectInfluences = object.morphTargetInfluences;

		const len = objectInfluences.length + 1; // morphBaseInfluence + all influences

		if ( this.morphTexture === null ) {

			this.morphTexture = new DataTexture( new Float32Array( len * this.count ), len, this.count, RedFormat, FloatType );

		}

		const array = this.morphTexture.source.data.data;

		let morphInfluencesSum = 0;

		for ( let i = 0; i < objectInfluences.length; i ++ ) {

			morphInfluencesSum += objectInfluences[ i ];

		}

		const morphBaseInfluence = this.geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;

		const dataIndex = len * index;

		array[ dataIndex ] = morphBaseInfluence;

		array.set( objectInfluences, dataIndex + 1 );

	}

	updateMorphTargets() {

	}

	/**
	 * Frees the GPU-related resources allocated by this instance. Call this
	 * method whenever this instance is no longer used in your app.
	 */
	dispose() {

		this.dispatchEvent( { type: 'dispose' } );

		if ( this.morphTexture !== null ) {

			this.morphTexture.dispose();
			this.morphTexture = null;

		}

	}

}

const _vector1 = /*@__PURE__*/ new Vector3();
const _vector2 = /*@__PURE__*/ new Vector3();
const _normalMatrix = /*@__PURE__*/ new Matrix3();

/**
 * A two dimensional surface that extends infinitely in 3D space, represented
 * in [Hessian normal form]{@link http://mathworld.wolfram.com/HessianNormalForm.html}
 * by a unit length normal vector and a constant.
 */
class Plane {

	/**
	 * Constructs a new plane.
	 *
	 * @param {Vector3} [normal=(1,0,0)] - A unit length vector defining the normal of the plane.
	 * @param {number} [constant=0] - The signed distance from the origin to the plane.
	 */
	constructor( normal = new Vector3( 1, 0, 0 ), constant = 0 ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isPlane = true;

		/**
		 * A unit length vector defining the normal of the plane.
		 *
		 * @type {Vector3}
		 */
		this.normal = normal;

		/**
		 * The signed distance from the origin to the plane.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.constant = constant;

	}

	/**
	 * Sets the plane components by copying the given values.
	 *
	 * @param {Vector3} normal - The normal.
	 * @param {number} constant - The constant.
	 * @return {Plane} A reference to this plane.
	 */
	set( normal, constant ) {

		this.normal.copy( normal );
		this.constant = constant;

		return this;

	}

	/**
	 * Sets the plane components by defining `x`, `y`, `z` as the
	 * plane normal and `w` as the constant.
	 *
	 * @param {number} x - The value for the normal's x component.
	 * @param {number} y - The value for the normal's y component.
	 * @param {number} z - The value for the normal's z component.
	 * @param {number} w - The constant value.
	 * @return {Plane} A reference to this plane.
	 */
	setComponents( x, y, z, w ) {

		this.normal.set( x, y, z );
		this.constant = w;

		return this;

	}

	/**
	 * Sets the plane from the given normal and coplanar point (that is a point
	 * that lies onto the plane).
	 *
	 * @param {Vector3} normal - The normal.
	 * @param {Vector3} point - A coplanar point.
	 * @return {Plane} A reference to this plane.
	 */
	setFromNormalAndCoplanarPoint( normal, point ) {

		this.normal.copy( normal );
		this.constant = - point.dot( this.normal );

		return this;

	}

	/**
	 * Sets the plane from three coplanar points. The winding order is
	 * assumed to be counter-clockwise, and determines the direction of
	 * the plane normal.
	 *
	 * @param {Vector3} a - The first coplanar point.
	 * @param {Vector3} b - The second coplanar point.
	 * @param {Vector3} c - The third coplanar point.
	 * @return {Plane} A reference to this plane.
	 */
	setFromCoplanarPoints( a, b, c ) {

		const normal = _vector1.subVectors( c, b ).cross( _vector2.subVectors( a, b ) ).normalize();

		// Q: should an error be thrown if normal is zero (e.g. degenerate plane)?

		this.setFromNormalAndCoplanarPoint( normal, a );

		return this;

	}

	/**
	 * Copies the values of the given plane to this instance.
	 *
	 * @param {Plane} plane - The plane to copy.
	 * @return {Plane} A reference to this plane.
	 */
	copy( plane ) {

		this.normal.copy( plane.normal );
		this.constant = plane.constant;

		return this;

	}

	/**
	 * Normalizes the plane normal and adjusts the constant accordingly.
	 *
	 * @return {Plane} A reference to this plane.
	 */
	normalize() {

		// Note: will lead to a divide by zero if the plane is invalid.

		const inverseNormalLength = 1.0 / this.normal.length();
		this.normal.multiplyScalar( inverseNormalLength );
		this.constant *= inverseNormalLength;

		return this;

	}

	/**
	 * Negates both the plane normal and the constant.
	 *
	 * @return {Plane} A reference to this plane.
	 */
	negate() {

		this.constant *= -1;
		this.normal.negate();

		return this;

	}

	/**
	 * Returns the signed distance from the given point to this plane.
	 *
	 * @param {Vector3} point - The point to compute the distance for.
	 * @return {number} The signed distance.
	 */
	distanceToPoint( point ) {

		return this.normal.dot( point ) + this.constant;

	}

	/**
	 * Returns the signed distance from the given sphere to this plane.
	 *
	 * @param {Sphere} sphere - The sphere to compute the distance for.
	 * @return {number} The signed distance.
	 */
	distanceToSphere( sphere ) {

		return this.distanceToPoint( sphere.center ) - sphere.radius;

	}

	/**
	 * Projects a the given point onto the plane.
	 *
	 * @param {Vector3} point - The point to project.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The projected point on the plane.
	 */
	projectPoint( point, target ) {

		return target.copy( point ).addScaledVector( this.normal, - this.distanceToPoint( point ) );

	}

	/**
	 * Returns the intersection point of the passed line and the plane. Returns
	 * `null` if the line does not intersect. Returns the line's starting point if
	 * the line is coplanar with the plane.
	 *
	 * @param {Line3} line - The line to compute the intersection for.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {?Vector3} The intersection point.
	 */
	intersectLine( line, target ) {

		const direction = line.delta( _vector1 );

		const denominator = this.normal.dot( direction );

		if ( denominator === 0 ) {

			// line is coplanar, return origin
			if ( this.distanceToPoint( line.start ) === 0 ) {

				return target.copy( line.start );

			}

			// Unsure if this is the correct method to handle this case.
			return null;

		}

		const t = - ( line.start.dot( this.normal ) + this.constant ) / denominator;

		if ( t < 0 || t > 1 ) {

			return null;

		}

		return target.copy( line.start ).addScaledVector( direction, t );

	}

	/**
	 * Returns `true` if the given line segment intersects with (passes through) the plane.
	 *
	 * @param {Line3} line - The line to test.
	 * @return {boolean} Whether the given line segment intersects with the plane or not.
	 */
	intersectsLine( line ) {

		// Note: this tests if a line intersects the plane, not whether it (or its end-points) are coplanar with it.

		const startSign = this.distanceToPoint( line.start );
		const endSign = this.distanceToPoint( line.end );

		return ( startSign < 0 && endSign > 0 ) || ( endSign < 0 && startSign > 0 );

	}

	/**
	 * Returns `true` if the given bounding box intersects with the plane.
	 *
	 * @param {Box3} box - The bounding box to test.
	 * @return {boolean} Whether the given bounding box intersects with the plane or not.
	 */
	intersectsBox( box ) {

		return box.intersectsPlane( this );

	}

	/**
	 * Returns `true` if the given bounding sphere intersects with the plane.
	 *
	 * @param {Sphere} sphere - The bounding sphere to test.
	 * @return {boolean} Whether the given bounding sphere intersects with the plane or not.
	 */
	intersectsSphere( sphere ) {

		return sphere.intersectsPlane( this );

	}

	/**
	 * Returns a coplanar vector to the plane, by calculating the
	 * projection of the normal at the origin onto the plane.
	 *
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The coplanar point.
	 */
	coplanarPoint( target ) {

		return target.copy( this.normal ).multiplyScalar( - this.constant );

	}

	/**
	 * Apply a 4x4 matrix to the plane. The matrix must be an affine, homogeneous transform.
	 *
	 * The optional normal matrix can be pre-computed like so:
	 * ```js
	 * const optionalNormalMatrix = new THREE.Matrix3().getNormalMatrix( matrix );
	 * ```
	 *
	 * @param {Matrix4} matrix - The transformation matrix.
	 * @param {Matrix4} [optionalNormalMatrix] - A pre-computed normal matrix.
	 * @return {Plane} A reference to this plane.
	 */
	applyMatrix4( matrix, optionalNormalMatrix ) {

		const normalMatrix = optionalNormalMatrix || _normalMatrix.getNormalMatrix( matrix );

		const referencePoint = this.coplanarPoint( _vector1 ).applyMatrix4( matrix );

		const normal = this.normal.applyMatrix3( normalMatrix ).normalize();

		this.constant = - referencePoint.dot( normal );

		return this;

	}

	/**
	 * Translates the plane by the distance defined by the given offset vector.
	 * Note that this only affects the plane constant and will not affect the normal vector.
	 *
	 * @param {Vector3} offset - The offset vector.
	 * @return {Plane} A reference to this plane.
	 */
	translate( offset ) {

		this.constant -= offset.dot( this.normal );

		return this;

	}

	/**
	 * Returns `true` if this plane is equal with the given one.
	 *
	 * @param {Plane} plane - The plane to test for equality.
	 * @return {boolean} Whether this plane is equal with the given one.
	 */
	equals( plane ) {

		return plane.normal.equals( this.normal ) && ( plane.constant === this.constant );

	}

	/**
	 * Returns a new plane with copied values from this instance.
	 *
	 * @return {Plane} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

}

const _sphere$3 = /*@__PURE__*/ new Sphere();
const _vector$6 = /*@__PURE__*/ new Vector3();

/**
 * Frustums are used to determine what is inside the camera's field of view.
 * They help speed up the rendering process - objects which lie outside a camera's
 * frustum can safely be excluded from rendering.
 *
 * This class is mainly intended for use internally by a renderer.
 */
class Frustum {

	/**
	 * Constructs a new frustum.
	 *
	 * @param {Plane} [p0] - The first plane that encloses the frustum.
	 * @param {Plane} [p1] - The second plane that encloses the frustum.
	 * @param {Plane} [p2] - The third plane that encloses the frustum.
	 * @param {Plane} [p3] - The fourth plane that encloses the frustum.
	 * @param {Plane} [p4] - The fifth plane that encloses the frustum.
	 * @param {Plane} [p5] - The sixth plane that encloses the frustum.
	 */
	constructor( p0 = new Plane(), p1 = new Plane(), p2 = new Plane(), p3 = new Plane(), p4 = new Plane(), p5 = new Plane() ) {

		/**
		 * This array holds the planes that enclose the frustum.
		 *
		 * @type {Array<Plane>}
		 */
		this.planes = [ p0, p1, p2, p3, p4, p5 ];

	}

	/**
	 * Sets the frustum planes by copying the given planes.
	 *
	 * @param {Plane} [p0] - The first plane that encloses the frustum.
	 * @param {Plane} [p1] - The second plane that encloses the frustum.
	 * @param {Plane} [p2] - The third plane that encloses the frustum.
	 * @param {Plane} [p3] - The fourth plane that encloses the frustum.
	 * @param {Plane} [p4] - The fifth plane that encloses the frustum.
	 * @param {Plane} [p5] - The sixth plane that encloses the frustum.
	 * @return {Frustum} A reference to this frustum.
	 */
	set( p0, p1, p2, p3, p4, p5 ) {

		const planes = this.planes;

		planes[ 0 ].copy( p0 );
		planes[ 1 ].copy( p1 );
		planes[ 2 ].copy( p2 );
		planes[ 3 ].copy( p3 );
		planes[ 4 ].copy( p4 );
		planes[ 5 ].copy( p5 );

		return this;

	}

	/**
	 * Copies the values of the given frustum to this instance.
	 *
	 * @param {Frustum} frustum - The frustum to copy.
	 * @return {Frustum} A reference to this frustum.
	 */
	copy( frustum ) {

		const planes = this.planes;

		for ( let i = 0; i < 6; i ++ ) {

			planes[ i ].copy( frustum.planes[ i ] );

		}

		return this;

	}

	/**
	 * Sets the frustum planes from the given projection matrix.
	 *
	 * @param {Matrix4} m - The projection matrix.
	 * @param {(WebGLCoordinateSystem|WebGPUCoordinateSystem)} coordinateSystem - The coordinate system.
	 * @return {Frustum} A reference to this frustum.
	 */
	setFromProjectionMatrix( m, coordinateSystem = WebGLCoordinateSystem ) {

		const planes = this.planes;
		const me = m.elements;
		const me0 = me[ 0 ], me1 = me[ 1 ], me2 = me[ 2 ], me3 = me[ 3 ];
		const me4 = me[ 4 ], me5 = me[ 5 ], me6 = me[ 6 ], me7 = me[ 7 ];
		const me8 = me[ 8 ], me9 = me[ 9 ], me10 = me[ 10 ], me11 = me[ 11 ];
		const me12 = me[ 12 ], me13 = me[ 13 ], me14 = me[ 14 ], me15 = me[ 15 ];

		planes[ 0 ].setComponents( me3 - me0, me7 - me4, me11 - me8, me15 - me12 ).normalize();
		planes[ 1 ].setComponents( me3 + me0, me7 + me4, me11 + me8, me15 + me12 ).normalize();
		planes[ 2 ].setComponents( me3 + me1, me7 + me5, me11 + me9, me15 + me13 ).normalize();
		planes[ 3 ].setComponents( me3 - me1, me7 - me5, me11 - me9, me15 - me13 ).normalize();
		planes[ 4 ].setComponents( me3 - me2, me7 - me6, me11 - me10, me15 - me14 ).normalize();

		if ( coordinateSystem === WebGLCoordinateSystem ) {

			planes[ 5 ].setComponents( me3 + me2, me7 + me6, me11 + me10, me15 + me14 ).normalize();

		} else if ( coordinateSystem === WebGPUCoordinateSystem ) {

			planes[ 5 ].setComponents( me2, me6, me10, me14 ).normalize();

		} else {

			throw new Error( 'THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: ' + coordinateSystem );

		}

		return this;

	}

	/**
	 * Returns `true` if the 3D object's bounding sphere is intersecting this frustum.
	 *
	 * Note that the 3D object must have a geometry so that the bounding sphere can be calculated.
	 *
	 * @param {Object3D} object - The 3D object to test.
	 * @return {boolean} Whether the 3D object's bounding sphere is intersecting this frustum or not.
	 */
	intersectsObject( object ) {

		if ( object.boundingSphere !== undefined ) {

			if ( object.boundingSphere === null ) object.computeBoundingSphere();

			_sphere$3.copy( object.boundingSphere ).applyMatrix4( object.matrixWorld );

		} else {

			const geometry = object.geometry;

			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

			_sphere$3.copy( geometry.boundingSphere ).applyMatrix4( object.matrixWorld );

		}

		return this.intersectsSphere( _sphere$3 );

	}

	/**
	 * Returns `true` if the given sprite is intersecting this frustum.
	 *
	 * @param {Sprite} sprite - The sprite to test.
	 * @return {boolean} Whether the sprite is intersecting this frustum or not.
	 */
	intersectsSprite( sprite ) {

		_sphere$3.center.set( 0, 0, 0 );
		_sphere$3.radius = 0.7071067811865476;
		_sphere$3.applyMatrix4( sprite.matrixWorld );

		return this.intersectsSphere( _sphere$3 );

	}

	/**
	 * Returns `true` if the given bounding sphere is intersecting this frustum.
	 *
	 * @param {Sphere} sphere - The bounding sphere to test.
	 * @return {boolean} Whether the bounding sphere is intersecting this frustum or not.
	 */
	intersectsSphere( sphere ) {

		const planes = this.planes;
		const center = sphere.center;
		const negRadius = - sphere.radius;

		for ( let i = 0; i < 6; i ++ ) {

			const distance = planes[ i ].distanceToPoint( center );

			if ( distance < negRadius ) {

				return false;

			}

		}

		return true;

	}

	/**
	 * Returns `true` if the given bounding box is intersecting this frustum.
	 *
	 * @param {Box3} box - The bounding box to test.
	 * @return {boolean} Whether the bounding box is intersecting this frustum or not.
	 */
	intersectsBox( box ) {

		const planes = this.planes;

		for ( let i = 0; i < 6; i ++ ) {

			const plane = planes[ i ];

			// corner at max distance

			_vector$6.x = plane.normal.x > 0 ? box.max.x : box.min.x;
			_vector$6.y = plane.normal.y > 0 ? box.max.y : box.min.y;
			_vector$6.z = plane.normal.z > 0 ? box.max.z : box.min.z;

			if ( plane.distanceToPoint( _vector$6 ) < 0 ) {

				return false;

			}

		}

		return true;

	}

	/**
	 * Returns `true` if the given point lies within the frustum.
	 *
	 * @param {Vector3} point - The point to test.
	 * @return {boolean} Whether the point lies within this frustum or not.
	 */
	containsPoint( point ) {

		const planes = this.planes;

		for ( let i = 0; i < 6; i ++ ) {

			if ( planes[ i ].distanceToPoint( point ) < 0 ) {

				return false;

			}

		}

		return true;

	}

	/**
	 * Returns a new frustum with copied values from this instance.
	 *
	 * @return {Frustum} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

}

/**
 * A material for rendering line primitives.
 *
 * Materials define the appearance of renderable 3D objects.
 *
 * ```js
 * const material = new THREE.LineBasicMaterial( { color: 0xffffff } );
 * ```
 *
 * @augments Material
 */
class LineBasicMaterial extends Material {

	/**
	 * Constructs a new line basic material.
	 *
	 * @param {Object} [parameters] - An object with one or more properties
	 * defining the material's appearance. Any property of the material
	 * (including any property from inherited materials) can be passed
	 * in here. Color values can be passed any type of value accepted
	 * by {@link Color#set}.
	 */
	constructor( parameters ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isLineBasicMaterial = true;

		this.type = 'LineBasicMaterial';

		/**
		 * Color of the material.
		 *
		 * @type {Color}
		 * @default (1,1,1)
		 */
		this.color = new Color( 0xffffff );

		/**
		 * Sets the color of the lines using data from a texture. The texture map
		 * color is modulated by the diffuse `color`.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.map = null;

		/**
		 * Controls line thickness or lines.
		 *
		 * Can only be used with {@link SVGRenderer}. WebGL and WebGPU
		 * ignore this setting and always render line primitives with a
		 * width of one pixel.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.linewidth = 1;

		/**
		 * Defines appearance of line ends.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {('butt'|'round'|'square')}
		 * @default 'round'
		 */
		this.linecap = 'round';

		/**
		 * Defines appearance of line joints.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {('round'|'bevel'|'miter')}
		 * @default 'round'
		 */
		this.linejoin = 'round';

		/**
		 * Whether the material is affected by fog or not.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.fog = true;

		this.setValues( parameters );

	}

	copy( source ) {

		super.copy( source );

		this.color.copy( source.color );

		this.map = source.map;

		this.linewidth = source.linewidth;
		this.linecap = source.linecap;
		this.linejoin = source.linejoin;

		this.fog = source.fog;

		return this;

	}

}

const _vStart = /*@__PURE__*/ new Vector3();
const _vEnd = /*@__PURE__*/ new Vector3();

const _inverseMatrix$1 = /*@__PURE__*/ new Matrix4();
const _ray$1 = /*@__PURE__*/ new Ray();
const _sphere$1 = /*@__PURE__*/ new Sphere();

const _intersectPointOnRay = /*@__PURE__*/ new Vector3();
const _intersectPointOnSegment = /*@__PURE__*/ new Vector3();

/**
 * A continuous line. The line are rendered by connecting consecutive
 * vertices with straight lines.
 *
 * ```js
 * const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
 *
 * const points = [];
 * points.push( new THREE.Vector3( - 10, 0, 0 ) );
 * points.push( new THREE.Vector3( 0, 10, 0 ) );
 * points.push( new THREE.Vector3( 10, 0, 0 ) );
 *
 * const geometry = new THREE.BufferGeometry().setFromPoints( points );
 *
 * const line = new THREE.Line( geometry, material );
 * scene.add( line );
 * ```
 *
 * @augments Object3D
 */
class Line extends Object3D {

	/**
	 * Constructs a new line.
	 *
	 * @param {BufferGeometry} [geometry] - The line geometry.
	 * @param {Material|Array<Material>} [material] - The line material.
	 */
	constructor( geometry = new BufferGeometry(), material = new LineBasicMaterial() ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isLine = true;

		this.type = 'Line';

		/**
		 * The line geometry.
		 *
		 * @type {BufferGeometry}
		 */
		this.geometry = geometry;

		/**
		 * The line material.
		 *
		 * @type {Material|Array<Material>}
		 * @default LineBasicMaterial
		 */
		this.material = material;

		/**
		 * A dictionary representing the morph targets in the geometry. The key is the
		 * morph targets name, the value its attribute index. This member is `undefined`
		 * by default and only set when morph targets are detected in the geometry.
		 *
		 * @type {Object<String,number>|undefined}
		 * @default undefined
		 */
		this.morphTargetDictionary = undefined;

		/**
		 * An array of weights typically in the range `[0,1]` that specify how much of the morph
		 * is applied. This member is `undefined` by default and only set when morph targets are
		 * detected in the geometry.
		 *
		 * @type {Array<number>|undefined}
		 * @default undefined
		 */
		this.morphTargetInfluences = undefined;

		this.updateMorphTargets();

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.material = Array.isArray( source.material ) ? source.material.slice() : source.material;
		this.geometry = source.geometry;

		return this;

	}

	/**
	 * Computes an array of distance values which are necessary for rendering dashed lines.
	 * For each vertex in the geometry, the method calculates the cumulative length from the
	 * current point to the very beginning of the line.
	 *
	 * @return {Line} A reference to this line.
	 */
	computeLineDistances() {

		const geometry = this.geometry;

		// we assume non-indexed geometry

		if ( geometry.index === null ) {

			const positionAttribute = geometry.attributes.position;
			const lineDistances = [ 0 ];

			for ( let i = 1, l = positionAttribute.count; i < l; i ++ ) {

				_vStart.fromBufferAttribute( positionAttribute, i - 1 );
				_vEnd.fromBufferAttribute( positionAttribute, i );

				lineDistances[ i ] = lineDistances[ i - 1 ];
				lineDistances[ i ] += _vStart.distanceTo( _vEnd );

			}

			geometry.setAttribute( 'lineDistance', new Float32BufferAttribute( lineDistances, 1 ) );

		} else {

			console.warn( 'THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.' );

		}

		return this;

	}

	/**
	 * Computes intersection points between a casted ray and this line.
	 *
	 * @param {Raycaster} raycaster - The raycaster.
	 * @param {Array<Object>} intersects - The target array that holds the intersection points.
	 */
	raycast( raycaster, intersects ) {

		const geometry = this.geometry;
		const matrixWorld = this.matrixWorld;
		const threshold = raycaster.params.Line.threshold;
		const drawRange = geometry.drawRange;

		// Checking boundingSphere distance to ray

		if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

		_sphere$1.copy( geometry.boundingSphere );
		_sphere$1.applyMatrix4( matrixWorld );
		_sphere$1.radius += threshold;

		if ( raycaster.ray.intersectsSphere( _sphere$1 ) === false ) return;

		//

		_inverseMatrix$1.copy( matrixWorld ).invert();
		_ray$1.copy( raycaster.ray ).applyMatrix4( _inverseMatrix$1 );

		const localThreshold = threshold / ( ( this.scale.x + this.scale.y + this.scale.z ) / 3 );
		const localThresholdSq = localThreshold * localThreshold;

		const step = this.isLineSegments ? 2 : 1;

		const index = geometry.index;
		const attributes = geometry.attributes;
		const positionAttribute = attributes.position;

		if ( index !== null ) {

			const start = Math.max( 0, drawRange.start );
			const end = Math.min( index.count, ( drawRange.start + drawRange.count ) );

			for ( let i = start, l = end - 1; i < l; i += step ) {

				const a = index.getX( i );
				const b = index.getX( i + 1 );

				const intersect = checkIntersection( this, raycaster, _ray$1, localThresholdSq, a, b, i );

				if ( intersect ) {

					intersects.push( intersect );

				}

			}

			if ( this.isLineLoop ) {

				const a = index.getX( end - 1 );
				const b = index.getX( start );

				const intersect = checkIntersection( this, raycaster, _ray$1, localThresholdSq, a, b, end - 1 );

				if ( intersect ) {

					intersects.push( intersect );

				}

			}

		} else {

			const start = Math.max( 0, drawRange.start );
			const end = Math.min( positionAttribute.count, ( drawRange.start + drawRange.count ) );

			for ( let i = start, l = end - 1; i < l; i += step ) {

				const intersect = checkIntersection( this, raycaster, _ray$1, localThresholdSq, i, i + 1, i );

				if ( intersect ) {

					intersects.push( intersect );

				}

			}

			if ( this.isLineLoop ) {

				const intersect = checkIntersection( this, raycaster, _ray$1, localThresholdSq, end - 1, start, end - 1 );

				if ( intersect ) {

					intersects.push( intersect );

				}

			}

		}

	}

	/**
	 * Sets the values of {@link Line#morphTargetDictionary} and {@link Line#morphTargetInfluences}
	 * to make sure existing morph targets can influence this 3D object.
	 */
	updateMorphTargets() {

		const geometry = this.geometry;

		const morphAttributes = geometry.morphAttributes;
		const keys = Object.keys( morphAttributes );

		if ( keys.length > 0 ) {

			const morphAttribute = morphAttributes[ keys[ 0 ] ];

			if ( morphAttribute !== undefined ) {

				this.morphTargetInfluences = [];
				this.morphTargetDictionary = {};

				for ( let m = 0, ml = morphAttribute.length; m < ml; m ++ ) {

					const name = morphAttribute[ m ].name || String( m );

					this.morphTargetInfluences.push( 0 );
					this.morphTargetDictionary[ name ] = m;

				}

			}

		}

	}

}

function checkIntersection( object, raycaster, ray, thresholdSq, a, b, i ) {

	const positionAttribute = object.geometry.attributes.position;

	_vStart.fromBufferAttribute( positionAttribute, a );
	_vEnd.fromBufferAttribute( positionAttribute, b );

	const distSq = ray.distanceSqToSegment( _vStart, _vEnd, _intersectPointOnRay, _intersectPointOnSegment );

	if ( distSq > thresholdSq ) return;

	_intersectPointOnRay.applyMatrix4( object.matrixWorld ); // Move back to world space for distance calculation

	const distance = raycaster.ray.origin.distanceTo( _intersectPointOnRay );

	if ( distance < raycaster.near || distance > raycaster.far ) return;

	return {

		distance: distance,
		// What do we want? intersection point on the ray or on the segment??
		// point: raycaster.ray.at( distance ),
		point: _intersectPointOnSegment.clone().applyMatrix4( object.matrixWorld ),
		index: i,
		face: null,
		faceIndex: null,
		barycoord: null,
		object: object

	};

}

const _start = /*@__PURE__*/ new Vector3();
const _end = /*@__PURE__*/ new Vector3();

/**
 * A series of lines drawn between pairs of vertices.
 *
 * @augments Line
 */
class LineSegments extends Line {

	/**
	 * Constructs a new line segments.
	 *
	 * @param {BufferGeometry} [geometry] - The line geometry.
	 * @param {Material|Array<Material>} [material] - The line material.
	 */
	constructor( geometry, material ) {

		super( geometry, material );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isLineSegments = true;

		this.type = 'LineSegments';

	}

	computeLineDistances() {

		const geometry = this.geometry;

		// we assume non-indexed geometry

		if ( geometry.index === null ) {

			const positionAttribute = geometry.attributes.position;
			const lineDistances = [];

			for ( let i = 0, l = positionAttribute.count; i < l; i += 2 ) {

				_start.fromBufferAttribute( positionAttribute, i );
				_end.fromBufferAttribute( positionAttribute, i + 1 );

				lineDistances[ i ] = ( i === 0 ) ? 0 : lineDistances[ i - 1 ];
				lineDistances[ i + 1 ] = lineDistances[ i ] + _start.distanceTo( _end );

			}

			geometry.setAttribute( 'lineDistance', new Float32BufferAttribute( lineDistances, 1 ) );

		} else {

			console.warn( 'THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.' );

		}

		return this;

	}

}

/**
 * A continuous line. This is nearly the same as {@link Line} the only difference
 * is that the last vertex is connected with the first vertex in order to close
 * the line to form a loop.
 *
 * @augments Line
 */
class LineLoop extends Line {

	/**
	 * Constructs a new line loop.
	 *
	 * @param {BufferGeometry} [geometry] - The line geometry.
	 * @param {Material|Array<Material>} [material] - The line material.
	 */
	constructor( geometry, material ) {

		super( geometry, material );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isLineLoop = true;

		this.type = 'LineLoop';

	}

}

/**
 * A material for rendering point primitives.
 *
 * Materials define the appearance of renderable 3D objects.
 *
 * ```js
 * const vertices = [];
 *
 * for ( let i = 0; i < 10000; i ++ ) {
 * 	const x = THREE.MathUtils.randFloatSpread( 2000 );
 * 	const y = THREE.MathUtils.randFloatSpread( 2000 );
 * 	const z = THREE.MathUtils.randFloatSpread( 2000 );
 *
 * 	vertices.push( x, y, z );
 * }
 *
 * const geometry = new THREE.BufferGeometry();
 * geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
 * const material = new THREE.PointsMaterial( { color: 0x888888 } );
 * const points = new THREE.Points( geometry, material );
 * scene.add( points );
 * ```
 *
 * @augments Material
 */
class PointsMaterial extends Material {

	/**
	 * Constructs a new points material.
	 *
	 * @param {Object} [parameters] - An object with one or more properties
	 * defining the material's appearance. Any property of the material
	 * (including any property from inherited materials) can be passed
	 * in here. Color values can be passed any type of value accepted
	 * by {@link Color#set}.
	 */
	constructor( parameters ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isPointsMaterial = true;

		this.type = 'PointsMaterial';

		/**
		 * Color of the material.
		 *
		 * @type {Color}
		 * @default (1,1,1)
		 */
		this.color = new Color( 0xffffff );

		/**
		 * The color map. May optionally include an alpha channel, typically combined
		 * with {@link Material#transparent} or {@link Material#alphaTest}. The texture map
		 * color is modulated by the diffuse `color`.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.map = null;

		/**
		 * The alpha map is a grayscale texture that controls the opacity across the
		 * surface (black: fully transparent; white: fully opaque).
		 *
		 * Only the color of the texture is used, ignoring the alpha channel if one
		 * exists. For RGB and RGBA textures, the renderer will use the green channel
		 * when sampling this texture due to the extra bit of precision provided for
		 * green in DXT-compressed and uncompressed RGB 565 formats. Luminance-only and
		 * luminance/alpha textures will also still work as expected.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.alphaMap = null;

		/**
		 * Defines the size of the points in pixels.
		 *
		 * Might be capped if the value exceeds hardware dependent parameters like [gl.ALIASED_POINT_SIZE_RANGE]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParamete}.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.size = 1;

		/**
		 * Specifies whether size of individual points is attenuated by the camera depth (perspective camera only).
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.sizeAttenuation = true;

		/**
		 * Whether the material is affected by fog or not.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.fog = true;

		this.setValues( parameters );

	}

	copy( source ) {

		super.copy( source );

		this.color.copy( source.color );

		this.map = source.map;

		this.alphaMap = source.alphaMap;

		this.size = source.size;
		this.sizeAttenuation = source.sizeAttenuation;

		this.fog = source.fog;

		return this;

	}

}

const _inverseMatrix = /*@__PURE__*/ new Matrix4();
const _ray = /*@__PURE__*/ new Ray();
const _sphere = /*@__PURE__*/ new Sphere();
const _position$2 = /*@__PURE__*/ new Vector3();

/**
 * A class for displaying points or point clouds.
 *
 * @augments Object3D
 */
class Points extends Object3D {

	/**
	 * Constructs a new point cloud.
	 *
	 * @param {BufferGeometry} [geometry] - The points geometry.
	 * @param {Material|Array<Material>} [material] - The points material.
	 */
	constructor( geometry = new BufferGeometry(), material = new PointsMaterial() ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isPoints = true;

		this.type = 'Points';

		/**
		 * The points geometry.
		 *
		 * @type {BufferGeometry}
		 */
		this.geometry = geometry;

		/**
		 * The line material.
		 *
		 * @type {Material|Array<Material>}
		 * @default PointsMaterial
		 */
		this.material = material;

		/**
		 * A dictionary representing the morph targets in the geometry. The key is the
		 * morph targets name, the value its attribute index. This member is `undefined`
		 * by default and only set when morph targets are detected in the geometry.
		 *
		 * @type {Object<String,number>|undefined}
		 * @default undefined
		 */
		this.morphTargetDictionary = undefined;

		/**
		 * An array of weights typically in the range `[0,1]` that specify how much of the morph
		 * is applied. This member is `undefined` by default and only set when morph targets are
		 * detected in the geometry.
		 *
		 * @type {Array<number>|undefined}
		 * @default undefined
		 */
		this.morphTargetInfluences = undefined;

		this.updateMorphTargets();

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.material = Array.isArray( source.material ) ? source.material.slice() : source.material;
		this.geometry = source.geometry;

		return this;

	}

	/**
	 * Computes intersection points between a casted ray and this point cloud.
	 *
	 * @param {Raycaster} raycaster - The raycaster.
	 * @param {Array<Object>} intersects - The target array that holds the intersection points.
	 */
	raycast( raycaster, intersects ) {

		const geometry = this.geometry;
		const matrixWorld = this.matrixWorld;
		const threshold = raycaster.params.Points.threshold;
		const drawRange = geometry.drawRange;

		// Checking boundingSphere distance to ray

		if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

		_sphere.copy( geometry.boundingSphere );
		_sphere.applyMatrix4( matrixWorld );
		_sphere.radius += threshold;

		if ( raycaster.ray.intersectsSphere( _sphere ) === false ) return;

		//

		_inverseMatrix.copy( matrixWorld ).invert();
		_ray.copy( raycaster.ray ).applyMatrix4( _inverseMatrix );

		const localThreshold = threshold / ( ( this.scale.x + this.scale.y + this.scale.z ) / 3 );
		const localThresholdSq = localThreshold * localThreshold;

		const index = geometry.index;
		const attributes = geometry.attributes;
		const positionAttribute = attributes.position;

		if ( index !== null ) {

			const start = Math.max( 0, drawRange.start );
			const end = Math.min( index.count, ( drawRange.start + drawRange.count ) );

			for ( let i = start, il = end; i < il; i ++ ) {

				const a = index.getX( i );

				_position$2.fromBufferAttribute( positionAttribute, a );

				testPoint( _position$2, a, localThresholdSq, matrixWorld, raycaster, intersects, this );

			}

		} else {

			const start = Math.max( 0, drawRange.start );
			const end = Math.min( positionAttribute.count, ( drawRange.start + drawRange.count ) );

			for ( let i = start, l = end; i < l; i ++ ) {

				_position$2.fromBufferAttribute( positionAttribute, i );

				testPoint( _position$2, i, localThresholdSq, matrixWorld, raycaster, intersects, this );

			}

		}

	}

	/**
	 * Sets the values of {@link Points#morphTargetDictionary} and {@link Points#morphTargetInfluences}
	 * to make sure existing morph targets can influence this 3D object.
	 */
	updateMorphTargets() {

		const geometry = this.geometry;

		const morphAttributes = geometry.morphAttributes;
		const keys = Object.keys( morphAttributes );

		if ( keys.length > 0 ) {

			const morphAttribute = morphAttributes[ keys[ 0 ] ];

			if ( morphAttribute !== undefined ) {

				this.morphTargetInfluences = [];
				this.morphTargetDictionary = {};

				for ( let m = 0, ml = morphAttribute.length; m < ml; m ++ ) {

					const name = morphAttribute[ m ].name || String( m );

					this.morphTargetInfluences.push( 0 );
					this.morphTargetDictionary[ name ] = m;

				}

			}

		}

	}

}

function testPoint( point, index, localThresholdSq, matrixWorld, raycaster, intersects, object ) {

	const rayPointDistanceSq = _ray.distanceSqToPoint( point );

	if ( rayPointDistanceSq < localThresholdSq ) {

		const intersectPoint = new Vector3();

		_ray.closestPointToPoint( point, intersectPoint );
		intersectPoint.applyMatrix4( matrixWorld );

		const distance = raycaster.ray.origin.distanceTo( intersectPoint );

		if ( distance < raycaster.near || distance > raycaster.far ) return;

		intersects.push( {

			distance: distance,
			distanceToRay: Math.sqrt( rayPointDistanceSq ),
			point: intersectPoint,
			index: index,
			face: null,
			faceIndex: null,
			barycoord: null,
			object: object

		} );

	}

}

/**
 * A standard physically based material, using Metallic-Roughness workflow.
 *
 * Physically based rendering (PBR) has recently become the standard in many
 * 3D applications, such as [Unity]{@link https://blogs.unity3d.com/2014/10/29/physically-based-shading-in-unity-5-a-primer/},
 * [Unreal]{@link https://docs.unrealengine.com/latest/INT/Engine/Rendering/Materials/PhysicallyBased/} and
 * [3D Studio Max]{@link http://area.autodesk.com/blogs/the-3ds-max-blog/what039s-new-for-rendering-in-3ds-max-2017}.
 *
 * This approach differs from older approaches in that instead of using
 * approximations for the way in which light interacts with a surface, a
 * physically correct model is used. The idea is that, instead of tweaking
 * materials to look good under specific lighting, a material can be created
 * that will react 'correctly' under all lighting scenarios.
 *
 * In practice this gives a more accurate and realistic looking result than
 * the {@link MeshLambertMaterial} or {@link MeshPhongMaterial}, at the cost of
 * being somewhat more computationally expensive. `MeshStandardMaterial` uses per-fragment
 * shading.
 *
 * Note that for best results you should always specify an environment map when using this material.
 *
 * For a non-technical introduction to the concept of PBR and how to set up a
 * PBR material, check out these articles by the people at [marmoset]{@link https://www.marmoset.co}:
 *
 * - [Basic Theory of Physically Based Rendering]{@link https://www.marmoset.co/posts/basic-theory-of-physically-based-rendering/}
 * - [Physically Based Rendering and You Can Too]{@link https://www.marmoset.co/posts/physically-based-rendering-and-you-can-too/}
 *
 * Technical details of the approach used in three.js (and most other PBR systems) can be found is this
 * [paper from Disney]{@link https://media.disneyanimation.com/uploads/production/publication_asset/48/asset/s2012_pbs_disney_brdf_notes_v3.pdf}
 * (pdf), by Brent Burley.
 *
 * @augments Material
 */
class MeshStandardMaterial extends Material {

	/**
	 * Constructs a new mesh standard material.
	 *
	 * @param {Object} [parameters] - An object with one or more properties
	 * defining the material's appearance. Any property of the material
	 * (including any property from inherited materials) can be passed
	 * in here. Color values can be passed any type of value accepted
	 * by {@link Color#set}.
	 */
	constructor( parameters ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isMeshStandardMaterial = true;

		this.type = 'MeshStandardMaterial';

		this.defines = { 'STANDARD': '' };

		/**
		 * Color of the material.
		 *
		 * @type {Color}
		 * @default (1,1,1)
		 */
		this.color = new Color( 0xffffff ); // diffuse

		/**
		 * How rough the material appears. `0.0` means a smooth mirror reflection, `1.0`
		 * means fully diffuse. If `roughnessMap` is also provided,
		 * both values are multiplied.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.roughness = 1.0;

		/**
		 * How much the material is like a metal. Non-metallic materials such as wood
		 * or stone use `0.0`, metallic use `1.0`, with nothing (usually) in between.
		 * A value between `0.0` and `1.0` could be used for a rusty metal look.
		 * If `metalnessMap` is also provided, both values are multiplied.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.metalness = 0.0;

		/**
		 * The color map. May optionally include an alpha channel, typically combined
		 * with {@link Material#transparent} or {@link Material#alphaTest}. The texture map
		 * color is modulated by the diffuse `color`.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.map = null;

		/**
		 * The light map. Requires a second set of UVs.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.lightMap = null;

		/**
		 * Intensity of the baked light.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.lightMapIntensity = 1.0;

		/**
		 * The red channel of this texture is used as the ambient occlusion map.
		 * Requires a second set of UVs.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.aoMap = null;

		/**
		 * Intensity of the ambient occlusion effect. Range is `[0,1]`, where `0`
		 * disables ambient occlusion. Where intensity is `1` and the AO map's
		 * red channel is also `1`, ambient light is fully occluded on a surface.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.aoMapIntensity = 1.0;

		/**
		 * Emissive (light) color of the material, essentially a solid color
		 * unaffected by other lighting.
		 *
		 * @type {Color}
		 * @default (0,0,0)
		 */
		this.emissive = new Color( 0x000000 );

		/**
		 * Intensity of the emissive light. Modulates the emissive color.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.emissiveIntensity = 1.0;

		/**
		 * Set emissive (glow) map. The emissive map color is modulated by the
		 * emissive color and the emissive intensity. If you have an emissive map,
		 * be sure to set the emissive color to something other than black.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.emissiveMap = null;

		/**
		 * The texture to create a bump map. The black and white values map to the
		 * perceived depth in relation to the lights. Bump doesn't actually affect
		 * the geometry of the object, only the lighting. If a normal map is defined
		 * this will be ignored.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.bumpMap = null;

		/**
		 * How much the bump map affects the material. Typical range is `[0,1]`.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.bumpScale = 1;

		/**
		 * The texture to create a normal map. The RGB values affect the surface
		 * normal for each pixel fragment and change the way the color is lit. Normal
		 * maps do not change the actual shape of the surface, only the lighting. In
		 * case the material has a normal map authored using the left handed
		 * convention, the `y` component of `normalScale` should be negated to compensate
		 * for the different handedness.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.normalMap = null;

		/**
		 * The type of normal map.
		 *
		 * @type {(TangentSpaceNormalMap|ObjectSpaceNormalMap)}
		 * @default TangentSpaceNormalMap
		 */
		this.normalMapType = TangentSpaceNormalMap;

		/**
		 * How much the normal map affects the material. Typical value range is `[0,1]`.
		 *
		 * @type {Vector2}
		 * @default (1,1)
		 */
		this.normalScale = new Vector2( 1, 1 );

		/**
		 * The displacement map affects the position of the mesh's vertices. Unlike
		 * other maps which only affect the light and shade of the material the
		 * displaced vertices can cast shadows, block other objects, and otherwise
		 * act as real geometry. The displacement texture is an image where the value
		 * of each pixel (white being the highest) is mapped against, and
		 * repositions, the vertices of the mesh.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.displacementMap = null;

		/**
		 * How much the displacement map affects the mesh (where black is no
		 * displacement, and white is maximum displacement). Without a displacement
		 * map set, this value is not applied.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.displacementScale = 1;

		/**
		 * The offset of the displacement map's values on the mesh's vertices.
		 * The bias is added to the scaled sample of the displacement map.
		 * Without a displacement map set, this value is not applied.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.displacementBias = 0;

		/**
		 * The green channel of this texture is used to alter the roughness of the
		 * material.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.roughnessMap = null;

		/**
		 * The blue channel of this texture is used to alter the metalness of the
		 * material.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.metalnessMap = null;

		/**
		 * The alpha map is a grayscale texture that controls the opacity across the
		 * surface (black: fully transparent; white: fully opaque).
		 *
		 * Only the color of the texture is used, ignoring the alpha channel if one
		 * exists. For RGB and RGBA textures, the renderer will use the green channel
		 * when sampling this texture due to the extra bit of precision provided for
		 * green in DXT-compressed and uncompressed RGB 565 formats. Luminance-only and
		 * luminance/alpha textures will also still work as expected.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.alphaMap = null;

		/**
		 * The environment map. To ensure a physically correct rendering, environment maps
		 * are internally pre-processed with {@link PMREMGenerator}.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.envMap = null;

		/**
		 * The rotation of the environment map in radians.
		 *
		 * @type {Euler}
		 * @default (0,0,0)
		 */
		this.envMapRotation = new Euler();

		/**
		 * Scales the effect of the environment map by multiplying its color.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.envMapIntensity = 1.0;

		/**
		 * Renders the geometry as a wireframe.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.wireframe = false;

		/**
		 * Controls the thickness of the wireframe.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.wireframeLinewidth = 1;

		/**
		 * Defines appearance of wireframe ends.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {('round'|'bevel'|'miter')}
		 * @default 'round'
		 */
		this.wireframeLinecap = 'round';

		/**
		 * Defines appearance of wireframe joints.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {('round'|'bevel'|'miter')}
		 * @default 'round'
		 */
		this.wireframeLinejoin = 'round';

		/**
		 * Whether the material is rendered with flat shading or not.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.flatShading = false;

		/**
		 * Whether the material is affected by fog or not.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.fog = true;

		this.setValues( parameters );

	}

	copy( source ) {

		super.copy( source );

		this.defines = { 'STANDARD': '' };

		this.color.copy( source.color );
		this.roughness = source.roughness;
		this.metalness = source.metalness;

		this.map = source.map;

		this.lightMap = source.lightMap;
		this.lightMapIntensity = source.lightMapIntensity;

		this.aoMap = source.aoMap;
		this.aoMapIntensity = source.aoMapIntensity;

		this.emissive.copy( source.emissive );
		this.emissiveMap = source.emissiveMap;
		this.emissiveIntensity = source.emissiveIntensity;

		this.bumpMap = source.bumpMap;
		this.bumpScale = source.bumpScale;

		this.normalMap = source.normalMap;
		this.normalMapType = source.normalMapType;
		this.normalScale.copy( source.normalScale );

		this.displacementMap = source.displacementMap;
		this.displacementScale = source.displacementScale;
		this.displacementBias = source.displacementBias;

		this.roughnessMap = source.roughnessMap;

		this.metalnessMap = source.metalnessMap;

		this.alphaMap = source.alphaMap;

		this.envMap = source.envMap;
		this.envMapRotation.copy( source.envMapRotation );
		this.envMapIntensity = source.envMapIntensity;

		this.wireframe = source.wireframe;
		this.wireframeLinewidth = source.wireframeLinewidth;
		this.wireframeLinecap = source.wireframeLinecap;
		this.wireframeLinejoin = source.wireframeLinejoin;

		this.flatShading = source.flatShading;

		this.fog = source.fog;

		return this;

	}

}

/**
 * An extension of the {@link MeshStandardMaterial}, providing more advanced
 * physically-based rendering properties:
 *
 * - Anisotropy: Ability to represent the anisotropic property of materials
 * as observable with brushed metals.
 * - Clearcoat: Some materials — like car paints, carbon fiber, and wet surfaces — require
 * a clear, reflective layer on top of another layer that may be irregular or rough.
 * Clearcoat approximates this effect, without the need for a separate transparent surface.
 * - Iridescence: Allows to render the effect where hue varies  depending on the viewing
 * angle and illumination angle. This can be seen on soap bubbles, oil films, or on the
 * wings of many insects.
 * - Physically-based transparency: One limitation of {@link Material#opacity} is that highly
 * transparent materials are less reflective. Physically-based transmission provides a more
 * realistic option for thin, transparent surfaces like glass.
 * - Advanced reflectivity: More flexible reflectivity for non-metallic materials.
 * - Sheen: Can be used for representing cloth and fabric materials.
 *
 * As a result of these complex shading features, `MeshPhysicalMaterial` has a
 * higher performance cost, per pixel, than other three.js materials. Most
 * effects are disabled by default, and add cost as they are enabled. For
 * best results, always specify an environment map when using this material.
 *
 * @augments MeshStandardMaterial
 */
class MeshPhysicalMaterial extends MeshStandardMaterial {

	/**
	 * Constructs a new mesh physical material.
	 *
	 * @param {Object} [parameters] - An object with one or more properties
	 * defining the material's appearance. Any property of the material
	 * (including any property from inherited materials) can be passed
	 * in here. Color values can be passed any type of value accepted
	 * by {@link Color#set}.
	 */
	constructor( parameters ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isMeshPhysicalMaterial = true;

		this.defines = {

			'STANDARD': '',
			'PHYSICAL': ''

		};

		this.type = 'MeshPhysicalMaterial';

		/**
		 * The rotation of the anisotropy in tangent, bitangent space, measured in radians
		 * counter-clockwise from the tangent. When `anisotropyMap` is present, this
		 * property provides additional rotation to the vectors in the texture.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.anisotropyRotation = 0;

		/**
		 * Red and green channels represent the anisotropy direction in `[-1, 1]` tangent,
		 * bitangent space, to be rotated by `anisotropyRotation`. The blue channel
		 * contains strength as `[0, 1]` to be multiplied by `anisotropy`.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.anisotropyMap = null;

		/**
		 * The red channel of this texture is multiplied against `clearcoat`,
		 * for per-pixel control over a coating's intensity.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.clearcoatMap = null;

		/**
		 * Roughness of the clear coat layer, from `0.0` to `1.0`.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.clearcoatRoughness = 0.0;

		/**
		 * The green channel of this texture is multiplied against
		 * `clearcoatRoughness`, for per-pixel control over a coating's roughness.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.clearcoatRoughnessMap = null;

		/**
		 * How much `clearcoatNormalMap` affects the clear coat layer, from
		 * `(0,0)` to `(1,1)`.
		 *
		 * @type {Vector2}
		 * @default (1,1)
		 */
		this.clearcoatNormalScale = new Vector2( 1, 1 );

		/**
		 * Can be used to enable independent normals for the clear coat layer.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.clearcoatNormalMap = null;

		/**
		 * Index-of-refraction for non-metallic materials, from `1.0` to `2.333`.
		 *
		 * @type {number}
		 * @default 1.5
		 */
		this.ior = 1.5;

		/**
		 * Degree of reflectivity, from `0.0` to `1.0`. Default is `0.5`, which
		 * corresponds to an index-of-refraction of `1.5`.
		 *
		 * This models the reflectivity of non-metallic materials. It has no effect
		 * when `metalness` is `1.0`
		 *
		 * @name MeshPhysicalMaterial#reflectivity
		 * @type {number}
		 * @default 0.5
		 */
		Object.defineProperty( this, 'reflectivity', {
			get: function () {

				return ( clamp( 2.5 * ( this.ior - 1 ) / ( this.ior + 1 ), 0, 1 ) );

			},
			set: function ( reflectivity ) {

				this.ior = ( 1 + 0.4 * reflectivity ) / ( 1 - 0.4 * reflectivity );

			}
		} );

		/**
		 * The red channel of this texture is multiplied against `iridescence`, for per-pixel
		 * control over iridescence.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.iridescenceMap = null;

		/**
		 * Strength of the iridescence RGB color shift effect, represented by an index-of-refraction.
		 * Between `1.0` to `2.333`.
		 *
		 * @type {number}
		 * @default 1.3
		 */
		this.iridescenceIOR = 1.3;

		/**
		 *Array of exactly 2 elements, specifying minimum and maximum thickness of the iridescence layer.
		 Thickness of iridescence layer has an equivalent effect of the one `thickness` has on `ior`.
		 *
		 * @type {Array<number,number>}
		 * @default [100,400]
		 */
		this.iridescenceThicknessRange = [ 100, 400 ];

		/**
		 * A texture that defines the thickness of the iridescence layer, stored in the green channel.
		 * Minimum and maximum values of thickness are defined by `iridescenceThicknessRange` array:
		 * - `0.0` in the green channel will result in thickness equal to first element of the array.
		 * - `1.0` in the green channel will result in thickness equal to second element of the array.
		 * - Values in-between will linearly interpolate between the elements of the array.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.iridescenceThicknessMap = null;

		/**
		 * The sheen tint.
		 *
		 * @type {Color}
		 * @default (0,0,0)
		 */
		this.sheenColor = new Color( 0x000000 );

		/**
		 * The RGB channels of this texture are multiplied against  `sheenColor`, for per-pixel control
		 * over sheen tint.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.sheenColorMap = null;

		/**
		 * Roughness of the sheen layer, from `0.0` to `1.0`.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.sheenRoughness = 1.0;

		/**
		 * The alpha channel of this texture is multiplied against `sheenRoughness`, for per-pixel control
		 * over sheen roughness.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.sheenRoughnessMap = null;

		/**
		 * The red channel of this texture is multiplied against `transmission`, for per-pixel control over
		 * optical transparency.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.transmissionMap = null;

		/**
		 * The thickness of the volume beneath the surface. The value is given in the
		 * coordinate space of the mesh. If the value is `0` the material is
		 * thin-walled. Otherwise the material is a volume boundary.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.thickness = 0;

		/**
		 * A texture that defines the thickness, stored in the green channel. This will
		 * be multiplied by `thickness`.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.thicknessMap = null;

		/**
		 * Density of the medium given as the average distance that light travels in
		 * the medium before interacting with a particle. The value is given in world
		 * space units, and must be greater than zero.
		 *
		 * @type {number}
		 * @default Infinity
		 */
		this.attenuationDistance = Infinity;

		/**
		 * The color that white light turns into due to absorption when reaching the
		 * attenuation distance.
		 *
		 * @type {Color}
		 * @default (1,1,1)
		 */
		this.attenuationColor = new Color( 1, 1, 1 );

		/**
		 * A float that scales the amount of specular reflection for non-metals only.
		 * When set to zero, the model is effectively Lambertian. From `0.0` to `1.0`.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.specularIntensity = 1.0;

		/**
		 * The alpha channel of this texture is multiplied against `specularIntensity`,
		 * for per-pixel control over specular intensity.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.specularIntensityMap = null;

		/**
		 * Tints the specular reflection at normal incidence for non-metals only.
		 *
		 * @type {Color}
		 * @default (1,1,1)
		 */
		this.specularColor = new Color( 1, 1, 1 );

		/**
		 * The RGB channels of this texture are multiplied against `specularColor`,
		 * for per-pixel control over specular color.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.specularColorMap = null;

		this._anisotropy = 0;
		this._clearcoat = 0;
		this._dispersion = 0;
		this._iridescence = 0;
		this._sheen = 0.0;
		this._transmission = 0;

		this.setValues( parameters );

	}

	/**
	 * The anisotropy strength.
	 *
	 * @type {number}
	 * @default 0
	 */
	get anisotropy() {

		return this._anisotropy;

	}

	set anisotropy( value ) {

		if ( this._anisotropy > 0 !== value > 0 ) {

			this.version ++;

		}

		this._anisotropy = value;

	}

	/**
	 * Represents the intensity of the clear coat layer, from `0.0` to `1.0`. Use
	 * clear coat related properties to enable multilayer materials that have a
	 * thin translucent layer over the base layer.
	 *
	 * @type {number}
	 * @default 0
	 */
	get clearcoat() {

		return this._clearcoat;

	}

	set clearcoat( value ) {

		if ( this._clearcoat > 0 !== value > 0 ) {

			this.version ++;

		}

		this._clearcoat = value;

	}
	/**
	 * The intensity of the iridescence layer, simulating RGB color shift based on the angle between
	 * the surface and the viewer, from `0.0` to `1.0`.
	 *
	 * @type {number}
	 * @default 0
	 */
	get iridescence() {

		return this._iridescence;

	}

	set iridescence( value ) {

		if ( this._iridescence > 0 !== value > 0 ) {

			this.version ++;

		}

		this._iridescence = value;

	}

	/**
	 * Defines the strength of the angular separation of colors (chromatic aberration) transmitting
	 * through a relatively clear volume. Any value zero or larger is valid, the typical range of
	 * realistic values is `[0, 1]`. This property can be only be used with transmissive objects.
	 *
	 * @type {number}
	 * @default 0
	 */
	get dispersion() {

		return this._dispersion;

	}

	set dispersion( value ) {

		if ( this._dispersion > 0 !== value > 0 ) {

			this.version ++;

		}

		this._dispersion = value;

	}

	/**
	 * The intensity of the sheen layer, from `0.0` to `1.0`.
	 *
	 * @type {number}
	 * @default 0
	 */
	get sheen() {

		return this._sheen;

	}

	set sheen( value ) {

		if ( this._sheen > 0 !== value > 0 ) {

			this.version ++;

		}

		this._sheen = value;

	}

	/**
	 * Degree of transmission (or optical transparency), from `0.0` to `1.0`.
	 *
	 * Thin, transparent or semitransparent, plastic or glass materials remain
	 * largely reflective even if they are fully transmissive. The transmission
	 * property can be used to model these materials.
	 *
	 * When transmission is non-zero, `opacity` should be  set to `1`.
	 *
	 * @type {number}
	 * @default 0
	 */
	get transmission() {

		return this._transmission;

	}

	set transmission( value ) {

		if ( this._transmission > 0 !== value > 0 ) {

			this.version ++;

		}

		this._transmission = value;

	}

	copy( source ) {

		super.copy( source );

		this.defines = {

			'STANDARD': '',
			'PHYSICAL': ''

		};

		this.anisotropy = source.anisotropy;
		this.anisotropyRotation = source.anisotropyRotation;
		this.anisotropyMap = source.anisotropyMap;

		this.clearcoat = source.clearcoat;
		this.clearcoatMap = source.clearcoatMap;
		this.clearcoatRoughness = source.clearcoatRoughness;
		this.clearcoatRoughnessMap = source.clearcoatRoughnessMap;
		this.clearcoatNormalMap = source.clearcoatNormalMap;
		this.clearcoatNormalScale.copy( source.clearcoatNormalScale );

		this.dispersion = source.dispersion;
		this.ior = source.ior;

		this.iridescence = source.iridescence;
		this.iridescenceMap = source.iridescenceMap;
		this.iridescenceIOR = source.iridescenceIOR;
		this.iridescenceThicknessRange = [ ...source.iridescenceThicknessRange ];
		this.iridescenceThicknessMap = source.iridescenceThicknessMap;

		this.sheen = source.sheen;
		this.sheenColor.copy( source.sheenColor );
		this.sheenColorMap = source.sheenColorMap;
		this.sheenRoughness = source.sheenRoughness;
		this.sheenRoughnessMap = source.sheenRoughnessMap;

		this.transmission = source.transmission;
		this.transmissionMap = source.transmissionMap;

		this.thickness = source.thickness;
		this.thicknessMap = source.thicknessMap;
		this.attenuationDistance = source.attenuationDistance;
		this.attenuationColor.copy( source.attenuationColor );

		this.specularIntensity = source.specularIntensity;
		this.specularIntensityMap = source.specularIntensityMap;
		this.specularColor.copy( source.specularColor );
		this.specularColorMap = source.specularColorMap;

		return this;

	}

}

/**
 * Converts an array to a specific type.
 *
 * @param {TypedArray|Array} array - The array to convert.
 * @param {TypedArray.constructor} type - The constructor of a typed array that defines the new type.
 * @return {TypedArray} The converted array.
 */
function convertArray( array, type ) {

	if ( ! array || array.constructor === type ) return array;

	if ( typeof type.BYTES_PER_ELEMENT === 'number' ) {

		return new type( array ); // create typed array

	}

	return Array.prototype.slice.call( array ); // create Array

}

/**
 * Returns `true` if the given object is a typed array.
 *
 * @param {any} object - The object to check.
 * @return {boolean} Whether the given object is a typed array.
 */
function isTypedArray( object ) {

	return ArrayBuffer.isView( object ) && ! ( object instanceof DataView );

}

/**
 * Returns an array by which times and values can be sorted.
 *
 * @param {Array<number>} times - The keyframe time values.
 * @return {Array<number>} The array.
 */
function getKeyframeOrder( times ) {

	function compareTime( i, j ) {

		return times[ i ] - times[ j ];

	}

	const n = times.length;
	const result = new Array( n );
	for ( let i = 0; i !== n; ++ i ) result[ i ] = i;

	result.sort( compareTime );

	return result;

}

/**
 * Sorts the given array by the previously computed order via `getKeyframeOrder()`.
 *
 * @param {Array<number>} values - The values to sort.
 * @param {number} stride - The stride.
 * @param {Array<number>} order - The sort order.
 * @return {Array<number>} The sorted values.
 */
function sortedArray( values, stride, order ) {

	const nValues = values.length;
	const result = new values.constructor( nValues );

	for ( let i = 0, dstOffset = 0; dstOffset !== nValues; ++ i ) {

		const srcOffset = order[ i ] * stride;

		for ( let j = 0; j !== stride; ++ j ) {

			result[ dstOffset ++ ] = values[ srcOffset + j ];

		}

	}

	return result;

}

/**
 * Used for parsing AOS keyframe formats.
 *
 * @param {Array<number>} jsonKeys - A list of JSON keyframes.
 * @param {Array<number>} times - This array will be filled with keyframe times by this function.
 * @param {Array<number>} values - This array will be filled with keyframe values by this function.
 * @param {string} valuePropertyName - The name of the property to use.
 */
function flattenJSON( jsonKeys, times, values, valuePropertyName ) {

	let i = 1, key = jsonKeys[ 0 ];

	while ( key !== undefined && key[ valuePropertyName ] === undefined ) {

		key = jsonKeys[ i ++ ];

	}

	if ( key === undefined ) return; // no data

	let value = key[ valuePropertyName ];
	if ( value === undefined ) return; // no data

	if ( Array.isArray( value ) ) {

		do {

			value = key[ valuePropertyName ];

			if ( value !== undefined ) {

				times.push( key.time );
				values.push( ...value ); // push all elements

			}

			key = jsonKeys[ i ++ ];

		} while ( key !== undefined );

	} else if ( value.toArray !== undefined ) {

		// ...assume THREE.Math-ish

		do {

			value = key[ valuePropertyName ];

			if ( value !== undefined ) {

				times.push( key.time );
				value.toArray( values, values.length );

			}

			key = jsonKeys[ i ++ ];

		} while ( key !== undefined );

	} else {

		// otherwise push as-is

		do {

			value = key[ valuePropertyName ];

			if ( value !== undefined ) {

				times.push( key.time );
				values.push( value );

			}

			key = jsonKeys[ i ++ ];

		} while ( key !== undefined );

	}

}

/**
 * Abstract base class of interpolants over parametric samples.
 *
 * The parameter domain is one dimensional, typically the time or a path
 * along a curve defined by the data.
 *
 * The sample values can have any dimensionality and derived classes may
 * apply special interpretations to the data.
 *
 * This class provides the interval seek in a Template Method, deferring
 * the actual interpolation to derived classes.
 *
 * Time complexity is O(1) for linear access crossing at most two points
 * and O(log N) for random access, where N is the number of positions.
 *
 * References: {@link http://www.oodesign.com/template-method-pattern.html}
 *
 * @abstract
 */
class Interpolant {

	/**
	 * Constructs a new interpolant.
	 *
	 * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
	 * @param {TypedArray} sampleValues - The sample values.
	 * @param {number} sampleSize - The sample size
	 * @param {TypedArray} [resultBuffer] - The result buffer.
	 */
	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		/**
		 * The parameter positions.
		 *
		 * @type {TypedArray}
		 */
		this.parameterPositions = parameterPositions;

		/**
		 * A cache index.
		 *
		 * @private
		 * @type {number}
		 * @default 0
		 */
		this._cachedIndex = 0;

		/**
		 * The result buffer.
		 *
		 * @type {TypedArray}
		 */
		this.resultBuffer = resultBuffer !== undefined ? resultBuffer : new sampleValues.constructor( sampleSize );

		/**
		 * The sample values.
		 *
		 * @type {TypedArray}
		 */
		this.sampleValues = sampleValues;

		/**
		 * The value size.
		 *
		 * @type {TypedArray}
		 */
		this.valueSize = sampleSize;

		/**
		 * The interpolation settings.
		 *
		 * @type {?Object}
		 * @default null
		 */
		this.settings = null;

		/**
		 * The default settings object.
		 *
		 * @type {Object}
		 */
		this.DefaultSettings_ = {};

	}

	/**
	 * Evaluate the interpolant at position `t`.
	 *
	 * @param {number} t - The interpolation factor.
	 * @return {TypedArray} The result buffer.
	 */
	evaluate( t ) {

		const pp = this.parameterPositions;
		let i1 = this._cachedIndex,
			t1 = pp[ i1 ],
			t0 = pp[ i1 - 1 ];

		validate_interval: {

			seek: {

				let right;

				linear_scan: {

					//- See http://jsperf.com/comparison-to-undefined/3
					//- slower code:
					//-
					//- 				if ( t >= t1 || t1 === undefined ) {
					forward_scan: if ( ! ( t < t1 ) ) {

						for ( let giveUpAt = i1 + 2; ; ) {

							if ( t1 === undefined ) {

								if ( t < t0 ) break forward_scan;

								// after end

								i1 = pp.length;
								this._cachedIndex = i1;
								return this.copySampleValue_( i1 - 1 );

							}

							if ( i1 === giveUpAt ) break; // this loop

							t0 = t1;
							t1 = pp[ ++ i1 ];

							if ( t < t1 ) {

								// we have arrived at the sought interval
								break seek;

							}

						}

						// prepare binary search on the right side of the index
						right = pp.length;
						break linear_scan;

					}

					//- slower code:
					//-					if ( t < t0 || t0 === undefined ) {
					if ( ! ( t >= t0 ) ) {

						// looping?

						const t1global = pp[ 1 ];

						if ( t < t1global ) {

							i1 = 2; // + 1, using the scan for the details
							t0 = t1global;

						}

						// linear reverse scan

						for ( let giveUpAt = i1 - 2; ; ) {

							if ( t0 === undefined ) {

								// before start

								this._cachedIndex = 0;
								return this.copySampleValue_( 0 );

							}

							if ( i1 === giveUpAt ) break; // this loop

							t1 = t0;
							t0 = pp[ -- i1 - 1 ];

							if ( t >= t0 ) {

								// we have arrived at the sought interval
								break seek;

							}

						}

						// prepare binary search on the left side of the index
						right = i1;
						i1 = 0;
						break linear_scan;

					}

					// the interval is valid

					break validate_interval;

				} // linear scan

				// binary search

				while ( i1 < right ) {

					const mid = ( i1 + right ) >>> 1;

					if ( t < pp[ mid ] ) {

						right = mid;

					} else {

						i1 = mid + 1;

					}

				}

				t1 = pp[ i1 ];
				t0 = pp[ i1 - 1 ];

				// check boundary cases, again

				if ( t0 === undefined ) {

					this._cachedIndex = 0;
					return this.copySampleValue_( 0 );

				}

				if ( t1 === undefined ) {

					i1 = pp.length;
					this._cachedIndex = i1;
					return this.copySampleValue_( i1 - 1 );

				}

			} // seek

			this._cachedIndex = i1;

			this.intervalChanged_( i1, t0, t1 );

		} // validate_interval

		return this.interpolate_( i1, t0, t, t1 );

	}

	/**
	 * Returns the interpolation settings.
	 *
	 * @return {Object} The interpolation settings.
	 */
	getSettings_() {

		return this.settings || this.DefaultSettings_;

	}

	/**
	 * Copies a sample value to the result buffer.
	 *
	 * @param {number} index - An index into the sample value buffer.
	 * @return {TypedArray} The result buffer.
	 */
	copySampleValue_( index ) {

		// copies a sample value to the result buffer

		const result = this.resultBuffer,
			values = this.sampleValues,
			stride = this.valueSize,
			offset = index * stride;

		for ( let i = 0; i !== stride; ++ i ) {

			result[ i ] = values[ offset + i ];

		}

		return result;

	}

	/**
	 * Copies a sample value to the result buffer.
	 *
	 * @abstract
	 * @param {number} i1 - An index into the sample value buffer.
	 * @param {number} t0 - The previous interpolation factor.
	 * @param {number} t - The current interpolation factor.
	 * @param {number} t1 - The next interpolation factor.
	 * @return {TypedArray} The result buffer.
	 */
	interpolate_( /* i1, t0, t, t1 */ ) {

		throw new Error( 'call to abstract method' );
		// implementations shall return this.resultBuffer

	}

	/**
	 * Optional method that is executed when the interval has changed.
	 *
	 * @param {number} i1 - An index into the sample value buffer.
	 * @param {number} t0 - The previous interpolation factor.
	 * @param {number} t - The current interpolation factor.
	 */
	intervalChanged_( /* i1, t0, t1 */ ) {

		// empty

	}

}

/**
 * Fast and simple cubic spline interpolant.
 *
 * It was derived from a Hermitian construction setting the first derivative
 * at each sample position to the linear slope between neighboring positions
 * over their parameter interval.
 *
 * @augments Interpolant
 */
class CubicInterpolant extends Interpolant {

	/**
	 * Constructs a new cubic interpolant.
	 *
	 * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
	 * @param {TypedArray} sampleValues - The sample values.
	 * @param {number} sampleSize - The sample size
	 * @param {TypedArray} [resultBuffer] - The result buffer.
	 */
	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		super( parameterPositions, sampleValues, sampleSize, resultBuffer );

		this._weightPrev = -0;
		this._offsetPrev = -0;
		this._weightNext = -0;
		this._offsetNext = -0;

		this.DefaultSettings_ = {

			endingStart: ZeroCurvatureEnding,
			endingEnd: ZeroCurvatureEnding

		};

	}

	intervalChanged_( i1, t0, t1 ) {

		const pp = this.parameterPositions;
		let iPrev = i1 - 2,
			iNext = i1 + 1,

			tPrev = pp[ iPrev ],
			tNext = pp[ iNext ];

		if ( tPrev === undefined ) {

			switch ( this.getSettings_().endingStart ) {

				case ZeroSlopeEnding:

					// f'(t0) = 0
					iPrev = i1;
					tPrev = 2 * t0 - t1;

					break;

				case WrapAroundEnding:

					// use the other end of the curve
					iPrev = pp.length - 2;
					tPrev = t0 + pp[ iPrev ] - pp[ iPrev + 1 ];

					break;

				default: // ZeroCurvatureEnding

					// f''(t0) = 0 a.k.a. Natural Spline
					iPrev = i1;
					tPrev = t1;

			}

		}

		if ( tNext === undefined ) {

			switch ( this.getSettings_().endingEnd ) {

				case ZeroSlopeEnding:

					// f'(tN) = 0
					iNext = i1;
					tNext = 2 * t1 - t0;

					break;

				case WrapAroundEnding:

					// use the other end of the curve
					iNext = 1;
					tNext = t1 + pp[ 1 ] - pp[ 0 ];

					break;

				default: // ZeroCurvatureEnding

					// f''(tN) = 0, a.k.a. Natural Spline
					iNext = i1 - 1;
					tNext = t0;

			}

		}

		const halfDt = ( t1 - t0 ) * 0.5,
			stride = this.valueSize;

		this._weightPrev = halfDt / ( t0 - tPrev );
		this._weightNext = halfDt / ( tNext - t1 );
		this._offsetPrev = iPrev * stride;
		this._offsetNext = iNext * stride;

	}

	interpolate_( i1, t0, t, t1 ) {

		const result = this.resultBuffer,
			values = this.sampleValues,
			stride = this.valueSize,

			o1 = i1 * stride,		o0 = o1 - stride,
			oP = this._offsetPrev, 	oN = this._offsetNext,
			wP = this._weightPrev,	wN = this._weightNext,

			p = ( t - t0 ) / ( t1 - t0 ),
			pp = p * p,
			ppp = pp * p;

		// evaluate polynomials

		const sP = - wP * ppp + 2 * wP * pp - wP * p;
		const s0 = ( 1 + wP ) * ppp + ( -1.5 - 2 * wP ) * pp + ( -0.5 + wP ) * p + 1;
		const s1 = ( -1 - wN ) * ppp + ( 1.5 + wN ) * pp + 0.5 * p;
		const sN = wN * ppp - wN * pp;

		// combine data linearly

		for ( let i = 0; i !== stride; ++ i ) {

			result[ i ] =
					sP * values[ oP + i ] +
					s0 * values[ o0 + i ] +
					s1 * values[ o1 + i ] +
					sN * values[ oN + i ];

		}

		return result;

	}

}

/**
 * A basic linear interpolant.
 *
 * @augments Interpolant
 */
class LinearInterpolant extends Interpolant {

	/**
	 * Constructs a new linear interpolant.
	 *
	 * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
	 * @param {TypedArray} sampleValues - The sample values.
	 * @param {number} sampleSize - The sample size
	 * @param {TypedArray} [resultBuffer] - The result buffer.
	 */
	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		super( parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	interpolate_( i1, t0, t, t1 ) {

		const result = this.resultBuffer,
			values = this.sampleValues,
			stride = this.valueSize,

			offset1 = i1 * stride,
			offset0 = offset1 - stride,

			weight1 = ( t - t0 ) / ( t1 - t0 ),
			weight0 = 1 - weight1;

		for ( let i = 0; i !== stride; ++ i ) {

			result[ i ] =
					values[ offset0 + i ] * weight0 +
					values[ offset1 + i ] * weight1;

		}

		return result;

	}

}

/**
 * Interpolant that evaluates to the sample value at the position preceding
 * the parameter.
 *
 * @augments Interpolant
 */
class DiscreteInterpolant extends Interpolant {

	/**
	 * Constructs a new discrete interpolant.
	 *
	 * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
	 * @param {TypedArray} sampleValues - The sample values.
	 * @param {number} sampleSize - The sample size
	 * @param {TypedArray} [resultBuffer] - The result buffer.
	 */
	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		super( parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	interpolate_( i1 /*, t0, t, t1 */ ) {

		return this.copySampleValue_( i1 - 1 );

	}

}

/**
 * Represents s a timed sequence of keyframes, which are composed of lists of
 * times and related values, and which are used to animate a specific property
 * of an object.
 */
class KeyframeTrack {

	/**
	 * Constructs a new keyframe track.
	 *
	 * @param {string} name - The keyframe track's name.
	 * @param {Array<number>} times - A list of keyframe times.
	 * @param {Array<number>} values - A list of keyframe values.
	 * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} [interpolation] - The interpolation type.
	 */
	constructor( name, times, values, interpolation ) {

		if ( name === undefined ) throw new Error( 'THREE.KeyframeTrack: track name is undefined' );
		if ( times === undefined || times.length === 0 ) throw new Error( 'THREE.KeyframeTrack: no keyframes in track named ' + name );

		/**
		 * The track's name can refer to morph targets or bones or
		 * possibly other values within an animated object. See {@link PropertyBinding#parseTrackName}
		 * for the forms of strings that can be parsed for property binding.
		 *
		 * @type {string}
		 */
		this.name = name;

		/**
		 * The keyframe times.
		 *
		 * @type {Float32Array}
		 */
		this.times = convertArray( times, this.TimeBufferType );

		/**
		 * The keyframe values.
		 *
		 * @type {Float32Array}
		 */
		this.values = convertArray( values, this.ValueBufferType );

		this.setInterpolation( interpolation || this.DefaultInterpolation );

	}

	/**
	 * Converts the keyframe track to JSON.
	 *
	 * @static
	 * @param {KeyframeTrack} track - The keyframe track to serialize.
	 * @return {Object} The serialized keyframe track as JSON.
	 */
	static toJSON( track ) {

		const trackType = track.constructor;

		let json;

		// derived classes can define a static toJSON method
		if ( trackType.toJSON !== this.toJSON ) {

			json = trackType.toJSON( track );

		} else {

			// by default, we assume the data can be serialized as-is
			json = {

				'name': track.name,
				'times': convertArray( track.times, Array ),
				'values': convertArray( track.values, Array )

			};

			const interpolation = track.getInterpolation();

			if ( interpolation !== track.DefaultInterpolation ) {

				json.interpolation = interpolation;

			}

		}

		json.type = track.ValueTypeName; // mandatory

		return json;

	}

	/**
	 * Factory method for creating a new discrete interpolant.
	 *
	 * @static
	 * @param {TypedArray} [result] - The result buffer.
	 * @return {DiscreteInterpolant} The new interpolant.
	 */
	InterpolantFactoryMethodDiscrete( result ) {

		return new DiscreteInterpolant( this.times, this.values, this.getValueSize(), result );

	}

	/**
	 * Factory method for creating a new linear interpolant.
	 *
	 * @static
	 * @param {TypedArray} [result] - The result buffer.
	 * @return {LinearInterpolant} The new interpolant.
	 */
	InterpolantFactoryMethodLinear( result ) {

		return new LinearInterpolant( this.times, this.values, this.getValueSize(), result );

	}

	/**
	 * Factory method for creating a new smooth interpolant.
	 *
	 * @static
	 * @param {TypedArray} [result] - The result buffer.
	 * @return {CubicInterpolant} The new interpolant.
	 */
	InterpolantFactoryMethodSmooth( result ) {

		return new CubicInterpolant( this.times, this.values, this.getValueSize(), result );

	}

	/**
	 * Defines the interpolation factor method for this keyframe track.
	 *
	 * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} interpolation - The interpolation type.
	 * @return {KeyframeTrack} A reference to this keyframe track.
	 */
	setInterpolation( interpolation ) {

		let factoryMethod;

		switch ( interpolation ) {

			case InterpolateDiscrete:

				factoryMethod = this.InterpolantFactoryMethodDiscrete;

				break;

			case InterpolateLinear:

				factoryMethod = this.InterpolantFactoryMethodLinear;

				break;

			case InterpolateSmooth:

				factoryMethod = this.InterpolantFactoryMethodSmooth;

				break;

		}

		if ( factoryMethod === undefined ) {

			const message = 'unsupported interpolation for ' +
				this.ValueTypeName + ' keyframe track named ' + this.name;

			if ( this.createInterpolant === undefined ) {

				// fall back to default, unless the default itself is messed up
				if ( interpolation !== this.DefaultInterpolation ) {

					this.setInterpolation( this.DefaultInterpolation );

				} else {

					throw new Error( message ); // fatal, in this case

				}

			}

			console.warn( 'THREE.KeyframeTrack:', message );
			return this;

		}

		this.createInterpolant = factoryMethod;

		return this;

	}

	/**
	 * Returns the current interpolation type.
	 *
	 * @return {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} The interpolation type.
	 */
	getInterpolation() {

		switch ( this.createInterpolant ) {

			case this.InterpolantFactoryMethodDiscrete:

				return InterpolateDiscrete;

			case this.InterpolantFactoryMethodLinear:

				return InterpolateLinear;

			case this.InterpolantFactoryMethodSmooth:

				return InterpolateSmooth;

		}

	}

	/**
	 * Returns the value size.
	 *
	 * @return {number} The value size.
	 */
	getValueSize() {

		return this.values.length / this.times.length;

	}

	/**
	 * Moves all keyframes either forward or backward in time.
	 *
	 * @param {number} timeOffset - The offset to move the time values.
	 * @return {KeyframeTrack} A reference to this keyframe track.
	 */
	shift( timeOffset ) {

		if ( timeOffset !== 0.0 ) {

			const times = this.times;

			for ( let i = 0, n = times.length; i !== n; ++ i ) {

				times[ i ] += timeOffset;

			}

		}

		return this;

	}

	/**
	 * Scale all keyframe times by a factor (useful for frame - seconds conversions).
	 *
	 * @param {number} timeScale - The time scale.
	 * @return {KeyframeTrack} A reference to this keyframe track.
	 */
	scale( timeScale ) {

		if ( timeScale !== 1.0 ) {

			const times = this.times;

			for ( let i = 0, n = times.length; i !== n; ++ i ) {

				times[ i ] *= timeScale;

			}

		}

		return this;

	}

	/**
	 * Removes keyframes before and after animation without changing any values within the defined time range.
	 *
	 * Note: The method does not shift around keys to the start of the track time, because for interpolated
	 * keys this will change their values
	 *
	 * @param {number} startTime - The start time.
	 * @param {number} endTime - The end time.
	 * @return {KeyframeTrack} A reference to this keyframe track.
	 */
	trim( startTime, endTime ) {

		const times = this.times,
			nKeys = times.length;

		let from = 0,
			to = nKeys - 1;

		while ( from !== nKeys && times[ from ] < startTime ) {

			++ from;

		}

		while ( to !== -1 && times[ to ] > endTime ) {

			-- to;

		}

		++ to; // inclusive -> exclusive bound

		if ( from !== 0 || to !== nKeys ) {

			// empty tracks are forbidden, so keep at least one keyframe
			if ( from >= to ) {

				to = Math.max( to, 1 );
				from = to - 1;

			}

			const stride = this.getValueSize();
			this.times = times.slice( from, to );
			this.values = this.values.slice( from * stride, to * stride );

		}

		return this;

	}

	/**
	 * Performs minimal validation on the keyframe track. Returns `true` if the values
	 * are valid.
	 *
	 * @return {boolean} Whether the keyframes are valid or not.
	 */
	validate() {

		let valid = true;

		const valueSize = this.getValueSize();
		if ( valueSize - Math.floor( valueSize ) !== 0 ) {

			console.error( 'THREE.KeyframeTrack: Invalid value size in track.', this );
			valid = false;

		}

		const times = this.times,
			values = this.values,

			nKeys = times.length;

		if ( nKeys === 0 ) {

			console.error( 'THREE.KeyframeTrack: Track is empty.', this );
			valid = false;

		}

		let prevTime = null;

		for ( let i = 0; i !== nKeys; i ++ ) {

			const currTime = times[ i ];

			if ( typeof currTime === 'number' && isNaN( currTime ) ) {

				console.error( 'THREE.KeyframeTrack: Time is not a valid number.', this, i, currTime );
				valid = false;
				break;

			}

			if ( prevTime !== null && prevTime > currTime ) {

				console.error( 'THREE.KeyframeTrack: Out of order keys.', this, i, currTime, prevTime );
				valid = false;
				break;

			}

			prevTime = currTime;

		}

		if ( values !== undefined ) {

			if ( isTypedArray( values ) ) {

				for ( let i = 0, n = values.length; i !== n; ++ i ) {

					const value = values[ i ];

					if ( isNaN( value ) ) {

						console.error( 'THREE.KeyframeTrack: Value is not a valid number.', this, i, value );
						valid = false;
						break;

					}

				}

			}

		}

		return valid;

	}

	/**
	 * Optimizes this keyframe track by removing equivalent sequential keys (which are
	 * common in morph target sequences).
	 *
	 * @return {AnimationClip} A reference to this animation clip.
	 */
	optimize() {

		// (0,0,0,0,1,1,1,0,0,0,0,0,0,0) --> (0,0,1,1,0,0)

		// times or values may be shared with other tracks, so overwriting is unsafe
		const times = this.times.slice(),
			values = this.values.slice(),
			stride = this.getValueSize(),

			smoothInterpolation = this.getInterpolation() === InterpolateSmooth,

			lastIndex = times.length - 1;

		let writeIndex = 1;

		for ( let i = 1; i < lastIndex; ++ i ) {

			let keep = false;

			const time = times[ i ];
			const timeNext = times[ i + 1 ];

			// remove adjacent keyframes scheduled at the same time

			if ( time !== timeNext && ( i !== 1 || time !== times[ 0 ] ) ) {

				if ( ! smoothInterpolation ) {

					// remove unnecessary keyframes same as their neighbors

					const offset = i * stride,
						offsetP = offset - stride,
						offsetN = offset + stride;

					for ( let j = 0; j !== stride; ++ j ) {

						const value = values[ offset + j ];

						if ( value !== values[ offsetP + j ] ||
							value !== values[ offsetN + j ] ) {

							keep = true;
							break;

						}

					}

				} else {

					keep = true;

				}

			}

			// in-place compaction

			if ( keep ) {

				if ( i !== writeIndex ) {

					times[ writeIndex ] = times[ i ];

					const readOffset = i * stride,
						writeOffset = writeIndex * stride;

					for ( let j = 0; j !== stride; ++ j ) {

						values[ writeOffset + j ] = values[ readOffset + j ];

					}

				}

				++ writeIndex;

			}

		}

		// flush last keyframe (compaction looks ahead)

		if ( lastIndex > 0 ) {

			times[ writeIndex ] = times[ lastIndex ];

			for ( let readOffset = lastIndex * stride, writeOffset = writeIndex * stride, j = 0; j !== stride; ++ j ) {

				values[ writeOffset + j ] = values[ readOffset + j ];

			}

			++ writeIndex;

		}

		if ( writeIndex !== times.length ) {

			this.times = times.slice( 0, writeIndex );
			this.values = values.slice( 0, writeIndex * stride );

		} else {

			this.times = times;
			this.values = values;

		}

		return this;

	}

	/**
	 * Returns a new keyframe track with copied values from this instance.
	 *
	 * @return {KeyframeTrack} A clone of this instance.
	 */
	clone() {

		const times = this.times.slice();
		const values = this.values.slice();

		const TypedKeyframeTrack = this.constructor;
		const track = new TypedKeyframeTrack( this.name, times, values );

		// Interpolant argument to constructor is not saved, so copy the factory method directly.
		track.createInterpolant = this.createInterpolant;

		return track;

	}

}

/**
 * The value type name.
 *
 * @type {String}
 * @default ''
 */
KeyframeTrack.prototype.ValueTypeName = '';

/**
 * The time buffer type of this keyframe track.
 *
 * @type {TypedArray|Array}
 * @default Float32Array.constructor
 */
KeyframeTrack.prototype.TimeBufferType = Float32Array;

/**
 * The value buffer type of this keyframe track.
 *
 * @type {TypedArray|Array}
 * @default Float32Array.constructor
 */
KeyframeTrack.prototype.ValueBufferType = Float32Array;

/**
 * The default interpolation type of this keyframe track.
 *
 * @type {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)}
 * @default InterpolateLinear
 */
KeyframeTrack.prototype.DefaultInterpolation = InterpolateLinear;

/**
 * A track for boolean keyframe values.
 *
 * @augments KeyframeTrack
 */
class BooleanKeyframeTrack extends KeyframeTrack {

	/**
	 * Constructs a new boolean keyframe track.
	 *
	 * This keyframe track type has no `interpolation` parameter because the
	 * interpolation is always discrete.
	 *
	 * @param {string} name - The keyframe track's name.
	 * @param {Array<number>} times - A list of keyframe times.
	 * @param {Array<number>} values - A list of keyframe values.
	 */
	constructor( name, times, values ) {

		super( name, times, values );

	}

}

/**
 * The value type name.
 *
 * @type {String}
 * @default 'bool'
 */
BooleanKeyframeTrack.prototype.ValueTypeName = 'bool';

/**
 * The value buffer type of this keyframe track.
 *
 * @type {TypedArray|Array}
 * @default Array.constructor
 */
BooleanKeyframeTrack.prototype.ValueBufferType = Array;

/**
 * The default interpolation type of this keyframe track.
 *
 * @type {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)}
 * @default InterpolateDiscrete
 */
BooleanKeyframeTrack.prototype.DefaultInterpolation = InterpolateDiscrete;
BooleanKeyframeTrack.prototype.InterpolantFactoryMethodLinear = undefined;
BooleanKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = undefined;

/**
 * A track for color keyframe values.
 *
 * @augments KeyframeTrack
 */
class ColorKeyframeTrack extends KeyframeTrack {

	/**
	 * Constructs a new color keyframe track.
	 *
	 * @param {string} name - The keyframe track's name.
	 * @param {Array<number>} times - A list of keyframe times.
	 * @param {Array<number>} values - A list of keyframe values.
	 * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} [interpolation] - The interpolation type.
	 */
	constructor( name, times, values, interpolation ) {

		super( name, times, values, interpolation );

	}

}

/**
 * The value type name.
 *
 * @type {String}
 * @default 'color'
 */
ColorKeyframeTrack.prototype.ValueTypeName = 'color';

/**
 * A track for numeric keyframe values.
 *
 * @augments KeyframeTrack
 */
class NumberKeyframeTrack extends KeyframeTrack {

	/**
	 * Constructs a new number keyframe track.
	 *
	 * @param {string} name - The keyframe track's name.
	 * @param {Array<number>} times - A list of keyframe times.
	 * @param {Array<number>} values - A list of keyframe values.
	 * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} [interpolation] - The interpolation type.
	 */
	constructor( name, times, values, interpolation ) {

		super( name, times, values, interpolation );

	}

}

/**
 * The value type name.
 *
 * @type {String}
 * @default 'number'
 */
NumberKeyframeTrack.prototype.ValueTypeName = 'number';

/**
 * Spherical linear unit quaternion interpolant.
 *
 * @augments Interpolant
 */
class QuaternionLinearInterpolant extends Interpolant {

	/**
	 * Constructs a new SLERP interpolant.
	 *
	 * @param {TypedArray} parameterPositions - The parameter positions hold the interpolation factors.
	 * @param {TypedArray} sampleValues - The sample values.
	 * @param {number} sampleSize - The sample size
	 * @param {TypedArray} [resultBuffer] - The result buffer.
	 */
	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		super( parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	interpolate_( i1, t0, t, t1 ) {

		const result = this.resultBuffer,
			values = this.sampleValues,
			stride = this.valueSize,

			alpha = ( t - t0 ) / ( t1 - t0 );

		let offset = i1 * stride;

		for ( let end = offset + stride; offset !== end; offset += 4 ) {

			Quaternion.slerpFlat( result, 0, values, offset - stride, values, offset, alpha );

		}

		return result;

	}

}

/**
 * A track for Quaternion keyframe values.
 *
 * @augments KeyframeTrack
 */
class QuaternionKeyframeTrack extends KeyframeTrack {

	/**
	 * Constructs a new Quaternion keyframe track.
	 *
	 * @param {string} name - The keyframe track's name.
	 * @param {Array<number>} times - A list of keyframe times.
	 * @param {Array<number>} values - A list of keyframe values.
	 * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} [interpolation] - The interpolation type.
	 */
	constructor( name, times, values, interpolation ) {

		super( name, times, values, interpolation );

	}

	/**
	 * Overwritten so the method returns Quaternion based interpolant.
	 *
	 * @static
	 * @param {TypedArray} [result] - The result buffer.
	 * @return {QuaternionLinearInterpolant} The new interpolant.
	 */
	InterpolantFactoryMethodLinear( result ) {

		return new QuaternionLinearInterpolant( this.times, this.values, this.getValueSize(), result );

	}

}

/**
 * The value type name.
 *
 * @type {String}
 * @default 'quaternion'
 */
QuaternionKeyframeTrack.prototype.ValueTypeName = 'quaternion';
// ValueBufferType is inherited
// DefaultInterpolation is inherited;
QuaternionKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = undefined;

/**
 * A track for string keyframe values.
 *
 * @augments KeyframeTrack
 */
class StringKeyframeTrack extends KeyframeTrack {

	/**
	 * Constructs a new string keyframe track.
	 *
	 * This keyframe track type has no `interpolation` parameter because the
	 * interpolation is always discrete.
	 *
	 * @param {string} name - The keyframe track's name.
	 * @param {Array<number>} times - A list of keyframe times.
	 * @param {Array<number>} values - A list of keyframe values.
	 */
	constructor( name, times, values ) {

		super( name, times, values );

	}

}

/**
 * The value type name.
 *
 * @type {String}
 * @default 'string'
 */
StringKeyframeTrack.prototype.ValueTypeName = 'string';

/**
 * The value buffer type of this keyframe track.
 *
 * @type {TypedArray|Array}
 * @default Array.constructor
 */
StringKeyframeTrack.prototype.ValueBufferType = Array;

/**
 * The default interpolation type of this keyframe track.
 *
 * @type {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)}
 * @default InterpolateDiscrete
 */
StringKeyframeTrack.prototype.DefaultInterpolation = InterpolateDiscrete;
StringKeyframeTrack.prototype.InterpolantFactoryMethodLinear = undefined;
StringKeyframeTrack.prototype.InterpolantFactoryMethodSmooth = undefined;

/**
 * A track for vector keyframe values.
 *
 * @augments KeyframeTrack
 */
class VectorKeyframeTrack extends KeyframeTrack {

	/**
	 * Constructs a new vector keyframe track.
	 *
	 * @param {string} name - The keyframe track's name.
	 * @param {Array<number>} times - A list of keyframe times.
	 * @param {Array<number>} values - A list of keyframe values.
	 * @param {(InterpolateLinear|InterpolateDiscrete|InterpolateSmooth)} [interpolation] - The interpolation type.
	 */
	constructor( name, times, values, interpolation ) {

		super( name, times, values, interpolation );

	}

}

/**
 * The value type name.
 *
 * @type {String}
 * @default 'vector'
 */
VectorKeyframeTrack.prototype.ValueTypeName = 'vector';

/**
 * A reusable set of keyframe tracks which represent an animation.
 */
class AnimationClip {

	/**
	 * Constructs a new animation clip.
	 *
	 * Note: Instead of instantiating an AnimationClip directly with the constructor, you can
	 * use the static interface of this class for creating clips. In most cases though, animation clips
	 * will automatically be created by loaders when importing animated 3D assets.
	 *
	 * @param {string} [name=''] - The clip's name.
	 * @param {number} [duration=-1] - The clip's duration in seconds. If a negative value is passed,
	 * the duration will be calculated from the passed keyframes.
	 * @param {Array<KeyframeTrack>} tracks - An array of keyframe tracks.
	 * @param {(NormalAnimationBlendMode|AdditiveAnimationBlendMode)} [blendMode=NormalAnimationBlendMode] - Defines how the animation
	 * is blended/combined when two or more animations are simultaneously played.
	 */
	constructor( name = '', duration = -1, tracks = [], blendMode = NormalAnimationBlendMode ) {

		/**
		 * The clip's name.
		 *
		 * @type {string}
		 */
		this.name = name;

		/**
		 *  An array of keyframe tracks.
		 *
		 * @type {Array<KeyframeTrack>}
		 */
		this.tracks = tracks;

		/**
		 * The clip's duration in seconds.
		 *
		 * @type {number}
		 */
		this.duration = duration;

		/**
		 * Defines how the animation is blended/combined when two or more animations
		 * are simultaneously played.
		 *
		 * @type {(NormalAnimationBlendMode|AdditiveAnimationBlendMode)}
		 */
		this.blendMode = blendMode;

		/**
		 * The UUID of the animation clip.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.uuid = generateUUID();

		// this means it should figure out its duration by scanning the tracks
		if ( this.duration < 0 ) {

			this.resetDuration();

		}

	}

	/**
	 * Factory method for creating an animation clip from the given JSON.
	 *
	 * @static
	 * @param {Object} json - The serialized animation clip.
	 * @return {AnimationClip} The new animation clip.
	 */
	static parse( json ) {

		const tracks = [],
			jsonTracks = json.tracks,
			frameTime = 1.0 / ( json.fps || 1.0 );

		for ( let i = 0, n = jsonTracks.length; i !== n; ++ i ) {

			tracks.push( parseKeyframeTrack( jsonTracks[ i ] ).scale( frameTime ) );

		}

		const clip = new this( json.name, json.duration, tracks, json.blendMode );
		clip.uuid = json.uuid;

		return clip;

	}

	/**
	 * Serializes the given animation clip into JSON.
	 *
	 * @static
	 * @param {AnimationClip} clip - The animation clip to serialize.
	 * @return {Object} The JSON object.
	 */
	static toJSON( clip ) {

		const tracks = [],
			clipTracks = clip.tracks;

		const json = {

			'name': clip.name,
			'duration': clip.duration,
			'tracks': tracks,
			'uuid': clip.uuid,
			'blendMode': clip.blendMode

		};

		for ( let i = 0, n = clipTracks.length; i !== n; ++ i ) {

			tracks.push( KeyframeTrack.toJSON( clipTracks[ i ] ) );

		}

		return json;

	}

	/**
	 * Returns a new animation clip from the passed morph targets array of a
	 * geometry, taking a name and the number of frames per second.
	 *
	 * Note: The fps parameter is required, but the animation speed can be
	 * overridden via {@link AnimationAction#setDuration}.
	 *
	 * @static
	 * @param {string} name - The name of the animation clip.
	 * @param {Array<Object>} morphTargetSequence - A sequence of morph targets.
	 * @param {number} fps - The Frames-Per-Second value.
	 * @param {boolean} noLoop - Whether the clip should be no loop or not.
	 * @return {AnimationClip} The new animation clip.
	 */
	static CreateFromMorphTargetSequence( name, morphTargetSequence, fps, noLoop ) {

		const numMorphTargets = morphTargetSequence.length;
		const tracks = [];

		for ( let i = 0; i < numMorphTargets; i ++ ) {

			let times = [];
			let values = [];

			times.push(
				( i + numMorphTargets - 1 ) % numMorphTargets,
				i,
				( i + 1 ) % numMorphTargets );

			values.push( 0, 1, 0 );

			const order = getKeyframeOrder( times );
			times = sortedArray( times, 1, order );
			values = sortedArray( values, 1, order );

			// if there is a key at the first frame, duplicate it as the
			// last frame as well for perfect loop.
			if ( ! noLoop && times[ 0 ] === 0 ) {

				times.push( numMorphTargets );
				values.push( values[ 0 ] );

			}

			tracks.push(
				new NumberKeyframeTrack(
					'.morphTargetInfluences[' + morphTargetSequence[ i ].name + ']',
					times, values
				).scale( 1.0 / fps ) );

		}

		return new this( name, -1, tracks );

	}

	/**
	 * Searches for an animation clip by name, taking as its first parameter
	 * either an array of clips, or a mesh or geometry that contains an
	 * array named "animations" property.
	 *
	 * @static
	 * @param {(Array<AnimationClip>|Object3D)} objectOrClipArray - The array or object to search through.
	 * @param {string} name - The name to search for.
	 * @return {?AnimationClip} The found animation clip. Returns `null` if no clip has been found.
	 */
	static findByName( objectOrClipArray, name ) {

		let clipArray = objectOrClipArray;

		if ( ! Array.isArray( objectOrClipArray ) ) {

			const o = objectOrClipArray;
			clipArray = o.geometry && o.geometry.animations || o.animations;

		}

		for ( let i = 0; i < clipArray.length; i ++ ) {

			if ( clipArray[ i ].name === name ) {

				return clipArray[ i ];

			}

		}

		return null;

	}

	/**
	 * Returns an array of new AnimationClips created from the morph target
	 * sequences of a geometry, trying to sort morph target names into
	 * animation-group-based patterns like "Walk_001, Walk_002, Run_001, Run_002...".
	 *
	 * See {@link MD2Loader#parse} as an example for how the method should be used.
	 *
	 * @static
	 * @param {Array<Object>} morphTargets - A sequence of morph targets.
	 * @param {number} fps - The Frames-Per-Second value.
	 * @param {boolean} noLoop - Whether the clip should be no loop or not.
	 * @return {Array<AnimationClip>} An array of new animation clips.
	 */
	static CreateClipsFromMorphTargetSequences( morphTargets, fps, noLoop ) {

		const animationToMorphTargets = {};

		// tested with https://regex101.com/ on trick sequences
		// such flamingo_flyA_003, flamingo_run1_003, crdeath0059
		const pattern = /^([\w-]*?)([\d]+)$/;

		// sort morph target names into animation groups based
		// patterns like Walk_001, Walk_002, Run_001, Run_002
		for ( let i = 0, il = morphTargets.length; i < il; i ++ ) {

			const morphTarget = morphTargets[ i ];
			const parts = morphTarget.name.match( pattern );

			if ( parts && parts.length > 1 ) {

				const name = parts[ 1 ];

				let animationMorphTargets = animationToMorphTargets[ name ];

				if ( ! animationMorphTargets ) {

					animationToMorphTargets[ name ] = animationMorphTargets = [];

				}

				animationMorphTargets.push( morphTarget );

			}

		}

		const clips = [];

		for ( const name in animationToMorphTargets ) {

			clips.push( this.CreateFromMorphTargetSequence( name, animationToMorphTargets[ name ], fps, noLoop ) );

		}

		return clips;

	}

	/**
	 * Parses the `animation.hierarchy` format and returns a new animation clip.
	 *
	 * @static
	 * @deprecated since r175.
	 * @param {Object} animation - A serialized animation clip as JSON.
	 * @param {Array<Bones>} bones - An array of bones.
	 * @return {?AnimationClip} The new animation clip.
	 */
	static parseAnimation( animation, bones ) {

		console.warn( 'THREE.AnimationClip: parseAnimation() is deprecated and will be removed with r185' );

		if ( ! animation ) {

			console.error( 'THREE.AnimationClip: No animation in JSONLoader data.' );
			return null;

		}

		const addNonemptyTrack = function ( trackType, trackName, animationKeys, propertyName, destTracks ) {

			// only return track if there are actually keys.
			if ( animationKeys.length !== 0 ) {

				const times = [];
				const values = [];

				flattenJSON( animationKeys, times, values, propertyName );

				// empty keys are filtered out, so check again
				if ( times.length !== 0 ) {

					destTracks.push( new trackType( trackName, times, values ) );

				}

			}

		};

		const tracks = [];

		const clipName = animation.name || 'default';
		const fps = animation.fps || 30;
		const blendMode = animation.blendMode;

		// automatic length determination in AnimationClip.
		let duration = animation.length || -1;

		const hierarchyTracks = animation.hierarchy || [];

		for ( let h = 0; h < hierarchyTracks.length; h ++ ) {

			const animationKeys = hierarchyTracks[ h ].keys;

			// skip empty tracks
			if ( ! animationKeys || animationKeys.length === 0 ) continue;

			// process morph targets
			if ( animationKeys[ 0 ].morphTargets ) {

				// figure out all morph targets used in this track
				const morphTargetNames = {};

				let k;

				for ( k = 0; k < animationKeys.length; k ++ ) {

					if ( animationKeys[ k ].morphTargets ) {

						for ( let m = 0; m < animationKeys[ k ].morphTargets.length; m ++ ) {

							morphTargetNames[ animationKeys[ k ].morphTargets[ m ] ] = -1;

						}

					}

				}

				// create a track for each morph target with all zero
				// morphTargetInfluences except for the keys in which
				// the morphTarget is named.
				for ( const morphTargetName in morphTargetNames ) {

					const times = [];
					const values = [];

					for ( let m = 0; m !== animationKeys[ k ].morphTargets.length; ++ m ) {

						const animationKey = animationKeys[ k ];

						times.push( animationKey.time );
						values.push( ( animationKey.morphTarget === morphTargetName ) ? 1 : 0 );

					}

					tracks.push( new NumberKeyframeTrack( '.morphTargetInfluence[' + morphTargetName + ']', times, values ) );

				}

				duration = morphTargetNames.length * fps;

			} else {

				// ...assume skeletal animation

				const boneName = '.bones[' + bones[ h ].name + ']';

				addNonemptyTrack(
					VectorKeyframeTrack, boneName + '.position',
					animationKeys, 'pos', tracks );

				addNonemptyTrack(
					QuaternionKeyframeTrack, boneName + '.quaternion',
					animationKeys, 'rot', tracks );

				addNonemptyTrack(
					VectorKeyframeTrack, boneName + '.scale',
					animationKeys, 'scl', tracks );

			}

		}

		if ( tracks.length === 0 ) {

			return null;

		}

		const clip = new this( clipName, duration, tracks, blendMode );

		return clip;

	}

	/**
	 * Sets the duration of this clip to the duration of its longest keyframe track.
	 *
	 * @return {AnimationClip} A reference to this animation clip.
	 */
	resetDuration() {

		const tracks = this.tracks;
		let duration = 0;

		for ( let i = 0, n = tracks.length; i !== n; ++ i ) {

			const track = this.tracks[ i ];

			duration = Math.max( duration, track.times[ track.times.length - 1 ] );

		}

		this.duration = duration;

		return this;

	}

	/**
	 * Trims all tracks to the clip's duration.
	 *
	 * @return {AnimationClip} A reference to this animation clip.
	 */
	trim() {

		for ( let i = 0; i < this.tracks.length; i ++ ) {

			this.tracks[ i ].trim( 0, this.duration );

		}

		return this;

	}

	/**
	 * Performs minimal validation on each track in the clip. Returns `true` if all
	 * tracks are valid.
	 *
	 * @return {boolean} Whether the clip's keyframes are valid or not.
	 */
	validate() {

		let valid = true;

		for ( let i = 0; i < this.tracks.length; i ++ ) {

			valid = valid && this.tracks[ i ].validate();

		}

		return valid;

	}

	/**
	 * Optimizes each track by removing equivalent sequential keys (which are
	 * common in morph target sequences).
	 *
	 * @return {AnimationClip} A reference to this animation clip.
	 */
	optimize() {

		for ( let i = 0; i < this.tracks.length; i ++ ) {

			this.tracks[ i ].optimize();

		}

		return this;

	}

	/**
	 * Returns a new animation clip with copied values from this instance.
	 *
	 * @return {AnimationClip} A clone of this instance.
	 */
	clone() {

		const tracks = [];

		for ( let i = 0; i < this.tracks.length; i ++ ) {

			tracks.push( this.tracks[ i ].clone() );

		}

		return new this.constructor( this.name, this.duration, tracks, this.blendMode );

	}

	/**
	 * Serializes this animation clip into JSON.
	 *
	 * @return {Object} The JSON object.
	 */
	toJSON() {

		return this.constructor.toJSON( this );

	}

}

function getTrackTypeForValueTypeName( typeName ) {

	switch ( typeName.toLowerCase() ) {

		case 'scalar':
		case 'double':
		case 'float':
		case 'number':
		case 'integer':

			return NumberKeyframeTrack;

		case 'vector':
		case 'vector2':
		case 'vector3':
		case 'vector4':

			return VectorKeyframeTrack;

		case 'color':

			return ColorKeyframeTrack;

		case 'quaternion':

			return QuaternionKeyframeTrack;

		case 'bool':
		case 'boolean':

			return BooleanKeyframeTrack;

		case 'string':

			return StringKeyframeTrack;

	}

	throw new Error( 'THREE.KeyframeTrack: Unsupported typeName: ' + typeName );

}

function parseKeyframeTrack( json ) {

	if ( json.type === undefined ) {

		throw new Error( 'THREE.KeyframeTrack: track type undefined, can not parse' );

	}

	const trackType = getTrackTypeForValueTypeName( json.type );

	if ( json.times === undefined ) {

		const times = [], values = [];

		flattenJSON( json.keys, times, values, 'value' );

		json.times = times;
		json.values = values;

	}

	// derived classes can define a static parse method
	if ( trackType.parse !== undefined ) {

		return trackType.parse( json );

	} else {

		// by default, we assume a constructor compatible with the base
		return new trackType( json.name, json.times, json.values, json.interpolation );

	}

}

/**
 * @class
 * @classdesc A simple caching system, used internally by {@link FileLoader}.
 * To enable caching across all loaders that use {@link FileLoader}, add `THREE.Cache.enabled = true.` once in your app.
 * @hideconstructor
 */
const Cache = {

	/**
	 * Whether caching is enabled or not.
	 *
	 * @static
	 * @type {boolean}
	 * @default false
	 */
	enabled: false,

	/**
	 * A dictionary that holds cached files.
	 *
	 * @static
	 * @type {Object<string,Object>}
	 */
	files: {},

	/**
	 * Adds a cache entry with a key to reference the file. If this key already
	 * holds a file, it is overwritten.
	 *
	 * @static
	 * @param {string} key - The key to reference the cached file.
	 * @param {Object} file -  The file to be cached.
	 */
	add: function ( key, file ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Adding key:', key );

		this.files[ key ] = file;

	},

	/**
	 * Gets the cached value for the given key.
	 *
	 * @static
	 * @param {string} key - The key to reference the cached file.
	 * @return {Object|undefined} The cached file. If the key does not exist `undefined` is returned.
	 */
	get: function ( key ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Checking key:', key );

		return this.files[ key ];

	},

	/**
	 * Removes the cached file associated with the given key.
	 *
	 * @static
	 * @param {string} key - The key to reference the cached file.
	 */
	remove: function ( key ) {

		delete this.files[ key ];

	},

	/**
	 * Remove all values from the cache.
	 *
	 * @static
	 */
	clear: function () {

		this.files = {};

	}

};

/**
 * Handles and keeps track of loaded and pending data. A default global
 * instance of this class is created and used by loaders if not supplied
 * manually.
 *
 * In general that should be sufficient, however there are times when it can
 * be useful to have separate loaders - for example if you want to show
 * separate loading bars for objects and textures.
 *
 * ```js
 * const manager = new THREE.LoadingManager();
 * manager.onLoad = () => console.log( 'Loading complete!' );
 *
 * const loader1 = new OBJLoader( manager );
 * const loader2 = new ColladaLoader( manager );
 * ```
 */
class LoadingManager {

	/**
	 * Constructs a new loading manager.
	 *
	 * @param {Function} [onLoad] - Executes when all items have been loaded.
	 * @param {Function} [onProgress] - Executes when single items have been loaded.
	 * @param {Function} [onError] - Executes when an error occurs.
	 */
	constructor( onLoad, onProgress, onError ) {

		const scope = this;

		let isLoading = false;
		let itemsLoaded = 0;
		let itemsTotal = 0;
		let urlModifier = undefined;
		const handlers = [];

		// Refer to #5689 for the reason why we don't set .onStart
		// in the constructor

		/**
		 * Executes when an item starts loading.
		 *
		 * @type {Function|undefined}
		 * @default undefined
		 */
		this.onStart = undefined;

		/**
		 * Executes when all items have been loaded.
		 *
		 * @type {Function|undefined}
		 * @default undefined
		 */
		this.onLoad = onLoad;

		/**
		 * Executes when single items have been loaded.
		 *
		 * @type {Function|undefined}
		 * @default undefined
		 */
		this.onProgress = onProgress;

		/**
		 * Executes when an error occurs.
		 *
		 * @type {Function|undefined}
		 * @default undefined
		 */
		this.onError = onError;

		/**
		 * This should be called by any loader using the manager when the loader
		 * starts loading an item.
		 *
		 * @param {string} url - The URL to load.
		 */
		this.itemStart = function ( url ) {

			itemsTotal ++;

			if ( isLoading === false ) {

				if ( scope.onStart !== undefined ) {

					scope.onStart( url, itemsLoaded, itemsTotal );

				}

			}

			isLoading = true;

		};

		/**
		 * This should be called by any loader using the manager when the loader
		 * ended loading an item.
		 *
		 * @param {string} url - The URL of the loaded item.
		 */
		this.itemEnd = function ( url ) {

			itemsLoaded ++;

			if ( scope.onProgress !== undefined ) {

				scope.onProgress( url, itemsLoaded, itemsTotal );

			}

			if ( itemsLoaded === itemsTotal ) {

				isLoading = false;

				if ( scope.onLoad !== undefined ) {

					scope.onLoad();

				}

			}

		};

		/**
		 * This should be called by any loader using the manager when the loader
		 * encounters an error when loading an item.
		 *
		 * @param {string} url - The URL of the item that produces an error.
		 */
		this.itemError = function ( url ) {

			if ( scope.onError !== undefined ) {

				scope.onError( url );

			}

		};

		/**
		 * Given a URL, uses the URL modifier callback (if any) and returns a
		 * resolved URL. If no URL modifier is set, returns the original URL.
		 *
		 * @param {string} url - The URL to load.
		 * @return {string} The resolved URL.
		 */
		this.resolveURL = function ( url ) {

			if ( urlModifier ) {

				return urlModifier( url );

			}

			return url;

		};

		/**
		 * If provided, the callback will be passed each resource URL before a
		 * request is sent. The callback may return the original URL, or a new URL to
		 * override loading behavior. This behavior can be used to load assets from
		 * .ZIP files, drag-and-drop APIs, and Data URIs.
		 *
		 * ```js
		 * const blobs = {'fish.gltf': blob1, 'diffuse.png': blob2, 'normal.png': blob3};
		 *
		 * const manager = new THREE.LoadingManager();
		 *
		 * // Initialize loading manager with URL callback.
		 * const objectURLs = [];
		 * manager.setURLModifier( ( url ) => {
		 *
		 * 	url = URL.createObjectURL( blobs[ url ] );
		 * 	objectURLs.push( url );
		 * 	return url;
		 *
		 * } );
		 *
		 * // Load as usual, then revoke the blob URLs.
		 * const loader = new GLTFLoader( manager );
		 * loader.load( 'fish.gltf', (gltf) => {
		 *
		 * 	scene.add( gltf.scene );
		 * 	objectURLs.forEach( ( url ) => URL.revokeObjectURL( url ) );
		 *
		 * } );
		 * ```
		 *
		 * @param {function(string):string} transform - URL modifier callback. Called with an URL and must return a resolved URL.
		 * @return {LoadingManager} A reference to this loading manager.
		 */
		this.setURLModifier = function ( transform ) {

			urlModifier = transform;

			return this;

		};

		/**
		 * Registers a loader with the given regular expression. Can be used to
		 * define what loader should be used in order to load specific files. A
		 * typical use case is to overwrite the default loader for textures.
		 *
		 * ```js
		 * // add handler for TGA textures
		 * manager.addHandler( /\.tga$/i, new TGALoader() );
		 * ```
		 *
		 * @param {string} regex - A regular expression.
		 * @param {Loader} loader - A loader that should handle matched cases.
		 * @return {LoadingManager} A reference to this loading manager.
		 */
		this.addHandler = function ( regex, loader ) {

			handlers.push( regex, loader );

			return this;

		};

		/**
		 * Removes the loader for the given regular expression.
		 *
		 * @param {string} regex - A regular expression.
		 * @return {LoadingManager} A reference to this loading manager.
		 */
		this.removeHandler = function ( regex ) {

			const index = handlers.indexOf( regex );

			if ( index !== -1 ) {

				handlers.splice( index, 2 );

			}

			return this;

		};

		/**
		 * Can be used to retrieve the registered loader for the given file path.
		 *
		 * @param {string} file - The file path.
		 * @return {?Loader} The registered loader. Returns `null` if no loader was found.
		 */
		this.getHandler = function ( file ) {

			for ( let i = 0, l = handlers.length; i < l; i += 2 ) {

				const regex = handlers[ i ];
				const loader = handlers[ i + 1 ];

				if ( regex.global ) regex.lastIndex = 0; // see #17920

				if ( regex.test( file ) ) {

					return loader;

				}

			}

			return null;

		};

	}

}

/**
 * The global default loading manager.
 *
 * @constant
 * @type {LoadingManager}
 */
const DefaultLoadingManager = /*@__PURE__*/ new LoadingManager();

/**
 * Abstract base class for loaders.
 *
 * @abstract
 */
class Loader {

	/**
	 * Constructs a new loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		/**
		 * The loading manager.
		 *
		 * @type {LoadingManager}
		 * @default DefaultLoadingManager
		 */
		this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;

		/**
		 * The crossOrigin string to implement CORS for loading the url from a
		 * different domain that allows CORS.
		 *
		 * @type {string}
		 * @default 'anonymous'
		 */
		this.crossOrigin = 'anonymous';

		/**
		 * Whether the XMLHttpRequest uses credentials.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.withCredentials = false;

		/**
		 * The base path from which the asset will be loaded.
		 *
		 * @type {string}
		 */
		this.path = '';

		/**
		 * The base path from which additional resources like textures will be loaded.
		 *
		 * @type {string}
		 */
		this.resourcePath = '';

		/**
		 * The [request header]{@link https://developer.mozilla.org/en-US/docs/Glossary/Request_header}
		 * used in HTTP request.
		 *
		 * @type {Object<string, any>}
		 */
		this.requestHeader = {};

	}

	/**
	 * This method needs to be implemented by all concrete loaders. It holds the
	 * logic for loading assets from the backend.
	 *
	 * @param {string} url - The path/URL of the file to be loaded.
	 * @param {Function} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} [onProgress] - Executed while the loading is in progress.
	 * @param {onErrorCallback} [onError] - Executed when errors occur.
	 */
	load( /* url, onLoad, onProgress, onError */ ) {}

	/**
	 * A async version of {@link Loader#load}.
	 *
	 * @param {string} url - The path/URL of the file to be loaded.
	 * @param {onProgressCallback} [onProgress] - Executed while the loading is in progress.
	 * @return {Promise} A Promise that resolves when the asset has been loaded.
	 */
	loadAsync( url, onProgress ) {

		const scope = this;

		return new Promise( function ( resolve, reject ) {

			scope.load( url, resolve, onProgress, reject );

		} );

	}

	/**
	 * This method needs to be implemented by all concrete loaders. It holds the
	 * logic for parsing the asset into three.js entities.
	 *
	 * @param {any} data - The data to parse.
	 */
	parse( /* data */ ) {}

	/**
	 * Sets the `crossOrigin` String to implement CORS for loading the URL
	 * from a different domain that allows CORS.
	 *
	 * @param {string} crossOrigin - The `crossOrigin` value.
	 * @return {Loader} A reference to this instance.
	 */
	setCrossOrigin( crossOrigin ) {

		this.crossOrigin = crossOrigin;
		return this;

	}

	/**
	 * Whether the XMLHttpRequest uses credentials such as cookies, authorization
	 * headers or TLS client certificates, see [XMLHttpRequest.withCredentials]{@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials}.
	 *
	 * Note: This setting has no effect if you are loading files locally or from the same domain.
	 *
	 * @param {boolean} value - The `withCredentials` value.
	 * @return {Loader} A reference to this instance.
	 */
	setWithCredentials( value ) {

		this.withCredentials = value;
		return this;

	}

	/**
	 * Sets the base path for the asset.
	 *
	 * @param {string} path - The base path.
	 * @return {Loader} A reference to this instance.
	 */
	setPath( path ) {

		this.path = path;
		return this;

	}

	/**
	 * Sets the base path for dependent resources like textures.
	 *
	 * @param {string} resourcePath - The resource path.
	 * @return {Loader} A reference to this instance.
	 */
	setResourcePath( resourcePath ) {

		this.resourcePath = resourcePath;
		return this;

	}

	/**
	 * Sets the given request header.
	 *
	 * @param {Object} requestHeader - A [request header]{@link https://developer.mozilla.org/en-US/docs/Glossary/Request_header}
	 * for configuring the HTTP request.
	 * @return {Loader} A reference to this instance.
	 */
	setRequestHeader( requestHeader ) {

		this.requestHeader = requestHeader;
		return this;

	}

}

/**
 * Callback for onProgress in loaders.
 *
 * @callback onProgressCallback
 * @param {ProgressEvent} event - An instance of `ProgressEvent` that represents the current loading status.
 */

/**
 * Callback for onError in loaders.
 *
 * @callback onErrorCallback
 * @param {Error} error - The error which occurred during the loading process.
 */

/**
 * The default material name that is used by loaders
 * when creating materials for loaded 3D objects.
 *
 * Note: Not all loaders might honor this setting.
 *
 * @static
 * @type {string}
 * @default '__DEFAULT'
 */
Loader.DEFAULT_MATERIAL_NAME = '__DEFAULT';

const loading = {};

class HttpError extends Error {

	constructor( message, response ) {

		super( message );
		this.response = response;

	}

}

/**
 * A low level class for loading resources with the Fetch API, used internally by
 * most loaders. It can also be used directly to load any file type that does
 * not have a loader.
 *
 * This loader supports caching. If you want to use it, add `THREE.Cache.enabled = true;`
 * once to your application.
 *
 * ```js
 * const loader = new THREE.FileLoader();
 * const data = await loader.loadAsync( 'example.txt' );
 * ```
 *
 * @augments Loader
 */
class FileLoader extends Loader {

	/**
	 * Constructs a new file loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

		/**
		 * The expected mime type.
		 *
		 * @type {string}
		 */
		this.mimeType = '';

		/**
		 * The expected response type.
		 *
		 * @type {('arraybuffer'|'blob'|'document'|'json'|'')}
		 * @default ''
		 */
		this.responseType = '';

	}

	/**
	 * Starts loading from the given URL and pass the loaded response to the `onLoad()` callback.
	 *
	 * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param {function(any)} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} [onProgress] - Executed while the loading is in progress.
	 * @param {onErrorCallback} [onError] - Executed when errors occur.
	 * @return {any|undefined} The cached resource if available.
	 */
	load( url, onLoad, onProgress, onError ) {

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			this.manager.itemStart( url );

			setTimeout( () => {

				if ( onLoad ) onLoad( cached );

				this.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		// Check if request is duplicate

		if ( loading[ url ] !== undefined ) {

			loading[ url ].push( {

				onLoad: onLoad,
				onProgress: onProgress,
				onError: onError

			} );

			return;

		}

		// Initialise array for duplicate requests
		loading[ url ] = [];

		loading[ url ].push( {
			onLoad: onLoad,
			onProgress: onProgress,
			onError: onError,
		} );

		// create request
		const req = new Request( url, {
			headers: new Headers( this.requestHeader ),
			credentials: this.withCredentials ? 'include' : 'same-origin',
			// An abort controller could be added within a future PR
		} );

		// record states ( avoid data race )
		const mimeType = this.mimeType;
		const responseType = this.responseType;

		// start the fetch
		fetch( req )
			.then( response => {

				if ( response.status === 200 || response.status === 0 ) {

					// Some browsers return HTTP Status 0 when using non-http protocol
					// e.g. 'file://' or 'data://'. Handle as success.

					if ( response.status === 0 ) {

						console.warn( 'THREE.FileLoader: HTTP Status 0 received.' );

					}

					// Workaround: Checking if response.body === undefined for Alipay browser #23548

					if ( typeof ReadableStream === 'undefined' || response.body === undefined || response.body.getReader === undefined ) {

						return response;

					}

					const callbacks = loading[ url ];
					const reader = response.body.getReader();

					// Nginx needs X-File-Size check
					// https://serverfault.com/questions/482875/why-does-nginx-remove-content-length-header-for-chunked-content
					const contentLength = response.headers.get( 'X-File-Size' ) || response.headers.get( 'Content-Length' );
					const total = contentLength ? parseInt( contentLength ) : 0;
					const lengthComputable = total !== 0;
					let loaded = 0;

					// periodically read data into the new stream tracking while download progress
					const stream = new ReadableStream( {
						start( controller ) {

							readData();

							function readData() {

								reader.read().then( ( { done, value } ) => {

									if ( done ) {

										controller.close();

									} else {

										loaded += value.byteLength;

										const event = new ProgressEvent( 'progress', { lengthComputable, loaded, total } );
										for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

											const callback = callbacks[ i ];
											if ( callback.onProgress ) callback.onProgress( event );

										}

										controller.enqueue( value );
										readData();

									}

								}, ( e ) => {

									controller.error( e );

								} );

							}

						}

					} );

					return new Response( stream );

				} else {

					throw new HttpError( `fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`, response );

				}

			} )
			.then( response => {

				switch ( responseType ) {

					case 'arraybuffer':

						return response.arrayBuffer();

					case 'blob':

						return response.blob();

					case 'document':

						return response.text()
							.then( text => {

								const parser = new DOMParser();
								return parser.parseFromString( text, mimeType );

							} );

					case 'json':

						return response.json();

					default:

						if ( mimeType === '' ) {

							return response.text();

						} else {

							// sniff encoding
							const re = /charset="?([^;"\s]*)"?/i;
							const exec = re.exec( mimeType );
							const label = exec && exec[ 1 ] ? exec[ 1 ].toLowerCase() : undefined;
							const decoder = new TextDecoder( label );
							return response.arrayBuffer().then( ab => decoder.decode( ab ) );

						}

				}

			} )
			.then( data => {

				// Add to cache only on HTTP success, so that we do not cache
				// error response bodies as proper responses to requests.
				Cache.add( url, data );

				const callbacks = loading[ url ];
				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

					const callback = callbacks[ i ];
					if ( callback.onLoad ) callback.onLoad( data );

				}

			} )
			.catch( err => {

				// Abort errors and other errors are handled the same

				const callbacks = loading[ url ];

				if ( callbacks === undefined ) {

					// When onLoad was called and url was deleted in `loading`
					this.manager.itemError( url );
					throw err;

				}

				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

					const callback = callbacks[ i ];
					if ( callback.onError ) callback.onError( err );

				}

				this.manager.itemError( url );

			} )
			.finally( () => {

				this.manager.itemEnd( url );

			} );

		this.manager.itemStart( url );

	}

	/**
	 * Sets the expected response type.
	 *
	 * @param {('arraybuffer'|'blob'|'document'|'json'|'')} value - The response type.
	 * @return {FileLoader} A reference to this file loader.
	 */
	setResponseType( value ) {

		this.responseType = value;
		return this;

	}

	/**
	 * Sets the expected mime type of the loaded file.
	 *
	 * @param {string} value - The mime type.
	 * @return {FileLoader} A reference to this file loader.
	 */
	setMimeType( value ) {

		this.mimeType = value;
		return this;

	}

}

/**
 * A loader for loading images. The class loads images with the HTML `Image` API.
 *
 * ```js
 * const loader = new THREE.ImageLoader();
 * const image = await loader.loadAsync( 'image.png' );
 * ```
 * Please note that `ImageLoader` has dropped support for progress
 * events in `r84`. For an `ImageLoader` that supports progress events, see
 * [this thread]{@link https://github.com/mrdoob/three.js/issues/10439#issuecomment-275785639}.
 *
 * @augments Loader
 */
class ImageLoader extends Loader {

	/**
	 * Constructs a new image loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

	}

	/**
	 * Starts loading from the given URL and passes the loaded image
	 * to the `onLoad()` callback. The method also returns a new `Image` object which can
	 * directly be used for texture creation. If you do it this way, the texture
	 * may pop up in your scene once the respective loading process is finished.
	 *
	 * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param {function(Image)} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} onProgress - Unsupported in this loader.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 * @return {Image} The image.
	 */
	load( url, onLoad, onProgress, onError ) {

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const scope = this;

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		const image = createElementNS( 'img' );

		function onImageLoad() {

			removeEventListeners();

			Cache.add( url, this );

			if ( onLoad ) onLoad( this );

			scope.manager.itemEnd( url );

		}

		function onImageError( event ) {

			removeEventListeners();

			if ( onError ) onError( event );

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		}

		function removeEventListeners() {

			image.removeEventListener( 'load', onImageLoad, false );
			image.removeEventListener( 'error', onImageError, false );

		}

		image.addEventListener( 'load', onImageLoad, false );
		image.addEventListener( 'error', onImageError, false );

		if ( url.slice( 0, 5 ) !== 'data:' ) {

			if ( this.crossOrigin !== undefined ) image.crossOrigin = this.crossOrigin;

		}

		scope.manager.itemStart( url );

		image.src = url;

		return image;

	}

}

/**
 * Class for loading textures. Images are internally
 * loaded via {@link ImageLoader}.
 *
 * ```js
 * const loader = new THREE.TextureLoader();
 * const texture = await loader.loadAsync( 'textures/land_ocean_ice_cloud_2048.jpg' );
 *
 * const material = new THREE.MeshBasicMaterial( { map:texture } );
 * ```
 * Please note that `TextureLoader` has dropped support for progress
 * events in `r84`. For a `TextureLoader` that supports progress events, see
 * [this thread]{@link https://github.com/mrdoob/three.js/issues/10439#issuecomment-293260145}.
 *
 * @augments Loader
 */
class TextureLoader extends Loader {

	/**
	 * Constructs a new texture loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

	}

	/**
	 * Starts loading from the given URL and pass the fully loaded texture
	 * to the `onLoad()` callback. The method also returns a new texture object which can
	 * directly be used for material creation. If you do it this way, the texture
	 * may pop up in your scene once the respective loading process is finished.
	 *
	 * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param {function(Texture)} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} onProgress - Unsupported in this loader.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 * @return {Texture} The texture.
	 */
	load( url, onLoad, onProgress, onError ) {

		const texture = new Texture();

		const loader = new ImageLoader( this.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.setPath( this.path );

		loader.load( url, function ( image ) {

			texture.image = image;
			texture.needsUpdate = true;

			if ( onLoad !== undefined ) {

				onLoad( texture );

			}

		}, onProgress, onError );

		return texture;

	}

}

/**
 * Abstract base class for lights - all other light types inherit the
 * properties and methods described here.
 *
 * @abstract
 * @augments Object3D
 */
class Light extends Object3D {

	/**
	 * Constructs a new light.
	 *
	 * @param {(number|Color|string)} [color=0xffffff] - The light's color.
	 * @param {number} [intensity=1] - The light's strength/intensity.
	 */
	constructor( color, intensity = 1 ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isLight = true;

		this.type = 'Light';

		/**
		 * The light's color.
		 *
		 * @type {Color}
		 */
		this.color = new Color( color );

		/**
		 * The light's intensity.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.intensity = intensity;

	}

	/**
	 * Frees the GPU-related resources allocated by this instance. Call this
	 * method whenever this instance is no longer used in your app.
	 */
	dispose() {

		// Empty here in base class; some subclasses override.

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.color.copy( source.color );
		this.intensity = source.intensity;

		return this;

	}

	toJSON( meta ) {

		const data = super.toJSON( meta );

		data.object.color = this.color.getHex();
		data.object.intensity = this.intensity;

		if ( this.groundColor !== undefined ) data.object.groundColor = this.groundColor.getHex();

		if ( this.distance !== undefined ) data.object.distance = this.distance;
		if ( this.angle !== undefined ) data.object.angle = this.angle;
		if ( this.decay !== undefined ) data.object.decay = this.decay;
		if ( this.penumbra !== undefined ) data.object.penumbra = this.penumbra;

		if ( this.shadow !== undefined ) data.object.shadow = this.shadow.toJSON();
		if ( this.target !== undefined ) data.object.target = this.target.uuid;

		return data;

	}

}

const _projScreenMatrix$1 = /*@__PURE__*/ new Matrix4();
const _lightPositionWorld$1 = /*@__PURE__*/ new Vector3();
const _lookTarget$1 = /*@__PURE__*/ new Vector3();

/**
 * Abstract base class for light shadow classes. These classes
 * represent the shadow configuration for different light types.
 *
 * @abstract
 */
class LightShadow {

	/**
	 * Constructs a new light shadow.
	 *
	 * @param {Camera} camera - The light's view of the world.
	 */
	constructor( camera ) {

		/**
		 * The light's view of the world.
		 *
		 * @type {Camera}
		 */
		this.camera = camera;

		/**
		 * The intensity of the shadow. The default is `1`.
		 * Valid values are in the range `[0, 1]`.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.intensity = 1;

		/**
		 * Shadow map bias, how much to add or subtract from the normalized depth
		 * when deciding whether a surface is in shadow.
		 *
		 * The default is `0`. Very tiny adjustments here (in the order of `0.0001`)
		 * may help reduce artifacts in shadows.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.bias = 0;

		/**
		 * Defines how much the position used to query the shadow map is offset along
		 * the object normal. The default is `0`. Increasing this value can be used to
		 * reduce shadow acne especially in large scenes where light shines onto
		 * geometry at a shallow angle. The cost is that shadows may appear distorted.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.normalBias = 0;

		/**
		 * Setting this to values greater than 1 will blur the edges of the shadow.
		 * High values will cause unwanted banding effects in the shadows - a greater
		 * map size will allow for a higher value to be used here before these effects
		 * become visible.
		 *
		 * The property has no effect when the shadow map type is `PCFSoftShadowMap` and
		 * and it is recommended to increase softness by decreasing the shadow map size instead.
		 *
		 * The property has no effect when the shadow map type is `BasicShadowMap`.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.radius = 1;

		/**
		 * The amount of samples to use when blurring a VSM shadow map.
		 *
		 * @type {number}
		 * @default 8
		 */
		this.blurSamples = 8;

		/**
		 * Defines the width and height of the shadow map. Higher values give better quality
		 * shadows at the cost of computation time. Values must be powers of two.
		 *
		 * @type {Vector2}
		 * @default (512,512)
		 */
		this.mapSize = new Vector2( 512, 512 );

		/**
		 * The depth map generated using the internal camera; a location beyond a
		 * pixel's depth is in shadow. Computed internally during rendering.
		 *
		 * @type {?RenderTarget}
		 * @default null
		 */
		this.map = null;

		/**
		 * The distribution map generated using the internal camera; an occlusion is
		 * calculated based on the distribution of depths. Computed internally during
		 * rendering.
		 *
		 * @type {?RenderTarget}
		 * @default null
		 */
		this.mapPass = null;

		/**
		 * Model to shadow camera space, to compute location and depth in shadow map.
		 * This is computed internally during rendering.
		 *
		 * @type {Matrix4}
		 */
		this.matrix = new Matrix4();

		/**
		 * Enables automatic updates of the light's shadow. If you do not require dynamic
		 * lighting / shadows, you may set this to `false`.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.autoUpdate = true;

		/**
		 * When set to `true`, shadow maps will be updated in the next `render` call.
		 * If you have set {@link LightShadow#autoUpdate} to `false`, you will need to
		 * set this property to `true` and then make a render call to update the light's shadow.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.needsUpdate = false;

		this._frustum = new Frustum();
		this._frameExtents = new Vector2( 1, 1 );

		this._viewportCount = 1;

		this._viewports = [

			new Vector4( 0, 0, 1, 1 )

		];

	}

	/**
	 * Used internally by the renderer to get the number of viewports that need
	 * to be rendered for this shadow.
	 *
	 * @return {number} The viewport count.
	 */
	getViewportCount() {

		return this._viewportCount;

	}

	/**
	 * Gets the shadow cameras frustum. Used internally by the renderer to cull objects.
	 *
	 * @return {Frustum} The shadow camera frustum.
	 */
	getFrustum() {

		return this._frustum;

	}

	/**
	 * Update the matrices for the camera and shadow, used internally by the renderer.
	 *
	 * @param {Light} light - The light for which the shadow is being rendered.
	 */
	updateMatrices( light ) {

		const shadowCamera = this.camera;
		const shadowMatrix = this.matrix;

		_lightPositionWorld$1.setFromMatrixPosition( light.matrixWorld );
		shadowCamera.position.copy( _lightPositionWorld$1 );

		_lookTarget$1.setFromMatrixPosition( light.target.matrixWorld );
		shadowCamera.lookAt( _lookTarget$1 );
		shadowCamera.updateMatrixWorld();

		_projScreenMatrix$1.multiplyMatrices( shadowCamera.projectionMatrix, shadowCamera.matrixWorldInverse );
		this._frustum.setFromProjectionMatrix( _projScreenMatrix$1 );

		shadowMatrix.set(
			0.5, 0.0, 0.0, 0.5,
			0.0, 0.5, 0.0, 0.5,
			0.0, 0.0, 0.5, 0.5,
			0.0, 0.0, 0.0, 1.0
		);

		shadowMatrix.multiply( _projScreenMatrix$1 );

	}

	/**
	 * Returns a viewport definition for the given viewport index.
	 *
	 * @param {number} viewportIndex - The viewport index.
	 * @return {Vector4} The viewport.
	 */
	getViewport( viewportIndex ) {

		return this._viewports[ viewportIndex ];

	}

	/**
	 * Returns the frame extends.
	 *
	 * @return {Vector2} The frame extends.
	 */
	getFrameExtents() {

		return this._frameExtents;

	}

	/**
	 * Frees the GPU-related resources allocated by this instance. Call this
	 * method whenever this instance is no longer used in your app.
	 */
	dispose() {

		if ( this.map ) {

			this.map.dispose();

		}

		if ( this.mapPass ) {

			this.mapPass.dispose();

		}

	}

	/**
	 * Copies the values of the given light shadow instance to this instance.
	 *
	 * @param {LightShadow} source - The light shadow to copy.
	 * @return {LightShadow} A reference to this light shadow instance.
	 */
	copy( source ) {

		this.camera = source.camera.clone();

		this.intensity = source.intensity;

		this.bias = source.bias;
		this.radius = source.radius;

		this.mapSize.copy( source.mapSize );

		return this;

	}

	/**
	 * Returns a new light shadow instance with copied values from this instance.
	 *
	 * @return {LightShadow} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

	/**
	 * Serializes the light shadow into JSON.
	 *
	 * @return {Object} A JSON object representing the serialized light shadow.
	 * @see {@link ObjectLoader#parse}
	 */
	toJSON() {

		const object = {};

		if ( this.intensity !== 1 ) object.intensity = this.intensity;
		if ( this.bias !== 0 ) object.bias = this.bias;
		if ( this.normalBias !== 0 ) object.normalBias = this.normalBias;
		if ( this.radius !== 1 ) object.radius = this.radius;
		if ( this.mapSize.x !== 512 || this.mapSize.y !== 512 ) object.mapSize = this.mapSize.toArray();

		object.camera = this.camera.toJSON( false ).object;
		delete object.camera.matrix;

		return object;

	}

}

/**
 * Represents the shadow configuration of directional lights.
 *
 * @augments LightShadow
 */
class SpotLightShadow extends LightShadow {

	/**
	 * Constructs a new spot light shadow.
	 */
	constructor() {

		super( new PerspectiveCamera( 50, 1, 0.5, 500 ) );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isSpotLightShadow = true;

		/**
		 * Used to focus the shadow camera. The camera's field of view is set as a
		 * percentage of the spotlight's field-of-view. Range is `[0, 1]`.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.focus = 1;

	}

	updateMatrices( light ) {

		const camera = this.camera;

		const fov = RAD2DEG * 2 * light.angle * this.focus;
		const aspect = this.mapSize.width / this.mapSize.height;
		const far = light.distance || camera.far;

		if ( fov !== camera.fov || aspect !== camera.aspect || far !== camera.far ) {

			camera.fov = fov;
			camera.aspect = aspect;
			camera.far = far;
			camera.updateProjectionMatrix();

		}

		super.updateMatrices( light );

	}

	copy( source ) {

		super.copy( source );

		this.focus = source.focus;

		return this;

	}

}

/**
 * This light gets emitted from a single point in one direction, along a cone
 * that increases in size the further from the light it gets.
 *
 * This light can cast shadows - see the {@link SpotLightShadow} for details.
 *
 * ```js
 * // white spotlight shining from the side, modulated by a texture
 * const spotLight = new THREE.SpotLight( 0xffffff );
 * spotLight.position.set( 100, 1000, 100 );
 * spotLight.map = new THREE.TextureLoader().load( url );
 *
 * spotLight.castShadow = true;
 * spotLight.shadow.mapSize.width = 1024;
 * spotLight.shadow.mapSize.height = 1024;
 * spotLight.shadow.camera.near = 500;
 * spotLight.shadow.camera.far = 4000;
 * spotLight.shadow.camera.fov = 30;s
 * ```
 *
 * @augments Light
 */
class SpotLight extends Light {

	/**
	 * Constructs a new spot light.
	 *
	 * @param {(number|Color|string)} [color=0xffffff] - The light's color.
	 * @param {number} [intensity=1] - The light's strength/intensity measured in candela (cd).
	 * @param {number} [distance=0] - Maximum range of the light. `0` means no limit.
	 * @param {number} [angle=Math.PI/3] - Maximum angle of light dispersion from its direction whose upper bound is `Math.PI/2`.
	 * @param {number} [penumbra=0] - Percent of the spotlight cone that is attenuated due to penumbra. Value range is `[0,1]`.
	 * @param {number} [decay=2] - The amount the light dims along the distance of the light.
	 */
	constructor( color, intensity, distance = 0, angle = Math.PI / 3, penumbra = 0, decay = 2 ) {

		super( color, intensity );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isSpotLight = true;

		this.type = 'SpotLight';

		this.position.copy( Object3D.DEFAULT_UP );
		this.updateMatrix();

		/**
		 * The spot light points from its position to the
		 * target's position.
		 *
		 * For the target's position to be changed to anything other
		 * than the default, it must be added to the scene.
		 *
		 * It is also possible to set the target to be another 3D object
		 * in the scene. The light will now track the target object.
		 *
		 * @type {Object3D}
		 */
		this.target = new Object3D();

		/**
		 * Maximum range of the light. `0` means no limit.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.distance = distance;

		/**
		 * Maximum angle of light dispersion from its direction whose upper bound is `Math.PI/2`.
		 *
		 * @type {number}
		 * @default Math.PI/3
		 */
		this.angle = angle;

		/**
		 * Percent of the spotlight cone that is attenuated due to penumbra.
		 * Value range is `[0,1]`.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.penumbra = penumbra;

		/**
		 * The amount the light dims along the distance of the light. In context of
		 * physically-correct rendering the default value should not be changed.
		 *
		 * @type {number}
		 * @default 2
		 */
		this.decay = decay;

		/**
		 * A texture used to modulate the color of the light. The spot light
		 * color is mixed with the RGB value of this texture, with a ratio
		 * corresponding to its alpha value. The cookie-like masking effect is
		 * reproduced using pixel values (0, 0, 0, 1-cookie_value).
		 *
		 * *Warning*: This property is disabled if {@link Object3D#castShadow} is set to `false`.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.map = null;

		/**
		 * This property holds the light's shadow configuration.
		 *
		 * @type {SpotLightShadow}
		 */
		this.shadow = new SpotLightShadow();

	}

	/**
	 * The light's power. Power is the luminous power of the light measured in lumens (lm).
	 *  Changing the power will also change the light's intensity.
	 *
	 * @type {number}
	 */
	get power() {

		// compute the light's luminous power (in lumens) from its intensity (in candela)
		// by convention for a spotlight, luminous power (lm) = π * luminous intensity (cd)
		return this.intensity * Math.PI;

	}

	set power( power ) {

		// set the light's intensity (in candela) from the desired luminous power (in lumens)
		this.intensity = power / Math.PI;

	}

	dispose() {

		this.shadow.dispose();

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.distance = source.distance;
		this.angle = source.angle;
		this.penumbra = source.penumbra;
		this.decay = source.decay;

		this.target = source.target.clone();

		this.shadow = source.shadow.clone();

		return this;

	}

}

const _projScreenMatrix = /*@__PURE__*/ new Matrix4();
const _lightPositionWorld = /*@__PURE__*/ new Vector3();
const _lookTarget = /*@__PURE__*/ new Vector3();

/**
 * Represents the shadow configuration of point lights.
 *
 * @augments LightShadow
 */
class PointLightShadow extends LightShadow {

	/**
	 * Constructs a new point light shadow.
	 */
	constructor() {

		super( new PerspectiveCamera( 90, 1, 0.5, 500 ) );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isPointLightShadow = true;

		this._frameExtents = new Vector2( 4, 2 );

		this._viewportCount = 6;

		this._viewports = [
			// These viewports map a cube-map onto a 2D texture with the
			// following orientation:
			//
			//  xzXZ
			//   y Y
			//
			// X - Positive x direction
			// x - Negative x direction
			// Y - Positive y direction
			// y - Negative y direction
			// Z - Positive z direction
			// z - Negative z direction

			// positive X
			new Vector4( 2, 1, 1, 1 ),
			// negative X
			new Vector4( 0, 1, 1, 1 ),
			// positive Z
			new Vector4( 3, 1, 1, 1 ),
			// negative Z
			new Vector4( 1, 1, 1, 1 ),
			// positive Y
			new Vector4( 3, 0, 1, 1 ),
			// negative Y
			new Vector4( 1, 0, 1, 1 )
		];

		this._cubeDirections = [
			new Vector3( 1, 0, 0 ), new Vector3( -1, 0, 0 ), new Vector3( 0, 0, 1 ),
			new Vector3( 0, 0, -1 ), new Vector3( 0, 1, 0 ), new Vector3( 0, -1, 0 )
		];

		this._cubeUps = [
			new Vector3( 0, 1, 0 ), new Vector3( 0, 1, 0 ), new Vector3( 0, 1, 0 ),
			new Vector3( 0, 1, 0 ), new Vector3( 0, 0, 1 ),	new Vector3( 0, 0, -1 )
		];

	}

	/**
	 * Update the matrices for the camera and shadow, used internally by the renderer.
	 *
	 * @param {Light} light - The light for which the shadow is being rendered.
	 * @param {number} [viewportIndex=0] - The viewport index.
	 */
	updateMatrices( light, viewportIndex = 0 ) {

		const camera = this.camera;
		const shadowMatrix = this.matrix;

		const far = light.distance || camera.far;

		if ( far !== camera.far ) {

			camera.far = far;
			camera.updateProjectionMatrix();

		}

		_lightPositionWorld.setFromMatrixPosition( light.matrixWorld );
		camera.position.copy( _lightPositionWorld );

		_lookTarget.copy( camera.position );
		_lookTarget.add( this._cubeDirections[ viewportIndex ] );
		camera.up.copy( this._cubeUps[ viewportIndex ] );
		camera.lookAt( _lookTarget );
		camera.updateMatrixWorld();

		shadowMatrix.makeTranslation( - _lightPositionWorld.x, - _lightPositionWorld.y, - _lightPositionWorld.z );

		_projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
		this._frustum.setFromProjectionMatrix( _projScreenMatrix );

	}

}

/**
 * A light that gets emitted from a single point in all directions. A common
 * use case for this is to replicate the light emitted from a bare
 * lightbulb.
 *
 * This light can cast shadows - see the {@link PointLightShadow} for details.
 *
 * ```js
 * const light = new THREE.PointLight( 0xff0000, 1, 100 );
 * light.position.set( 50, 50, 50 );
 * scene.add( light );
 * ```
 *
 * @augments Light
 */
class PointLight extends Light {

	/**
	 * Constructs a new point light.
	 *
	 * @param {(number|Color|string)} [color=0xffffff] - The light's color.
	 * @param {number} [intensity=1] - The light's strength/intensity measured in candela (cd).
	 * @param {number} [distance=0] - Maximum range of the light. `0` means no limit.
	 * @param {number} [decay=2] - The amount the light dims along the distance of the light.
	 */
	constructor( color, intensity, distance = 0, decay = 2 ) {

		super( color, intensity );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isPointLight = true;

		this.type = 'PointLight';

		/**
		 * When distance is zero, light will attenuate according to inverse-square
		 * law to infinite distance. When distance is non-zero, light will attenuate
		 * according to inverse-square law until near the distance cutoff, where it
		 * will then attenuate quickly and smoothly to 0. Inherently, cutoffs are not
		 * physically correct.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.distance = distance;

		/**
		 * The amount the light dims along the distance of the light. In context of
		 * physically-correct rendering the default value should not be changed.
		 *
		 * @type {number}
		 * @default 2
		 */
		this.decay = decay;

		/**
		 * This property holds the light's shadow configuration.
		 *
		 * @type {PointLightShadow}
		 */
		this.shadow = new PointLightShadow();

	}

	/**
	 * The light's power. Power is the luminous power of the light measured in lumens (lm).
	 * Changing the power will also change the light's intensity.
	 *
	 * @type {number}
	 */
	get power() {

		// compute the light's luminous power (in lumens) from its intensity (in candela)
		// for an isotropic light source, luminous power (lm) = 4 π luminous intensity (cd)
		return this.intensity * 4 * Math.PI;

	}

	set power( power ) {

		// set the light's intensity (in candela) from the desired luminous power (in lumens)
		this.intensity = power / ( 4 * Math.PI );

	}

	dispose() {

		this.shadow.dispose();

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.distance = source.distance;
		this.decay = source.decay;

		this.shadow = source.shadow.clone();

		return this;

	}

}

/**
 * Camera that uses [orthographic projection]{@link https://en.wikipedia.org/wiki/Orthographic_projection}.
 *
 * In this projection mode, an object's size in the rendered image stays
 * constant regardless of its distance from the camera. This can be useful
 * for rendering 2D scenes and UI elements, amongst other things.
 *
 * ```js
 * const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
 * scene.add( camera );
 * ```
 *
 * @augments Camera
 */
class OrthographicCamera extends Camera {

	/**
	 * Constructs a new orthographic camera.
	 *
	 * @param {number} [left=-1] - The left plane of the camera's frustum.
	 * @param {number} [right=1] - The right plane of the camera's frustum.
	 * @param {number} [top=1] - The top plane of the camera's frustum.
	 * @param {number} [bottom=-1] - The bottom plane of the camera's frustum.
	 * @param {number} [near=0.1] - The camera's near plane.
	 * @param {number} [far=2000] - The camera's far plane.
	 */
	constructor( left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 2000 ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isOrthographicCamera = true;

		this.type = 'OrthographicCamera';

		/**
		 * The zoom factor of the camera.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.zoom = 1;

		/**
		 * Represents the frustum window specification. This property should not be edited
		 * directly but via {@link PerspectiveCamera#setViewOffset} and {@link PerspectiveCamera#clearViewOffset}.
		 *
		 * @type {?Object}
		 * @default null
		 */
		this.view = null;

		/**
		 * The left plane of the camera's frustum.
		 *
		 * @type {number}
		 * @default -1
		 */
		this.left = left;

		/**
		 * The right plane of the camera's frustum.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.right = right;

		/**
		 * The top plane of the camera's frustum.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.top = top;

		/**
		 * The bottom plane of the camera's frustum.
		 *
		 * @type {number}
		 * @default -1
		 */
		this.bottom = bottom;

		/**
		 * The camera's near plane. The valid range is greater than `0`
		 * and less than the current value of {@link OrthographicCamera#far}.
		 *
		 * Note that, unlike for the {@link PerspectiveCamera}, `0` is a
		 * valid value for an orthographic camera's near plane.
		 *
		 * @type {number}
		 * @default 0.1
		 */
		this.near = near;

		/**
		 * The camera's far plane. Must be greater than the
		 * current value of {@link OrthographicCamera#near}.
		 *
		 * @type {number}
		 * @default 2000
		 */
		this.far = far;

		this.updateProjectionMatrix();

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.left = source.left;
		this.right = source.right;
		this.top = source.top;
		this.bottom = source.bottom;
		this.near = source.near;
		this.far = source.far;

		this.zoom = source.zoom;
		this.view = source.view === null ? null : Object.assign( {}, source.view );

		return this;

	}

	/**
	 * Sets an offset in a larger frustum. This is useful for multi-window or
	 * multi-monitor/multi-machine setups.
	 *
	 * @param {number} fullWidth - The full width of multiview setup.
	 * @param {number} fullHeight - The full height of multiview setup.
	 * @param {number} x - The horizontal offset of the subcamera.
	 * @param {number} y - The vertical offset of the subcamera.
	 * @param {number} width - The width of subcamera.
	 * @param {number} height - The height of subcamera.
	 * @see {@link PerspectiveCamera#setViewOffset}
	 */
	setViewOffset( fullWidth, fullHeight, x, y, width, height ) {

		if ( this.view === null ) {

			this.view = {
				enabled: true,
				fullWidth: 1,
				fullHeight: 1,
				offsetX: 0,
				offsetY: 0,
				width: 1,
				height: 1
			};

		}

		this.view.enabled = true;
		this.view.fullWidth = fullWidth;
		this.view.fullHeight = fullHeight;
		this.view.offsetX = x;
		this.view.offsetY = y;
		this.view.width = width;
		this.view.height = height;

		this.updateProjectionMatrix();

	}

	/**
	 * Removes the view offset from the projection matrix.
	 */
	clearViewOffset() {

		if ( this.view !== null ) {

			this.view.enabled = false;

		}

		this.updateProjectionMatrix();

	}

	/**
	 * Updates the camera's projection matrix. Must be called after any change of
	 * camera properties.
	 */
	updateProjectionMatrix() {

		const dx = ( this.right - this.left ) / ( 2 * this.zoom );
		const dy = ( this.top - this.bottom ) / ( 2 * this.zoom );
		const cx = ( this.right + this.left ) / 2;
		const cy = ( this.top + this.bottom ) / 2;

		let left = cx - dx;
		let right = cx + dx;
		let top = cy + dy;
		let bottom = cy - dy;

		if ( this.view !== null && this.view.enabled ) {

			const scaleW = ( this.right - this.left ) / this.view.fullWidth / this.zoom;
			const scaleH = ( this.top - this.bottom ) / this.view.fullHeight / this.zoom;

			left += scaleW * this.view.offsetX;
			right = left + scaleW * this.view.width;
			top -= scaleH * this.view.offsetY;
			bottom = top - scaleH * this.view.height;

		}

		this.projectionMatrix.makeOrthographic( left, right, top, bottom, this.near, this.far, this.coordinateSystem );

		this.projectionMatrixInverse.copy( this.projectionMatrix ).invert();

	}

	toJSON( meta ) {

		const data = super.toJSON( meta );

		data.object.zoom = this.zoom;
		data.object.left = this.left;
		data.object.right = this.right;
		data.object.top = this.top;
		data.object.bottom = this.bottom;
		data.object.near = this.near;
		data.object.far = this.far;

		if ( this.view !== null ) data.object.view = Object.assign( {}, this.view );

		return data;

	}

}

/**
 * Represents the shadow configuration of directional lights.
 *
 * @augments LightShadow
 */
class DirectionalLightShadow extends LightShadow {

	/**
	 * Constructs a new directional light shadow.
	 */
	constructor() {

		super( new OrthographicCamera( -5, 5, 5, -5, 0.5, 500 ) );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isDirectionalLightShadow = true;

	}

}

/**
 * A light that gets emitted in a specific direction. This light will behave
 * as though it is infinitely far away and the rays produced from it are all
 * parallel. The common use case for this is to simulate daylight; the sun is
 * far enough away that its position can be considered to be infinite, and
 * all light rays coming from it are parallel.
 *
 * A common point of confusion for directional lights is that setting the
 * rotation has no effect. This is because three.js's DirectionalLight is the
 * equivalent to what is often called a 'Target Direct Light' in other
 * applications.
 *
 * This means that its direction is calculated as pointing from the light's
 * {@link Object3D#position} to the {@link DirectionalLight#target} position
 * (as opposed to a 'Free Direct Light' that just has a rotation
 * component).
 *
 * This light can cast shadows - see the {@link DirectionalLightShadow} for details.
 *
 * ```js
 * // White directional light at half intensity shining from the top.
 * const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
 * scene.add( directionalLight );
 * ```
 *
 * @augments Light
 */
class DirectionalLight extends Light {

	/**
	 * Constructs a new directional light.
	 *
	 * @param {(number|Color|string)} [color=0xffffff] - The light's color.
	 * @param {number} [intensity=1] - The light's strength/intensity.
	 */
	constructor( color, intensity ) {

		super( color, intensity );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isDirectionalLight = true;

		this.type = 'DirectionalLight';

		this.position.copy( Object3D.DEFAULT_UP );
		this.updateMatrix();

		/**
		 * The directional light points from its position to the
		 * target's position.
		 *
		 * For the target's position to be changed to anything other
		 * than the default, it must be added to the scene.
		 *
		 * It is also possible to set the target to be another 3D object
		 * in the scene. The light will now track the target object.
		 *
		 * @type {Object3D}
		 */
		this.target = new Object3D();

		/**
		 * This property holds the light's shadow configuration.
		 *
		 * @type {DirectionalLightShadow}
		 */
		this.shadow = new DirectionalLightShadow();

	}

	dispose() {

		this.shadow.dispose();

	}

	copy( source ) {

		super.copy( source );

		this.target = source.target.clone();
		this.shadow = source.shadow.clone();

		return this;

	}

}

/**
 * A class with loader utility functions.
 */
class LoaderUtils {

	/**
	 * Extracts the base URL from the given URL.
	 *
	 * @param {string} url -The URL to extract the base URL from.
	 * @return {string} The extracted base URL.
	 */
	static extractUrlBase( url ) {

		const index = url.lastIndexOf( '/' );

		if ( index === -1 ) return './';

		return url.slice( 0, index + 1 );

	}

	/**
	 * Resolves relative URLs against the given path. Absolute paths, data urls,
	 * and blob URLs will be returned as is. Invalid URLs will return an empty
	 * string.
	 *
	 * @param {string} url -The URL to resolve.
	 * @param {string} path - The base path for relative URLs to be resolved against.
	 * @return {string} The resolved URL.
	 */
	static resolveURL( url, path ) {

		// Invalid URL
		if ( typeof url !== 'string' || url === '' ) return '';

		// Host Relative URL
		if ( /^https?:\/\//i.test( path ) && /^\//.test( url ) ) {

			path = path.replace( /(^https?:\/\/[^\/]+).*/i, '$1' );

		}

		// Absolute URL http://,https://,//
		if ( /^(https?:)?\/\//i.test( url ) ) return url;

		// Data URI
		if ( /^data:.*,.*$/i.test( url ) ) return url;

		// Blob URL
		if ( /^blob:.*$/i.test( url ) ) return url;

		// Relative URL
		return path + url;

	}

}

/**
 * A loader for loading images as an [ImageBitmap]{@link https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap}.
 * An `ImageBitmap` provides an asynchronous and resource efficient pathway to prepare
 * textures for rendering.
 *
 * Note that {@link Texture#flipY} and {@link Texture#premultiplyAlpha} are ignored with image bitmaps.
 * They needs these configuration on bitmap creation unlike regular images need them on uploading to GPU.
 *
 * You need to set the equivalent options via {@link ImageBitmapLoader#setOptions} instead.
 *
 * Also note that unlike {@link FileLoader}, this loader does not avoid multiple concurrent requests to the same URL.
 *
 * ```js
 * const loader = new THREE.ImageBitmapLoader();
 * loader.setOptions( { imageOrientation: 'flipY' } ); // set options if needed
 * const imageBitmap = await loader.loadAsync( 'image.png' );
 *
 * const texture = new THREE.Texture( imageBitmap );
 * texture.needsUpdate = true;
 * ```
 *
 * @augments Loader
 */
class ImageBitmapLoader extends Loader {

	/**
	 * Constructs a new image bitmap loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isImageBitmapLoader = true;

		if ( typeof createImageBitmap === 'undefined' ) {

			console.warn( 'THREE.ImageBitmapLoader: createImageBitmap() not supported.' );

		}

		if ( typeof fetch === 'undefined' ) {

			console.warn( 'THREE.ImageBitmapLoader: fetch() not supported.' );

		}

		/**
		 * Represents the loader options.
		 *
		 * @type {Object}
		 * @default {premultiplyAlpha:'none'}
		 */
		this.options = { premultiplyAlpha: 'none' };

	}

	/**
	 * Sets the given loader options. The structure of the object must match the `options` parameter of
	 * [createImageBitmap]{@link https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap}.
	 *
	 * @param {Object} options - The loader options to set.
	 * @return {ImageBitmapLoader} A reference to this image bitmap loader.
	 */
	setOptions( options ) {

		this.options = options;

		return this;

	}

	/**
	 * Starts loading from the given URL and pass the loaded image bitmap to the `onLoad()` callback.
	 *
	 * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param {function(ImageBitmap)} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} onProgress - Unsupported in this loader.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 * @return {ImageBitmap|undefined} The image bitmap.
	 */
	load( url, onLoad, onProgress, onError ) {

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const scope = this;

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			// If cached is a promise, wait for it to resolve
			if ( cached.then ) {

				cached.then( imageBitmap => {

					if ( onLoad ) onLoad( imageBitmap );

					scope.manager.itemEnd( url );

				} ).catch( e => {

					if ( onError ) onError( e );

				} );
				return;

			}

			// If cached is not a promise (i.e., it's already an imageBitmap)
			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		const fetchOptions = {};
		fetchOptions.credentials = ( this.crossOrigin === 'anonymous' ) ? 'same-origin' : 'include';
		fetchOptions.headers = this.requestHeader;

		const promise = fetch( url, fetchOptions ).then( function ( res ) {

			return res.blob();

		} ).then( function ( blob ) {

			return createImageBitmap( blob, Object.assign( scope.options, { colorSpaceConversion: 'none' } ) );

		} ).then( function ( imageBitmap ) {

			Cache.add( url, imageBitmap );

			if ( onLoad ) onLoad( imageBitmap );

			scope.manager.itemEnd( url );

			return imageBitmap;

		} ).catch( function ( e ) {

			if ( onError ) onError( e );

			Cache.remove( url );

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		} );

		Cache.add( url, promise );
		scope.manager.itemStart( url );

	}

}

// Characters [].:/ are reserved for track binding syntax.
const _RESERVED_CHARS_RE = '\\[\\]\\.:\\/';
const _reservedRe = new RegExp( '[' + _RESERVED_CHARS_RE + ']', 'g' );

// Attempts to allow node names from any language. ES5's `\w` regexp matches
// only latin characters, and the unicode \p{L} is not yet supported. So
// instead, we exclude reserved characters and match everything else.
const _wordChar = '[^' + _RESERVED_CHARS_RE + ']';
const _wordCharOrDot = '[^' + _RESERVED_CHARS_RE.replace( '\\.', '' ) + ']';

// Parent directories, delimited by '/' or ':'. Currently unused, but must
// be matched to parse the rest of the track name.
const _directoryRe = /*@__PURE__*/ /((?:WC+[\/:])*)/.source.replace( 'WC', _wordChar );

// Target node. May contain word characters (a-zA-Z0-9_) and '.' or '-'.
const _nodeRe = /*@__PURE__*/ /(WCOD+)?/.source.replace( 'WCOD', _wordCharOrDot );

// Object on target node, and accessor. May not contain reserved
// characters. Accessor may contain any character except closing bracket.
const _objectRe = /*@__PURE__*/ /(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace( 'WC', _wordChar );

// Property and accessor. May not contain reserved characters. Accessor may
// contain any non-bracket characters.
const _propertyRe = /*@__PURE__*/ /\.(WC+)(?:\[(.+)\])?/.source.replace( 'WC', _wordChar );

const _trackRe = new RegExp( ''
	+ '^'
	+ _directoryRe
	+ _nodeRe
	+ _objectRe
	+ _propertyRe
	+ '$'
);

const _supportedObjectNames = [ 'material', 'materials', 'bones', 'map' ];

class Composite {

	constructor( targetGroup, path, optionalParsedPath ) {

		const parsedPath = optionalParsedPath || PropertyBinding.parseTrackName( path );

		this._targetGroup = targetGroup;
		this._bindings = targetGroup.subscribe_( path, parsedPath );

	}

	getValue( array, offset ) {

		this.bind(); // bind all binding

		const firstValidIndex = this._targetGroup.nCachedObjects_,
			binding = this._bindings[ firstValidIndex ];

		// and only call .getValue on the first
		if ( binding !== undefined ) binding.getValue( array, offset );

	}

	setValue( array, offset ) {

		const bindings = this._bindings;

		for ( let i = this._targetGroup.nCachedObjects_, n = bindings.length; i !== n; ++ i ) {

			bindings[ i ].setValue( array, offset );

		}

	}

	bind() {

		const bindings = this._bindings;

		for ( let i = this._targetGroup.nCachedObjects_, n = bindings.length; i !== n; ++ i ) {

			bindings[ i ].bind();

		}

	}

	unbind() {

		const bindings = this._bindings;

		for ( let i = this._targetGroup.nCachedObjects_, n = bindings.length; i !== n; ++ i ) {

			bindings[ i ].unbind();

		}

	}

}

// Note: This class uses a State pattern on a per-method basis:
// 'bind' sets 'this.getValue' / 'setValue' and shadows the
// prototype version of these methods with one that represents
// the bound state. When the property is not found, the methods
// become no-ops.


/**
 * This holds a reference to a real property in the scene graph; used internally.
 */
class PropertyBinding {

	/**
	 * Constructs a new property binding.
	 *
	 * @param {Object} rootNode - The root node.
	 * @param {string} path - The path.
	 * @param {?Object} [parsedPath] - The parsed path.
	 */
	constructor( rootNode, path, parsedPath ) {

		/**
		 * The object path to the animated property.
		 *
		 * @type {string}
		 */
		this.path = path;

		/**
		 * An object holding information about the path.
		 *
		 * @type {Object}
		 */
		this.parsedPath = parsedPath || PropertyBinding.parseTrackName( path );

		/**
		 * The object owns the animated property.
		 *
		 * @type {?Object}
		 */
		this.node = PropertyBinding.findNode( rootNode, this.parsedPath.nodeName );

		/**
		 * The root node.
		 *
		 * @type {Object3D|Skeleton}
		 */
		this.rootNode = rootNode;

		// initial state of these methods that calls 'bind'
		this.getValue = this._getValue_unbound;
		this.setValue = this._setValue_unbound;

	}


	/**
	 * Factory method for creating a property binding from the given parameters.
	 *
	 * @static
	 * @param {Object} root - The root node.
	 * @param {string} path - The path.
	 * @param {?Object} [parsedPath] - The parsed path.
	 * @return {PropertyBinding|Composite} The created property binding or composite.
	 */
	static create( root, path, parsedPath ) {

		if ( ! ( root && root.isAnimationObjectGroup ) ) {

			return new PropertyBinding( root, path, parsedPath );

		} else {

			return new PropertyBinding.Composite( root, path, parsedPath );

		}

	}

	/**
	 * Replaces spaces with underscores and removes unsupported characters from
	 * node names, to ensure compatibility with parseTrackName().
	 *
	 * @param {string} name - Node name to be sanitized.
	 * @return {string} The sanitized node name.
	 */
	static sanitizeNodeName( name ) {

		return name.replace( /\s/g, '_' ).replace( _reservedRe, '' );

	}

	/**
	 * Parses the given track name (an object path to an animated property) and
	 * returns an object with information about the path. Matches strings in the following forms:
	 *
	 * - nodeName.property
	 * - nodeName.property[accessor]
	 * - nodeName.material.property[accessor]
	 * - uuid.property[accessor]
	 * - uuid.objectName[objectIndex].propertyName[propertyIndex]
	 * - parentName/nodeName.property
	 * - parentName/parentName/nodeName.property[index]
	 * - .bone[Armature.DEF_cog].position
	 * - scene:helium_balloon_model:helium_balloon_model.position
	 *
	 * @static
	 * @param {string} trackName - The track name to parse.
	 * @return {Object} The parsed track name as an object.
	 */
	static parseTrackName( trackName ) {

		const matches = _trackRe.exec( trackName );

		if ( matches === null ) {

			throw new Error( 'PropertyBinding: Cannot parse trackName: ' + trackName );

		}

		const results = {
			// directoryName: matches[ 1 ], // (tschw) currently unused
			nodeName: matches[ 2 ],
			objectName: matches[ 3 ],
			objectIndex: matches[ 4 ],
			propertyName: matches[ 5 ], // required
			propertyIndex: matches[ 6 ]
		};

		const lastDot = results.nodeName && results.nodeName.lastIndexOf( '.' );

		if ( lastDot !== undefined && lastDot !== -1 ) {

			const objectName = results.nodeName.substring( lastDot + 1 );

			// Object names must be checked against an allowlist. Otherwise, there
			// is no way to parse 'foo.bar.baz': 'baz' must be a property, but
			// 'bar' could be the objectName, or part of a nodeName (which can
			// include '.' characters).
			if ( _supportedObjectNames.indexOf( objectName ) !== -1 ) {

				results.nodeName = results.nodeName.substring( 0, lastDot );
				results.objectName = objectName;

			}

		}

		if ( results.propertyName === null || results.propertyName.length === 0 ) {

			throw new Error( 'PropertyBinding: can not parse propertyName from trackName: ' + trackName );

		}

		return results;

	}

	/**
	 * Searches for a node in the hierarchy of the given root object by the given
	 * node name.
	 *
	 * @static
	 * @param {Object} root - The root object.
	 * @param {string|number} nodeName - The name of the node.
	 * @return {?Object} The found node. Returns `null` if no object was found.
	 */
	static findNode( root, nodeName ) {

		if ( nodeName === undefined || nodeName === '' || nodeName === '.' || nodeName === -1 || nodeName === root.name || nodeName === root.uuid ) {

			return root;

		}

		// search into skeleton bones.
		if ( root.skeleton ) {

			const bone = root.skeleton.getBoneByName( nodeName );

			if ( bone !== undefined ) {

				return bone;

			}

		}

		// search into node subtree.
		if ( root.children ) {

			const searchNodeSubtree = function ( children ) {

				for ( let i = 0; i < children.length; i ++ ) {

					const childNode = children[ i ];

					if ( childNode.name === nodeName || childNode.uuid === nodeName ) {

						return childNode;

					}

					const result = searchNodeSubtree( childNode.children );

					if ( result ) return result;

				}

				return null;

			};

			const subTreeNode = searchNodeSubtree( root.children );

			if ( subTreeNode ) {

				return subTreeNode;

			}

		}

		return null;

	}

	// these are used to "bind" a nonexistent property
	_getValue_unavailable() {}
	_setValue_unavailable() {}

	// Getters

	_getValue_direct( buffer, offset ) {

		buffer[ offset ] = this.targetObject[ this.propertyName ];

	}

	_getValue_array( buffer, offset ) {

		const source = this.resolvedProperty;

		for ( let i = 0, n = source.length; i !== n; ++ i ) {

			buffer[ offset ++ ] = source[ i ];

		}

	}

	_getValue_arrayElement( buffer, offset ) {

		buffer[ offset ] = this.resolvedProperty[ this.propertyIndex ];

	}

	_getValue_toArray( buffer, offset ) {

		this.resolvedProperty.toArray( buffer, offset );

	}

	// Direct

	_setValue_direct( buffer, offset ) {

		this.targetObject[ this.propertyName ] = buffer[ offset ];

	}

	_setValue_direct_setNeedsUpdate( buffer, offset ) {

		this.targetObject[ this.propertyName ] = buffer[ offset ];
		this.targetObject.needsUpdate = true;

	}

	_setValue_direct_setMatrixWorldNeedsUpdate( buffer, offset ) {

		this.targetObject[ this.propertyName ] = buffer[ offset ];
		this.targetObject.matrixWorldNeedsUpdate = true;

	}

	// EntireArray

	_setValue_array( buffer, offset ) {

		const dest = this.resolvedProperty;

		for ( let i = 0, n = dest.length; i !== n; ++ i ) {

			dest[ i ] = buffer[ offset ++ ];

		}

	}

	_setValue_array_setNeedsUpdate( buffer, offset ) {

		const dest = this.resolvedProperty;

		for ( let i = 0, n = dest.length; i !== n; ++ i ) {

			dest[ i ] = buffer[ offset ++ ];

		}

		this.targetObject.needsUpdate = true;

	}

	_setValue_array_setMatrixWorldNeedsUpdate( buffer, offset ) {

		const dest = this.resolvedProperty;

		for ( let i = 0, n = dest.length; i !== n; ++ i ) {

			dest[ i ] = buffer[ offset ++ ];

		}

		this.targetObject.matrixWorldNeedsUpdate = true;

	}

	// ArrayElement

	_setValue_arrayElement( buffer, offset ) {

		this.resolvedProperty[ this.propertyIndex ] = buffer[ offset ];

	}

	_setValue_arrayElement_setNeedsUpdate( buffer, offset ) {

		this.resolvedProperty[ this.propertyIndex ] = buffer[ offset ];
		this.targetObject.needsUpdate = true;

	}

	_setValue_arrayElement_setMatrixWorldNeedsUpdate( buffer, offset ) {

		this.resolvedProperty[ this.propertyIndex ] = buffer[ offset ];
		this.targetObject.matrixWorldNeedsUpdate = true;

	}

	// HasToFromArray

	_setValue_fromArray( buffer, offset ) {

		this.resolvedProperty.fromArray( buffer, offset );

	}

	_setValue_fromArray_setNeedsUpdate( buffer, offset ) {

		this.resolvedProperty.fromArray( buffer, offset );
		this.targetObject.needsUpdate = true;

	}

	_setValue_fromArray_setMatrixWorldNeedsUpdate( buffer, offset ) {

		this.resolvedProperty.fromArray( buffer, offset );
		this.targetObject.matrixWorldNeedsUpdate = true;

	}

	_getValue_unbound( targetArray, offset ) {

		this.bind();
		this.getValue( targetArray, offset );

	}

	_setValue_unbound( sourceArray, offset ) {

		this.bind();
		this.setValue( sourceArray, offset );

	}

	/**
	 * Creates a getter / setter pair for the property tracked by this binding.
	 */
	bind() {

		let targetObject = this.node;
		const parsedPath = this.parsedPath;

		const objectName = parsedPath.objectName;
		const propertyName = parsedPath.propertyName;
		let propertyIndex = parsedPath.propertyIndex;

		if ( ! targetObject ) {

			targetObject = PropertyBinding.findNode( this.rootNode, parsedPath.nodeName );

			this.node = targetObject;

		}

		// set fail state so we can just 'return' on error
		this.getValue = this._getValue_unavailable;
		this.setValue = this._setValue_unavailable;

		// ensure there is a value node
		if ( ! targetObject ) {

			console.warn( 'THREE.PropertyBinding: No target node found for track: ' + this.path + '.' );
			return;

		}

		if ( objectName ) {

			let objectIndex = parsedPath.objectIndex;

			// special cases were we need to reach deeper into the hierarchy to get the face materials....
			switch ( objectName ) {

				case 'materials':

					if ( ! targetObject.material ) {

						console.error( 'THREE.PropertyBinding: Can not bind to material as node does not have a material.', this );
						return;

					}

					if ( ! targetObject.material.materials ) {

						console.error( 'THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.', this );
						return;

					}

					targetObject = targetObject.material.materials;

					break;

				case 'bones':

					if ( ! targetObject.skeleton ) {

						console.error( 'THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.', this );
						return;

					}

					// potential future optimization: skip this if propertyIndex is already an integer
					// and convert the integer string to a true integer.

					targetObject = targetObject.skeleton.bones;

					// support resolving morphTarget names into indices.
					for ( let i = 0; i < targetObject.length; i ++ ) {

						if ( targetObject[ i ].name === objectIndex ) {

							objectIndex = i;
							break;

						}

					}

					break;

				case 'map':

					if ( 'map' in targetObject ) {

						targetObject = targetObject.map;
						break;

					}

					if ( ! targetObject.material ) {

						console.error( 'THREE.PropertyBinding: Can not bind to material as node does not have a material.', this );
						return;

					}

					if ( ! targetObject.material.map ) {

						console.error( 'THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.', this );
						return;

					}

					targetObject = targetObject.material.map;
					break;

				default:

					if ( targetObject[ objectName ] === undefined ) {

						console.error( 'THREE.PropertyBinding: Can not bind to objectName of node undefined.', this );
						return;

					}

					targetObject = targetObject[ objectName ];

			}


			if ( objectIndex !== undefined ) {

				if ( targetObject[ objectIndex ] === undefined ) {

					console.error( 'THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.', this, targetObject );
					return;

				}

				targetObject = targetObject[ objectIndex ];

			}

		}

		// resolve property
		const nodeProperty = targetObject[ propertyName ];

		if ( nodeProperty === undefined ) {

			const nodeName = parsedPath.nodeName;

			console.error( 'THREE.PropertyBinding: Trying to update property for track: ' + nodeName +
				'.' + propertyName + ' but it wasn\'t found.', targetObject );
			return;

		}

		// determine versioning scheme
		let versioning = this.Versioning.None;

		this.targetObject = targetObject;

		if ( targetObject.isMaterial === true ) {

			versioning = this.Versioning.NeedsUpdate;

		} else if ( targetObject.isObject3D === true ) {

			versioning = this.Versioning.MatrixWorldNeedsUpdate;

		}

		// determine how the property gets bound
		let bindingType = this.BindingType.Direct;

		if ( propertyIndex !== undefined ) {

			// access a sub element of the property array (only primitives are supported right now)

			if ( propertyName === 'morphTargetInfluences' ) {

				// potential optimization, skip this if propertyIndex is already an integer, and convert the integer string to a true integer.

				// support resolving morphTarget names into indices.
				if ( ! targetObject.geometry ) {

					console.error( 'THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.', this );
					return;

				}

				if ( ! targetObject.geometry.morphAttributes ) {

					console.error( 'THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.', this );
					return;

				}

				if ( targetObject.morphTargetDictionary[ propertyIndex ] !== undefined ) {

					propertyIndex = targetObject.morphTargetDictionary[ propertyIndex ];

				}

			}

			bindingType = this.BindingType.ArrayElement;

			this.resolvedProperty = nodeProperty;
			this.propertyIndex = propertyIndex;

		} else if ( nodeProperty.fromArray !== undefined && nodeProperty.toArray !== undefined ) {

			// must use copy for Object3D.Euler/Quaternion

			bindingType = this.BindingType.HasFromToArray;

			this.resolvedProperty = nodeProperty;

		} else if ( Array.isArray( nodeProperty ) ) {

			bindingType = this.BindingType.EntireArray;

			this.resolvedProperty = nodeProperty;

		} else {

			this.propertyName = propertyName;

		}

		// select getter / setter
		this.getValue = this.GetterByBindingType[ bindingType ];
		this.setValue = this.SetterByBindingTypeAndVersioning[ bindingType ][ versioning ];

	}

	/**
	 * Unbinds the property.
	 */
	unbind() {

		this.node = null;

		// back to the prototype version of getValue / setValue
		// note: avoiding to mutate the shape of 'this' via 'delete'
		this.getValue = this._getValue_unbound;
		this.setValue = this._setValue_unbound;

	}

}

PropertyBinding.Composite = Composite;

PropertyBinding.prototype.BindingType = {
	Direct: 0,
	EntireArray: 1,
	ArrayElement: 2,
	HasFromToArray: 3
};

PropertyBinding.prototype.Versioning = {
	None: 0,
	NeedsUpdate: 1,
	MatrixWorldNeedsUpdate: 2
};

PropertyBinding.prototype.GetterByBindingType = [

	PropertyBinding.prototype._getValue_direct,
	PropertyBinding.prototype._getValue_array,
	PropertyBinding.prototype._getValue_arrayElement,
	PropertyBinding.prototype._getValue_toArray,

];

PropertyBinding.prototype.SetterByBindingTypeAndVersioning = [

	[
		// Direct
		PropertyBinding.prototype._setValue_direct,
		PropertyBinding.prototype._setValue_direct_setNeedsUpdate,
		PropertyBinding.prototype._setValue_direct_setMatrixWorldNeedsUpdate,

	], [

		// EntireArray

		PropertyBinding.prototype._setValue_array,
		PropertyBinding.prototype._setValue_array_setNeedsUpdate,
		PropertyBinding.prototype._setValue_array_setMatrixWorldNeedsUpdate,

	], [

		// ArrayElement
		PropertyBinding.prototype._setValue_arrayElement,
		PropertyBinding.prototype._setValue_arrayElement_setNeedsUpdate,
		PropertyBinding.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate,

	], [

		// HasToFromArray
		PropertyBinding.prototype._setValue_fromArray,
		PropertyBinding.prototype._setValue_fromArray_setNeedsUpdate,
		PropertyBinding.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate,

	]

];

if ( typeof __THREE_DEVTOOLS__ !== 'undefined' ) {

	__THREE_DEVTOOLS__.dispatchEvent( new CustomEvent( 'register', { detail: {
		revision: REVISION,
	} } ) );

}

if ( typeof window !== 'undefined' ) {

	if ( window.__THREE__ ) {

		console.warn( 'WARNING: Multiple instances of Three.js being imported.' );

	} else {

		window.__THREE__ = REVISION;

	}

}

/**
 * Returns a new indexed geometry based on `TrianglesDrawMode` draw mode.
 * This mode corresponds to the `gl.TRIANGLES` primitive in WebGL.
 *
 * @param {BufferGeometry} geometry - The geometry to convert.
 * @param {number} drawMode - The current draw mode.
 * @return {BufferGeometry} The new geometry using `TrianglesDrawMode`.
 */
function toTrianglesDrawMode( geometry, drawMode ) {

	if ( drawMode === TrianglesDrawMode ) {

		console.warn( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.' );
		return geometry;

	}

	if ( drawMode === TriangleFanDrawMode || drawMode === TriangleStripDrawMode ) {

		let index = geometry.getIndex();

		// generate index if not present

		if ( index === null ) {

			const indices = [];

			const position = geometry.getAttribute( 'position' );

			if ( position !== undefined ) {

				for ( let i = 0; i < position.count; i ++ ) {

					indices.push( i );

				}

				geometry.setIndex( indices );
				index = geometry.getIndex();

			} else {

				console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.' );
				return geometry;

			}

		}

		//

		const numberOfTriangles = index.count - 2;
		const newIndices = [];

		if ( drawMode === TriangleFanDrawMode ) {

			// gl.TRIANGLE_FAN

			for ( let i = 1; i <= numberOfTriangles; i ++ ) {

				newIndices.push( index.getX( 0 ) );
				newIndices.push( index.getX( i ) );
				newIndices.push( index.getX( i + 1 ) );

			}

		} else {

			// gl.TRIANGLE_STRIP

			for ( let i = 0; i < numberOfTriangles; i ++ ) {

				if ( i % 2 === 0 ) {

					newIndices.push( index.getX( i ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i + 2 ) );

				} else {

					newIndices.push( index.getX( i + 2 ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i ) );

				}

			}

		}

		if ( ( newIndices.length / 3 ) !== numberOfTriangles ) {

			console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.' );

		}

		// build final geometry

		const newGeometry = geometry.clone();
		newGeometry.setIndex( newIndices );
		newGeometry.clearGroups();

		return newGeometry;

	} else {

		console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:', drawMode );
		return geometry;

	}

}

/**
 * A loader for the glTF 2.0 format.
 *
 * [glTF]{@link https://www.khronos.org/gltf/} (GL Transmission Format) is an [open format specification]{@link https://github.com/KhronosGroup/glTF/tree/main/specification/2.0}
 * for efficient delivery and loading of 3D content. Assets may be provided either in JSON (.gltf) or binary (.glb)
 * format. External files store textures (.jpg, .png) and additional binary data (.bin). A glTF asset may deliver
 * one or more scenes, including meshes, materials, textures, skins, skeletons, morph targets, animations, lights,
 * and/or cameras.
 *
 * `GLTFLoader` uses {@link ImageBitmapLoader} whenever possible. Be advised that image bitmaps are not
 * automatically GC-collected when they are no longer referenced, and they require special handling during
 * the disposal process.
 *
 * `GLTFLoader` supports the following glTF 2.0 extensions:
 * - KHR_draco_mesh_compression
 * - KHR_materials_clearcoat
 * - KHR_materials_dispersion
 * - KHR_materials_ior
 * - KHR_materials_specular
 * - KHR_materials_transmission
 * - KHR_materials_iridescence
 * - KHR_materials_unlit
 * - KHR_materials_volume
 * - KHR_mesh_quantization
 * - KHR_lights_punctual
 * - KHR_texture_basisu
 * - KHR_texture_transform
 * - EXT_texture_webp
 * - EXT_meshopt_compression
 * - EXT_mesh_gpu_instancing
 *
 * The following glTF 2.0 extension is supported by an external user plugin:
 * - [KHR_materials_variants]{@link https://github.com/takahirox/three-gltf-extensions}
 * - [MSFT_texture_dds]{@link https://github.com/takahirox/three-gltf-extensions}
 *
 * ```js
 * const loader = new GLTFLoader();
 *
 * // Optional: Provide a DRACOLoader instance to decode compressed mesh data
 * const dracoLoader = new DRACOLoader();
 * dracoLoader.setDecoderPath( '/examples/jsm/libs/draco/' );
 * loader.setDRACOLoader( dracoLoader );
 *
 * const gltf = await loader.loadAsync( 'models/gltf/duck/duck.gltf' );
 * scene.add( gltf.scene );
 * ```
 *
 * @augments Loader
 */
class GLTFLoader extends Loader {

	/**
	 * Constructs a new glTF loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

		this.dracoLoader = null;
		this.ktx2Loader = null;
		this.meshoptDecoder = null;

		this.pluginCallbacks = [];

		this.register( function ( parser ) {

			return new GLTFMaterialsClearcoatExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsDispersionExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureBasisUExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureWebPExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureAVIFExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSheenExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsTransmissionExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsVolumeExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIorExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsEmissiveStrengthExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSpecularExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIridescenceExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsAnisotropyExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsBumpExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFLightsExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshoptCompression( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshGpuInstancing( parser );

		} );

	}

	/**
	 * Starts loading from the given URL and passes the loaded glTF asset
	 * to the `onLoad()` callback.
	 *
	 * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param {function(GLTFLoader~LoadObject)} onLoad - Executed when the loading process has been finished.
	 * @param {onProgressCallback} onProgress - Executed while the loading is in progress.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 */
	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		let resourcePath;

		if ( this.resourcePath !== '' ) {

			resourcePath = this.resourcePath;

		} else if ( this.path !== '' ) {

			// If a base path is set, resources will be relative paths from that plus the relative path of the gltf file
			// Example  path = 'https://my-cnd-server.com/', url = 'assets/models/model.gltf'
			// resourcePath = 'https://my-cnd-server.com/assets/models/'
			// referenced resource 'model.bin' will be loaded from 'https://my-cnd-server.com/assets/models/model.bin'
			// referenced resource '../textures/texture.png' will be loaded from 'https://my-cnd-server.com/assets/textures/texture.png'
			const relativeUrl = LoaderUtils.extractUrlBase( url );
			resourcePath = LoaderUtils.resolveURL( relativeUrl, this.path );

		} else {

			resourcePath = LoaderUtils.extractUrlBase( url );

		}

		// Tells the LoadingManager to track an extra item, which resolves after
		// the model is fully loaded. This means the count of items loaded will
		// be incorrect, but ensures manager.onLoad() does not fire early.
		this.manager.itemStart( url );

		const _onError = function ( e ) {

			if ( onError ) {

				onError( e );

			} else {

				console.error( e );

			}

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		};

		const loader = new FileLoader( this.manager );

		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );

		loader.load( url, function ( data ) {

			try {

				scope.parse( data, resourcePath, function ( gltf ) {

					onLoad( gltf );

					scope.manager.itemEnd( url );

				}, _onError );

			} catch ( e ) {

				_onError( e );

			}

		}, onProgress, _onError );

	}

	/**
	 * Sets the given Draco loader to this loader. Required for decoding assets
	 * compressed with the `KHR_draco_mesh_compression` extension.
	 *
	 * @param {DRACOLoader} dracoLoader - The Draco loader to set.
	 * @return {GLTFLoader} A reference to this loader.
	 */
	setDRACOLoader( dracoLoader ) {

		this.dracoLoader = dracoLoader;
		return this;

	}

	/**
	 * Sets the given KTX2 loader to this loader. Required for loading KTX2
	 * compressed textures.
	 *
	 * @param {KTX2Loader} ktx2Loader - The KTX2 loader to set.
	 * @return {GLTFLoader} A reference to this loader.
	 */
	setKTX2Loader( ktx2Loader ) {

		this.ktx2Loader = ktx2Loader;
		return this;

	}

	/**
	 * Sets the given meshopt decoder. Required for decoding assets
	 * compressed with the `EXT_meshopt_compression` extension.
	 *
	 * @param {Object} meshoptDecoder - The meshopt decoder to set.
	 * @return {GLTFLoader} A reference to this loader.
	 */
	setMeshoptDecoder( meshoptDecoder ) {

		this.meshoptDecoder = meshoptDecoder;
		return this;

	}

	/**
	 * Registers a plugin callback. This API is internally used to implement the various
	 * glTF extensions but can also used by third-party code to add additional logic
	 * to the loader.
	 *
	 * @param {function(parser:GLTFParser)} callback - The callback function to register.
	 * @return {GLTFLoader} A reference to this loader.
	 */
	register( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) === -1 ) {

			this.pluginCallbacks.push( callback );

		}

		return this;

	}

	/**
	 * Unregisters a plugin callback.
	 *
	 * @param {Function} callback - The callback function to unregister.
	 * @return {GLTFLoader} A reference to this loader.
	 */
	unregister( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) !== -1 ) {

			this.pluginCallbacks.splice( this.pluginCallbacks.indexOf( callback ), 1 );

		}

		return this;

	}

	/**
	 * Parses the given FBX data and returns the resulting group.
	 *
	 * @param {string|ArrayBuffer} data - The raw glTF data.
	 * @param {string} path - The URL base path.
	 * @param {function(GLTFLoader~LoadObject)} onLoad - Executed when the loading process has been finished.
	 * @param {onErrorCallback} onError - Executed when errors occur.
	 */
	parse( data, path, onLoad, onError ) {

		let json;
		const extensions = {};
		const plugins = {};
		const textDecoder = new TextDecoder();

		if ( typeof data === 'string' ) {

			json = JSON.parse( data );

		} else if ( data instanceof ArrayBuffer ) {

			const magic = textDecoder.decode( new Uint8Array( data, 0, 4 ) );

			if ( magic === BINARY_EXTENSION_HEADER_MAGIC ) {

				try {

					extensions[ EXTENSIONS.KHR_BINARY_GLTF ] = new GLTFBinaryExtension( data );

				} catch ( error ) {

					if ( onError ) onError( error );
					return;

				}

				json = JSON.parse( extensions[ EXTENSIONS.KHR_BINARY_GLTF ].content );

			} else {

				json = JSON.parse( textDecoder.decode( data ) );

			}

		} else {

			json = data;

		}

		if ( json.asset === undefined || json.asset.version[ 0 ] < 2 ) {

			if ( onError ) onError( new Error( 'THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.' ) );
			return;

		}

		const parser = new GLTFParser( json, {

			path: path || this.resourcePath || '',
			crossOrigin: this.crossOrigin,
			requestHeader: this.requestHeader,
			manager: this.manager,
			ktx2Loader: this.ktx2Loader,
			meshoptDecoder: this.meshoptDecoder

		} );

		parser.fileLoader.setRequestHeader( this.requestHeader );

		for ( let i = 0; i < this.pluginCallbacks.length; i ++ ) {

			const plugin = this.pluginCallbacks[ i ]( parser );

			if ( ! plugin.name ) console.error( 'THREE.GLTFLoader: Invalid plugin found: missing name' );

			plugins[ plugin.name ] = plugin;

			// Workaround to avoid determining as unknown extension
			// in addUnknownExtensionsToUserData().
			// Remove this workaround if we move all the existing
			// extension handlers to plugin system
			extensions[ plugin.name ] = true;

		}

		if ( json.extensionsUsed ) {

			for ( let i = 0; i < json.extensionsUsed.length; ++ i ) {

				const extensionName = json.extensionsUsed[ i ];
				const extensionsRequired = json.extensionsRequired || [];

				switch ( extensionName ) {

					case EXTENSIONS.KHR_MATERIALS_UNLIT:
						extensions[ extensionName ] = new GLTFMaterialsUnlitExtension();
						break;

					case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
						extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
						break;

					case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
						extensions[ extensionName ] = new GLTFTextureTransformExtension();
						break;

					case EXTENSIONS.KHR_MESH_QUANTIZATION:
						extensions[ extensionName ] = new GLTFMeshQuantizationExtension();
						break;

					default:

						if ( extensionsRequired.indexOf( extensionName ) >= 0 && plugins[ extensionName ] === undefined ) {

							console.warn( 'THREE.GLTFLoader: Unknown extension "' + extensionName + '".' );

						}

				}

			}

		}

		parser.setExtensions( extensions );
		parser.setPlugins( plugins );
		parser.parse( onLoad, onError );

	}

	/**
	 * Async version of {@link GLTFLoader#parse}.
	 *
	 * @async
	 * @param {string|ArrayBuffer} data - The raw glTF data.
	 * @param {string} path - The URL base path.
	 * @return {Promise<GLTFLoader~LoadObject>} A Promise that resolves with the loaded glTF when the parsing has been finished.
	 */
	parseAsync( data, path ) {

		const scope = this;

		return new Promise( function ( resolve, reject ) {

			scope.parse( data, path, resolve, reject );

		} );

	}

}

/* GLTFREGISTRY */

function GLTFRegistry() {

	let objects = {};

	return	{

		get: function ( key ) {

			return objects[ key ];

		},

		add: function ( key, object ) {

			objects[ key ] = object;

		},

		remove: function ( key ) {

			delete objects[ key ];

		},

		removeAll: function () {

			objects = {};

		}

	};

}

/*********************************/
/********** EXTENSIONS ***********/
/*********************************/

const EXTENSIONS = {
	KHR_BINARY_GLTF: 'KHR_binary_glTF',
	KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
	KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
	KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
	KHR_MATERIALS_DISPERSION: 'KHR_materials_dispersion',
	KHR_MATERIALS_IOR: 'KHR_materials_ior',
	KHR_MATERIALS_SHEEN: 'KHR_materials_sheen',
	KHR_MATERIALS_SPECULAR: 'KHR_materials_specular',
	KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
	KHR_MATERIALS_IRIDESCENCE: 'KHR_materials_iridescence',
	KHR_MATERIALS_ANISOTROPY: 'KHR_materials_anisotropy',
	KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
	KHR_MATERIALS_VOLUME: 'KHR_materials_volume',
	KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
	KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
	KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
	KHR_MATERIALS_EMISSIVE_STRENGTH: 'KHR_materials_emissive_strength',
	EXT_MATERIALS_BUMP: 'EXT_materials_bump',
	EXT_TEXTURE_WEBP: 'EXT_texture_webp',
	EXT_TEXTURE_AVIF: 'EXT_texture_avif',
	EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression',
	EXT_MESH_GPU_INSTANCING: 'EXT_mesh_gpu_instancing'
};

/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 *
 * @private
 */
class GLTFLightsExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

		// Object3D instance caches
		this.cache = { refs: {}, uses: {} };

	}

	_markDefs() {

		const parser = this.parser;
		const nodeDefs = this.parser.json.nodes || [];

		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.extensions
					&& nodeDef.extensions[ this.name ]
					&& nodeDef.extensions[ this.name ].light !== undefined ) {

				parser._addNodeRef( this.cache, nodeDef.extensions[ this.name ].light );

			}

		}

	}

	_loadLight( lightIndex ) {

		const parser = this.parser;
		const cacheKey = 'light:' + lightIndex;
		let dependency = parser.cache.get( cacheKey );

		if ( dependency ) return dependency;

		const json = parser.json;
		const extensions = ( json.extensions && json.extensions[ this.name ] ) || {};
		const lightDefs = extensions.lights || [];
		const lightDef = lightDefs[ lightIndex ];
		let lightNode;

		const color = new Color( 0xffffff );

		if ( lightDef.color !== undefined ) color.setRGB( lightDef.color[ 0 ], lightDef.color[ 1 ], lightDef.color[ 2 ], LinearSRGBColorSpace );

		const range = lightDef.range !== undefined ? lightDef.range : 0;

		switch ( lightDef.type ) {

			case 'directional':
				lightNode = new DirectionalLight( color );
				lightNode.target.position.set( 0, 0, -1 );
				lightNode.add( lightNode.target );
				break;

			case 'point':
				lightNode = new PointLight( color );
				lightNode.distance = range;
				break;

			case 'spot':
				lightNode = new SpotLight( color );
				lightNode.distance = range;
				// Handle spotlight properties.
				lightDef.spot = lightDef.spot || {};
				lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
				lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
				lightNode.angle = lightDef.spot.outerConeAngle;
				lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
				lightNode.target.position.set( 0, 0, -1 );
				lightNode.add( lightNode.target );
				break;

			default:
				throw new Error( 'THREE.GLTFLoader: Unexpected light type: ' + lightDef.type );

		}

		// Some lights (e.g. spot) default to a position other than the origin. Reset the position
		// here, because node-level parsing will only override position if explicitly specified.
		lightNode.position.set( 0, 0, 0 );

		assignExtrasToUserData( lightNode, lightDef );

		if ( lightDef.intensity !== undefined ) lightNode.intensity = lightDef.intensity;

		lightNode.name = parser.createUniqueName( lightDef.name || ( 'light_' + lightIndex ) );

		dependency = Promise.resolve( lightNode );

		parser.cache.add( cacheKey, dependency );

		return dependency;

	}

	getDependency( type, index ) {

		if ( type !== 'light' ) return;

		return this._loadLight( index );

	}

	createNodeAttachment( nodeIndex ) {

		const self = this;
		const parser = this.parser;
		const json = parser.json;
		const nodeDef = json.nodes[ nodeIndex ];
		const lightDef = ( nodeDef.extensions && nodeDef.extensions[ this.name ] ) || {};
		const lightIndex = lightDef.light;

		if ( lightIndex === undefined ) return null;

		return this._loadLight( lightIndex ).then( function ( light ) {

			return parser._getNodeRef( self.cache, lightIndex, light );

		} );

	}

}

/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 *
 * @private
 */
class GLTFMaterialsUnlitExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;

	}

	getMaterialType() {

		return MeshBasicMaterial;

	}

	extendParams( materialParams, materialDef, parser ) {

		const pending = [];

		materialParams.color = new Color( 1.0, 1.0, 1.0 );
		materialParams.opacity = 1.0;

		const metallicRoughness = materialDef.pbrMetallicRoughness;

		if ( metallicRoughness ) {

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.setRGB( array[ 0 ], array[ 1 ], array[ 2 ], LinearSRGBColorSpace );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, SRGBColorSpace ) );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Emissive Strength Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/blob/5768b3ce0ef32bc39cdf1bef10b948586635ead3/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md
 *
 * @private
 */
class GLTFMaterialsEmissiveStrengthExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_EMISSIVE_STRENGTH;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const emissiveStrength = materialDef.extensions[ this.name ].emissiveStrength;

		if ( emissiveStrength !== undefined ) {

			materialParams.emissiveIntensity = emissiveStrength;

		}

		return Promise.resolve();

	}

}

/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 *
 * @private
 */
class GLTFMaterialsClearcoatExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.clearcoatFactor !== undefined ) {

			materialParams.clearcoat = extension.clearcoatFactor;

		}

		if ( extension.clearcoatTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatMap', extension.clearcoatTexture ) );

		}

		if ( extension.clearcoatRoughnessFactor !== undefined ) {

			materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;

		}

		if ( extension.clearcoatRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture ) );

		}

		if ( extension.clearcoatNormalTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatNormalMap', extension.clearcoatNormalTexture ) );

			if ( extension.clearcoatNormalTexture.scale !== undefined ) {

				const scale = extension.clearcoatNormalTexture.scale;

				materialParams.clearcoatNormalScale = new Vector2( scale, scale );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Materials dispersion Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_dispersion
 *
 * @private
 */
class GLTFMaterialsDispersionExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_DISPERSION;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const extension = materialDef.extensions[ this.name ];

		materialParams.dispersion = extension.dispersion !== undefined ? extension.dispersion : 0;

		return Promise.resolve();

	}

}

/**
 * Iridescence Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_iridescence
 *
 * @private
 */
class GLTFMaterialsIridescenceExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IRIDESCENCE;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.iridescenceFactor !== undefined ) {

			materialParams.iridescence = extension.iridescenceFactor;

		}

		if ( extension.iridescenceTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceMap', extension.iridescenceTexture ) );

		}

		if ( extension.iridescenceIor !== undefined ) {

			materialParams.iridescenceIOR = extension.iridescenceIor;

		}

		if ( materialParams.iridescenceThicknessRange === undefined ) {

			materialParams.iridescenceThicknessRange = [ 100, 400 ];

		}

		if ( extension.iridescenceThicknessMinimum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 0 ] = extension.iridescenceThicknessMinimum;

		}

		if ( extension.iridescenceThicknessMaximum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 1 ] = extension.iridescenceThicknessMaximum;

		}

		if ( extension.iridescenceThicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceThicknessMap', extension.iridescenceThicknessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 *
 * @private
 */
class GLTFMaterialsSheenExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SHEEN;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		materialParams.sheenColor = new Color( 0, 0, 0 );
		materialParams.sheenRoughness = 0;
		materialParams.sheen = 1;

		const extension = materialDef.extensions[ this.name ];

		if ( extension.sheenColorFactor !== undefined ) {

			const colorFactor = extension.sheenColorFactor;
			materialParams.sheenColor.setRGB( colorFactor[ 0 ], colorFactor[ 1 ], colorFactor[ 2 ], LinearSRGBColorSpace );

		}

		if ( extension.sheenRoughnessFactor !== undefined ) {

			materialParams.sheenRoughness = extension.sheenRoughnessFactor;

		}

		if ( extension.sheenColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenColorMap', extension.sheenColorTexture, SRGBColorSpace ) );

		}

		if ( extension.sheenRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenRoughnessMap', extension.sheenRoughnessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 *
 * @private
 */
class GLTFMaterialsTransmissionExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.transmissionFactor !== undefined ) {

			materialParams.transmission = extension.transmissionFactor;

		}

		if ( extension.transmissionTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'transmissionMap', extension.transmissionTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 *
 * @private
 */
class GLTFMaterialsVolumeExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_VOLUME;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.thickness = extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;

		if ( extension.thicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'thicknessMap', extension.thicknessTexture ) );

		}

		materialParams.attenuationDistance = extension.attenuationDistance || Infinity;

		const colorArray = extension.attenuationColor || [ 1, 1, 1 ];
		materialParams.attenuationColor = new Color().setRGB( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ], LinearSRGBColorSpace );

		return Promise.all( pending );

	}

}

/**
 * Materials ior Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_ior
 *
 * @private
 */
class GLTFMaterialsIorExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IOR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const extension = materialDef.extensions[ this.name ];

		materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;

		return Promise.resolve();

	}

}

/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 *
 * @private
 */
class GLTFMaterialsSpecularExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SPECULAR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.specularIntensity = extension.specularFactor !== undefined ? extension.specularFactor : 1.0;

		if ( extension.specularTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularIntensityMap', extension.specularTexture ) );

		}

		const colorArray = extension.specularColorFactor || [ 1, 1, 1 ];
		materialParams.specularColor = new Color().setRGB( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ], LinearSRGBColorSpace );

		if ( extension.specularColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularColorMap', extension.specularColorTexture, SRGBColorSpace ) );

		}

		return Promise.all( pending );

	}

}


/**
 * Materials bump Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/EXT_materials_bump
 *
 * @private
 */
class GLTFMaterialsBumpExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_MATERIALS_BUMP;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.bumpScale = extension.bumpFactor !== undefined ? extension.bumpFactor : 1.0;

		if ( extension.bumpTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'bumpMap', extension.bumpTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Materials anisotropy Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_anisotropy
 *
 * @private
 */
class GLTFMaterialsAnisotropyExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_ANISOTROPY;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.anisotropyStrength !== undefined ) {

			materialParams.anisotropy = extension.anisotropyStrength;

		}

		if ( extension.anisotropyRotation !== undefined ) {

			materialParams.anisotropyRotation = extension.anisotropyRotation;

		}

		if ( extension.anisotropyTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'anisotropyMap', extension.anisotropyTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 *
 * @private
 */
class GLTFTextureBasisUExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_TEXTURE_BASISU;

	}

	loadTexture( textureIndex ) {

		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ this.name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ this.name ];
		const loader = parser.options.ktx2Loader;

		if ( ! loader ) {

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures' );

			} else {

				// Assumes that the extension is optional and that a fallback texture is present
				return null;

			}

		}

		return parser.loadTextureImage( textureIndex, extension.source, loader );

	}

}

/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 *
 * @private
 */
class GLTFTextureWebPExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_TEXTURE_WEBP;
		this.isSupported = null;

	}

	loadTexture( textureIndex ) {

		const name = this.name;
		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ name ];
		const source = json.images[ extension.source ];

		let loader = parser.textureLoader;
		if ( source.uri ) {

			const handler = parser.options.manager.getHandler( source.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.detectSupport().then( function ( isSupported ) {

			if ( isSupported ) return parser.loadTextureImage( textureIndex, extension.source, loader );

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: WebP required by asset but unsupported.' );

			}

			// Fall back to PNG or JPEG.
			return parser.loadTexture( textureIndex );

		} );

	}

	detectSupport() {

		if ( ! this.isSupported ) {

			this.isSupported = new Promise( function ( resolve ) {

				const image = new Image();

				// Lossy test image. Support for lossy images doesn't guarantee support for all
				// WebP images, unfortunately.
				image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

				image.onload = image.onerror = function () {

					resolve( image.height === 1 );

				};

			} );

		}

		return this.isSupported;

	}

}

/**
 * AVIF Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_avif
 *
 * @private
 */
class GLTFTextureAVIFExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_TEXTURE_AVIF;
		this.isSupported = null;

	}

	loadTexture( textureIndex ) {

		const name = this.name;
		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ name ];
		const source = json.images[ extension.source ];

		let loader = parser.textureLoader;
		if ( source.uri ) {

			const handler = parser.options.manager.getHandler( source.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.detectSupport().then( function ( isSupported ) {

			if ( isSupported ) return parser.loadTextureImage( textureIndex, extension.source, loader );

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: AVIF required by asset but unsupported.' );

			}

			// Fall back to PNG or JPEG.
			return parser.loadTexture( textureIndex );

		} );

	}

	detectSupport() {

		if ( ! this.isSupported ) {

			this.isSupported = new Promise( function ( resolve ) {

				const image = new Image();

				// Lossy test image.
				image.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
				image.onload = image.onerror = function () {

					resolve( image.height === 1 );

				};

			} );

		}

		return this.isSupported;

	}

}

/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 *
 * @private
 */
class GLTFMeshoptCompression {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
		this.parser = parser;

	}

	loadBufferView( index ) {

		const json = this.parser.json;
		const bufferView = json.bufferViews[ index ];

		if ( bufferView.extensions && bufferView.extensions[ this.name ] ) {

			const extensionDef = bufferView.extensions[ this.name ];

			const buffer = this.parser.getDependency( 'buffer', extensionDef.buffer );
			const decoder = this.parser.options.meshoptDecoder;

			if ( ! decoder || ! decoder.supported ) {

				if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

					throw new Error( 'THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files' );

				} else {

					// Assumes that the extension is optional and that fallback buffer data is present
					return null;

				}

			}

			return buffer.then( function ( res ) {

				const byteOffset = extensionDef.byteOffset || 0;
				const byteLength = extensionDef.byteLength || 0;

				const count = extensionDef.count;
				const stride = extensionDef.byteStride;

				const source = new Uint8Array( res, byteOffset, byteLength );

				if ( decoder.decodeGltfBufferAsync ) {

					return decoder.decodeGltfBufferAsync( count, stride, source, extensionDef.mode, extensionDef.filter ).then( function ( res ) {

						return res.buffer;

					} );

				} else {

					// Support for MeshoptDecoder 0.18 or earlier, without decodeGltfBufferAsync
					return decoder.ready.then( function () {

						const result = new ArrayBuffer( count * stride );
						decoder.decodeGltfBuffer( new Uint8Array( result ), count, stride, source, extensionDef.mode, extensionDef.filter );
						return result;

					} );

				}

			} );

		} else {

			return null;

		}

	}

}

/**
 * GPU Instancing Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 *
 * @private
 */
class GLTFMeshGpuInstancing {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESH_GPU_INSTANCING;
		this.parser = parser;

	}

	createNodeMesh( nodeIndex ) {

		const json = this.parser.json;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( ! nodeDef.extensions || ! nodeDef.extensions[ this.name ] ||
			nodeDef.mesh === undefined ) {

			return null;

		}

		const meshDef = json.meshes[ nodeDef.mesh ];

		// No Points or Lines + Instancing support yet

		for ( const primitive of meshDef.primitives ) {

			if ( primitive.mode !== WEBGL_CONSTANTS.TRIANGLES &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_STRIP &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_FAN &&
				 primitive.mode !== undefined ) {

				return null;

			}

		}

		const extensionDef = nodeDef.extensions[ this.name ];
		const attributesDef = extensionDef.attributes;

		// @TODO: Can we support InstancedMesh + SkinnedMesh?

		const pending = [];
		const attributes = {};

		for ( const key in attributesDef ) {

			pending.push( this.parser.getDependency( 'accessor', attributesDef[ key ] ).then( accessor => {

				attributes[ key ] = accessor;
				return attributes[ key ];

			} ) );

		}

		if ( pending.length < 1 ) {

			return null;

		}

		pending.push( this.parser.createNodeMesh( nodeIndex ) );

		return Promise.all( pending ).then( results => {

			const nodeObject = results.pop();
			const meshes = nodeObject.isGroup ? nodeObject.children : [ nodeObject ];
			const count = results[ 0 ].count; // All attribute counts should be same
			const instancedMeshes = [];

			for ( const mesh of meshes ) {

				// Temporal variables
				const m = new Matrix4();
				const p = new Vector3();
				const q = new Quaternion();
				const s = new Vector3( 1, 1, 1 );

				const instancedMesh = new InstancedMesh( mesh.geometry, mesh.material, count );

				for ( let i = 0; i < count; i ++ ) {

					if ( attributes.TRANSLATION ) {

						p.fromBufferAttribute( attributes.TRANSLATION, i );

					}

					if ( attributes.ROTATION ) {

						q.fromBufferAttribute( attributes.ROTATION, i );

					}

					if ( attributes.SCALE ) {

						s.fromBufferAttribute( attributes.SCALE, i );

					}

					instancedMesh.setMatrixAt( i, m.compose( p, q, s ) );

				}

				// Add instance attributes to the geometry, excluding TRS.
				for ( const attributeName in attributes ) {

					if ( attributeName === '_COLOR_0' ) {

						const attr = attributes[ attributeName ];
						instancedMesh.instanceColor = new InstancedBufferAttribute( attr.array, attr.itemSize, attr.normalized );

					} else if ( attributeName !== 'TRANSLATION' &&
						 attributeName !== 'ROTATION' &&
						 attributeName !== 'SCALE' ) {

						mesh.geometry.setAttribute( attributeName, attributes[ attributeName ] );

					}

				}

				// Just in case
				Object3D.prototype.copy.call( instancedMesh, mesh );

				this.parser.assignFinalMaterial( instancedMesh );

				instancedMeshes.push( instancedMesh );

			}

			if ( nodeObject.isGroup ) {

				nodeObject.clear();

				nodeObject.add( ... instancedMeshes );

				return nodeObject;

			}

			return instancedMeshes[ 0 ];

		} );

	}

}

/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

class GLTFBinaryExtension {

	constructor( data ) {

		this.name = EXTENSIONS.KHR_BINARY_GLTF;
		this.content = null;
		this.body = null;

		const headerView = new DataView( data, 0, BINARY_EXTENSION_HEADER_LENGTH );
		const textDecoder = new TextDecoder();

		this.header = {
			magic: textDecoder.decode( new Uint8Array( data.slice( 0, 4 ) ) ),
			version: headerView.getUint32( 4, true ),
			length: headerView.getUint32( 8, true )
		};

		if ( this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC ) {

			throw new Error( 'THREE.GLTFLoader: Unsupported glTF-Binary header.' );

		} else if ( this.header.version < 2.0 ) {

			throw new Error( 'THREE.GLTFLoader: Legacy binary file detected.' );

		}

		const chunkContentsLength = this.header.length - BINARY_EXTENSION_HEADER_LENGTH;
		const chunkView = new DataView( data, BINARY_EXTENSION_HEADER_LENGTH );
		let chunkIndex = 0;

		while ( chunkIndex < chunkContentsLength ) {

			const chunkLength = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			const chunkType = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON ) {

				const contentArray = new Uint8Array( data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength );
				this.content = textDecoder.decode( contentArray );

			} else if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN ) {

				const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
				this.body = data.slice( byteOffset, byteOffset + chunkLength );

			}

			// Clients must ignore chunks with unknown types.

			chunkIndex += chunkLength;

		}

		if ( this.content === null ) {

			throw new Error( 'THREE.GLTFLoader: JSON content not found.' );

		}

	}

}

/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 *
 * @private
 */
class GLTFDracoMeshCompressionExtension {

	constructor( json, dracoLoader ) {

		if ( ! dracoLoader ) {

			throw new Error( 'THREE.GLTFLoader: No DRACOLoader instance provided.' );

		}

		this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
		this.json = json;
		this.dracoLoader = dracoLoader;
		this.dracoLoader.preload();

	}

	decodePrimitive( primitive, parser ) {

		const json = this.json;
		const dracoLoader = this.dracoLoader;
		const bufferViewIndex = primitive.extensions[ this.name ].bufferView;
		const gltfAttributeMap = primitive.extensions[ this.name ].attributes;
		const threeAttributeMap = {};
		const attributeNormalizedMap = {};
		const attributeTypeMap = {};

		for ( const attributeName in gltfAttributeMap ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			threeAttributeMap[ threeAttributeName ] = gltfAttributeMap[ attributeName ];

		}

		for ( const attributeName in primitive.attributes ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			if ( gltfAttributeMap[ attributeName ] !== undefined ) {

				const accessorDef = json.accessors[ primitive.attributes[ attributeName ] ];
				const componentType = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

				attributeTypeMap[ threeAttributeName ] = componentType.name;
				attributeNormalizedMap[ threeAttributeName ] = accessorDef.normalized === true;

			}

		}

		return parser.getDependency( 'bufferView', bufferViewIndex ).then( function ( bufferView ) {

			return new Promise( function ( resolve, reject ) {

				dracoLoader.decodeDracoFile( bufferView, function ( geometry ) {

					for ( const attributeName in geometry.attributes ) {

						const attribute = geometry.attributes[ attributeName ];
						const normalized = attributeNormalizedMap[ attributeName ];

						if ( normalized !== undefined ) attribute.normalized = normalized;

					}

					resolve( geometry );

				}, threeAttributeMap, attributeTypeMap, LinearSRGBColorSpace, reject );

			} );

		} );

	}

}

/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 *
 * @private
 */
class GLTFTextureTransformExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

	}

	extendTexture( texture, transform ) {

		if ( ( transform.texCoord === undefined || transform.texCoord === texture.channel )
			&& transform.offset === undefined
			&& transform.rotation === undefined
			&& transform.scale === undefined ) {

			// See https://github.com/mrdoob/three.js/issues/21819.
			return texture;

		}

		texture = texture.clone();

		if ( transform.texCoord !== undefined ) {

			texture.channel = transform.texCoord;

		}

		if ( transform.offset !== undefined ) {

			texture.offset.fromArray( transform.offset );

		}

		if ( transform.rotation !== undefined ) {

			texture.rotation = transform.rotation;

		}

		if ( transform.scale !== undefined ) {

			texture.repeat.fromArray( transform.scale );

		}

		texture.needsUpdate = true;

		return texture;

	}

}

/**
 * Mesh Quantization Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization
 *
 * @private
 */
class GLTFMeshQuantizationExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;

	}

}

/*********************************/
/********** INTERPOLATION ********/
/*********************************/

// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Interpolant {

	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		super( parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	copySampleValue_( index ) {

		// Copies a sample value to the result buffer. See description of glTF
		// CUBICSPLINE values layout in interpolate_() function below.

		const result = this.resultBuffer,
			values = this.sampleValues,
			valueSize = this.valueSize,
			offset = index * valueSize * 3 + valueSize;

		for ( let i = 0; i !== valueSize; i ++ ) {

			result[ i ] = values[ offset + i ];

		}

		return result;

	}

	interpolate_( i1, t0, t, t1 ) {

		const result = this.resultBuffer;
		const values = this.sampleValues;
		const stride = this.valueSize;

		const stride2 = stride * 2;
		const stride3 = stride * 3;

		const td = t1 - t0;

		const p = ( t - t0 ) / td;
		const pp = p * p;
		const ppp = pp * p;

		const offset1 = i1 * stride3;
		const offset0 = offset1 - stride3;

		const s2 = -2 * ppp + 3 * pp;
		const s3 = ppp - pp;
		const s0 = 1 - s2;
		const s1 = s3 - pp + p;

		// Layout of keyframe output values for CUBICSPLINE animations:
		//   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
		for ( let i = 0; i !== stride; i ++ ) {

			const p0 = values[ offset0 + i + stride ]; // splineVertex_k
			const m0 = values[ offset0 + i + stride2 ] * td; // outTangent_k * (t_k+1 - t_k)
			const p1 = values[ offset1 + i + stride ]; // splineVertex_k+1
			const m1 = values[ offset1 + i ] * td; // inTangent_k+1 * (t_k+1 - t_k)

			result[ i ] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;

		}

		return result;

	}

}

const _q = new Quaternion();

class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {

	interpolate_( i1, t0, t, t1 ) {

		const result = super.interpolate_( i1, t0, t, t1 );

		_q.fromArray( result ).normalize().toArray( result );

		return result;

	}

}


/*********************************/
/********** INTERNALS ************/
/*********************************/

/* CONSTANTS */

const WEBGL_CONSTANTS = {
	POINTS: 0,
	LINES: 1,
	LINE_LOOP: 2,
	LINE_STRIP: 3,
	TRIANGLES: 4,
	TRIANGLE_STRIP: 5,
	TRIANGLE_FAN: 6};

const WEBGL_COMPONENT_TYPES = {
	5120: Int8Array,
	5121: Uint8Array,
	5122: Int16Array,
	5123: Uint16Array,
	5125: Uint32Array,
	5126: Float32Array
};

const WEBGL_FILTERS = {
	9728: NearestFilter,
	9729: LinearFilter,
	9984: NearestMipmapNearestFilter,
	9985: LinearMipmapNearestFilter,
	9986: NearestMipmapLinearFilter,
	9987: LinearMipmapLinearFilter
};

const WEBGL_WRAPPINGS = {
	33071: ClampToEdgeWrapping,
	33648: MirroredRepeatWrapping,
	10497: RepeatWrapping
};

const WEBGL_TYPE_SIZES = {
	'SCALAR': 1,
	'VEC2': 2,
	'VEC3': 3,
	'VEC4': 4,
	'MAT2': 4,
	'MAT3': 9,
	'MAT4': 16
};

const ATTRIBUTES = {
	POSITION: 'position',
	NORMAL: 'normal',
	TANGENT: 'tangent',
	TEXCOORD_0: 'uv',
	TEXCOORD_1: 'uv1',
	TEXCOORD_2: 'uv2',
	TEXCOORD_3: 'uv3',
	COLOR_0: 'color',
	WEIGHTS_0: 'skinWeight',
	JOINTS_0: 'skinIndex',
};

const PATH_PROPERTIES = {
	scale: 'scale',
	translation: 'position',
	rotation: 'quaternion',
	weights: 'morphTargetInfluences'
};

const INTERPOLATION = {
	CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
		                        // keyframe track will be initialized with a default interpolation type, then modified.
	LINEAR: InterpolateLinear,
	STEP: InterpolateDiscrete
};

const ALPHA_MODES = {
	OPAQUE: 'OPAQUE',
	MASK: 'MASK',
	BLEND: 'BLEND'
};

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 *
 * @private
 * @param {Object<string, Material>} cache
 * @return {Material}
 */
function createDefaultMaterial( cache ) {

	if ( cache[ 'DefaultMaterial' ] === undefined ) {

		cache[ 'DefaultMaterial' ] = new MeshStandardMaterial( {
			color: 0xFFFFFF,
			emissive: 0x000000,
			metalness: 1,
			roughness: 1,
			transparent: false,
			depthTest: true,
			side: FrontSide
		} );

	}

	return cache[ 'DefaultMaterial' ];

}

function addUnknownExtensionsToUserData( knownExtensions, object, objectDef ) {

	// Add unknown glTF extensions to an object's userData.

	for ( const name in objectDef.extensions ) {

		if ( knownExtensions[ name ] === undefined ) {

			object.userData.gltfExtensions = object.userData.gltfExtensions || {};
			object.userData.gltfExtensions[ name ] = objectDef.extensions[ name ];

		}

	}

}

/**
 *
 * @private
 * @param {Object3D|Material|BufferGeometry|Object} object
 * @param {GLTF.definition} gltfDef
 */
function assignExtrasToUserData( object, gltfDef ) {

	if ( gltfDef.extras !== undefined ) {

		if ( typeof gltfDef.extras === 'object' ) {

			Object.assign( object.userData, gltfDef.extras );

		} else {

			console.warn( 'THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras );

		}

	}

}

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
 *
 * @private
 * @param {BufferGeometry} geometry
 * @param {Array<GLTF.Target>} targets
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addMorphTargets( geometry, targets, parser ) {

	let hasMorphPosition = false;
	let hasMorphNormal = false;
	let hasMorphColor = false;

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( target.POSITION !== undefined ) hasMorphPosition = true;
		if ( target.NORMAL !== undefined ) hasMorphNormal = true;
		if ( target.COLOR_0 !== undefined ) hasMorphColor = true;

		if ( hasMorphPosition && hasMorphNormal && hasMorphColor ) break;

	}

	if ( ! hasMorphPosition && ! hasMorphNormal && ! hasMorphColor ) return Promise.resolve( geometry );

	const pendingPositionAccessors = [];
	const pendingNormalAccessors = [];
	const pendingColorAccessors = [];

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( hasMorphPosition ) {

			const pendingAccessor = target.POSITION !== undefined
				? parser.getDependency( 'accessor', target.POSITION )
				: geometry.attributes.position;

			pendingPositionAccessors.push( pendingAccessor );

		}

		if ( hasMorphNormal ) {

			const pendingAccessor = target.NORMAL !== undefined
				? parser.getDependency( 'accessor', target.NORMAL )
				: geometry.attributes.normal;

			pendingNormalAccessors.push( pendingAccessor );

		}

		if ( hasMorphColor ) {

			const pendingAccessor = target.COLOR_0 !== undefined
				? parser.getDependency( 'accessor', target.COLOR_0 )
				: geometry.attributes.color;

			pendingColorAccessors.push( pendingAccessor );

		}

	}

	return Promise.all( [
		Promise.all( pendingPositionAccessors ),
		Promise.all( pendingNormalAccessors ),
		Promise.all( pendingColorAccessors )
	] ).then( function ( accessors ) {

		const morphPositions = accessors[ 0 ];
		const morphNormals = accessors[ 1 ];
		const morphColors = accessors[ 2 ];

		if ( hasMorphPosition ) geometry.morphAttributes.position = morphPositions;
		if ( hasMorphNormal ) geometry.morphAttributes.normal = morphNormals;
		if ( hasMorphColor ) geometry.morphAttributes.color = morphColors;
		geometry.morphTargetsRelative = true;

		return geometry;

	} );

}

/**
 *
 * @private
 * @param {Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
function updateMorphTargets( mesh, meshDef ) {

	mesh.updateMorphTargets();

	if ( meshDef.weights !== undefined ) {

		for ( let i = 0, il = meshDef.weights.length; i < il; i ++ ) {

			mesh.morphTargetInfluences[ i ] = meshDef.weights[ i ];

		}

	}

	// .extras has user-defined data, so check that .extras.targetNames is an array.
	if ( meshDef.extras && Array.isArray( meshDef.extras.targetNames ) ) {

		const targetNames = meshDef.extras.targetNames;

		if ( mesh.morphTargetInfluences.length === targetNames.length ) {

			mesh.morphTargetDictionary = {};

			for ( let i = 0, il = targetNames.length; i < il; i ++ ) {

				mesh.morphTargetDictionary[ targetNames[ i ] ] = i;

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.' );

		}

	}

}

function createPrimitiveKey( primitiveDef ) {

	let geometryKey;

	const dracoExtension = primitiveDef.extensions && primitiveDef.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ];

	if ( dracoExtension ) {

		geometryKey = 'draco:' + dracoExtension.bufferView
				+ ':' + dracoExtension.indices
				+ ':' + createAttributesKey( dracoExtension.attributes );

	} else {

		geometryKey = primitiveDef.indices + ':' + createAttributesKey( primitiveDef.attributes ) + ':' + primitiveDef.mode;

	}

	if ( primitiveDef.targets !== undefined ) {

		for ( let i = 0, il = primitiveDef.targets.length; i < il; i ++ ) {

			geometryKey += ':' + createAttributesKey( primitiveDef.targets[ i ] );

		}

	}

	return geometryKey;

}

function createAttributesKey( attributes ) {

	let attributesKey = '';

	const keys = Object.keys( attributes ).sort();

	for ( let i = 0, il = keys.length; i < il; i ++ ) {

		attributesKey += keys[ i ] + ':' + attributes[ keys[ i ] ] + ';';

	}

	return attributesKey;

}

function getNormalizedComponentScale( constructor ) {

	// Reference:
	// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

	switch ( constructor ) {

		case Int8Array:
			return 1 / 127;

		case Uint8Array:
			return 1 / 255;

		case Int16Array:
			return 1 / 32767;

		case Uint16Array:
			return 1 / 65535;

		default:
			throw new Error( 'THREE.GLTFLoader: Unsupported normalized accessor component type.' );

	}

}

function getImageURIMimeType( uri ) {

	if ( uri.search( /\.jpe?g($|\?)/i ) > 0 || uri.search( /^data\:image\/jpeg/ ) === 0 ) return 'image/jpeg';
	if ( uri.search( /\.webp($|\?)/i ) > 0 || uri.search( /^data\:image\/webp/ ) === 0 ) return 'image/webp';
	if ( uri.search( /\.ktx2($|\?)/i ) > 0 || uri.search( /^data\:image\/ktx2/ ) === 0 ) return 'image/ktx2';

	return 'image/png';

}

const _identityMatrix = new Matrix4();

/* GLTF PARSER */

class GLTFParser {

	constructor( json = {}, options = {} ) {

		this.json = json;
		this.extensions = {};
		this.plugins = {};
		this.options = options;

		// loader object cache
		this.cache = new GLTFRegistry();

		// associations between Three.js objects and glTF elements
		this.associations = new Map();

		// BufferGeometry caching
		this.primitiveCache = {};

		// Node cache
		this.nodeCache = {};

		// Object3D instance caches
		this.meshCache = { refs: {}, uses: {} };
		this.cameraCache = { refs: {}, uses: {} };
		this.lightCache = { refs: {}, uses: {} };

		this.sourceCache = {};
		this.textureCache = {};

		// Track node names, to ensure no duplicates
		this.nodeNamesUsed = {};

		// Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
		// expensive work of uploading a texture to the GPU off the main thread.

		let isSafari = false;
		let safariVersion = -1;
		let isFirefox = false;
		let firefoxVersion = -1;

		if ( typeof navigator !== 'undefined' ) {

			const userAgent = navigator.userAgent;

			isSafari = /^((?!chrome|android).)*safari/i.test( userAgent ) === true;
			const safariMatch = userAgent.match( /Version\/(\d+)/ );
			safariVersion = isSafari && safariMatch ? parseInt( safariMatch[ 1 ], 10 ) : -1;

			isFirefox = userAgent.indexOf( 'Firefox' ) > -1;
			firefoxVersion = isFirefox ? userAgent.match( /Firefox\/([0-9]+)\./ )[ 1 ] : -1;

		}

		if ( typeof createImageBitmap === 'undefined' || ( isSafari && safariVersion < 17 ) || ( isFirefox && firefoxVersion < 98 ) ) {

			this.textureLoader = new TextureLoader( this.options.manager );

		} else {

			this.textureLoader = new ImageBitmapLoader( this.options.manager );

		}

		this.textureLoader.setCrossOrigin( this.options.crossOrigin );
		this.textureLoader.setRequestHeader( this.options.requestHeader );

		this.fileLoader = new FileLoader( this.options.manager );
		this.fileLoader.setResponseType( 'arraybuffer' );

		if ( this.options.crossOrigin === 'use-credentials' ) {

			this.fileLoader.setWithCredentials( true );

		}

	}

	setExtensions( extensions ) {

		this.extensions = extensions;

	}

	setPlugins( plugins ) {

		this.plugins = plugins;

	}

	parse( onLoad, onError ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		// Clear the loader cache
		this.cache.removeAll();
		this.nodeCache = {};

		// Mark the special nodes/meshes in json for efficient parse
		this._invokeAll( function ( ext ) {

			return ext._markDefs && ext._markDefs();

		} );

		Promise.all( this._invokeAll( function ( ext ) {

			return ext.beforeRoot && ext.beforeRoot();

		} ) ).then( function () {

			return Promise.all( [

				parser.getDependencies( 'scene' ),
				parser.getDependencies( 'animation' ),
				parser.getDependencies( 'camera' ),

			] );

		} ).then( function ( dependencies ) {

			const result = {
				scene: dependencies[ 0 ][ json.scene || 0 ],
				scenes: dependencies[ 0 ],
				animations: dependencies[ 1 ],
				cameras: dependencies[ 2 ],
				asset: json.asset,
				parser: parser,
				userData: {}
			};

			addUnknownExtensionsToUserData( extensions, result, json );

			assignExtrasToUserData( result, json );

			return Promise.all( parser._invokeAll( function ( ext ) {

				return ext.afterRoot && ext.afterRoot( result );

			} ) ).then( function () {

				for ( const scene of result.scenes ) {

					scene.updateMatrixWorld();

				}

				onLoad( result );

			} );

		} ).catch( onError );

	}

	/**
	 * Marks the special nodes/meshes in json for efficient parse.
	 *
	 * @private
	 */
	_markDefs() {

		const nodeDefs = this.json.nodes || [];
		const skinDefs = this.json.skins || [];
		const meshDefs = this.json.meshes || [];

		// Nothing in the node definition indicates whether it is a Bone or an
		// Object3D. Use the skins' joint references to mark bones.
		for ( let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex ++ ) {

			const joints = skinDefs[ skinIndex ].joints;

			for ( let i = 0, il = joints.length; i < il; i ++ ) {

				nodeDefs[ joints[ i ] ].isBone = true;

			}

		}

		// Iterate over all nodes, marking references to shared resources,
		// as well as skeleton joints.
		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.mesh !== undefined ) {

				this._addNodeRef( this.meshCache, nodeDef.mesh );

				// Nothing in the mesh definition indicates whether it is
				// a SkinnedMesh or Mesh. Use the node's mesh reference
				// to mark SkinnedMesh if node has skin.
				if ( nodeDef.skin !== undefined ) {

					meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;

				}

			}

			if ( nodeDef.camera !== undefined ) {

				this._addNodeRef( this.cameraCache, nodeDef.camera );

			}

		}

	}

	/**
	 * Counts references to shared node / Object3D resources. These resources
	 * can be reused, or "instantiated", at multiple nodes in the scene
	 * hierarchy. Mesh, Camera, and Light instances are instantiated and must
	 * be marked. Non-scenegraph resources (like Materials, Geometries, and
	 * Textures) can be reused directly and are not marked here.
	 *
	 * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
	 *
	 * @private
	 * @param {Object} cache
	 * @param {Object3D} index
	 */
	_addNodeRef( cache, index ) {

		if ( index === undefined ) return;

		if ( cache.refs[ index ] === undefined ) {

			cache.refs[ index ] = cache.uses[ index ] = 0;

		}

		cache.refs[ index ] ++;

	}

	/**
	 * Returns a reference to a shared resource, cloning it if necessary.
	 *
	 * @private
	 * @param {Object} cache
	 * @param {number} index
	 * @param {Object} object
	 * @return {Object}
	 */
	_getNodeRef( cache, index, object ) {

		if ( cache.refs[ index ] <= 1 ) return object;

		const ref = object.clone();

		// Propagates mappings to the cloned object, prevents mappings on the
		// original object from being lost.
		const updateMappings = ( original, clone ) => {

			const mappings = this.associations.get( original );
			if ( mappings != null ) {

				this.associations.set( clone, mappings );

			}

			for ( const [ i, child ] of original.children.entries() ) {

				updateMappings( child, clone.children[ i ] );

			}

		};

		updateMappings( object, ref );

		ref.name += '_instance_' + ( cache.uses[ index ] ++ );

		return ref;

	}

	_invokeOne( func ) {

		const extensions = Object.values( this.plugins );
		extensions.push( this );

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) return result;

		}

		return null;

	}

	_invokeAll( func ) {

		const extensions = Object.values( this.plugins );
		extensions.unshift( this );

		const pending = [];

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) pending.push( result );

		}

		return pending;

	}

	/**
	 * Requests the specified dependency asynchronously, with caching.
	 *
	 * @private
	 * @param {string} type
	 * @param {number} index
	 * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
	 */
	getDependency( type, index ) {

		const cacheKey = type + ':' + index;
		let dependency = this.cache.get( cacheKey );

		if ( ! dependency ) {

			switch ( type ) {

				case 'scene':
					dependency = this.loadScene( index );
					break;

				case 'node':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadNode && ext.loadNode( index );

					} );
					break;

				case 'mesh':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMesh && ext.loadMesh( index );

					} );
					break;

				case 'accessor':
					dependency = this.loadAccessor( index );
					break;

				case 'bufferView':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadBufferView && ext.loadBufferView( index );

					} );
					break;

				case 'buffer':
					dependency = this.loadBuffer( index );
					break;

				case 'material':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMaterial && ext.loadMaterial( index );

					} );
					break;

				case 'texture':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadTexture && ext.loadTexture( index );

					} );
					break;

				case 'skin':
					dependency = this.loadSkin( index );
					break;

				case 'animation':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadAnimation && ext.loadAnimation( index );

					} );
					break;

				case 'camera':
					dependency = this.loadCamera( index );
					break;

				default:
					dependency = this._invokeOne( function ( ext ) {

						return ext != this && ext.getDependency && ext.getDependency( type, index );

					} );

					if ( ! dependency ) {

						throw new Error( 'Unknown type: ' + type );

					}

					break;

			}

			this.cache.add( cacheKey, dependency );

		}

		return dependency;

	}

	/**
	 * Requests all dependencies of the specified type asynchronously, with caching.
	 *
	 * @private
	 * @param {string} type
	 * @return {Promise<Array<Object>>}
	 */
	getDependencies( type ) {

		let dependencies = this.cache.get( type );

		if ( ! dependencies ) {

			const parser = this;
			const defs = this.json[ type + ( type === 'mesh' ? 'es' : 's' ) ] || [];

			dependencies = Promise.all( defs.map( function ( def, index ) {

				return parser.getDependency( type, index );

			} ) );

			this.cache.add( type, dependencies );

		}

		return dependencies;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 *
	 * @private
	 * @param {number} bufferIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBuffer( bufferIndex ) {

		const bufferDef = this.json.buffers[ bufferIndex ];
		const loader = this.fileLoader;

		if ( bufferDef.type && bufferDef.type !== 'arraybuffer' ) {

			throw new Error( 'THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.' );

		}

		// If present, GLB container is required to be the first buffer.
		if ( bufferDef.uri === undefined && bufferIndex === 0 ) {

			return Promise.resolve( this.extensions[ EXTENSIONS.KHR_BINARY_GLTF ].body );

		}

		const options = this.options;

		return new Promise( function ( resolve, reject ) {

			loader.load( LoaderUtils.resolveURL( bufferDef.uri, options.path ), resolve, undefined, function () {

				reject( new Error( 'THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".' ) );

			} );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 *
	 * @private
	 * @param {number} bufferViewIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBufferView( bufferViewIndex ) {

		const bufferViewDef = this.json.bufferViews[ bufferViewIndex ];

		return this.getDependency( 'buffer', bufferViewDef.buffer ).then( function ( buffer ) {

			const byteLength = bufferViewDef.byteLength || 0;
			const byteOffset = bufferViewDef.byteOffset || 0;
			return buffer.slice( byteOffset, byteOffset + byteLength );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
	 *
	 * @private
	 * @param {number} accessorIndex
	 * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
	 */
	loadAccessor( accessorIndex ) {

		const parser = this;
		const json = this.json;

		const accessorDef = this.json.accessors[ accessorIndex ];

		if ( accessorDef.bufferView === undefined && accessorDef.sparse === undefined ) {

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];
			const normalized = accessorDef.normalized === true;

			const array = new TypedArray( accessorDef.count * itemSize );
			return Promise.resolve( new BufferAttribute( array, itemSize, normalized ) );

		}

		const pendingBufferViews = [];

		if ( accessorDef.bufferView !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.bufferView ) );

		} else {

			pendingBufferViews.push( null );

		}

		if ( accessorDef.sparse !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.indices.bufferView ) );
			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.values.bufferView ) );

		}

		return Promise.all( pendingBufferViews ).then( function ( bufferViews ) {

			const bufferView = bufferViews[ 0 ];

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

			// For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
			const elementBytes = TypedArray.BYTES_PER_ELEMENT;
			const itemBytes = elementBytes * itemSize;
			const byteOffset = accessorDef.byteOffset || 0;
			const byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[ accessorDef.bufferView ].byteStride : undefined;
			const normalized = accessorDef.normalized === true;
			let array, bufferAttribute;

			// The buffer is not interleaved if the stride is the item size in bytes.
			if ( byteStride && byteStride !== itemBytes ) {

				// Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
				// This makes sure that IBA.count reflects accessor.count properly
				const ibSlice = Math.floor( byteOffset / byteStride );
				const ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType + ':' + ibSlice + ':' + accessorDef.count;
				let ib = parser.cache.get( ibCacheKey );

				if ( ! ib ) {

					array = new TypedArray( bufferView, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes );

					// Integer parameters to IB/IBA are in array elements, not bytes.
					ib = new InterleavedBuffer( array, byteStride / elementBytes );

					parser.cache.add( ibCacheKey, ib );

				}

				bufferAttribute = new InterleavedBufferAttribute( ib, itemSize, ( byteOffset % byteStride ) / elementBytes, normalized );

			} else {

				if ( bufferView === null ) {

					array = new TypedArray( accessorDef.count * itemSize );

				} else {

					array = new TypedArray( bufferView, byteOffset, accessorDef.count * itemSize );

				}

				bufferAttribute = new BufferAttribute( array, itemSize, normalized );

			}

			// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
			if ( accessorDef.sparse !== undefined ) {

				const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
				const TypedArrayIndices = WEBGL_COMPONENT_TYPES[ accessorDef.sparse.indices.componentType ];

				const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
				const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

				const sparseIndices = new TypedArrayIndices( bufferViews[ 1 ], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices );
				const sparseValues = new TypedArray( bufferViews[ 2 ], byteOffsetValues, accessorDef.sparse.count * itemSize );

				if ( bufferView !== null ) {

					// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
					bufferAttribute = new BufferAttribute( bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized );

				}

				// Ignore normalized since we copy from sparse
				bufferAttribute.normalized = false;

				for ( let i = 0, il = sparseIndices.length; i < il; i ++ ) {

					const index = sparseIndices[ i ];

					bufferAttribute.setX( index, sparseValues[ i * itemSize ] );
					if ( itemSize >= 2 ) bufferAttribute.setY( index, sparseValues[ i * itemSize + 1 ] );
					if ( itemSize >= 3 ) bufferAttribute.setZ( index, sparseValues[ i * itemSize + 2 ] );
					if ( itemSize >= 4 ) bufferAttribute.setW( index, sparseValues[ i * itemSize + 3 ] );
					if ( itemSize >= 5 ) throw new Error( 'THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.' );

				}

				bufferAttribute.normalized = normalized;

			}

			return bufferAttribute;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
	 *
	 * @private
	 * @param {number} textureIndex
	 * @return {Promise<THREE.Texture|null>}
	 */
	loadTexture( textureIndex ) {

		const json = this.json;
		const options = this.options;
		const textureDef = json.textures[ textureIndex ];
		const sourceIndex = textureDef.source;
		const sourceDef = json.images[ sourceIndex ];

		let loader = this.textureLoader;

		if ( sourceDef.uri ) {

			const handler = options.manager.getHandler( sourceDef.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.loadTextureImage( textureIndex, sourceIndex, loader );

	}

	loadTextureImage( textureIndex, sourceIndex, loader ) {

		const parser = this;
		const json = this.json;

		const textureDef = json.textures[ textureIndex ];
		const sourceDef = json.images[ sourceIndex ];

		const cacheKey = ( sourceDef.uri || sourceDef.bufferView ) + ':' + textureDef.sampler;

		if ( this.textureCache[ cacheKey ] ) {

			// See https://github.com/mrdoob/three.js/issues/21559.
			return this.textureCache[ cacheKey ];

		}

		const promise = this.loadImageSource( sourceIndex, loader ).then( function ( texture ) {

			texture.flipY = false;

			texture.name = textureDef.name || sourceDef.name || '';

			if ( texture.name === '' && typeof sourceDef.uri === 'string' && sourceDef.uri.startsWith( 'data:image/' ) === false ) {

				texture.name = sourceDef.uri;

			}

			const samplers = json.samplers || {};
			const sampler = samplers[ textureDef.sampler ] || {};

			texture.magFilter = WEBGL_FILTERS[ sampler.magFilter ] || LinearFilter;
			texture.minFilter = WEBGL_FILTERS[ sampler.minFilter ] || LinearMipmapLinearFilter;
			texture.wrapS = WEBGL_WRAPPINGS[ sampler.wrapS ] || RepeatWrapping;
			texture.wrapT = WEBGL_WRAPPINGS[ sampler.wrapT ] || RepeatWrapping;
			texture.generateMipmaps = ! texture.isCompressedTexture && texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter;

			parser.associations.set( texture, { textures: textureIndex } );

			return texture;

		} ).catch( function () {

			return null;

		} );

		this.textureCache[ cacheKey ] = promise;

		return promise;

	}

	loadImageSource( sourceIndex, loader ) {

		const parser = this;
		const json = this.json;
		const options = this.options;

		if ( this.sourceCache[ sourceIndex ] !== undefined ) {

			return this.sourceCache[ sourceIndex ].then( ( texture ) => texture.clone() );

		}

		const sourceDef = json.images[ sourceIndex ];

		const URL = self.URL || self.webkitURL;

		let sourceURI = sourceDef.uri || '';
		let isObjectURL = false;

		if ( sourceDef.bufferView !== undefined ) {

			// Load binary image data from bufferView, if provided.

			sourceURI = parser.getDependency( 'bufferView', sourceDef.bufferView ).then( function ( bufferView ) {

				isObjectURL = true;
				const blob = new Blob( [ bufferView ], { type: sourceDef.mimeType } );
				sourceURI = URL.createObjectURL( blob );
				return sourceURI;

			} );

		} else if ( sourceDef.uri === undefined ) {

			throw new Error( 'THREE.GLTFLoader: Image ' + sourceIndex + ' is missing URI and bufferView' );

		}

		const promise = Promise.resolve( sourceURI ).then( function ( sourceURI ) {

			return new Promise( function ( resolve, reject ) {

				let onLoad = resolve;

				if ( loader.isImageBitmapLoader === true ) {

					onLoad = function ( imageBitmap ) {

						const texture = new Texture( imageBitmap );
						texture.needsUpdate = true;

						resolve( texture );

					};

				}

				loader.load( LoaderUtils.resolveURL( sourceURI, options.path ), onLoad, undefined, reject );

			} );

		} ).then( function ( texture ) {

			// Clean up resources and configure Texture.

			if ( isObjectURL === true ) {

				URL.revokeObjectURL( sourceURI );

			}

			assignExtrasToUserData( texture, sourceDef );

			texture.userData.mimeType = sourceDef.mimeType || getImageURIMimeType( sourceDef.uri );

			return texture;

		} ).catch( function ( error ) {

			console.error( 'THREE.GLTFLoader: Couldn\'t load texture', sourceURI );
			throw error;

		} );

		this.sourceCache[ sourceIndex ] = promise;
		return promise;

	}

	/**
	 * Asynchronously assigns a texture to the given material parameters.
	 *
	 * @private
	 * @param {Object} materialParams
	 * @param {string} mapName
	 * @param {Object} mapDef
	 * @param {string} [colorSpace]
	 * @return {Promise<Texture>}
	 */
	assignTexture( materialParams, mapName, mapDef, colorSpace ) {

		const parser = this;

		return this.getDependency( 'texture', mapDef.index ).then( function ( texture ) {

			if ( ! texture ) return null;

			if ( mapDef.texCoord !== undefined && mapDef.texCoord > 0 ) {

				texture = texture.clone();
				texture.channel = mapDef.texCoord;

			}

			if ( parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] ) {

				const transform = mapDef.extensions !== undefined ? mapDef.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] : undefined;

				if ( transform ) {

					const gltfReference = parser.associations.get( texture );
					texture = parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ].extendTexture( texture, transform );
					parser.associations.set( texture, gltfReference );

				}

			}

			if ( colorSpace !== undefined ) {

				texture.colorSpace = colorSpace;

			}

			materialParams[ mapName ] = texture;

			return texture;

		} );

	}

	/**
	 * Assigns final material to a Mesh, Line, or Points instance. The instance
	 * already has a material (generated from the glTF material options alone)
	 * but reuse of the same glTF material may require multiple threejs materials
	 * to accommodate different primitive types, defines, etc. New materials will
	 * be created if necessary, and reused from a cache.
	 *
	 * @private
	 * @param {Object3D} mesh Mesh, Line, or Points instance.
	 */
	assignFinalMaterial( mesh ) {

		const geometry = mesh.geometry;
		let material = mesh.material;

		const useDerivativeTangents = geometry.attributes.tangent === undefined;
		const useVertexColors = geometry.attributes.color !== undefined;
		const useFlatShading = geometry.attributes.normal === undefined;

		if ( mesh.isPoints ) {

			const cacheKey = 'PointsMaterial:' + material.uuid;

			let pointsMaterial = this.cache.get( cacheKey );

			if ( ! pointsMaterial ) {

				pointsMaterial = new PointsMaterial();
				Material.prototype.copy.call( pointsMaterial, material );
				pointsMaterial.color.copy( material.color );
				pointsMaterial.map = material.map;
				pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

				this.cache.add( cacheKey, pointsMaterial );

			}

			material = pointsMaterial;

		} else if ( mesh.isLine ) {

			const cacheKey = 'LineBasicMaterial:' + material.uuid;

			let lineMaterial = this.cache.get( cacheKey );

			if ( ! lineMaterial ) {

				lineMaterial = new LineBasicMaterial();
				Material.prototype.copy.call( lineMaterial, material );
				lineMaterial.color.copy( material.color );
				lineMaterial.map = material.map;

				this.cache.add( cacheKey, lineMaterial );

			}

			material = lineMaterial;

		}

		// Clone the material if it will be modified
		if ( useDerivativeTangents || useVertexColors || useFlatShading ) {

			let cacheKey = 'ClonedMaterial:' + material.uuid + ':';

			if ( useDerivativeTangents ) cacheKey += 'derivative-tangents:';
			if ( useVertexColors ) cacheKey += 'vertex-colors:';
			if ( useFlatShading ) cacheKey += 'flat-shading:';

			let cachedMaterial = this.cache.get( cacheKey );

			if ( ! cachedMaterial ) {

				cachedMaterial = material.clone();

				if ( useVertexColors ) cachedMaterial.vertexColors = true;
				if ( useFlatShading ) cachedMaterial.flatShading = true;

				if ( useDerivativeTangents ) {

					// https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995
					if ( cachedMaterial.normalScale ) cachedMaterial.normalScale.y *= -1;
					if ( cachedMaterial.clearcoatNormalScale ) cachedMaterial.clearcoatNormalScale.y *= -1;

				}

				this.cache.add( cacheKey, cachedMaterial );

				this.associations.set( cachedMaterial, this.associations.get( material ) );

			}

			material = cachedMaterial;

		}

		mesh.material = material;

	}

	getMaterialType( /* materialIndex */ ) {

		return MeshStandardMaterial;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
	 *
	 * @private
	 * @param {number} materialIndex
	 * @return {Promise<Material>}
	 */
	loadMaterial( materialIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;
		const materialDef = json.materials[ materialIndex ];

		let materialType;
		const materialParams = {};
		const materialExtensions = materialDef.extensions || {};

		const pending = [];

		if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ] ) {

			const kmuExtension = extensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ];
			materialType = kmuExtension.getMaterialType();
			pending.push( kmuExtension.extendParams( materialParams, materialDef, parser ) );

		} else {

			// Specification:
			// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

			const metallicRoughness = materialDef.pbrMetallicRoughness || {};

			materialParams.color = new Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.setRGB( array[ 0 ], array[ 1 ], array[ 2 ], LinearSRGBColorSpace );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, SRGBColorSpace ) );

			}

			materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
			materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

			if ( metallicRoughness.metallicRoughnessTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture ) );
				pending.push( parser.assignTexture( materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture ) );

			}

			materialType = this._invokeOne( function ( ext ) {

				return ext.getMaterialType && ext.getMaterialType( materialIndex );

			} );

			pending.push( Promise.all( this._invokeAll( function ( ext ) {

				return ext.extendMaterialParams && ext.extendMaterialParams( materialIndex, materialParams );

			} ) ) );

		}

		if ( materialDef.doubleSided === true ) {

			materialParams.side = DoubleSide;

		}

		const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

		if ( alphaMode === ALPHA_MODES.BLEND ) {

			materialParams.transparent = true;

			// See: https://github.com/mrdoob/three.js/issues/17706
			materialParams.depthWrite = false;

		} else {

			materialParams.transparent = false;

			if ( alphaMode === ALPHA_MODES.MASK ) {

				materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;

			}

		}

		if ( materialDef.normalTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'normalMap', materialDef.normalTexture ) );

			materialParams.normalScale = new Vector2( 1, 1 );

			if ( materialDef.normalTexture.scale !== undefined ) {

				const scale = materialDef.normalTexture.scale;

				materialParams.normalScale.set( scale, scale );

			}

		}

		if ( materialDef.occlusionTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'aoMap', materialDef.occlusionTexture ) );

			if ( materialDef.occlusionTexture.strength !== undefined ) {

				materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;

			}

		}

		if ( materialDef.emissiveFactor !== undefined && materialType !== MeshBasicMaterial ) {

			const emissiveFactor = materialDef.emissiveFactor;
			materialParams.emissive = new Color().setRGB( emissiveFactor[ 0 ], emissiveFactor[ 1 ], emissiveFactor[ 2 ], LinearSRGBColorSpace );

		}

		if ( materialDef.emissiveTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'emissiveMap', materialDef.emissiveTexture, SRGBColorSpace ) );

		}

		return Promise.all( pending ).then( function () {

			const material = new materialType( materialParams );

			if ( materialDef.name ) material.name = materialDef.name;

			assignExtrasToUserData( material, materialDef );

			parser.associations.set( material, { materials: materialIndex } );

			if ( materialDef.extensions ) addUnknownExtensionsToUserData( extensions, material, materialDef );

			return material;

		} );

	}

	/**
	 * When Object3D instances are targeted by animation, they need unique names.
	 *
	 * @private
	 * @param {string} originalName
	 * @return {string}
	 */
	createUniqueName( originalName ) {

		const sanitizedName = PropertyBinding.sanitizeNodeName( originalName || '' );

		if ( sanitizedName in this.nodeNamesUsed ) {

			return sanitizedName + '_' + ( ++ this.nodeNamesUsed[ sanitizedName ] );

		} else {

			this.nodeNamesUsed[ sanitizedName ] = 0;

			return sanitizedName;

		}

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
	 *
	 * Creates BufferGeometries from primitives.
	 *
	 * @private
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Promise<Array<BufferGeometry>>}
	 */
	loadGeometries( primitives ) {

		const parser = this;
		const extensions = this.extensions;
		const cache = this.primitiveCache;

		function createDracoPrimitive( primitive ) {

			return extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ]
				.decodePrimitive( primitive, parser )
				.then( function ( geometry ) {

					return addPrimitiveAttributes( geometry, primitive, parser );

				} );

		}

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const primitive = primitives[ i ];
			const cacheKey = createPrimitiveKey( primitive );

			// See if we've already created this geometry
			const cached = cache[ cacheKey ];

			if ( cached ) {

				// Use the cached geometry if it exists
				pending.push( cached.promise );

			} else {

				let geometryPromise;

				if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) {

					// Use DRACO geometry if available
					geometryPromise = createDracoPrimitive( primitive );

				} else {

					// Otherwise create a new geometry
					geometryPromise = addPrimitiveAttributes( new BufferGeometry(), primitive, parser );

				}

				// Cache this geometry
				cache[ cacheKey ] = { primitive: primitive, promise: geometryPromise };

				pending.push( geometryPromise );

			}

		}

		return Promise.all( pending );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
	 *
	 * @private
	 * @param {number} meshIndex
	 * @return {Promise<Group|Mesh|SkinnedMesh|Line|Points>}
	 */
	loadMesh( meshIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		const meshDef = json.meshes[ meshIndex ];
		const primitives = meshDef.primitives;

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const material = primitives[ i ].material === undefined
				? createDefaultMaterial( this.cache )
				: this.getDependency( 'material', primitives[ i ].material );

			pending.push( material );

		}

		pending.push( parser.loadGeometries( primitives ) );

		return Promise.all( pending ).then( function ( results ) {

			const materials = results.slice( 0, results.length - 1 );
			const geometries = results[ results.length - 1 ];

			const meshes = [];

			for ( let i = 0, il = geometries.length; i < il; i ++ ) {

				const geometry = geometries[ i ];
				const primitive = primitives[ i ];

				// 1. create Mesh

				let mesh;

				const material = materials[ i ];

				if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
						primitive.mode === undefined ) {

					// .isSkinnedMesh isn't in glTF spec. See ._markDefs()
					mesh = meshDef.isSkinnedMesh === true
						? new SkinnedMesh( geometry, material )
						: new Mesh( geometry, material );

					if ( mesh.isSkinnedMesh === true ) {

						// normalize skin weights to fix malformed assets (see #15319)
						mesh.normalizeSkinWeights();

					}

					if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleStripDrawMode );

					} else if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleFanDrawMode );

					}

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINES ) {

					mesh = new LineSegments( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_STRIP ) {

					mesh = new Line( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_LOOP ) {

					mesh = new LineLoop( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.POINTS ) {

					mesh = new Points( geometry, material );

				} else {

					throw new Error( 'THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode );

				}

				if ( Object.keys( mesh.geometry.morphAttributes ).length > 0 ) {

					updateMorphTargets( mesh, meshDef );

				}

				mesh.name = parser.createUniqueName( meshDef.name || ( 'mesh_' + meshIndex ) );

				assignExtrasToUserData( mesh, meshDef );

				if ( primitive.extensions ) addUnknownExtensionsToUserData( extensions, mesh, primitive );

				parser.assignFinalMaterial( mesh );

				meshes.push( mesh );

			}

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				parser.associations.set( meshes[ i ], {
					meshes: meshIndex,
					primitives: i
				} );

			}

			if ( meshes.length === 1 ) {

				if ( meshDef.extensions ) addUnknownExtensionsToUserData( extensions, meshes[ 0 ], meshDef );

				return meshes[ 0 ];

			}

			const group = new Group();

			if ( meshDef.extensions ) addUnknownExtensionsToUserData( extensions, group, meshDef );

			parser.associations.set( group, { meshes: meshIndex } );

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				group.add( meshes[ i ] );

			}

			return group;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
	 *
	 * @private
	 * @param {number} cameraIndex
	 * @return {Promise<THREE.Camera>}
	 */
	loadCamera( cameraIndex ) {

		let camera;
		const cameraDef = this.json.cameras[ cameraIndex ];
		const params = cameraDef[ cameraDef.type ];

		if ( ! params ) {

			console.warn( 'THREE.GLTFLoader: Missing camera parameters.' );
			return;

		}

		if ( cameraDef.type === 'perspective' ) {

			camera = new PerspectiveCamera( MathUtils.radToDeg( params.yfov ), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6 );

		} else if ( cameraDef.type === 'orthographic' ) {

			camera = new OrthographicCamera( - params.xmag, params.xmag, params.ymag, - params.ymag, params.znear, params.zfar );

		}

		if ( cameraDef.name ) camera.name = this.createUniqueName( cameraDef.name );

		assignExtrasToUserData( camera, cameraDef );

		return Promise.resolve( camera );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
	 *
	 * @private
	 * @param {number} skinIndex
	 * @return {Promise<Skeleton>}
	 */
	loadSkin( skinIndex ) {

		const skinDef = this.json.skins[ skinIndex ];

		const pending = [];

		for ( let i = 0, il = skinDef.joints.length; i < il; i ++ ) {

			pending.push( this._loadNodeShallow( skinDef.joints[ i ] ) );

		}

		if ( skinDef.inverseBindMatrices !== undefined ) {

			pending.push( this.getDependency( 'accessor', skinDef.inverseBindMatrices ) );

		} else {

			pending.push( null );

		}

		return Promise.all( pending ).then( function ( results ) {

			const inverseBindMatrices = results.pop();
			const jointNodes = results;

			// Note that bones (joint nodes) may or may not be in the
			// scene graph at this time.

			const bones = [];
			const boneInverses = [];

			for ( let i = 0, il = jointNodes.length; i < il; i ++ ) {

				const jointNode = jointNodes[ i ];

				if ( jointNode ) {

					bones.push( jointNode );

					const mat = new Matrix4();

					if ( inverseBindMatrices !== null ) {

						mat.fromArray( inverseBindMatrices.array, i * 16 );

					}

					boneInverses.push( mat );

				} else {

					console.warn( 'THREE.GLTFLoader: Joint "%s" could not be found.', skinDef.joints[ i ] );

				}

			}

			return new Skeleton( bones, boneInverses );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
	 *
	 * @private
	 * @param {number} animationIndex
	 * @return {Promise<AnimationClip>}
	 */
	loadAnimation( animationIndex ) {

		const json = this.json;
		const parser = this;

		const animationDef = json.animations[ animationIndex ];
		const animationName = animationDef.name ? animationDef.name : 'animation_' + animationIndex;

		const pendingNodes = [];
		const pendingInputAccessors = [];
		const pendingOutputAccessors = [];
		const pendingSamplers = [];
		const pendingTargets = [];

		for ( let i = 0, il = animationDef.channels.length; i < il; i ++ ) {

			const channel = animationDef.channels[ i ];
			const sampler = animationDef.samplers[ channel.sampler ];
			const target = channel.target;
			const name = target.node;
			const input = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.input ] : sampler.input;
			const output = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.output ] : sampler.output;

			if ( target.node === undefined ) continue;

			pendingNodes.push( this.getDependency( 'node', name ) );
			pendingInputAccessors.push( this.getDependency( 'accessor', input ) );
			pendingOutputAccessors.push( this.getDependency( 'accessor', output ) );
			pendingSamplers.push( sampler );
			pendingTargets.push( target );

		}

		return Promise.all( [

			Promise.all( pendingNodes ),
			Promise.all( pendingInputAccessors ),
			Promise.all( pendingOutputAccessors ),
			Promise.all( pendingSamplers ),
			Promise.all( pendingTargets )

		] ).then( function ( dependencies ) {

			const nodes = dependencies[ 0 ];
			const inputAccessors = dependencies[ 1 ];
			const outputAccessors = dependencies[ 2 ];
			const samplers = dependencies[ 3 ];
			const targets = dependencies[ 4 ];

			const tracks = [];

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				const node = nodes[ i ];
				const inputAccessor = inputAccessors[ i ];
				const outputAccessor = outputAccessors[ i ];
				const sampler = samplers[ i ];
				const target = targets[ i ];

				if ( node === undefined ) continue;

				if ( node.updateMatrix ) {

					node.updateMatrix();

				}

				const createdTracks = parser._createAnimationTracks( node, inputAccessor, outputAccessor, sampler, target );

				if ( createdTracks ) {

					for ( let k = 0; k < createdTracks.length; k ++ ) {

						tracks.push( createdTracks[ k ] );

					}

				}

			}

			return new AnimationClip( animationName, undefined, tracks );

		} );

	}

	createNodeMesh( nodeIndex ) {

		const json = this.json;
		const parser = this;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( nodeDef.mesh === undefined ) return null;

		return parser.getDependency( 'mesh', nodeDef.mesh ).then( function ( mesh ) {

			const node = parser._getNodeRef( parser.meshCache, nodeDef.mesh, mesh );

			// if weights are provided on the node, override weights on the mesh.
			if ( nodeDef.weights !== undefined ) {

				node.traverse( function ( o ) {

					if ( ! o.isMesh ) return;

					for ( let i = 0, il = nodeDef.weights.length; i < il; i ++ ) {

						o.morphTargetInfluences[ i ] = nodeDef.weights[ i ];

					}

				} );

			}

			return node;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
	 *
	 * @private
	 * @param {number} nodeIndex
	 * @return {Promise<Object3D>}
	 */
	loadNode( nodeIndex ) {

		const json = this.json;
		const parser = this;

		const nodeDef = json.nodes[ nodeIndex ];

		const nodePending = parser._loadNodeShallow( nodeIndex );

		const childPending = [];
		const childrenDef = nodeDef.children || [];

		for ( let i = 0, il = childrenDef.length; i < il; i ++ ) {

			childPending.push( parser.getDependency( 'node', childrenDef[ i ] ) );

		}

		const skeletonPending = nodeDef.skin === undefined
			? Promise.resolve( null )
			: parser.getDependency( 'skin', nodeDef.skin );

		return Promise.all( [
			nodePending,
			Promise.all( childPending ),
			skeletonPending
		] ).then( function ( results ) {

			const node = results[ 0 ];
			const children = results[ 1 ];
			const skeleton = results[ 2 ];

			if ( skeleton !== null ) {

				// This full traverse should be fine because
				// child glTF nodes have not been added to this node yet.
				node.traverse( function ( mesh ) {

					if ( ! mesh.isSkinnedMesh ) return;

					mesh.bind( skeleton, _identityMatrix );

				} );

			}

			for ( let i = 0, il = children.length; i < il; i ++ ) {

				node.add( children[ i ] );

			}

			return node;

		} );

	}

	// ._loadNodeShallow() parses a single node.
	// skin and child nodes are created and added in .loadNode() (no '_' prefix).
	_loadNodeShallow( nodeIndex ) {

		const json = this.json;
		const extensions = this.extensions;
		const parser = this;

		// This method is called from .loadNode() and .loadSkin().
		// Cache a node to avoid duplication.

		if ( this.nodeCache[ nodeIndex ] !== undefined ) {

			return this.nodeCache[ nodeIndex ];

		}

		const nodeDef = json.nodes[ nodeIndex ];

		// reserve node's name before its dependencies, so the root has the intended name.
		const nodeName = nodeDef.name ? parser.createUniqueName( nodeDef.name ) : '';

		const pending = [];

		const meshPromise = parser._invokeOne( function ( ext ) {

			return ext.createNodeMesh && ext.createNodeMesh( nodeIndex );

		} );

		if ( meshPromise ) {

			pending.push( meshPromise );

		}

		if ( nodeDef.camera !== undefined ) {

			pending.push( parser.getDependency( 'camera', nodeDef.camera ).then( function ( camera ) {

				return parser._getNodeRef( parser.cameraCache, nodeDef.camera, camera );

			} ) );

		}

		parser._invokeAll( function ( ext ) {

			return ext.createNodeAttachment && ext.createNodeAttachment( nodeIndex );

		} ).forEach( function ( promise ) {

			pending.push( promise );

		} );

		this.nodeCache[ nodeIndex ] = Promise.all( pending ).then( function ( objects ) {

			let node;

			// .isBone isn't in glTF spec. See ._markDefs
			if ( nodeDef.isBone === true ) {

				node = new Bone();

			} else if ( objects.length > 1 ) {

				node = new Group();

			} else if ( objects.length === 1 ) {

				node = objects[ 0 ];

			} else {

				node = new Object3D();

			}

			if ( node !== objects[ 0 ] ) {

				for ( let i = 0, il = objects.length; i < il; i ++ ) {

					node.add( objects[ i ] );

				}

			}

			if ( nodeDef.name ) {

				node.userData.name = nodeDef.name;
				node.name = nodeName;

			}

			assignExtrasToUserData( node, nodeDef );

			if ( nodeDef.extensions ) addUnknownExtensionsToUserData( extensions, node, nodeDef );

			if ( nodeDef.matrix !== undefined ) {

				const matrix = new Matrix4();
				matrix.fromArray( nodeDef.matrix );
				node.applyMatrix4( matrix );

			} else {

				if ( nodeDef.translation !== undefined ) {

					node.position.fromArray( nodeDef.translation );

				}

				if ( nodeDef.rotation !== undefined ) {

					node.quaternion.fromArray( nodeDef.rotation );

				}

				if ( nodeDef.scale !== undefined ) {

					node.scale.fromArray( nodeDef.scale );

				}

			}

			if ( ! parser.associations.has( node ) ) {

				parser.associations.set( node, {} );

			}

			parser.associations.get( node ).nodes = nodeIndex;

			return node;

		} );

		return this.nodeCache[ nodeIndex ];

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
	 *
	 * @private
	 * @param {number} sceneIndex
	 * @return {Promise<Group>}
	 */
	loadScene( sceneIndex ) {

		const extensions = this.extensions;
		const sceneDef = this.json.scenes[ sceneIndex ];
		const parser = this;

		// Loader returns Group, not Scene.
		// See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172
		const scene = new Group();
		if ( sceneDef.name ) scene.name = parser.createUniqueName( sceneDef.name );

		assignExtrasToUserData( scene, sceneDef );

		if ( sceneDef.extensions ) addUnknownExtensionsToUserData( extensions, scene, sceneDef );

		const nodeIds = sceneDef.nodes || [];

		const pending = [];

		for ( let i = 0, il = nodeIds.length; i < il; i ++ ) {

			pending.push( parser.getDependency( 'node', nodeIds[ i ] ) );

		}

		return Promise.all( pending ).then( function ( nodes ) {

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				scene.add( nodes[ i ] );

			}

			// Removes dangling associations, associations that reference a node that
			// didn't make it into the scene.
			const reduceAssociations = ( node ) => {

				const reducedAssociations = new Map();

				for ( const [ key, value ] of parser.associations ) {

					if ( key instanceof Material || key instanceof Texture ) {

						reducedAssociations.set( key, value );

					}

				}

				node.traverse( ( node ) => {

					const mappings = parser.associations.get( node );

					if ( mappings != null ) {

						reducedAssociations.set( node, mappings );

					}

				} );

				return reducedAssociations;

			};

			parser.associations = reduceAssociations( scene );

			return scene;

		} );

	}

	_createAnimationTracks( node, inputAccessor, outputAccessor, sampler, target ) {

		const tracks = [];

		const targetName = node.name ? node.name : node.uuid;
		const targetNames = [];

		if ( PATH_PROPERTIES[ target.path ] === PATH_PROPERTIES.weights ) {

			node.traverse( function ( object ) {

				if ( object.morphTargetInfluences ) {

					targetNames.push( object.name ? object.name : object.uuid );

				}

			} );

		} else {

			targetNames.push( targetName );

		}

		let TypedKeyframeTrack;

		switch ( PATH_PROPERTIES[ target.path ] ) {

			case PATH_PROPERTIES.weights:

				TypedKeyframeTrack = NumberKeyframeTrack;
				break;

			case PATH_PROPERTIES.rotation:

				TypedKeyframeTrack = QuaternionKeyframeTrack;
				break;

			case PATH_PROPERTIES.translation:
			case PATH_PROPERTIES.scale:

				TypedKeyframeTrack = VectorKeyframeTrack;
				break;

			default:

				switch ( outputAccessor.itemSize ) {

					case 1:
						TypedKeyframeTrack = NumberKeyframeTrack;
						break;
					case 2:
					case 3:
					default:
						TypedKeyframeTrack = VectorKeyframeTrack;
						break;

				}

				break;

		}

		const interpolation = sampler.interpolation !== undefined ? INTERPOLATION[ sampler.interpolation ] : InterpolateLinear;


		const outputArray = this._getArrayFromAccessor( outputAccessor );

		for ( let j = 0, jl = targetNames.length; j < jl; j ++ ) {

			const track = new TypedKeyframeTrack(
				targetNames[ j ] + '.' + PATH_PROPERTIES[ target.path ],
				inputAccessor.array,
				outputArray,
				interpolation
			);

			// Override interpolation with custom factory method.
			if ( sampler.interpolation === 'CUBICSPLINE' ) {

				this._createCubicSplineTrackInterpolant( track );

			}

			tracks.push( track );

		}

		return tracks;

	}

	_getArrayFromAccessor( accessor ) {

		let outputArray = accessor.array;

		if ( accessor.normalized ) {

			const scale = getNormalizedComponentScale( outputArray.constructor );
			const scaled = new Float32Array( outputArray.length );

			for ( let j = 0, jl = outputArray.length; j < jl; j ++ ) {

				scaled[ j ] = outputArray[ j ] * scale;

			}

			outputArray = scaled;

		}

		return outputArray;

	}

	_createCubicSplineTrackInterpolant( track ) {

		track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline( result ) {

			// A CUBICSPLINE keyframe in glTF has three output values for each input value,
			// representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
			// must be divided by three to get the interpolant's sampleSize argument.

			const interpolantType = ( this instanceof QuaternionKeyframeTrack ) ? GLTFCubicSplineQuaternionInterpolant : GLTFCubicSplineInterpolant;

			return new interpolantType( this.times, this.values, this.getValueSize() / 3, result );

		};

		// Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
		track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;

	}

}

/**
 *
 * @private
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 */
function computeBounds( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const box = new Box3();

	if ( attributes.POSITION !== undefined ) {

		const accessor = parser.json.accessors[ attributes.POSITION ];

		const min = accessor.min;
		const max = accessor.max;

		// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

		if ( min !== undefined && max !== undefined ) {

			box.set(
				new Vector3( min[ 0 ], min[ 1 ], min[ 2 ] ),
				new Vector3( max[ 0 ], max[ 1 ], max[ 2 ] )
			);

			if ( accessor.normalized ) {

				const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
				box.min.multiplyScalar( boxScale );
				box.max.multiplyScalar( boxScale );

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

			return;

		}

	} else {

		return;

	}

	const targets = primitiveDef.targets;

	if ( targets !== undefined ) {

		const maxDisplacement = new Vector3();
		const vector = new Vector3();

		for ( let i = 0, il = targets.length; i < il; i ++ ) {

			const target = targets[ i ];

			if ( target.POSITION !== undefined ) {

				const accessor = parser.json.accessors[ target.POSITION ];
				const min = accessor.min;
				const max = accessor.max;

				// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

				if ( min !== undefined && max !== undefined ) {

					// we need to get max of absolute components because target weight is [-1,1]
					vector.setX( Math.max( Math.abs( min[ 0 ] ), Math.abs( max[ 0 ] ) ) );
					vector.setY( Math.max( Math.abs( min[ 1 ] ), Math.abs( max[ 1 ] ) ) );
					vector.setZ( Math.max( Math.abs( min[ 2 ] ), Math.abs( max[ 2 ] ) ) );


					if ( accessor.normalized ) {

						const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
						vector.multiplyScalar( boxScale );

					}

					// Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
					// to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
					// are used to implement key-frame animations and as such only two are active at a time - this results in very large
					// boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
					maxDisplacement.max( vector );

				} else {

					console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

				}

			}

		}

		// As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
		box.expandByVector( maxDisplacement );

	}

	geometry.boundingBox = box;

	const sphere = new Sphere();

	box.getCenter( sphere.center );
	sphere.radius = box.min.distanceTo( box.max ) / 2;

	geometry.boundingSphere = sphere;

}

/**
 *
 * @private
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addPrimitiveAttributes( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const pending = [];

	function assignAttributeAccessor( accessorIndex, attributeName ) {

		return parser.getDependency( 'accessor', accessorIndex )
			.then( function ( accessor ) {

				geometry.setAttribute( attributeName, accessor );

			} );

	}

	for ( const gltfAttributeName in attributes ) {

		const threeAttributeName = ATTRIBUTES[ gltfAttributeName ] || gltfAttributeName.toLowerCase();

		// Skip attributes already provided by e.g. Draco extension.
		if ( threeAttributeName in geometry.attributes ) continue;

		pending.push( assignAttributeAccessor( attributes[ gltfAttributeName ], threeAttributeName ) );

	}

	if ( primitiveDef.indices !== undefined && ! geometry.index ) {

		const accessor = parser.getDependency( 'accessor', primitiveDef.indices ).then( function ( accessor ) {

			geometry.setIndex( accessor );

		} );

		pending.push( accessor );

	}

	if ( ColorManagement.workingColorSpace !== LinearSRGBColorSpace && 'COLOR_0' in attributes ) {

		console.warn( `THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ColorManagement.workingColorSpace}" not supported.` );

	}

	assignExtrasToUserData( geometry, primitiveDef );

	computeBounds( geometry, primitiveDef, parser );

	return Promise.all( pending ).then( function () {

		return primitiveDef.targets !== undefined
			? addMorphTargets( geometry, primitiveDef.targets, parser )
			: geometry;

	} );

}

/**
 * Copyright (c) 2025 hamamatsu-shota
 * @author hamamatsu-shota
 * @license MIT
 */
const textureMap = /* @__PURE__ */ new Map();
async function createTextureFromBuffer(buffer) {
  if (!buffer) return null;
  const blob = new Blob([buffer]);
  const imageBitmap = await createImageBitmap(blob, { premultiplyAlpha: "none" });
  const texture = new Texture(imageBitmap);
  texture.needsUpdate = true;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
async function deserializeNode(nodeData) {
  let obj;
  if (nodeData.type === "Mesh" && nodeData.geometry) {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(nodeData.geometry.position), 3)
    );
    if (nodeData.geometry.normal) {
      geometry.setAttribute(
        "normal",
        new BufferAttribute(new Float32Array(nodeData.geometry.normal), 3)
      );
    }
    if (nodeData.geometry.uv) {
      geometry.setAttribute(
        "uv",
        new BufferAttribute(new Float32Array(nodeData.geometry.uv), 2)
      );
    }
    if (nodeData.geometry.index) {
      let indexArray;
      if (nodeData.geometry.indexType === "Uint32") {
        indexArray = new Uint32Array(nodeData.geometry.index);
      } else {
        indexArray = new Uint16Array(nodeData.geometry.index);
      }
      geometry.setIndex(new BufferAttribute(indexArray, 1));
    }
    const materialParams = {
      color: new Color().fromArray(nodeData.material.color),
      metalness: nodeData.material.metalness,
      roughness: nodeData.material.roughness
    };
    if (nodeData.material.mapId !== null) {
      Object.assign(materialParams, {
        map: textureMap.get(nodeData.material.mapId)
      });
    }
    const material = new MeshStandardMaterial(materialParams);
    obj = new Mesh(geometry, material);
  } else {
    obj = new Object3D();
  }
  obj.name = nodeData.name;
  obj.matrix.fromArray(nodeData.matrix);
  obj.matrixAutoUpdate = false;
  if (nodeData.children) {
    for (const childData of nodeData.children) {
      const childObj = await deserializeNode(childData);
      obj.add(childObj);
    }
  }
  return obj;
}
class GLTFSuspendableLoader extends GLTFLoader {
  _dracoPath;
  setDracoPath(path) {
    this._dracoPath = path;
  }
  loadSuspendable(url, onLoad, onProgress, onError) {
    const worker = new Worker(new URL(/* @vite-ignore */ ""+new URL('../assets/gltfWorker-BsY-Xsnf.js', import.meta.url).href+"", import.meta.url), { type: "module" });
    const modelLoader = new Observable((observer) => {
      worker.onmessage = async (event) => {
        const { type, ...data } = event.data;
        if (type === "progress") {
          observer.next({ progress: data.loaded / data.total });
        } else if (type === "success") {
          if (data.textureBuffers && data.textureBuffers.length > 0) {
            for (let i = 0; i < data.textureBuffers.length; i++) {
              const tex = await createTextureFromBuffer(data.textureBuffers[i]);
              textureMap.set(i, tex);
            }
          }
          const nodes = await deserializeNode(data.sceneData);
          observer.next({ model: nodes });
          observer.complete();
          worker.terminate();
        } else if (type === "error") {
          observer.error(data.error);
          worker.terminate();
        }
      };
      worker.postMessage({ url, dracoPath: this._dracoPath });
      return () => {
        worker.terminate();
      };
    });
    modelLoader.subscribe({
      next: (data) => {
        if (data.model) {
          onLoad(data.model);
        } else {
          onProgress?.(data?.progress ?? 0);
        }
      },
      error: (error) => {
        onError?.(error);
      },
      complete: () => {
      }
    });
    const abortFunc = () => {
      worker.terminate();
    };
    return abortFunc;
  }
}

export { GLTFSuspendableLoader };
//# sourceMappingURL=index.js.map
