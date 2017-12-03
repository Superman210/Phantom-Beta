(function () {
  angular.module("app").config([
    "$stateProvider", 
    "$urlRouterProvider", 
    ($stateProvider, $urlRouterProvider) => {

      /* Set routes */
      var routes = [{
        "url": "links",
        "template": "links/links"
      },{
        "url": "links/list",
        "template": "links/links"
      },{
        "url": "links/new",
        "template": "links/edit"
      },{
        "url": "links/:id/dup",
        "template": "links/edit"
      },{
        "url": "links/:id/edit",
        "template": "links/edit"
      },{


        "url": "traffics/link/list",
        "template": "traffics/traffics.link"
      },{
        "url": "traffics/link/list/:linkID",
        "template": "traffics/traffics.link"
      },{
        "url": "traffics/all/list",
        "template": "traffics/traffics.all"
      },{
        "url": "traffics/all/country/:country",
        "template": "traffics/traffics.all"
      },{
        "url": "traffics/report",
        "template": "traffics/traffics.report"
      },{

        
        "url": "ipblacklist/list",
        "template": "ipblacklist/list"
      },{
        "url": "ipblacklist/new",
        "template": "ipblacklist/edit"
      },{
        "url": "ipblacklist/:id/edit",
        "template": "ipblacklist/edit"
      },{
        "url": "ipblacklist/import",
        "template": "ipblacklist/import"
      },{
        "url": "ipblacklist/export",
        "template": "ipblacklist/export"
      },{
        

        "url": "ipwhitelist/list",
        "template": "ipwhitelist/list"
      },{
        "url": "ipwhitelist/new",
        "template": "ipwhitelist/edit"
      },{
        "url": "ipwhitelist/:id/edit",
        "template": "ipwhitelist/edit"
      },{
        "url": "ipwhitelist/import",
        "template": "ipwhitelist/import"
      },{
        "url": "ipwhitelist/export",
        "template": "ipwhitelist/export"
      },{


        "url": "networks/list",
        "template": "networks/list"
      },{
        "url": "networks/new",
        "template": "networks/edit"
      },{
        "url": "networks/:id/edit",
        "template": "networks/edit"
      },{

        "url": "angles/list",
        "template": "angles/list"
      },{
        "url": "angles/new",
        "template": "angles/edit"
      },{
        "url": "angles/:id/edit",
        "template": "angles/edit"
      },{


        "url": "geoblacklist/list",
        "template": "geoblacklist/list"
      },{
        "url": "geoblacklist/new",
        "template": "geoblacklist/edit"
      },{
        "url": "geoblacklist/:id/edit",
        "template": "geoblacklist/edit"
      },{
        "url": "geoblacklist/import",
        "template": "geoblacklist/import"
      },{
        "url": "geoblacklist/export",
        "template": "geoblacklist/export"
      },{
        

        "url": "users/list",
        "template": "users/list"
      },{
        "url": "users/new",
        "template": "users/edit"
      },{
        "url": "users/:id/edit",
        "template": "users/edit"
      }];


      for (let route of routes) {
        $stateProvider.state(route.url, {
          "url": `/${route.url}`,
          "templateUrl": `this-is-a-static-dir/app/controllers/${route.template}.html`
        });
      }

      /* Dashboard route */
      $urlRouterProvider.when("/", "/links").otherwise("/links");
    }]
  );

})(); 