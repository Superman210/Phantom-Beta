(function () {

  angular.module('app.layout', [])
    .directive('toggleNavCollapsedMin', ['$rootScope', toggleNavCollapsedMin])
    .directive('collapseNav', collapseNav)
    .directive('highlightActive', highlightActive)
    .directive('toggleOffCanvas', toggleOffCanvas);

  // switch for mini style NAV, realted to 'collapseNav' directive
  function toggleNavCollapsedMin($rootScope) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, ele) {
      var app = $('#app');

      ele.on('click', e => {
        if (!app.hasClass('nav-collapsed-min'))
          $rootScope.$broadcast('nav:reset');

        app.toggleClass('nav-collapsed-min');
        
        return e.preventDefault();
      });            
    }
  }

  // for accordion/collapse style NAV
  function collapseNav() {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, ele) {
      var $window = $(window);
      var prevWidth = $window.width();
      var $app = $('#app');
      var $nav = $('#nav-container');
      var slideTime = 250;
      var $lists = ele.find('ul').parent('li');
      var $a = $lists.children('a');

      $lists.append('<i class="fa fa-angle-down icon-has-ul-h"></i>');
      $a.append('<i class="fa fa-angle-down icon-has-ul"></i>');

      var $aRest = ele.children('li').not($lists).children('a');
      
      $a.on('click', function(event) {
        var $parent;

        if ($nav.hasClass('nav-horizontal') && $window.width() >= 768)
          return false;

        $parent = $(this).parent('li');
        event.preventDefault();
        
        if ($app.hasClass('nav-collapsed-min'))
          return $parent.children("ul").find("a:eq(0)").click();

        $lists.not($parent).removeClass('open').find('ul').slideUp(slideTime);
        $parent.toggleClass('open').find('ul').stop().slideToggle(slideTime);
      });

      $aRest.on('click', () => {
        $lists.removeClass('open').find('ul').slideUp(slideTime);
      });

      scope.$on('nav:reset', () => {
        $lists.removeClass('open').find('ul').slideUp(slideTime);
      });

      var t;

      $window.resize(() => {
        clearTimeout(t);

        t = setTimeout(() => {
          var currentWidth = $window.width();

          if (currentWidth < 768)
            $app.removeClass('nav-collapsed-min');
          
          if (prevWidth < 768 && currentWidth >= 768 && $nav.hasClass('nav-horizontal')) 
            $lists.removeClass('open').find('ul').slideUp(slideTime);
          
          prevWidth = currentWidth;
        }, 300);
      });
    }
  }

  // Add 'active' class to li based on url, muli-level supported, jquery free
  function highlightActive() {
    var directive = {
      restrict: 'A',
      controller: [ '$scope', '$element', '$attrs', '$location', toggleNavCollapsedMinCtrl]
    };

    return directive;

    function toggleNavCollapsedMinCtrl($scope, $element, $attrs, $location) {
      var highlightActive, links;

      links = $element.find('a');

      highlightActive = (links, path) => {
        path = '#' + path;

        return angular.forEach(links, link => {
          var $li, $link, href;
          $link = angular.element(link);
          $li = $link.parent('li');
          href = $link.attr('href');

          if ($li.hasClass('active'))
            $li.removeClass('active');
          
          if (path.indexOf(href) === 0)
            return $li.addClass('active');
            
        });
      };

      highlightActive(links, $location.path());

      $scope.$watch(() => $location.path(), (newVal, oldVal) => {
        if (newVal === oldVal) return;
        
        return highlightActive(links, $location.path());
      });

    }

  }

  // toggle on-canvas for small screen, with CSS
  function toggleOffCanvas() {
    return {
      restrict: 'A',
      link: (scope, ele) => {
        ele.on('click', () => $('#app').toggleClass('on-canvas'));         
      }
    };
  }

})(); 

