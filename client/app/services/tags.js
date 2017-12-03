(function() {

  angular.module("app")
    .service("Tags", ["$http", "$window", "appConfig", "AuthenticationService", TagsService]);

  function TagsService($http, $window, appConfig, AuthenticationService) {

    function apiUrl(path) {
      return appConfig.server + "/api" + path;
    }

    this.getAll = function (callback) {
      $http
        .get(apiUrl("/tags"))
        .then(response => callback(response.data))
        .then(() => callback([]));
    };

  }

})();