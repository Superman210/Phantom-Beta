const url = require('url');
const _ = require('lodash');
const rangeCheck = require('range_check');
const useragent = require('useragent');

const logger = require('../../log');
const config = require('../../../config/config');

function isPrivateIP(ip) {
  if (ip === '127.0.0.1') return true;

  var parts = ip.split('.');
  return parts[0] === '10' ||
    (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
    (parts[0] === '192' && parts[1] === '168');
}

function getClientIP(req) {
  // Debug
  // if (config.env === 'local') return '67.161.190.79';
  // if (config.env === 'local') return '2601:642:4001:3370:2af0:76ff:fe33:f806';
if (config.env === 'local') return '185.162.124.2';
//   if (config.env === 'local') return '178.162.217.117';
  let checks = [
    req.headers['x-client-ip'],
    req.headers['cf-connecting-ip'],
    req.headers['x-forwarded-for'],
    req.headers['x-real-ip'],
    req.headers['x-cluster-client-ip'],
    req.headers['x-forwarded'],
    req.headers['forwarded-for'],
    req.headers['forwarded'],
    req.connection ? req.connection.remoteAddress : null,
    req.socket ? req.socket.remoteAddress : null,
    (req.connection && req.connection.socket) ? req.connection.socket.remoteAddress : null,
    req.info ? req.info.remoteAddress : null
  ];

  for (let check of checks) {
    if (!check) continue;

    let ip = check.split(',')[0]
                  .replace('::ffff:', '')
                  .replace('for=', '')
                  .trim();

    if (rangeCheck.isIP(ip) && !isPrivateIP(ip))
      return ip.indexOf('::ffff:') >= 0 ? ip.substr(7) : ip;
  }

  return null;
}

function getUserAgent(req) {
  let userAgentHeader = req.get('user-agent');

  if (!userAgentHeader) return undefined;

  let ua = useragent.lookup(userAgentHeader);
  let uaString = ua.family + ' ' + 
                  ua.major + '.' + ua.minor + ' / ' + 
                  ua.os.family + ' ' + 
                  ua.os.major + '.' + ua.os.minor;

  let device = ua.device.family; 
  if (device !== 'Other')
    uaString += ` / ${device}`;

  return uaString
}

function checkGeoCriterion(criterion, geo) {
  if (criterion.city) {
    if (!geo.city || criterion.city.toLowerCase() !== geo.city.toLowerCase())
      return false;
  }

  if (criterion.region) {
    if (!geo.region || criterion.region.toLowerCase() !== geo.region.toLowerCase())
      return false;
  }

  if (criterion.country) {
    if (!geo.country || criterion.country.toLowerCase() !== geo.country.toLowerCase())
      return false;
  }

  return true;
}

function checkLinkGeoCriteria(link, geo) {

  for (let criterion of link.criteria) {
    if (!checkGeoCriterion(criterion, geo))
      return false;
  }

  for (let criterion of link.criteria_disallow) {
    if (checkGeoCriterion(criterion, geo))
      return false;
  }

  return true;
}

function inGeoBlacklist(geoBlackList, geo) {
  for (let entry of geoBlackList) {
    if (checkGeoCriterion(entry, geo))
      return true
  }

  return false
}

function cleanHostname(hostname) {
  return hostname.startsWith('www.') ?
          hostname.substring(4) :
          hostname;
}

function getHostname(url_path) {
  let host = url.parse(url_path || '').hostname;

  return host ? cleanHostname(host) : undefined;
}

function getDirectoryPath(path) {
  let idxFirst = path.indexOf('/');
  let idxLast = path.lastIndexOf('/');

  if (idxFirst >= 0 && idxLast > 0 && idxFirst !== idxLast)
    return path.substring(idxFirst, idxLast)

  return '';
}

function noHost(req, res, ip) {
  logger.noHost.log('info', 'No host', {
    'path': req.originalUrl,
    ip
  })

  res.sendStatus(404);
}

function isOfferPage(req) {
  return /offer\d{0,1}\.php/.test(req.path)
}

const EXT_HTML = ['php', 'html', 'htm'];
const EXT_ASSETS = ['ico', 'map', 'css', 'js', 'jpg', 'jpeg', 'png', 'webm', 'gif', 'svg', 'ttf', 'woff', 'woff2', 'eot', 'json', 'txt']

function isHTMLPage(req) {
  let path = req.path;
  let accept = req.get('Accept') || '';

  for (let ext of EXT_ASSETS) {
    if (path.endsWith('.' + ext))
      return false;
  }

  for (let ext of EXT_HTML) {
    if (path.endsWith('.' + ext))
      return true;
  }

  if (accept.includes('text/html'))
    return true;

  return !path.includes('.');
}

function isICORequest(req) {
  return req.path.endsWith('.ico');
}

function getSetCookies(header) {
  let cookies = [];

  for (let c of header) {
    let idx = c.indexOf('; Domain');

    if (idx === -1)
      idx = c.indexOf('; domain');

    if (idx === -1)
      idx = c.indexOf(';domain');

    if (idx === -1)
      idx = c.indexOf(';Domain');

    if (idx === -1)
      return null;

    cookies.push(c.substring(0, idx))
  }

  return cookies;
}

module.exports = {
  getClientIP,
  getUserAgent,
  checkGeoCriterion,
  checkLinkGeoCriteria,
  inGeoBlacklist,
  getHostname,
  cleanHostname,
  getDirectoryPath,
  noHost,
  isHTMLPage,
  isOfferPage,
  getSetCookies,
  isICORequest
}
