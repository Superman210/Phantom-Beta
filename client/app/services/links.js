(function() {

  angular.module("app")
    .service("Links", ["$http", "$window", "appConfig", "AuthenticationService", LinksService]);

  function LinksService($http, $window, appConfig, AuthenticationService) {

    function apiUrl(path) {
      return appConfig.server + "/api" + path;
    }

    function isValidURL(str) {
      if (!str) return false;
      var a  = document.createElement('a');
      a.href = str;
      return (a.host && a.host != window.location.host);
    }

    this.isValid = function(link) {
      return link.link_generated && 
            isValidURL(link.link_voluum) &&
            isValidURL(link.link_safe);
    };

    this.get = function (id, callback) {
      $http
        .get(apiUrl("/links/link/" + id))
        .then(response => callback(response.data))
        .catch(response => AuthenticationService.checkAuth(response));
    };

    this.getPage = function (page, limit, sort, keyword, ownerFilter, callback) {
      
      var apiPath = "/links";
      var data = {
        page: page,
        pagesize: limit
      };

      if (sort)        data.sort = sort;
      if (keyword)     data.keyword = keyword;
      if (ownerFilter) data.ownerFilter = ownerFilter;
      
      $http
        .post(apiUrl(apiPath), data)
        .then(response => callback(response.data))
        .catch(response => AuthenticationService.checkAuth(response));
    };

    this.newOrUpdate = function (link, success, error) {
      if (!this.isValid(link)) {
        if (error) error();
        
        return;
      }

      if (!link.link_generated.startsWith("/"))
        link.link_generated = "/" + link.link_generated;
      
      $http
        .post(apiUrl("/links/new"), link)
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

    this.toggleEnableStatus = function (id, success, error) {
      if (!id) {
        if (error) {
          error();
        }
        return;
      }
      
      $http
        .post(
        apiUrl("/links/toggle"),
        { _id: id }
       )
        .success(response => {
          if (AuthenticationService.checkAuth(response)) {
            if (success) {
              success(response);
            }
          }
        })
        .error(res => {
          if (error) {
            error(res);
          }
        });
    };

    this.delete = function (id, success, error) {
      if (!id) {
        if (error) error();
        return;
      }
      
      $http.post(
        apiUrl("/links/delete"), { 
          _id: id 
        })
        .success(response => {
          if (AuthenticationService.checkAuth(response)) {
            if (success) success();
          }
        })
        .error(() => {
          if (error) error();
        });
    };

    this.deleteMany = function (ids, success, error) {
      if (!ids) {
        if (error) error();
        return;
      }
      
      $http.post(
        apiUrl("/links/delete-many"), { 
          ids: ids 
        })
        .success(response => {
          if (AuthenticationService.checkAuth(response)) {
            if (success) success();
          }
        })
        .error(() => {
          if (error) error();
        });
    };

  }


})();