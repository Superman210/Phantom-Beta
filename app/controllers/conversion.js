const mongoose = require('mongoose');

const helpers = require("./filter/helpers");
const logger = require('../log.js');

let TrafficOffer = mongoose.model('Traffic-Offer');
let Link         = mongoose.model('Link');

function log(req, message, ip) {
  logger.conversion.log('info', message, { 'headers': req.headers, ip});
}

async function trackConversion(req) {
  let ip = helpers.getClientIP(req);
  let user_agent = helpers.getUserAgent(req);

  if (!ip) return log(req, 'No IP', ip)

  let doc = await TrafficOffer.findOneAndUpdate({
    ip, user_agent
  }, {
    '$set': {
      'converted': true,
      'converted_time': new Date()
    }
  }, {
    'sort': {
      'access_time': -1
    }
  });

  if (!doc) return log(req, 'No Record', ip);

  Link.findByIdAndUpdate(doc.link_id, {
    '$inc': { 'conversions': 1 }
  }, logger.logIfError);
}

module.exports = async function(req, res) {
  try {  
    await trackConversion(req);

    res.sendFile('track.png', {
      'root': __dirname + '/../',
      'lastModified': false,
      'cacheControl': false,
      'headers': {
        'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
      }
    }, logger.logIfError);

  } catch (e) {
    console.error(e);
    logger.conversion.log('info', 'Error', { e });
  }
}