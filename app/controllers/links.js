const url = require("url");
const helpers = require("./helpers");
const cron = require('cron');
const moment = require("moment-timezone");
const mongoose = require("mongoose");
const _ = require("lodash");

const Link = mongoose.model("Link");
const LinkTraffic = mongoose.model("Traffic-Link");

new cron.CronJob({
  "cronTime": "0,30 * * * *",
  "start": true,
  "timeZone": "America/Los_Angeles",
  "onTick": enableLinks,
});

new cron.CronJob({
  "cronTime": "0,30 * * * *",
  "start": true,
  "timeZone": "America/Los_Angeles",
  "onTick": disableLinks,
});

function enableLinks() {
  let begin = moment()
  begin.add(5, 'm')
  Link.find({
    "enable_at": {
      "$lt": begin.toDate()
    }
  }).exec((err, links) => {
    if (err) return console.error(err);

    for (let link of links) {
      let enable_at = moment(link.enable_at).add(1, 'd').toDate();
      Link.findByIdAndUpdate(link._id, {
        "status": true,
        enable_at
      }, err => {
        if (err) console.error(err);
      });
    }
  });
}

function disableLinks() {
  let begin = moment();
  begin.add(5, 'm')

  Link.find({
    "disable_at": {
      "$lt": begin.toDate()
    }
  }).exec((err, links) => {
    if (err) return console.error(err);
    for (let link of links) {
      let disable_at = moment(link.disable_at).add(1, 'd').toDate();

      Link.findByIdAndUpdate(link._id, {
        "status": false,
        disable_at
      }, err => {
        if (err) console.error(err);
      });
    }
  });
}
module.exports.getLinks = function(req, res) {
  var { page, pagesize, keyword, sort, ownerFilter, start, end } = req.body;
  var query = {};
  
  var params = { 
    "page": parseInt(page), 
    "limit": parseInt(pagesize),
    "sort": sort || "-created_time"
  };

  if (keyword) {
    var regex = new RegExp(keyword, "i");
    query["$or"] = [
      { "link_generated": regex },
      { "link_voluum": regex },
      { "tags": regex },
      { "description": regex },
    ];
  }

  if (req.session.role !== "admin")
    query.owner = req.session.username;
  
  if (req.session.role === "admin" && ownerFilter)
    query.owner = ownerFilter;

  if (!start)
    start = moment().startOf('day').format('YYYY-MM-DD')
  
  if (!end)
    end = moment().add(1, 'days').startOf('day').format('YYYY-MM-DD')

  Link.paginate(query, params, (err, result) => {
    var results = [];
    if (!result) result = {};

    for (let d of result.docs) {
      let parsedSafe = url.parse(d.link_safe);

      let link_generated = 'https://' + parsedSafe.hostname + d.link_generated;
      let short_generated = '/'+helpers.parseGenerated(link_generated);
      let ds = parsedSafe.hostname;

      results.push(
        Object.assign({}, d._doc, {
          link_generated,
          short_generated,
          'profit': ((d.conversions * d.payout) - (d.real_hits * d.cpc)).toFixed(2),
          "keywords": helpers.getUTMKeyWords(link_generated),
          "domain_safe": ds ? ds.replace("www.", "") : d.link_safe
        })
      );
    }

    let linkIDs = _.map(results, r => r._id.toString());
    
    LinkTraffic.getHitStats(linkIDs, start, end, (err, stats) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }

      for (let stat of stats) {
        let result = _.find(results, r => r._id.toString() === stat._id);

        stat.totals = stat.disables + stat.passes + stat.fails;
        delete stat._id;

        if (result)
          result.stats = stat;
      }

      res.json({
        "links": results,
        "total": result.total || 0,
        "limit": result.limit || pagesize,
        "page":  result.page || 1,
        "pages": result.pages || 0
      });

    });
  });
}

