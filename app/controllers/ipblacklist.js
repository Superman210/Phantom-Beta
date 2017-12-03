var multiparty = require("multiparty");

var helpers = require("./helpers");

var mongoose = require("mongoose");
var BlacklistedIP = mongoose.model("BlacklistedIP");
var Network = mongoose.model("Network");

var ipBlacklistController = function() {

  this.exportBlacklist = function(req, res) {
    if (req.session.role != "admin")
      return res.status(401).json({ "message": "API access unauthorized" });
    
    BlacklistedIP.find({}, (err, docs) => {
      var data = "IP,Description,Network,Location" + "\n";

      res.setHeader("Content-disposition", "attachment; filename=ipblacklist.csv");
      
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

  this.importBlacklist = function(req, res) {
    if (req.session.role !== "admin")
      return res.status(401).json({ "message": "API access unauthorized" });
    
    var form = new multiparty.Form();
    var data = "";

    form.on("close", () => {
      var records = data.split("\n");
      
      records.forEach(record => {
        var fields = record.split(",");
        fields[0] = fields[0].trim();

        if(fields[0] && /^[0-9\:\.]*$/.test(fields[0])) {

          BlacklistedIP.findOne({ 
            "ip": fields[0]
          }, (err, doc) => {
            if(!err && doc) return;

            BlacklistedIP.create({
              "ip": fields[0],
              "description": helpers.removeQuotes(fields[1]),
              "network": helpers.removeQuotes(fields[2]),
              "location": helpers.removeQuotes(fields[3])
            });
          });
        }
      });

      res.status(200).json({ message: "Done" });
    });

    form.on("part", (part) => {
      if (part.name !== "file")
        return part.resume();

      part.on("data", buf => data += buf.toString());
    });

    form.parse(req);
  };

  this.getIPBlacklist = function(req, res) {
    var { page, pagesize, sort, keyword } = req.body;

    var params = { 
      page: parseInt(page), 
      limit: parseInt(pagesize)
    };

    if (sort)
      params.sort = sort;
    
    var query = helpers.formSearchQuery(keyword, "ip");
    query = helpers.formSearchQuery(keyword, "description", query);
    query = helpers.formSearchQuery(keyword, "network", query);
    query = helpers.formSearchQuery(keyword, "location", query);

    BlacklistedIP.paginate(query, params, (err, result) => {
      res.json({
        "ips":    result ? result.docs : [],
        "total":  result ? result.total : 0,
        "limit":  result ? result.limit : pagesize,
        "page":   result ? result.page : 1,
        "pages":  result ? result.pages : 0
      });
    });
  };

  this.getIPBlacklistSingle = function(req, res) {
    var id = req.params.id;

    Network.find((err, nets) => {
      if (err || !nets) nets = [];
      
      BlacklistedIP.findById(id, (err, doc) => {
        if(err) {
          console.error(err);
          return res.json({ id: false });
        }

        res.json({
          blacklisted: doc,
          networks: nets
        });

      });
    });
  };

  function updateExistingBlacklistedIP(res, id, editingIP) {
    BlacklistedIP.findOne({ 
      "ip": editingIP.ip,
      "_id": { 
        "$ne": id 
      }
    }, (err, doc) => {
      if (err) {
        console.error(err);
        return res.json({ 
          id: false,
          result: false
        });
      }

      if (doc) {
        return res.json({
          id: false,
          result: false,
          duplicated: true
        });
      }

      BlacklistedIP.findByIdAndUpdate(id, editingIP, (err, doc) => {
        if (err) {
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

  function addIPtoBlacklist(res, editingIP) {
    var ips = editingIP.ip.split(",");
    var dup = false;
    var result = false;
    var doneCount = 0;

    for (let ip of ips) {

      BlacklistedIP.findOne({
        "ip": ip.trim()
      }, (err, doc) => {
        if(!err && doc) {
          dup = true;

          if (++doneCount >= ips.length)
            res.json({ result: result, duplicated: dup });
          
          return;
        }
        editingIP.ip = ip;

        BlacklistedIP.create(editingIP, err => {
          if(err)
            console.error(err);
          else
            result = true;

          if (++doneCount >= ips.length)
            res.json({ result: result, duplicated: dup });
        });
      });

    }
  }

  this.editBlacklistIP = function(req, res) {
    var editingIP = {
      ip: req.body.ip,  // req.body.ip can be multiple ips separated by comma when adding to list
      description: req.body.description,
      network: req.body.network,
      location: req.body.location
    };

    if (req.body._id) {
      if(req.session.role == "admin")
        updateExistingBlacklistedIP(res, req.body._id, editingIP);
      else
        res.status(401).json({ "message": "API access unauthorized" });
    } else {
      addIPtoBlacklist(res, editingIP);
    }
  };

  this.deleteBlacklistIP = function(req, res) {
    if (req.session.role != "admin")
      return res.status(401).json({ "message": "API access unauthorized" });

    if (req.body._id) {
      BlacklistedIP.findByIdAndRemove(req.body._id, err => {
        if(err) {
          console.error(err);
          return res.json({
            "result": false
          });
        }

        res.json({
          "result": true
        });
      });
    } else {
      res.json({
        "result": false
      });
    }
  };

};

module.exports = new ipBlacklistController();
