const gulp = require("gulp");
const concat = require("gulp-concat");
const uglify = require('gulp-uglify');
const pump = require('pump');
const config = require("./gulp.config")();
const $ = require("gulp-load-plugins")({ lazy: true });
const tagVersion = require('gulp-tag-version');
const bump = require('gulp-bump');


gulp.task("help", $.taskListing);
gulp.task("default", ["sass", "copy", "js-bundle", "sass-watcher", "assets-watcher", "js-watcher"]);
gulp.task("scripts", ["sass", "copy", "js-bundle"]);

gulp.task('tag', function() {
  return gulp.src(['./package.json']).pipe(tagVersion());
});

gulp.task('bump', function(){
  gulp.src(['./bower.json', './component.json', './package.json'])
    .pipe(bump({type:'major'}))
    .pipe(gulp.dest('./'));
});

gulp.task("sass", function() {
  let stream = gulp.src(config.sass)
    .pipe(
      $.sass({
        "outputStyle": "compressed" // nested, expanded, compact, compressed
      })
    )
    .pipe(gulp.dest(config.sassDist));

  stream.on('error', () => error('Invalid SASS'));

  return stream;
});

gulp.task("copy", cb => {
  log("Copying assets");

  pump([
    gulp.src(config.assets, { base: config.client }),
    gulp.dest(config.dist + "/")
  ], cb)
});

gulp.task("js-bundle", (cb) => {
  log("bundling js files");
  var files = [
    ...config.bower.map(f => `${config.client}/bower_components/${f}`),
    ...config.jsFiles.map(f => `${config.client}/${f}`)
  ];

  pump([
    gulp.src(files),
    concat("app.js"),
    // babel({
    //  "presets": ["es2015"]
    // }))
    //uglify(),
    gulp.dest(config.jsDist)
  ], cb)
});

gulp.task("sass-watcher", () => {
  gulp.watch([config.sass], ["sass"]);
});

gulp.task("assets-watcher", () => {
  gulp.watch([config.assets], ["copy"]);
});

gulp.task("js-watcher", () => {
  gulp.watch([
    config.jsFiles.map(f => `${config.client}/${f}`)
  ], ["js-bundle"]);
});

gulp.task("build", ["sass", "copy", "js-bundle"]);

function _log(msg, color) {
  $.util.log(
    $.util.colors[color || 'green'](
      JSON.stringify(msg, null, 4)
    )
  );
}

function log(msg) {
  _log(msg, 'green')
}

function error(msg) {
  _log(msg, 'red');
}
