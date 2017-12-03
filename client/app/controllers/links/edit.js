(function() {
  angular.module("app.links.edit", [])
    .controller("EditLinkCtrl", ["$scope", "$state", "$location", "$mdDialog", "$stateParams", "Links", "Tags", "Networks", "Angles", "Dialog", "GeolocationCodes", EditLinkCtrl]);

  function EditLinkCtrl($scope, $state, $location, $mdDialog, $stateParams, Links, Tags, Networks, Angles, Dialog, GeolocationCodes) {

    var empty_regions = [[{ code: "", longname: "All Regions" }]];

    $scope.angles = [];
    $scope.networks = [];

    $scope.times = [{
      "val": -1,
      "text": "Disabled"
    }];

    $scope.link = {
      "link_generated": "",
      "link_voluum": "",
      "link_safe": "",
      "tags": [],
      "total_hits": 0,
      "real_hits": 0,
      "network": "",
      "angle": "",
      "use_ip_blacklist": true,
      "criteria": [
        { "country": "US", "region": "", "city": "" },
      ],
      "criteria_disallow": [],
      "auto_blacklist_count": 0,
      "payout": 36
    };

    $scope.query = {};
    $scope.showSafe = true;

    $scope.title = "Create A New Link";
    $scope.submitButtonTitle = "Create";
    $scope.countries = GeolocationCodes.getCountries();
    $scope.regions = empty_regions;
    $scope.regions_disallow = empty_regions;
    $scope.isEdit = false;
    $scope.voluumShown = false;
    $scope.searchedTags = searchedTags;
    $scope.addNewLocation = addNewLocation;
    $scope.addNewDisallowedLocation = addNewDisallowedLocation;
    $scope.removeCriteria = removeCriteria;
    $scope.removeDisallowedCriteria = removeDisallowedCriteria;
    $scope.updateRegions = updateRegions;
    $scope.updateDisallowRegions = updateDisallowRegions;
    $scope.submit = submit;
    $scope.gotoLinks = gotoLinks;

    $scope.realLinkChange = function() {        
      $scope.generateLink();
    };

    $scope.typeChange = function() {
      console.log('Type change: ' + $scope.link.type)
      $scope.voluumShown = $scope.link.type != '0';
      console.log('$scope.voluumShown ' + $scope.voluumShown)
    }

    Networks.getPage(1, 100, data => {
      $scope.networks = ["", ...data.networks.map(d => d.network)];
    });

    Angles.getPage(1, 100, data => {
      $scope.angles = ["", ...data.angles.map(d => d.angle)];
    });

    $scope.angleChange = function() {
      $scope.showSafe = $scope.link.angle !== $scope.angles[0];
    };

    $scope.networkChange = function() {
      $scope.query.utm_source = $scope.link.network.toLowerCase().replace(".", "_");
      $scope.generateLink();
    };

    $scope.generateLink = function() {
      var link_generated = "";
      var query = "?";
      var link_safe = $scope.link.link_safe;
      var parser = document.createElement('a');

      parser.href = (link_safe.startsWith("http://") || link_safe.startsWith("https://")) ? link_safe : `http://${link_safe}`;
    
      if (parser.pathname !== "/")
        link_generated = parser.pathname;
        
      var utm_params = [];
      
      for (let key of Object.keys($scope.query)) {
        if ($scope.query[key])
          utm_params.push(`${key}=${$scope.query[key]}`);
      }
      
      query += utm_params.join("&");

      if (query === "?") query = "";
      
      $scope.link.link_generated = link_generated + query;
    };


    function queryFromLink() {
      if (!$scope.link.link_generated) return;

      var parser = document.createElement('a');
      parser.href = $scope.link.link_generated;

      if (!parser.search) return;

      var query = parser.search.substring(1);

      const allowedParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

      for (let p of query.split("&")) {
        var q = p.split("=");

        if (allowedParams.includes(q[0]))
          $scope.query[q[0]] = q[1];
      }

    }

    function searchedTags(searchText) {
      var tags = [];

      if ($scope.allTags) {
        $scope.allTags.every(value => {
          var tag = value.tag;

          if (tag.indexOf(searchText) >= 0)
            tags.push(value.tag);
          
          return true;
        });
      }

      return tags;
    }

    function addNewLocation() {
      $scope.link.criteria.push({
        country: "",
        region: "",
        city: ""
      });
    }

    function addNewDisallowedLocation() {
      $scope.link.criteria_disallow.push({
        country: "",
        region: "",
        city: ""
      });
    }

    function removeCriteria(index) {
      if (index > -1)
        $scope.link.criteria.splice(index, 1);
    }

    function removeDisallowedCriteria(index) {
      if (index > -1)
        $scope.link.criteria_disallow.splice(index, 1);
    }

    function copyRegions(orgRegions) {
      var new_regions = [];
      if (orgRegions) {
        orgRegions.forEach(region => {
          new_regions.push({
            code: region.code,
            longname: region.longname
          });
        });
      }
      return new_regions;
    }

    function updateRegions(index) {
      $scope.regions[index] = copyRegions(GeolocationCodes.getCountry($scope.link.criteria[index].country).regions);
    }

    function updateDisallowRegions(index) {
      $scope.regions_disallow[index] = copyRegions(GeolocationCodes.getCountry($scope.link.criteria_disallow[index].country).regions);
    }

    function updateAllRegions() {
      $scope.regions = [];
      $scope.regions_disallow = [];

      for (let i = 0; i < $scope.link.criteria.length; i++)
        updateRegions(i);
      
      for (let i = 0; i < $scope.link.criteria_disallow.length; i++)
        updateDisallowRegions(i);
    }

    function submitEnableAt() {
      let enable_at  = $scope.link.enable_at;

      if (!enable_at || enable_at == -1) {
        $scope.link.enable_at = null;
        return;
      }

      let hour = Math.floor(enable_at);

      let time = moment();
      time.milliseconds(0);
      time.seconds(0);
      time.minutes((enable_at - hour) * 60);
      time.hours(hour);
      time.utc();

      if (+time < +moment())
        time.add(1, 'd');

      $scope.link.enable_at = time.format();
    }

    function submitDisableAt() {
      let disable_at  = $scope.link.disable_at;

      if (!disable_at || disable_at == -1) {
        $scope.link.disable_at = null;
        return;
      }

      let hour = Math.floor(disable_at);

      let time = moment();
      time.milliseconds(0);
      time.seconds(0);
      time.minutes((disable_at - hour) * 60);
      time.hours(hour);
      time.utc();

      if (+time < +moment())
        time.add(1, 'd');

      $scope.link.disable_at = time.format();
    }

    function submit(ev) {
      if (!Links.isValid($scope.link))
        return Dialog.showAlert(ev, "Voluum and Safe Links are required and must start with http://");

      submitEnableAt();
      submitDisableAt();

      Links.newOrUpdate($scope.link, response => {
        if (response.duplicated) {
          Dialog.showAlert(ev, "The generated link already exists.");
          createLinkReset()
        } else
          $location.path("/links/list");
      }, () => {
        Dialog.showAlert(ev, "Request to create/update link has failed.");
        createLinkReset()
      });
    }

    function createLinkReset() {
      let mom_enable = moment($scope.link.enable_at);
      let mom_disable = moment($scope.link.disable_at);
      $scope.link.enable_at = mom_enable.hours() + (mom_enable.minutes() / 60);
      $scope.link.disable_at = mom_disable.hours() + (mom_disable.minutes() / 60);
    }

    function gotoLinks() {
      $location.path("/links/list");
    }

    function loadFromLink(isEdit) {
      Links.get($stateParams.id, data => {
        var link = data.link;
        let enable_at = -1;
        let disable_at = -1;

        if (link.enable_at) {
          let mom = moment(link.enable_at);
          enable_at = mom.hours() + (mom.minutes() / 60);
        }
        if (link.disable_at) {
          let mom = moment(link.disable_at);
          disable_at = mom.hours() + (mom.minutes() / 60);
        }
        
        $scope.link = {
          "angle":            link.angle,
          "network":          link.network,
          "cpc":              link.cpc,
          "payout":           link.payout,
          enable_at,
          disable_at,
          "type":             link.type || "1",
          "link_generated":   link.link_generated || "",
          "link_voluum":      link.link_voluum || "",
          "link_safe":        link.link_safe || "",
          "tags":             link.tags || [],
          "description":      link.description || "",
          "total_hits":       link.total_hits || 0,
          "real_hits":        link.real_hits || 0,
          "use_ip_blacklist": link.use_ip_blacklist || false,
          "criteria":         link.criteria || [],
          "criteria_disallow": link.criteria_disallow || [],
          "auto_blacklist_count": link.auto_blacklist_count || 0
        };

        if (isEdit) $scope.link._id = link._id;

        $scope.angleChange();
        $scope.typeChange();
        
        $scope.allTags = data.alltags;

        queryFromLink();
        updateAllRegions();
        $(".cl-panel-loading").removeClass("cl-panel-loading");
      });
    }    

    function _init() {
      $scope.isEdit = $location.$$path.endsWith("/edit");

      for (let i = 0; i < 24; i++) {
        let suff = i < 12 ? "am" : "pm";
        let hour;

        if (i == 0) hour = 12;
        else if (i <= 12) hour = i;
        else hour = i - 12;

        $scope.times.push({
          "val": i,
          "text": `${hour}:00${suff}`
        });

        $scope.times.push({
          "val": i + 0.5,
          "text": `${hour}:30${suff}`
        });
      }

      if ($stateParams.id) {
        $scope.title = $scope.isEdit ? "Edit Link" : "Duplicate Link";
        if ($scope.isEdit) $scope.submitButtonTitle = "Update";

        loadFromLink($scope.isEdit);
      } else {
        $scope.title = "New Link";

        updateAllRegions();

        $(".cl-panel-loading").removeClass("cl-panel-loading");

        // Tags.getAll(tags => {
        //   $scope.allTags = tags;
          
        // });        
      }
    }

    _init();
  }

})(); 
