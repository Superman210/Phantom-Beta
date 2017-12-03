(function() {

  angular.module("app")
    .service("IPBlacklist", ["$http", "$window", "appConfig", "AuthenticationService", IPBlacklistService]);

  
  function IPBlacklistService($http, $window, appConfig, AuthenticationService) {

    function apiUrl(path) {
      return appConfig.server + "/api" + path;
    }

    this.isValid = function (ip) {
      return (ip.ip != "") && (ip.description != "");
    };

    this.getPage = function (page, limit, sort, keyword, callback) {
      
      var data = {
        page: page,
        pagesize: limit
      };
      if (sort) {
        data.sort = sort;
      }
      if (keyword) {
        data.keyword = keyword;
      }
      $http
        .post(apiUrl("/ipblacklist/page"), data)
        .then(response => {
          callback(response.data);
        })
        .catch(response => {
          AuthenticationService.checkAuth(response);
        });
    };

    this.get = function (id, callback) {
      if (!id) {
        callback({ id: false });
      }
      
      $http
        .get(apiUrl("/ipblacklist/" + id))
        .then(response => {
          callback(response.data);
        })
        .catch(response => {
          AuthenticationService.checkAuth(response);
        });
    }

    this.newOrUpdate = function (ip, success, error) {
      if (!this.isValid(ip)) {
        if (error) {
          error();
        }
        return;
      }
      
      $http
        .post(apiUrl("/ipblacklist"), ip)
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
        apiUrl("/ipblacklist/delete"),
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
      $window.location.href = apiUrl("/ipblacklist/export");
    }
  }



})();