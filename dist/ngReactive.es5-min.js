"use strict";var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol?"symbol":typeof e};!function(e,t){void 0!==e.module?e.module.exports=t("react","reactDom"):void 0!==e.define?e.define("ngReactive",function(){return t("react","reactDom")}):e.ngReactive=t(e.React,e.ReactDOM,e.angular)}(void 0,function(e,t,n){var r={};return r.bind=function(e,t){return function(){return e.apply(t,arguments)}},r.async=function(){function e(e){e.source==window&&e.data==n&&(e.stopPropagation(),t.length>0&&t.shift()())}var t=[],n="async-timeout-message";return window.addEventListener("message",e,!0),function(e){t.push(e),window.postMessage(n,"*")}}(),r.reactScope=function(e,t){if(e instanceof Array)return e.some(function(e){return e instanceof Object})?e.map(function(n){return n instanceof Function?r.reactFunction(n,t,e):n instanceof Object?r.reactScope(n,t):n}):e;var n=function(){for(var n=e,o=[],c=Object.keys(e);n!==Object.prototype;)o=o.concat(Object.getOwnPropertyNames(n)),n=Object.getPrototypeOf(n);return{v:o.reduce(function(n,o){return e[o]instanceof Function?Object.defineProperty(n,o,{enumerable:o in c,configurable:!1,get:function(){return r.reactFunction(e[o],t,e)}}):e[o]instanceof Object?Object.defineProperty(n,o,{enumerable:o in c,configurable:!0,get:function(){return delete this[o],this[o]=r.reactScope(e[o],t)}}):Object.defineProperty(n,o,{enumerable:o in c,configurable:!1,writable:!1,value:e[o]}),n},{})}}();return"object"===("undefined"==typeof n?"undefined":_typeof(n))?n.v:void 0},r.reactFunction=function(e,t,n){return function(){try{return e.apply(this,arguments)}catch(r){throw r}finally{"$apply"!==n.$root.$$phase&&"$digest"!==n.$root.$$phase&&t()}}},r.reactDirective=function(n,o){var c=arguments.length<=2||void 0===arguments[2]?!1:arguments[2];return o=o||{},o.restrict=o.restrict||"E",o.scope=o.scope||Object.keys(n.propTypes).reduce(function(e,t){return e[t]="=",e},{}),o.link=function(o,i){var u=r.bind(o.$apply,o),a=Object.keys(o).filter(function(e){return"$"!==e.substr(0,1)}),f=[],s=[],p=function(e,t){return f[e]===t?s[e]:(f[e]=t,s[e]=r.reactFunction(t,u,o))},y=function(e){return e.map(function(e,t){return e instanceof Function?p(t,e):c&&e instanceof Object?r.reactScope(e,u):e}).reduce(function(e,t,n){return e[a[n]]=t,e},{})};o.$watchGroup(a,function(o){return r.async(function(){return t.render(e.createElement(n,y(o)),i[0])})}),o.$on("$destroy",function(){return t.unmountComponentAtNode(i[0])})},o},n.module("ngReactive",[]).factory("ngReactive",function(){return r.reactDirective}),r.reactDirective});