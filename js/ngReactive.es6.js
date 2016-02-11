(function (global, lib) {
    /**
     * @see http://ifandelse.com/its-not-hard-making-your-library-support-amd-and-commonjs/
     */
    // CommonJS
    if (global.module !== undefined)
        global.module.exports = lib(require('react'), require('react-dom'), require('angular'));
    // AMD
    else if (global.define !== undefined)
        global.define("ngReactive", ['react', 'react-dom', 'angular'], lib);
    else
        global.ngReactive = lib(global.React, global.ReactDOM, global.angular);

}(this, function (React, ReactDOM, angular) {
    "use strict";

    let utils = {};

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
    utils.bind = (fn, _this) => function () {
        return fn.apply(_this, arguments);
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
    utils.async = (function() {
        let timeouts = [],
            messageName = "async-timeout-message";

        function handleMessage(event) {
            if (event.source == window && event.data == messageName) {
                event.stopPropagation();
                if (timeouts.length > 0)
                    timeouts.shift()();
            }
        }

        window.addEventListener("message", handleMessage, true);

        return (fn) => {
            timeouts.push(fn);
            window.postMessage(messageName, "*");
        };
    })();

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
            return $scope.some((e) => e instanceof Object) ? $scope.map((val) => {
                if (val instanceof Function)
                    return utils.reactFunction(val, $apply, $scope);
                else if (val instanceof Object)
                    return utils.reactScope(val, $apply);
                else
                    return val;
            }) : $scope;
        } else {
            let keySource = $scope,
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
            return keys.reduce((scope, key) => {
                if ($scope[key] instanceof Function) {
                    // Wrap function call in a $apply applicable to the ONLY the scope
                    // the fn exists on and it's children to speed up execution. $apply
                    // is for suckers
                    //
                    Object.defineProperty(scope, key, {
                        /*scope[key] = {*/
                        enumerable: key in enumerableKeys,
                        configurable: false,
                        get: () => utils.reactFunction($scope[key], $apply, $scope)
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
                        get: function () {
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
            }, {});
            /* @see https://jsperf.com/defineproperty-vs-defineproperties */
            /* Object.defineProperties(scope, props);
             return scope; */
        }
    };

    utils.reactFunction = ($fn, $apply, $scope) => function () {
        try {
            return $fn.apply(this, arguments);
        } catch (e) {
            throw e;
        } finally {
            // Only $apply if we're not mid-cycle
            //
            if ($scope.$root.$$phase !== "$apply" && $scope.$root.$$phase !== "$digest")
                $apply();
        }
    };

    /**
     * Converts a react class into an angular directive
     * @param reactComponent
     * @param params
     * @param deepParse Should parse objects and auto-wrap any functions (however deep)?
     * @returns {*|{}}
     */
    utils.reactDirective = function reactDirective (reactComponent, params, deepParse = false) {
        params = params || {};

        params.restrict = params.restrict || "E";

        params.scope = params.scope
            || Object.keys(reactComponent.propTypes)
                .reduce((obj, key) => {
                    obj[key] = "=";
                    return obj;
                }, {});

        params.link = function (scope, el) {
            // Get defined variables in scope
            //
            let $apply = utils.bind(scope.$apply, scope),
                vars = Object.keys(scope).filter(v => v.substr(0, 1) !== "$"),
                cachedValues = [],
                cachedProxies = [],
            // Wrap a function or use a cached copy if available
            //
                mapFn = (i, fn) => {
                    if (cachedValues[i] === fn)
                        return cachedProxies[i];
                    else {
                        cachedValues[i] = fn;
                        return cachedProxies[i] = utils.reactFunction(fn, $apply, scope);
                    }
                },
            // Map values from $watchGroup to their keys
            //
                mapValues = (newValues) =>
                    newValues.map((_, i) => _ instanceof Function ? mapFn(i, _) : (deepParse && _ instanceof Object ? utils.reactScope(_, $apply) : _))
                        .reduce((obj, _, i) => {obj[vars[i]] = _; return obj }, {}) /* */;


            // Update component on data change
            //
            scope.$watchGroup(vars, (newValues) =>
                utils.async(() =>
                    ReactDOM.render(
                        React.createElement(reactComponent, mapValues(newValues)),
                        el[0]
                    )
                ));

            // Register tear down function
            //
            scope.$on('$destroy', () => ReactDOM.unmountComponentAtNode(el[0]));
        };

        return params;
    };

    angular.module('ngReactive', [])
        .factory('ngReactive', () => utils.reactDirective);

    return utils.reactDirective;
}));