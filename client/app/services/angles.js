(function() {

  angular.module("app")
    .service("Angles", ["$http", "$window", "appConfig", "AuthenticationService", AnglesService]);

  function AnglesService($http, $window, appConfig, AuthenticationService) {

    function apiUrl(path) {
      return appConfig.server + "/api" + path;
    }

    this.isValid = function (angle) {
      return !!angle.angle;
    }

    this.get = function (id, callback) {
      $http
        .get(apiUrl("/angles/" + id))
        .then(response => callback(response.data))
        .catch(response => AuthenticationService.checkAuth(response));
    }

    this.getPage = function (page, limit, callback) {
      
      var apiPath = "/angles/page";
      var data = {
        page: page,
        pagesize: limit
      };
      
      $http
        .post(apiUrl(apiPath), data)
        .then(response => callback(response.data))
        .catch(response => AuthenticationService.checkAuth(response));
    };

    this.newOrUpdate = function (angle, success, error) {
      if (!this.isValid(angle)) {
        if (error) error();
        return;
      }
      
      $http
        .post(apiUrl("/angles"), angle)
        .success(response => {
          if (AuthenticationService.checkAuth(response)) {
            if (success) {
              success(response);
            }
          }
        })
        .error(response => {
          if (error) {
            error(response);
          }
        });
    }

    this.delete = function (id, success, error) {
      if (!id) {
        if (error) {
          error();
        }
        return;
      }
      
      $http
        .post(
        apiUrl("/angles/delete"),
        { _id: id }
       )
        .success(response => {
          if (AuthenticationService.checkAuth(response)) {
            if (success) {
              success();
            }
          }
        })
        .error(error => {
          if (error) {
            error();
          }
        });
    }

  }


})();