!function(e,t){void 0!==e.module?e.module.exports=t("react","reactDom"):void 0!==e.define?e.define("ngReactive",function(){return t("react","reactDom")}):e.ngReactive=t(e.React,e.ReactDOM,e.angular)}(this,function(e,t,n){"use strict";var r={};return r.bind=function(e,t){return function(){return e.apply(t,arguments)}},r.async=function(){function e(e){e.source==window&&e.data==n&&(e.stopPropagation(),t.length>0&&t.shift()())}var t=[],n="async-timeout-message";return window.addEventListener("message",e,!0),function(e){t.push(e),window.postMessage(n,"*")}}(),r.reactScope=function(e,t){if(e instanceof Array)return e.some(function(e){return e instanceof Object})?e.map(function(n){return n instanceof Function?r.reactFunction(n,t,e):n instanceof Object?r.reactScope(n,t):n}):e;var n=function(){for(var n=e,c=[],o=Object.keys(e);n!==Object.prototype;)c=c.concat(Object.getOwnPropertyNames(n)),n=Object.getPrototypeOf(n);return{v:c.reduce(function(n,c){return e[c]instanceof Function?Object.defineProperty(n,c,{enumerable:c in o,configurable:!1,get:function(){return r.reactFunction(e[c],t,e)}}):e[c]instanceof Object?Object.defineProperty(n,c,{enumerable:c in o,configurable:!0,get:function(){return delete this[c],this[c]=r.reactScope(e[c],t)}}):Object.defineProperty(n,c,{enumerable:c in o,configurable:!1,writable:!1,value:e[c]}),n},{})}}();return"object"==typeof n?n.v:void 0},r.reactFunction=function(e,t,n){return function(){try{return e.apply(this,arguments)}catch(r){throw r}finally{"$apply"!==n.$root.$$phase&&"$digest"!==n.$root.$$phase&&t()}}},r.reactDirective=function(n,c){var o=arguments.length<=2||void 0===arguments[2]?!1:arguments[2];return c=c||{},c.restrict=c.restrict||"E",c.scope=c.scope||Object.keys(n.propTypes).reduce(function(e,t){return e[t]="=",e},{}),c.link=function(c,i){var u=r.bind(c.$apply,c),a=Object.keys(c).filter(function(e){return"$"!==e.substr(0,1)}),f=[],s=[],p=function(e,t){return f[e]===t?s[e]:(f[e]=t,s[e]=r.reactFunction(t,u,c))},d=function(e){return e.map(function(e,t){return e instanceof Function?p(t,e):o&&e instanceof Object?r.reactScope(e,u):e}).reduce(function(e,t,n){return e[a[n]]=t,e},{})};c.$watchGroup(a,function(c){return r.async(function(){return t.render(e.createElement(n,d(c)),i[0])})}),c.$on("$destroy",function(){return t.unmountComponentAtNode(i[0])})},c},n.module("ngReactive",[]).factory("ngReactive",function(){return r.reactDirective}),r.reactDirective});