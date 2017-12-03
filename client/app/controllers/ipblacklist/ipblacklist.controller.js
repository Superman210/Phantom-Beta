(function () {
  "use strict";

  angular.module("app.ipblacklist", [])
    .controller("IPBlacklistListCtrl", ["$scope", "$filter", "$location", "$mdDialog", "IPBlacklist", "Dialog", IPBlacklistListCtrl])
    .controller("IPBlacklistEditCtrl", ["$scope", "$state", "$location", "$mdDialog", "$stateParams", "IPBlacklist", "Networks", "Dialog", IPBlacklistEditCtrl])
    .controller("IPBlacklistImportCtrl", ["$scope", "$timeout", "appConfig", "IPBlacklist", "Upload", IPBlacklistImportCtrl])
    .controller("IPBlacklistExportCtrl", ["$scope", "$window", "IPBlacklist", IPBlacklistExportCtrl])

  function IPBlacklistListCtrl($scope, $filter, $location, $mdDialog, IPBlacklist, Dialog) {

    $scope.ips = [];
    $scope.orderCol = "";
    $scope.numPerPageOpt = [3, 5, 10, 20];
    $scope.numPerPage = $scope.numPerPageOpt[2];
    $scope.currentPage = 1;
    $scope.total = 0;
    $scope.searchKeyword = "";
    $scope.searchUpdating = false;
    $scope.userRole = authData.role;

    $scope.select = select;
    $scope.onNumPerPageChange = onNumPerPageChange;
    $scope.order = order;
    $scope.searchKeywordChange = searchKeywordChange;

    $scope.gotoCreatePage = gotoCreatePage;
    $scope.editIP = editIP;
    $scope.deleteIP = deleteIP;

    function select(page) {
      refresh(page);
    }

    function onNumPerPageChange() {
      select(1);
    }

    function order(colName) {
      if ($scope.orderCol === colName) {
        return;
      }
      $scope.orderCol = colName;
      select(1);
    }

    function searchKeywordChange() {
      $scope.searchUpdating = true;
      select(1);
    }

    function gotoCreatePage() {
      $location.path("/ipblacklist/new");
    }

    function editIP(id) {
      if($scope.userRole != "admin") {
        return;
      }
      $location.path("/ipblacklist/" + id + "/edit");
    }

    function deleteIP(ev, id) {
      ev.stopPropagation();
      ev.preventDefault();
      Dialog.showConfirm(ev, "Are you sure to remove this IP from blacklist?", () => {
        IPBlacklist.delete(id, () => refresh(), () => {
          Dialog.showAlert(ev, "Request to remove IP from blacklist has failed.");
        });
      });
    }

    function refresh(page) {
      if(!page) {
        page = $scope.currentPage;
      }
      IPBlacklist.getPage(page, $scope.numPerPage, $scope.orderCol, $scope.searchKeyword, function(result) {
        $scope.ips = result.ips;
        $scope.currentPage = (result.page) ? result.page : 1;
        $scope.total = (result.total) ? result.total : 0;
        $scope.pages = (result.pages) ? result.pages : 0;
        $scope.searchUpdating = false;
        $(".cl-panel-loading").removeClass("cl-panel-loading");
      });
    }

    function _init() {
      refresh();
    }

    _init();
  }

  function IPBlacklistEditCtrl($scope, $state, $location, $mdDialog, $stateParams, IPBlacklist, Networks, Dialog) {

    $scope.title = "Add an IP Address to Blacklist";
    $scope.submitButtonTitle = "Create";
    $scope.networks = [""];
    $scope.ip = {};

    $scope.networkName = network => network || "No network";

    $scope.submit = ev => {
      ev.stopPropagation();
      ev.preventDefault();

      if (!IPBlacklist.isValid($scope.ip))
        return Dialog.showAlert(ev, "One of the fields are empty. Please check before submit.");

      IPBlacklist.newOrUpdate($scope.ip, response => {
        
        if (response.duplicated)
          return Dialog.showAlert(ev, "One or more of entered IPs already exist in blacklist, and are not added.");

        if (response.result) {
          $location.path("/ipblacklist/list");
        } else {
          if (!response.duplicated) {
            Dialog.showAlert(ev, "Request to update blacklisted IP has failed.");
          }
        }
      }, () => {
        Dialog.showAlert(ev, "Request to add/update blacklisted IP has failed.");
      });
    };

    function _init() {
      if($stateParams.id) {
        $scope.title = "Edit Blacklisted IP";
        $scope.submitButtonTitle = "Update";

        IPBlacklist.get($stateParams.id, data => {
          $scope.ip = data.blacklisted;
          $scope.networks = $scope.networks.concat(data.networks);
          $(".cl-panel-loading").removeClass("cl-panel-loading");
        });

      } else {
        if($state.selectedIPs) {
          $scope.ip.ip = $state.selectedIPs.join(", ");
          $state.selectedIPs = false;
        }

        Networks.getPage(1, 9999, data => {
          $scope.networks = $scope.networks.concat(data.networks);
          $(".cl-panel-loading").removeClass("cl-panel-loading");
          $scope.ip.network = "";
        });
      }
    }

    _init();
  }

  function IPBlacklistImportCtrl($scope, $timeout, appConfig, IPBlacklist, Upload) {

    var input = document.getElementById("fileinput");
    $scope.filename = "";
    $scope.started = false;
    $scope.statusText = "";
    $scope.progressValue = 0;
    
    $scope.chooseFile = function() {
      input.click();
      $scope.importCSV();
    };

    $scope.importCSV = function(file) {
      $scope.statusText = "Importing...";
      $scope.started = true;

      file.upload = Upload.upload({
        url: appConfig.server + "/api/ipblacklist/import",
        data: { file: file }
      });

      file.upload.then(response => {
        $timeout(function() {
          file.result = response.data;
          $scope.progressValue = 100;
          $scope.statusText = "Import finished.";
        }, 200);
      }, res => {
        console.log(res);
      }, evt => {
        $scope.progressValue = evt.total ? evt.loaded / evt.total * 100 : 0;
      });
    }

    function _init() {
      $(input).change(function() {
        var fn = $(input).val();
        var sep_idx = fn.lastIndexOf("\\");
        if (sep_idx >= 0)
          fn = fn.substr(sep_idx + 1);
        
        $scope.filename = fn;
      });
    }

    _init();
  }

  function IPBlacklistExportCtrl($scope, $window, IPBlacklist) {

    $scope.exportCSV = function() {
      IPBlacklist.exportCSV();
    }
  }

})(); 
