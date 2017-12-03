module.exports = function() {
  var client = "client";
  var clientApp = "./client";
  var dist = "public";
  var tmp = ".tmp";
  var docs = "documentation";
  var landing = "landing";

  var config = {
    client,
    dist,
    tmp,
    index: client + "/index.html",
    sass_output: clientApp + "/styles",
    alljs: [
      client + "/client/**/*.js",
      "./*.js"
    ],
    assets: [
      client + "/app/**/*.html",
      client + "/bower_components/font-awesome/css/*",
      client + "/bower_components/font-awesome/fonts/*",
      client + "/bower_components/weather-icons/css/*",
      client + "/bower_components/weather-icons/font/*",
      client + "/bower_components/weather-icons/fonts/*",
      client + "/bower_components/material-design-iconic-font/dist/**/*",
      client + "/bower_components/angular-material/angular-material.min.css",
      client + "/fonts/**/*",
      client + "/i18n/**/*",
      client + "/images/**/*",
      client + "/styles/loader.css",
      client + "/styles/ui/images/*",
      client + "/favicon.ico"
    ],
    less: [],
    sass: [
      client + "/styles/**/*.scss"
    ],
    sassDist: dist + "/styles",
    jsDist: dist + "/scripts",
    bower: [
      "jquery/dist/jquery.min.js",
      "angular/angular.min.js",
      "moment/moment.js",
      "angular-animate/angular-animate.min.js",
      "angular-aria/angular-aria.min.js",
      "angular-ui-router/release/angular-ui-router.min.js",
      "angular-material/angular-material.min.js",
      "angular-bootstrap/ui-bootstrap-tpls.min.js",
      "angular-scroll/angular-scroll.min.js",
      "ngInfiniteScroll/build/ng-infinite-scroll.min.js",
      "ng-pattern-restrict/src/ng-pattern-restrict.min.js",
      "ng-file-upload/ng-file-upload.min.js",
      "ng-file-upload-shim/ng-file-upload-shim.min.js",
    ],
    jsFiles: [
      "app/app.js",
      "app/**/*.js"
    ],
    allToClean: [
      tmp,
      ".DS_Store",
      ".sass-cache",
      "node_modules",
      ".git",
      client + "/bower_components",
      docs + "/jade",
      docs + "/layout.html",
      landing + "/jade",
      landing + "/bower_components",
      "readme.md"
    ]
  };

  return config;
};