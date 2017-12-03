(function() {

  angular.module("app")
    .service("Networks", ["$http", "$window", "appConfig", "AuthenticationService", NetworksService]);

  function NetworksService($http, $window, appConfig, AuthenticationService) {

    function apiUrl(path) {
      return appConfig.server + "/api" + path;
    }

    this.isValid = function (network) {
      return !!network.network;
    }

    this.get = function (id, callback) {
      $http
        .get(apiUrl("/networks/" + id))
        .then(response => callback(response.data))
        .catch(response => AuthenticationService.checkAuth(response));
    }

    this.getPage = function (page, limit, callback) {
      
      var apiPath = "/networks/page";
      var data = {
        page: page,
        pagesize: limit
      };
      
      $http
        .post(apiUrl(apiPath), data)
        .then(response => callback(response.data))
        .catch(response => AuthenticationService.checkAuth(response));
    };

    this.newOrUpdate = function (network, success, error) {
      if (!this.isValid(network)) {
        if (error) error();
        return;
      }
      
      $http
        .post(apiUrl("/networks"), network)
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
        apiUrl("/networks/delete"),
        { _id: id }
       )
        .success(response => {
          if (AuthenticationService.checkAuth(response)) {
            if (success) {
              success();
            }
          }
        })
        .error(response => {
          if (error) {
            error();
          }
        });
    }

  }


})();