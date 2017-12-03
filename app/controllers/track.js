let helpers = require('./filter/helpers');
let connection = require('./filter/connection');

function getScript(id) {
  return `
    window._mfq=window._mfq||[];(function(){var a=document.createElement("script");a.type="text/javascript";a.async=!0;a.src="//cdn.mouseflow.com/projects/${id}.js";document.getElementsByTagName("head")[0].appendChild(a)})();
  `.trim()
}

module.exports.trackIsrael = (req, res) => {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  res.header('content-type', 'application/javascript')
  
  if (!req.params.id) 
    return res.sendStatus(400);

  let ip = helpers.getClientIP(req);

  if (!ip) return res.send("");

  let geo = connection.geoLookup(ip);

  if (geo) {
    if (geo.country === 'IL' || geo.country === 'PK' || (geo.city && geo.city.toLowerCase() === 'providence' && geo.region === 'RI') )
      return res.send(getScript(req.params.id));
  }

  res.send("");
}

module.exports.trackAll = (req, res) => {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  res.header('content-type', 'application/javascript')

  if (req.params.id)
    res.send(getScript(req.params.id));
  else
    res.sendStatus(400);
}