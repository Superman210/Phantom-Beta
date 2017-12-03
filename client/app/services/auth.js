(function() {

  angular.module("app")
    .service("AuthenticationService", ["$http", "$window", "appConfig", "Dialog", AuthenticationService])

  function AuthenticationService($http, $window, appConfig) {

    this.checkAuth = function(response) {
      if (response.status !== 401) return true;

      $window.location.href = appConfig.server + "/admin/login";

      return false;
    };
    
  }

})();