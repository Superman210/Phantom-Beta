const fs = require('fs');
const mongoose = require('mongoose');

const { getClientIP } = require("./filter/helpers");
const { getConnectionInfo } = require("./filter/connection");
const TrafficGeneral = mongoose.model('Traffic-General');

const FP_FILE = __dirname + '/../files/fingerprint.js';
let fpFileContent = fs.readFileSync(FP_FILE).toString();

function getFingerPrint(q) {
  if (!q) return {};

  q = decodeURIComponent(q);

  let fingerprint = {};
  let pairs = q.split('&&');

  for (let pair of pairs) {
    let kv = pair.split('==');
    fingerprint[kv[0]] = kv[1];
  }

  return fingerprint;
}

async function _recordFingerPrint(req, res) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  
  let ip = getClientIP(req);
  let fingerprint = getFingerPrint(req.query.q);
  let trafficID = fingerprint.tid;

  if (!req.query.q || !trafficID) {
    console.error('No TID?', 
      JSON.stringify(fingerprint), 
      ip, 
      await getConnectionInfo(ip)
    );

    return res.sendStatus(404);
  }

  fingerprint.ip = ip;

  TrafficGeneral.updateOne({
    '_id': mongoose.mongo.ObjectId(trafficID)
  }, {
    'fp': fingerprint
  }, err => {
    if (err) console.error(err);
  });

  res.sendFile('slick.min.js', {
    'root': __dirname + '/../files',
    'lastModified': false,
    'cacheControl': false,
    'headers': {
      'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
    }
  })
}

module.exports.getFingerPrintFile = function(trafficID) {
  return fpFileContent.replace('{{TID}}', trafficID);
}

module.exports.recordFingerPrint = function(req, res) {
  try {
    _recordFingerPrint(req, res);
  } catch (e) {
    console.error(e);
  }
}