(function () {
  
  angular.module("app", [
    // Core modules
    "app.core",

    // Features
    "app.links.list",
    "app.links.edit",
    "app.traffics.all",
    "app.traffics.link",
    "app.traffics.report",
    "app.ipblacklist",
    "app.ipwhitelist",
    "app.networks",
    'app.angles',
    "app.geoblacklist",
    "app.users",

    // 3rd party feature modules
    "ngFileUpload",
    "ngclipboard",
    "ngTagsInput",
    "ngPatternRestrict",
    "infinite-scroll"
  ]).controller("AppCtrl", ["$scope", "$rootScope", "$state", "$document", "$window", "appConfig", AppCtrl])
    .controller("LoginCtrl", ["$scope", "$window", "$location", "$stateParams", "appConfig", LoginCtrl]);

  function AppCtrl($scope, $rootScope, $state, $document, $window, appConfig) {

    if (authData.email)
      $window.sessionStorage.email = authData.email;

    $scope.pageTransitionOpts = appConfig.pageTransitionOpts;
    $scope.main = appConfig.main;
    $scope.color = appConfig.color;
    $scope.userRole = authData.role;

    $scope.$watch("main", function (newVal, oldVal) {
      if (newVal.menu === "horizontal" && oldVal.menu === "vertical")
        $rootScope.$broadcast("nav:reset");

      if (newVal.fixedHeader === false && newVal.fixedSidebar === true)
        $scope.main.fixedHeader = $scope.main.fixedSidebar = (oldVal.fixedHeader || oldVal.fixedSidebar);
      
      else if (newVal.fixedSidebar === true)
        $scope.main.fixedHeader = true;
      
      else if (newVal.fixedHeader === false)
        $scope.main.fixedSidebar = false;
        
    }, true);

    $rootScope.$on("$stateChangeSuccess", () => {
      $document.scrollTo(0, 0);
    });
  }

  function LoginCtrl($scope, $window, $location, $stateParams) {
    $window.sessionStorage.email = $stateParams.email;
    $location.path("/links/list");
  }

})();