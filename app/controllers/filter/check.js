const mongoose = require("mongoose");
const async = require("async");

const helpers = require("./helpers");
const conn = require("./connection");

let Blacklist    = mongoose.model("BlacklistedIP");
let Whitelist    = mongoose.model("WhitelistedIP");
let GeoBlacklist = mongoose.model("GeoBlacklist");

module.exports.checkFilter = (req, link, ip, connection, isOfferPage, usePage, cb) => {
  let isBannedReferrer = conn.isBannedReferer(req);
  let isBannedCache    = conn.isBannedCache(req);
  let isBannedISP      = conn.isBannedISP(connection);
  let isBannedHost     = conn.isBannedHost(connection);
  let isProxy          = conn.isProxy(connection);
  let passesLinkGeo    = helpers.checkLinkGeoCriteria(link, connection);

  let trafficRecord = { req, ip, link, connection }

  if (usePage) {
    trafficRecord.filter = { usePage };
    return cb(usePage === 'dirty', trafficRecord);
  }

  // Link disabled
  if (!link.status && !isOfferPage)
    return cb(false, trafficRecord)
  
  if (!isOfferPage && link.network === 'Outbrain') {
    let referer = req.get("referer");
    
    if (!referer || !referer.toLowerCase().includes('paid.outbrain.com')) 
      return cb(false, trafficRecord);
  }

  if (isBannedReferrer || isBannedISP || isProxy || isBannedHost || isBannedCache) {
    trafficRecord.filter = { isBannedReferrer, isBannedISP, isProxy, isBannedHost, isBannedCache };
    return cb(false, trafficRecord);
  }

  // No geodata
  if (!connection.location)
    return cb(false, trafficRecord);

  // Fails link geo restriction
  if (!passesLinkGeo) {
    trafficRecord.filter = { passesLinkGeo };
    return cb(false, trafficRecord);
  }

  // Blacklist first X
  if (link.auto_blacklist.length < link.auto_blacklist_count) {
    let alreadyAutoBL = link.auto_blacklist.includes(ip);

    if (alreadyAutoBL)
      trafficRecord.filter = { 'inBlacklist': true }
    else
      trafficRecord.filter = { 'autoblacklisted': true }

    if (!alreadyAutoBL) 
      Blacklist.autoblacklist(req, ip, link, connection);

    return cb(false, trafficRecord);
  }

  async.parallel({
    "isWhiteListed": done => {
      Whitelist.findOne({ ip }, (err, doc) => done(err, !!doc));
    },
    "inBlacklist": done => {
      if (!link.use_ip_blacklist)
        Blacklist.findOne({ ip }, 'ip', done);
      else
        done(null, false);
    },
    "inGeoBlacklist": done => {
      GeoBlacklist.find().exec((err, geoBlackList) => {
        if (!err)
          done(null, helpers.inGeoBlacklist(geoBlackList, connection))
        else 
          done(err);
      });
    }
  }, (err, r) => {
    if (err) {
      console.error("Error filtering", err);
      return cb(false, trafficRecord);
    }

    let passes = r.isWhiteListed || (!r.inBlacklist && !r.inGeoBlacklist);
    trafficRecord.filter = r;

    cb(passes, trafficRecord);
  });
}