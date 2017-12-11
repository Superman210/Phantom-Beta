const url = require("url");
const request = require('request');
const httpProxy = require('http-proxy');
const http = require('http');

const helpers = require("./helpers");

const fingerprint = require("../fingerprint");

const config = require("../../../config/config");

const routingProxy = httpProxy.createProxyServer({});
const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 120 });

function _proxy(req, res, target, host) {
  routingProxy.web(req, res, {
    'target': target,
    'ignorePath': true,
    'agent': keepAliveAgent,
    'headers': {
      'Host': host
    }
  }, (err, req) => {
    if (err.code === 'ECONNRESET') return;
    console.error(err);
    console.error('target:', target);
    console.error(req.hostname + req.url);
    res.sendStatus(404);
  });
}

// func(html)
function proxyModifyResponse(res, func) {
  let _write = res.write;
  let _end = res.end;

  let respData = '';
  res.write = data => { respData += data; };
  res.end = () => {
    let result = func(respData) || respData;

    _write.call(res, result)
    _end.call(res)
  };
}


function proxy(req, res, host, path, trafficID) {
  let target = `http://${config.serverHostname}:${config.httpPort}${path}`;

  if (helpers.isHTMLPage(req) && trafficID) {
    proxyModifyResponse(res, respData => {
      let contents = fingerprint.getFingerPrintFile(trafficID);

      if (req.protocol === 'https')
        respData = respData.replace(/http[^s]?:/g, `https:`)

      return respData.replace('</body>', `<script type="text/javascript">${contents}</script></body>`);
    });
  }
  _proxy(req, res, target, host);

}

function proxyPresale(req, res, host, urlPath, voluum, trafficID) {
  let target = `http://${config.serverHostname}:${config.httpPort}${urlPath}`;
  let currentURL = `${req.protocol}://${req.hostname}${req.originalUrl}`
  let offerPath = url.resolve(`${req.protocol}://${req.hostname}${req.path}`, 'offer')

  proxyModifyResponse(res, respData => {
    let contents = fingerprint.getFingerPrintFile(trafficID);

    return respData
      .replace('<head>', `<head><base href="https://${host}${urlPath}">`)
      .replace(/href="offer/g, `href="${offerPath}`)
      .replace(/href='offer/g, `href='${offerPath}`)
      .replace(/href="#/g, `href="${currentURL}`)
      .replace(/href='#/g, `href='${currentURL}`)
      .replace(/\.php/g, `.php?voluum=${voluum}`)
      .replace('</body>', `<script type="text/javascript">${contents}</script></body>`)
  })

  _proxy(req, res, target, host);
}

function proxyPresalePage(req, res, ip, link, trafficID) {
  let u = url.parse(link.link_voluum);
  let search = u.search;

  if (search)
    search += '&IP=' + ip;
  else
    search = '?IP=' + ip;

  let url_voluum = u.protocol + '//' + u.hostname + u.pathname + search;

  request.get({
    'url': url_voluum,
    'followRedirect': false,
    'headers': {
      'User-Agent': req.get('user-agent')
    }
  }, (err, response) => {
    if (err || !response || response.statusCode !== 302) {
      console.error(
        err || "Error voluum pre-sale redirect", 
        response ? response.statusCode : 'no resp', 
        JSON.stringify({ 
          'headers': response ? response.headers : {},
          'url': url_voluum
        })
      );
      return proxySafe(req, res);
    }

    let originalLocation = response.headers.location;
    let cookies = helpers.getSetCookies(response.headers['set-cookie']);
    if (!originalLocation) {
      console.error("Error invalid location " + originalLocation);
      return proxySafe(req, res);
    }

    if (!cookies) {
      console.error('Error setting cookie ' + JSON.stringify({ 'headers': response.headers}));
      return proxySafe(req, res);
    }

    let parsed = url.parse(originalLocation);
    let pathname = parsed.pathname;

    if (parsed.search) pathname += parsed.search;

    proxyPresale(req, res, parsed.hostname, pathname, cookies.join('; '), trafficID);
  });
}

function proxySafe(req, res, trafficID) {
  proxy(req, res, req.hostname, req.originalUrl, trafficID)
}

module.exports = {
  proxySafe,
  proxyPresalePage
}