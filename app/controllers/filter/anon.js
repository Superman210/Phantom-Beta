const LineByLineReader = require('line-by-line');
const rangeCheck = require('range_check');

const fileName = process.env.HOME + "/geodata/IP2PROXY-IP-PROXYTYPE-COUNTRY.CSV";
const lr = new LineByLineReader(fileName);

const IP_START = 0;
const IP_END = 1;
const PROXY_TYPE = 2;
const COUNTRY_CODE = 3;
//const COUNTRY_NAME = 4;

const ALLOWED_CODES = ['US'];

let dataRead = new Promise((resolve) => {
  lr.on('end', resolve);
});

lr.on('error', err => {
  console.error(err);
  process.exit(1);
});

let data = [];

lr.on('line', line => {
  let entry = line.split(',');

  for (let i = 0; i < entry.length; i++)
    entry[i] = entry[i].replace(/"/g, '')

  if (ALLOWED_CODES.includes(entry[COUNTRY_CODE]))
    data.push(entry);
});

function findEntry(ipNumber) {
  if (!data.length) return null;

  for (let i = 0; i < data.length && ipNumber > data[i][IP_START]; i++) {
    if (ipNumber >= data[i][IP_START] && ipNumber <= data[i][IP_END])
      return data[i];
  }

  return null;
}

function iPToNumber(ip) {
  let parts = ip.split('.');

  return parseInt(parts[0], 10) * 16777216 + 
         parseInt(parts[1], 10) * 65536 +
         parseInt(parts[2], 10) * 256 + 
         parseInt(parts[3], 10)
}

function lookup(ip) {
  return new Promise((resolve) => {
    dataRead.then(() => {
      // Only IPv4 support for anon
      if (!rangeCheck.isV4(ip)) resolve(undefined);
      
      let ipNumber = iPToNumber(ip);
      let entry = findEntry(ipNumber);

      resolve(entry ? entry[PROXY_TYPE] : undefined);
    })
  });
}

exports.lookup = lookup;