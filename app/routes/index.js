const traffics = require("../controllers/traffics");
const links = require("../controllers/links");
const tags = require("../controllers/tags");
const auth = require("../controllers/auth");
const ipBlacklist = require("../controllers/ipblacklist");
const ipWhitelist = require("../controllers/ipwhitelist");
const networks = require("../controllers/networks");
const geoBlacklist = require("../controllers/geoblacklist");
const angles = require("../controllers/angles");
const users = require("../controllers/users");
const filter = require("../controllers/filter");
const fingerprint = require("../controllers/fingerprint");
const conversion = require("../controllers/conversion");
const trends = require("../controllers/trends");
const track = require("../controllers/track");

const connection = require('../controllers/filter/connection');
const helpers = require('../controllers/filter/helpers');

const logger = require("../log");

module.exports = function (app) {
  
  app.get('/api/link-traffics/trends',    auth.ensureHost, auth.loggedIn, trends.getLinkTrafficTrends);

  app.get("/api/traffic/referers",        auth.ensureHost, auth.loggedIn, traffics.getReferers);

  app.get("/api/link-traffics",           auth.ensureHost, auth.loggedIn, traffics.getLinkTraffics);
  app.get("/api/link-traffics/:id",       auth.ensureHost, auth.loggedIn, traffics.getLinkTrafficRecord);
  app.get("/api/general-traffics",        auth.ensureHost, auth.loggedIn, traffics.getGeneralTraffics);
  app.get("/api/general-traffics/:id",    auth.ensureHost, auth.loggedIn, traffics.getGeneralTrafficRecord);

  app.get("/api/users",                   auth.ensureHost, auth.loggedIn, users.getUsers);
  app.get("/api/tags/",                   auth.ensureHost, auth.loggedIn, tags.getTags);

  app.get ("/api/links/page",             auth.ensureHost, auth.loggedIn, links.findLink);
  app.post("/api/links",                  auth.ensureHost, auth.loggedIn, links.getLinks);
  app.get ("/api/links/link/:id",         auth.ensureHost, auth.loggedIn, links.getLink);
  app.post("/api/links/toggle",           auth.ensureHost, auth.loggedIn, links.toggleLink);
  app.post("/api/links/delete",           auth.ensureHost, auth.loggedIn, links.deleteLink);
  app.post("/api/links/delete-many",      auth.ensureHost, auth.loggedIn, links.deleteLinks);
  app.post("/api/links/new",              auth.ensureHost, auth.loggedIn, links.newOrUpdateLink);

  app.get ("/api/ipblacklist/export",     auth.ensureHost, auth.loggedIn, ipBlacklist.exportBlacklist);
  app.post("/api/ipblacklist/import",     auth.ensureHost, auth.loggedIn, ipBlacklist.importBlacklist);
  app.post("/api/ipblacklist/page",       auth.ensureHost, auth.loggedIn, ipBlacklist.getIPBlacklist);
  app.get ("/api/ipblacklist/:id",        auth.ensureHost, auth.loggedIn, ipBlacklist.getIPBlacklistSingle);
  app.post("/api/ipblacklist",            auth.ensureHost, auth.loggedIn, ipBlacklist.editBlacklistIP);
  app.post("/api/ipblacklist/delete",     auth.ensureHost, auth.loggedIn, ipBlacklist.deleteBlacklistIP);

  app.get ("/api/ipwhitelist/export",     auth.ensureHost, auth.loggedIn, ipWhitelist.exportWhitelist);
  app.post("/api/ipwhitelist/import",     auth.ensureHost, auth.loggedIn, ipWhitelist.importWhitelist);
  app.post("/api/ipwhitelist/page",       auth.ensureHost, auth.loggedIn, ipWhitelist.getIPWhitelist);
  app.get ("/api/ipwhitelist/:id",        auth.ensureHost, auth.loggedIn, ipWhitelist.getIPWhitelistSingle);
  app.post("/api/ipwhitelist",            auth.ensureHost, auth.loggedIn, ipWhitelist.editWhitelistIP);
  app.post("/api/ipwhitelist/delete",     auth.ensureHost, auth.loggedIn, ipWhitelist.deleteWhitelistIP);

  app.post("/api/networks/page",          auth.ensureHost, auth.loggedIn, networks.getNetworks);
  app.get ("/api/networks/:id",           auth.ensureHost, auth.loggedIn, networks.getNetwork);
  app.post("/api/networks/delete",        auth.ensureHost, auth.loggedIn, networks.deleteNetwork);
  app.post("/api/networks",               auth.ensureHost, auth.loggedIn, networks.newOrUpdateNetwork);

  app.post("/api/angles/page",            auth.ensureHost, auth.loggedIn, angles.getAngles);
  app.get ("/api/angles/:id",             auth.ensureHost, auth.loggedIn, angles.getAngle);
  app.post("/api/angles/delete",          auth.ensureHost, auth.loggedIn, angles.deleteAngle);
  app.post("/api/angles",                 auth.ensureHost, auth.loggedIn, angles.newOrUpdateAngle);

  app.get ("/api/geoblacklist/export",    auth.ensureHost, auth.loggedIn, geoBlacklist.exportGeoBlacklist);
  app.post("/api/geoblacklist/import",    auth.ensureHost, auth.loggedIn, geoBlacklist.importGeoBlacklist);
  app.post("/api/geoblacklist/page",      auth.ensureHost, auth.loggedIn, geoBlacklist.getGeoBlacklist);
  app.get ("/api/geoblacklist/:id",       auth.ensureHost, auth.loggedIn, geoBlacklist.getGeoBlacklistItem);
  app.post("/api/geoblacklist",           auth.ensureHost, auth.loggedIn, geoBlacklist.editGeoBlacklistItem);
  app.post("/api/geoblacklist/delete",    auth.ensureHost, auth.loggedIn, geoBlacklist.deleteGeoBlacklistItem);

  app.get ("/api/users/page",             auth.ensureHost, auth.loggedIn, users.getUsersByPage);
  app.post("/api/users/delete",           auth.ensureHost, auth.loggedIn, users.deleteUser);
  app.get ("/api/users/:id",              auth.ensureHost, auth.loggedIn, users.getUser);
  app.post("/api/users",                  auth.ensureHost, auth.loggedIn, users.newOrUpdateUser);

  app.post('/admin/action/login',         auth.ensureHost, auth.login);
  app.get('/admin/login',                 auth.ensureHost, auth.loginPage)
  app.get("/admin",                       auth.ensureHost, auth.checkAdminAuth, auth.indexPage);

  app.get('/qXeaWoL2nua7/pixel.png',      conversion);
  
  app.get('/scripts/:id/script.js',     track.trackIsrael);
  app.get('/assets/js/plugins/slider-plugin/:id/slider.js',     track.trackAll);

  app.get('/js/libs/lodash.min.js',     fingerprint.recordFingerPrint);

  app.get('/api/lookup/:ip',              auth.ensureHost, auth.checkAdminAuth, (req, res) => {
    connection.getConnectionInfo(req.params.ip).then(info => {
      res.json(info)
    });
  });

  app.get('/api/lookup',                  auth.ensureHost, auth.checkAdminAuth, (req, res) => {
    let ip = helpers.getClientIP(req);

    connection.getConnectionInfo(ip).then(info => {
      info.ip = ip;
      res.json(info);
    });
  });

  // Contact us
  app.post('/sendmail.php',                (req, res) => res.sendStatus(200))
  app.post('/send.mail.php',               (req, res) => res.sendStatus(200))

  app.get('/robots.txt', (req, res) => {
    res.sendFile('robots.txt', {
      'root': __dirname + '/../files/',
    }, logger.logIfError);
  })

  // filterController must be at the end because it tries to catch every url
  app.all("/*", filter);
};