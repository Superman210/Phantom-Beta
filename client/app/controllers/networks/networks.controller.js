(function () {

  angular.module('app.networks', [])
    .controller('NetworkListCtrl', ['$scope', '$filter', '$location', '$mdDialog', 'Networks', 'Dialog', NetworkListCtrl])
    .controller('NetworkEditCtrl', ['$scope', '$state', '$location', '$mdDialog', '$stateParams', 'Networks', 'Dialog', NetworkEditCtrl]);

  function NetworkListCtrl($scope, $filter, $location, $mdDialog, Networks, Dialog) {

    $scope.networks = [];
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
    $scope.editNetwork = editNetwork;
    $scope.deleteNetwork = deleteNetwork;

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
      $location.path('/networks/new');
    }

    function editNetwork(id) {
      if ($scope.userRole != 'admin')
        return;
      
      $location.path('/networks/' + id + '/edit');
    }

    function deleteNetwork(ev, id) {
      ev.stopPropagation();
      ev.preventDefault();

      Dialog.showConfirm(ev, 'Are you sure to remove this network?', () => {

        Networks.delete(id, () => refresh(), () => {
          Dialog.showAlert(ev, 'Request to remove network failed');
        });

      });
    }

    function refresh(page) {
      if (!page) page = $scope.currentPage;

      Networks.getPage(page, $scope.numPerPage, result => {
        $scope.networks = result.networks;
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

  function NetworkEditCtrl($scope, $state, $location, $mdDialog, $stateParams, Networks, Dialog) {

    $scope.title = 'Add a Network';
    $scope.submitButtonTitle = 'Create';
    $scope.networks = ['', 'Subnet 1', 'Subnet 2', 'BadNet'];
    $scope.network = {};

    $scope.networkName = networkName;
    $scope.submit = submit;
    $scope.goBack = goBack;

    function networkName(network) {
      return network || "No network";
    }

    function submit(ev) {
      ev.stopPropagation();
      ev.preventDefault();

      if (!Networks.isValid($scope.network))
        return Dialog.showAlert(ev, 'One of the fields are empty. Please check before submit.');
      
      Networks.newOrUpdate($scope.network, response => {

        if (response.duplicated)
          Dialog.showAlert(ev, 'Duplicated network: such network already exists.');
        else 
          $location.path('/networks/list');
        
      }, () => {
        Dialog.showAlert(ev, 'Add/updating a network has failed.');
      });
    }

    function goBack() {
      $location.path('/networks/list');
    }

    function _init() {

      if ($stateParams.id) {
        $scope.title = 'Edit Network';
        $scope.submitButtonTitle = 'Update';

        Networks.get($stateParams.id, (network) => {
          $scope.network = network;
          $('.cl-panel-loading').removeClass('cl-panel-loading');
        });

      } else {
        $('.cl-panel-loading').removeClass('cl-panel-loading');
      }
    }

    _init();
  }

})(); 
