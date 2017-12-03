const mongoose = require('mongoose');
const moment = require('moment');
const async = require('async');
const _ = require('lodash');

let TrafficGeneral = mongoose.model('Traffic-General');
let TrafficLink    = mongoose.model('Traffic-Link');
let TrafficOffer   = mongoose.model('Traffic-Offer');
let Link = mongoose.model('Link');

/*
  Traffic Analyzer:
    All Traffic
      rows groups:
        aso, isp, org, type, location, user_agent

      columns:
        - link hits, non-link hits, total hits, 
          - link hit %, presale landing %
        - presale page hits, filter fail, pass %
        - offer page clicks, non-clicks, click %
        - sales, missed sales, sale %
        - revenue, expenditure, net income
          - per person

    Link Traffic
      row groups:
        aso, isp, org, type, location, user_agent
         network, angle, owner, link_generated
        
         Profile + Profit / Person
         Revenue + Revenue / Person
         Sales + Sales / Person,
         Expenditure + Expenditure / Person,
         Conversions + Conversion %, 
         Offer Hits + Offer %, 
         Landing Hits + Filter Pass %,
         Total Hits

    Date Range
        "presaleHits": 24,
    "expenditureEnabled": 0,
    "expenditureDisabled": 0,
    "linkHitsEnabled": 24,
    "linkHitsDisabled": 24,
    "offerPageHits": 2,
    "conversions": 2,
    "revenue": 0,
    "linkHits": 48,
    "expenditure": 0,
    "profit": 0,
    "profitPerPerson": 0,
    "revenuePerPerson": 0,
    "expenditurePerPerson": 0,
    "profitEnabled": 0,
    "profitPerPersonEnabled": 0,
    "expenditurePerPersonEnabled": 0,
    "conversionPercent": 1,
    "offerClickPercent": 0.08333333333333333,
    "filterPassPercent": 1
*/

async function groupOffer(match, group, cb) {
  return await TrafficOffer.aggregate([
    match,
    { 
      '$project': { 
        [group]: '$'+group,
        'convertedLinkID': { '$cond' : [ "$converted", '$link_id', null ] }
      }
    },
    {
      '$group': { 
        '_id': '$'+group, 
        'offerPageHits': { '$sum': 1 },
        'convertedLinkIDs': { '$push': "$convertedLinkID" }
      } 
    },
    { $sort: { [group]: -1 } }
  ], cb);
}

async function groupLinks(match, group, cb) {
  TrafficLink.aggregate([
    match,
    { 
      '$project': { 
        '_id': '$link_id',
        'presaleHit': { '$cond' : [ "$used_real", 1, 0 ] },
        'enabledLinkID': { '$cond' : [ "$enabled", '$link_id', null ] },
        'disabledLinkID': { '$cond' : [ "$enabled", null, '$link_id' ] }
      }
    },
    { 
      '$group': { 
        '_id': '$'+group,
        'enabledLinkIDs': { '$push': "$enabledLinkID" },
        'disabledLinkIDs': { '$push': "$disabledLinkID" },
        'presaleHits': { '$sum': '$presaleHit' }
      } 
    },
    { $sort: { [group]: -1 } }
  ], cb);
}

function divide(a, b) {
  return (a && b) ? Math.round((a/b) * 10000) / 100 : 0
}

/*
Profit, Profit / Person
Revenue, Revenue / Person
Expenditure, Expenditure / Person,
Conversions + Conversion %, 
Offer Hits + Offer Click %, 
Presale Hits + Filter Pass %,
Link Hits
*/
function computeFields(traffic) {
  traffic.map(t => {
    t.linkHits = t.linkHitsEnabled + t.linkHitsDisabled;
    t.expenditure = t.expenditureEnabled + t.expenditureDisabled;

    t.profit = t.revenue - t.expenditure;
    t.profitEnabled = t.profit - t.expenditureEnabled;

    t.profitPerPerson = divide(t.profit, t.linkHits)
    t.revenuePerPerson = divide(t.revenue, t.linkHits)
    t.expenditurePerPerson = divide(t.expenditure, t.linkHits)

    t.profitPerPersonEnabled = divide(t.profit, t.linkHitsEnabled)
    t.revenuePerPersonEnabled = divide(t.revenue, t.linkHitsEnabled)
    t.expenditurePerPersonEnabled = divide(t.expenditure, t.linkHitsEnabled)
    t.filterPassPercent = divide(t.presaleHits, t.linkHitsEnabled)
    
    t.conversionPercent = divide(t.conversions, t.offerPageHits)

    t.offerClickPercent = divide(t.offerPageHits, t.presaleHits)
  });

  return traffic;
}

function combineTraffic(links, linkTraffic, offerTraffic) {
  let linkMap = {};

  for (let l of links)
    linkMap[l._id] = _.pick(l, '_id', 'cpc', 'payout');

  let group = {};
  let traffic = [];

  for (let l of linkTraffic) {
    let expenditureEnabled = l.enabledLinkIDs
      .reduce((acc, val) => {
        return acc + (linkMap[val] ? linkMap[val].cpc : 0)
      }, 0);

    let expenditureDisabled = l.disabledLinkIDs
      .reduce((acc, val) => {
        return acc + (linkMap[val] ? linkMap[val].cpc : 0)
      }, 0);
      
    group[l._id] = {
      'id': l._id,
      'presaleHits': l.presaleHits,
      expenditureEnabled,
      expenditureDisabled,
      'linkHitsEnabled': l.enabledLinkIDs.length,
      'linkHitsDisabled': l.disabledLinkIDs.length,
    };
  }

  for (let l of offerTraffic) {
    group[l._id].offerPageHits = l.offerPageHits;
    group[l._id].conversions = l.convertedLinkIDs.length
    group[l._id].revenue = l.convertedLinkIDs.reduce((acc, val) => {
      return acc + (linkMap[val] ? linkMap[val].payout : 0)
    }, 0);
  }

  for (let k of Object.keys(group))
    traffic.push(group[k])

  return traffic;
}

function getLinkTrafficTrends(req, res) {
  let group = req.query.group || 'connection.aso';

  let match = { '$match': {} };// Date Range

  

  async.parallel({
    'groupLinks': cb => groupLinks(match, group, cb),
    'groupOffer': cb => groupOffer(match, group, cb),
    'links': cb => Link.find().exec(cb)
  }, (err, results) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }

    let traffic = combineTraffic(results.links, results.groupLinks, results.groupOffer);
    traffic = computeFields(traffic);
    traffic.sort((a, b) => a.profit - b.profit);

    
    res.json(traffic);
  })

}

module.exports = {
  getLinkTrafficTrends
}