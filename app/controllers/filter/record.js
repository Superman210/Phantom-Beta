const mongoose = require('mongoose');
const _ = require('lodash');

const helpers = require('./helpers');
const logger = require('../../log');
const config = require('../../../config/config.js');

let TrafficGeneral = mongoose.model('Traffic-General');
let TrafficLink    = mongoose.model('Traffic-Link');
let TrafficOffer   = mongoose.model('Traffic-Offer');
let Link           = mongoose.model('Link');

function trafficRecordBase(req, ip, connection, time, isBot, flag) {
  let base = {
    ip,
    connection,
    isBot,
    'access_time':  time,
    'method':       req.method,
    'https':        req.secure,
    'referer_host': helpers.getHostname(req.get('referer')),
    'user_agent':   helpers.getUserAgent(req),
    'headers':      req.headers
  };

  if (flag) base.flag = flag;

  return base;
}

function trafficRecordLink(req, ip, connection, link, time, isBot, flag) {
  return Object.assign(
    trafficRecordBase(req, ip, connection, time, isBot, flag),
    _.pick(link, 'link_generated', 'owner', 'network', 'angle'),
    { 
      'link_id': link._id,
      'enabled': link.status
    }
  );
}


function recordLinkTraffic(used_real, info, requestingIP, time, isBot, flag) {
  if (requestingIP === config.serverHostname) return;
  
  let { req, ip, link, connection, filter, notes } = info;
  let record = Object.assign(
    trafficRecordLink(req, ip, connection, link, time, isBot, flag),
    { used_real, filter, notes }
  )

  link.total_hits++;

  if (used_real)
    link.real_hits++;

  if (filter && filter.autoblacklisted)
    link.auto_blacklist.push(ip);

  Link.findByIdAndUpdate(link._id, link, logger.logIfError);

  TrafficLink.create(record, logger.logIfError);
}


function recordGeneralTraffic(req, ip, connection, time, isBot, flag) {
  if (ip === config.serverHostname || helpers.isICORequest(req))
    return;

  let record = trafficRecordBase(req, ip, connection, time, isBot, flag);
  let host = helpers.cleanHostname(req.get('host'));
  
  let query = !helpers.isOfferPage(req) ? 
    req.originalUrl.substring(req.path.length+1) :
    undefined;

  Object.assign(record, {
    'url':        host + req.path,
    'url_query':  query || undefined
  });

  return new Promise((resolve, reject) => {
    TrafficGeneral.create(record, (err, newRecord) => {
      
      if (!err) {
        resolve(newRecord);
      } else {
        console.error(err);
        reject();
      }
    });
  })
}

function recordOfferClick(req, ip, connection, link, time, isBot, flag) {
  if (ip === config.serverHostname) return;

  let record = trafficRecordLink(req, ip, connection, link, time, isBot, flag);

  TrafficOffer.create(record, logger.logIfError)
  
  link.offer_hits++;

  Link.findByIdAndUpdate(link._id, link, logger.logIfError);
}

module.exports = {
  recordLinkTraffic,
  recordGeneralTraffic,
  recordOfferClick
}