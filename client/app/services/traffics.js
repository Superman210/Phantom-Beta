(function() {

  angular.module("app")
    .service("Traffics", ["$http", "$window", "$httpParamSerializer", "$q", "appConfig", "AuthenticationService", TrafficsService]);

  function TrafficsService($http, $window, $httpParamSerializer, $q, appConfig, AuthenticationService) {

    function buildURL(type, data, csv) {
      var { start, limit, ownerFilter, links, from, to, referer, search, ip, domain, country, geo, aso } = data;
      var req = `/api/${type}-traffics?limit=${limit}`;

      if (referer) req += `&referer=${referer}`;
      if (start) req += `&start=${start}`;
      if (from) req += `&from=${from}`;
      if (to) req += `&to=${to}`;
      if (links) req += `&link_ids=${links}`;
      if (country) req += `&country=${country}`;
      if (search) req += `&search=${search}`;
      if (domain) req += `&domain=${domain}`;
      if (geo) req += `&geo=${geo}`;
      if (aso) req += `&aso=${aso}`;
      if (ip) req += `&ip=${ip}`;
      if (ownerFilter) req += `&ownerFilter=${ownerFilter.replace(/ /, "+")}`;
      if (csv) req += `&format=csv`;

      return req;
    }

    this.getReport = function(callback) {
      $http.get('/api/link-traffics/trends')
          .then(res => callback(res.data))
          .catch(res => AuthenticationService.checkAuth(res));
    };

    this.getGeneralPage = function(data, callback) {
      $http.get(buildURL('general', data))
          .then(res => callback(res.data))
          .catch(res => AuthenticationService.checkAuth(res));
    };

    this.getLinksPage = function(data, callback) {
      $http.get(buildURL('link', data))
          .then(res => callback(res.data))
          .catch(res => AuthenticationService.checkAuth(res));
    };

    this.exportGeneral = function(data) {
      window.open(buildURL('general', data, true));
    };

    this.exportLinks = function(data) {
      window.open(buildURL('link', data, true));
    };
  }


})();