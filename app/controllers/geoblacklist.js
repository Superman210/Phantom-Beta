var multiparty = require("multiparty");

var helpers = require("./helpers");

var mongoose = require("mongoose");
var GeoBlacklist = mongoose.model("GeoBlacklist");

var geoBlacklistController = function() {

  this.exportGeoBlacklist = function(req, res) {
    GeoBlacklist.find({}, function(err, docs) {
      res.setHeader("Content-disposition", "attachment; filename=geoblacklist.csv");
      var data = "Country,Region,City,Description" + "\n";

      for (let geo of docs) {
        data += `"${(geo.country || "")}",
                  "${(geo.region || "")}",
                  "${(geo.city || "")}",
                  "${(geo.description || "")}"\n`;
      }
      res.write(data);
      res.end();
    });
  }

  this.importGeoBlacklist = function(req, res) {
    var form = new multiparty.Form();
    var data = "";
    form.on("close", function() {
      var records = data.split("\n");
      
      records.forEach(function(record) {
        var fields = record.split(",");
        if(fields[0] === "Country" || !fields[0]) {
          return;
        }
        var newRecord = {
          country: helpers.removeQuotes(fields[0]),
          region: helpers.removeQuotes(fields[1]),
          city: helpers.removeQuotes(fields[2]),
          location: helpers.removeQuotes(fields[3])
        };
        GeoBlacklist.create(newRecord);
      });
      res.status(200).json({ message: "Done" });
    });
    form.on("part", function(part){
      if(part.name !== "file") {
        return part.resume();
      }
      part.on("data", function(buf){
        data += buf.toString();
      });
    });
    form.parse(req);
  }

  this.getGeoBlacklist = function(req, res) {
    var page = req.body.page;
    var pagesize = req.body.pagesize;
    var params = { 
      page: parseInt(page), 
      limit: parseInt(pagesize)
    };
    if(req.body.sort) {
      params.sort = req.body.sort;
    }
    var query = {};
    /*var keyword = req.body.keyword;
    var query = helpers.formSearchQuery(keyword, "country");
    query = helpers.formSearchQuery(keyword, "description", query);
    query = helpers.formSearchQuery(keyword, "network", query);
    query = helpers.formSearchQuery(keyword, "location", query);*/

    GeoBlacklist.paginate(query, params, function(err, result) {
      var return_value = {};
      if(result) {
        return_value.items = result.docs;
        return_value.total = result.total;
        return_value.limit = result.limit;
        return_value.page = result.page;
        return_value.pages = result.pages;
      } else {
        return_value.items = [];
        return_value.total = 0;
        return_value.limit = pagesize;
        return_value.page = 1;
        return_value.pages = 0;
      }
      res.json(return_value);
    });
  }

  this.getGeoBlacklistItem = function(req, res) {
    var id = req.params.id;
    GeoBlacklist.findById(id, function(err, doc) {
      if(err) {
        console.error(err);
        res.json({ id: false });
        return;
      }
      res.json({
        item: doc
      });
    });
  }

  function updateExistingGeoBlacklistItem(res, id, editingIP) {
    GeoBlacklist.findByIdAndUpdate(id, editingIP, function(err, doc) {
      if(err) {
        console.error(err);
        res.json({ 
          id: false,
          result: false
        });
        return;
      }
      res.json({
        result: true,
        item: doc
      });
    });
  }

  function addGeoBlacklistItem(res, data) {
    GeoBlacklist.create(data, function(err) {
      res.json({ result: !err });
    });
  }

  this.editGeoBlacklistItem = function(req, res) {
    var data = {
      country: req.body.country.toUpperCase(),
      region: req.body.region.toUpperCase(),
      city: req.body.city.toUpperCase(),
      description: req.body.description
    };
    if(req.body._id) {
      if(req.session.role == "admin") {
        updateExistingGeoBlacklistItem(res, req.body._id, data);
      } else {
        res.status(401).json({ "message": "API access unauthorized" });
      }
    } else {
      addGeoBlacklistItem(res, data);
    }
  }

  this.deleteGeoBlacklistItem = function(req, res) {
    var rst = { result: false };
    if(req.session.role != "admin") {
      res.status(401).json({ "message": "API access unauthorized" });
      return;
    }
    if(req.body._id) {
      GeoBlacklist.findByIdAndRemove(req.body._id, function(err) {
        if(err) {
          console.error(err);
          res.json(rst);
          return;
        }
        rst.result = true;
        res.json(rst);
      });
    } else {
      res.json(rst);
    }
  }

}

module.exports = new geoBlacklistController();
