(function () {

  angular.module("app.users", [])
    .controller("UsersCtrl", ["$scope", "$state", "$window", "$filter", "$location", "$mdDialog", "Users", "Dialog", UsersCtrl])
    .controller("EditUserCtrl", ["$scope", "$state", "$location", "$mdDialog", "$stateParams", "Users", "Dialog", "GeolocationCodes", EditUserCtrl])

  function UsersCtrl($scope, $state, $window, $filter, $location, $mdDialog, Users, Dialog) {

    $scope.users = [];
    $scope.orderCol = "";
    $scope.numPerPageOpt = [20, 50, 100];
    $scope.numPerPage = $scope.numPerPageOpt[0];
    $scope.currentPage = 1;
    $scope.total = 0;

    $scope.select = select;
    $scope.onNumPerPageChange = onNumPerPageChange;
    $scope.order = order;

    $scope.gotoCreatePage = gotoCreatePage;
    $scope.editUser = editUser;
    $scope.deleteUser = deleteUser;
    $scope.loadDefaultUsers = loadDefaultUsers;

    function select(page) {
      refresh(page);
    }

    function onNumPerPageChange() {
      select(1);
    }

    function order(colName) {
      if ($scope.orderCol === colName)
        return;
      
      $scope.orderCol = colName;
      select(1);
    }

    function refresh(page) {
      if (!page)
        page = $scope.currentPage;
      
      Users.getPage(page, $scope.numPerPage, $scope.orderCol, function(result) {
        $scope.users = result.docs;
        $scope.currentPage = result.page || 1;
        $scope.total = result.total || 0;
        $scope.pages = result.pages || 0;
        $scope.searchUpdating = false;
        $(".cl-panel-loading").removeClass("cl-panel-loading");
      });
    }

    function gotoCreatePage() {
      $location.path("/users/new");
    }

    function editUser(id) {
      $location.path("/users/" + id + "/edit");
    }

    function deleteUser(ev, id) {
      ev.stopPropagation();
      ev.preventDefault();

      Dialog.showConfirm(ev, "Are you sure to delete this User?", () => {
        Users.delete(id, () => refresh(), () => {
          Dialog.showAlert(ev, "Request to delete user has failed.");
        });
      });
    }

    function loadDefaultUsers(ev) {

      Dialog.showConfirm(ev, "Are you sure to reset and load default users?", () => {
        Users.loadDefaults(() => refresh(), () => {
          Dialog.showAlert(ev, "Request to reset to defaults has failed.");
        });
      });
    }

    function _init() {
      refresh();
    }

    _init();
  }

  function EditUserCtrl($scope, $state, $location, $mdDialog, $stateParams, Users, Dialog) {

    $scope.user = {
      username: "",
      role: "user"
    };
    $scope.title = "Create New User";
    $scope.submitButtonTitle = "Create";

    $scope.submit = submit;
    $scope.gotoList = gotoList;

    function submit(ev) {
      if (!Users.isValid($scope.user))
        return Dialog.showAlert(ev, "One of the fields are empty. Please check before submit.");
      
      Users.newOrUpdate($scope.user, response => {
        if (response.duplicated)
          Dialog.showAlert(ev, "Duplicated user: such user already exists.");
        else
          $location.path("/users/list");
      }, () => {
        Dialog.showAlert(ev, "Request to create/update user has failed.");
      });
    }

    function gotoList() {
      $location.path("/users/list");
    }

    function _init() {
      if($stateParams.id) {
        $scope.title = "Edit User";
        $scope.submitButtonTitle = "Update";
        Users.get($stateParams.id, function(data) {
          $scope.user = data;
          $(".cl-panel-loading").removeClass("cl-panel-loading");
        });
      } else {
        $(".cl-panel-loading").removeClass("cl-panel-loading");
      }
    }

    _init();
  }

})(); 
