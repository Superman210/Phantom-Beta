const async = require("async");
const moment = require("moment");
const json2csv = require("json2csv");
const useragent = require("useragent");
const helpers = require("./helpers.js");
const url = require("url");
const escapeStringRegexp = require('escape-string-regexp');

const mongoose = require("mongoose");
const LinkTraffic = mongoose.model("Traffic-Link");
const GeneralTraffic = mongoose.model("Traffic-General");

function parseUserAgent(userAgent) {
  let agent = useragent.parse(userAgent);

  if (userAgent && userAgent.includes('outbrain')) 
    return { 'browser': 'Outbrain Bot' }

  let browser_family = agent.family || "";

  if (browser_family.includes("UIWebView")) 
    browser_family = browser_family.replace("Mobile Safari ", "");

  browser_family = browser_family.replace('Safari UI/WKWebView', 'WKWebView')
  browser_family = browser_family.replace(/(Mobile)|(Internet)/g, "").trim();

  let browser = browser_family;
  let os = agent.os.family;

  if (parseInt(agent.major, 10)) browser += ' ' + agent.major;
  if (parseInt(agent.os.major, 10)) os += ' ' + agent.os.major;
  return { browser, os };
}

function formatTrafficRecordCSV(t) {
  delete t._id;
  t.access_time = moment(t.access_time).format('MM-DD-YYYY h:mm:ss a');
  
  if (!t.enabled) {
    t.result = 'OFF'
  } else if (t.used_real) {
    t.result = 'PASS'
  } else {
    t.result = 'FAIL'
  }

  t.userAgent = parseUserAgent(t.headers['user-agent']);

  return t;
}

function formatTrafficRecord(t) {
  let parsed = url.parse('http://'+t.url);
  let originalUrl = parsed.pathname;

  if (t.url_query)
    originalUrl += '?' + t.url_query;

  let short_location = (t.connection.location || '').trim();
  short_location = short_location.replace(/(, United States|\d)/, "");

  let hostnames = (t.connection.hostnames || '')

  let hostnameRegExs = ['\\d', '\\.{2,}', '-{2,}' , '-\\.', '^\\.']

  hostnameRegExs.map(regEx => {
    hostnames = hostnames.replace(new RegExp(regEx, 'g'), '')
  })

  let extra = Object.assign({
    'url_domain': parsed.hostname.replace('www.', ''),
    'url_path': originalUrl,
    'numHostnames': hostnames ? hostnames.split(',').length : 0,
    short_location,
    hostnames
  }, parseUserAgent(t.headers['user-agent']));

  if (t.link_generated) {
    extra.keywords = helpers.getUTMKeyWords(t.link_generated);
    extra.short_generated = helpers.parseGenerated(t.link_generated);
  }

  let referer = url.parse(t.headers.referer || '').hostname || '';

  extra.domain_referer = referer ? referer.replace("www.", "") : '';

  return Object.assign({}, t._doc, extra || {});
}

function getReferers(req, res) {
  LinkTraffic.distinct("referer_host", (err, hosts) => {
    if (err) console.error(err);
    res.json(hosts || []);
  });
}

function getLinkTrafficRecord(req, res, next) {
  var id = req.params.id;
  LinkTraffic.findById(id, (err, record) => {
    if (err)
      next(err);
    else
      res.json(record);
  });
}

function getGeneralTrafficRecord(req, res, next) {
  var id = req.params.id;
  GeneralTraffic.findById(id, (err, record) => {
    if (err)
      next(err);
    else
      res.json(record);
  });
}

function getBaseQuery(req) {
  var { start, link_ids, from, to, format, ownerFilter } = req.query;
  var base = {};

  if (start && format !== "csv") {
    base.access_time = {
      "$lte": new Date(parseInt(start))
    };
  }

  if (!start && (from || to)) {
    base.access_time = {};

    if (from)
      base.access_time["$gte"] = new Date(parseInt(from));
    
    if (to)
      base.access_time["$lte"] = new Date(parseInt(to));
  }

  if (link_ids) { 
    base.link_id = {
      "$in": link_ids.split(",")
    };
  }

  if (req.session.role !== "admin")
    base.owner = req.session.username;

  if (req.session.role === "admin" && ownerFilter)
    base.owner = ownerFilter;

  if (req.query.country)
    base['connection.location'] = new RegExp(req.query.country);

  return base;
}

