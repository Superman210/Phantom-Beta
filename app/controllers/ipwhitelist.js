"use strict";

var multiparty = require("multiparty");

var helpers = require("./helpers");

var mongoose = require("mongoose");
var WhitelistedIP = mongoose.model("WhitelistedIP");
var Network = mongoose.model("Network");

var ipWhitelistController = function() {

  this.exportWhitelist = function(req, res) {
    if (req.session.role !== "admin")
      return res.status(401).json({ "message": "API access unauthorized" });
    
    WhitelistedIP.find({}, function(err, docs) {
      res.setHeader("Content-disposition", "attachment; filename=ipwhitelist.csv");
      var data = "IP,Description,Network,Location" + "\n";
      for (let ip of docs) {
        data += `${ip.ip},
                "${ip.description || ""}",
                "${ip.network || ""}",
                "${ip.location || ""}"\n`;
      }
      res.write(data);
      res.end();
    });
  };

  this.importWhitelist = function(req, res) {
    if(req.session.role != "admin")
      return res.status(401).json({ "message": "API access unauthorized" });
    
    var form = new multiparty.Form();
    var data = "";
    form.on("close", function() {
      var records = data.split("\n");
      
      records.forEach(function(record) {
        var fields = record.split(",");
        fields[0] = fields[0].trim();
        if(fields[0] && /^[0-9\:\.]*$/.test(fields[0])) {
          var dupCriteria = { 
            ip: fields[0]
          };
          WhitelistedIP.findOne(dupCriteria, function(err, doc) {
            if(!err && doc) {
              return;
            }
            var new_ip = {
              ip: fields[0],
              description: helpers.removeQuotes(fields[1]),
              network: helpers.removeQuotes(fields[2]),
              location: helpers.removeQuotes(fields[3])
            };
            WhitelistedIP.create(new_ip);
          });
        }
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
  };

  this.getIPWhitelist = function(req, res) {
    var page = req.body.page;
    var pagesize = req.body.pagesize;
    var params = { 
      page: parseInt(page), 
      limit: parseInt(pagesize)
    };
    if(req.body.sort) {
      params.sort = req.body.sort;
    }
    var keyword = req.body.keyword;
    var query = helpers.formSearchQuery(keyword, "ip");
    query = helpers.formSearchQuery(keyword, "description", query);
    query = helpers.formSearchQuery(keyword, "network", query);
    query = helpers.formSearchQuery(keyword, "location", query);

    WhitelistedIP.paginate(query, params, function(err, result) {
      var return_value = {};
      if(result) {
        return_value.ips = result.docs;
        return_value.total = result.total;
        return_value.limit = result.limit;
        return_value.page = result.page;
        return_value.pages = result.pages;
      } else {
        return_value.ips = [];
        return_value.total = 0;
        return_value.limit = pagesize;
        return_value.page = 1;
        return_value.pages = 0;
      }
      res.json(return_value);
    });
  };

  this.getIPWhitelistSingle = function(req, res) {
    var id = req.params.id;
    Network.find((err, nets) => {
      if (err || !nets)
        nets = [];
      
      WhitelistedIP.findById(id, (err, doc) => {
        if(err) {
          console.error(err);
          return res.json({ id: false });
        }

        res.json({
          whitelisted: doc,
          networks: nets
        });
      });
    });
  };

  function updateExistingWhitelistedIP(res, id, editingIP) {
    // Duplication check is added
    
    WhitelistedIP.findOne({
      "_id": { "$ne": id }, 
      "ip": editingIP.ip
    }, (err, doc) => {
      if(!err && doc) {
        return res.json({
          id: false,
          result: false,
          duplicated: true
        });
      }

      WhitelistedIP.findByIdAndUpdate(id, editingIP, function(err, doc) {
        if(err) {
          console.error(err);
          return res.json({ 
            id: false,
            result: false
          });
        }
        res.json({
          result: true,
          ip: doc
        });
      });
    });
  }

  function addIPtoWhitelist(res, editingIP) {
    var ips = editingIP.ip.split(",");
    var dup = false, result = false;
    var ipCount = ips.length, doneCount = 0;
    
    ips.forEach(ip => {
      
      WhitelistedIP.findOne({
        "ip": ip.trim()
      }, function(err, doc) {

        if(!err && doc) {
          dup = true;
          doneCount++;
          if(doneCount >= ipCount) {
            res.json({ result: result, duplicated: dup });
          }
          return;
        }
        editingIP.ip = ip;
        WhitelistedIP.create(editingIP, function(err) {
          doneCount++;
          if(err) {
            console.error(err);
          } else {
            result = true;
          }
          if(doneCount >= ipCount) {
            res.json({ result: result, duplicated: dup });
          }
        });
      });
    });
  }

  this.editWhitelistIP = function(req, res) {
    var editingIP = {
      ip: req.body.ip,  // req.body.ip can be multiple ips separated by comma when adding to list
      description: req.body.description,
      network: req.body.network,
      location: req.body.location
    };
    if(req.body._id) {
      if(req.session.role == "admin") {
        updateExistingWhitelistedIP(res, req.body._id, editingIP);
      } else {
        res.status(401).json({ "message": "API access unauthorized" });
      }
    } else {
      addIPtoWhitelist(res, editingIP);
    }
  };

  this.deleteWhitelistIP = function(req, res) {
    var rst = { result: false };
    if(req.session.role != "admin") {
      res.status(401).json({ "message": "API access unauthorized" });
      return;
    }
    if(req.body._id) {
      WhitelistedIP.findByIdAndRemove(req.body._id, function(err) {
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
  };

};

module.exports = new ipWhitelistController();
