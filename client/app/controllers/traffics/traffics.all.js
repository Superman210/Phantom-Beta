(() => {
  angular.module("app.traffics.all", [])
    .controller("TrafficsAllCtrl", ["$scope", "$state", "$filter", "$location", "$http", "$stateParams", "Traffics", "Users", "Links", "Dialog", TrafficsAllCtrl]);

  function TrafficsAllCtrl($scope, $state, $filter, $location, $http, $stateParams, Traffics, Users) {
    var $loading = $(".cl-panel-loading");

    Object.assign($scope, {
      starts: [],
      links: [],
      admin: false,
      users: [],
      traffics: [],
      numPerPageOpt: [20, 50, 100, 250, 500, 750, 1000],
      numPerPage: 100,
      total: 0,
      headerCheckbox: false,
      perPageSelected: true, 
      searchUpdating: false,
      search: {},
      onNumPerPageChange: () => refresh(),
      country: $stateParams.country || '',

      page: () => $scope.starts.length + 1,

      dateSelected: () => $scope.fromDate || $scope.toDate,
      date: refresh,

      searchChange: () => {
        $scope.searchUpdating = true;
        $scope.firstPage();
      },

      toggleAllCheckboxes: () => {
        for (let t of $scope.traffics)
          t.selected = $scope.headerCheckbox;
      },

      selectedItemExists: () => $scope.traffics.filter(t => t.selected).length,

      addToBlacklist: () => {
        var ips = $scope.traffics.filter(t => t.selected).map(t => t.ip);

        ips = Array.from(new Set(ips));

        if (!ips.length) return;

        $state.selectedIPs = ips;
        $location.path("/ipblacklist/new");
      },

      hasPrev: () => !!$scope.starts.length,
      hasNext: () => Math.ceil($scope.total / $scope.numPerPage) !== $scope.starts.length,

      firstPage: () => {
        $scope.starts = [];

        refresh();
      },

      prevPage: () => {
        $scope.starts.pop();

        refresh(
          $scope.starts.length ? $scope.starts[$scope.starts.length-1] : 0
        );
      },

      nextPage: () => {
        var time = +new Date($scope.traffics[$scope.traffics.length - 1].access_time);

        $scope.starts.push(time);

        refresh(time);
      },

      onSuccess: e => {
        var $el = $(e.trigger);
        var $next = $el.next();

        $el.hide();
        $next.fadeIn(1000);

        window.setTimeout(() => {
          $next.hide();
          $el.fadeIn(1000);
        }, 2000);
      },

      export: () => {
        Traffics.exportLinks(buildQuery());
      },

      reload: () => refresh()
    });

    function buildQuery(start) {
      let q = {
        start,
        'country': $scope.country,
        "limit": $scope.numPerPage,
        "domain": $scope.searchDomain,
        "ip": $scope.searchIP,
        "geo": $scope.searchGeo,
        'aso': $scope.searchAso,
        "from": $scope.fromDate ? +$scope.fromDate : null,
        "to": $scope.toDate ? +$scope.toDate : null
      };

      return q;
    }

    function refresh(start) {
      let query = buildQuery(start);

      $scope.traffics = [];
      $loading.addClass("cl-panel-loading");

      Traffics.getGeneralPage(query, result => {

        result.traffics.map(l => {
          l.fingerprint = l.fp && l.fp.fngprnt ? l.fp.fngprnt : "";
        })

        $scope.traffics = result.traffics;
        $scope.currentPage = result.page || 1;
        $scope.total = result.total || 0;
        $scope.pages = result.pages || 0;
        $scope.searchUpdating = false;

        $loading.removeClass("cl-panel-loading");
      });
    }

    refresh();

    Users.getAll(data => {
      $scope.admin = data.admin;
      $scope.users = data.users;
    });
  }
})(); 