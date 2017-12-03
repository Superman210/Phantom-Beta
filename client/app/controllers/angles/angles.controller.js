(function () {

  angular.module('app.angles', [])
    .controller('AngleListCtrl', ['$scope', '$filter', '$location', '$mdDialog', 'Angles', 'Dialog', AngleListCtrl])
    .controller('AngleEditCtrl', ['$scope', '$state', '$location', '$mdDialog', '$stateParams', 'Angles', 'Dialog', AngleEditCtrl]);

  function AngleListCtrl($scope, $filter, $location, $mdDialog, Angles, Dialog) {

    $scope.angles = [];
    $scope.orderCol = '';
    $scope.numPerPageOpt = [20, 50, 100];
    $scope.numPerPage = $scope.numPerPageOpt[0];
    $scope.currentPage = 1;
    $scope.total = 0;
    $scope.userRole = authData.role;

    $scope.select = select;
    $scope.onNumPerPageChange = onNumPerPageChange;
    $scope.order = order;

    $scope.gotoCreatePage = gotoCreatePage;
    $scope.editAngle = editAngle;
    $scope.deleteAngle = deleteAngle;

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

    function gotoCreatePage() {
      $location.path('/angles/new');
    }

    function editAngle(id) {
      if ($scope.userRole != 'admin')
        return;
      
      $location.path('/angles/' + id + '/edit');
    }

    function deleteAngle(ev, id) {
      ev.stopPropagation();
      ev.preventDefault();

      Dialog.showConfirm(ev, 'Are you sure to remove this angle?', () => {

        Angles.delete(id, () => refresh(), () => {
          Dialog.showAlert(ev, 'Request to remove angle failed');
        });

      });
    }

    function refresh(page) {
      if (!page) page = $scope.currentPage;

      Angles.getPage(page, $scope.numPerPage, result => {
        $scope.angles = result.angles;
        $scope.currentPage = result.page || 1;
        $scope.total = result.total ||  0;
        $scope.pages = result.pages || 0;

        $('.cl-panel-loading').removeClass('cl-panel-loading');
      });
    }

    function _init() {
      refresh();
    }

    _init();
  }

  function AngleEditCtrl($scope, $state, $location, $mdDialog, $stateParams, Angles, Dialog) {

    $scope.title = 'Add a Angle';
    $scope.submitButtonTitle = 'Create';
    $scope.angles = ['', 'Subnet 1', 'Subnet 2', 'BadNet'];
    $scope.angle = {};

    $scope.angleName = angleName;
    $scope.submit = submit;
    $scope.goBack = goBack;

    function angleName(angle) {
      return angle || "No angle";
    }

    function submit(ev) {
      ev.stopPropagation();
      ev.preventDefault();

      if (!Angles.isValid($scope.angle))
        return Dialog.showAlert(ev, 'One of the fields are empty. Please check before submit.');
      
      Angles.newOrUpdate($scope.angle, response => {

        if (response.duplicated)
          Dialog.showAlert(ev, 'Duplicated angle: such angle already exists.');
        else 
          $location.path('/angles/list');
        
      }, () => {
        Dialog.showAlert(ev, 'Add/updating a angle has failed.');
      });
    }

    function goBack() {
      $location.path('/angles/list');
    }

    function _init() {

      if ($stateParams.id) {
        $scope.title = 'Edit Angle';
        $scope.submitButtonTitle = 'Update';

        Angles.get($stateParams.id, (angle) => {
          $scope.angle = angle;
          $('.cl-panel-loading').removeClass('cl-panel-loading');
        });

      } else {
        $('.cl-panel-loading').removeClass('cl-panel-loading');
      }
    }

    _init();
  }

})(); 
