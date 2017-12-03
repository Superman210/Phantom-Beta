(function() {
  angular.module("app.links.list", ["ui.bootstrap"])
    .controller("LinksCtrl", ["$scope", "$state", "$window", "$filter", "$location", "$mdDialog", "Links", "Users", "Dialog", LinksCtrl]);

  function LinksCtrl($scope, $state, $window, $filter, $location, $mdDialog, Links, Users, Dialog) {

    $scope.selected = [];
    $scope.admin = false;
    $scope.users = [];
    $scope.links = [];
    $scope.orderCol = "";
    $scope.numPerPageOpt = [20, 50, 100, 500];
    $scope.numPerPage = $scope.numPerPageOpt[0];
    $scope.currentPage = 1;
    $scope.total = 0;
    $scope.searchKeyword = "";
    $scope.ownerFilter = "";
    $scope.searchUpdating = false;

    $scope.select = refresh;
    
    $scope.onNumPerPageChange = () => {
      refresh(1);
    };

    $scope.onSuccess = e => {
      var $el = $(e.trigger);
      var $next = $el.next();

      $el.hide();
      $next.fadeIn(1000);

      window.setTimeout(() => {
        $next.hide();
        $el.fadeIn(1000);
      }, 2000);
    };

    $scope.order = (colName) => {
      if ($scope.orderCol === colName) return;
      
      $scope.orderCol = colName;
      refresh(1);
    };

    $scope.searchKeywordChange = () => {
      $scope.searchUpdating = true;
      refresh(1);
    };

    $scope.ownerFilterChange = () => {
      $scope.searchUpdating = true;
      refresh(1);
    };

    $scope.gotoCreatePage = () => {
      $location.path("/links/new");
    };

    $scope.toggle = function (item, list) {
      var idx = list.indexOf(item);
      
      if (idx > -1)
        list.splice(idx, 1);
      else
        list.push(item);
    };

    $scope.checked = function(list) {
      return !list.length;
    };

    $scope.exists = (id, list) => {
      return list.indexOf(id) > -1;
    };

    $scope.toggleLink = (ev, link) => {
      ev.stopPropagation();
      ev.preventDefault();

      Links.toggleEnableStatus(link, data => {
        if (data.result)
          link.status = data.status;
        else
          Dialog.showAlert(ev, "Failed to change status of the link due to the server error.");
      }, () => {
        Dialog.showAlert(ev, "Request to change status of the link has failed.");
      });
    };

    $scope.duplicateLink = (ev, link) => {
      ev.stopPropagation();
      ev.preventDefault();
      $state.duplicatingLink = link;
      $location.path("/links/new");
    };

    $scope.deleteLinks = (ev, ids) => {
      ev.stopPropagation();
      ev.preventDefault();

      Dialog.showConfirm(ev, "Are you sure to delete this link? Once deleted, you won't be able to recover the link.", () => {
        Links.deleteMany(ids, () => refresh(), () => {
          Dialog.showAlert(ev, "Request to delete link has failed.");
        });
      });
    };

    $scope.reload = () => refresh();

    function refresh(page) {
      if (!page) page = $scope.currentPage;
      
      $(".cl-panel-loading").addClass("cl-panel-loading");
      $scope.links = [];
      Links.getPage(page, $scope.numPerPage, $scope.orderCol, $scope.searchKeyword, $scope.ownerFilter, result => {

        result.links.forEach(l => {
          l.gotosafe = l.link_generated + "USESAFEPAGEPLZ";
          l.gotoreal = l.link_generated + "USENONSAFEPAGEPLZ";
        })

        $scope.links = result.links;
        $scope.currentPage = result.page || 1;
        $scope.total = result.total || 0;
        $scope.pages = result.pages || 0;
        $scope.searchUpdating = false;
        $(".cl-panel-loading").removeClass("cl-panel-loading");
      });
    }


    function _init() {
      refresh();
      Users.getAll(data => {
        $scope.admin = data.admin;
        $scope.users = data.users;
      });
    }

    _init();
  }

})(); 
