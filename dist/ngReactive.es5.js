(function (global, lib) {
    /**
     * @see http://ifandelse.com/its-not-hard-making-your-library-support-amd-and-commonjs/
     */
    // CommonJS
    if (global.module !== undefined) global.module.exports = lib("react", "reactDom");
    // AMD
    else if (global.define !== undefined) global.define("ngReactive", function () {
            return lib("react", "reactDom");
        });else global.ngReactive = lib(global.React, global.ReactDOM, global.angular);
})(this, function (React, ReactDOM, angular) {
    "use strict";

    var utils = {};

    /**
     * Mimic (Function).bind(this). Although does so considerably faster than the
     * native bind function when arguments aren't required to be bound:
     *      Chrome - 11x faster
     *      Firefox - 35x faster
     *      Safari - 4.5x faster
     *
     * @see http://jsperf.com/bind-vs-pseudo-bind
     * @param fn {Function} function to bind
     * @param _this {Object} this object for function
     * @returns {Function} bound function
     */
    utils.bind = function (fn, _this) {
        return function () {
            return fn.apply(_this, arguments);
        };
    };

    //noinspection JSCommentMatchesSignature
    /**
     * Runs a function asynchronously, similar to setTimeout(fn, 0), but considerably
     * faster in the majority of browsers:
     *      Chrome - 4x faster
     *      Firefox - 12x faster
     *      Safari - No change
     *
     * @see http://ajaxian.com/archives/settimeout-delay
     * @param fn {Function} function to run asynchronously
     */
    utils.async = function () {
        var timeouts = [],
            messageName = "async-timeout-message";

        function handleMessage(event) {
            if (event.source == window && event.data == messageName) {
                event.stopPropagation();
                if (timeouts.length > 0) timeouts.shift()();
            }
        }

        window.addEventListener("message", handleMessage, true);

        return function (fn) {
            timeouts.push(fn);
            window.postMessage(messageName, "*");
        };
    }();

    /**
     * Creates an immutable object that allows method calls to parent controller
     * @param $scope
     * @param $apply
     * @returns {reactScope}
     */
    utils.reactScope = function ($scope, $apply) {
        // Check if this $scope has its own $apply as well, if so use that instead
        //

        // Thought? Should be we using ES6 Proxy objects instead? Not sure how they well
        // they transpile with regard to performance
        //
        if ($scope instanceof Array) {
            // Array should be treated differently as we only want to replace functions
            // and NOT allow lazy loading of objects
            //
            return $scope.some(function (e) {
                return e instanceof Object;
            }) ? $scope.map(function (val) {
                if (val instanceof Function) return utils.reactFunction(val, $apply, $scope);else if (val instanceof Object) return utils.reactScope(val, $apply);else return val;
            }) : $scope;
        } else {
            var _ret = function () {
                var keySource = $scope,
                    keys = [],
                    enumerableKeys = Object.keys($scope);

                // Load up all available keys in the object + prototypes
                //
                while (keySource !== Object.prototype) {
                    keys = keys.concat(Object.getOwnPropertyNames(keySource));
                    keySource = Object.getPrototypeOf(keySource); //.__proto__;
                }

                // Proxy all props that are available on original object
                //
                /*
                 @see https://jsperf.com/defineproperty-vs-defineproperties-creation
                 Object.defineProperty is actually faster than Object.defineProperties
                 let props = */
                return {
                    v: keys.reduce(function (scope, key) {
                        if ($scope[key] instanceof Function) {
                            // Wrap function call in a $apply applicable to the ONLY the scope
                            // the fn exists on and it's children to speed up execution. $apply
                            // is for suckers
                            //
                            Object.defineProperty(scope, key, {
                                /*scope[key] = {*/
                                enumerable: key in enumerableKeys,
                                configurable: false,
                                get: function get() {
                                    return utils.reactFunction($scope[key], $apply, $scope);
                                }
                                /*};*/
                            });
                        } else if ($scope[key] instanceof Object) {
                                // For efficiency, lazy load the creation of child objects till
                                // they're requested. Objects can be deep, and may not always be
                                // fully required.
                                //
                                Object.defineProperty(scope, key, {
                                    enumerable: key in enumerableKeys,
                                    configurable: true,
                                    get: function get() {
                                        delete this[key];
                                        return this[key] = utils.reactScope($scope[key], $apply);
                                    }
                                });
                            } else {
                                // Not an object, just return an immutable copy
                                //
                                Object.defineProperty(scope, key, {
                                    /*scope[key] = {*/
                                    enumerable: key in enumerableKeys,
                                    configurable: false,
                                    writable: false,
                                    value: $scope[key]
                                    /*};*/
                                });
                            }
                        return scope;
                    }, {})
                };
                /* @see https://jsperf.com/defineproperty-vs-defineproperties */
                /* Object.defineProperties(scope, props);
                 return scope; */
            }();

            if (typeof _ret === "object") return _ret.v;
        }
    };

    utils.reactFunction = function ($fn, $apply, $scope) {
        return function () {
            try {
                return $fn.apply(this, arguments);
            } catch (e) {
                throw e;
            } finally {
                // Only $apply if we're not mid-cycle
                //
                if ($scope.$root.$$phase !== "$apply" && $scope.$root.$$phase !== "$digest") $apply();
            }
        };
    };

    /**
     * Converts a react class into an angular directive
     * @param reactComponent
     * @param params
     * @param deepParse Should parse objects and auto-wrap any functions (however deep)?
     * @returns {*|{}}
     */
    utils.reactDirective = function reactDirective(reactComponent, params) {
        var deepParse = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

        params = params || {};

        params.restrict = params.restrict || "E";

        params.scope = params.scope || Object.keys(reactComponent.propTypes).reduce(function (obj, key) {
            obj[key] = "=";
            return obj;
        }, {});

        params.link = function (scope, el) {
            // Get defined variables in scope
            //
            var $apply = utils.bind(scope.$apply, scope),
                vars = Object.keys(scope).filter(function (v) {
                return v.substr(0, 1) !== "$";
            }),
                cachedValues = [],
                cachedProxies = [],

            // Wrap a function or use a cached copy if available
            //
            mapFn = function mapFn(i, fn) {
                if (cachedValues[i] === fn) return cachedProxies[i];else {
                    cachedValues[i] = fn;
                    return cachedProxies[i] = utils.reactFunction(fn, $apply, scope);
                }
            },

            // Map values from $watchGroup to their keys
            //
            mapValues = function mapValues(newValues) {
                return newValues.map(function (_, i) {
                    return _ instanceof Function ? mapFn(i, _) : deepParse && _ instanceof Object ? utils.reactScope(_, $apply) : _;
                }).reduce(function (obj, _, i) {
                    obj[vars[i]] = _;return obj;
                }, {});
            } /* */;

            // Update component on data change
            //
            scope.$watchGroup(vars, function (newValues) {
                return utils.async(function () {
                    return ReactDOM.render(React.createElement(reactComponent, mapValues(newValues)), el[0]);
                });
            });

            // Register tear down function
            //
            scope.$on('$destroy', function () {
                return ReactDOM.unmountComponentAtNode(el[0]);
            });
        };

        return params;
    };

    angular.module('ngReactive', []).factory('ngReactive', function () {
        return utils.reactDirective;
    });

    return utils.reactDirective;
});
//# sourceMappingURL=ngReactive.es5.js.map
