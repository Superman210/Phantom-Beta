(function() {

  angular.module("app")
    .service("GeoBlacklist", ["$http", "$window", "appConfig", "AuthenticationService", GeolocationBlacklistService]);

  function GeolocationBlacklistService($http, $window, appConfig, AuthenticationService) {

    function apiUrl(path) {
      return appConfig.server + "/api" + path;
    }

    this.isValid = function (geo) {
      return (geo.country != "");
    }

    this.getPage = function (page, limit, sort, keyword, callback) {
      var data = {
        page: page,
        pagesize: limit
      };

      if (sort) data.sort = sort;
      if (keyword) data.keyword = keyword;

      $http
        .post(apiUrl("/geoblacklist/page"), data)
        .then(response => {
          callback(response.data);
        })
        .catch(response => {
          AuthenticationService.checkAuth(response);
        });
    }

    this.get = function (id, callback) {
      if (!id) {
        callback({ id: false });
      }
      
      $http
        .get(apiUrl("/geoblacklist/" + id))
        .then(response => {
          callback(response.data);
        })
        .catch(response => {
          AuthenticationService.checkAuth(response);
        });
    }

    this.newOrUpdate = function (geolocation, success, error) {
      if (!this.isValid(geolocation)) {
        if (error) {
          error();
        }
        return;
      }
      
      $http
        .post(apiUrl("/geoblacklist"), geolocation)
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
      
      $http.post(
        apiUrl("/geoblacklist/delete"),
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

    this.exportCSV = function () {
      $window.location.href = apiUrl("/geoblacklist/export");
    }
  }

})();