(function() {

  angular.module("app")
    .service("Users", ["$http", "$window", "appConfig", "AuthenticationService", UsersService]);

  var all_users;

  function UsersService($http, $window, appConfig, AuthenticationService) {

    function apiUrl(path) {
      return appConfig.server + "/api" + path;
    }

    this.isValid = function (user) {
      return user.username && user.role;
    };

    this.getAll = function (success) {
      if (all_users) 
        return success(all_users);

      $http
        .get(apiUrl("/users"))
        .then(response => {
          all_users = response.data;
          success(all_users);
        })
        .catch(response => {
          AuthenticationService.checkAuth(response);
        });
    };

    this.get = function (id, callback) {
      $http
        .get(apiUrl("/users/" + id))
        .then(response => callback(response.data))
        .catch(response => {
          AuthenticationService.checkAuth(response);
        });
    };

    this.getPage = function (page, limit, sort, callback) {
      var apiPath = "/users/page";
      var query = `?page=${page}&pagesize=${limit}`;
      
      if (sort)
        query += "&sort=" + sort;
      
      $http
        .get(apiUrl(apiPath) + query)
        .then(response => callback(response.data))
        .catch(response => {
          AuthenticationService.checkAuth(response);
        });
    };

    this.newOrUpdate = function (user, success, error) {
      if (!this.isValid(user)) {
        if (error)
          error();
        return;
      }

      all_users = null;
      
      $http
        .post(apiUrl("/users"), user)
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
    };

    this.delete = function (id, success, error) {   
      all_users = null;

      $http.post(
        apiUrl("/users/delete"),
        { _id: id }
      ).success(response => {
        
        if (AuthenticationService.checkAuth(response)) {
          if (success) {
            success();
          }
        }
      }).error(() => {
        if (error)
          error();
      });
    };

    this.loadDefaults = function (success, error) {
      all_users = null;
      
      $http
        .post(apiUrl("/users/default"))
        .success(response => {
          if (AuthenticationService.checkAuth(response)) {
            if (success) {
              success();
            }
          }
        })
        .error(res => {
          if (error) {
            error(res);
          }
        });
    };
  }

})();