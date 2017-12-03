(function () {

  angular.module("app")
    .service("Dialog", ["$mdDialog", DialogService])
    
  function DialogService($mdDialog) {

    this.showAlert = function (ev, content) {
      return $mdDialog.show(
        $mdDialog.alert()
          .parent(angular.element(document.querySelector("#popupContainer")))
          .clickOutsideToClose(true)
          .content(content)
          .ok("OK")
          .targetEvent(ev)
     );
    }

    this.showConfirm = function (ev, content, ok_callback) {
      var confirm = $mdDialog.confirm()
        .title("Confrim")
        .content(content)
        .ariaLabel("Confrim")
        .targetEvent(ev)
        .ok("Yes")
        .cancel("No");

      $mdDialog.show(confirm).then(ok_callback);
    };
  }

})(); 