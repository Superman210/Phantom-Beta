(() => {
  angular.module("app.traffics.report", [])
    .controller("TrafficsReportCtrl", ["$scope", "$state", "$filter", "$location", "$http", "$stateParams", "Traffics", "Dialog", TrafficsReportCtrl]);

  function TrafficsReportCtrl($scope, $state, $filter, $location, $http, $stateParams, Traffics) {
    var $loading = $(".cl-panel-loading");

    Object.assign($scope, {
      users: [],
      traffics: [],
    });

    function refresh() {
      $scope.traffics = [];

      $loading.addClass("cl-panel-loading");

      Traffics.getReport(result => {
        $scope.traffics = result;

        $loading.removeClass("cl-panel-loading");
      });
    }

    refresh();
  }
})(); 