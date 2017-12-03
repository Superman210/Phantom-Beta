(function () {
  angular.module("app.core", [
    // Angular modules
    "ngAnimate",
    "ngAria",

    // Custom modules
    "app.layout",
    
    // 3rd Party Modules
    "ngMaterial",
    "ui.router",
    "ui.bootstrap",
    "duScroll"
  ]).factory("appConfig", ["$location", appConfig])
    .config(["$mdThemingProvider", mdConfig]);

  function appConfig($location) {
    var server = $location.protocol() + "://" + $location.host();
    
    if ($location.port() != 80)
      server += ":" + $location.port();

    var pageTransitionOpts = [
      {
        name: "Fade up",
        "class": "animate-fade-up"
      }, {
        name: "Scale up",
        "class": "ainmate-scale-up"
      }, {
        name: "Slide in from right",
        "class": "ainmate-slide-in-right"
      }, {
        name: "Flip Y",
        "class": "animate-flip-y"
      }
    ];
    var date = new Date();
    var year = date.getFullYear();
    var main = {
      brand: "Phantom",
      name: "",
      year: year,
      layout: "wide",                                 // "boxed", "wide"
      menu: "collapsed",                               // "horizontal", "vertical", "collapsed"
      fixedHeader: true,                              // true, false
      fixedSidebar: true,                             // true, false
      pageTransition: pageTransitionOpts[0],          // 0, 1, 2, 3... and build your own
      skin: "11"                                      // 11,12,13,14,15,16; 21,22,23,24,25,26; 31,32,33,34,35,36
    };
    var color = {
      primary: "#009688",
      success: "#8BC34A",
      info: "#00BCD4",
      infoAlt: "#7E57C2",
      warning: "#FFCA28",
      danger: "#F44336",
      text: "#3D4051",
      gray: "#EDF0F1"
    };

    return {
      pageTransitionOpts,
      main,
      color,
      server
    };
  }

  function mdConfig($mdThemingProvider) {
    var cyanAlt = $mdThemingProvider.extendPalette("cyan", {
      "contrastLightColors": "500 600 700 800 900",
      "contrastStrongLightColors": "500 600 700 800 900"
    });

    var lightGreenAlt = $mdThemingProvider.extendPalette("light-green", {
      "contrastLightColors": "500 600 700 800 900",
      "contrastStrongLightColors": "500 600 700 800 900"
    });

    $mdThemingProvider
      .definePalette("cyanAlt", cyanAlt)
      .definePalette("lightGreenAlt", lightGreenAlt);


    $mdThemingProvider.theme("default")
      .primaryPalette("teal", {
        "default": "500"
      })
      .accentPalette("cyanAlt", {
        "default": "500"
      })
      .warnPalette("red", {
        "default": "500"
      })
      .backgroundPalette("grey");
  }
})();