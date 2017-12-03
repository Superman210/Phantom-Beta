const mongoose = require('mongoose');
const moment = require('moment-timezone');

const StringSparseIndexTrim = { 
  'type': String, 'index': true, 'trim': true, 'sparse': true 
};

const StringTrim = { 
  'type': String, 'trim': true
};

let base = {
  'ip': StringSparseIndexTrim,
  'access_time': { 'type': Date, 'index': true, default: Date.now },
  'connection': {
    'aso':       StringSparseIndexTrim,
    'isp':       StringSparseIndexTrim,
    'org':       StringSparseIndexTrim,
    'type':      StringSparseIndexTrim,
    'proxy':     StringSparseIndexTrim,
    'location':  StringSparseIndexTrim,
    'hostnames': StringTrim,
  },
  'https':        Boolean,
  'method':       StringSparseIndexTrim,
  'headers':      {},
  'user_agent':   String,
  'notes':        String,
  'isBot':        Boolean,
  'flag':         StringSparseIndexTrim
}

let link = {
  'link_id':        StringSparseIndexTrim,
  'link_generated': String,
  'owner':          StringSparseIndexTrim,
  'network':        StringSparseIndexTrim,
  'angle':          StringSparseIndexTrim
}

let generalTraffic = Object.assign({}, base, {
  'url':          StringSparseIndexTrim,
  'url_query':    String,
  'referer_host': StringSparseIndexTrim,
  'fp': {}
});

let linkTraffic = Object.assign({}, base, link, {
  'used_real':    Boolean,
  'enabled':      Boolean,
  'filter':       {},
  'referer_host': StringSparseIndexTrim,
});

let offerTraffic = Object.assign({}, base, link, {
  'converted': {
    'type': Boolean,
    'default': false,
    'index': true
  },
  'converted_time': {
    'type': Date,
    'index': true,
    'sparse': true 
  }
});

let GeneralTrafficSchema = new mongoose.Schema(generalTraffic);
let LinkTrafficSchema = new mongoose.Schema(linkTraffic);
let OfferTrafficSchema = new mongoose.Schema(offerTraffic);

LinkTrafficSchema.statics.getHitStats = function(linkIDs, start, end, cb) {

  let startPST = moment.tz(start, 'America/New_York');
  let endPST = moment.tz(end, 'America/New_York');

  return this.aggregate([{
    '$match': {
      'link_id': { '$in': linkIDs },
      'access_time': {
        '$gte': moment.utc(startPST).toDate(),
        '$lte': moment.utc(endPST).toDate()
      }
    }
  },{ 
    '$project': { 
      'linkid': '$link_id',
      'passed': { 
        '$cond': [ { '$and': [ '$used_real', '$enabled' ] }, 1, 0 ] 
      },
      'failed': { 
        '$cond': [ { '$and': [ { '$not': '$used_real' }, '$enabled' ] }, 1, 0 ] 
      },
      'disabled': { 
        '$cond': [ "$enabled", 0, 1 ] 
      },
    }
  }, {
    '$group': {
      '_id': '$linkid',
      'passes': { '$sum': '$passed' },
      'fails': { '$sum': '$failed' },
      'disables': { '$sum': '$disabled' }
    }
  }], cb);
}


//db.createCollection( "email", { storageEngine: {wiredTiger: { configString: 'block_compressor=zlib' }}})
mongoose.model('Traffic-General', GeneralTrafficSchema);
mongoose.model('Traffic-Link',    LinkTrafficSchema);
mongoose.model('Traffic-Offer',   OfferTrafficSchema);

