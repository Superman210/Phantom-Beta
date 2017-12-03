(() => {
  angular.module("app.traffics.link", [])
    .controller("TrafficsLinkCtrl", ["$scope", "$state", "$filter", "$location", "$http", "$stateParams", "Traffics", "Users", "Links", "Dialog", TrafficsLinkCtrl]);

  function TrafficsLinkCtrl($scope, $state, $filter, $location, $http, $stateParams, Traffics, Users, Links) {
    var $loading = $(".cl-panel-loading");

    Object.assign($scope, {
      starts: [],
      links: [],
      admin: false,
      users: [],
      traffics: [],
      numPerPageOpt: [20, 50, 100, 200, 300, 400, 500],
      numPerPage: 100,
      total: 0,
      headerCheckbox: false,
      ownerFilter: "",
      searchKeyword: "",
      perPageSelected: true, 
      searchUpdating: false,
      onNumPerPageChange: () => refresh(),

      page: () => $scope.starts.length + 1,

      dateSelected: () => $scope.fromDate || $scope.toDate,
      date: refresh,

      searchKeywordChange: () => {
        $scope.searchUpdating = true;
        $scope.firstPage();
      },

      loadTags: query => {
        var url = `/api/links/page?term=${query}`;

        if ($scope.ownerFilter) url += `&owner=${$scope.ownerFilter}`;
        return $http.get(url);
      },

      ownerFilterChange: () => {
        $scope.searchUpdating = true;
        refresh();
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

      addLink: () => {
        window.setTimeout($scope.firstPage, 0);
      },

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
      return {
        start,
        "links": $scope.links.map(l => l.id).join(","),
        "limit": $scope.numPerPage,
        "referer": $scope.searchReferer,
        "ownerFilter": $scope.ownerFilter, 
        "from": $scope.fromDate ? +$scope.fromDate : null,
        "to": $scope.toDate ? +$scope.toDate : null
      };
    }

    function refresh(start) {
      let query = buildQuery(start);

      $scope.traffics = [];
      $loading.addClass("cl-panel-loading");

      Traffics.getLinksPage(query, result => {
        result.traffics.map(l => {
          if (!l.enabled)
            l.icon = 'pause'
          else
            l.icon = l.used_real ? 'check-circle' : 'close-circle'
        })

        $scope.traffics = result.traffics;
        $scope.currentPage = result.page || 1;
        $scope.total = result.total || 0;
        $scope.pages = result.pages || 0;
        $scope.searchUpdating = false;

        $loading.removeClass("cl-panel-loading");
      });
    }

    if ($stateParams.linkID) {
      Links.get($stateParams.linkID, data => {
        let link = {
          "id": data.link._id,
          "owner": data.link.owner,
          "text": data.link.link_safe,
          "desc": data.link.description
        }

        console.dir(link);

        $scope.links.push(link);
        refresh();        
      });
    } else {
      refresh();
    }

    Users.getAll(data => {
      $scope.admin = data.admin;
      $scope.users = data.users;
    });
  }
})(); 