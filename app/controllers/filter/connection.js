const maxmind = require("maxmind");
const dns = require("dns");
const _ = require('lodash');

const config = require("../../../config/config");
const anon = require("./anon");

const { banned_referers, banned_isps, banned_hosts } = require('./data.js')

const lookup = {
  "city": maxmind.openSync(process.env.HOME + "/geodata/GeoIP2-City-North-America.mmdb"),
  "isp": maxmind.openSync(process.env.HOME + "/geodata/GeoIP2-ISP.mmdb"),
  "con": maxmind.openSync(process.env.HOME + "/geodata/GeoIP2-Connection-Type.mmdb"),
};

function isBannedReferer(req) {
  //Allow localhost referer on local machine :)
  if (config.env === 'local') return false;
  
  let referer = req.get("referer");

  if (referer) {
    let ref = referer.toLowerCase();

    for (let ban_ref of banned_referers) {
      if (ref.includes(ban_ref.toLowerCase()))
        return true;
    }
  }

  return false;
}

function isBannedCache(req) {
  let cacheControl = req.get("cache-control");

  return cacheControl && cacheControl.includes('no-cache');
}

function isBannedISP(connection) {
  if (!connection.isp && !connection.aso) 
    return false;

  var isp = (connection.aso || connection.isp).toLowerCase();

  for (let banned_isp of banned_isps) {
    if (isp.includes(banned_isp.toLowerCase()))
      return true;
  }

  return false;
}

function isBannedHost(connection) {
  if (!connection || !connection.hostnames) 
    return false;

  for (let banned_host of banned_hosts) {
    if (connection.hostnames.includes(banned_host.toLowerCase()))
      return true;
  }

  return false;
}

function isProxy(connection) {
  return connection.proxy;
}

function getIPHostnames(ip) {
  return new Promise(resolve => {
    dns.reverse(ip, (err, hosts) => {
      resolve(hosts || [])
    })
  })
}

function lookupISP(ip) {
  let isp = lookup.isp.get(ip);

  if (!isp) return null;

  let data = {};

  if (isp.autonomous_system_organization)
    data.aso = isp.autonomous_system_organization;

  if (isp.isp)
    data.isp = isp.isp;

  if (isp.organization)
    data.org = isp.organization;

  return data;
}

function getConnectionType(ip) {
  let type = lookup.con.get(ip);

  return type ? type.connection_type : undefined;
}

async function getConnectionInfo(ip) {
  let connection = {};

  Object.assign(
    connection, 
    geoLookup(ip), 
    lookupISP(ip), 
    {
      'type': getConnectionType(ip), 
      'proxy': await anon.lookup(ip)
    }
  );

  try {
    let hostnames = await getIPHostnames(ip);

    if (hostnames.length)
      connection.hostnames = hostnames.join(',');

  } catch (e) {
    console.error(e)
  }

  return connection;
}

function isValid(req, connection) {
  return !isBannedReferer(req) &&
          !isBannedISP(connection) &&
          !isProxy(connection) &&
          !isBannedHost(connection);
}

function geoLookup(ip) {
  let raw = lookup.city.get(ip);

  if (!raw) return null;

  let city     = _.get(raw, 'city.names.en');
  let region   = _.get(raw, 'subdivisions[0].iso_code');
  let country  = _.get(raw, 'country.iso_code');
  let zip      = _.get(raw, 'postal.code');
  let countryName = _.get(raw, 'country.names.en');

  let location = [city, region, countryName].filter(Boolean).join(', ');
  
  if (zip) location += ` ${zip}`

  return {
    city, region, country, zip, location
  };
}

module.exports = {
  isBannedReferer,
  isBannedISP,
  isBannedHost,
  isBannedCache,
  isProxy,
  isValid,
  geoLookup,
  getConnectionInfo,
}