module.exports.findLink = function(req, res) {
  var { term, owner } = req.query;
  var query = {
    "link_safe": new RegExp(term, "i")
  };

  if (req.session.role !== "admin")
    query.owner = req.session.username;
  
  if (req.session.role === "admin" && owner)
    query.owner = owner;

  var link = Link.find(query).sort("-created_time").limit(10);
  
  link.exec((err, links) => {
    if (err) {
      console.error(err);
      return res.json({ id: false });
    }

    var results = [];

    for (let l of links) {
      results.push({
        "id": l._id,
        "owner": l.owner,
        "text": l.link_safe,
        "desc": l.description
      });
    }

    res.json(results);
  });
};

module.exports.getLink = function(req, res) {
  const id = req.params.id;
  
  Link.findById(id).lean().exec((err, link) => {
    if (err) {
      console.error(err);
      return res.json({ id: false });
    }

    link.auto_blacklist_count = link.auto_blacklist_count ? link.auto_blacklist_count : 0;

    res.json({
      link: link,
      alltags: []
    });
  });
};

module.exports.toggleLink = function(req, res) {
  Link.findById(req.body._id, (err, link) => {
    if (err) {
      console.error(err);
      return res.json({ result: false });
    }

    link.status = !link.status;
    link._id = false;

    Link.findByIdAndUpdate(req.body._id, link, err => {
      if (err) console.error(err);

      res.json({ 
        "result": !err,
        "status": link ? link.status : null
      });
    });
  });
};

module.exports.deleteLinks = function(req, res) {
  var ids = req.body.ids;
  
  Link.remove({
    "_id": {
      "$in": ids
    }
  }, err => {
    if (err) console.error(err);

    res.json({
      "result": !err
    });
  });
};

module.exports.deleteLink = function(req, res) {
  var id = req.body._id;

  if (!id) return res.json({ "result": false });

  Link.findByIdAndRemove(id, err => {
    if (err) console.error(err);
    
    res.json({
      "result": !err
    });
  });
};

module.exports.newOrUpdateLink = function(req, res) {
  var { _id, link_generated, link_voluum, link_safe,
    description, tags, use_ip_blacklist, criteria, criteria_disallow,
    auto_blacklist_count, network, angle, enable_at, disable_at, cpc, payout } = req.body;
  const type = req.body.type ? parseInt(req.body.type, 10) : 1;

  if (!link_voluum || !link_generated || !link_safe)
    return res.sendStatus(400);

  if (link_generated.substr(0, 1) != "/")
    link_generated = "/" + link_generated;

  enable_at = enable_at ? moment.utc(enable_at).toDate() : null;
  disable_at = disable_at ? moment.utc(disable_at).toDate() : null;
  auto_blacklist_count = auto_blacklist_count || 0;

  var updated_link = {
    link_generated,
    link_voluum,
    link_safe,
    description,
    'cpc': cpc || 0,
    'payout': payout || 0,
    tags,
    enable_at,
    disable_at,
    "status": false,
    use_ip_blacklist,
    "criteria": helpers.copyLinkRegions(criteria),
    "criteria_disallow": helpers.copyLinkRegions(criteria_disallow),
    auto_blacklist_count,
    network, 
    angle,
    type
  };
  
  // Duplication check is added
  var dupCriteria = { 
    link_generated
  };

  if (_id)
    dupCriteria._id = { "$ne": _id };
  else
    updated_link.owner = req.session.username;
  
  Link.findOne(dupCriteria, (err, doc) => {
    if (err) { console.error(err); return res.sendStatus(500); }

    if (doc) {
      return res.json({
        id: false,
        duplicated: true
      });
    }

    // Update or create
    if (_id) {

      Link.findByIdAndUpdate(_id, updated_link, (err, link) => {
        if (err) { console.error(err); return res.sendStatus(500); }

        helpers.updateTagsIfRequired(tags);
        res.json(link);
      });

    } else {

      updated_link.created_time = new Date();
      updated_link.total_hits = 0;
      updated_link.real_hits = 0;
      updated_link.offer_hits = 0;
      updated_link.auto_blacklist = [];

      Link.create(updated_link, (err, link) => {
        if (err) { console.error(err); return res.sendStatus(500); }
        
        helpers.updateTagsIfRequired(tags);
        res.json(link);
      });
    }
  });
};
