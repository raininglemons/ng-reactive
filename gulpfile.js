"use strict";

let gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    less = require('gulp-less-sourcemap'),
    minify = require('gulp-minify'),
    rename = require("gulp-rename"),
    replace = require("gulp-replace");

gulp.task('build-dist-js', () => {
    try {
        gulp.src(['js/ngReactive.es6.js'])
            .pipe(gulp.dest('dist'))
            .pipe(sourcemaps.init())
            .pipe(rename("ngReactive.es5.js"))
            .pipe(babel({presets: ['react', 'es2015']}))
            // Hacky way to prevent `this` from being replaced by undefined
            //
            .pipe(replace(/\(undefined/, "(this"))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('dist'));

        gulp.src(['dist/ngReactive.es5.js'])
            .pipe(minify({}))
            // Hacky way to prevent `this` from being replaced by void 0
            //
            .pipe(replace(/\(void 0/, "(this"))
            .pipe(gulp.dest('dist'));
    } catch (e) {
        console.error(e.message, e.stack);
    }
});

gulp.task('watch', () => {
    gulp.watch(['js/*.js'], ['build-dist-js']);
});

gulp.task('default', ['build-dist-js']);