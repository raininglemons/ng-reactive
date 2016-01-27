"use strict";

let gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    less = require('gulp-less-sourcemap'),
    minify = require('gulp-minify'),
    rename = require("gulp-rename"),
    replace = require("gulp-replace");

/**
 * We don't need everything es5 preset has on offer. Doing this gets rid of a bit
 * or superfluous code.
 * @type {*[]}
 */
let babelPlugins = [
    require("babel-plugin-transform-es2015-template-literals"),
    require("babel-plugin-transform-es2015-literals"),
    require("babel-plugin-transform-es2015-function-name"),
    require("babel-plugin-transform-es2015-arrow-functions"),
    require("babel-plugin-transform-es2015-block-scoped-functions"),
    require("babel-plugin-transform-es2015-classes"),
    require("babel-plugin-transform-es2015-object-super"),
    require("babel-plugin-transform-es2015-shorthand-properties"),
    require("babel-plugin-transform-es2015-computed-properties"),
    require("babel-plugin-transform-es2015-for-of"),
    require("babel-plugin-transform-es2015-sticky-regex"),
    require("babel-plugin-transform-es2015-unicode-regex"),
    require("babel-plugin-check-es2015-constants"),
    require("babel-plugin-transform-es2015-spread"),
    require("babel-plugin-transform-es2015-parameters"),
    require("babel-plugin-transform-es2015-destructuring"),
    require("babel-plugin-transform-es2015-block-scoping"),

    // Adds unused code to output
    //
    // require("babel-plugin-transform-es2015-typeof-symbol"),

    // Converts this -> undefined, no good
    // @see https://github.com/babel/babelify/issues/37#issuecomment-160041164
    //
    // require("babel-plugin-transform-es2015-modules-commonjs"),

    [require("babel-plugin-transform-regenerator"), { async: false, asyncGenerators: false }],
];

gulp.task('build-dist-js', () => {
    try {
        gulp.src(['js/ngReactive.es6.js'])
            .pipe(gulp.dest('dist'))
            .pipe(sourcemaps.init())
            .pipe(rename("ngReactive.es5.js"))
            .pipe(babel({
                presets: ['react'/*, 'es2015'*/],
                plugins: babelPlugins
            }))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('dist'));

        gulp.src(['dist/ngReactive.es5.js'])
            .pipe(minify({}))
            .pipe(gulp.dest('dist'));
    } catch (e) {
        console.error(e.message, e.stack);
    }
});

gulp.task('watch', () => {
    gulp.watch(['js/*.js'], ['build-dist-js']);
});

gulp.task('default', ['build-dist-js']);