function getLinkResult(res, format, err, results) {
  if (err) {
    console.error(err);
    return res.sendStatus(500);
  }

  var traffics = [];

  results.traffics.on("data", t => {
    if (format === "csv")
      traffics.push(formatTrafficRecordCSV(t._doc));
    else
      traffics.push(formatTrafficRecord(t))
  });


  results.traffics.on("end", () => {
    if (format === "csv") {
      res.setHeader("Content-disposition", "attachment; filename=traffic.csv");

      res.write(
        json2csv({
          "data": traffics,
          'flatten': true
        })
      );
      res.end();
    } else {
      res.json({
        "traffics": traffics,
        "total": results.total || 0
      });
    }
  });
}


function getLinkTrafficSearch(req) {
  if (!req.query.referer) return {};

  var regex = new RegExp(`^${req.query.referer}`, "i");

  return {
    "$or": [{
      "referer_host": regex
    },{
      "ip": regex
    },{
      "link_id": regex
    }]
  };
}

const GENERAL_SEARCH_FIELDS = [
  'url', 
  'ip', 
  'connection.aso', 
  'connection.org', 
  'connection.isp',
  'connection.type',
  'connection.hostnames',
  'connection.location',
  'connection.proxy'
]

function searchFieldToRegExp(search) {
  search = search.trim().replace(/\s{2,}/g, ' ');  
  search = escapeStringRegexp(search);
  search = search.split(',').join('|')
  search = search.replace(/( \|)|(\| )/g, '');

  return new RegExp(search, 'i');
}

function getGeneralTrafficSearch(req) {
  let { domain, ip, geo, aso } = req.query;
  let fields = [];
  if (domain) {
    fields.push({
      'url': searchFieldToRegExp(domain)
    })
  }

  if (ip) {
    fields.push({
      'ip': searchFieldToRegExp(ip)
    })
  }

  if (geo) {
    fields.push({
      'connection.location': searchFieldToRegExp(geo)
    })
  }

  if (aso) {
    fields.push({
      'connection.aso': searchFieldToRegExp(aso)
    })
  }

  return fields.length ? {'$and': fields} : {};

  // let search = req.query.search;

  // if (!search) return {};
  
  // // Double whitespace
  // search = search.trim().replace(/\s{2,}/g, ' ');  
  // search = escapeStringRegexp(search);
  // search = search.split(' ').join('|')

  // let regex = new RegExp(`${search}`, "i");
  // let $or = [];

  // for (let f of GENERAL_SEARCH_FIELDS) 
  //   $or.push({ [f]: regex })

  // return { $or };
}

function getLinkTraffics(req, res) {
  getTraffics(req, res, LinkTraffic, getLinkTrafficSearch)
}

function getGeneralTraffics(req, res) {
  getTraffics(req, res, GeneralTraffic, getGeneralTrafficSearch)
}

function getTraffics(req, res, model, searchFunc) {
  var { limit, format } = req.query;
  limit = limit ? parseInt(limit) : 10;

  if (format === "csv")
    limit = 60000;

  var query = {};
  let base = getBaseQuery(req);
  let search = searchFunc(req);
  let hasBase = Object.keys(base).length;
  let hasSearch = Object.keys(search).length;

  if (hasBase && hasSearch)
    query = { "$and": [base, search]};
  
  else if (hasBase)
    query = base;

  else if (hasSearch)
    query = search;

  // console.log('query', query);

  async.parallel({

    "total": cb => {
      model.count(query, cb);
    },
    
    "traffics": cb => {
      let cursor = model
        .find(query)
        .sort("-access_time")
        .batchSize(Math.min(20000, limit))
        .limit(limit)
        .cursor();
      
      cb(null, cursor);
    }

  }, (err, results) => {
    getLinkResult(res, format, err, results)
  });
}

module.exports = {
  getLinkTraffics,
  getGeneralTraffics,
  getLinkTrafficRecord,
  getGeneralTrafficRecord,
  getReferers
};